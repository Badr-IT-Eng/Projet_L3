"use client"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Loader2, Upload, Search as SearchIcon, Image as ImageIcon, MapPin, Calendar } from "lucide-react"
import Image from "next/image"
import { useDropzone } from "react-dropzone"

interface SearchResult {
  id: string;
  name: string;
  location: string;
  date: string;
  image: string;
  matchScore: number;
  category: string;
}

export default function SearchPage() {
  const [searchMethod, setSearchMethod] = useState<"image" | "location" | "text">("text")
  const [searchQuery, setSearchQuery] = useState("")
  const [location, setLocation] = useState("")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [uploadedImage, setUploadedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchHistory, setSearchHistory] = useState<string[]>([])

  const categories = [
    { value: "all", label: "All Categories" },
    { value: "ELECTRONICS", label: "Electronics" },
    { value: "BAGS", label: "Bags & Backpacks" },
    { value: "JEWELRY", label: "Jewelry" },
    { value: "KEYS", label: "Keys" },
    { value: "DOCUMENTS", label: "Documents" },
    { value: "BOOKS", label: "Books" },
    { value: "ACCESSORIES", label: "Accessories" },
    { value: "OTHER", label: "Other" },
  ]

  const locations = [
    { value: "all", label: "All Locations" },
    { value: "Main Library", label: "Main Library" },
    { value: "Student Center", label: "Student Center" },
    { value: "Cafeteria", label: "Cafeteria" },
    { value: "Gym", label: "Gym" },
    { value: "Parking Lot", label: "Parking Lot" },
    { value: "Main Entrance", label: "Main Entrance" },
    { value: "Lecture Halls", label: "Lecture Halls" },
  ]
  
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
    if (!searchQuery.trim() && selectedCategory === "all" && !location && !dateFrom && !dateTo) return

    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      if (searchQuery.trim()) {
        params.append('query', searchQuery)
        // Add to search history
        if (!searchHistory.includes(searchQuery.trim())) {
          setSearchHistory(prev => [searchQuery.trim(), ...prev.slice(0, 4)])
        }
      }
      if (selectedCategory !== "all") params.append('category', selectedCategory)
      if (location && location !== "all") params.append('location', location)
      if (dateFrom) params.append('dateFrom', dateFrom)
      if (dateTo) params.append('dateTo', dateTo)
      
      const response = await fetch(`/api/lost-objects?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error("Failed to search objects")
      }
      
      const data = await response.json()
      setResults(data.objects.map((item: any) => ({
        id: item.id,
        name: item.name,
        location: item.location,
        date: item.date,
        image: item.image,
        matchScore: 100, // Text search doesn't have match scores
        category: item.category
      })))
    } catch (err) {
      console.error("Error searching objects:", err)
      setError("Failed to search objects. Please try again.")
    } finally {
      setLoading(false)
    }
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
    } catch (err) {
      console.error("Error searching with image:", err)
      setError("Failed to search with image. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "long",
      day: "numeric"
    })
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-foreground mb-2">Find Your Lost Item</h1>
        <p className="text-lg text-muted-foreground">
          Search for items using text, location filters, date ranges, or AI-powered image matching
        </p>
      </div>

      <Tabs defaultValue="text" value={searchMethod} onValueChange={(v) => setSearchMethod(v as "image" | "location" | "text")}>
        <TabsList className="grid w-full grid-cols-3 mb-8 max-w-md">
          <TabsTrigger value="text" className="flex items-center gap-2">
            <SearchIcon className="h-4 w-4" />
            Text Search
          </TabsTrigger>
          <TabsTrigger value="location" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Location
          </TabsTrigger>
          <TabsTrigger value="image" className="flex items-center gap-2">
            <ImageIcon className="h-4 w-4" />
            Photo
          </TabsTrigger>
        </TabsList>

        <TabsContent value="text">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <SearchIcon className="h-5 w-5" />
                Text Search
              </CardTitle>
              <CardDescription>
                Search for items by name, description, category, or location
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="search">Search Query</Label>
                  <Input
                    id="search"
                    placeholder="Search for backpack, iPhone, keys, etc..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleTextSearch()}
                  />
                  {searchHistory.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Label className="text-xs text-muted-foreground">Recent searches:</Label>
                      {searchHistory.map((term, index) => (
                        <Badge
                          key={index}
                          variant="outline"
                          className="cursor-pointer text-xs"
                          onClick={() => setSearchQuery(term)}
                        >
                          {term}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <select
                      id="category"
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="w-full p-2 border rounded-md"
                    >
                      {categories.map((cat) => (
                        <option key={cat.value} value={cat.value}>
                          {cat.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <Label htmlFor="location-filter">Location</Label>
                    <select
                      id="location-filter"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="w-full p-2 border rounded-md"
                    >
                      {locations.map((loc) => (
                        <option key={loc.value} value={loc.value}>
                          {loc.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="flex items-end">
                    <Button onClick={handleTextSearch} disabled={loading} className="w-full">
                      {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <SearchIcon className="h-4 w-4 mr-2" />
                      )}
                      Search
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
                    />
                  </div>
                  <div>
                    <Label htmlFor="dateTo">To Date</Label>
                    <Input
                      id="dateTo"
                      type="date"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="location">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Location & Date Search
              </CardTitle>
              <CardDescription>
                Filter items by specific location and time period
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="location-specific">Specific Location</Label>
                  <Input
                    id="location-specific"
                    placeholder="Library, Cafeteria, Room 101..."
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="dateFrom-loc">From Date</Label>
                    <Input
                      id="dateFrom-loc"
                      type="date"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="dateTo-loc">To Date</Label>
                    <Input
                      id="dateTo-loc"
                      type="date"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                    />
                  </div>
                </div>
                <Button onClick={handleTextSearch} disabled={loading} className="w-full">
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <SearchIcon className="h-4 w-4 mr-2" />
                  )}
                  Search by Location & Date
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="image">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5" />
                AI Image Search
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
                          Search Similar Items
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

      {results.length > 0 && (
        <div className="mt-8">
          <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
            <SearchIcon className="h-6 w-6" />
            Search Results ({results.length} items found)
          </h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {results.map((result) => (
              <Card key={result.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="relative h-48 w-full">
                  <Image
                    src={result.image}
                    alt={result.name}
                    fill
                    className="object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.src = "/placeholder.svg"
                    }}
                  />
                  {result.matchScore && result.matchScore < 100 && (
                    <Badge
                      variant="secondary"
                      className="absolute top-2 right-2 bg-white/90"
                    >
                      {Math.round(result.matchScore * 100)}% match
                    </Badge>
                  )}
                  <Badge
                    className="absolute top-2 left-2 bg-white/90 text-gray-800"
                  >
                    {result.category}
                  </Badge>
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-lg mb-2">{result.name}</h3>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      <span>{result.location}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>{formatDate(result.date)}</span>
                    </div>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <Button size="sm" className="flex-1">
                      View Details
                    </Button>
                    <Button size="sm" variant="outline">
                      Contact
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {!loading && results.length === 0 && (searchQuery || location || dateFrom || dateTo || uploadedImage) && (
        <div className="mt-8 text-center py-12">
          <SearchIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Items Found</h3>
          <p className="text-muted-foreground mb-4">
            Try adjusting your search criteria or using different keywords
          </p>
          <Button variant="outline" onClick={() => {
            setSearchQuery("")
            setLocation("")
            setDateFrom("")
            setDateTo("")
            setSelectedCategory("all")
            setImagePreview(null)
            setUploadedImage(null)
            setResults([])
          }}>
            Clear Search
          </Button>
        </div>
      )}
    </div>
  )
}
