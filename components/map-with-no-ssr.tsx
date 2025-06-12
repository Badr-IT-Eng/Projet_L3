"use client"

import React, { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Button } from '@/components/ui/button'

// Fix the default icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconUrl: '/marker-icon.png',
  iconRetinaUrl: '/marker-icon-2x.png',
  shadowUrl: '/marker-shadow.png',
})

// Object type that matches our map data
interface MapObject {
  id: number
  name: string
  location: string
  date: string
  image: string
  category: string
  coordinates: {
    lat: number
    lng: number
    x?: number
    y?: number
  }
}

export interface MapWithNoSSRProps {
  objects: MapObject[]
}

const MapWithNoSSR = ({ objects }: MapWithNoSSRProps) => {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [mapId] = useState(() => `map-${Math.random().toString(36).substring(2, 9)}`);
  const [isMapInitialized, setIsMapInitialized] = useState(false);

  // Initialize map once component is mounted
  useEffect(() => {
    // Safety check - if already initialized, clean up first
    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
      setIsMapInitialized(false);
    }

    // Only initialize if the container is available
    if (!mapContainerRef.current || isMapInitialized) return;

    try {
      // Create the map instance
      const map = L.map(mapContainerRef.current, {
        center: [40.7128, -74.006],
        zoom: 15,
        scrollWheelZoom: false
      });

      // Add the tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(map);

      // Add markers
      objects.forEach((obj) => {
        const marker = L.marker([obj.coordinates.lat, obj.coordinates.lng])
          .addTo(map)
          .bindPopup(`
            <div class="flex flex-col items-center">
              <img 
                src="${obj.image}" 
                alt="${obj.name}"
                class="w-16 h-16 object-cover my-2 rounded" 
              />
              <h4 class="font-medium">${obj.name}</h4>
              <div class="text-xs text-muted-foreground">${obj.location}</div>
              <div class="text-xs text-muted-foreground">${obj.date}</div>
              <button class="mt-2 px-2 py-1 bg-blue-600 text-white text-xs rounded">View Details</button>
            </div>
          `);
      });

      // Save the map instance to ref
      mapRef.current = map;
      setIsMapInitialized(true);
    } catch (error) {
      console.error("Error initializing map:", error);
    }

    // Clean up on unmount
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        setIsMapInitialized(false);
      }
    };
  }, [objects, mapId]);

  return (
    <div className="w-full h-full">
      <div 
        id={mapId}
        ref={mapContainerRef} 
        className="h-[600px] w-full" 
        style={{ height: "600px", width: "100%" }}
      />
    </div>
  );
}

export default MapWithNoSSR 