import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-options"
import { calculateSimilarity } from '@/lib/ai/feature-extraction';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8082';

export async function POST(request: NextRequest) {
  try {
    // Get session for authentication (optional)
    let session = null;
    try {
      session = await getServerSession(authOptions);
    } catch (err) {
      console.warn("Session error:", err);
    }

    const body = await request.json();
    const { features, minScore } = body;
    
    if (!features || !Array.isArray(features)) {
      return NextResponse.json(
        { error: 'Invalid features data' },
        { status: 400 }
      );
    }
    
    // Get all items from backend (use public endpoint for lost items)
    const response = await fetch(`${BACKEND_URL}/api/items/public/lost?size=1000`, {
      headers: {
        'Content-Type': 'application/json',
        ...(session?.user ? { 'Authorization': `Bearer ${(session as any).accessToken}` } : {})
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch items: ${response.status}`);
    }

    const data = await response.json();
    const items = data.items || [];

    // For now, we'll simulate feature matching by comparing with mock features
    // In a real implementation, items would have stored feature vectors
    const results = items.map((item: any) => {
      // Generate mock features for comparison (in production, these would be stored)
      const itemFeatures = Array(features.length).fill(0).map(() => Math.random());
      
      // Calculate similarity between search features and item features
      const similarity = calculateSimilarity(features, itemFeatures);
      
      return {
        id: item.id,
        name: item.name || 'Unnamed Item',
        location: item.location || 'Unknown Location',
        date: item.createdAt ? new Date(item.createdAt).toISOString().split('T')[0] : 'Unknown Date',
        image: item.imageUrl ? (item.imageUrl.startsWith('http') ? item.imageUrl : `${BACKEND_URL}${item.imageUrl}`) : '/placeholder.svg',
        matchScore: similarity,
        category: item.category?.toLowerCase() || 'other',
      };
    })
    .filter((item: any) => item.matchScore >= (minScore * 100 || 70)) // Filter by minimum score
    .sort((a: any, b: any) => b.matchScore - a.matchScore) // Sort by similarity score
    .slice(0, 10); // Return top 10 matches
    
    return NextResponse.json({
      results,
      totalMatches: results.length,
    });
  } catch (error) {
    console.error('Error performing image search:', error);
    return NextResponse.json(
      { error: 'Failed to perform image search' },
      { status: 500 }
    );
  }
}

// Add server config to handle larger payloads (feature vectors)
export const config = {
  api: {
    responseLimit: '8mb',
    bodyParser: {
      sizeLimit: '8mb',
    },
  },
}; 