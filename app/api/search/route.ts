import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-options"
import { fuzzySearch, normalizeText, similarityScore } from '@/lib/search/fuzzy-matching'

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8082';
console.log('🔗 Backend URL:', BACKEND_URL);

// Enhanced helper function with fuzzy matching
function calculateTextRelevance(item: any, searchData: any): number {
  let score = 0;
  const maxScore = 100;
  
  // Normalize text for better matching
  const itemName = normalizeText(item.name || '');
  const itemDesc = normalizeText(item.description || '');
  const itemLocation = normalizeText(item.location || '');
  const itemText = `${itemName} ${itemDesc}`;
  
  // Enhanced name matching with fuzzy search (highest weight)
  if (searchData.description && item.name) {
    const query = normalizeText(searchData.description);
    const queryWords = query.split(' ').filter((word: string) => word.length > 2);
    
    let nameScore = 0;
    
    // Exact name match
    if (itemName === query) {
      nameScore = 40;
    }
    // Fuzzy name matching
    else {
      const nameSimilarity = similarityScore(query, itemName);
      nameScore += nameSimilarity * 35;
      
      // Word-level fuzzy matching
      for (const word of queryWords) {
        const wordMatches = fuzzySearch(word, [itemName], { threshold: 0.6 });
        if (wordMatches.length > 0) {
          nameScore += wordMatches[0].score * 5;
        }
      }
    }
    
    score += Math.min(nameScore, 40);
  }
  
  // Enhanced description matching with fuzzy search
  if (searchData.description && item.description) {
    const query = normalizeText(searchData.description);
    const queryWords = query.split(' ').filter((word: string) => word.length > 2);
    
    let descScore = 0;
    
    // Overall description similarity
    const descSimilarity = similarityScore(query, itemDesc);
    descScore += descSimilarity * 20;
    
    // Word-level matching in description
    for (const word of queryWords) {
      if (itemDesc.includes(word)) {
        descScore += 3; // Exact word match
      } else {
        // Fuzzy word matching
        const words = itemDesc.split(' ');
        const fuzzyMatches = fuzzySearch(word, words, { threshold: 0.7 });
        if (fuzzyMatches.length > 0) {
          descScore += fuzzyMatches[0].score * 2;
        }
      }
    }
    
    score += Math.min(descScore, 25);
  }
  
  // Enhanced category matching
  if (searchData.category && item.category) {
    const categorySimilarity = similarityScore(
      searchData.category.toLowerCase(), 
      item.category.toLowerCase()
    );
    if (categorySimilarity > 0.8) {
      score += 20;
    } else if (categorySimilarity > 0.6) {
      score += 15;
    }
  }
  
  // Enhanced location matching with fuzzy search
  if (searchData.location && item.location) {
    const locationQuery = normalizeText(searchData.location);
    
    if (itemLocation.includes(locationQuery)) {
      score += 10; // Exact substring match
    } else {
      const locationSimilarity = similarityScore(locationQuery, itemLocation);
      if (locationSimilarity > 0.7) {
        score += locationSimilarity * 8;
      }
    }
  }
  
  // Enhanced color matching with fuzzy search
  if (searchData.color && itemText) {
    const colorQuery = searchData.color.toLowerCase();
    
    if (itemText.includes(colorQuery)) {
      score += 5; // Exact color match
    } else {
      // Fuzzy color matching (for typos like 'blak' -> 'black')
      const words = itemText.split(' ');
      const colorMatches = fuzzySearch(colorQuery, words, { threshold: 0.8 });
      if (colorMatches.length > 0) {
        score += colorMatches[0].score * 4;
      }
    }
  }
  
  // Material matching
  if (searchData.material && itemText) {
    const materialQuery = searchData.material.toLowerCase();
    
    if (itemText.includes(materialQuery)) {
      score += 3;
    } else {
      const words = itemText.split(' ');
      const materialMatches = fuzzySearch(materialQuery, words, { threshold: 0.8 });
      if (materialMatches.length > 0) {
        score += materialMatches[0].score * 2;
      }
    }
  }
  
  // Size matching
  if (searchData.size && itemText) {
    const sizeQuery = searchData.size.toLowerCase();
    const sizeKeywords = [sizeQuery];
    
    // Expand size keywords
    if (sizeQuery === 'small') sizeKeywords.push('mini', 'tiny', 'compact', 'little');
    if (sizeQuery === 'large') sizeKeywords.push('big', 'huge', 'oversized', 'giant');
    if (sizeQuery === 'medium') sizeKeywords.push('med', 'regular', 'standard');
    
    for (const keyword of sizeKeywords) {
      if (itemText.includes(keyword)) {
        score += 2;
        break;
      }
    }
  }
  
  return Math.min(score, maxScore);
}

