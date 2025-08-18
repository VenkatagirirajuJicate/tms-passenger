'use client';

import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface LiveTrackingMapProps {
  latitude: number;
  longitude: number;
  routeName: string;
  driverName: string;
  vehicleNumber: string;
}

// Fix for default markers in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

export default function LiveTrackingMap({ 
  latitude, 
  longitude, 
  routeName, 
  driverName, 
  vehicleNumber 
}: LiveTrackingMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Initialize map
    const map = L.map(mapRef.current).setView([latitude, longitude], 15);
    mapInstanceRef.current = map;

    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // Create custom bus icon
    const busIcon = L.divIcon({
      className: 'custom-bus-marker',
      html: `
        <div style="
          background: #10b981;
          color: white;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          border: 3px solid white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        ">
          🚌
        </div>
      `,
      iconSize: [40, 40],
      iconAnchor: [20, 20],
      popupAnchor: [0, -20]
    });

    // Add marker
    const marker = L.marker([latitude, longitude], { icon: busIcon }).addTo(map);
    markerRef.current = marker;

    // Add popup
    marker.bindPopup(`
      <div style="min-width: 200px;">
        <h3 style="margin: 0 0 8px 0; color: #10b981; font-weight: bold;">${routeName}</h3>
        <p style="margin: 4px 0; font-size: 14px;"><strong>Driver:</strong> ${driverName}</p>
        <p style="margin: 4px 0; font-size: 14px;"><strong>Vehicle:</strong> ${vehicleNumber}</p>
        <p style="margin: 4px 0; font-size: 12px; color: #666;">
          <strong>Location:</strong> ${latitude.toFixed(6)}, ${longitude.toFixed(6)}
        </p>
      </div>
    `);

    // Cleanup function
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update marker position when coordinates change
  useEffect(() => {
    if (mapInstanceRef.current && markerRef.current) {
      const newLatLng = L.latLng(latitude, longitude);
      markerRef.current.setLatLng(newLatLng);
      mapInstanceRef.current.setView(newLatLng, 15);
      
      // Update popup content
      markerRef.current.setPopupContent(`
        <div style="min-width: 200px;">
          <h3 style="margin: 0 0 8px 0; color: #10b981; font-weight: bold;">${routeName}</h3>
          <p style="margin: 4px 0; font-size: 14px;"><strong>Driver:</strong> ${driverName}</p>
          <p style="margin: 4px 0; font-size: 14px;"><strong>Vehicle:</strong> ${vehicleNumber}</p>
          <p style="margin: 4px 0; font-size: 12px; color: #666;">
            <strong>Location:</strong> ${latitude.toFixed(6)}, ${longitude.toFixed(6)}
          </p>
        </div>
      `);
    }
  }, [latitude, longitude, routeName, driverName, vehicleNumber]);

  return (
    <div 
      ref={mapRef} 
      className="h-96 w-full rounded-lg"
      style={{ zIndex: 1 }}
    />
  );
}
