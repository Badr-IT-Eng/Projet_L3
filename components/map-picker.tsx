"use client"

import { useState, useEffect } from "react"
import dynamic from "next/dynamic"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { MapPin } from "lucide-react"

// Dynamically import the map component to avoid SSR issues
const MapComponent = dynamic(() => import("./map-component"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[400px] bg-gray-100 rounded-lg flex items-center justify-center">
      <div className="text-muted-foreground">Loading map...</div>
    </div>
  )
})

interface MapPickerProps {
  onLocationSelect: (location: { lat: number; lng: number; address: string }) => void
  initialLocation?: { lat: number; lng: number }
}

export function MapPicker({ onLocationSelect, initialLocation }: MapPickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number; address: string } | null>(null)

  // Default to Marseille, France
  const defaultLocation = {
    lat: 43.2965,
    lng: 5.3698
  }

  const handleLocationSelect = (lat: number, lng: number) => {
    // Simple reverse geocoding using a basic address format
    const address = `Latitude: ${lat.toFixed(4)}, Longitude: ${lng.toFixed(4)}`
    
    const location = { lat, lng, address }
    setSelectedLocation(location)
    onLocationSelect(location)
    setIsOpen(false)
  }

  const handleConfirmLocation = () => {
    if (selectedLocation) {
      onLocationSelect(selectedLocation)
      setIsOpen(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="icon" title="Pick location on map">
          <MapPin className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl w-full h-[600px]">
        <DialogHeader>
          <DialogTitle>Select Location on Map</DialogTitle>
          <DialogDescription>
            Click on the map to select where you lost the item. This will help people in the area find your lost item.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 mt-4">
          <MapComponent
            center={initialLocation || defaultLocation}
            onLocationSelect={handleLocationSelect}
          />
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          {selectedLocation && (
            <Button onClick={handleConfirmLocation}>
              Confirm Location
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}