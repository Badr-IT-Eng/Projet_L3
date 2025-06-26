import { NextResponse } from "next/server"

// Mock verification codes storage (in production, use Redis or database)
let verificationCodes = new Map<string, { code: string; expiresAt: number; verified: boolean }>()

// Mock function to send email (in production, use nodemailer, SendGrid, etc.)
async function sendVerificationEmail(email: string, code: string): Promise<boolean> {
  console.log(`📧 Sending verification email to ${email} with code: ${code}`)
  
  // In development, just log the code
  console.log(`✉️ Email Verification Code for ${email}: ${code}`)
  console.log(`🔗 Or visit: http://localhost:3000/auth/verify?email=${encodeURIComponent(email)}&code=${code}`)
  
  // Simulate email sending success
  return true
}

// POST /api/auth/verify-email - Send verification code
export async function POST(request: Request) {
  try {
    const { email } = await request.json()
    
    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }
    
    // Generate 6-digit verification code
    const code = Math.floor(100000 + Math.random() * 900000).toString()
    const expiresAt = Date.now() + (15 * 60 * 1000) // 15 minutes
    
    // Store verification code
    verificationCodes.set(email, {
      code,
      expiresAt,
      verified: false
    })
    
    // Send email
    const emailSent = await sendVerificationEmail(email, code)
    
    if (!emailSent) {
      return NextResponse.json({ error: "Failed to send verification email" }, { status: 500 })
    }
    
    return NextResponse.json({ 
      message: "Verification code sent to email",
      expiresIn: 15 * 60 // 15 minutes in seconds
    })
    
  } catch (error) {
    console.error("Error sending verification email:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PUT /api/auth/verify-email - Verify code
export async function PUT(request: Request) {
  try {
    const { email, code } = await request.json()
    
    if (!email || !code) {
      return NextResponse.json({ error: "Email and code are required" }, { status: 400 })
    }
    
    const storedData = verificationCodes.get(email)
    
    if (!storedData) {
      return NextResponse.json({ error: "No verification code found for this email" }, { status: 400 })
    }
    
    if (Date.now() > storedData.expiresAt) {
      verificationCodes.delete(email)
      return NextResponse.json({ error: "Verification code has expired" }, { status: 400 })
    }
    
    if (storedData.code !== code) {
      return NextResponse.json({ error: "Invalid verification code" }, { status: 400 })
    }
    
    // Mark as verified
    storedData.verified = true
    verificationCodes.set(email, storedData)
    
    return NextResponse.json({ 
      message: "Email verified successfully",
      verified: true 
    })
    
  } catch (error) {
    console.error("Error verifying email:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// GET /api/auth/verify-email - Check verification status
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')
    
    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }
    
    const storedData = verificationCodes.get(email)
    
    if (!storedData) {
      return NextResponse.json({ verified: false, exists: false })
    }
    
    if (Date.now() > storedData.expiresAt) {
      verificationCodes.delete(email)
      return NextResponse.json({ verified: false, expired: true })
    }
    
    return NextResponse.json({ 
      verified: storedData.verified,
      exists: true,
      expiresAt: storedData.expiresAt
    })
    
  } catch (error) {
    console.error("Error checking verification status:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}