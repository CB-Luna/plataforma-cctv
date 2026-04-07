"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { getCityCoords } from "@/lib/map/city-coordinates";
import type { SiteListItem } from "@/types/api";
import { Camera, Server } from "lucide-react";
import { createElement } from "react";
import Link from "next/link";

// Fix Leaflet default marker icon in Next.js
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

interface SiteWithCoords extends SiteListItem {
  lat: number;
  lng: number;
}

interface BranchMapProps {
  sites: SiteListItem[];
  filterClient: string;
}

export default function BranchMap({ sites, filterClient }: BranchMapProps) {
  // Assign coordinates to sites based on city lookup
  const sitesWithCoords: SiteWithCoords[] = sites
    .filter((s) => !filterClient || s.client_name === filterClient)
    .map((site, idx) => {
      const coords = getCityCoords(site.city, site.state);
      if (coords) return { ...site, ...coords };
      // Fallback: spread around Monterrey area with deterministic offset
      return {
        ...site,
        lat: 25.6866 + (idx % 5) * 0.05 - 0.1,
        lng: -100.3161 + Math.floor(idx / 5) * 0.05 - 0.1,
      };
    });

  const center: [number, number] =
    sitesWithCoords.length > 0
      ? [sitesWithCoords[0].lat, sitesWithCoords[0].lng]
      : [24.5, -102.0];

  const zoom = sitesWithCoords.length <= 1 ? 12 : 6;

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      className="h-full w-full rounded-xl"
      scrollWheelZoom={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {sitesWithCoords.map((site) => (
        <Marker key={site.id} position={[site.lat, site.lng]}>
          <Popup minWidth={220}>
            <div className="space-y-2 text-sm">
              <p className="text-base font-bold">{site.name}</p>
              {site.client_name && (
                <p className="text-xs text-gray-500">{site.client_name}</p>
              )}
              {(site.address || site.city) && (
                <p className="text-xs text-gray-400">
                  {[site.address, site.city, site.state].filter(Boolean).join(", ")}
                </p>
              )}
              <div className="flex gap-4 border-t pt-2 text-xs">
                <span className="flex items-center gap-1">
                  {createElement(Camera, { className: "h-3 w-3" })}
                  {site.camera_count} cámaras
                </span>
                <span className="flex items-center gap-1">
                  {createElement(Server, { className: "h-3 w-3" })}
                  {site.nvr_count} NVRs
                </span>
              </div>
              <div className="flex gap-2 pt-1">
                {site.has_floor_plan && (
                  <Link
                    href={`/floor-plans/${site.id}`}
                    className="text-xs font-medium text-blue-600 hover:underline"
                  >
                    Ver plano
                  </Link>
                )}
                <Link
                  href="/cameras"
                  className="text-xs font-medium text-blue-600 hover:underline"
                >
                  Ver cámaras
                </Link>
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
