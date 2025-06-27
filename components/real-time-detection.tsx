"use client"

import React, { useState, useRef, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Camera, 
  CameraOff, 
  Square, 
  Play, 
  Download, 
  RefreshCw, 
  Zap,
  Eye,
  Settings,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react'

interface DetectionResult {
  id: string
  object: string
  confidence: number
  category: string
  bbox?: number[]
  timestamp: string
  screenshot?: string
}

interface CameraStats {
  fps: number
  resolution: string
  detectionCount: number
  avgConfidence: number
}

const RealTimeDetection = () => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const detectionIntervalRef = useRef<NodeJS.Timeout | null>(null)
  
  const [isActive, setIsActive] = useState(false)
  const [isDetecting, setIsDetecting] = useState(false)
  const [detections, setDetections] = useState<DetectionResult[]>([])
  const [detectedObjects, setDetectedObjects] = useState<Set<string>>(new Set())
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<CameraStats>({
    fps: 0,
    resolution: '',
    detectionCount: 0,
    avgConfidence: 0
  })
  const [detectionInterval, setDetectionInterval] = useState(2000) // 2 seconds
  const [confidenceThreshold, setConfidenceThreshold] = useState(0.3)

  // Start camera stream
  const startCamera = useCallback(async () => {
    try {
      setError(null)
      console.log('🎥 Starting camera...')
      
      const constraints = {
        video: {
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 },
          frameRate: { ideal: 30, max: 60 },
          facingMode: 'environment' // Use back camera on mobile if available
        },
        audio: false
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      streamRef.current = stream
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
        
        // Update stats when video loads
        videoRef.current.onloadedmetadata = () => {
          if (videoRef.current) {
            const { videoWidth, videoHeight } = videoRef.current
            setStats(prev => ({
              ...prev,
              resolution: `${videoWidth}x${videoHeight}`,
              fps: 30 // Estimate, real FPS tracking would need more complex logic
            }))
          }
        }
      }
      
      setIsActive(true)
      console.log('✅ Camera started successfully')
      
    } catch (err) {
      console.error('❌ Camera access denied:', err)
      setError(
        err instanceof Error 
          ? `Camera Error: ${err.message}` 
          : 'Failed to access camera. Please ensure camera permissions are granted.'
      )
    }
  }, [])

  // Stop camera stream
  const stopCamera = useCallback(() => {
    console.log('🛑 Stopping camera...')
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current)
      detectionIntervalRef.current = null
    }
    
    setIsActive(false)
    setIsDetecting(false)
    setStats(prev => ({ ...prev, fps: 0, resolution: '' }))
  }, [])

  // Capture frame and send for detection
  const captureAndDetect = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || !isActive) return

    const video = videoRef.current
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    
    if (!ctx) return

    // Set canvas size to match video
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    // Draw current video frame to canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    
    // Capture screenshot as base64
    const screenshot = canvas.toDataURL('image/jpeg', 0.8)

    try {
      // Convert canvas to blob
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => {
          if (blob) resolve(blob)
        }, 'image/jpeg', 0.8)
      })

      // Create form data
      const formData = new FormData()
      formData.append('image', blob, 'frame.jpg')
      formData.append('confidence_threshold', confidenceThreshold.toString())
      formData.append('return_features', 'true')

      console.log('🔍 Sending frame for detection...')

      // Try Python detection API directly
      const endpoints = [
        'http://localhost:5002/detect', // Direct Python API
        '/api/detection/features' // Fallback to Next.js API
      ]

      let detectionResult = null
      
      for (const endpoint of endpoints) {
        try {
          const response = await fetch(endpoint, {
            method: 'POST',
            body: formData,
            signal: AbortSignal.timeout(10000) // 10 second timeout
          })

          if (response.ok) {
            detectionResult = await response.json()
            console.log(`✅ Detection successful from ${endpoint}`)
            break
          }
        } catch (endpointError) {
          console.warn(`⚠️ Detection failed for ${endpoint}:`, endpointError)
        }
      }

      if (detectionResult) {
        console.log('🔍 Detection result received:', detectionResult)
        
        // Process detection results
        const newDetections: DetectionResult[] = []
        
        // Handle different response formats
        const objects = detectionResult.detections || 
                        detectionResult.objects || 
                        []

        console.log('📋 Objects found:', objects)
        
        objects.forEach((obj: any, index: number) => {
          const confidence = obj.confidence || obj.score || 0
          const objectName = obj.class || obj.label || obj.name || obj.object || 'Unknown Object'
          
          console.log(`🎯 Processing object: ${objectName}, confidence: ${confidence}, threshold: ${confidenceThreshold}`)
          
          // Enhanced confidence thresholds by category - higher for better precision
          const categoryThresholds = {
            'BAGS': 0.5,
            'ELECTRONICS': 0.6, 
            'CLOTHING': 0.6,
            'PERSONAL': 0.7,
            'MISCELLANEOUS': 0.7
          }
          
          const category = obj.category || categorizeObject(objectName)
          const minConfidence = categoryThresholds[category] || confidenceThreshold
          
          if (confidence >= minConfidence) {
            console.log(`✅ Object ${objectName} (${category}) passed confidence threshold: ${confidence.toFixed(3)} >= ${minConfidence}`)
            
            // Create unique key combining object name and category  
            const objectKey = `${objectName.toLowerCase()}_${category}`
            
            // Check if we already have this object type with higher confidence
            const existingDetection = detections.find(d => 
              d.object.toLowerCase() === objectName.toLowerCase() && 
              d.category === category
            )
            
            // Only add if:
            // 1. Object not detected before, OR
            // 2. New detection has significantly higher confidence (+10%)
            const shouldAdd = !existingDetection || 
              (confidence > existingDetection.confidence + 0.1)
            
            if (shouldAdd && !detectedObjects.has(objectKey)) {
              console.log(`🆕 Adding new object: ${objectName} (${category}) - ${(confidence*100).toFixed(1)}%`)
              
              // If updating existing detection, remove the old one
              if (existingDetection) {
                setDetections(prev => prev.filter(d => d.id !== existingDetection.id))
                console.log(`🔄 Updating ${objectName} with higher confidence`)
              }
              
              newDetections.push({
                id: `${Date.now()}-${index}`,
                object: objectName,
                confidence: confidence,
                category: category,
                bbox: obj.bbox || obj.bounding_box,
                timestamp: new Date().toISOString(),
                screenshot: screenshot,
                context: obj.context || 'unattended' // Context information
              })
              
              // Mark this object as detected for 30 seconds (longer period)
              setDetectedObjects(prev => new Set([...prev, objectKey]))
              
              // Auto-remove from detected set after 30 seconds
              setTimeout(() => {
                setDetectedObjects(prev => {
                  const newSet = new Set(prev)
                  newSet.delete(objectKey)
                  return newSet
                })
              }, 30000)
            } else {
              console.log(`⏭️ Object ${objectName} (${category}) already detected with sufficient confidence`)
            }
          } else {
            console.log(`❌ Object ${objectName} failed confidence threshold (${confidence} < ${confidenceThreshold})`)
          }
        })

        // DISABLE TEST DETECTION - Use real YOLO detection only
        // Real YOLO detection should work now

        console.log(`📊 Final newDetections count: ${newDetections.length}`)

        if (newDetections.length > 0) {
          console.log(`📝 Adding ${newDetections.length} detections to UI`)
          
          setDetections(prev => {
            const updated = [...newDetections, ...prev]
            
            // Group by object type and keep only the best detection for each
            const bestDetections = new Map()
            
            updated.forEach(detection => {
              const key = `${detection.object.toLowerCase()}_${detection.category}`
              const existing = bestDetections.get(key)
              
              if (!existing || detection.confidence > existing.confidence) {
                bestDetections.set(key, detection)
              }
            })
            
            // Convert back to array and sort by confidence, keep top 5
            const uniqueDetections = Array.from(bestDetections.values())
              .sort((a, b) => b.confidence - a.confidence)
              .slice(0, 5) // Only show top 5 unique objects
            
            console.log(`🔄 Filtered to ${uniqueDetections.length} unique objects`)
            return uniqueDetections
          })
          
          // Update stats
          setStats(prev => ({
            ...prev,
            detectionCount: prev.detectionCount + newDetections.length,
            avgConfidence: newDetections.reduce((sum, d) => sum + d.confidence, 0) / newDetections.length
          }))

          console.log(`🎯 Detected ${newDetections.length} objects`)
        }
      }

    } catch (error) {
      console.error('🔥 Detection error:', error)
    }
  }, [isActive, confidenceThreshold])

  // Start/stop detection loop
  const toggleDetection = useCallback(() => {
    if (isDetecting) {
      // Stop detection
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current)
        detectionIntervalRef.current = null
      }
      setIsDetecting(false)
      console.log('⏹️ Detection stopped')
    } else {
      // Start detection
      setIsDetecting(true)
      detectionIntervalRef.current = setInterval(captureAndDetect, detectionInterval)
      console.log(`▶️ Detection started (every ${detectionInterval}ms)`)
    }
  }, [isDetecting, captureAndDetect, detectionInterval])

  // Categorize objects based on class name
  const categorizeObject = (className: string): string => {
    const categoryMap: Record<string, string> = {
      'handbag': 'BAGS',
      'backpack': 'BAGS',
      'suitcase': 'BAGS',
      'cell phone': 'ELECTRONICS',
      'laptop': 'ELECTRONICS',
      'keyboard': 'ELECTRONICS',
      'mouse': 'ELECTRONICS',
      'tv': 'ELECTRONICS',
      'book': 'DOCUMENTS',
      'scissors': 'ACCESSORIES',
      'teddy bear': 'TOYS',
      'clock': 'ACCESSORIES',
      'bottle': 'MISCELLANEOUS'
    }
    
    const lowerClass = className.toLowerCase()
    for (const [key, category] of Object.entries(categoryMap)) {
      if (lowerClass.includes(key)) {
        return category
      }
    }
    
    return 'MISCELLANEOUS'
  }

  // Clear detections
  const clearDetections = () => {
    setDetections([])
    setDetectedObjects(new Set())
    setStats(prev => ({ ...prev, detectionCount: 0, avgConfidence: 0 }))
  }

  // Download detection results
  const downloadResults = () => {
    const data = {
      timestamp: new Date().toISOString(),
      stats,
      detections: detections.slice(0, 20) // Latest 20 detections
    }
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `detection-results-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera()
    }
  }, [stopCamera])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Real-Time Object Detection</h2>
        <p className="text-muted-foreground">
          Use your camera to detect lost objects in real-time using AI
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            {error}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Camera View */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Camera className="h-5 w-5" />
                    Live Camera Feed
                  </CardTitle>
                  <CardDescription>
                    {isActive ? 'Camera is active and ready for detection' : 'Click start to begin'}
                  </CardDescription>
                </div>
                <Badge variant={isActive ? 'default' : 'secondary'}>
                  {isActive ? 'LIVE' : 'OFFLINE'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="relative bg-black rounded-lg overflow-hidden">
                <video
                  ref={videoRef}
                  className="w-full h-[400px] object-cover"
                  muted
                  playsInline
                />
                <canvas
                  ref={canvasRef}
                  className="hidden"
                />
                
                {/* Overlay controls */}
                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {!isActive ? (
                      <Button onClick={startCamera} className="gap-2">
                        <Camera className="h-4 w-4" />
                        Start Camera
                      </Button>
                    ) : (
                      <Button onClick={stopCamera} variant="destructive" className="gap-2">
                        <CameraOff className="h-4 w-4" />
                        Stop Camera
                      </Button>
                    )}
                    
                    {isActive && (
                      <Button 
                        onClick={toggleDetection}
                        variant={isDetecting ? 'secondary' : 'default'}
                        className="gap-2"
                      >
                        {isDetecting ? (
                          <>
                            <Square className="h-4 w-4" />
                            Stop Detection
                          </>
                        ) : (
                          <>
                            <Play className="h-4 w-4" />
                            Start Detection
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                  
                  {/* Stats overlay */}
                  {isActive && (
                    <div className="bg-black/75 text-white px-3 py-1 rounded text-sm">
                      {stats.resolution} • {stats.fps} FPS
                    </div>
                  )}
                </div>

                {/* Detection indicator */}
                {isDetecting && (
                  <div className="absolute top-4 right-4">
                    <div className="flex items-center gap-2 bg-green-600 text-white px-3 py-1 rounded-full">
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                      <span className="text-sm font-medium">DETECTING</span>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detection Results */}
        <div className="space-y-4">
          {/* Controls */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Detection Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Detection Interval</label>
                <select
                  value={detectionInterval}
                  onChange={(e) => setDetectionInterval(Number(e.target.value))}
                  className="w-full mt-1 p-2 border rounded-md"
                  disabled={isDetecting}
                >
                  <option value={1000}>1 second</option>
                  <option value={2000}>2 seconds</option>
                  <option value={5000}>5 seconds</option>
                  <option value={10000}>10 seconds</option>
                </select>
              </div>
              
              <div>
                <label className="text-sm font-medium">Confidence Threshold</label>
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="range"
                    min="0.1"
                    max="1"
                    step="0.1"
                    value={confidenceThreshold}
                    onChange={(e) => setConfidenceThreshold(Number(e.target.value))}
                    className="flex-1"
                  />
                  <span className="text-sm w-12">{Math.round(confidenceThreshold * 100)}%</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Detection Stats
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Objects Detected:</span>
                <span className="font-medium">{stats.detectionCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Avg Confidence:</span>
                <span className="font-medium">
                  {stats.avgConfidence > 0 ? `${Math.round(stats.avgConfidence * 100)}%` : '-'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Active Detections:</span>
                <span className="font-medium">{detections.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Objets Non Surveillés:</span>
                <span className="font-medium text-red-600">
                  {detections.filter(d => d.context === 'unattended').length}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Recent Detections */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Recent Detections
                </CardTitle>
                <div className="flex gap-2">
                  {detections.length > 0 && (
                    <>
                      <Button size="sm" variant="outline" onClick={downloadResults}>
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={clearDetections} title="Reset detections">
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-[300px] overflow-y-auto">
                {detections.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Eye className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <div>No detections yet</div>
                    <div className="text-sm">Start detection to see results</div>
                  </div>
                ) : (
                  detections.slice(0, 10).map((detection) => (
                    <div
                      key={detection.id}
                      className="flex items-center gap-3 p-3 border rounded-lg"
                    >
                      {detection.screenshot && (
                        <div className="flex-shrink-0">
                          <img 
                            src={detection.screenshot} 
                            alt={detection.object}
                            className="w-16 h-12 object-cover rounded border"
                          />
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="font-medium flex items-center gap-2">
                          {detection.context === 'unattended' && (
                            <Badge variant="destructive" className="text-xs">
                              🚨 Non surveillé
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          <span>{new Date(detection.timestamp).toLocaleTimeString()}</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default RealTimeDetection