// Helper function to check date range
function isInDateRange(itemDate: string, dateFrom?: string, dateTo?: string): boolean {
  if (!dateFrom && !dateTo) return true;
  
  const item = new Date(itemDate);
  const from = dateFrom ? new Date(dateFrom) : new Date(0);
  const to = dateTo ? new Date(dateTo) : new Date();
  
  return item >= from && item <= to;
}

// Input validation schema
interface SearchRequest {
  searchType: 'photo' | 'details';
  description?: string;
  category?: string;
  location?: string;
  dateFrom?: string;
  dateTo?: string;
  color?: string;
  material?: string;
  size?: string;
}

function validateSearchRequest(data: any): { valid: boolean; errors: string[]; sanitized?: SearchRequest } {
  const errors: string[] = [];
  
  // Required fields
  if (!data.searchType) {
    errors.push('Search type is required');
  } else if (!['photo', 'details'].includes(data.searchType)) {
    errors.push('Search type must be either "photo" or "details"');
  }
  
  // Sanitize and validate optional fields
  const sanitized: SearchRequest = {
    searchType: data.searchType
  };
  
  if (data.description) {
    const desc = String(data.description).trim();
    if (desc.length > 500) {
      errors.push('Description must be less than 500 characters');
    } else if (desc.length < 2) {
      errors.push('Description must be at least 2 characters');
    } else {
      sanitized.description = desc;
    }
  }
  
  if (data.category) {
    const validCategories = ['all', 'ELECTRONICS', 'BAGS', 'JEWELRY', 'CLOTHING', 'DOCUMENTS', 'KEYS', 'ACCESSORIES', 'MISCELLANEOUS'];
    if (!validCategories.includes(data.category)) {
      errors.push('Invalid category');
    } else {
      sanitized.category = data.category;
    }
  }
  
  if (data.location) {
    const loc = String(data.location).trim();
    if (loc.length > 200) {
      errors.push('Location must be less than 200 characters');
    } else {
      sanitized.location = loc;
    }
  }
  
  // Date validation
  if (data.dateFrom) {
    const fromDate = new Date(data.dateFrom);
    if (isNaN(fromDate.getTime())) {
      errors.push('Invalid dateFrom format');
    } else if (fromDate > new Date()) {
      errors.push('dateFrom cannot be in the future');
    } else {
      sanitized.dateFrom = data.dateFrom;
    }
  }
  
  if (data.dateTo) {
    const toDate = new Date(data.dateTo);
    if (isNaN(toDate.getTime())) {
      errors.push('Invalid dateTo format');
    } else if (toDate > new Date()) {
      errors.push('dateTo cannot be in the future');
    } else {
      sanitized.dateTo = data.dateTo;
    }
  }
  
  // Date range validation
  if (sanitized.dateFrom && sanitized.dateTo) {
    const from = new Date(sanitized.dateFrom);
    const to = new Date(sanitized.dateTo);
    if (from > to) {
      errors.push('dateFrom must be before dateTo');
    }
    
    // Check for reasonable date range (not more than 5 years)
    const diffYears = (to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24 * 365);
    if (diffYears > 5) {
      errors.push('Date range cannot exceed 5 years');
    }
  }
  
  // Color validation
  if (data.color) {
    const color = String(data.color).trim().toLowerCase();
    const validColors = ['red', 'blue', 'green', 'yellow', 'black', 'white', 'brown', 'gray', 'grey', 'orange', 'purple', 'pink', 'silver', 'gold'];
    if (color.length > 50) {
      errors.push('Color must be less than 50 characters');
    } else {
      sanitized.color = color;
    }
  }
  
  // Material validation
  if (data.material) {
    const material = String(data.material).trim().toLowerCase();
    if (material.length > 100) {
      errors.push('Material must be less than 100 characters');
    } else {
      sanitized.material = material;
    }
  }
  
  // Size validation
  if (data.size) {
    const validSizes = ['small', 'medium', 'large', 'extra-small', 'extra-large', 'xs', 's', 'm', 'l', 'xl'];
    const size = String(data.size).trim().toLowerCase();
    if (!validSizes.includes(size)) {
      errors.push('Invalid size. Must be one of: small, medium, large, extra-small, extra-large');
    } else {
      sanitized.size = size;
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
    sanitized: errors.length === 0 ? sanitized : undefined
  };
}

// Rate limiting helper
const searchAttempts = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(ip: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute window
  const maxAttempts = 20; // 20 searches per minute
  
  const current = searchAttempts.get(ip);
  
  if (!current || now > current.resetTime) {
    searchAttempts.set(ip, { count: 1, resetTime: now + windowMs });
    return { allowed: true };
  }
  
  if (current.count >= maxAttempts) {
    return { allowed: false, retryAfter: Math.ceil((current.resetTime - now) / 1000) };
  }
  
  current.count++;
  return { allowed: true };
}

// POST /api/search
export async function POST(request: Request) {
  try {
    // Rate limiting
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown';
    
    const rateLimit = checkRateLimit(ip);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { 
          error: 'Too many search requests', 
          retryAfter: rateLimit.retryAfter 
        }, 
        { 
          status: 429,
          headers: {
            'Retry-After': String(rateLimit.retryAfter)
          }
        }
      );
    }
    
    const data = await request.json();
    
    // Comprehensive input validation
    const validation = validateSearchRequest(data);
    if (!validation.valid) {
      return NextResponse.json(
        { 
          error: 'Validation failed', 
          details: validation.errors 
        }, 
        { status: 400 }
      );
    }
    
    const sanitizedData = validation.sanitized!;

    // Get session for potential authentication
    let session = null;
    try {
      session = await getServerSession(authOptions);
    } catch (err) {
      console.warn("Session error:", err);
    }

    if (sanitizedData.searchType === "photo") {
      // Photo search - delegate to the dedicated image search endpoint
      return NextResponse.json({ 
        error: "Photo search should use /api/search/image endpoint", 
        redirect: "/api/search/image",
        message: "Please use the image search endpoint for photo-based searches"
      }, { status: 400 });
      
    } else if (sanitizedData.searchType === "details") {
      // Text-based search using real backend data
      
      // Prepare data for backend search endpoint
      
      // Use the new backend search endpoint
      const apiUrl = `${BACKEND_URL}/api/items/search`;
      console.log('🔍 Searching with data:', sanitizedData);
      
      // Fetch from backend using POST
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sanitizedData),
        cache: 'no-store'
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Backend search failed: ${response.status} - ${errorText}`);
        return NextResponse.json({ 
          error: "Search service unavailable", 
          details: `Backend error: ${response.status} - ${errorText}`,
          backendUrl: apiUrl,
          results: [] 
        }, { status: 500 });
      }
      
      const backendData = await response.json();
      
      // Check if backend already processed results
      if (backendData.results) {
        // Backend already provided processed results
        return NextResponse.json(backendData);
      }
      
      // Fallback to old processing if needed
      const items = backendData.items || [];
      
      // Enhanced filtering and scoring
      const results = items
        .map((item: any) => {
          // Calculate relevance score based on search criteria
          const relevanceScore = calculateTextRelevance(item, sanitizedData);
          
          // Transform to expected format
          return {
            id: item.id,
            name: item.name || 'Unnamed Item',
            location: item.location || 'Unknown Location', 
            date: item.dateLost || item.createdAt || new Date().toISOString().split('T')[0],
            time: item.dateLost ? new Date(item.dateLost).toLocaleTimeString() : new Date().toLocaleTimeString(),
            image: (() => {
              if (!item.imageUrl || item.imageUrl === 'test.jpg') {
                return '/placeholder.svg?height=200&width=200';
              }
              if (item.imageUrl.startsWith('http')) {
                return item.imageUrl;
              }
              if (item.imageUrl.startsWith('/')) {
                return `http://localhost:8082${item.imageUrl}`;
              }
              return `http://localhost:8082/api/files/${item.imageUrl}`;
            })(),
            category: item.category?.toLowerCase() || 'other',
            description: item.description || 'No description available',
            status: item.status?.toLowerCase() || 'lost',
            coordinates: {
              x: item.longitude || 0,
              y: item.latitude || 0
            },
            matchScore: Math.round(relevanceScore)
          };
        })
        .filter((item: any) => {
          // Additional client-side filtering for better accuracy
          
          // Date range filtering
          if (sanitizedData.dateFrom || sanitizedData.dateTo) {
            if (!isInDateRange(item.date, sanitizedData.dateFrom, sanitizedData.dateTo)) {
              return false;
            }
          }
          
          // Color filtering (enhanced)
          if (sanitizedData.color) {
            const itemText = `${item.name} ${item.description}`.toLowerCase();
            if (!itemText.includes(sanitizedData.color)) {
              return false;
            }
          }
          
          // Material filtering
          if (sanitizedData.material) {
            const itemText = `${item.name} ${item.description}`.toLowerCase();
            if (!itemText.includes(sanitizedData.material)) {
              return false;
            }
          }
          
          // Size filtering
          if (sanitizedData.size) {
            const itemText = `${item.name} ${item.description}`.toLowerCase();
            const sizeKeywords = [sanitizedData.size];
            if (sanitizedData.size === 'small') sizeKeywords.push('mini', 'tiny', 'compact');
            if (sanitizedData.size === 'large') sizeKeywords.push('big', 'huge', 'oversized');
            
            const hasSize = sizeKeywords.some(keyword => itemText.includes(keyword));
            if (!hasSize) {
              return false;
            }
          }
          
          // Only return items with reasonable relevance scores
          return item.matchScore >= 10;
        })
        .sort((a: any, b: any) => b.matchScore - a.matchScore)
        .slice(0, 20); // Limit to top 20 results
      
      console.log(`🎯 Found ${results.length} matching items`);
      
      // Enhanced response with search metadata
      const searchQuality = results.length > 0 ? 
        (results[0].matchScore > 80 ? 'excellent' :
         results[0].matchScore > 60 ? 'high' :
         results[0].matchScore > 40 ? 'medium' : 'low') : 'no_matches';
      
      return NextResponse.json({ 
        results,
        totalMatches: results.length,
        searchQuality,
        searchMetadata: {
          query: sanitizedData.description || '',
          category: sanitizedData.category || 'all',
          location: sanitizedData.location || '',
          dateRange: sanitizedData.dateFrom || sanitizedData.dateTo ? {
            from: sanitizedData.dateFrom,
            to: sanitizedData.dateTo
          } : null,
          filters: {
            color: sanitizedData.color,
            material: sanitizedData.material,
            size: sanitizedData.size
          },
          timestamp: new Date().toISOString(),
          processingTime: Date.now() - performance.now()
        },
        suggestions: results.length === 0 ? generateSearchSuggestions(sanitizedData) : undefined
      });
    }

    return NextResponse.json({ 
      error: "Invalid search type",
      allowedTypes: ['photo', 'details']
    }, { status: 400 });
  } catch (error) {
    console.error('🔥 Search error:', error);
    
    // Enhanced error handling
    if (error instanceof SyntaxError) {
      return NextResponse.json({ 
        error: "Invalid JSON in request body",
        details: "Please check your request format"
      }, { status: 400 });
    }
    
    if (error instanceof TypeError) {
      return NextResponse.json({ 
        error: "Type error in request processing",
        details: "Please check your data types"
      }, { status: 400 });
    }
    
    return NextResponse.json({ 
      error: "Failed to process search request",
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// Generate search suggestions when no results found
function generateSearchSuggestions(searchData: SearchRequest): string[] {
  const suggestions: string[] = [];
  
  if (searchData.description) {
    // Suggest broader terms
    suggestions.push('Try using broader keywords');
    suggestions.push('Check spelling of search terms');
    
    // Suggest category if not specified
    if (!searchData.category || searchData.category === 'all') {
      suggestions.push('Try selecting a specific category');
    }
  }
  
  if (searchData.location) {
    suggestions.push('Try searching without location filter');
    suggestions.push('Check location spelling');
  }
  
  if (searchData.dateFrom || searchData.dateTo) {
    suggestions.push('Try expanding the date range');
    suggestions.push('Remove date filters to see all results');
  }
  
  if (searchData.color || searchData.material || searchData.size) {
    suggestions.push('Try removing specific filters (color, material, size)');
  }
  
  // General suggestions
  suggestions.push('Browse all items in the category');
  suggestions.push('Use the map view to see nearby items');
  
  return suggestions.slice(0, 4); // Limit to 4 suggestions
}
