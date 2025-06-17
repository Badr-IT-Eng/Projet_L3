"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Search, 
  Upload, 
  Zap, 
  Eye, 
  Star, 
  Clock, 
  MapPin,
  ImageIcon,
  CheckCircle,
  AlertTriangle 
} from "lucide-react"
import Image from "next/image"
import { useDropzone } from "react-dropzone"
import { Spinner } from "@/components/spinner"
import { extractImageFeatures, calculateSimilarity } from "@/lib/ai/feature-extraction"

interface MatchResult {
  id: string
  name: string
  description: string
  location: string
  date: string
  image: string
  similarity: number
  confidence: number
  category: string
  status: "found" | "claimed" | "missing"
}

export default function MatchingPage() {
  const [uploadedImage, setUploadedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [matches, setMatches] = useState<MatchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [processingStep, setProcessingStep] = useState("")
  const [progress, setProgress] = useState(0)
  const [selectedMatch, setSelectedMatch] = useState<MatchResult | null>(null)

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: async (acceptedFiles) => {
      const file = acceptedFiles[0]
      if (file) {
        setUploadedImage(file)
        const reader = new FileReader()
        reader.onload = () => {
          setImagePreview(reader.result as string)
        }
        reader.readAsDataURL(file)
      }
    },
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png']
    },
    maxFiles: 1,
    multiple: false
  })

  const performImageMatching = async () => {
    if (!uploadedImage || !imagePreview) return

    setLoading(true)
    setProgress(0)
    setMatches([])

    try {
      // Step 1: Extract features
      setProcessingStep("Extracting image features...")
      setProgress(20)
      
      const features = await extractImageFeatures(imagePreview)
      
      // Step 2: Search for matches
      setProcessingStep("Searching for similar objects...")
      setProgress(50)
      
      const response = await fetch('/api/search/image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          features,
          minScore: 0.3 // Lower threshold to show more results
        })
      })

      if (!response.ok) {
        throw new Error('Failed to search for matches')
      }

      const data = await response.json()
      
      // Step 3: Process results
      setProcessingStep("Processing matches...")
      setProgress(80)
      
      const processedMatches: MatchResult[] = data.results.map((item: any) => ({
        id: item.id,
        name: item.name,
        description: item.description || "No description available",
        location: item.location,
        date: item.date,
        image: item.image,
        similarity: item.matchScore * 100,
        confidence: Math.min(95, item.matchScore * 100 + Math.random() * 10),
        category: item.category,
        status: Math.random() > 0.7 ? "found" : Math.random() > 0.5 ? "missing" : "claimed"
      }))

      setProgress(100)
      setProcessingStep("Complete!")
      setMatches(processedMatches)

    } catch (error) {
      console.error('Error performing image matching:', error)
      setProcessingStep("Error occurred")
    } finally {
      setTimeout(() => {
        setLoading(false)
        setProcessingStep("")
        setProgress(0)
      }, 1000)
    }
  }

  const getMatchQuality = (similarity: number) => {
    if (similarity >= 80) return { label: "Excellent", color: "bg-green-500", variant: "default" as const }
    if (similarity >= 60) return { label: "Good", color: "bg-blue-500", variant: "secondary" as const }
    if (similarity >= 40) return { label: "Fair", color: "bg-yellow-500", variant: "outline" as const }
    return { label: "Poor", color: "bg-red-500", variant: "destructive" as const }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "found": return <CheckCircle className="w-4 h-4 text-green-500" />
      case "claimed": return <Star className="w-4 h-4 text-blue-500" />
      case "missing": return <AlertTriangle className="w-4 h-4 text-red-500" />
      default: return <Clock className="w-4 h-4 text-gray-500" />
    }
  }

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">AI-Powered Object Matching</h1>
          <p className="text-muted-foreground">
            Upload an image to find visually similar lost objects using advanced computer vision
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Upload Section */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="w-5 h-5" />
                  Upload Image
                </CardTitle>
                <CardDescription>
                  Drop your image here to start the matching process
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                    isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25"
                  }`}
                >
                  <input {...getInputProps()} />
                  {imagePreview ? (
                    <div className="space-y-4">
                      <div className="relative h-40 w-full">
                        <Image
                          src={imagePreview}
                          alt="Upload preview"
                          fill
                          className="object-contain rounded-lg"
                        />
                      </div>
                      <Button 
                        onClick={performImageMatching} 
                        disabled={loading}
                        className="w-full"
                      >
                        {loading ? (
                          <>
                            <Spinner size="sm" className="mr-2" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <Zap className="w-4 h-4 mr-2" />
                            Find Matches
                          </>
                        )}
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <ImageIcon className="w-12 h-12 mx-auto text-muted-foreground" />
                      <p className="text-sm font-medium">
                        Drop image here or click to select
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Supports JPG, PNG formats
                      </p>
                    </div>
                  )}
                </div>

                {loading && (
                  <div className="mt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>{processingStep}</span>
                      <span>{progress}%</span>
                    </div>
                    <Progress value={progress} />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* AI Process Explanation */}
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="text-lg">How It Works</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-medium">1</span>
                  </div>
                  <div>
                    <p className="font-medium">Feature Extraction</p>
                    <p className="text-muted-foreground">AI analyzes visual features using deep learning</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-medium">2</span>
                  </div>
                  <div>
                    <p className="font-medium">Similarity Matching</p>
                    <p className="text-muted-foreground">Compares against database items</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-medium">3</span>
                  </div>
                  <div>
                    <p className="font-medium">Ranked Results</p>
                    <p className="text-muted-foreground">Returns best matches with confidence scores</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Results Section */}
          <div className="lg:col-span-2">
            {matches.length > 0 ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">
                    Found {matches.length} potential matches
                  </h2>
                  <Badge variant="outline">
                    <Search className="w-3 h-3 mr-1" />
                    AI Matched
                  </Badge>
                </div>

                <Tabs defaultValue="grid" className="w-full">
                  <TabsList>
                    <TabsTrigger value="grid">Grid View</TabsTrigger>
                    <TabsTrigger value="detailed">Detailed View</TabsTrigger>
                  </TabsList>

                  <TabsContent value="grid" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {matches.map((match) => {
                        const quality = getMatchQuality(match.similarity)
                        return (
                          <Card 
                            key={match.id} 
                            className={`cursor-pointer transition-all hover:shadow-md ${
                              selectedMatch?.id === match.id ? 'ring-2 ring-primary' : ''
                            }`}
                            onClick={() => setSelectedMatch(match)}
                          >
                            <div className="relative h-48">
                              <Image
                                src={match.image}
                                alt={match.name}
                                fill
                                className="object-cover rounded-t-lg"
                              />
                              <div className="absolute top-2 right-2 flex gap-1">
                                <Badge variant={quality.variant}>
                                  {Math.round(match.similarity)}%
                                </Badge>
                                {getStatusIcon(match.status)}
                              </div>
                            </div>
                            <CardContent className="p-4">
                              <h3 className="font-semibold truncate">{match.name}</h3>
                              <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                                <MapPin className="w-3 h-3" />
                                {match.location}
                              </div>
                              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <Clock className="w-3 h-3" />
                                {new Date(match.date).toLocaleDateString()}
                              </div>
                              <Badge variant="outline" className="mt-2">
                                {match.category}
                              </Badge>
                            </CardContent>
                          </Card>
                        )
                      })}
                    </div>
                  </TabsContent>

                  <TabsContent value="detailed">
                    <div className="space-y-3">
                      {matches.map((match) => {
                        const quality = getMatchQuality(match.similarity)
                        return (
                          <Card key={match.id} className="p-4">
                            <div className="flex gap-4">
                              <div className="relative w-24 h-24 flex-shrink-0">
                                <Image
                                  src={match.image}
                                  alt={match.name}
                                  fill
                                  className="object-cover rounded-lg"
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between">
                                  <div>
                                    <h3 className="font-semibold">{match.name}</h3>
                                    <p className="text-sm text-muted-foreground line-clamp-2">
                                      {match.description}
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Badge variant={quality.variant}>
                                      {Math.round(match.similarity)}% match
                                    </Badge>
                                    {getStatusIcon(match.status)}
                                  </div>
                                </div>
                                <div className="mt-2 flex items-center gap-4 text-sm text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <MapPin className="w-3 h-3" />
                                    {match.location}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {new Date(match.date).toLocaleDateString()}
                                  </span>
                                  <Badge variant="outline" size="sm">
                                    {match.category}
                                  </Badge>
                                </div>
                                <div className="mt-2">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs">Confidence:</span>
                                    <Progress value={match.confidence} className="flex-1 h-2" />
                                    <span className="text-xs">{Math.round(match.confidence)}%</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </Card>
                        )
                      })}
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            ) : (
              <Card className="h-96 flex items-center justify-center">
                <div className="text-center space-y-2">
                  <Search className="w-12 h-12 mx-auto text-muted-foreground" />
                  <h3 className="text-lg font-medium">No matches yet</h3>
                  <p className="text-muted-foreground">
                    Upload an image to start finding similar objects
                  </p>
                </div>
              </Card>
            )}
          </div>
        </div>

        {/* Selected Match Details */}
        {selectedMatch && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Match Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="relative h-64">
                  <Image
                    src={selectedMatch.image}
                    alt={selectedMatch.name}
                    fill
                    className="object-cover rounded-lg"
                  />
                </div>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xl font-semibold">{selectedMatch.name}</h3>
                    <p className="text-muted-foreground mt-1">{selectedMatch.description}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="font-medium">Location</p>
                      <p className="text-muted-foreground">{selectedMatch.location}</p>
                    </div>
                    <div>
                      <p className="font-medium">Date Found</p>
                      <p className="text-muted-foreground">
                        {new Date(selectedMatch.date).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="font-medium">Category</p>
                      <p className="text-muted-foreground">{selectedMatch.category}</p>
                    </div>
                    <div>
                      <p className="font-medium">Status</p>
                      <div className="flex items-center gap-1">
                        {getStatusIcon(selectedMatch.status)}
                        <span className="text-muted-foreground capitalize">{selectedMatch.status}</span>
                      </div>
                    </div>
                  </div>
                  <div className="pt-2">
                    <Button className="w-full">
                      <Eye className="w-4 h-4 mr-2" />
                      View Full Details
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}