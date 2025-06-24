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
        status: item.status?.toLowerCase() || 'found'
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

// POST /api/lost-objects
export async function POST(request: Request) {
  try {
    // Get session or use mock user if session is not available
    let session = null
    try {
      session = await getServerSession(authOptions)
    } catch (err) {
      console.warn("Session error:", err)
    }
    
    const data = await request.json()

    // Validate required fields
    if (!data.name || !data.location || !data.category || !data.image) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Map frontend categories to backend categories
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

    // Prepare data for Spring Boot backend
    const itemData = {
      name: data.name,
      description: data.description || '',
      type: 'LOST', // Items reported through this form are lost items
      category: categoryMapping[data.category.toLowerCase()] || 'MISCELLANEOUS',
      status: 'LOST',
      location: data.location,
      imageUrl: data.image,
      dateLost: data.date ? `${data.date}T${data.time || '10:00'}:00` : new Date().toISOString(),
      latitude: data.coordinates?.lat || null,
      longitude: data.coordinates?.lng || null
    }

    // Send to Spring Boot backend
    const backendResponse = await fetch(`${BACKEND_URL}/items`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(session?.accessToken ? { 'Authorization': `Bearer ${session.accessToken}` } : {})
      },
      body: JSON.stringify(itemData)
    })

    if (!backendResponse.ok) {
      const errorData = await backendResponse.json().catch(() => ({}))
      throw new Error(errorData.message || `Backend responded with status: ${backendResponse.status}`)
    }

    const savedItem = await backendResponse.json()

    return NextResponse.json(
      { message: "Item reported successfully", object: savedItem },
      { status: 201 }
    )
  } catch (error) {
    console.error("Error creating lost object:", error)
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    )
  }
}
