"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { PageContainer } from "@/components/page-container"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MapPin, Clock, User, Mail, Phone, MessageCircle, ArrowLeft } from "lucide-react"
import { format } from "date-fns"
import Image from "next/image"
import Link from "next/link"

interface LostItem {
  id: number
  name: string
  description: string
  category: string
  location: string
  dateLost: string
  imageUrl: string
  reportedBy: string
  contactEmail?: string
  contactPhone?: string
  status: string
  createdAt: string
}

export default function ContactPage() {
  const { id } = useParams()
  const [item, setItem] = useState<LostItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (id) {
      fetchItemDetails()
    }
  }, [id])

  const fetchItemDetails = async () => {
    try {
      setLoading(true)
      const response = await fetch(`http://localhost:8082/api/items/public/lost`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch item details: ${response.status}`)
      }

      const data = await response.json()
      const foundItem = data.items?.find((item: any) => item.id === parseInt(id as string))
      
      if (foundItem) {
        setItem({
          id: foundItem.id,
          name: foundItem.name || 'Unnamed Item',
          description: foundItem.description || 'No description available',
          category: foundItem.category || 'OTHER',
          location: foundItem.location || 'Unknown Location',
          dateLost: foundItem.dateLost || foundItem.createdAt,
          imageUrl: foundItem.imageUrl && foundItem.imageUrl !== 'test.jpg' ? 
            (foundItem.imageUrl.startsWith('http') ? foundItem.imageUrl : `http://localhost:8082${foundItem.imageUrl}`) : 
            '/placeholder.svg',
          reportedBy: foundItem.reportedByUsername || 'Anonymous',
          contactEmail: foundItem.contactEmail,
          contactPhone: foundItem.contactPhone,
          status: foundItem.status || 'LOST',
          createdAt: foundItem.createdAt
        })
      } else {
        setError('Item not found')
      }
    } catch (error) {
      console.error('Error fetching item details:', error)
      setError('Failed to load item details')
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

  const handleContactClick = (type: 'email' | 'phone', value: string) => {
    if (type === 'email') {
      const subject = encodeURIComponent(`Found your lost item: ${item?.name}`)
      const body = encodeURIComponent(`Hi,\n\nI found an item that matches your lost item report on RECOVR:\n\nItem: ${item?.name}\nLocation found: \nDate found: ${new Date().toLocaleDateString()}\n\nPlease contact me to arrange pickup.\n\nBest regards`)
      window.location.href = `mailto:${value}?subject=${subject}&body=${body}`
    } else {
      window.location.href = `tel:${value}`
    }
  }

  if (loading) {
    return (
      <PageContainer>
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </PageContainer>
    )
  }

  if (error || !item) {
    return (
      <PageContainer>
        <div className="max-w-2xl mx-auto text-center py-20">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-muted-foreground mb-4">{error || 'Item not found'}</p>
          <Link href="/lost-items">
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Lost Items
            </Button>
          </Link>
        </div>
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      <div className="max-w-4xl mx-auto">
        {/* Back button */}
        <div className="mb-6">
          <Link href="/lost-items">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Lost Items
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Item Image and Details */}
          <Card>
            <div className="aspect-[4/3] relative">
              <Image
                src={item.imageUrl}
                alt={item.name}
                fill
                className="object-cover rounded-t-lg"
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.src = '/placeholder.svg'
                }}
              />
              <div className="absolute top-4 right-4">
                <Badge className={getCategoryColor(item.category)}>
                  {item.category}
                </Badge>
              </div>
              <div className="absolute top-4 left-4">
                <Badge variant="destructive">
                  Lost {getDaysLost(item.dateLost)} days ago
                </Badge>
              </div>
            </div>
            
            <CardHeader>
              <CardTitle className="text-2xl">{item.name}</CardTitle>
              <CardDescription className="text-base max-h-32 overflow-y-auto break-words">
                {item.description}
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-3">
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
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                Contact the Owner
              </CardTitle>
              <CardDescription>
                Found this item? Contact the owner to arrange return.
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {item.contactEmail && (
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Mail className="h-5 w-5 text-blue-600" />
                      <div>
                        <p className="font-medium">Email</p>
                        <p className="text-sm text-muted-foreground">{item.contactEmail}</p>
                      </div>
                    </div>
                    <Button 
                      onClick={() => handleContactClick('email', item.contactEmail!)}
                      size="sm"
                    >
                      Send Email
                    </Button>
                  </div>
                </div>
              )}

              {item.contactPhone && (
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Phone className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="font-medium">Phone</p>
                        <p className="text-sm text-muted-foreground">{item.contactPhone}</p>
                      </div>
                    </div>
                    <Button 
                      onClick={() => handleContactClick('phone', item.contactPhone!)}
                      size="sm"
                      variant="outline"
                    >
                      Call Now
                    </Button>
                  </div>
                </div>
              )}

              {!item.contactEmail && !item.contactPhone && (
                <div className="p-4 border rounded-lg bg-yellow-50">
                  <p className="text-sm text-yellow-700">
                    No contact information available for this item. 
                    You may try contacting the administrator.
                  </p>
                </div>
              )}

              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">💡 Before contacting:</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Make sure you have the correct item</li>
                  <li>• Be prepared to describe where you found it</li>
                  <li>• Arrange to meet in a safe, public location</li>
                  <li>• Be ready to verify ownership details</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageContainer>
  )
}