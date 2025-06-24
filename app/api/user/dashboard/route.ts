import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-options"

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8082/api';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user dashboard data from Spring Boot backend
    const response = await fetch(`${BACKEND_URL}/api/user/dashboard`, {
      headers: {
        'Authorization': `Bearer ${(session as any).accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error(`Backend responded with status: ${response.status}`);
      return NextResponse.json(
        { error: `Failed to fetch dashboard data: ${response.status}` },
        { status: 500 }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching user dashboard:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}