import { NextRequest, NextResponse } from 'next/server'
import { extractImageFeatures } from '@/lib/ai/feature-extraction'

const DETECTION_API_URL = process.env.DETECTION_API_URL || process.env.NEXT_PUBLIC_DETECTION_API_URL || 'http://localhost:5002'
const PYTHON_DETECTION_URL = process.env.PYTHON_DETECTION_URL || 'http://localhost:5000'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const image = formData.get('image') as File
    
    if (!image) {
      return NextResponse.json(
        { error: 'No image provided' },
        { status: 400 }
      )
    }
    
    // Enhanced validation
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(image.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Please upload JPG, PNG, or WebP images.' },
        { status: 400 }
      )
    }
    
    // Check file size (25MB limit)
    const maxSize = 25 * 1024 * 1024
    if (image.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 25MB.' },
        { status: 400 }
      )
    }
    
    console.log(`🔍 Processing image: ${image.name} (${(image.size / 1024 / 1024).toFixed(2)}MB)`)

    // Convert image to buffer for processing
    const buffer = await image.arrayBuffer()
    const imageBuffer = Buffer.from(buffer)
    const base64 = imageBuffer.toString('base64')
    const dataUrl = `data:${image.type};base64,${base64}`
    
    // Parallel processing: Try multiple detection services and local feature extraction
    const detectionPromises = [
      // Primary unified detection API
      tryUnifiedDetectionAPI(image),
      // Python detection service
      tryPythonDetectionAPI(imageBuffer, image.type),
      // Local feature extraction
      extractImageFeatures(dataUrl)
    ]
    
    const results = await Promise.allSettled(detectionPromises)
    
    // Process results
    const unifiedDetection = results[0].status === 'fulfilled' ? results[0].value : null
    const pythonDetection = results[1].status === 'fulfilled' ? results[1].value : null
    const localFeatures = results[2].status === 'fulfilled' ? results[2].value : []
    
    // Combine detection results
    const combinedDetections = combineDetectionResults(unifiedDetection, pythonDetection)
    
    // Enhance features with detection insights
    const enhancedFeatures = enhanceFeatures(localFeatures, combinedDetections, {
      name: image.name,
      size: image.size,
      type: image.type
    })
    
    const hasDetections = combinedDetections.objects.length > 0
    
    console.log(`✅ Processing complete: ${enhancedFeatures.length} features, ${combinedDetections.objects.length} objects detected`)
    
    return NextResponse.json({
      success: true,
      features: enhancedFeatures,
      detections: combinedDetections.objects,
      categories: combinedDetections.categories,
      confidence: combinedDetections.confidence,
      session_id: unifiedDetection?.session_id || `local_${Date.now()}`,
      total_objects: combinedDetections.objects.length,
      algorithms_used: [
        unifiedDetection ? 'unified_api' : null,
        pythonDetection ? 'python_yolo' : null,
        'local_ml'
      ].filter(Boolean),
      message: hasDetections 
        ? 'Features and objects detected successfully'
        : 'Features extracted (no objects detected)'
    })

  } catch (error) {
    console.error('💥 Error extracting features:', error)
    return NextResponse.json(
      { 
        error: 'Failed to extract image features',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Try unified detection API
async function tryUnifiedDetectionAPI(image: File): Promise<any> {
  try {
    const detectionFormData = new FormData()
    detectionFormData.append('image', image)

    const response = await fetch(`${DETECTION_API_URL}/detect/image`, {
      method: 'POST',
      body: detectionFormData,
      signal: AbortSignal.timeout(30000)
    })

    if (response.ok) {
      const data = await response.json()
      console.log(`🔧 Unified API: ${data.total_objects || 0} objects detected`)
      return data
    }
    return null
  } catch (error) {
    console.warn('Unified detection API unavailable:', error.message)
    return null
  }
}

// Try Python detection service
async function tryPythonDetectionAPI(imageBuffer: Buffer, mimeType: string): Promise<any> {
  try {
    const formData = new FormData()
    const blob = new Blob([imageBuffer], { type: mimeType })
    formData.append('image', blob, 'upload.jpg')
    formData.append('confidence_threshold', '0.3')
    formData.append('return_features', 'true')

    const response = await fetch(`${PYTHON_DETECTION_URL}/detect`, {
      method: 'POST',
      body: formData,
      signal: AbortSignal.timeout(30000)
    })

    if (response.ok) {
      const data = await response.json()
      console.log(`🐍 Python API: ${data.objects?.length || 0} objects detected`)
      return data
    }
    return null
  } catch (error) {
    console.warn('Python detection API unavailable:', error.message)
    return null
  }
}

// Combine results from multiple detection services
function combineDetectionResults(unifiedResult: any, pythonResult: any) {
  const combined = {
    objects: [],
    categories: new Set(),
    confidence: 0
  }
  
  // Add unified API results
  if (unifiedResult?.detections) {
    combined.objects.push(...unifiedResult.detections)
  }
  
  // Add Python API results
  if (pythonResult?.objects) {
    combined.objects.push(...pythonResult.objects.map((obj: any) => ({
      ...obj,
      source: 'python_yolo'
    })))
  }
  
  // Deduplicate similar objects based on position and class
  const deduplicated = deduplicateObjects(combined.objects)
  
  // Extract categories
  deduplicated.forEach(obj => {
    if (obj.category) combined.categories.add(obj.category)
    if (obj.class) combined.categories.add(obj.class)
  })
  
  // Calculate average confidence
  if (deduplicated.length > 0) {
    combined.confidence = deduplicated.reduce((sum, obj) => sum + (obj.confidence || 0), 0) / deduplicated.length
  }
  
  return {
    objects: deduplicated,
    categories: Array.from(combined.categories),
    confidence: combined.confidence
  }
}

// Deduplicate objects that are likely the same
function deduplicateObjects(objects: any[]): any[] {
  if (objects.length <= 1) return objects
  
  const deduplicated = []
  
  for (const obj of objects) {
    const isDuplicate = deduplicated.some(existing => {
      // Check if same class/category
      const sameClass = obj.class === existing.class || obj.category === existing.category
      
      // Check if overlapping bounding boxes (if available)
      if (obj.bbox && existing.bbox && sameClass) {
        const overlap = calculateBBoxOverlap(obj.bbox, existing.bbox)
        return overlap > 0.5 // 50% overlap threshold
      }
      
      return false
    })
    
    if (!isDuplicate) {
      deduplicated.push(obj)
    }
  }
  
  return deduplicated
}

// Calculate bounding box overlap
function calculateBBoxOverlap(bbox1: number[], bbox2: number[]): number {
  if (bbox1.length < 4 || bbox2.length < 4) return 0
  
  const [x1_1, y1_1, x2_1, y2_1] = bbox1
  const [x1_2, y1_2, x2_2, y2_2] = bbox2
  
  const x_overlap = Math.max(0, Math.min(x2_1, x2_2) - Math.max(x1_1, x1_2))
  const y_overlap = Math.max(0, Math.min(y2_1, y2_2) - Math.max(y1_1, y1_2))
  const overlap_area = x_overlap * y_overlap
  
  const area1 = (x2_1 - x1_1) * (y2_1 - y1_1)
  const area2 = (x2_2 - x1_2) * (y2_2 - y1_2)
  const union_area = area1 + area2 - overlap_area
  
  return union_area > 0 ? overlap_area / union_area : 0
}

// Enhance features with detection insights
function enhanceFeatures(baseFeatures: number[], detectionData: any, metadata: any): number[] {
  const enhanced = [...baseFeatures]
  
  if (!detectionData?.objects?.length) {
    // Add zero-padding for missing detection features
    enhanced.push(...Array(15).fill(0))
    return enhanced
  }
  
  const objects = detectionData.objects
  
  // Detection statistics
  enhanced.push(
    Math.min(objects.length / 10, 1), // Normalized object count
    detectionData.confidence || 0, // Average confidence
    objects.filter((obj: any) => (obj.confidence || 0) > 0.7).length / objects.length // High confidence ratio
  )
  
  // Category-specific features
  const categories = ['BAGS', 'ELECTRONICS', 'JEWELRY', 'CLOTHING', 'DOCUMENTS', 'KEYS']
  categories.forEach(category => {
    const categoryObjects = objects.filter((obj: any) => 
      obj.category === category || 
      obj.class?.toUpperCase().includes(category) ||
      obj.label?.toUpperCase().includes(category)
    )
    enhanced.push(categoryObjects.length / Math.max(objects.length, 1))
  })
  
  // Size and spatial features
  if (objects.length > 0 && objects[0].bbox) {
    const areas = objects.map((obj: any) => {
      const bbox = obj.bbox
      return bbox && bbox.length >= 4 ? (bbox[2] - bbox[0]) * (bbox[3] - bbox[1]) : 0
    })
    
    enhanced.push(
      Math.max(...areas), // Largest object
      areas.reduce((sum: number, area: number) => sum + area, 0) / areas.length, // Average size
      areas.filter(area => area > 0.1).length / areas.length // Large object ratio
    )
  } else {
    enhanced.push(0, 0, 0)
  }
  
  return enhanced
}