"use client"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Loader2, Upload, Search as SearchIcon, Image as ImageIcon, MapPin } from "lucide-react"
import Image from "next/image"
import { useDropzone } from "react-dropzone"
import { EnhancedSearchResults } from "@/components/enhanced-search-results"

interface SearchResult {
  id: number;
  name: string;
  location: string;
  date: string;
  image: string;
  matchScore: number;
  category: string;
}

export default function SearchPage() {
  const [searchMethod, setSearchMethod] = useState<"text" | "image">("text")
  const [searchQuery, setSearchQuery] = useState("")
  const [location, setLocation] = useState("")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [uploadedImage, setUploadedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchQuality, setSearchQuality] = useState<string>('high')
  const [topScore, setTopScore] = useState<number>(0)
  
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (file) {
      setUploadedImage(file)
      const reader = new FileReader()
      reader.onload = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png']
    },
    maxFiles: 1,
    multiple: false
  })

  const handleTextSearch = async () => {
    const hasAnyFilter = searchQuery.trim() || location || dateFrom || dateTo;
    if (!hasAnyFilter) return;

    setLoading(true)
    setError(null)

    try {
      const searchData = {
        searchType: "details",
        description: searchQuery.trim() || undefined,
        location: location || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined
      }
      
      // Remove undefined values
      const cleanedData = Object.fromEntries(
        Object.entries(searchData).filter(([_, value]) => value !== undefined)
      )
      
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(cleanedData)
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to search objects")
      }
      
      const data = await response.json()
      setResults(data.results || [])
      setSearchQuality(data.searchQuality || 'medium')
      
    } catch (err) {
      console.error("Error searching objects:", err)
      setError(err instanceof Error ? err.message : "Failed to search objects. Please try again.")
    } finally {
      setLoading(false)
    }
  }
  
  const clearAllFilters = () => {
    setSearchQuery("")
    setLocation("")
    setDateFrom("")
    setDateTo("")
    setImagePreview(null)
    setUploadedImage(null)
    setResults([])
    setError(null)
  }

  const handleImageSearch = async () => {
    if (!uploadedImage) return

    setLoading(true)
    setError(null)

    try {
      // First, extract image features using AI
      const formData = new FormData()
      formData.append("image", uploadedImage)

      const featuresResponse = await fetch("/api/detection/features", {
        method: "POST",
        body: formData
      })

      if (!featuresResponse.ok) {
        throw new Error("Failed to extract image features")
      }
      
      const { features } = await featuresResponse.json()

      // Then, search using the AI-extracted features
      const searchResponse = await fetch("/api/search/image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          features,
          minScore: 0.7 // Minimum similarity score
        })
      })
      
      if (!searchResponse.ok) {
        throw new Error("Failed to search with image")
      }
      
      const data = await searchResponse.json()
      setResults(data.results)
      setSearchQuality(data.searchQuality || 'high')
      setTopScore(data.topScore || 0)
    } catch (err) {
      console.error("Error searching with image:", err)
      setError("Failed to search with image. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-foreground mb-2">Find Your Lost Item</h1>
        <p className="text-lg text-muted-foreground">
          Search for items by name, location, date, or upload a photo for AI-powered matching
        </p>
      </div>

      <Tabs defaultValue="text" value={searchMethod} onValueChange={(v) => setSearchMethod(v as "text" | "image")}>
        <TabsList className="grid w-full grid-cols-2 mb-8 max-w-md">
          <TabsTrigger value="text" className="flex items-center gap-2">
            <SearchIcon className="h-4 w-4" />
            Text Search
          </TabsTrigger>
          <TabsTrigger value="image" className="flex items-center gap-2">
            <ImageIcon className="h-4 w-4" />
            Photo Match
          </TabsTrigger>
        </TabsList>

        <TabsContent value="text">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <SearchIcon className="h-5 w-5" />
                Search by Details
              </CardTitle>
              <CardDescription>
                Search for items by name, location, or date range
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <Label htmlFor="search">Item Name or Description</Label>
                  <Input
                    id="search"
                    placeholder="Search for backpack, iPhone, keys, wallet..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleTextSearch()}
                    className="mt-2"
                  />
                </div>
                
                <div>
                  <Label htmlFor="location">Location</Label>
                  <div className="flex gap-2 mt-2">
                    <Input
                      id="location"
                      placeholder="Library, Cafeteria, Room 101, Parking Lot..."
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="flex-1"
                    />
                    <Button variant="outline" size="icon" title="Location search">
                      <MapPin className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="dateFrom">From Date</Label>
                    <Input
                      id="dateFrom"
                      type="date"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="dateTo">To Date</Label>
                    <Input
                      id="dateTo"
                      type="date"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                      className="mt-2"
                    />
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button onClick={handleTextSearch} disabled={loading} className="flex-1">
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <SearchIcon className="h-4 w-4 mr-2" />
                    )}
                    Search Items
                  </Button>
                  <Button variant="outline" onClick={clearAllFilters}>
                    Clear
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="image">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5" />
                AI Image Matching
              </CardTitle>
              <CardDescription>
                Upload a photo to find visually similar items using AI-powered matching
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                    isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25"
                  }`}
                >
                  <input {...getInputProps()} />
                  {imagePreview ? (
                    <div className="space-y-4">
                      <div className="relative h-48 w-full max-w-sm mx-auto">
                        <Image
                          src={imagePreview}
                          alt="Preview"
                          fill
                          className="object-contain rounded-lg"
                        />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Image uploaded successfully. Click search to find similar items.
                      </p>
                      <div className="flex gap-2 justify-center">
                        <Button onClick={handleImageSearch} disabled={loading}>
                          {loading ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          ) : (
                            <SearchIcon className="h-4 w-4 mr-2" />
                          )}
                          Find Similar Items
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={() => {
                            setImagePreview(null)
                            setUploadedImage(null)
                          }}
                        >
                          Remove Image
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <Upload className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          Drag and drop an image here, or click to select
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Supported formats: JPG, JPEG, PNG (max 10MB)
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                          Our AI will analyze your image and find visually similar items
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {error && (
        <div className="mt-8 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600 flex items-center gap-2">
            <SearchIcon className="h-4 w-4" />
            {error}
          </p>
        </div>
      )}

      {/* Enhanced Search Results */}
      {(results.length > 0 || (!loading && (searchQuery || location || dateFrom || dateTo || uploadedImage))) && (
        <div className="mt-8">
          <EnhancedSearchResults
            results={results}
            totalMatches={results.length}
            searchQuality={searchQuality}
            topScore={topScore}
            isLoading={loading}
          />
        </div>
      )}

      {/* Search Stats */}
      {results.length > 0 && (
        <div className="mt-4 text-center">
          <div className="inline-flex items-center gap-4 text-sm text-muted-foreground">
            <span>{results.length} results found</span>
            <span className="h-1 w-1 bg-muted-foreground rounded-full"></span>
            <span>Quality: {searchQuality}</span>
            {searchQuality !== 'no_matches' && topScore > 0 && (
              <>
                <span className="h-1 w-1 bg-muted-foreground rounded-full"></span>
                <span>Top match: {topScore}%</span>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}