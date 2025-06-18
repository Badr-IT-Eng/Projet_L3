"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { 
  Camera, 
  Video, 
  Plus, 
  Edit, 
  Trash2, 
  Play, 
  Pause, 
  Settings, 
  MapPin, 
  Monitor, 
  Activity,
  AlertCircle,
  CheckCircle,
  Clock
} from "lucide-react"
import { useSession } from "next-auth/react"

interface Camera {
  id: string
  name: string
  location: string
  ipAddress: string
  port: number
  status: 'online' | 'offline' | 'maintenance'
  type: 'ip' | 'usb' | 'rtsp'
  isActive: boolean
  detectionEnabled: boolean
  recordingEnabled: boolean
  lastSeen: string
  createdAt: string
}

interface VideoSource {
  id: string
  name: string
  type: 'upload' | 'url' | 'stream'
  source: string
  location: string
  isProcessing: boolean
  processedAt?: string
  detectedObjects: number
}

export default function CameraManagementPage() {
  const { data: session } = useSession()
  const [cameras, setCameras] = useState<Camera[]>([])
  const [videoSources, setVideoSources] = useState<VideoSource[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddingCamera, setIsAddingCamera] = useState(false)
  const [isAddingVideo, setIsAddingVideo] = useState(false)
  const [editingCamera, setEditingCamera] = useState<Camera | null>(null)

  // Camera form state
  const [newCamera, setNewCamera] = useState({
    name: '',
    location: '',
    ipAddress: '',
    port: 8080,
    type: 'ip' as const,
    detectionEnabled: true,
    recordingEnabled: false
  })

  // Video source form state
  const [newVideoSource, setNewVideoSource] = useState({
    name: '',
    type: 'upload' as const,
    source: '',
    location: ''
  })

  useEffect(() => {
    loadCameras()
    loadVideoSources()
  }, [])

  const loadCameras = async () => {
    setLoading(true)
    try {
      // Mock data for demonstration
      const mockCameras: Camera[] = [
        {
          id: '1',
          name: 'Main Entrance Camera',
          location: 'Main Entrance Hall',
          ipAddress: '192.168.1.100',
          port: 8080,
          status: 'online',
          type: 'ip',
          isActive: true,
          detectionEnabled: true,
          recordingEnabled: true,
          lastSeen: new Date().toISOString(),
          createdAt: '2024-01-15T10:00:00Z'
        },
        {
          id: '2',
          name: 'Library Camera',
          location: 'Main Library - Study Area',
          ipAddress: '192.168.1.101',
          port: 8080,
          status: 'online',
          type: 'ip',
          isActive: true,
          detectionEnabled: true,
          recordingEnabled: false,
          lastSeen: new Date().toISOString(),
          createdAt: '2024-01-15T10:30:00Z'
        },
        {
          id: '3',
          name: 'Cafeteria Camera',
          location: 'Student Cafeteria',
          ipAddress: '192.168.1.102',
          port: 8080,
          status: 'offline',
          type: 'ip',
          isActive: false,
          detectionEnabled: false,
          recordingEnabled: false,
          lastSeen: '2024-06-16T10:00:00Z',
          createdAt: '2024-01-15T11:00:00Z'
        }
      ]
      setCameras(mockCameras)
    } catch (error) {
      console.error('Error loading cameras:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadVideoSources = async () => {
    try {
      // Mock data for demonstration
      const mockVideoSources: VideoSource[] = [
        {
          id: '1',
          name: 'Security Footage - June 16',
          type: 'upload',
          source: '/uploads/security_20240616.mp4',
          location: 'Main Entrance',
          isProcessing: false,
          processedAt: '2024-06-16T14:30:00Z',
          detectedObjects: 15
        },
        {
          id: '2',
          name: 'Live Stream - Camera 1',
          type: 'stream',
          source: 'rtmp://192.168.1.100:1935/live/stream1',
          location: 'Main Entrance',
          isProcessing: true,
          detectedObjects: 0
        }
      ]
      setVideoSources(mockVideoSources)
    } catch (error) {
      console.error('Error loading video sources:', error)
    }
  }

  const handleAddCamera = async () => {
    try {
      const camera: Camera = {
        id: Date.now().toString(),
        ...newCamera,
        status: 'offline',
        isActive: false,
        lastSeen: new Date().toISOString(),
        createdAt: new Date().toISOString()
      }
      
      setCameras(prev => [...prev, camera])
      setIsAddingCamera(false)
      setNewCamera({
        name: '',
        location: '',
        ipAddress: '',
        port: 8080,
        type: 'ip',
        detectionEnabled: true,
        recordingEnabled: false
      })
    } catch (error) {
      console.error('Error adding camera:', error)
    }
  }

  const handleAddVideoSource = async () => {
    try {
      const videoSource: VideoSource = {
        id: Date.now().toString(),
        ...newVideoSource,
        isProcessing: false,
        detectedObjects: 0
      }
      
      setVideoSources(prev => [...prev, videoSource])
      setIsAddingVideo(false)
      setNewVideoSource({
        name: '',
        type: 'upload',
        source: '',
        location: ''
      })
    } catch (error) {
      console.error('Error adding video source:', error)
    }
  }

  const toggleCameraStatus = async (cameraId: string) => {
    setCameras(prev => prev.map(camera => 
      camera.id === cameraId 
        ? { 
            ...camera, 
            isActive: !camera.isActive,
            status: !camera.isActive ? 'online' : 'offline',
            lastSeen: new Date().toISOString()
          }
        : camera
    ))
  }

  const toggleDetection = async (cameraId: string) => {
    setCameras(prev => prev.map(camera => 
      camera.id === cameraId 
        ? { ...camera, detectionEnabled: !camera.detectionEnabled }
        : camera
    ))
  }

  const getStatusBadge = (status: Camera['status']) => {
    switch (status) {
      case 'online':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Online</Badge>
      case 'offline':
        return <Badge className="bg-red-100 text-red-800"><AlertCircle className="h-3 w-3 mr-1" />Offline</Badge>
      case 'maintenance':
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3 mr-1" />Maintenance</Badge>
      default:
        return <Badge variant="secondary">Unknown</Badge>
    }
  }

  // Check if user is admin
  if (session?.user?.role !== 'ROLE_ADMIN') {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="text-center py-8">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
            <p className="text-muted-foreground">You need admin privileges to access this page.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-foreground mb-2">Camera & Video Management</h1>
        <p className="text-lg text-muted-foreground">
          Manage surveillance cameras and video sources for the lost and found detection system
        </p>
      </div>

      <Tabs defaultValue="cameras" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md mb-8">
          <TabsTrigger value="cameras" className="flex items-center gap-2">
            <Camera className="h-4 w-4" />
            Cameras
          </TabsTrigger>
          <TabsTrigger value="videos" className="flex items-center gap-2">
            <Video className="h-4 w-4" />
            Video Sources
          </TabsTrigger>
        </TabsList>

        <TabsContent value="cameras">
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold">Camera Management</h2>
              <Dialog open={isAddingCamera} onOpenChange={setIsAddingCamera}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Camera
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Camera</DialogTitle>
                    <DialogDescription>
                      Configure a new surveillance camera for the detection system
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="name" className="text-right">Name</Label>
                      <Input
                        id="name"
                        className="col-span-3"
                        value={newCamera.name}
                        onChange={(e) => setNewCamera(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Main Entrance Camera"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="location" className="text-right">Location</Label>
                      <Input
                        id="location"
                        className="col-span-3"
                        value={newCamera.location}
                        onChange={(e) => setNewCamera(prev => ({ ...prev, location: e.target.value }))}
                        placeholder="Main Entrance Hall"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="type" className="text-right">Type</Label>
                      <Select value={newCamera.type} onValueChange={(value: 'ip' | 'usb' | 'rtsp') => setNewCamera(prev => ({ ...prev, type: value }))}>
                        <SelectTrigger className="col-span-3">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ip">IP Camera</SelectItem>
                          <SelectItem value="usb">USB Camera</SelectItem>
                          <SelectItem value="rtsp">RTSP Stream</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="ip" className="text-right">IP Address</Label>
                      <Input
                        id="ip"
                        className="col-span-3"
                        value={newCamera.ipAddress}
                        onChange={(e) => setNewCamera(prev => ({ ...prev, ipAddress: e.target.value }))}
                        placeholder="192.168.1.100"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="port" className="text-right">Port</Label>
                      <Input
                        id="port"
                        type="number"
                        className="col-span-3"
                        value={newCamera.port}
                        onChange={(e) => setNewCamera(prev => ({ ...prev, port: parseInt(e.target.value) }))}
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label className="text-right">Detection</Label>
                      <div className="col-span-3 flex items-center space-x-2">
                        <Switch
                          checked={newCamera.detectionEnabled}
                          onCheckedChange={(checked) => setNewCamera(prev => ({ ...prev, detectionEnabled: checked }))}
                        />
                        <Label>Enable object detection</Label>
                      </div>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label className="text-right">Recording</Label>
                      <div className="col-span-3 flex items-center space-x-2">
                        <Switch
                          checked={newCamera.recordingEnabled}
                          onCheckedChange={(checked) => setNewCamera(prev => ({ ...prev, recordingEnabled: checked }))}
                        />
                        <Label>Enable recording</Label>
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsAddingCamera(false)}>Cancel</Button>
                    <Button onClick={handleAddCamera}>Add Camera</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Camera Name</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>IP Address</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Detection</TableHead>
                      <TableHead>Recording</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cameras.map((camera) => (
                      <TableRow key={camera.id}>
                        <TableCell className="font-medium">{camera.name}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {camera.location}
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-sm">{camera.ipAddress}:{camera.port}</TableCell>
                        <TableCell>{getStatusBadge(camera.status)}</TableCell>
                        <TableCell>
                          <Switch
                            checked={camera.detectionEnabled}
                            onCheckedChange={() => toggleDetection(camera.id)}
                          />
                        </TableCell>
                        <TableCell>
                          <Switch
                            checked={camera.recordingEnabled}
                            disabled={camera.status === 'offline'}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => toggleCameraStatus(camera.id)}
                            >
                              {camera.isActive ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditingCamera(camera)}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button size="sm" variant="outline">
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="videos">
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold">Video Source Management</h2>
              <Dialog open={isAddingVideo} onOpenChange={setIsAddingVideo}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Video Source
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Video Source</DialogTitle>
                    <DialogDescription>
                      Add a video file or stream for object detection analysis
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="video-name" className="text-right">Name</Label>
                      <Input
                        id="video-name"
                        className="col-span-3"
                        value={newVideoSource.name}
                        onChange={(e) => setNewVideoSource(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Security Footage"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="video-type" className="text-right">Type</Label>
                      <Select value={newVideoSource.type} onValueChange={(value: 'upload' | 'url' | 'stream') => setNewVideoSource(prev => ({ ...prev, type: value }))}>
                        <SelectTrigger className="col-span-3">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="upload">Uploaded File</SelectItem>
                          <SelectItem value="url">Video URL</SelectItem>
                          <SelectItem value="stream">Live Stream</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="video-source" className="text-right">Source</Label>
                      <Input
                        id="video-source"
                        className="col-span-3"
                        value={newVideoSource.source}
                        onChange={(e) => setNewVideoSource(prev => ({ ...prev, source: e.target.value }))}
                        placeholder={newVideoSource.type === 'upload' ? 'Browse file...' : 'Enter URL or stream address'}
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="video-location" className="text-right">Location</Label>
                      <Input
                        id="video-location"
                        className="col-span-3"
                        value={newVideoSource.location}
                        onChange={(e) => setNewVideoSource(prev => ({ ...prev, location: e.target.value }))}
                        placeholder="Main Entrance"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsAddingVideo(false)}>Cancel</Button>
                    <Button onClick={handleAddVideoSource}>Add Video Source</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {videoSources.map((video) => (
                <Card key={video.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="text-lg">{video.name}</span>
                      <Badge variant={video.type === 'stream' ? 'default' : 'secondary'}>
                        {video.type}
                      </Badge>
                    </CardTitle>
                    <CardDescription>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {video.location}
                      </div>
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Status:</span>
                        <span className={video.isProcessing ? 'text-blue-600' : 'text-green-600'}>
                          {video.isProcessing ? 'Processing...' : 'Ready'}
                        </span>
                      </div>
                      {video.detectedObjects > 0 && (
                        <div className="flex justify-between">
                          <span>Objects Detected:</span>
                          <span className="font-medium">{video.detectedObjects}</span>
                        </div>
                      )}
                      {video.processedAt && (
                        <div className="flex justify-between">
                          <span>Processed:</span>
                          <span>{new Date(video.processedAt).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter className="flex gap-2">
                    <Button size="sm" variant="outline">
                      <Play className="h-3 w-3 mr-1" />
                      Process
                    </Button>
                    <Button size="sm" variant="outline">
                      <Monitor className="h-3 w-3 mr-1" />
                      View
                    </Button>
                    <Button size="sm" variant="outline">
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}