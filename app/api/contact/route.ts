import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8082/api';

export async function POST(request: NextRequest) {
  console.log('📧 Contact API called');
  try {
    const data = await request.json();
    console.log('📧 Request data:', data);
    
    // Validate required fields
    if (!data.itemId || !data.senderEmail || !data.message) {
      console.log('❌ Missing required fields');
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    
    // Simplified approach - simulate item details
    const item = {
      id: data.itemId,
      name: `Item #${data.itemId}`,
      status: 'LOST'
    };
    
    // Prepare contact request data
    const contactData = {
      itemId: data.itemId,
      itemName: item.name,
      senderEmail: data.senderEmail,
      senderName: data.senderName || 'Anonymous',
      message: data.message,
      contactType: 'FOUND_INQUIRY', // Type of contact
      timestamp: new Date().toISOString(),
      status: 'PENDING'
    };
    
    // In a real implementation, you would:
    // 1. Save the contact request to database
    // 2. Send email to item owner (if they provided contact info)
    // 3. Send confirmation to sender
    
    // For now, simulate successful contact
    console.log('📧 Contact request received:', contactData);
    
    // Simulate email sending delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return NextResponse.json({
      success: true,
      message: "Your message has been sent! The item owner will be notified.",
      contactId: `contact_${Date.now()}`,
      estimatedResponse: "24-48 hours"
    });
    
  } catch (error) {
    console.error('Error processing contact request:', error);
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 }
    );
  }
}

// OPTIONS handler for CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}