"use client";

import { useEffect, useMemo, useState } from "react";
import { useSiteStore } from "@/stores/site-store";
import { useTenantStore } from "@/stores/tenant-store";
import { useAuthStore } from "@/stores/auth-store";
import { useAllSites } from "@/hooks/use-all-sites";
import { getWorkspaceExperience } from "@/lib/auth/workspace-experience";
import { getSiteCompanyLabel } from "@/lib/site-context";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Building2, ChevronDown, ChevronRight, MapPin, Search } from "lucide-react";
import type { SiteListItem } from "@/types/api";

export function SiteSelector() {
  const currentSite = useSiteStore((s) => s.currentSite);
  const setSite = useSiteStore((s) => s.setSite);
  const clearSite = useSiteStore((s) => s.clearSite);
  const reconcileSite = useSiteStore((s) => s.reconcileSite);
  const currentCompany = useTenantStore((s) => s.currentCompany);
  const roles = useAuthStore((s) => s.roles);
  const permissions = useAuthStore((s) => s.permissions);

  const experience = getWorkspaceExperience({ permissions, roles, company: currentCompany });
  const isPlatformAdmin = experience.mode === "hybrid_backoffice";

  const { sites } = useAllSites();
  const [search, setSearch] = useState("");
  const [expandedCompany, setExpandedCompany] = useState<string | null>(null);

  useEffect(() => {
    if (sites.length === 0) return;
    reconcileSite(sites);
  }, [reconcileSite, sites]);

  const companySites = useMemo(() => sites, [sites]);

  const groupedByCompany = useMemo(() => {
    if (!isPlatformAdmin || currentCompany) return null;

    const groups = new Map<string, SiteListItem[]>();
    for (const site of companySites) {
      const key = getSiteCompanyLabel(site);
      const arr = groups.get(key) ?? [];
      arr.push(site);
      groups.set(key, arr);
    }

    return Array.from(groups.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [companySites, currentCompany, isPlatformAdmin]);

  const filteredFlat = useMemo(() => {
    if (!search.trim()) return companySites;

    const q = search.toLowerCase();
    return companySites.filter((site) =>
      site.name.toLowerCase().includes(q)
      || getSiteCompanyLabel(site).toLowerCase().includes(q)
      || site.city?.toLowerCase().includes(q)
      || site.state?.toLowerCase().includes(q),
    );
  }, [companySites, search]);

  const filteredGrouped = useMemo(() => {
    if (!groupedByCompany || !search.trim()) return groupedByCompany;

    const q = search.toLowerCase();
    return groupedByCompany
      .map(([company, companySites]) => {
        if (company.toLowerCase().includes(q)) return [company, companySites] as const;

        const filtered = companySites.filter((site) =>
          site.name.toLowerCase().includes(q)
          || site.city?.toLowerCase().includes(q)
          || site.state?.toLowerCase().includes(q),
        );

        return filtered.length > 0 ? ([company, filtered] as const) : null;
      })
      .filter(Boolean) as [string, SiteListItem[]][];
  }, [groupedByCompany, search]);

  if (companySites.length === 0) return null;

  const showSearch = companySites.length > 5;

  function handleSiteClick(site: SiteListItem) {
    setSite(site);
    setSearch("");
    setExpandedCompany(null);
  }

  function handleClearSite() {
    clearSite();
    setSearch("");
    setExpandedCompany(null);
  }

  return (
    <DropdownMenu
      onOpenChange={(open) => {
        if (!open) {
          setSearch("");
          setExpandedCompany(null);
        }
      }}
    >
      <DropdownMenuTrigger className="flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-sm transition-colors hover:bg-accent">
        <MapPin className="h-4 w-4 text-muted-foreground" />
        <span className="max-w-[220px] truncate">
          {currentSite ? currentSite.name : "Todas las sucursales"}
        </span>
        <ChevronDown className="h-3 w-3 text-muted-foreground" />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="max-h-[420px] w-80 overflow-y-auto">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Sucursales</DropdownMenuLabel>
          <p className="px-2 pb-2 text-xs text-muted-foreground">
            {isPlatformAdmin
              ? "Filtra las pantallas por empresa y sucursal."
              : "Define el sitio operativo activo para tickets, polizas e inventario."}
          </p>
        </DropdownMenuGroup>

        {showSearch && (
          <>
            <div className="px-2 pb-2">
              <div className="flex items-center gap-2 rounded-md border px-2 py-1.5">
                <Search className="h-3.5 w-3.5 text-muted-foreground" />
                <input
                  className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                  placeholder={isPlatformAdmin ? "Buscar empresa o sucursal..." : "Buscar sucursal..."}
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  onClick={(event) => event.stopPropagation()}
                  onKeyDown={(event) => event.stopPropagation()}
                />
              </div>
            </div>
            <DropdownMenuSeparator />
          </>
        )}

        <DropdownMenuItem onClick={handleClearSite}>
          <div className="flex flex-col">
            <span className="font-medium">Todas las sucursales</span>
            <span className="text-xs text-muted-foreground">
              {isPlatformAdmin ? "Vista global de todas las empresas" : "Vista global del tenant activo"}
            </span>
          </div>
        </DropdownMenuItem>
        <DropdownMenuSeparator />

        {isPlatformAdmin && filteredGrouped ? (
          filteredGrouped.length === 0 ? (
            <p className="px-3 py-4 text-center text-sm text-muted-foreground">
              Sin resultados para &quot;{search}&quot;
            </p>
          ) : (
            filteredGrouped.map(([company, companySites]) => {
              const isExpanded = expandedCompany === company || search.trim().length > 0;

              return (
                <div key={company}>
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm transition-colors hover:bg-accent"
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      setExpandedCompany(expandedCompany === company ? null : company);
                    }}
                  >
                    <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="flex-1 truncate font-medium">{company}</span>
                    <span className="text-xs text-muted-foreground">{companySites.length}</span>
                    <ChevronRight
                      className={`h-3 w-3 text-muted-foreground transition-transform ${isExpanded ? "rotate-90" : ""}`}
                    />
                  </button>

                  {isExpanded ? (
                    <div className="pl-4">
                      {companySites.map((site) => (
                        <DropdownMenuItem
                          key={site.id}
                          onClick={() => handleSiteClick(site)}
                          className="flex items-center gap-2"
                        >
                          <MapPin className="h-3 w-3 shrink-0 text-muted-foreground" />
                          <div className="min-w-0 flex-1">
                            <span className="block truncate text-sm">{site.name}</span>
                            <span className="block truncate text-xs text-muted-foreground">
                              {[site.city, site.state].filter(Boolean).join(", ") || "Sin ubicacion"}
                            </span>
                          </div>
                          <span className="shrink-0 text-xs text-muted-foreground">
                            {site.camera_count} cam
                          </span>
                        </DropdownMenuItem>
                      ))}
                    </div>
                  ) : null}
                </div>
              );
            })
          )
        ) : filteredFlat.length === 0 ? (
          <p className="px-3 py-4 text-center text-sm text-muted-foreground">
            Sin resultados para &quot;{search}&quot;
          </p>
        ) : (
          filteredFlat.map((site) => (
            <DropdownMenuItem key={site.id} onClick={() => handleSiteClick(site)}>
              <div className="flex flex-col">
                <span className="font-medium">{site.name}</span>
                <span className="text-xs text-muted-foreground">
                  {[
                    [site.city, site.state].filter(Boolean).join(", "),
                    site.is_local && !site.server_site_id ? "Solo local" : null,
                  ]
                    .filter(Boolean)
                    .join(" / ") || "Sin referencia adicional"}
                </span>
                <span className="text-xs text-muted-foreground">
                  {getSiteCompanyLabel(site)} / {site.nvr_count} NVR
                </span>
              </div>
              <span className="ml-auto text-xs text-muted-foreground">
                {site.camera_count} cam
              </span>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
