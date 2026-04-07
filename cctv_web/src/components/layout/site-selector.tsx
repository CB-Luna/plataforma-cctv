"use client";

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

  const { data: sites = [] } = useQuery({
    queryKey: ["sites"],
    queryFn: listSites,
    staleTime: 5 * 60 * 1000,
  });

  if (sites.length === 0) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-sm hover:bg-accent transition-colors">
        <MapPin className="h-4 w-4 text-muted-foreground" />
        <span className="max-w-[150px] truncate">
          {currentSite?.name ?? "Todas las sucursales"}
        </span>
        <ChevronDown className="h-3 w-3 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Sucursales</DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={clearSite}>
          <span className="font-medium">Todas las sucursales</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {sites.map((site) => (
          <DropdownMenuItem key={site.id} onClick={() => setSite(site)}>
            <div className="flex flex-col">
              <span className="font-medium">{site.name}</span>
              {(site.city || site.state) && (
                <span className="text-xs text-muted-foreground">
                  {[site.city, site.state].filter(Boolean).join(", ")}
                </span>
              )}
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
