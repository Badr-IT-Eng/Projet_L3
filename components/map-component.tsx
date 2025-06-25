"use client"

import { useEffect, useState, useRef } from "react"
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet"
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

// Create a custom red marker for selected location
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

interface MapComponentProps {
  center: { lat: number; lng: number }
  onLocationSelect: (lat: number, lng: number) => void
}

function LocationMarker({ onLocationSelect }: { onLocationSelect: (lat: number, lng: number) => void }) {
  const [position, setPosition] = useState<L.LatLng | null>(null)

  const map = useMapEvents({
    click(e) {
      setPosition(e.latlng)
      onLocationSelect(e.latlng.lat, e.latlng.lng)
    },
  })

  return position === null ? null : (
    <Marker position={position} icon={redIcon} />
  )
}

export default function MapComponent({ center, onLocationSelect }: MapComponentProps) {
  const [isClient, setIsClient] = useState(false)
  const [mapKey, setMapKey] = useState(Date.now())
  const mapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    // Generate a new key when center changes to force complete remount
    setMapKey(Date.now())
  }, [center.lat, center.lng])

  useEffect(() => {
    // Cleanup function to ensure map container is properly cleaned up
    return () => {
      if (mapRef.current) {
        // Remove any existing map instance
        const mapContainer = mapRef.current.querySelector('.leaflet-container')
        if (mapContainer) {
          mapContainer.remove()
        }
      }
    }
  }, [mapKey])

  if (!isClient) {
    return (
      <div className="w-full h-[400px] bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="text-muted-foreground">Loading map...</div>
      </div>
    )
  }

  return (
    <div ref={mapRef} className="w-full h-[400px] rounded-lg overflow-hidden border">
      <MapContainer
        key={`map-${mapKey}`}
        center={[center.lat, center.lng]}
        zoom={13}
        style={{ height: "100%", width: "100%" }}
        attributionControl={true}
        zoomControl={true}
        scrollWheelZoom={true}
        doubleClickZoom={true}
        touchZoom={true}
        whenReady={() => {
          // Map is ready and initialized
          console.log('Map initialized successfully')
        }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <LocationMarker onLocationSelect={onLocationSelect} />
      </MapContainer>
    </div>
  )
}