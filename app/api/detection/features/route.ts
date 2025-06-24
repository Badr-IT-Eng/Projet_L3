import { NextRequest, NextResponse } from 'next/server'
import { extractImageFeatures } from '@/lib/ai/feature-extraction'

const DETECTION_API_URL = process.env.DETECTION_API_URL || process.env.NEXT_PUBLIC_DETECTION_API_URL || 'http://localhost:5002'

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

    // Try to use the unified detection API first
    try {
      const detectionFormData = new FormData()
      detectionFormData.append('image', image)

      const detectionResponse = await fetch(`${DETECTION_API_URL}/detect/image`, {
        method: 'POST',
        body: detectionFormData,
        signal: AbortSignal.timeout(30000), // 30 second timeout
      })

      if (detectionResponse.ok) {
        const detectionData = await detectionResponse.json()
        
        // Also extract features using the local AI model as fallback
        const buffer = await image.arrayBuffer()
        const base64 = Buffer.from(buffer).toString('base64')
        const dataUrl = `data:${image.type};base64,${base64}`
        const localFeatures = await extractImageFeatures(dataUrl)

        return NextResponse.json({
          success: true,
          features: localFeatures,
          detections: detectionData.detections,
          session_id: detectionData.session_id,
          total_objects: detectionData.total_objects,
          message: 'Features and objects detected successfully'
        })
      }
    } catch (detectionError) {
      console.warn('Detection API unavailable, falling back to local feature extraction:', detectionError)
    }

    // Fallback to local feature extraction only
    const buffer = await image.arrayBuffer()
    const base64 = Buffer.from(buffer).toString('base64')
    const dataUrl = `data:${image.type};base64,${base64}`

    // Extract features using AI
    const features = await extractImageFeatures(dataUrl)

    return NextResponse.json({
      success: true,
      features,
      message: 'Features extracted successfully (detection service unavailable)'
    })
  } catch (error) {
    console.error('Error extracting features:', error)
    return NextResponse.json(
      { error: 'Failed to extract image features' },
      { status: 500 }
    )
  }
}