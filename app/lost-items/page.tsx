"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, Clock, User, AlertTriangle } from "lucide-react"
import { format } from "date-fns"
import Image from "next/image"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface LostItem {
  id: number
  name: string
  description: string
  category: string
  location: string
  dateLost: string
  imageUrl: string
  reportedBy: string
  contactInfo: string
  reward?: string
  status: string
}

export default function LostItemsPage() {
  const [lostItems, setLostItems] = useState<LostItem[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)

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


  useEffect(() => {
    fetchLostItems()
  }, [selectedCategory, currentPage])

  const fetchLostItems = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        size: "12",
        // Remove status filter to show all items
      })

      if (selectedCategory !== "all") params.append("category", selectedCategory)

      const response = await fetch(`/api/lost-objects?${params}`)
      if (response.ok) {
        const data = await response.json()
        // Transform the data to match our interface
        const transformedItems = data.objects?.map((item: any) => ({
          id: item.id,
          name: item.name || "Unknown Item",
          description: item.description || "No description available",
          category: item.category || "OTHER",
          location: item.location || "Unknown Location",
          dateLost: item.date || new Date().toISOString().split('T')[0],
          imageUrl: item.image || "/placeholder.svg",
          reportedBy: item.reportedBy || "Anonymous",
          contactInfo: item.contactInfo || "No contact info",
          reward: item.reward,
          status: item.status || "LOST"
        })) || []
        
        setLostItems(transformedItems)
        setTotalPages(data.totalPages || 0)
      }
    } catch (error) {
      console.error("Error fetching lost items:", error)
      setLostItems([])
    } finally {
      setLoading(false)
    }
  }


  const getDaysLost = (dateLost: string) => {
    const lostDate = new Date(dateLost)
    const today = new Date()
    const diffTime = Math.abs(today.getTime() - lostDate.getTime())
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      ELECTRONICS: "bg-blue-100 text-blue-800",
      BAGS: "bg-green-100 text-green-800",
      JEWELRY: "bg-purple-100 text-purple-800",
      KEYS: "bg-yellow-100 text-yellow-800",
      DOCUMENTS: "bg-red-100 text-red-800",
      BOOKS: "bg-orange-100 text-orange-800",
      ACCESSORIES: "bg-pink-100 text-pink-800",
      OTHER: "bg-gray-100 text-gray-800",
    }
    return colors[category] || colors.OTHER
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-foreground mb-2">Lost Items</h1>
        <p className="text-lg text-muted-foreground">
          Browse items that people have lost and are looking for. Use the "Find Items" page to search for specific items.
        </p>
      </div>

      {/* Quick Filter Section */}
      <div className="mb-6 flex flex-wrap gap-2">
        <Button 
          variant={selectedCategory === "all" ? "default" : "outline"} 
          onClick={() => setSelectedCategory("all")}
          size="sm"
        >
          All Categories
        </Button>
        {categories.slice(1).map((category) => (
          <Button
            key={category.value}
            variant={selectedCategory === category.value ? "default" : "outline"}
            onClick={() => setSelectedCategory(category.value)}
            size="sm"
          >
            {category.label}
          </Button>
        ))}
      </div>

      {/* Results Section */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <>
          <div className="mb-6">
            <p className="text-sm text-muted-foreground">
              Found {lostItems.length} lost items
            </p>
          </div>

          {lostItems.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Lost Items Found</h3>
                <p className="text-muted-foreground">
                  Try adjusting your search criteria or check back later for new reports.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {lostItems.map((item) => (
                <Card key={item.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="aspect-square relative">
                    <Image
                      src={item.imageUrl}
                      alt={item.name}
                      fill
                      className="object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.src = "/placeholder.svg"
                      }}
                    />
                    <div className="absolute top-2 right-2">
                      <Badge className={getCategoryColor(item.category)}>
                        {item.category}
                      </Badge>
                    </div>
                    <div className="absolute top-2 left-2">
                      <Badge variant="destructive">
                        Lost {getDaysLost(item.dateLost)} days ago
                      </Badge>
                    </div>
                  </div>
                  
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg font-semibold line-clamp-1">
                      {item.name}
                    </CardTitle>
                    <CardDescription className="line-clamp-2">
                      {item.description}
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="pt-0">
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        <span>{item.location}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>Lost on {format(new Date(item.dateLost), "MMM dd, yyyy")}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <User className="h-4 w-4" />
                        <span>Reported by {item.reportedBy}</span>
                      </div>
                      {item.reward && (
                        <div className="mt-2">
                          <Badge variant="secondary" className="bg-green-100 text-green-800">
                            Reward: {item.reward}
                          </Badge>
                        </div>
                      )}
                    </div>
                  </CardContent>
                  
                  <CardFooter className="pt-0">
                    <Link href={`/report?found=${item.id}`} className="w-full">
                      <Button className="w-full" variant="outline">
                        I Found This Item
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-8">
              <Button
                variant="outline"
                onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                disabled={currentPage === 0}
              >
                Previous
              </Button>
              <span className="px-4 py-2 text-sm">
                Page {currentPage + 1} of {totalPages}
              </span>
              <Button
                variant="outline"
                onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
                disabled={currentPage >= totalPages - 1}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}