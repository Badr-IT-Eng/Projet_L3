"use client"

import React, { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet.markercluster/dist/MarkerCluster.css'
import 'leaflet.markercluster/dist/MarkerCluster.Default.css'
import 'leaflet.markercluster'
import 'leaflet.heat'
import { Button } from '@/components/ui/button'
import { MapPin, Locate, ZoomIn, ZoomOut, Maximize2, Layers3, Activity } from 'lucide-react'

// Fix the default icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconUrl: '/marker-icon.png',
  iconRetinaUrl: '/marker-icon-2x.png',
  shadowUrl: '/marker-shadow.png',
})

// Custom icons for different categories
const createCategoryIcon = (category: string) => {
  const iconColors: Record<string, string> = {
    bag: '#3b82f6',        // blue
    electronics: '#ef4444', // red
    accessory: '#10b981',   // green
    clothing: '#8b5cf6',    // purple
    document: '#f59e0b',    // yellow
    other: '#6b7280'        // gray
  }
  
  const color = iconColors[category] || iconColors.other
  
  return L.divIcon({
    html: `
      <div style="
        background-color: ${color};
        width: 25px;
        height: 25px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 5px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        color: white;
        font-weight: bold;
      ">
        ${category.charAt(0).toUpperCase()}
      </div>
    `,
    className: 'custom-marker',
    iconSize: [25, 25],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12]
  })
}

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
  const markersRef = useRef<L.MarkerClusterGroup | null>(null);
  const heatmapRef = useRef<any>(null);
  const [mapId] = useState(() => `map-${Math.random().toString(36).substring(2, 9)}`);
  const [isMapInitialized, setIsMapInitialized] = useState(false);
  const [currentLayer, setCurrentLayer] = useState('osm');
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [viewMode, setViewMode] = useState<'markers' | 'heatmap'>('markers');

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
      // Create the map instance with better controls
      const map = L.map(mapContainerRef.current, {
        center: userLocation || [40.7128, -74.006],
        zoom: 15,
        scrollWheelZoom: true,
        zoomControl: false // We'll add custom controls
      });

      // Define tile layers
      const tileLayers = {
        osm: L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }),
        satellite: L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
          attribution: '&copy; <a href="https://www.arcgis.com/">ArcGIS</a>'
        }),
        dark: L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
        })
      };

      // Add default layer
      tileLayers[currentLayer as keyof typeof tileLayers].addTo(map);

      // Add custom zoom controls
      const customZoomControl = L.control({ position: 'topright' });
      customZoomControl.onAdd = function() {
        const div = L.DomUtil.create('div', 'custom-zoom-control');
        div.innerHTML = `
          <div style="background: white; border-radius: 6px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); overflow: hidden;">
            <button id="zoom-in" style="display: block; width: 40px; height: 40px; border: none; background: white; cursor: pointer; border-bottom: 1px solid #eee;">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="8"/>
                <path d="m21 21-4.35-4.35"/>
                <line x1="11" y1="8" x2="11" y2="14"/>
                <line x1="8" y1="11" x2="14" y2="11"/>
              </svg>
            </button>
            <button id="zoom-out" style="display: block; width: 40px; height: 40px; border: none; background: white; cursor: pointer;">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="8"/>
                <path d="m21 21-4.35-4.35"/>
                <line x1="8" y1="11" x2="14" y2="11"/>
              </svg>
            </button>
          </div>
        `;
        return div;
      };
      customZoomControl.addTo(map);

      // Add fullscreen control
      const fullscreenControl = L.control({ position: 'topright' });
      fullscreenControl.onAdd = function() {
        const div = L.DomUtil.create('div', 'fullscreen-control');
        div.innerHTML = `
          <button id="fullscreen-btn" style="
            width: 40px; height: 40px; 
            background: white; 
            border: none; 
            border-radius: 6px; 
            box-shadow: 0 2px 10px rgba(0,0,0,0.1); 
            cursor: pointer;
            margin-top: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
          ">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
            </svg>
          </button>
        `;
        return div;
      };
      fullscreenControl.addTo(map);

      // Add locate control
      const locateControl = L.control({ position: 'topright' });
      locateControl.onAdd = function() {
        const div = L.DomUtil.create('div', 'locate-control');
        div.innerHTML = `
          <button id="locate-btn" style="
            width: 40px; height: 40px; 
            background: white; 
            border: none; 
            border-radius: 6px; 
            box-shadow: 0 2px 10px rgba(0,0,0,0.1); 
            cursor: pointer;
            margin-top: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
          ">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polygon points="3,11 22,2 13,21 11,13 3,11"/>
            </svg>
          </button>
        `;
        return div;
      };
      locateControl.addTo(map);

      // Create marker cluster group
      const markers = L.markerClusterGroup({
        spiderfyOnMaxZoom: false,
        showCoverageOnHover: false,
        zoomToBoundsOnClick: true,
        maxClusterRadius: 80,
        iconCreateFunction: function(cluster: any) {
          const count = cluster.getChildCount();
          let className = 'marker-cluster-small';
          if (count > 10) className = 'marker-cluster-medium';
          if (count > 100) className = 'marker-cluster-large';
          
          return L.divIcon({
            html: `<div style="
              background: linear-gradient(45deg, #3b82f6, #1d4ed8);
              width: 40px;
              height: 40px;
              border-radius: 50%;
              border: 3px solid white;
              box-shadow: 0 3px 10px rgba(0,0,0,0.3);
              display: flex;
              align-items: center;
              justify-content: center;
              color: white;
              font-weight: bold;
              font-size: 14px;
            ">${count}</div>`,
            className: `marker-cluster ${className}`,
            iconSize: [40, 40]
          });
        }
      });

      // Add markers with custom icons and clustering
      objects.forEach((obj) => {
        const customIcon = createCategoryIcon(obj.category);
        const marker = L.marker([obj.coordinates.lat, obj.coordinates.lng], {
          icon: customIcon
        }).bindPopup(`
          <div style="
            font-family: system-ui, -apple-system, sans-serif;
            min-width: 200px;
            max-width: 250px;
          ">
            <div style="display: flex; flex-direction: column; align-items: center; padding: 8px;">
              <img 
                src="${obj.image}" 
                alt="${obj.name}"
                style="
                  width: 80px; 
                  height: 80px; 
                  object-fit: cover; 
                  margin: 8px 0; 
                  border-radius: 8px;
                  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                " 
              />
              <h4 style="
                font-weight: 600; 
                margin: 4px 0; 
                font-size: 16px;
                text-align: center;
                color: #1f2937;
              ">${obj.name}</h4>
              <div style="
                display: flex; 
                align-items: center; 
                gap: 4px;
                margin: 2px 0;
                font-size: 12px;
                color: #6b7280;
              ">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                  <circle cx="12" cy="10" r="3"/>
                </svg>
                ${obj.location}
              </div>
              <div style="font-size: 12px; color: #6b7280; margin: 2px 0;">${obj.date}</div>
              <div style="
                display: inline-block;
                background: linear-gradient(45deg, #3b82f6, #1d4ed8);
                color: white;
                padding: 4px 8px;
                border-radius: 12px;
                font-size: 10px;
                font-weight: 500;
                text-transform: capitalize;
                margin: 4px 0;
              ">${obj.category}</div>
              <button style="
                margin-top: 8px;
                padding: 8px 16px;
                background: linear-gradient(45deg, #3b82f6, #1d4ed8);
                color: white;
                border: none;
                border-radius: 6px;
                font-size: 12px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.2s;
              " 
              onmouseover="this.style.transform='scale(1.05)'"
              onmouseout="this.style.transform='scale(1)'"
              onclick="window.location.href='/lost-objects/${obj.id}'">
                View Details
              </button>
            </div>
          </div>
        `, {
          maxWidth: 280,
          className: 'custom-popup'
        });
        
        markers.addLayer(marker);
      });
      
      // Create heatmap data
      const heatmapData = objects.map(obj => [
        obj.coordinates.lat,
        obj.coordinates.lng,
        0.8 // intensity
      ]);
      
      // Create heatmap layer
      const heatmap = (L as any).heatLayer(heatmapData, {
        radius: 25,
        blur: 15,
        maxZoom: 17,
        gradient: {
          0.0: 'blue',
          0.2: 'cyan',
          0.4: 'lime',
          0.6: 'yellow',
          0.8: 'orange',
          1.0: 'red'
        }
      });
      
      // Add appropriate layer based on view mode
      if (viewMode === 'heatmap') {
        map.addLayer(heatmap);
      } else {
        map.addLayer(markers);
      }
      
      // Store references for cleanup
      markersRef.current = markers;
      heatmapRef.current = heatmap;

      // Add event listeners for custom controls
      setTimeout(() => {
        const zoomInBtn = document.getElementById('zoom-in');
        const zoomOutBtn = document.getElementById('zoom-out');
        const fullscreenBtn = document.getElementById('fullscreen-btn');
        const locateBtn = document.getElementById('locate-btn');
        
        if (zoomInBtn) {
          zoomInBtn.addEventListener('click', () => map.zoomIn());
        }
        if (zoomOutBtn) {
          zoomOutBtn.addEventListener('click', () => map.zoomOut());
        }
        if (fullscreenBtn) {
          fullscreenBtn.addEventListener('click', () => {
            const container = mapContainerRef.current;
            if (container) {
              if (!document.fullscreenElement) {
                container.requestFullscreen();
              } else {
                document.exitFullscreen();
              }
            }
          });
        }
        if (locateBtn) {
          locateBtn.addEventListener('click', () => {
            if (navigator.geolocation) {
              navigator.geolocation.getCurrentPosition(
                (position) => {
                  const lat = position.coords.latitude;
                  const lng = position.coords.longitude;
                  setUserLocation([lat, lng]);
                  map.setView([lat, lng], 16);
                  
                  // Add user location marker
                  L.circleMarker([lat, lng], {
                    radius: 8,
                    fillColor: '#3b82f6',
                    color: 'white',
                    weight: 3,
                    opacity: 1,
                    fillOpacity: 0.8
                  }).addTo(map).bindPopup('You are here!');
                },
                (error) => {
                  console.error('Geolocation error:', error);
                  alert('Unable to access your location. Please enable location services.');
                }
              );
            } else {
              alert('Geolocation is not supported by this browser.');
            }
          });
        }
      }, 100);

      // Save the map instance to ref
      mapRef.current = map;
      setIsMapInitialized(true);
    } catch (error) {
      console.error("Error initializing map:", error);
    }

    // Clean up on unmount
    return () => {
      if (markersRef.current) {
        markersRef.current.clearLayers();
        markersRef.current = null;
      }
      if (heatmapRef.current) {
        heatmapRef.current = null;
      }
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        setIsMapInitialized(false);
      }
    };
  }, [objects, mapId, currentLayer, userLocation, viewMode]);

  // Function to switch tile layers
  const switchLayer = (layerType: string) => {
    if (mapRef.current && layerType !== currentLayer) {
      setCurrentLayer(layerType);
    }
  };

  // Function to toggle view mode
  const toggleViewMode = () => {
    if (mapRef.current && markersRef.current && heatmapRef.current) {
      if (viewMode === 'markers') {
        mapRef.current.removeLayer(markersRef.current);
        mapRef.current.addLayer(heatmapRef.current);
        setViewMode('heatmap');
      } else {
        mapRef.current.removeLayer(heatmapRef.current);
        mapRef.current.addLayer(markersRef.current);
        setViewMode('markers');
      }
    }
  };

  return (
    <div className="w-full h-full relative">
      {/* Layer and view mode switcher */}
      <div className="absolute top-4 left-4 z-[1000] space-y-2">
        {/* Layer switcher */}
        <div className="bg-white rounded-lg shadow-lg p-2">
          <div className="flex gap-1">
            <button
              onClick={() => switchLayer('osm')}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                currentLayer === 'osm' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Street
            </button>
            <button
              onClick={() => switchLayer('satellite')}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                currentLayer === 'satellite' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Satellite
            </button>
            <button
              onClick={() => switchLayer('dark')}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                currentLayer === 'dark' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Dark
            </button>
          </div>
        </div>
        
        {/* View mode switcher */}
        <div className="bg-white rounded-lg shadow-lg p-2">
          <button
            onClick={toggleViewMode}
            className={`flex items-center gap-2 px-3 py-2 rounded text-sm font-medium transition-colors ${
              viewMode === 'heatmap'
                ? 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
            }`}
          >
            {viewMode === 'heatmap' ? (
              <>
                <Activity className="h-4 w-4" />
                Heatmap
              </>
            ) : (
              <>
                <MapPin className="h-4 w-4" />
                Markers
              </>
            )}
          </button>
        </div>
      </div>
      
      {/* Object count indicator */}
      <div className="absolute bottom-4 left-4 z-[1000] bg-white rounded-lg shadow-lg px-3 py-2">
        <div className="flex items-center gap-2 text-sm">
          <MapPin className="h-4 w-4 text-blue-600" />
          <span className="font-medium">{objects.length} objects</span>
        </div>
      </div>
      
      <div 
        id={mapId}
        ref={mapContainerRef} 
        className="h-[600px] w-full rounded-lg overflow-hidden" 
        style={{ height: "600px", width: "100%" }}
      />
      
      <style jsx>{`
        .custom-popup .leaflet-popup-content-wrapper {
          border-radius: 12px;
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
        }
        .custom-popup .leaflet-popup-tip {
          background: white;
        }
        .marker-cluster {
          animation: markerBounce 0.3s ease-out;
        }
        @keyframes markerBounce {
          0% { transform: scale(0); }
          50% { transform: scale(1.2); }
          100% { transform: scale(1); }
        }
      `}</style>
    </div>
  );
}

export default MapWithNoSSR 