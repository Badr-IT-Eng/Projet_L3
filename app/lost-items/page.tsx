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
  const itemsPerPage = 12

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
    try {
      setLoading(true);
      let url = `http://localhost:8082/api/items/public/lost?page=${currentPage}&size=${itemsPerPage}`;
      
      // Add category filter if not "all"
      if (selectedCategory !== "all") {
        url += `&category=${encodeURIComponent(selectedCategory)}`;
      }
      
      console.log('🔗 Fetching from URL:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        mode: 'cors'
      });

      console.log('📡 Response status:', response.status);
      console.log('📡 Response headers:', response.headers);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('📦 Response data:', data);
      
      // Using direct backend call, so data.items contains the array
      const objectsArray = data.items || [];
      
      // Transform the data to match the existing LostItem interface
      const transformedItems = objectsArray.map((item: any) => ({
        id: item.id,
        name: item.name || 'Unnamed Item',
        description: item.description || 'No description available',
        category: item.category ? item.category.toUpperCase() : 'OTHER',
        location: item.location || 'Unknown Location',
        dateLost: item.dateLost || item.dateFound || item.reportedAt || item.createdAt || item.date || new Date().toISOString().split('T')[0],
        imageUrl: (() => {
          const imgUrl = item.imageUrl || item.image;
          if (!imgUrl || imgUrl === 'test.jpg' || imgUrl === null || imgUrl === 'null') {
            return '/placeholder.svg';
          }
          
          // If it's already a full URL, return as is
          if (imgUrl.startsWith('http')) {
            return imgUrl;
          }
          
          // If it's a relative path starting with /, prepend backend URL
          if (imgUrl.startsWith('/')) {
            return `http://localhost:8082${imgUrl}`;
          }
          
          // For other cases (like just filenames), treat as API endpoint
          return `http://localhost:8082/api/files/${imgUrl}`;
        })(),
        reportedBy: item.reportedByUsername || 'Anonymous',
        contactInfo: 'No contact info',
        reward: undefined,
        status: item.status || 'LOST'
      }));

      setLostItems(transformedItems);
      setTotalPages(data.totalPages || data.totalPages || 1);
    } catch (error) {
      console.error('❌ Error fetching lost items:', error);
      console.error('❌ Error details:', {
        message: error.message,
        stack: error.stack,
        url: `http://localhost:8082/api/items/public/lost?page=${currentPage}&size=${itemsPerPage}`
      });
      setLostItems([]);
    } finally {
      setLoading(false);
    }
  };


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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {lostItems.map((item) => {
                // Validate and sanitize image URL
                const getValidImageUrl = (url: string) => {
                  if (!url || url === 'null' || url === 'undefined') {
                    // Return category-specific placeholder
                    return getCategoryPlaceholder(item.category);
                  }
                  if (url === "/placeholder.svg") return url;
                  try {
                    // Test if it's a valid URL
                    new URL(url);
                    return url;
                  } catch {
                    // If not a valid URL, check if it's a relative path
                    if (url.startsWith("/") || url.startsWith("http")) {
                      return url;
                    }
                    return getCategoryPlaceholder(item.category);
                  }
                };

                const getCategoryPlaceholder = (category: string) => {
                  const placeholders: { [key: string]: string } = {
                    'ELECTRONICS': '/ai-analysis.jpg',
                    'BAGS': '/handover.jpg', 
                    'JEWELRY': '/matching-results.jpg',
                    'KEYS': '/recover-step.jpg',
                    'DOCUMENTS': '/report-detail.jpg',
                    'BOOKS': '/mobile-upload.jpg',
                    'ACCESSORIES': '/matching-step.jpg',
                    'OTHER': '/placeholder.jpg'
                  };
                  return placeholders[category] || placeholders['OTHER'];
                };

                const validImageUrl = getValidImageUrl(item.imageUrl);

                return (
                  <Card key={item.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="aspect-[4/3] relative">
                      <Image
                        src={validImageUrl}
                        alt={item.name}
                        fill
                        className="object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.src = getCategoryPlaceholder(item.category)
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
                  
                  <CardHeader className="pb-3 px-6 pt-4">
                    <CardTitle className="text-xl font-semibold line-clamp-1">
                      {item.name}
                    </CardTitle>
                    <CardDescription className="line-clamp-2 text-base">
                      {item.description}
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="pt-0 px-6">
                    <div className="space-y-3 text-sm">
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
                  
                  <CardFooter className="pt-2 px-6 pb-6">
                    <Link href={`/report?found=${item.id}`} className="w-full">
                      <Button className="w-full h-11" variant="outline">
                        I Found This Item
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>
              );
              })}
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