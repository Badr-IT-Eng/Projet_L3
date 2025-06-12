"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area,
  ScatterChart,
  Scatter,
  ZAxis,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts"
import { CalendarIcon, Download, Share2 } from "lucide-react"

// Mock data for analytics
const MONTHLY_DETECTIONS = [
  { name: "Jan", bags: 65, electronics: 42, accessories: 28, other: 15 },
  { name: "Feb", bags: 59, electronics: 39, accessories: 32, other: 18 },
  { name: "Mar", bags: 80, electronics: 48, accessories: 35, other: 21 },
  { name: "Apr", bags: 81, electronics: 55, accessories: 30, other: 19 },
  { name: "May", bags: 56, electronics: 49, accessories: 38, other: 22 },
  { name: "Jun", bags: 55, electronics: 51, accessories: 35, other: 25 },
  { name: "Jul", bags: 40, electronics: 37, accessories: 30, other: 20 },
  { name: "Aug", bags: 45, electronics: 43, accessories: 36, other: 22 },
  { name: "Sep", bags: 62, electronics: 50, accessories: 39, other: 26 },
  { name: "Oct", bags: 68, electronics: 56, accessories: 45, other: 28 },
  { name: "Nov", bags: 71, electronics: 60, accessories: 50, other: 30 },
  { name: "Dec", bags: 85, electronics: 65, accessories: 55, other: 35 },
]

const RECOVERY_TREND = [
  { name: "Jan", rate: 65 },
  { name: "Feb", rate: 68 },
  { name: "Mar", rate: 72 },
  { name: "Apr", rate: 75 },
  { name: "May", rate: 82 },
  { name: "Jun", rate: 85 },
  { name: "Jul", rate: 86 },
  { name: "Aug", rate: 88 },
  { name: "Sep", rate: 87 },
  { name: "Oct", rate: 89 },
  { name: "Nov", rate: 90 },
  { name: "Dec", rate: 92 },
]

const LOCATION_DISTRIBUTION = [
  { name: "Library", value: 32 },
  { name: "Cafeteria", value: 24 },
  { name: "Computer Lab", value: 18 },
  { name: "Main Hall", value: 14 },
  { name: "Gym", value: 12 },
]

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"]

const DETECTION_TIME = [
  { hour: "00:00", count: 5 },
  { hour: "02:00", count: 3 },
  { hour: "04:00", count: 2 },
  { hour: "06:00", count: 8 },
  { hour: "08:00", count: 25 },
  { hour: "10:00", count: 38 },
  { hour: "12:00", count: 45 },
  { hour: "14:00", count: 42 },
  { hour: "16:00", count: 35 },
  { hour: "18:00", count: 28 },
  { hour: "20:00", count: 15 },
  { hour: "22:00", count: 8 },
]

const DETECTION_ACCURACY = [
  { category: "Bags", accuracy: 94 },
  { category: "Electronics", accuracy: 92 },
  { category: "Accessories", accuracy: 88 },
  { category: "Clothing", accuracy: 85 },
  { category: "Other", accuracy: 80 },
]

const DETECTION_SCATTER = [
  { x: 10, y: 30, z: 200, name: "Backpack" },
  { x: 30, y: 100, z: 260, name: "Laptop" },
  { x: 45, y: 150, z: 280, name: "Smartphone" },
  { x: 70, y: 220, z: 375, name: "Wallet" },
  { x: 90, y: 70, z: 190, name: "Water Bottle" },
  { x: 110, y: 130, z: 320, name: "Umbrella" },
  { x: 150, y: 185, z: 280, name: "Headphones" },
  { x: 170, y: 210, z: 340, name: "Tablet" },
  { x: 190, y: 160, z: 270, name: "Book" },
]

