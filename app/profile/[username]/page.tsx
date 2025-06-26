"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Package,
  MapPin,
  Clock,
  User,
  Mail,
  Calendar,
  AlertTriangle,
  Loader2,
  ArrowLeft
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { format } from "date-fns"

interface UserProfile {
  username: string
  email?: string
  joinedAt: string
  totalReports: number
  totalFound: number
  totalClaimed: number
}

interface ReportItem {
  id: number
  name: string
  description: string
  category: string
  location: string
  status: string
  imageUrl?: string
  createdAt: string
  reportedByUsername: string
  contactEmail?: string
  contactPhone?: string
}

export default function UserProfilePage() {
  const { username } = useParams()
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [userReports, setUserReports] = useState<ReportItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadUserData = async () => {
      if (!username) return
      
      setLoading(true)
      setError(null)
      
      try {
        // Load user's reports from the backend
        const response = await fetch(`http://localhost:8082/api/items/public/lost?size=100`)
        
        if (response.ok) {
          const data = await response.json()
          const allItems = data.items || []
          
          // Filter items reported by this user
          const userItems = allItems.filter((item: any) => 
            item.reportedByUsername === username ||
            (item.contactEmail && item.contactEmail.split('@')[0] === username)
          )
          
          if (userItems.length === 0) {
            setError(`No reports found for user "${username}"`)
            return
          }
          
          // Transform items to match interface
          const transformedItems: ReportItem[] = userItems.map((item: any) => ({
            id: item.id,
            name: item.name || 'Unnamed Item',
            description: item.description || 'No description',
            category: item.category || 'OTHER',
            location: item.location || 'Unknown Location',
            status: item.status || 'LOST',
            imageUrl: item.imageUrl && item.imageUrl !== 'test.jpg' ? 
              (item.imageUrl.startsWith('http') ? item.imageUrl : `http://localhost:8082${item.imageUrl}`) : 
              '/placeholder.svg',
            createdAt: item.createdAt || item.dateLost || new Date().toISOString(),
            reportedByUsername: item.reportedByUsername || 'Anonymous',
            contactEmail: item.contactEmail,
            contactPhone: item.contactPhone
          }))
          
          setUserReports(transformedItems)
          
          // Create user profile from the first item's data
          const firstItem = userItems[0]
          const userInfo: UserProfile = {
            username: username as string,
            email: firstItem.contactEmail || undefined,
            joinedAt: firstItem.createdAt || new Date().toISOString(),
            totalReports: transformedItems.length,
            totalFound: transformedItems.filter(item => item.status === 'FOUND').length,
            totalClaimed: transformedItems.filter(item => item.status === 'CLAIMED').length
          }
          
          setUserProfile(userInfo)
        } else {
          setError('Failed to load user data')
        }
        
      } catch (err) {
        console.error("Error loading user data:", err)
        setError("Failed to load profile data. Please try again.")
      } finally {
        setLoading(false)
      }
    }
    
    loadUserData()
  }, [username])

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "MMM dd, yyyy")
  }

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "found":
        return <Badge variant="default" className="bg-green-100 text-green-800">Found</Badge>
      case "lost":
        return <Badge variant="destructive">Lost</Badge>
      case "claimed":
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Claimed</Badge>
      case "returned":
        return <Badge variant="default" className="bg-purple-100 text-purple-800">Returned</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
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
      MISCELLANEOUS: "bg-gray-100 text-gray-800",
    }
    return colors[category] || colors.OTHER
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin" />
          <div className="text-lg">Loading profile...</div>
        </div>
      </div>
    )
  }

  if (error || !userProfile) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-2">Profile Not Found</h2>
          <p className="text-muted-foreground mb-4">{error || 'User profile not found'}</p>
          <Link href="/lost-items">
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Lost Items
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Back button */}
      <div className="mb-6">
        <Link href="/lost-items">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Lost Items
          </Button>
        </Link>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarFallback className="text-2xl">
              {userProfile.username.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-3xl font-bold">{userProfile.username}</h1>
            <p className="text-muted-foreground">
              Member since {formatDate(userProfile.joinedAt)}
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reports</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userProfile.totalReports}</div>
            <p className="text-xs text-muted-foreground">
              Items reported
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Items Found</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userProfile.totalFound}</div>
            <p className="text-xs text-muted-foreground">
              Successfully recovered
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {userProfile.totalReports > 0 ? Math.round((userProfile.totalFound / userProfile.totalReports) * 100) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              Recovery success rate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Contact Info */}
      {userProfile.email && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span>{userProfile.email}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* User's Reports */}
      <Card>
        <CardHeader>
          <CardTitle>Reports by {userProfile.username}</CardTitle>
          <CardDescription>
            All items reported by this user
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {userReports.map((item) => (
              <Card key={item.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="aspect-square relative mb-3 rounded-lg overflow-hidden bg-muted">
                    <Image
                      src={item.imageUrl || '/placeholder.svg'}
                      alt={item.name}
                      fill
                      className="object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.src = '/placeholder.svg'
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium truncate">{item.name}</h3>
                      <Badge className={getCategoryColor(item.category)}>
                        {item.category}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {item.description}
                    </p>
                    <div className="flex items-center justify-between">
                      {getStatusBadge(item.status)}
                      <span className="text-xs text-muted-foreground">
                        {formatDate(item.createdAt)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground flex items-center">
                      <MapPin className="h-3 w-3 mr-1" />
                      {item.location}
                    </p>
                    <div className="flex gap-2 mt-2">
                      <Button variant="outline" size="sm" className="flex-1" asChild>
                        <Link href={`/contact/${item.id}`}>
                          View Details
                        </Link>
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1" asChild>
                        <Link href={`/map?highlight=${item.id}`}>
                          <MapPin className="h-3 w-3 mr-1" />
                          Map
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}