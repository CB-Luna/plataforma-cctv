"use client";

import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect } from "react";

// Icono por defecto para marcadores Leaflet en Next.js
const defaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

L.Marker.prototype.options.icon = defaultIcon;

interface MiniMapPickerProps {
  lat?: number;
  lng?: number;
  onPositionChange: (lat: number, lng: number) => void;
}

/** Componente interno: centra el mapa cuando cambian las coords */
function RecenterMap({ lat, lng }: { lat?: number; lng?: number }) {
  const map = useMap();
  useEffect(() => {
    if (lat != null && lng != null) {
      map.setView([lat, lng], map.getZoom(), { animate: true });
    }
  }, [lat, lng, map]);
  return null;
}

/** Componente interno: escucha clicks en el mapa */
function ClickHandler({ onPositionChange }: { onPositionChange: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onPositionChange(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

/**
 * Mini mapa interactivo para seleccionar ubicacion con clic.
 * Al hacer clic se coloca un marcador y se notifica la posicion.
 */
export default function MiniMapPicker({ lat, lng, onPositionChange }: MiniMapPickerProps) {
  const hasPosition = lat != null && lng != null;
  // Centro por defecto: Tijuana, BC
  const center: [number, number] = hasPosition ? [lat, lng] : [32.5149, -117.0382];

  return (
    <MapContainer
      center={center}
      zoom={hasPosition ? 14 : 11}
      className="h-full w-full rounded-lg"
      scrollWheelZoom
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <ClickHandler onPositionChange={onPositionChange} />
      <RecenterMap lat={lat} lng={lng} />
      {hasPosition && <Marker position={[lat, lng]} />}
    </MapContainer>
  );
}