export default function AnalyticsPage() {
  const [date, setDate] = useState(new Date())
  const [timeRange, setTimeRange] = useState("year")

  return (
    <div className="container py-8">
      <div className="flex flex-col space-y-6">
        <div className="flex flex-col space-y-2">
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-muted-foreground">
            Comprehensive analytics and insights for the lost object detection system
          </p>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <Tabs defaultValue="year" value={timeRange} onValueChange={setTimeRange} className="w-full md:w-auto">
            <TabsList>
              <TabsTrigger value="day">Day</TabsTrigger>
              <TabsTrigger value="week">Week</TabsTrigger>
              <TabsTrigger value="month">Month</TabsTrigger>
              <TabsTrigger value="year">Year</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-[240px] justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar mode="single" selected={date} onSelect={(date) => date && setDate(date)} initialFocus />
              </PopoverContent>
            </Popover>

            <Button variant="outline" size="icon">
              <Download className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon">
              <Share2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Detections</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">1,248</div>
              <p className="text-xs text-muted-foreground">+12.5% from previous period</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Recovery Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">92%</div>
              <p className="text-xs text-muted-foreground">+7% from previous period</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Avg. Detection Time</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">28s</div>
              <p className="text-xs text-muted-foreground">-2.1s from previous period</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Detection Accuracy</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">94%</div>
              <p className="text-xs text-muted-foreground">+1.5% from previous period</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Detections by Category</CardTitle>
              <CardDescription>Number of objects detected per month by category</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={MONTHLY_DETECTIONS} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="bags" name="Bags" fill="#0088FE" />
                    <Bar dataKey="electronics" name="Electronics" fill="#00C49F" />
                    <Bar dataKey="accessories" name="Accessories" fill="#FFBB28" />
                    <Bar dataKey="other" name="Other" fill="#FF8042" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recovery Rate Trend</CardTitle>
              <CardDescription>Percentage of items recovered over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={RECOVERY_TREND} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="rate" stroke="#0088FE" fill="#0088FE" fillOpacity={0.2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Location Distribution</CardTitle>
              <CardDescription>Areas with most lost items</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={LOCATION_DISTRIBUTION}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {LOCATION_DISTRIBUTION.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Detection Time Distribution</CardTitle>
              <CardDescription>Number of detections by time of day</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={DETECTION_TIME} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hour" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="count" stroke="#0088FE" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Detection Accuracy by Category</CardTitle>
              <CardDescription>Model accuracy for different object types</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius={80} data={DETECTION_ACCURACY}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="category" />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} />
                    <Radar
                      name="Accuracy"
                      dataKey="accuracy"
                      stroke="#0088FE"
                      fill="#0088FE"
                      fillOpacity={0.6}
                    />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Object Detection Correlation</CardTitle>
            <CardDescription>
              Relationship between detection time (x), confidence score (y), and object size (z)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 20, right: 30, bottom: 10, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="x"
                    name="Processing Time"
                    unit="ms"
                    label={{ value: "Processing Time (ms)", position: "bottom", offset: 0 }}
                  />
                  <YAxis
                    dataKey="y"
                    name="Confidence"
                    unit="%"
                    label={{ value: "Confidence Score (%)", angle: -90, position: "left" }}
                  />
                  <ZAxis dataKey="z" range={[60, 400]} name="Size" unit="px" />
                  <Tooltip cursor={{ strokeDasharray: "3 3" }} />
                  <Legend />
                  <Scatter name="Objects" data={DETECTION_SCATTER} fill="#0088FE" />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>System Performance Metrics</CardTitle>
              <CardDescription>Key performance indicators over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={[
                      { name: "Jan", cpu: 45, memory: 60, storage: 30 },
                      { name: "Feb", cpu: 50, memory: 65, storage: 35 },
                      { name: "Mar", cpu: 55, memory: 70, storage: 40 },
                      { name: "Apr", cpu: 60, memory: 75, storage: 45 },
                      { name: "May", cpu: 65, memory: 80, storage: 50 },
                      { name: "Jun", cpu: 70, memory: 85, storage: 55 },
                      { name: "Jul", cpu: 75, memory: 90, storage: 60 },
                      { name: "Aug", cpu: 70, memory: 85, storage: 65 },
                      { name: "Sep", cpu: 65, memory: 80, storage: 70 },
                      { name: "Oct", cpu: 60, memory: 75, storage: 75 },
                      { name: "Nov", cpu: 55, memory: 70, storage: 80 },
                      { name: "Dec", cpu: 50, memory: 65, storage: 85 },
                    ]}
                    margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="cpu" name="CPU Usage (%)" stroke="#0088FE" />
                    <Line type="monotone" dataKey="memory" name="Memory Usage (%)" stroke="#00C49F" />
                    <Line type="monotone" dataKey="storage" name="Storage Usage (%)" stroke="#FFBB28" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>User Activity</CardTitle>
              <CardDescription>System usage and user interactions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={[
                      { name: "Jan", reports: 120, searches: 180, claims: 45 },
                      { name: "Feb", reports: 110, searches: 165, claims: 40 },
                      { name: "Mar", reports: 130, searches: 200, claims: 55 },
                      { name: "Apr", reports: 125, searches: 195, claims: 50 },
                      { name: "May", reports: 140, searches: 220, claims: 65 },
                      { name: "Jun", reports: 135, searches: 210, claims: 60 },
                      { name: "Jul", reports: 145, searches: 230, claims: 70 },
                      { name: "Aug", reports: 150, searches: 235, claims: 75 },
                      { name: "Sep", reports: 155, searches: 240, claims: 80 },
                      { name: "Oct", reports: 160, searches: 250, claims: 85 },
                      { name: "Nov", reports: 165, searches: 260, claims: 90 },
                      { name: "Dec", reports: 170, searches: 270, claims: 95 },
                    ]}
                    margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="reports" name="Reports" fill="#0088FE" />
                    <Bar dataKey="searches" name="Searches" fill="#00C49F" />
                    <Bar dataKey="claims" name="Claims" fill="#FFBB28" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
