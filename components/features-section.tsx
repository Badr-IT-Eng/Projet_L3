"use client"

import { MapPin, Search, Upload, Clock, Shield, Image as ImageIcon, Database, Map } from "lucide-react"

const features = [
  {
    icon: <Upload className="h-5 w-5" />,
    name: "Easy Reporting",
    description:
      "Report lost items in seconds with our intuitive form. Upload images and provide details to improve matching accuracy.",
  },
  {
    icon: <ImageIcon className="h-5 w-5" />,
    name: "AI Image Matching",
    description:
      "Our system uses TensorFlow.js to extract features from images and match your lost items with found objects.",
  },
  {
    icon: <MapPin className="h-5 w-5" />,
    name: "Location Tracking",
    description:
      "Track where items were lost or found with interactive maps to help narrow down search areas.",
  },
  {
    icon: <Search className="h-5 w-5" />,
    name: "Smart Search",
    description:
      "Find items using text descriptions, categories, or upload an image for visual similarity search.",
  },
  {
    icon: <Database className="h-5 w-5" />,
    name: "Secure Storage",
    description:
      "All data is securely stored in MongoDB with proper authentication and encryption protocols.",
  },
  {
    icon: <Map className="h-5 w-5" />,
    name: "Interactive Maps",
    description:
      "View lost and found items on a map to easily locate where objects were reported.",
  },
  {
    icon: <Clock className="h-5 w-5" />,
    name: "Real-time Updates",
    description:
      "Receive notifications when potential matches are found for your lost items.",
  },
  {
    icon: <Shield className="h-5 w-5" />,
    name: "Secure System",
    description:
      "JWT authentication, secure API endpoints, and data encryption protect your information.",
  },
]

export function FeaturesSection() {
  return (
    <section className="bg-muted/30 py-20 md:py-24 lg:py-28 w-full">
      <div className="px-4 sm:px-6 lg:px-8 max-w-[1800px] mx-auto">
        <div className="flex flex-col items-center justify-center space-y-5 text-center md:max-w-3xl md:mx-auto">
          <div className="inline-flex items-center rounded-full border bg-background/50 px-3 py-1 text-sm font-semibold">
            <span className="text-primary">Powerful Features</span>
          </div>
          <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Advanced Technology Made Simple</h2>
          <p className="max-w-[700px] text-muted-foreground text-base md:text-lg/relaxed">
            Our system combines cutting-edge AI technology with user-friendly interfaces to create the most effective lost and found solution available.
          </p>
        </div>

        <div className="mx-auto grid max-w-none gap-8 pt-16 md:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, index) => (
            <div key={index} className="group relative flex flex-col gap-2 rounded-lg border bg-background p-6 shadow-sm transition-all duration-200 hover:shadow-md">
              <div className="feature-icon h-12 w-12 flex items-center justify-center text-white">
                {feature.icon}
              </div>
              <h3 className="pt-4 text-xl font-semibold">{feature.name}</h3>
              <p className="text-muted-foreground text-sm">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
} 