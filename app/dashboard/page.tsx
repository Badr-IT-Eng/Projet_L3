"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts"
import {
  ArrowUpRight,
  ArrowDownRight,
  Package,
  Users,
  CameraIcon,
  Clock,
  MapPin,
  Search,
  Bell,
  Settings,
  LogOut,
  Loader2,
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"]

interface DashboardData {
  stats: {
    totalDetections: number;
    detectionChange: number;
    recoveryRate: number;
    recoveryChange: number;
    activeUsers: number;
    userChange: number;
  };
  recentDetections: Array<{
    id: string;
    name: string;
    location: string;
    timestamp: string;
    image: string;
    confidence: number;
  }>;
  categoryDistribution: Array<{
    name: string;
    value: number;
  }>;
  recoveryRate: Array<{
    name: string;
    rate: number;
  }>;
}

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState("overview")
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [timeRange, setTimeRange] = useState("week")

  // Load dashboard data
  useEffect(() => {
    const loadDashboardData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await fetch(`/api/dashboard?timeRange=${timeRange}`);
        
        if (!response.ok) {
          throw new Error("Failed to fetch dashboard data");
        }
        
        const dashboardData = await response.json();
        setData(dashboardData);
        
      } catch (err) {
        console.error("Error loading dashboard data:", err);
        setError("Failed to load dashboard data. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    
    loadDashboardData();
  }, [timeRange]);

  // Format numbers with + or - sign
  const formatChange = (value: number) => {
    const sign = value >= 0 ? "+" : "";
    return `${sign}${value}%`;
  };

  // Format timestamp to relative time
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days} day${days === 1 ? "" : "s"} ago`;
    if (hours > 0) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
    if (minutes > 0) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
    return "Just now";
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
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
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <div className="hidden md:flex w-64 flex-col fixed inset-y-0 border-r bg-background z-30">
        <div className="flex h-14 items-center border-b px-4">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <Image
              src="/placeholder.svg?height=32&width=32"
              width={32}
              height={32}
              alt="Logo"
              className="rounded-full bg-primary p-1"
            />
            <span>RECOVR Admin</span>
          </Link>
        </div>
        <div className="flex-1 overflow-auto py-2">
          <nav className="grid gap-1 px-2">
            <Link
              href="/dashboard"
              className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium ${
                activeTab === "overview" ? "bg-secondary" : "hover:bg-secondary/50"
              }`}
              onClick={() => setActiveTab("overview")}
            >
              <Package className="h-4 w-4" />
              Overview
            </Link>
            <Link
              href="/dashboard"
              className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium ${
                activeTab === "detections" ? "bg-secondary" : "hover:bg-secondary/50"
              }`}
              onClick={() => setActiveTab("detections")}
            >
              <CameraIcon className="h-4 w-4" />
              Detections
            </Link>
            <Link
              href="/dashboard"
              className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium ${
                activeTab === "users" ? "bg-secondary" : "hover:bg-secondary/50"
              }`}
              onClick={() => setActiveTab("users")}
            >
              <Users className="h-4 w-4" />
              Users
            </Link>
            <Link
              href="/dashboard"
              className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium ${
                activeTab === "analytics" ? "bg-secondary" : "hover:bg-secondary/50"
              }`}
              onClick={() => setActiveTab("analytics")}
            >
              <BarChart className="h-4 w-4" />
              Analytics
            </Link>
            <Link
              href="/dashboard"
              className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium ${
                activeTab === "settings" ? "bg-secondary" : "hover:bg-secondary/50"
              }`}
              onClick={() => setActiveTab("settings")}
            >
              <Settings className="h-4 w-4" />
              Settings
            </Link>
          </nav>
        </div>
        <div className="border-t p-4">
          <div className="flex items-center gap-3">
            <Image
              src="/placeholder.svg?height=40&width=40"
              width={40}
              height={40}
              alt="User"
              className="rounded-full"
            />
            <div>
              <p className="text-sm font-medium">Admin User</p>
              <p className="text-xs text-muted-foreground">admin@recovr.tech</p>
            </div>
            <Button variant="ghost" size="icon" className="ml-auto">
              <LogOut className="h-4 w-4" />
              <span className="sr-only">Log out</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 md:pl-64">
        <header className="sticky top-0 z-20 flex h-14 items-center gap-4 border-b bg-background px-4 sm:px-6">
          <div className="flex flex-1 items-center gap-2">
            <Button variant="outline" size="sm" className="md:hidden">
              <Package className="h-4 w-4" />
              <span className="sr-only">Toggle sidebar</span>
            </Button>
            <h1 className="text-lg font-semibold">Dashboard</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Bell className="h-4 w-4" />
              <span className="sr-only">Notifications</span>
            </Button>
            <Button variant="outline" size="sm">
              <Search className="h-4 w-4" />
              <span className="sr-only">Search</span>
            </Button>
          </div>
        </header>

        <main className="grid gap-4 p-4 sm:px-6 sm:py-6 md:gap-8">
          <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4 md:w-auto">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="detections">Detections</TabsTrigger>
              <TabsTrigger value="users">Users</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4 mt-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Detections</CardTitle>
                    <Package className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{data.stats.totalDetections.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">
                      <span className={`${data.stats.detectionChange >= 0 ? "text-green-500" : "text-red-500"} flex items-center`}>
                        {data.stats.detectionChange >= 0 ? (
                        <ArrowUpRight className="h-3 w-3 mr-1" />
                        ) : (
                          <ArrowDownRight className="h-3 w-3 mr-1" />
                        )}
                        {formatChange(data.stats.detectionChange)}
                      </span>{" "}
                      from last period
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Recovery Rate</CardTitle>
                    <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{data.stats.recoveryRate}%</div>
                    <p className="text-xs text-muted-foreground">
                      <span className={`${data.stats.recoveryChange >= 0 ? "text-green-500" : "text-red-500"} flex items-center`}>
                        {data.stats.recoveryChange >= 0 ? (
                        <ArrowUpRight className="h-3 w-3 mr-1" />
                        ) : (
                          <ArrowDownRight className="h-3 w-3 mr-1" />
                        )}
                        {formatChange(data.stats.recoveryChange)}
                      </span>{" "}
                      from last period
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{data.stats.activeUsers}</div>
                    <p className="text-xs text-muted-foreground">
                      <span className={`${data.stats.userChange >= 0 ? "text-green-500" : "text-red-500"} flex items-center`}>
                        {data.stats.userChange >= 0 ? (
                        <ArrowUpRight className="h-3 w-3 mr-1" />
                        ) : (
                        <ArrowDownRight className="h-3 w-3 mr-1" />
                        )}
                        {formatChange(data.stats.userChange)}
                      </span>{" "}
                      from last period
                    </p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4">
                  <CardHeader>
                    <CardTitle>Recovery Rate Over Time</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data.recoveryRate}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Line
                            type="monotone"
                            dataKey="rate"
                            stroke="#8884d8"
                            strokeWidth={2}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <Card className="col-span-3">
                  <CardHeader>
                    <CardTitle>Category Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={data.categoryDistribution}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            label
                          >
                            {data.categoryDistribution.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                  <CardHeader>
                    <CardTitle>Recent Detections</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                    {data.recentDetections.map((detection) => (
                        <div key={detection.id} className="flex items-center gap-4">
                        <div className="relative h-12 w-12">
                            <Image
                            src={detection.image}
                              alt={detection.name}
                              fill
                            className="rounded-md object-cover"
                            />
                          </div>
                        <div className="flex-1">
                          <p className="font-medium">{detection.name}</p>
                          <div className="flex items-center text-sm text-muted-foreground">
                            <MapPin className="h-3 w-3 mr-1" />
                              {detection.location}
                            <Clock className="h-3 w-3 ml-3 mr-1" />
                            {formatTimestamp(detection.timestamp)}
                          </div>
                        </div>
                        <Badge variant="secondary">
                          {detection.confidence}% match
                        </Badge>
                      </div>
                    ))}
                    </div>
                  </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="detections" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Detections Content</CardTitle>
                  <CardDescription>Manage and view all detected objects</CardDescription>
                </CardHeader>
                <CardContent>
                  <p>Detections tab content would go here...</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="users" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Users Content</CardTitle>
                  <CardDescription>Manage system users and permissions</CardDescription>
                </CardHeader>
                <CardContent>
                  <p>Users tab content would go here...</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="analytics" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Analytics Content</CardTitle>
                  <CardDescription>Detailed system analytics and reports</CardDescription>
                </CardHeader>
                <CardContent>
                  <p>Analytics tab content would go here...</p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  )
}
