"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import dynamic from "next/dynamic";
import { listSites } from "@/lib/api/sites";
import { AlertTriangle, MapPin } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { useSiteStore } from "@/stores/site-store";
import { SiteContextBanner } from "@/components/context/site-context-banner";
import { Card, CardContent } from "@/components/ui/card";

const BranchMap = dynamic(() => import("@/components/map/branch-map"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
      Cargando mapa...
    </div>
  ),
});

export default function MapPage() {
  const currentSite = useSiteStore((state) => state.currentSite);
  const clearSite = useSiteStore((state) => state.clearSite);
  const { data: sites = [] } = useQuery({
    queryKey: ["sites"],
    queryFn: listSites,
  });

  const [filterClient, setFilterClient] = useState("");

  const clientNames = useMemo(() => {
    const set = new Set<string>();
    sites.forEach((s) => {
      if (s.client_name) set.add(s.client_name);
    });
    return Array.from(set).sort();
  }, [sites]);

  const visibleSites = currentSite
    ? sites.filter((site) => site.id === currentSite.id)
    : filterClient
      ? sites.filter((site) => site.client_name === filterClient)
      : sites;

  if (sites.length === 0) {
    return (
      <div className="flex h-[calc(100vh-8rem)] items-center justify-center">
        <EmptyState
          icon={MapPin}
          title="No hay sucursales registradas"
          description="Las sucursales aparecerán aquí cuando se importen datos de inventario"
        />
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col gap-4">
      <SiteContextBanner
        site={currentSite}
        mode={currentSite ? "applied" : "informational"}
        description={
          currentSite
            ? "El mapa queda acotado al sitio activo. Este modulo sigue siendo complementario y no sustituye una georreferencia exacta."
            : "Este mapa es referencial: usa coordenadas aproximadas por ciudad mientras la API no exponga latitud y longitud reales."
        }
        onClear={currentSite ? clearSite : undefined}
      />

      <Card className="border-amber-200 bg-amber-50/80">
        <CardContent className="flex gap-3 py-4 text-sm text-amber-950">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
          <div>
            <p className="font-medium">Precision geografica aproximada</p>
            <p className="mt-1 text-xs text-amber-900">
              La posicion del marcador se calcula por ciudad o por un fallback sintetico. Usalo como apoyo
              visual de cobertura, no como geolocalizacion exacta para campo.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Header + filter */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white">
            Mapa de Sucursales
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {visibleSites.length} sucursal{visibleSites.length !== 1 ? "es" : ""} en el mapa
          </p>
        </div>
        {!currentSite && (
          <select
            value={filterClient}
            onChange={(e) => setFilterClient(e.target.value)}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          >
            <option value="">Todas las empresas</option>
            {clientNames.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Map container */}
      <div className="relative flex-1 overflow-hidden rounded-xl border border-gray-200 shadow-sm dark:border-gray-800">
        <BranchMap sites={visibleSites} filterClient={currentSite ? "" : filterClient} />
      </div>
    </div>
  );
}
