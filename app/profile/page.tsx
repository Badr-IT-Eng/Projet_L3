"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Package,
  MapPin,
  Clock,
  Eye,
  Edit,
  Save,
  X,
  User,
  Mail,
  Phone,
  Calendar,
  Activity,
  CheckCircle,
  AlertTriangle,
  Loader2,
  Settings
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"

interface UserProfile {
  id: string
  name: string
  email: string
  phone?: string
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
  updatedAt: string
  reportedByUsername: string
  contactEmail?: string
  contactPhone?: string
}

export default function ProfilePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("info")
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [userReports, setUserReports] = useState<ReportItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingProfile, setEditingProfile] = useState(false)
  const [editedProfile, setEditedProfile] = useState<Partial<UserProfile>>({})

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin")
    }
  }, [status, router])

  useEffect(() => {
    const loadUserData = async () => {
      if (!session) return
      
      setLoading(true)
      setError(null)
      
      try {
        // Load user profile info
        const userInfo: UserProfile = {
          id: session.user.id || "1",
          name: session.user.name || "User",
          email: session.user.email || "user@example.com",
          phone: session.user.phone || "",
          joinedAt: "2024-01-01", // Default join date
          totalReports: 0,
          totalFound: 0,
          totalClaimed: 0
        }
        
        // Load user's reports from the backend
        const response = await fetch(`http://localhost:8082/api/items/public/lost?size=100`)
        
        if (response.ok) {
          const data = await response.json()
          const allItems = data.items || []
          
          // Filter items reported by this user
          const userItems = allItems.filter((item: any) => 
            item.reportedByUsername === session.user.name ||
            item.contactEmail === session.user.email
          )
          
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
            updatedAt: item.updatedAt || item.createdAt || new Date().toISOString(),
            reportedByUsername: item.reportedByUsername || 'Anonymous',
            contactEmail: item.contactEmail,
            contactPhone: item.contactPhone
          }))
          
          setUserReports(transformedItems)
          
          // Update user profile stats
          userInfo.totalReports = transformedItems.length
          userInfo.totalFound = transformedItems.filter(item => item.status === 'FOUND').length
          userInfo.totalClaimed = transformedItems.filter(item => item.status === 'CLAIMED').length
        }
        
        setUserProfile(userInfo)
        setEditedProfile(userInfo)
        
      } catch (err) {
        console.error("Error loading user data:", err)
        setError("Failed to load profile data. Please try again.")
      } finally {
        setLoading(false)
      }
    }
    
    loadUserData()
  }, [session])

  const handleEditProfile = () => {
    setEditingProfile(true)
    setEditedProfile({ ...userProfile })
  }

  const handleSaveProfile = () => {
    if (userProfile && editedProfile) {
      setUserProfile({ ...userProfile, ...editedProfile })
      setEditingProfile(false)
    }
  }

  const handleCancelEdit = () => {
    setEditingProfile(false)
    setEditedProfile({ ...userProfile })
  }

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
    }
    return colors[category] || colors.OTHER
  }

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin" />
          <div className="text-lg">Loading profile...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-2">Error</h2>
          <p className="text-muted-foreground">{error}</p>
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={() => window.location.reload()}
          >
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  if (!userProfile) {
    return null
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">User Profile</h1>
          <p className="text-muted-foreground">
            Manage your profile and view your report history
          </p>
        </div>
        <Button asChild>
          <Link href="/report">
            <Package className="h-4 w-4 mr-2" />
            Report Item
          </Link>
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="info">Profile Info</TabsTrigger>
          <TabsTrigger value="reports">My Reports</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="space-y-6">
          {/* Profile Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={session?.user?.image || ""} />
                    <AvatarFallback>
                      {userProfile.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  Profile Information
                </CardTitle>
                {!editingProfile ? (
                  <Button variant="outline" size="sm" onClick={handleEditProfile}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleCancelEdit}>
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                    <Button size="sm" onClick={handleSaveProfile}>
                      <Save className="h-4 w-4 mr-2" />
                      Save
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  {editingProfile ? (
                    <Input
                      id="name"
                      value={editedProfile.name || ""}
                      onChange={(e) => setEditedProfile(prev => ({ ...prev, name: e.target.value }))}
                    />
                  ) : (
                    <div className="flex items-center gap-2 p-2 border rounded">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span>{userProfile.name}</span>
                    </div>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="flex items-center gap-2 p-2 border rounded bg-muted">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{userProfile.email}</span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone (Optional)</Label>
                  {editingProfile ? (
                    <Input
                      id="phone"
                      value={editedProfile.phone || ""}
                      onChange={(e) => setEditedProfile(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="Enter phone number"
                    />
                  ) : (
                    <div className="flex items-center gap-2 p-2 border rounded">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{userProfile.phone || "Not provided"}</span>
                    </div>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label>Member Since</Label>
                  <div className="flex items-center gap-2 p-2 border rounded bg-muted">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{formatDate(userProfile.joinedAt)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Reports</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{userProfile.totalReports}</div>
                <p className="text-xs text-muted-foreground">
                  Items you have reported
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Items Found</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{userProfile.totalFound}</div>
                <p className="text-xs text-muted-foreground">
                  Items marked as found
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Items Claimed</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{userProfile.totalClaimed}</div>
                <p className="text-xs text-muted-foreground">
                  Items that were claimed
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>My Report History</CardTitle>
              <CardDescription>
                All items you have reported to the system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {userReports.length === 0 ? (
                  <div className="col-span-full text-center py-8">
                    <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No reports yet</p>
                    <Button asChild className="mt-4">
                      <Link href="/report">Report Your First Item</Link>
                    </Button>
                  </div>
                ) : (
                  userReports.map((item) => (
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
                                <Eye className="h-3 w-3 mr-1" />
                                View
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
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                Your recent actions and updates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {userReports.length === 0 ? (
                  <div className="text-center py-8">
                    <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No activity yet</p>
                  </div>
                ) : (
                  userReports.slice(0, 10).map((item) => (
                    <div key={item.id} className="flex items-start space-x-4 p-4 rounded-lg border bg-card">
                      <div className="mt-1">
                        <Package className="h-4 w-4 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">Reported a {item.category.toLowerCase()}</p>
                        <p className="text-muted-foreground">{item.name}</p>
                        <p className="text-xs text-muted-foreground mt-2 flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {formatDate(item.createdAt)}
                        </p>
                      </div>
                      {getStatusBadge(item.status)}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}