import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from "@/lib/mongodb"
import LostObject from "@/lib/models/LostObject"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8082/api';

// GET /api/lost-objects
export async function GET(request: NextRequest) {
  try {
    // Get search parameters from the request
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('query');
    const category = searchParams.get('category');
    const location = searchParams.get('location');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const page = searchParams.get('page') || '0';
    const size = searchParams.get('size') || '10';
    
    // Build the API URL with query parameters
    let url = `${BACKEND_URL}/items?page=${page}&size=${size}`;
    if (query) url += `&query=${encodeURIComponent(query)}`;
    if (category && category !== 'all') url += `&category=${encodeURIComponent(category)}`;
    if (location) url += `&location=${encodeURIComponent(location)}`;
    if (dateFrom) url += `&dateFrom=${encodeURIComponent(dateFrom)}`;
    if (dateTo) url += `&dateTo=${encodeURIComponent(dateTo)}`;

    console.log(`Fetching from backend URL: ${url}`);
    
    // Fetch data from Spring Boot backend
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store'
    });

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
        image: item.imageUrl || '/placeholder.svg',
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
    await connectToDatabase()
    
    // Get session or use mock user if session is not available
    let session = null
    try {
      session = await getServerSession(authOptions)
    } catch (err) {
      console.warn("Session error:", err)
    }
    
    // Create a mock session for development if needed
    if (!session && process.env.NODE_ENV === 'development') {
      console.warn("Using mock session for development")
      session = {
        user: {
          id: 'mock-user-id',
          email: 'mock@example.com',
          name: 'Mock User'
        }
      }
    }
    
    // Check authentication in production
    if (!session && process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      )
    }
    
    const data = await request.json()

    // Validate required fields
    if (!data.name || !data.location || !data.category || !data.image) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    let newObject
    try {
      // Create new object with user reference
      newObject = await LostObject.create({
        ...data,
        reporter: session?.user?.id || 'anonymous',
        date: data.date || new Date(),
        time: data.time || new Date().toTimeString().split(" ")[0].substring(0, 5),
        status: "found"
      })
    } catch (err) {
      console.warn("Error creating document in database:", err)
      
      // Create a mock response for development
      if (process.env.NODE_ENV === 'development') {
        newObject = {
          _id: `mock-${Date.now()}`,
          ...data,
          reporter: session?.user?.id || 'anonymous',
          date: data.date || new Date(),
          time: data.time || new Date().toTimeString().split(" ")[0].substring(0, 5),
          status: "found",
          createdAt: new Date()
        }
      } else {
        throw err
      }
    }

    return NextResponse.json(
      { message: "Object reported successfully", object: newObject },
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
