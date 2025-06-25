"use client"

import { useEffect, useRef } from "react"
import Link from "next/link"
import { ArrowRight, Search, Upload, Sparkles, ChevronDown, Globe, Shield, Clock, Wand2 } from "lucide-react"
import { GradientButton } from "@/components/ui/gradient-button"
import { Button } from "@/components/ui/button"
import Image from "next/image"

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-background to-muted/30 py-16 md:py-20 lg:py-24 w-full">
      {/* Enhanced decorative elements with subtler effects */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <div className="absolute top-[10%] -right-[15%] h-[600px] w-[600px] rounded-full bg-primary/5 blur-2xl animate-pulse-slow" />
        <div className="absolute -bottom-[30%] -left-[10%] h-[450px] w-[450px] rounded-full bg-accent/5 blur-2xl" />
        <div className="absolute top-[40%] left-[20%] h-[200px] w-[200px] rounded-full bg-secondary/5 blur-xl" />
        
        {/* Subtle grid pattern overlay for depth */}
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.02]" />
        
        {/* Reduced number of particle dots for better performance */}
        <div className="hidden lg:block absolute top-[15%] left-[15%] h-1.5 w-1.5 rounded-full bg-primary/60 shadow-glow"></div>
        <div className="hidden lg:block absolute top-[35%] left-[65%] h-2 w-2 rounded-full bg-accent/60 shadow-glow"></div>
        <div className="hidden lg:block absolute top-[65%] left-[55%] h-1.5 w-1.5 rounded-full bg-secondary/60 shadow-glow"></div>
      </div>
      
      <div className="px-4 sm:px-6 lg:px-8 max-w-[1800px] mx-auto relative z-10">
        <div className="grid gap-8 lg:grid-cols-2 lg:gap-12 items-center">
          {/* Left column with text content */}
          <div className="flex flex-col space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border bg-background/90 backdrop-blur px-4 py-1.5 text-sm font-medium shadow-soft animate-fade-in max-w-max">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/20">
                <Sparkles className="h-3 w-3 text-primary" />
              </span>
              <span className="text-muted-foreground">
                AI-Powered Lost & Found System
              </span>
            </div>
            
            <div className="space-y-4 animate-slide-in-left">
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl xl:text-5xl/none">
                <span className="block">Lost Something?</span>
                <span className="block text-gradient dark:text-gradient-blue">Let's Recover It</span>
              </h1>
              <p className="max-w-[550px] text-muted-foreground text-base leading-relaxed md:text-lg">
                Using advanced AI vision technology to help you recover your lost belongings. Fast, reliable, and highly accurate.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 animate-slide-up" style={{animationDelay: "0.2s"}}>
              <Link href="/report">
                <GradientButton size="lg" variant="dark" className="w-full sm:w-auto text-base px-5 py-4 shadow-soft btn-3d">
                  Report Lost Item
                  <Upload className="ml-2 h-4 w-4" />
                </GradientButton>
              </Link>
              <Link href="/search">
                  <GradientButton size="lg" variant="dark" className="w-full sm:w-auto text-base px-5 py-4 shadow-soft btn-3d">
              Search for Item
              <Search className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </GradientButton>
              </Link>
            </div>
          </div>
          
          {/* Enhanced right column with interactive graphics */}
          <div className="relative mx-auto lg:ml-auto animate-slide-in-right">
            {/* Improved 3D effect background with subtle gradient */}
            <div className="absolute inset-0 -m-4 rounded-3xl bg-gradient-to-tr from-primary/5 via-transparent to-accent/5 blur-lg animate-pulse-slow">
              <div className="absolute inset-0 rounded-3xl bg-background/40 backdrop-blur-sm" />
            </div>

            {/* Main content card with improved aesthetics */}
            <div className="relative rounded-2xl overflow-hidden border shadow-lg glass-card max-w-[550px] mx-auto transform-gpu">
              {/* Mockup screen showing the application UI */}
              <div className="relative aspect-[4/3] transform-gpu">
                <div className="absolute inset-0 bg-gradient-to-b from-gray-900/30 via-transparent to-gray-900/30 z-10"></div>
                <Image
                  src="/hero-image.svg"
                  fill
                  alt="RECOVR AI Lost and Found System"
                  className="object-cover transform transition-transform duration-500 hover:scale-102"
                />
              
                {/* Floating elements that suggest AI functionality */}
                <div className="absolute top-6 right-6 h-16 w-24 rounded-lg glass-card p-2 shadow-md animate-float" style={{animationDelay: "0.5s"}}>
                  <div className="flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-100">
                      <Shield className="h-3 w-3 text-green-600" />
                    </div>
                    <div>
                      <h4 className="text-xs font-medium text-gray-600">Recovery</h4>
                      <p className="text-sm font-bold text-gray-900">96.3%</p>
                    </div>
                  </div>
                </div>
                
                {/* AI recognition visualization */}
                <div className="absolute top-1/4 left-1/4 w-1/2 h-1/2 border-2 border-dashed border-white/30 rounded-lg flex items-center justify-center animate-pulse-slow">
                  <div className="h-10 w-10 rounded-full border-2 border-white/50 flex items-center justify-center">
                    <Wand2 className="h-5 w-5 text-white" />
                  </div>
                </div>
                
                <div className="absolute bottom-6 left-6 right-6 rounded-xl bg-background/80 backdrop-blur-md p-3 border shadow-lg">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-primary-foreground">
                      <Globe className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold">RECOVR Network</h3>
                      <p className="text-xs text-muted-foreground">
                        Fast, accurate item recognition and matching
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Feature highlights below the image */}
              <div className="px-6 py-5 bg-background">
                <div className="flex justify-between items-center">
                  <div className="space-y-1">
                    <h3 className="text-sm font-medium">Match confidence</h3>
                    <div className="flex gap-1">
                      <div className="h-1 bg-primary rounded-full w-16"></div>
                      <div className="h-1 bg-primary/70 rounded-full w-6"></div>
                      <div className="h-1 bg-primary/40 rounded-full w-4"></div>
                      <div className="h-1 bg-primary/20 rounded-full w-3"></div>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="text-xs px-3 h-8">
                    View Details
                    <ArrowRight className="ml-1 h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
      
      {/* Stylized scroll indicator with subtle bounce */}
      <div className="absolute bottom-5 left-1/2 transform -translate-x-1/2 animate-bounce hidden lg:block">
        <div className="w-10 h-16 flex flex-col items-center justify-center relative">
          <div className="w-px h-8 bg-gradient-to-b from-transparent to-muted-foreground/40 absolute top-0"></div>
          <div className="rounded-full border border-muted-foreground/40 h-6 w-6 flex items-center justify-center mt-7">
            <ChevronDown className="h-3 w-3 text-muted-foreground/70" />
          </div>
        </div>
      </div>
    </section>
  )
} 