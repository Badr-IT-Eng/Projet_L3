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

    // Get matching suggestions from Spring Boot backend
    const response = await fetch(`${BACKEND_URL}/matching/suggestions`, {
      headers: {
        'Authorization': `Bearer ${(session as any).accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error(`Backend responded with status: ${response.status}`);
      return NextResponse.json(
        { error: `Failed to fetch matching suggestions: ${response.status}` },
        { status: 500 }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching matching suggestions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch matching suggestions' },
      { status: 500 }
    );
  }
}