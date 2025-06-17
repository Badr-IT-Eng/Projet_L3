import { NextRequest, NextResponse } from 'next/server'
import { extractImageFeatures } from '@/lib/ai/feature-extraction'

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

    // Convert file to data URL for feature extraction
    const buffer = await image.arrayBuffer()
    const base64 = Buffer.from(buffer).toString('base64')
    const dataUrl = `data:${image.type};base64,${base64}`

    // Extract features using AI
    const features = await extractImageFeatures(dataUrl)

    return NextResponse.json({
      success: true,
      features,
      message: 'Features extracted successfully'
    })
  } catch (error) {
    console.error('Error extracting features:', error)
    return NextResponse.json(
      { error: 'Failed to extract image features' },
      { status: 500 }
    )
  }
}