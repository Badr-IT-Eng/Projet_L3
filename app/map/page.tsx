"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { MapPin, Search, Layers, List } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import dynamic from "next/dynamic"

// Import MapViewer component dynamically to avoid SSR issues
const MapViewer = dynamic(() => import("@/components/map-viewer"), { ssr: false })

// Default coordinates for items without location data (Marseille, France)
const DEFAULT_COORDINATES = {
  lat: 43.2965, lng: 5.3698 // Marseille coordinates as default
}

// Function to generate realistic coordinates based on location
function generateCoordinatesFromLocation(location: string, index: number): { lat: number; lng: number } {
  const baseCoords = DEFAULT_COORDINATES
  
  // Create location-based coordinate variations
  const locationMap: Record<string, { lat: number; lng: number }> = {
    'library': { lat: baseCoords.lat + 0.001, lng: baseCoords.lng - 0.002 },
    'cafeteria': { lat: baseCoords.lat - 0.001, lng: baseCoords.lng + 0.003 },
    'gym': { lat: baseCoords.lat + 0.002, lng: baseCoords.lng + 0.001 },
    'parking': { lat: baseCoords.lat - 0.002, lng: baseCoords.lng - 0.001 },
    'entrance': { lat: baseCoords.lat + 0.0005, lng: baseCoords.lng - 0.0005 },
    'hall': { lat: baseCoords.lat + 0.0015, lng: baseCoords.lng + 0.002 },
    'lab': { lat: baseCoords.lat - 0.0005, lng: baseCoords.lng - 0.003 },
    'field': { lat: baseCoords.lat + 0.0025, lng: baseCoords.lng - 0.0015 },
    'auditorium': { lat: baseCoords.lat - 0.0015, lng: baseCoords.lng + 0.0005 },
    'office': { lat: baseCoords.lat + 0.0008, lng: baseCoords.lng + 0.0008 },
  }
  
  // Find matching location keyword
  const locationLower = location.toLowerCase()
  for (const [keyword, coords] of Object.entries(locationMap)) {
    if (locationLower.includes(keyword)) {
      return coords
    }
  }
  
  // Generate semi-random coordinates based on index if no match
  const offset = (index * 0.0003) % 0.005
  return {
    lat: baseCoords.lat + (offset * (index % 2 === 0 ? 1 : -1)),
    lng: baseCoords.lng + (offset * (index % 3 === 0 ? 1 : -1))
  }
}

