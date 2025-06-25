"use client"

import { useEffect, useState, useRef } from "react"
import dynamic from "next/dynamic"

// Import Leaflet types
import type { Map as LeafletMap } from "leaflet"

interface MapWrapperProps {
  center: { lat: number; lng: number }
  onLocationSelect: (lat: number, lng: number) => void
}

// Dynamically import the native Leaflet map component
const DynamicMap = dynamic(() => import("./leaflet-map"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[400px] bg-gray-100 rounded-lg flex items-center justify-center">
      <div className="text-muted-foreground">Loading map...</div>
    </div>
  )
})

export default function MapWrapper({ center, onLocationSelect }: MapWrapperProps) {
  const [isClient, setIsClient] = useState(false)
  const [componentKey, setComponentKey] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    // Force component remount when center changes
    setComponentKey(prev => prev + 1)
  }, [center.lat, center.lng])

  useEffect(() => {
    // Cleanup function to ensure proper cleanup
    return () => {
      if (containerRef.current) {
        // Clear any remaining map instances
        const leafletContainers = containerRef.current.querySelectorAll('.leaflet-container')
        leafletContainers.forEach(container => {
          const mapInstance = (container as any)._leaflet_map
          if (mapInstance) {
            mapInstance.remove()
          }
        })
      }
    }
  }, [componentKey])

  if (!isClient) {
    return (
      <div className="w-full h-[400px] bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="text-muted-foreground">Initializing map...</div>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="w-full h-[400px]">
      <DynamicMap
        key={`map-wrapper-${componentKey}`}
        center={center}
        onLocationSelect={onLocationSelect}
      />
    </div>
  )
}