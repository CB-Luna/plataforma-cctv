"use client";

import { createElement } from "react";
import Link from "next/link";
import L from "leaflet";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { Building2, Camera, Server } from "lucide-react";
import { getCityCoords } from "@/lib/map/city-coordinates";
import { getSiteCompanyLabel } from "@/lib/site-context";
import type { SiteListItem } from "@/types/api";

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
  companyLogo?: string | null;
  companyName?: string | null;
}

export default function BranchMap({ sites, filterClient, companyLogo, companyName }: BranchMapProps) {
  const sitesWithCoords: SiteWithCoords[] = sites
    .filter((site) => !filterClient || getSiteCompanyLabel(site) === filterClient)
    .map((site, index) => {
      if (typeof site.lat === "number" && typeof site.lng === "number") {
        return { ...site, lat: site.lat, lng: site.lng };
      }

      const coords = getCityCoords(site.city, site.state);
      if (coords) return { ...site, ...coords };

      return {
        ...site,
        lat: 25.6866 + (index % 5) * 0.05 - 0.1,
        lng: -100.3161 + Math.floor(index / 5) * 0.05 - 0.1,
      };
    });

  const center: [number, number] = sitesWithCoords.length > 0
    ? [sitesWithCoords[0].lat, sitesWithCoords[0].lng]
    : [24.5, -102.0];
  const zoom = sitesWithCoords.length <= 1 ? 12 : 6;

  return (
    <MapContainer center={center} zoom={zoom} className="h-full w-full rounded-xl" scrollWheelZoom>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {sitesWithCoords.map((site) => {
        const popupCompanyName = site.company_name ?? companyName ?? getSiteCompanyLabel(site);
        const popupCompanyLogo = site.company_logo_url ?? companyLogo;

        return (
          <Marker key={site.id} position={[site.lat, site.lng]}>
            <Popup minWidth={240}>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  {popupCompanyLogo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={popupCompanyLogo}
                      alt={popupCompanyName ?? "Empresa"}
                      className="h-8 w-8 shrink-0 rounded-lg border border-gray-200 object-cover"
                    />
                  ) : (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
                      {createElement(Building2, { className: "h-4 w-4" })}
                    </div>
                  )}

                  <div className="min-w-0">
                    <p className="truncate text-base font-bold leading-tight">{site.name}</p>
                    {popupCompanyName ? (
                      <p className="truncate text-xs text-gray-500">{popupCompanyName}</p>
                    ) : null}
                  </div>
                </div>

                {(site.address || site.city) ? (
                  <p className="text-xs text-gray-400">
                    {[site.address, site.city, site.state].filter(Boolean).join(", ")}
                  </p>
                ) : null}

                <p className="rounded bg-amber-50 px-2 py-1 text-[11px] text-amber-800">
                  Posicion referencial por ciudad; no representa coordenadas exactas del predio.
                </p>

                <div className="flex gap-4 border-t pt-2 text-xs">
                  <span className="flex items-center gap-1">
                    {createElement(Camera, { className: "h-3 w-3" })}
                    {site.camera_count} camaras
                  </span>
                  <span className="flex items-center gap-1">
                    {createElement(Server, { className: "h-3 w-3" })}
                    {site.nvr_count} NVRs
                  </span>
                </div>

                <div className="flex gap-2 pt-1">
                  {site.has_floor_plan ? (
                    <Link href={`/floor-plans/${site.id}`} className="text-xs font-medium text-blue-600 hover:underline">
                      Ver plano
                    </Link>
                  ) : null}
                  <Link href="/inventory" className="text-xs font-medium text-blue-600 hover:underline">
                    Ver inventario
                  </Link>
                </div>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
