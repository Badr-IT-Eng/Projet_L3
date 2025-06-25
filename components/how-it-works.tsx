"use client"

import { Camera, Search, Bell, ThumbsUp } from "lucide-react"
import Image from "next/image"

const steps = [
  {
    icon: <Camera className="h-6 w-6" />,
    title: "Report Your Lost Item",
    description: "Fill out a simple form with details about your lost item and upload a photo if available.",
    image: "/Home_Images/WhatsApp Image 2025-06-24 at 22.10.55.jpeg",
  },
  {
    icon: <Search className="h-6 w-6" />,
    title: "AI-Powered Matching",
    description: "Our system uses advanced image recognition to match your lost item with found objects.",
    image: "/Home_Images/matching.png",
  },
  {
    icon: <Bell className="h-6 w-6" />,
    title: "Get Notified",
    description: "Receive notifications when potential matches are found for your lost item.",
    image: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=800&q=80",
  },
  {
    icon: <ThumbsUp className="h-6 w-6" />,
    title: "Recover Your Item",
    description: "Connect with the finder and retrieve your lost item safely.",
    image: "/placeholder.svg",
  },
]

export function HowItWorks() {
  return (
    <section className="py-20 md:py-24 lg:py-28 overflow-hidden w-full">
      <div className="px-4 sm:px-6 lg:px-8 max-w-[1800px] mx-auto">
        <div className="flex flex-col items-center justify-center space-y-5 text-center md:max-w-3xl md:mx-auto mb-16">
          <div className="inline-flex items-center rounded-full border bg-background/50 px-3 py-1 text-sm font-semibold">
            <span className="text-primary">Simple Process</span>
          </div>
          <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">How It Works</h2>
          <p className="max-w-[700px] text-muted-foreground text-base md:text-lg/relaxed">
            Our system makes finding lost items simple and efficient with a streamlined four-step process.
          </p>
        </div>
        
        <div className="relative">
          {/* Connection line */}
          <div className="absolute left-1/2 top-24 h-[calc(100%-6rem)] w-px -translate-x-1/2 bg-border md:block hidden"></div>
          
          <div className="space-y-20 md:space-y-28">
            {steps.map((step, index) => (
              <div 
                key={index} 
                className={`relative grid gap-10 md:grid-cols-2 md:gap-16 items-center ${
                  index % 2 === 1 ? "md:grid-flow-col-dense" : ""
                }`}
              >
                <div className={`flex flex-col space-y-4 ${index % 2 === 1 ? "md:items-end md:text-right" : ""}`}>
                  <div className="relative z-10 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md">
                    {step.icon}
                    <span className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-background text-xs font-bold shadow">
                      {index + 1}
                    </span>
                  </div>
                  <h3 className="text-2xl font-bold">{step.title}</h3>
                  <p className="max-w-md text-muted-foreground">{step.description}</p>
                </div>
                
                <div className={`group relative overflow-hidden rounded-xl border bg-background p-1 shadow-lg transition-all hover:shadow-xl ${
                  index % 2 === 1 ? "md:order-first" : ""
                }`}>
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5"></div>
                  <Image
                    src={step.image}
                    alt={step.title}
                    width={600}
                    height={400}
                    className="w-full h-auto rounded-lg object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
} 