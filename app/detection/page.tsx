"use client"

import { useState } from "react"
import RealTimeDetection from "@/components/real-time-detection"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Camera, 
  Zap, 
  Shield, 
  Brain,
  CheckCircle2,
  Info
} from "lucide-react"

export default function DetectionPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">AI Object Detection</h1>
        <p className="text-lg text-muted-foreground">
          Real-time object detection using your device camera and advanced AI models
        </p>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Camera className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-sm">Live Camera</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">HD Video</div>
            <div className="text-xs text-muted-foreground">Up to 1080p @ 30fps</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-green-600" />
              <CardTitle className="text-sm">AI Models</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">YOLO v8</div>
            <div className="text-xs text-muted-foreground">State-of-the-art detection</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-600" />
              <CardTitle className="text-sm">Performance</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Real-time</div>
            <div className="text-xs text-muted-foreground">Instant object recognition</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-purple-600" />
              <CardTitle className="text-sm">Privacy</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Local</div>
            <div className="text-xs text-muted-foreground">No data leaves device</div>
          </CardContent>
        </Card>
      </div>

      {/* Features */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            How It Works
          </CardTitle>
          <CardDescription>
            Our AI-powered detection system helps identify lost objects in real-time
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Camera className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="font-semibold mb-2">1. Camera Access</h3>
              <p className="text-sm text-muted-foreground">
                Grant camera permission to start live video feed from your device
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Brain className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="font-semibold mb-2">2. AI Analysis</h3>
              <p className="text-sm text-muted-foreground">
                Advanced YOLO models analyze each frame to detect and classify objects
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="font-semibold mb-2">3. Results</h3>
              <p className="text-sm text-muted-foreground">
                View detected objects with confidence scores and categories in real-time
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Supported Objects */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Supported Object Categories</CardTitle>
          <CardDescription>
            Our AI can detect and classify the following types of lost objects
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {[
              'Electronics (phones, laptops, tablets)',
              'Bags (backpacks, handbags, suitcases)', 
              'Accessories (watches, glasses, jewelry)',
              'Documents (books, papers, cards)',
              'Keys and keychains',
              'Clothing items',
              'Personal items',
              'And many more...'
            ].map((category, index) => (
              <Badge key={index} variant="outline" className="text-sm">
                {category}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Main Detection Component */}
      <RealTimeDetection />

      {/* Privacy Notice */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-green-600" />
            Privacy & Security
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>
            • Your camera feed is processed locally on your device - no video data is sent to external servers
          </p>
          <p>
            • Detection results are temporary and can be cleared at any time
          </p>
          <p>
            • You have full control over when to start and stop the camera
          </p>
          <p>
            • No personal data is collected or stored during the detection process
          </p>
        </CardContent>
      </Card>
    </div>
  )
}