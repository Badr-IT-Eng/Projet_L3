"use client"

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'

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

// Dynamically import the Map component to avoid SSR issues
const MapWithNoSSRComponent = dynamic(
  () => import('./map-with-no-ssr'),
  { 
    ssr: false,
    loading: () => (
      <div className="w-full h-[600px] flex items-center justify-center bg-muted">
        <p>Loading map resources...</p>
      </div>
    )
  }
)

// This component will only be rendered on the client side
const MapViewer = ({ objects }: { objects: MapObject[] }) => {
  // No need for state to manage keys, as we've fixed the underlying issue
  return (
    <div className="w-full h-full">
      <MapWithNoSSRComponent objects={objects} />
    </div>
  )
}

export default MapViewer 