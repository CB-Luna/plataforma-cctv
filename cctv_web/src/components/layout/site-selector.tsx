"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSiteStore } from "@/stores/site-store";
import { listSites } from "@/lib/api/sites";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MapPin, ChevronDown } from "lucide-react";

export function SiteSelector() {
  const currentSite = useSiteStore((s) => s.currentSite);
  const setSite = useSiteStore((s) => s.setSite);
  const clearSite = useSiteStore((s) => s.clearSite);
  const reconcileSite = useSiteStore((s) => s.reconcileSite);

  const { data: sites = [] } = useQuery({
    queryKey: ["sites"],
    queryFn: listSites,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (sites.length === 0) return;
    reconcileSite(sites);
  }, [reconcileSite, sites]);

  if (sites.length === 0) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-sm transition-colors hover:bg-accent">
        <MapPin className="h-4 w-4 text-muted-foreground" />
        <span className="max-w-[180px] truncate">
          {currentSite?.name ?? "Todas las sucursales"}
        </span>
        <ChevronDown className="h-3 w-3 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Sucursales</DropdownMenuLabel>
          <p className="px-2 pb-2 text-xs text-muted-foreground">
            Define el sitio operativo activo para tickets, pólizas e inventario.
          </p>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={clearSite}>
          <div className="flex flex-col">
            <span className="font-medium">Todas las sucursales</span>
            <span className="text-xs text-muted-foreground">Vista global del tenant activo</span>
          </div>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {sites.map((site) => (
          <DropdownMenuItem key={site.id} onClick={() => setSite(site)}>
            <div className="flex flex-col">
              <span className="font-medium">{site.name}</span>
              <span className="text-xs text-muted-foreground">
                {[site.client_name, [site.city, site.state].filter(Boolean).join(", ")]
                  .filter(Boolean)
                  .join(" · ") || "Sin referencia adicional"}
              </span>
              <span className="text-xs text-muted-foreground">
                {site.has_floor_plan ? "Con plano" : "Sin plano"} · {site.nvr_count} NVR
              </span>
            </div>
            <span className="ml-auto text-xs text-muted-foreground">
              {site.camera_count} cam
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
