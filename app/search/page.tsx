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
  const [searchMethod, setSearchMethod] = useState<"image" | "location">("location")
  const [location, setLocation] = useState("")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [uploadedImage, setUploadedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
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

  const handleLocationSearch = async () => {
    if (!location.trim() && !dateFrom && !dateTo) return

    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      if (location.trim()) params.append('location', location)
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
        matchScore: 100, // Location search doesn't have match scores
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
      // First, get image features using the detection service
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

      // Then, search using the features
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
    <div className="container mx-auto py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Rechercher un objet perdu</h1>

        <Tabs defaultValue="location" value={searchMethod} onValueChange={(v) => setSearchMethod(v as "image" | "location")}>
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="location">Recherche par lieu et date</TabsTrigger>
            <TabsTrigger value="image">Recherche par image</TabsTrigger>
        </TabsList>

          <TabsContent value="location">
            <Card>
              <CardHeader>
                <CardTitle>
                  <MapPin className="h-5 w-5 inline mr-2" />
                  Recherche par lieu et date
                </CardTitle>
                <CardDescription>
                  Filtrez les objets par lieu et/ou période de temps
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="location">Lieu</Label>
                    <Input
                      id="location"
                      placeholder="Ex: Bibliothèque, Cafétéria, Salle 101..."
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="dateFrom">
                        <Calendar className="h-4 w-4 inline mr-1" />
                        Date de début
                      </Label>
                      <Input
                        id="dateFrom"
                        type="date"
                        value={dateFrom}
                        onChange={(e) => setDateFrom(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="dateTo">
                        <Calendar className="h-4 w-4 inline mr-1" />
                        Date de fin
                      </Label>
                      <Input
                        id="dateTo"
                        type="date"
                        value={dateTo}
                        onChange={(e) => setDateTo(e.target.value)}
                      />
                    </div>
                  </div>
                  <Button onClick={handleLocationSearch} disabled={loading} className="w-full">
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <SearchIcon className="h-4 w-4" />
                    )}
                    <span className="ml-2">Rechercher</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
        </TabsContent>
        
          <TabsContent value="image">
          <Card>
            <CardHeader>
                <CardTitle>Recherche par image</CardTitle>
                <CardDescription>
                  Téléchargez une photo de l'objet que vous recherchez
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                    isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25"
                  }`}
                >
                  <input {...getInputProps()} />
                  {imagePreview ? (
                <div className="space-y-4">
                      <div className="relative h-48 w-full">
                        <Image
                          src={imagePreview}
                          alt="Preview"
                          fill
                          className="object-contain rounded-lg"
                        />
                      </div>
                      <Button onClick={handleImageSearch} disabled={loading}>
                        {loading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <SearchIcon className="h-4 w-4" />
                        )}
                        <span className="ml-2">Rechercher</span>
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <Upload className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          Glissez-déposez une image ici, ou cliquez pour sélectionner
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Formats acceptés: JPG, JPEG, PNG
                        </p>
                  </div>
                  </div>
                  )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {results.length > 0 && (
              <div className="mt-8">
            <h2 className="text-xl font-semibold mb-4">
              Résultats de la recherche ({results.length})
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
              {results.map((result) => (
                <Card key={result.id}>
                  <div className="relative h-48 w-full">
                              <Image
                      src={result.image}
                                alt={result.name}
                                fill
                      className="object-cover rounded-t-lg"
                              />
                    {result.matchScore && (
                      <Badge
                        variant="secondary"
                        className="absolute top-2 right-2"
                      >
                        {Math.round(result.matchScore * 100)}% match
                      </Badge>
                    )}
                            </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold">{result.name}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {result.location}
                                </p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(result.date)}
                          </p>
                    <Badge variant="outline" className="mt-2">
                      {result.category}
                    </Badge>
                  </CardContent>
                      </Card>
                    ))}
                  </div>
          </div>
        )}

        {!loading && results.length === 0 && (location || dateFrom || dateTo) && (
          <div className="mt-8 text-center text-muted-foreground">
            Aucun résultat trouvé pour votre recherche
                </div>
              )}
      </div>
    </div>
  )
}
