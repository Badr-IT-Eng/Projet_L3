import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8082/api';

// POST /api/detections/save - Save detected lost objects to database
export async function POST(request: NextRequest) {
  try {
    const detectionData = await request.json();
    
    // Validate detection data
    if (!detectionData.objects || !Array.isArray(detectionData.objects)) {
      return NextResponse.json({ error: "Invalid detection data - objects array required" }, { status: 400 });
    }
    
    const savedObjects = [];
    const errors = [];
    
    // Process each detected object
    for (const obj of detectionData.objects) {
      try {
        // Validate required fields
        if (!obj.class || !obj.category || !obj.confidence || !obj.bbox) {
          errors.push(`Skipping object: missing required fields - ${JSON.stringify(obj)}`);
          continue;
        }
        
        // Only save high-confidence unattended objects
        if (obj.context !== 'unattended' || obj.confidence < 0.5) {
          continue;
        }
        
        // Category mapping from YOLO detection to backend format
        const categoryMapping: { [key: string]: string } = {
          'BAGS': 'BAGS',
          'ELECTRONICS': 'ELECTRONICS', 
          'CLOTHING': 'CLOTHING',
          'PERSONAL': 'ACCESSORIES',
          'MISCELLANEOUS': 'MISCELLANEOUS'
        };
        
        // Generate descriptive name based on detected class
        const objectName = `${obj.class.charAt(0).toUpperCase() + obj.class.slice(1)} détecté`;
        
        // Prepare item data for backend
        const itemData = {
          name: objectName,
          description: `Objet détecté automatiquement par IA: ${obj.class} avec ${Math.round(obj.confidence * 100)}% de confiance. Bounding box: [${obj.bbox.join(', ')}]. Statut: non surveillé.`,
          type: 'LOST',
          category: categoryMapping[obj.category] || 'MISCELLANEOUS',
          status: 'LOST',
          location: detectionData.location || 'Position détectée par caméra',
          imageUrl: detectionData.imageUrl || null,
          dateLost: new Date().toISOString(),
          dateFound: null,
          latitude: detectionData.coordinates?.lat || null,
          longitude: detectionData.coordinates?.lng || null,
          contactEmail: null, // Auto-detected items don't have contact info
          contactPhone: null,
          detectionMetadata: {
            confidence: obj.confidence,
            boundingBox: obj.bbox,
            detectionMethod: 'YOLO Real-time Detection + Proximity Analysis',
            context: obj.context,
            timestamp: new Date().toISOString(),
            source: obj.source || 'yolo_realtime'
          }
        };
        
        // Save to backend
        const response = await fetch(`${BACKEND_URL}/items`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(itemData)
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          errors.push(`Failed to save ${obj.class}: ${errorText}`);
          continue;
        }
        
        const savedObject = await response.json();
        savedObjects.push({
          ...savedObject,
          originalDetection: obj
        });
        
        console.log(`✅ Saved detected object: ${obj.class} with confidence ${obj.confidence}`);
        
      } catch (error) {
        errors.push(`Error processing object ${obj.class}: ${error}`);
        console.error(`❌ Error saving object ${obj.class}:`, error);
      }
    }
    
    // Return results
    return NextResponse.json({
      success: true,
      message: `Processed ${detectionData.objects.length} detections`,
      savedObjects: savedObjects.length,
      totalDetections: detectionData.objects.length,
      objects: savedObjects,
      errors: errors.length > 0 ? errors : undefined
    });
    
  } catch (error) {
    console.error('Error in detection save endpoint:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to save detections',
      details: String(error)
    }, { status: 500 });
  }
}

// OPTIONS handler for CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
}