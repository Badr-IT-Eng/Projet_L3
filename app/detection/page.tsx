"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CameraIcon, Play, Pause, RotateCw, Download, Maximize2, Settings, AlertCircle } from "lucide-react"
import Image from "next/image"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/spinner"
import { Webcam } from "@/components/webcam"

// Mock detection results
const MOCK_DETECTIONS = [
  {
    id: 1,
    objectType: "Backpack",
    confidence: 98.2,
    status: "abandoned",
    timeDetected: "10:15:32",
    boundingBox: { x: 120, y: 150, width: 100, height: 120 },
  },
  {
    id: 2,
    objectType: "Smartphone",
    confidence: 95.7,
    status: "moving",
    timeDetected: "10:15:35",
    boundingBox: { x: 320, y: 220, width: 40, height: 80 },
  },
  {
    id: 3,
    objectType: "Laptop",
    confidence: 97.1,
    status: "stationary",
    timeDetected: "10:15:40",
    boundingBox: { x: 450, y: 180, width: 120, height: 80 },
  },
]

interface Detection {
  bbox: number[];
  score: number;
  label: number;
  class_name: string;
  timestamp: string;
}

export default function DetectionPage() {
  const [isPlaying, setIsPlaying] = useState(true)
  const [confidenceThreshold, setConfidenceThreshold] = useState([80])
  const [detectionMode, setDetectionMode] = useState("real-time")
  const [showBoundingBoxes, setShowBoundingBoxes] = useState(true)
  const [showLabels, setShowLabels] = useState(true)
  const [detections, setDetections] = useState<Detection[]>([])
  const [selectedDetection, setSelectedDetection] = useState<Detection | null>(null)
  const [loading, setLoading] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [serviceStatus, setServiceStatus] = useState<'unknown' | 'running' | 'stopped'>('unknown')
  const [cameraActive, setCameraActive] = useState(false)
  const [threshold, setThreshold] = useState(0.6)
  const [cameraLocation, setCameraLocation] = useState('Main Entrance')
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const webcamRef = useRef<HTMLVideoElement>(null)

  // Simulate video feed and detection
  useEffect(() => {
    let animationId
    let frameCount = 0

    const drawVideoFrame = () => {
      const canvas = canvasRef.current
      const ctx = canvas?.getContext("2d")

      if (ctx && isPlaying) {
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height)

        // Draw mock video frame (gray background)
        ctx.fillStyle = "#f3f4f6"
        ctx.fillRect(0, 0, canvas.width, canvas.height)

        // Draw some mock scene elements
        ctx.fillStyle = "#d1d5db"
        ctx.fillRect(50, 150, 200, 100) // Table
        ctx.fillRect(400, 100, 150, 80) // Shelf
        ctx.fillRect(300, 300, 180, 60) // Bench

        // Draw detected objects with bounding boxes
        if (showBoundingBoxes) {
          detections.forEach((detection) => {
            const { x, y, width, height } = detection.bbox
            const isSelected = selectedDetection?.bbox.every((val, index) => Math.abs(val - x) <= width / 2 && Math.abs(val - y) <= height / 2)

            // Draw bounding box
            ctx.strokeStyle =
              detection.class_name === "abandoned"
                ? "#ef4444" // Red for abandoned
                : detection.class_name === "stationary"
                  ? "#f59e0b" // Amber for stationary
                  : "#22c55e" // Green for moving
            ctx.lineWidth = isSelected ? 3 : 2
            ctx.strokeRect(x, y, width, height)

            // Draw semi-transparent background for label
            if (showLabels) {
              ctx.fillStyle = "rgba(0, 0, 0, 0.5)"
              ctx.fillRect(x, y - 20, width, 20)

              // Draw label text
              ctx.fillStyle = "#ffffff"
              ctx.font = "12px sans-serif"
              ctx.fillText(`${detection.class_name}: ${(detection.score * 100).toFixed(1)}%`, x + 5, y - 5)
            }
          })
        }

        // Simulate object movement for the "moving" object
        if (frameCount % 5 === 0) {
          setDetections((prev) =>
            prev.map((det) => {
              if (det.class_name === "moving") {
                return {
                  ...det,
                  bbox: det.bbox.map((val, index) => val + (Math.random() > 0.5 ? 1 : -1) * 2)
                }
              }
              return det
            }),
          )
        }

        frameCount++
      }

      animationId = requestAnimationFrame(drawVideoFrame)
    }

    drawVideoFrame()

    return () => {
      cancelAnimationFrame(animationId)
    }
  }, [isPlaying, detections, showBoundingBoxes, showLabels, selectedDetection])

  // Vérifier l'état du service au chargement de la page
  useEffect(() => {
    checkServiceStatus();
  }, []);

  // Vérifier l'état du service de détection
  const checkServiceStatus = async () => {
    try {
      const response = await fetch('/api/detection');
      const data = await response.json();
      
      if (data.status === 'ok') {
        setServiceStatus('running');
      } else {
        setServiceStatus('stopped');
      }
    } catch (error) {
      console.error('Erreur lors de la vérification du service:', error);
      setServiceStatus('stopped');
    }
  };

  // Démarrer le service de détection
  const startDetectionService = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/detection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          camera: 0,
          location: cameraLocation,
          threshold: threshold,
        }),
      });
      
      const data = await response.json();
      
      if (data.status === 'started') {
        setServiceStatus('running');
        alert('Service de détection démarré avec succès');
      } else {
        alert(`Erreur: ${data.message}`);
      }
    } catch (error) {
      console.error('Erreur lors du démarrage du service:', error);
      alert('Échec du démarrage du service de détection');
    } finally {
      setLoading(false);
    }
  };

  // Arrêter le service de détection
  const stopDetectionService = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/detection', {
        method: 'DELETE',
      });
      
      const data = await response.json();
      
      if (data.status === 'stopped') {
        setServiceStatus('stopped');
        alert('Service de détection arrêté');
      } else {
        alert(`Erreur: ${data.message}`);
      }
    } catch (error) {
      console.error('Erreur lors de l\'arrêt du service:', error);
      alert('Échec de l\'arrêt du service de détection');
    } finally {
      setLoading(false);
    }
  };

  // Gérer le changement de fichier
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      
      // Créer un aperçu de l'image
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  // Analyser une image téléchargée
  const analyzeImage = async () => {
    if (!file) {
      alert('Veuillez sélectionner une image');
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('/api/detection', {
        method: 'PUT',
        body: formData,
      });

      const data = await response.json();
      
      if (data.status === 'success') {
        setDetections(data.detections);
      } else {
        alert(`Erreur: ${data.message}`);
      }
    } catch (error) {
      console.error('Erreur lors de l\'analyse de l\'image:', error);
      alert('Échec de l\'analyse de l\'image');
    } finally {
      setLoading(false);
    }
  };

  // Capturer une image depuis la webcam
  const captureFromWebcam = async () => {
    if (!webcamRef.current || !canvasRef.current) return;

    try {
      const video = webcamRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      if (!context) return;
      
      // Définir les dimensions du canvas
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Dessiner l'image de la vidéo sur le canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Convertir le canvas en Blob
      canvas.toBlob(async (blob) => {
        if (blob) {
          setLoading(true);
          
          // Créer un aperçu
          setImagePreview(canvas.toDataURL('image/jpeg'));
          
          // Créer un fichier à partir du Blob
          const imageFile = new File([blob], 'webcam-capture.jpg', { type: 'image/jpeg' });
          setFile(imageFile);
          
          // Envoyer l'image pour analyse
          const formData = new FormData();
          formData.append('image', imageFile);

          const response = await fetch('/api/detection', {
            method: 'PUT',
            body: formData,
          });

          const data = await response.json();
          
          if (data.status === 'success') {
            setDetections(data.detections);
          } else {
            alert(`Erreur: ${data.message}`);
          }
          
          setLoading(false);
        }
      }, 'image/jpeg');
    } catch (error) {
      console.error('Erreur lors de la capture:', error);
      alert('Échec de la capture depuis la webcam');
      setLoading(false);
    }
  };

  const handleDetectionClick = (detection: Detection) => {
    setSelectedDetection(detection)
  }

  return (
    <div className="container py-8">
      <div className="flex flex-col space-y-6">
        <div className="flex flex-col space-y-2">
          <h1 className="text-3xl font-bold">Object Detection System</h1>
          <p className="text-muted-foreground">
            Real-time monitoring and detection of abandoned objects using computer vision
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Video Feed</CardTitle>
                    <CardDescription>Camera 1 - Main Hall</CardDescription>
                  </div>
                  <Badge variant={isPlaying ? "default" : "outline"} className="ml-auto">
                    {isPlaying ? "LIVE" : "PAUSED"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="relative aspect-video bg-muted">
                  <canvas
                    ref={canvasRef}
                    width={800}
                    height={450}
                    className="w-full h-full"
                    onClick={(e) => {
                      const canvas = canvasRef.current
                      const rect = canvas.getBoundingClientRect()
                      const x = (e.clientX - rect.left) * (canvas.width / rect.width)
                      const y = (e.clientY - rect.top) * (canvas.height / rect.height)

                      // Check if click is inside any bounding box
                      const clicked = detections.find((det) => {
                        const { x: bx, y: by, width, height } = det.bbox
                        return x >= bx && x <= bx + width && y >= by && y <= by + height
                      })

                      if (clicked) {
                        handleDetectionClick(clicked)
                      } else {
                        setSelectedDetection(null)
                      }
                    }}
                  />
                  <video ref={videoRef} className="hidden" />
                </div>
              </CardContent>
              <CardFooter className="flex justify-between p-4">
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setIsPlaying(!isPlaying)}
                    aria-label={isPlaying ? "Pause" : "Play"}
                  >
                    {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  </Button>
                  <Button variant="outline" size="icon" aria-label="Refresh">
                    <RotateCw className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" aria-label="Download">
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" aria-label="Fullscreen">
                    <Maximize2 className="h-4 w-4" />
                  </Button>
                </div>
                <Select defaultValue="camera1">
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select camera" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="camera1">Camera 1 - Main Hall</SelectItem>
                    <SelectItem value="camera2">Camera 2 - Library</SelectItem>
                    <SelectItem value="camera3">Camera 3 - Cafeteria</SelectItem>
                    <SelectItem value="camera4">Camera 4 - Entrance</SelectItem>
                  </SelectContent>
                </Select>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Detection Settings</CardTitle>
                <CardDescription>Configure detection parameters and visualization options</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="real-time" value={detectionMode} onValueChange={setDetectionMode}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="real-time">Real-time Detection</TabsTrigger>
                    <TabsTrigger value="recorded">Recorded Footage</TabsTrigger>
                  </TabsList>
                  <TabsContent value="real-time" className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Label>Confidence Threshold (%)</Label>
                        <span>{confidenceThreshold}%</span>
                      </div>
                      <Slider
                        value={confidenceThreshold}
                        onValueChange={setConfidenceThreshold}
                        min={50}
                        max={100}
                        step={1}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="bounding-boxes"
                          checked={showBoundingBoxes}
                          onCheckedChange={setShowBoundingBoxes}
                        />
                        <Label htmlFor="bounding-boxes">Show Bounding Boxes</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch id="labels" checked={showLabels} onCheckedChange={setShowLabels} />
                        <Label htmlFor="labels">Show Labels</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch id="tracking" defaultChecked />
                        <Label htmlFor="tracking">Enable Object Tracking</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch id="abandoned" defaultChecked />
                        <Label htmlFor="abandoned">Detect Abandoned Objects</Label>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 pt-2">
                      <AlertCircle className="h-4 w-4 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground">
                        Objects are considered abandoned after being stationary for 30 seconds
                      </p>
                    </div>
                  </TabsContent>
                  <TabsContent value="recorded" className="space-y-4 mt-4">
                    <p className="text-sm text-muted-foreground">Upload recorded footage to analyze for lost objects</p>
                    <Button variant="outline" className="w-full">
                      <CameraIcon className="mr-2 h-4 w-4" />
                      Upload Video File
                    </Button>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Detection Results</CardTitle>
                <CardDescription>Objects detected in the current frame</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {detections.length > 0 ? (
                    detections.map((detection) => (
                      <div
                        key={detection.bbox.join(',')}
                        className={`p-3 rounded-lg border ${
                          selectedDetection?.bbox.every((val, index) => Math.abs(val - val) <= detection.bbox[index] / 2) ? "border-primary bg-primary/5" : ""
                        } ${
                          detection.class_name === "abandoned"
                            ? "border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/20"
                            : detection.class_name === "stationary"
                              ? "border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/20"
                              : "border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/20"
                        } cursor-pointer`}
                        onClick={() => handleDetectionClick(detection)}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-medium">{detection.class_name}</div>
                            <div className="text-xs text-muted-foreground">Detected at {detection.timestamp}</div>
                          </div>
                          <Badge
                            variant={
                              detection.class_name === "abandoned"
                                ? "destructive"
                                : detection.class_name === "stationary"
                                  ? "outline"
                                  : "secondary"
                            }
                          >
                            {detection.class_name.toUpperCase()}
                          </Badge>
                        </div>
                        <div className="mt-2 flex justify-between items-center">
                          <div className="text-sm">
                            Confidence: <span className="font-medium">{(detection.score * 100).toFixed(1)}%</span>
                          </div>
                          <Button variant="ghost" size="sm">
                            Details
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <CameraIcon className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                      <p className="text-muted-foreground">No objects detected</p>
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full">
                  View All Detections
                </Button>
              </CardFooter>
            </Card>

            {selectedDetection && (
              <Card>
                <CardHeader>
                  <CardTitle>Object Details</CardTitle>
                  <CardDescription>Information about the selected object</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="aspect-video relative bg-muted rounded-md overflow-hidden">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Image
                          src="/placeholder.svg?height=200&width=300"
                          width={300}
                          height={200}
                          alt="Object thumbnail"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="space-y-1">
                        <p className="text-muted-foreground">Object Type</p>
                        <p className="font-medium">{selectedDetection.class_name}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-muted-foreground">Status</p>
                        <p className="font-medium capitalize">{selectedDetection.class_name === "abandoned" ? "abandoned" : selectedDetection.class_name === "stationary" ? "stationary" : "moving"}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-muted-foreground">Confidence</p>
                        <p className="font-medium">{(selectedDetection.score * 100).toFixed(1)}%</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-muted-foreground">Time Detected</p>
                        <p className="font-medium">{selectedDetection.timestamp}</p>
                      </div>
                    </div>

                    <div className="pt-2 flex justify-between">
                      <Button variant="outline" size="sm">
                        <Download className="mr-2 h-4 w-4" />
                        Save Image
                      </Button>
                      <Button size="sm">
                        <Settings className="mr-2 h-4 w-4" />
                        Process Object
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        <Card className="p-4">
          <h2 className="text-xl font-semibold mb-4">Service de détection</h2>
          
          <div className="flex flex-col space-y-4">
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${
                serviceStatus === 'running' ? 'bg-green-500' : 
                serviceStatus === 'stopped' ? 'bg-red-500' : 'bg-yellow-500'
              }`}></div>
              <span>
                {serviceStatus === 'running' ? 'Service actif' : 
                 serviceStatus === 'stopped' ? 'Service arrêté' : 'État inconnu'}
              </span>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="camera-location">Emplacement de la caméra</Label>
              <Input 
                id="camera-location" 
                value={cameraLocation} 
                onChange={(e) => setCameraLocation(e.target.value)} 
                placeholder="Ex: Entrée principale"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="threshold">Seuil de confiance: {threshold}</Label>
              <Slider 
                id="threshold"
                value={[threshold]} 
                min={0.1} 
                max={1.0} 
                step={0.05}
                onValueChange={(value) => setThreshold(value[0])}
              />
            </div>
            
            <div className="flex space-x-2">
              <Button 
                onClick={startDetectionService} 
                disabled={loading || serviceStatus === 'running'}
              >
                {loading ? <Spinner /> : 'Démarrer le service'}
              </Button>
              <Button 
                onClick={stopDetectionService} 
                disabled={loading || serviceStatus === 'stopped'} 
                variant="destructive"
              >
                {loading ? <Spinner /> : 'Arrêter le service'}
              </Button>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <h2 className="text-xl font-semibold mb-4">Détections</h2>
          {detections.length === 0 ? (
            <div className="text-center py-4 text-gray-500">
              Aucune détection à afficher
            </div>
          ) : (
            <div className="overflow-y-auto max-h-60">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="py-2">Objet</th>
                    <th className="py-2">Confiance</th>
                  </tr>
                </thead>
                <tbody>
                  {detections.map((detection, index) => (
                    <tr key={index} className="border-t">
                      <td className="py-2">{detection.class_name}</td>
                      <td className="py-2">{(detection.score * 100).toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
      
      <Tabs defaultValue="upload" className="w-full mt-8">
        <TabsList className="mb-4">
          <TabsTrigger value="upload">Télécharger une image</TabsTrigger>
          <TabsTrigger value="webcam">Utiliser la webcam</TabsTrigger>
        </TabsList>
        
        <TabsContent value="upload">
          <Card className="p-4">
            <div className="flex flex-col space-y-4">
              <Input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
              />
              
              <Button onClick={analyzeImage} disabled={!file || loading}>
                {loading ? <Spinner /> : 'Analyser l\'image'}
              </Button>
            </div>
          </Card>
        </TabsContent>
        
        <TabsContent value="webcam">
          <Card className="p-4">
            <div className="flex flex-col space-y-4">
              {cameraActive ? (
                <div className="relative">
                  <video
                    ref={webcamRef}
                    autoPlay
                    playsInline
                    className="w-full rounded"
                  />
                  <Button
                    className="absolute top-2 right-2"
                    onClick={() => setCameraActive(false)}
                    variant="destructive"
                  >
                    Arrêter la caméra
                  </Button>
                </div>
              ) : (
                <Button onClick={() => setCameraActive(true)}>
                  Démarrer la caméra
                </Button>
              )}
              
              <Button
                onClick={captureFromWebcam}
                disabled={!cameraActive || loading}
              >
                {loading ? <Spinner /> : 'Capturer et analyser'}
              </Button>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
      
      {imagePreview && (
        <Card className="p-4 mt-6">
          <h2 className="text-xl font-semibold mb-4">Résultat</h2>
          <div className="relative">
            <canvas ref={canvasRef} className="w-full rounded" />
          </div>
        </Card>
      )}
      
      {/* Canvas caché pour la capture webcam */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  )
}
