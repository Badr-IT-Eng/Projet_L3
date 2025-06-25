"use client"

import { useEffect, useRef, useState } from "react"
import L from "leaflet"
import "leaflet/dist/leaflet.css"

// Fix for default markers in Next.js
const icon = L.icon({
  iconUrl: "/marker-icon.png",
  iconRetinaUrl: "/marker-icon-2x.png", 
  shadowUrl: "/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
})

// Red marker for selected location
const redIcon = L.icon({
  iconUrl: "data:image/svg+xml;base64," + btoa(`
    <svg width="25" height="41" viewBox="0 0 25 41" xmlns="http://www.w3.org/2000/svg">
      <path d="M12.5 0C5.607 0 0 5.607 0 12.5c0 12.5 12.5 28.5 12.5 28.5s12.5-16 12.5-28.5C25 5.607 19.393 0 12.5 0zm0 17.5c-2.761 0-5-2.239-5-5s2.239-5 5-5 5 2.239 5 5-2.239 5-5 5z" fill="#ef4444"/>
    </svg>
  `),
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34]
})

interface LeafletMapProps {
  center: { lat: number; lng: number }
  onLocationSelect: (lat: number, lng: number) => void
}

export default function LeafletMap({ center, onLocationSelect }: LeafletMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const leafletMapRef = useRef<L.Map | null>(null)
  const markerRef = useRef<L.Marker | null>(null)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (!isClient || !mapRef.current) return

    // Clean up existing map
    if (leafletMapRef.current) {
      leafletMapRef.current.remove()
      leafletMapRef.current = null
    }

    // Create new map
    const map = L.map(mapRef.current, {
      attributionControl: true,
      zoomControl: true,
      scrollWheelZoom: true,
      doubleClickZoom: true,
      touchZoom: true
    }).setView([center.lat, center.lng], 13)

    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map)

    // Add click handler
    map.on('click', (e: L.LeafletMouseEvent) => {
      // Remove existing marker
      if (markerRef.current) {
        map.removeLayer(markerRef.current)
      }

      // Add new marker
      markerRef.current = L.marker(e.latlng, { icon: redIcon }).addTo(map)
      
      // Call the callback
      onLocationSelect(e.latlng.lat, e.latlng.lng)
    })

    leafletMapRef.current = map

    // Cleanup function
    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove()
        leafletMapRef.current = null
      }
    }
  }, [isClient, center.lat, center.lng, onLocationSelect])

  if (!isClient) {
    return (
      <div className="w-full h-[400px] bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="text-muted-foreground">Loading map...</div>
      </div>
    )
  }

  return (
    <div 
      ref={mapRef} 
      className="w-full h-[400px] rounded-lg overflow-hidden border"
      style={{ position: 'relative', zIndex: 1 }}
    />
  )
}