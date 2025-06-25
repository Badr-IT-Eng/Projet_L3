"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Camera, 
  ArrowRight, 
  Zap,
  Monitor,
  Info,
  CheckCircle2
} from "lucide-react"

export default function CamerasPage() {
  const router = useRouter()

  // Auto-redirect after 10 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      router.push("/detection")
    }, 10000)

    return () => clearTimeout(timer)
  }, [router])

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Camera Management</h1>
        <p className="text-lg text-muted-foreground">
          Manage security cameras and video sources
        </p>
      </div>

      {/* Migration Notice */}
      <Card className="mb-8 border-blue-200 bg-blue-50">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Info className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-blue-900">Feature Update</CardTitle>
          </div>
          <CardDescription className="text-blue-800">
            Camera management has been upgraded to real-time detection
          </CardDescription>
        </CardHeader>
        <CardContent className="text-blue-800">
          <div className="space-y-4">
            <p>
              We've enhanced the camera functionality with a new real-time object detection system 
              that uses your device's camera for instant AI-powered object recognition.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-semibold flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  New Features:
                </h4>
                <ul className="text-sm space-y-1 ml-6">
                  <li>• Real-time object detection with YOLO v8</li>
                  <li>• Live camera feed from your device</li>
                  <li>• Instant classification and confidence scoring</li>
                  <li>• Privacy-focused local processing</li>
                  <li>• Customizable detection settings</li>
                </ul>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-semibold flex items-center gap-2">
                  <Zap className="h-4 w-4 text-yellow-600" />
                  Benefits:
                </h4>
                <ul className="text-sm space-y-1 ml-6">
                  <li>• No complex camera setup required</li>
                  <li>• Works on any device with a camera</li>
                  <li>• Advanced AI models included</li>
                  <li>• Real-time results and analytics</li>
                  <li>• Enhanced user experience</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card className="group hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => router.push("/detection")}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Camera className="h-6 w-6 text-blue-600" />
                <CardTitle>Real-Time Detection</CardTitle>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
            <CardDescription>
              Use your device camera for instant object detection
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 mb-3">
              <Badge variant="default" className="bg-green-100 text-green-800">
                Available Now
              </Badge>
              <Badge variant="outline">AI Powered</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Advanced YOLO v8 models with real-time processing and privacy protection
            </p>
          </CardContent>
        </Card>

        <Card className="group hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => router.push("/admin/detection")}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Monitor className="h-6 w-6 text-purple-600" />
                <CardTitle>Admin Detection</CardTitle>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
            <CardDescription>
              Administrative tools for detection management
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 mb-3">
              <Badge variant="outline" className="border-purple-200 text-purple-700">
                Admin Only
              </Badge>
              <Badge variant="outline">Management</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Configure detection settings and review detection history
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Button 
          onClick={() => router.push("/detection")} 
          size="lg"
          className="gap-2"
        >
          <Camera className="h-5 w-5" />
          Go to Real-Time Detection
        </Button>
        
        <Button 
          onClick={() => router.push("/admin")} 
          variant="outline"
          size="lg"
          className="gap-2"
        >
          <Monitor className="h-5 w-5" />
          Back to Admin Dashboard
        </Button>
      </div>

      {/* Auto-redirect notice */}
      <Card className="mt-8 bg-gray-50">
        <CardContent className="py-4">
          <p className="text-center text-sm text-muted-foreground">
            You will be automatically redirected to the Real-Time Detection page in 10 seconds...
          </p>
        </CardContent>
      </Card>
    </div>
  )
}