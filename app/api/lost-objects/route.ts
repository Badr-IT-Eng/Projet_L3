import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-options"

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8082/api';

// GET /api/lost-objects
export async function GET(request: NextRequest) {
  try {
    // Get session for authentication
    let session = null;
    try {
      session = await getServerSession(authOptions);
    } catch (err) {
      console.warn("Session error:", err);
    }
    // Get search parameters from the request
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('query');
    const category = searchParams.get('category');
    const location = searchParams.get('location');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const status = 'LOST'; // Always filter for lost items
    const page = searchParams.get('page') || '0';
    const size = searchParams.get('size') || '10';
    
    // Build the API URL with query parameters
    let url = `${BACKEND_URL}/items/public/lost?page=${page}&size=${size}`;
    if (query) url += `&query=${encodeURIComponent(query)}`;
    if (category && category !== 'all') url += `&category=${encodeURIComponent(category)}`;
    if (location) url += `&location=${encodeURIComponent(location)}`;
    if (dateFrom) url += `&dateFrom=${encodeURIComponent(dateFrom)}`;
    if (dateTo) url += `&dateTo=${encodeURIComponent(dateTo)}`;

    console.log(`🔗 Fetching from backend URL: ${url}`);
    
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    // Do NOT add Authorization header for public lost items endpoint
    console.log(`📤 Request headers:`, headers);
    
    // Fetch data from Spring Boot backend
    const response = await fetch(url, {
      headers,
      cache: 'no-store',
      credentials: 'omit'
    });
    
    console.log(`📥 Response status: ${response.status}`);

    if (!response.ok) {
      console.error(`API responded with status: ${response.status}`);
      return NextResponse.json(
        { error: `API responded with status: ${response.status}` },
        { status: 500 }
      );
    }

    const data = await response.json();
    console.log('Data received from backend:', data);
    
    // Transform the data to match the frontend format
    const transformedData = {
      objects: data.items.map((item: any) => ({
        id: item.id,
        name: item.name || 'Unnamed Item',
        location: item.location || 'Unknown Location',
        date: item.dateFound || item.reportedAt || new Date().toISOString().split('T')[0],
        time: item.dateFound ? new Date(item.dateFound).toLocaleTimeString() : new Date().toLocaleTimeString(),
        image: (() => {
          if (!item.imageUrl || item.imageUrl === 'test.jpg') {
            return '/placeholder.svg';
          }
          
          // If it's already a full URL, return as is
          if (item.imageUrl.startsWith('http')) {
            return item.imageUrl;
          }
          
          // If it's a relative path starting with /, prepend backend URL
          if (item.imageUrl.startsWith('/')) {
            return `http://localhost:8082${item.imageUrl}`;
          }
          
          // For other cases (like just filenames), treat as API endpoint
          return `http://localhost:8082/api/files/${item.imageUrl}`;
        })(),
        category: item.category?.toLowerCase() || 'other',
        description: item.description || 'No description available',
        status: item.status?.toLowerCase() || 'found',
        coordinates: {
          lat: item.latitude || 43.2965,  // Default to Marseille
          lng: item.longitude || 5.3698,
          x: Math.floor(Math.random() * 500),  // For compatibility
          y: Math.floor(Math.random() * 400)
        }
      })),
      totalItems: data.totalItems,
      totalPages: data.totalPages,
      currentPage: data.currentPage
    };
    
    return NextResponse.json(transformedData);
  } catch (error) {
    console.error('Error fetching lost objects:', error);
    return NextResponse.json(
      { error: 'Failed to fetch lost objects' },
      { status: 500 }
    );
  }
}

// POST /api/lost-objects - Simplified version based on working test
export async function POST(request: Request) {
  try {
    const data = await request.json()
    
    // Simple validation
    if (!data.name || !data.location || !data.category || !data.image || !data.contactInformation) {
      return NextResponse.json({ error: "Missing required fields (name, location, category, image, contact info)" }, { status: 400 })
    }
    
    // Category mapping
    const categoryMapping: { [key: string]: string } = {
      'other': 'MISCELLANEOUS',
      'electronics': 'ELECTRONICS',
      'clothing': 'CLOTHING',
      'accessories': 'ACCESSORIES',
      'documents': 'DOCUMENTS',
      'keys': 'KEYS',
      'bags': 'BAGS',
      'jewelry': 'JEWELRY',
      'toys': 'TOYS',
      'books': 'BOOKS',
      'miscellaneous': 'MISCELLANEOUS'
    }

    // Convert relative image URL to full URL for proper display
    const imageUrl = data.image.startsWith('/') ? `http://localhost:3000${data.image}` : data.image;
    
    // Parse contact information to determine if it's email or phone
    const contactInfo = data.contactInformation.trim();
    const isEmail = contactInfo.includes('@');
    
    // Prepare data with enhanced features including contact information
    const itemData = {
      name: data.name,
      description: data.description || '',
      type: 'LOST',
      category: categoryMapping[data.category.toLowerCase()] || 'MISCELLANEOUS',
      status: 'LOST',
      location: data.location,
      imageUrl: imageUrl,
      dateLost: data.date ? `${data.date}T${data.time || '10:00'}:00` : new Date().toISOString(),
      dateFound: null,
      latitude: data.coordinates?.lat || null,
      longitude: data.coordinates?.lng || null,
      contactEmail: isEmail ? contactInfo : null,
      contactPhone: !isEmail ? contactInfo : null
    }
    
    // Call backend exactly like the working test
    const response = await fetch('http://localhost:8082/api/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(itemData)
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      return NextResponse.json({ error: "Backend error", details: errorText }, { status: 500 })
    }
    
    const result = await response.json()
    return NextResponse.json({ success: true, message: "Item reported successfully", object: result })
    
  } catch (error) {
    return NextResponse.json({ error: "Exception", details: String(error) }, { status: 500 })
  }
}

// OPTIONS handler for CORS preflight
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  })
}
