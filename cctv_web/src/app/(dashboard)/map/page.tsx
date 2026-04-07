"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import dynamic from "next/dynamic";
import { listSites } from "@/lib/api/sites";
import { MapPin } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";

const BranchMap = dynamic(() => import("@/components/map/branch-map"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
      Cargando mapa...
    </div>
  ),
});

export default function MapPage() {
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

  const filteredCount = filterClient
    ? sites.filter((s) => s.client_name === filterClient).length
    : sites.length;

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
      {/* Header + filter */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white">
            Mapa de Sucursales
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {filteredCount} sucursal{filteredCount !== 1 ? "es" : ""} en el mapa
          </p>
        </div>
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
      </div>

      {/* Map container */}
      <div className="relative flex-1 overflow-hidden rounded-xl border border-gray-200 shadow-sm dark:border-gray-800">
        <BranchMap sites={sites} filterClient={filterClient} />
      </div>
    </div>
  );
}
