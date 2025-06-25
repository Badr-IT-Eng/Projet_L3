import { NextRequest, NextResponse } from 'next/server';
import { fuzzySearch, normalizeText } from '@/lib/search/fuzzy-matching';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8082/api';

// Cache for autocomplete data
let autocompleteCache: {
  items: string[];
  locations: string[];
  categories: string[];
  lastUpdate: number;
} = {
  items: [],
  locations: [],
  categories: [],
  lastUpdate: 0
};

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Common search terms and categories
const COMMON_TERMS = [
  // Electronics
  'phone', 'iphone', 'android', 'smartphone', 'laptop', 'macbook', 'tablet', 'ipad',
  'charger', 'cable', 'headphones', 'earbuds', 'airpods', 'camera', 'smartwatch',
  'kindle', 'computer', 'mouse', 'keyboard',
  
  // Bags and accessories
  'backpack', 'bag', 'purse', 'handbag', 'suitcase', 'luggage', 'briefcase',
  'wallet', 'purse', 'tote', 'messenger bag', 'duffel bag',
  
  // Clothing
  'jacket', 'coat', 'sweater', 'hoodie', 'shirt', 'pants', 'jeans', 'dress',
  'shoes', 'sneakers', 'boots', 'sandals', 'hat', 'cap', 'scarf', 'gloves',
  
  // Jewelry and accessories
  'watch', 'ring', 'necklace', 'bracelet', 'earrings', 'sunglasses', 'glasses',
  'chain', 'pendant', 'charm',
  
  // Documents and cards
  'id', 'license', 'passport', 'card', 'student id', 'credit card', 'keys',
  'keychain', 'notebook', 'book', 'diary',
  
  // Colors
  'black', 'white', 'red', 'blue', 'green', 'yellow', 'brown', 'gray', 'grey',
  'orange', 'purple', 'pink', 'silver', 'gold',
  
  // Materials
  'leather', 'plastic', 'metal', 'fabric', 'canvas', 'denim', 'cotton'
];

async function updateAutocompleteCache(): Promise<void> {
  const now = Date.now();
  
  // Check if cache is still valid
  if (now - autocompleteCache.lastUpdate < CACHE_DURATION) {
    return;
  }
  
  try {
    console.log('🔄 Updating autocomplete cache...');
    
    // Fetch recent items from backend
    const response = await fetch(`${BACKEND_URL}/items/public/lost?size=200&page=0`, {
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store'
    });
    
    if (response.ok) {
      const data = await response.json();
      const items = data.items || [];
      
      // Extract unique terms
      const itemNames = new Set<string>();
      const locations = new Set<string>();
      const categories = new Set<string>();
      
      items.forEach((item: any) => {
        // Extract words from item names and descriptions
        if (item.name) {
          const words = normalizeText(item.name).split(' ');
          words.forEach(word => {
            if (word.length > 2) itemNames.add(word);
          });
        }
        
        if (item.description) {
          const words = normalizeText(item.description).split(' ');
          words.forEach(word => {
            if (word.length > 2) itemNames.add(word);
          });
        }
        
        // Extract locations
        if (item.location) {
          locations.add(item.location.trim());
        }
        
        // Extract categories
        if (item.category) {
          categories.add(item.category.toLowerCase());
        }
      });
      
      // Combine with common terms
      COMMON_TERMS.forEach(term => itemNames.add(term));
      
      autocompleteCache = {
        items: Array.from(itemNames),
        locations: Array.from(locations),
        categories: Array.from(categories),
        lastUpdate: now
      };
      
      console.log(`✅ Cache updated: ${autocompleteCache.items.length} items, ${autocompleteCache.locations.length} locations`);
    }
  } catch (error) {
    console.warn('Failed to update autocomplete cache:', error);
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q')?.trim();
    const type = searchParams.get('type') || 'all'; // 'items', 'locations', 'categories', 'all'
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 20);
    
    if (!query || query.length < 2) {
      return NextResponse.json({
        suggestions: [],
        message: 'Query too short'
      });
    }
    
    // Update cache if needed
    await updateAutocompleteCache();
    
    const results: Array<{ text: string; type: string; score: number }> = [];
    
    // Search in different categories based on type
    if (type === 'all' || type === 'items') {
      const itemMatches = fuzzySearch(query, autocompleteCache.items, {
        threshold: 0.3,
        includePartialMatches: true,
        weightByPosition: true
      });
      
      itemMatches.forEach(match => {
        results.push({
          text: match.target,
          type: 'item',
          score: match.score
        });
      });
    }
    
    if (type === 'all' || type === 'locations') {
      const locationMatches = fuzzySearch(query, autocompleteCache.locations, {
        threshold: 0.4,
        includePartialMatches: true,
        weightByPosition: true
      });
      
      locationMatches.forEach(match => {
        results.push({
          text: match.target,
          type: 'location',
          score: match.score * 0.9 // Slightly lower priority
        });
      });
    }
    
    if (type === 'all' || type === 'categories') {
      const categoryMatches = fuzzySearch(query, autocompleteCache.categories, {
        threshold: 0.4,
        includePartialMatches: true,
        weightByPosition: true
      });
      
      categoryMatches.forEach(match => {
        results.push({
          text: match.target,
          type: 'category',
          score: match.score * 0.8 // Lower priority than items
        });
      });
    }
    
    // Remove duplicates and sort by score
    const uniqueResults = results
      .filter((result, index, array) => 
        array.findIndex(r => r.text.toLowerCase() === result.text.toLowerCase()) === index
      )
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
    
    // Add spelling corrections if no good matches
    if (uniqueResults.length < 3) {
      const allTerms = [...autocompleteCache.items, ...autocompleteCache.locations];
      const spellingSuggestions = fuzzySearch(query, allTerms, {
        threshold: 0.2,
        includePartialMatches: false
      }).slice(0, 3);
      
      spellingSuggestions.forEach(suggestion => {
        if (!uniqueResults.some(r => r.text.toLowerCase() === suggestion.target.toLowerCase())) {
          uniqueResults.push({
            text: suggestion.target,
            type: 'spelling',
            score: suggestion.score * 0.5
          });
        }
      });
    }
    
    return NextResponse.json({
      suggestions: uniqueResults.slice(0, limit),
      query,
      total: uniqueResults.length,
      cached: true
    });
    
  } catch (error) {
    console.error('Autocomplete error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get suggestions',
        suggestions: []
      },
      { status: 500 }
    );
  }
}

// OPTIONS handler for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}