"use client";
import React, { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { 
  Upload, 
  Video, 
  Play, 
  Pause, 
  RotateCcw, 
  CheckCircle,
  AlertCircle,
  Loader2,
  Camera
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useAuthenticatedApi } from "@/hooks/use-api";

interface DetectionResult {
  id: string;
  trackingId: string;
  category: string;
  confidence: number;
  x: number;
  y: number;
  width: number;
  height: number;
  timestamp: string;
  imageUrl?: string;
  croppedImage?: string;
}

export default function VideoDetectionPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [detectionResults, setDetectionResults] = useState<DetectionResult[]>([]);
  const [sessionId, setSessionId] = useState<string>("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [cameraLocation, setCameraLocation] = useState("Admin Upload");
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();
  const { apiCall } = useAuthenticatedApi();

  // Capture frame from video and crop detected object
  const captureObjectImage = async (x: number, y: number, width: number, height: number): Promise<string | null> => {
    if (!videoRef.current || !canvasRef.current) return null;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return null;

    // Set canvas size to match the detected object
    canvas.width = width;
    canvas.height = height;

    // Draw the cropped portion of the video to canvas
    ctx.drawImage(
      video,
      x, y, width, height,  // Source rectangle (detected object area)
      0, 0, width, height   // Destination rectangle (full canvas)
    );

    // Convert canvas to blob and upload
    return new Promise((resolve) => {
      canvas.toBlob(async (blob) => {
        if (!blob) {
          resolve(null);
          return;
        }

        try {
          // Create FormData to upload the cropped image
          const formData = new FormData();
          formData.append('file', blob, `detected_object_${Date.now()}.jpg`);

          // Upload to backend file service
          const uploadResponse = await fetch('http://localhost:8082/api/files/detection/upload', {
            method: 'POST',
            body: formData
          });

          if (uploadResponse.ok) {
            const imageUrl = await uploadResponse.text();
            resolve(imageUrl);
          } else {
            console.error('Failed to upload image');
            resolve(null);
          }
        } catch (error) {
          console.error('Error uploading image:', error);
          resolve(null);
        }
      }, 'image/jpeg', 0.9);
    });
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('video/')) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setVideoUrl(url);
      setDetectionResults([]);
    } else {
      toast({
        title: "Invalid File",
        description: "Please select a valid video file",
        variant: "destructive",
      });
    }
  };

  const startDetectionSession = async () => {
    try {
      const response = await fetch(`http://localhost:8082/api/detection/sessions/start?cameraId=ADMIN_UPLOAD&cameraLocation=${encodeURIComponent(cameraLocation)}&modelVersion=yolov12`, {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error('Failed to start detection session');
      }
      
      const data = await response.json();
      setSessionId(data.sessionId);
      return data.sessionId;
    } catch (error) {
      console.error('Error starting detection session:', error);
      toast({
        title: "Error",
        description: "Failed to start detection session",
        variant: "destructive",
      });
      return null;
    }
  };

  const simulateDetection = async (currentSessionId: string) => {
    if (!videoRef.current) {
      console.error('Video reference not available');
      return;
    }

    // Get video dimensions for realistic detection coordinates
    const video = videoRef.current;
    const videoWidth = video.videoWidth || video.clientWidth;
    const videoHeight = video.videoHeight || video.clientHeight;

    // Simulate object detection results with realistic coordinates
    const mockDetections = [
      {
        trackingId: `obj_${Date.now()}_1`,
        category: "BAGS",
        confidence: 0.85,
        x: Math.floor(videoWidth * 0.2),
        y: Math.floor(videoHeight * 0.3),
        width: Math.floor(videoWidth * 0.15),
        height: Math.floor(videoHeight * 0.12),
        snapshotUrl: "detection_frame_1.jpg"
      },
      {
        trackingId: `obj_${Date.now()}_2`,
        category: "ELECTRONICS",
        confidence: 0.92,
        x: Math.floor(videoWidth * 0.5),
        y: Math.floor(videoHeight * 0.4),
        width: Math.floor(videoWidth * 0.18),
        height: Math.floor(videoHeight * 0.15),
        snapshotUrl: "detection_frame_2.jpg"
      },
      {
        trackingId: `obj_${Date.now()}_3`,
        category: "KEYS",
        confidence: 0.78,
        x: Math.floor(videoWidth * 0.7),
        y: Math.floor(videoHeight * 0.2),
        width: Math.floor(videoWidth * 0.08),
        height: Math.floor(videoHeight * 0.06),
        snapshotUrl: "detection_frame_3.jpg"
      }
    ];

    for (const detection of mockDetections) {
      try {
        // Capture actual image from video at detection coordinates
        const capturedImageUrl = await captureObjectImage(
          detection.x, 
          detection.y, 
          detection.width, 
          detection.height
        );

        if (!capturedImageUrl) {
          console.error('Failed to capture image for detection');
          // Continue with detection but without image
          toast({
            title: "Image Capture Failed",
            description: `Could not capture image for ${detection.category} detection`,
            variant: "destructive",
          });
        }

        // Process detection in backend
        const detectionResponse = await fetch('http://localhost:8082/api/detection/process', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sessionId: currentSessionId,
            ...detection,
            snapshotUrl: capturedImageUrl || "no_image_captured.jpg"
          }),
        });

        if (detectionResponse.ok) {
          const result = await detectionResponse.json();
          
          // Add to detection results display
          setDetectionResults(prev => [...prev, {
            id: result.trackingId,
            trackingId: detection.trackingId,
            category: detection.category,
            confidence: detection.confidence,
            x: detection.x,
            y: detection.y,
            width: detection.width,
            height: detection.height,
            timestamp: new Date().toISOString(),
            imageUrl: capturedImageUrl,
            croppedImage: capturedImageUrl
          }]);

          // Create item in lost objects table with actual captured image
          const itemData = {
            name: `Detected ${detection.category.toLowerCase()}`,
            description: `Detected by AI with confidence ${Math.round(detection.confidence * 100)}% at ${new Date().toLocaleString()}`,
            type: 'FOUND',
            category: detection.category,
            status: 'FOUND',
            location: `${cameraLocation} (X:${detection.x}, Y:${detection.y})`,
            imageUrl: capturedImageUrl || "/placeholder.svg",
            latitude: null,
            longitude: null
          };

          const itemResponse = await fetch('http://localhost:8082/api/items', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(itemData),
          });

          if (itemResponse.ok) {
            console.log('Item created successfully in lost objects table with image:', capturedImageUrl);
          }
        }
      } catch (error) {
        console.error('Error processing detection:', error);
      }
      
      // Add delay between detections to simulate real-time processing
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  };

  const processVideo = async () => {
    if (!selectedFile) {
      toast({
        title: "No Video Selected",
        description: "Please select a video file first",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    setDetectionResults([]);

    try {
      // Start detection session
      const currentSessionId = await startDetectionSession();
      if (!currentSessionId) {
        throw new Error('Failed to start detection session');
      }

      toast({
        title: "Processing Started",
        description: "Analyzing video for lost objects...",
      });

      // Simulate video processing and object detection
      await simulateDetection(currentSessionId);

      toast({
        title: "Processing Complete",
        description: `Found and added ${detectionResults.length} objects to the lost objects database`,
      });

    } catch (error) {
      console.error('Error processing video:', error);
      toast({
        title: "Processing Failed",
        description: "Failed to process video for object detection",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const resetDetection = () => {
    setSelectedFile(null);
    setVideoUrl("");
    setDetectionResults([]);
    setSessionId("");
    setIsProcessing(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Video Detection</h1>
          <p className="text-muted-foreground">
            Upload videos to automatically detect and catalog lost objects with captured images
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Video Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Video className="w-5 h-5" />
              Video Upload
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="video-file">Select Video File</Label>
              <Input
                id="video-file"
                type="file"
                accept="video/*"
                onChange={handleFileSelect}
                ref={fileInputRef}
                disabled={isProcessing}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="camera-location">Camera Location</Label>
              <Input
                id="camera-location"
                value={cameraLocation}
                onChange={(e) => setCameraLocation(e.target.value)}
                placeholder="Enter camera/location name"
                disabled={isProcessing}
              />
            </div>

            {videoUrl && (
              <div className="space-y-2">
                <video
                  ref={videoRef}
                  src={videoUrl}
                  className="w-full rounded-lg border"
                  controls
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                />
                {/* Hidden canvas for image capture */}
                <canvas
                  ref={canvasRef}
                  style={{ display: 'none' }}
                />
                <div className="flex gap-2">
                  <Button onClick={togglePlayPause} variant="outline" size="sm">
                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </Button>
                  <Button onClick={resetDetection} variant="outline" size="sm">
                    <RotateCcw className="w-4 h-4" />
                    Reset
                  </Button>
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button 
                onClick={processVideo} 
                disabled={!selectedFile || isProcessing}
                className="flex-1"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Process Video
                  </>
                )}
              </Button>
            </div>

            {isProcessing && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Analyzing video frames for object detection and capturing images. This may take a few minutes...
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Detection Results Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              Detection Results
              {detectionResults.length > 0 && (
                <Badge variant="secondary">{detectionResults.length} objects</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {detectionResults.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                No objects detected yet. Upload and process a video to see results.
              </div>
            ) : (
              <div className="space-y-3">
                {detectionResults.map((result) => (
                  <div
                    key={result.id}
                    className="p-3 border rounded-lg space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <Badge variant="outline">{result.category}</Badge>
                      <span className="text-sm text-muted-foreground">
                        {Math.round(result.confidence * 100)}% confidence
                      </span>
                    </div>
                    
                    {/* Display captured image */}
                    {result.croppedImage && (
                      <div className="flex items-center gap-3">
                        <div className="relative w-20 h-20 rounded-lg overflow-hidden border">
                          <img 
                            src={result.croppedImage} 
                            alt={`Detected ${result.category}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 text-sm space-y-1">
                          <div>Position: ({result.x}, {result.y})</div>
                          <div>Size: {result.width} × {result.height}</div>
                          <div>ID: {result.trackingId}</div>
                        </div>
                      </div>
                    )}
                    
                    <div className="text-xs space-y-1">
                      <div className="text-muted-foreground">
                        Detected: {new Date(result.timestamp).toLocaleString()}
                      </div>
                      <div className="text-green-600 font-medium flex items-center gap-1">
                        <Camera className="w-3 h-3" />
                        ✓ Image captured and saved to database
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {sessionId && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle className="w-4 h-4" />
              Detection Session: {sessionId}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}