export default function MapPage() {
  const [objects, setObjects] = useState<any[]>([])
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [error, setError] = useState<string | null>(null)
  
  // Fetch real data from the lost objects API
  useEffect(() => {
    const fetchLostObjects = async () => {
      setLoading(true)
      setError(null)
      
      try {
        console.log('🗺️ Fetching lost objects for map...')
        
        const params = new URLSearchParams()
        params.append('size', '100') // Get more items for the map
        if (selectedCategory !== 'all') {
          params.append('category', selectedCategory.toUpperCase())
        }
        if (searchQuery.trim()) {
          params.append('query', searchQuery.trim())
        }
        
        // Temporarily bypass frontend API and call backend directly
        const response = await fetch(`http://localhost:8082/api/items/public/lost?${params.toString()}`)
        
        if (!response.ok) {
          throw new Error(`Failed to fetch objects: ${response.status}`)
        }
        
        const data = await response.json()
        const items = data.items || []  // Backend returns 'items' not 'objects'
        
        console.log(`📍 Loaded ${items.length} items for map`)
        
        // Transform items to include proper coordinates
        const transformedObjects = items.map((item: any, index: number) => {
          let coordinates = { lat: 0, lng: 0, x: 0, y: 0 }
          
          // Use database coordinates if available
          if (item.latitude && item.longitude) {
            coordinates = {
              lat: item.latitude,
              lng: item.longitude,
              x: index * 50 + 100, // Generate x coordinate for compatibility
              y: index * 30 + 120  // Generate y coordinate for compatibility
            }
          }
          // Generate coordinates from location if no coordinates in DB
          else {
            const generated = generateCoordinatesFromLocation(item.location || '', index)
            coordinates = {
              lat: generated.lat,
              lng: generated.lng,
              x: index * 50 + 100, // Generate x coordinate
              y: index * 30 + 120  // Generate y coordinate
            }
          }
          
          return {
            id: item.id,
            name: item.name || 'Unnamed Item',
            location: item.location || 'Unknown Location',
            date: item.createdAt ? item.createdAt.split('T')[0] : new Date().toISOString().split('T')[0],
            image: item.imageUrl || '/placeholder.svg?height=100&width=100',
            category: item.category?.toLowerCase() || 'other',
            coordinates
          }
        })
        
        setObjects(transformedObjects)
        
      } catch (error) {
        console.error('❌ Error fetching lost objects:', error)
        setError(error instanceof Error ? error.message : 'Failed to load map data')
        // Set empty array on error to show empty map
        setObjects([])
      } finally {
        setLoading(false)
      }
    }
    
    fetchLostObjects()
  }, [selectedCategory, searchQuery]) // Refetch when category or search changes
  
  // Filter objects by category and search query
  const filteredObjects = objects.filter(obj => {
    const categoryMatch = selectedCategory === "all" || obj.category === selectedCategory
    const searchMatch = !searchQuery || 
      obj.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      obj.location.toLowerCase().includes(searchQuery.toLowerCase())
    
    return categoryMatch && searchMatch
  })

  return (
    <div className="container py-8">
      <div className="flex flex-col space-y-4">
        <div>
          <h1 className="text-3xl font-bold">Lost Object Map</h1>
          <p className="text-muted-foreground">Locate and track lost items on the map</p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar filters */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Map Filters</CardTitle>
                <CardDescription>Filter items shown on the map</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Category</label>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory} disabled={loading}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      <SelectItem value="bags">Bags</SelectItem>
                      <SelectItem value="electronics">Electronics</SelectItem>
                      <SelectItem value="accessories">Accessories</SelectItem>
                      <SelectItem value="clothing">Clothing</SelectItem>
                      <SelectItem value="documents">Documents</SelectItem>
                      <SelectItem value="jewelry">Jewelry</SelectItem>
                      <SelectItem value="keys">Keys</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Search</label>
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Search by name or location"
                      className="pl-8"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      disabled={loading}
                    />
                  </div>
                </div>
                
                {/* Real-time stats */}
                <div className="pt-2 border-t">
                  <div className="text-sm text-muted-foreground space-y-1">
                    <div className="flex justify-between">
                      <span>Total Items:</span>
                      <span className="font-medium">{objects.length}</span>
                    </div>
                    {loading && (
                      <div className="flex items-center gap-2 text-blue-600">
                        <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                        <span>Loading...</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
              
              <CardFooter>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setSelectedCategory("all")
                    setSearchQuery("")
                  }}
                  disabled={loading}
                >
                  Reset Filters
                </Button>
              </CardFooter>
            </Card>
            
            <div className="mt-4">
              <Card>
                <CardHeader className="p-4">
                  <CardTitle className="text-lg">Found Objects ({filteredObjects.length})</CardTitle>
                </CardHeader>
                <CardContent className="p-4 max-h-[400px] overflow-y-auto">
                  {loading ? (
                    <div className="text-center py-8">
                      <div className="inline-flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                        <span>Loading real data...</span>
                      </div>
                    </div>
                  ) : error ? (
                    <div className="text-center py-8 text-red-600">
                      <div className="space-y-2">
                        <div>Failed to load objects</div>
                        <div className="text-sm text-muted-foreground">{error}</div>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => window.location.reload()}
                        >
                          Retry
                        </Button>
                      </div>
                    </div>
                  ) : filteredObjects.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <div className="space-y-2">
                        <MapPin className="h-8 w-8 mx-auto text-muted-foreground/50" />
                        <div>No objects found matching your criteria</div>
                        <div className="text-sm">Try adjusting your filters</div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {filteredObjects.map((obj) => (
                        <div
                          key={obj.id}
                          className="flex items-center p-2 border rounded-md hover:bg-muted transition cursor-pointer group"
                        >
                          <div className="w-12 h-12 rounded-md mr-3 overflow-hidden bg-gray-100">
                            <img
                              src={obj.image}
                              alt={obj.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement
                                target.src = '/placeholder.svg?height=48&width=48'
                              }}
                            />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium group-hover:text-blue-600 transition-colors">{obj.name}</h4>
                            <div className="flex items-center text-xs text-muted-foreground">
                              <MapPin className="h-3 w-3 mr-1" />
                              {obj.location}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {obj.date}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
          
          {/* Map view */}
          <div className="lg:col-span-3">
            <Tabs defaultValue="map" className="w-full">
              <TabsList>
                <TabsTrigger value="map">
                  <Layers className="h-4 w-4 mr-2" />
                  Map View
                </TabsTrigger>
                <TabsTrigger value="list">
                  <List className="h-4 w-4 mr-2" />
                  List View
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="map">
                <Card>
                  <CardContent className="p-0 relative overflow-hidden">
                    <div className="w-full h-[600px] relative">
                      {loading ? (
                        <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
                          <div className="text-center space-y-4">
                            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                            <div className="text-lg font-medium">Loading Map Data</div>
                            <div className="text-sm text-muted-foreground">Fetching lost objects from database...</div>
                          </div>
                        </div>
                      ) : error ? (
                        <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
                          <div className="text-center space-y-4">
                            <div className="text-red-600">
                              <MapPin className="h-12 w-12 mx-auto mb-2" />
                              <div className="text-lg font-medium">Map Loading Error</div>
                              <div className="text-sm">{error}</div>
                            </div>
                            <Button onClick={() => window.location.reload()}>
                              Retry Loading Map
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <MapViewer objects={filteredObjects} />
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="list">
                <Card>
                  <CardContent>
                    <div className="space-y-4 py-4">
                      {filteredObjects.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          No objects found matching your criteria
                        </div>
                      ) : (
                        filteredObjects.map((obj) => (
                          <Card key={obj.id}>
                            <CardContent className="p-4">
                              <div className="flex flex-col sm:flex-row gap-4">
                                <div className="sm:w-1/4">
                                  <img
                                    src={obj.image}
                                    alt={obj.name}
                                    className="w-full aspect-square object-cover rounded-md"
                                  />
                                </div>
                                <div className="flex-1">
                                  <h3 className="text-lg font-bold">{obj.name}</h3>
                                  <div className="mt-2 space-y-1">
                                    <div className="flex items-center gap-1 text-sm">
                                      <MapPin className="h-4 w-4 text-muted-foreground" />
                                      <span>{obj.location}</span>
                                    </div>
                                    <p className="text-sm">Found on: {obj.date}</p>
                                    <p className="text-sm capitalize">Category: {obj.category}</p>
                                  </div>
                                  <div className="mt-4">
                                    <Button size="sm">View Details</Button>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  )
}
