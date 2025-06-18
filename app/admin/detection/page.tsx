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
  Loader2
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
  const { toast } = useToast();
  const { apiCall } = useAuthenticatedApi();

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
    // Simulate object detection results
    const mockDetections = [
      {
        trackingId: `obj_${Date.now()}_1`,
        category: "BAGS",
        confidence: 0.85,
        x: 150,
        y: 100,
        width: 80,
        height: 60,
        snapshotUrl: "detection_frame_1.jpg"
      },
      {
        trackingId: `obj_${Date.now()}_2`,
        category: "ELECTRONICS",
        confidence: 0.92,
        x: 300,
        y: 200,
        width: 120,
        height: 90,
        snapshotUrl: "detection_frame_2.jpg"
      },
      {
        trackingId: `obj_${Date.now()}_3`,
        category: "KEYS",
        confidence: 0.78,
        x: 450,
        y: 150,
        width: 40,
        height: 30,
        snapshotUrl: "detection_frame_3.jpg"
      }
    ];

    for (const detection of mockDetections) {
      try {
        // Process detection in backend
        const detectionResponse = await fetch('http://localhost:8082/api/detection/process', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sessionId: currentSessionId,
            ...detection
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
            timestamp: new Date().toISOString()
          }]);

          // Create item in lost objects table
          const itemData = {
            name: `Detected ${detection.category.toLowerCase()}`,
            description: `Detected by AI with confidence ${Math.round(detection.confidence * 100)}% at ${new Date().toLocaleString()}`,
            type: 'FOUND',
            category: detection.category,
            status: 'FOUND',
            location: `${cameraLocation} (X:${detection.x}, Y:${detection.y})`,
            imageUrl: detection.snapshotUrl,
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
            console.log('Item created successfully in lost objects table');
          }
        }
      } catch (error) {
        console.error('Error processing detection:', error);
      }
      
      // Add delay between detections to simulate real-time processing
      await new Promise(resolve => setTimeout(resolve, 1500));
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
            Upload videos to automatically detect and catalog lost objects
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
                  Analyzing video frames for object detection. This may take a few minutes...
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
                    className="p-3 border rounded-lg space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <Badge variant="outline">{result.category}</Badge>
                      <span className="text-sm text-muted-foreground">
                        {Math.round(result.confidence * 100)}% confidence
                      </span>
                    </div>
                    <div className="text-sm space-y-1">
                      <div>Position: ({result.x}, {result.y})</div>
                      <div>Size: {result.width} × {result.height}</div>
                      <div>ID: {result.trackingId}</div>
                      <div className="text-xs text-muted-foreground">
                        Detected: {new Date(result.timestamp).toLocaleString()}
                      </div>
                      <div className="text-xs text-green-600 font-medium">
                        ✓ Added to lost objects database
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