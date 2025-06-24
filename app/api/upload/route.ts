import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { extractImageFeatures } from "@/lib/ai/feature-extraction";
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

// Maximum file size (5MB)
const MAX_FILE_SIZE = 5 * 1024 * 1024;

async function saveImageLocally(buffer: Buffer, originalFileName: string) {
  try {
    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // Generate unique filename
    const fileExtension = path.extname(originalFileName);
    const uniqueFileName = `${crypto.randomUUID()}${fileExtension}`;
    const filePath = path.join(uploadsDir, uniqueFileName);

    // Write file to disk
    fs.writeFileSync(filePath, buffer);

    // Return URL and metadata
    return {
      url: `/uploads/${uniqueFileName}`,
      publicId: uniqueFileName,
      width: 800, // Mock dimensions
      height: 600,
      filePath
    };
  } catch (error) {
    console.error('Error saving image locally:', error);
    throw new Error('Local image save failed');
  }
}

export async function POST(request: Request) {
  try {
    // Check authentication
    let session = null;
    try {
      session = await getServerSession(authOptions);
    } catch (err) {
      console.warn("Session error:", err);
    }
    
    // In development, allow uploads without authentication
    if (!session && process.env.NODE_ENV !== 'development') {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Parse form data with file
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "File must be an image" },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File size exceeds 5MB limit" },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Save file locally instead of using Cloudinary
    const imageData = await saveImageLocally(buffer, file.name);

    // Extract image features for AI matching (if available)
    let features = null;
    try {
      features = await extractImageFeatures(imageData.url);
    } catch (error) {
      console.warn("Feature extraction failed:", error);
      // Continue without features if extraction fails
    }

    return NextResponse.json({
      success: true,
      image: {
        url: imageData.url,
        publicId: imageData.publicId,
        width: imageData.width,
        height: imageData.height,
        features,
      },
    });
  } catch (error) {
    console.error("Error uploading image:", error);
    return NextResponse.json(
      { error: "Image upload failed" },
      { status: 500 }
    );
  }
}

// Configure Next.js to handle larger file sizes
export const config = {
  api: {
    bodyParser: false,
    responseLimit: '10mb',
  },
}; 