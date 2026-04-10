"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { listSites } from "@/lib/api/sites";
import { listLocalSitesForCompany, type LocalSite } from "@/lib/sites/local-sites-store";
import { useTenantStore } from "@/stores/tenant-store";
import type { SiteListItem } from "@/types/api";

/**
 * Hook que combina sitios del backend (API) + sitios creados localmente (localStorage).
 * Garantiza que el SiteSelector y todas las pantallas vean ambas fuentes.
 *
 * Los sitios locales se filtran por la empresa activa para evitar fuga cross-tenant.
 * Los sitios locales se convierten a SiteListItem con has_floor_plan = false.
 */
export function useAllSites(options?: { enabled?: boolean }) {
  const currentCompany = useTenantStore((s) => s.currentCompany);

  const query = useQuery<SiteListItem[]>({
    queryKey: ["sites"],
    queryFn: listSites,
    staleTime: 5 * 60 * 1000,
    retry: false,
    enabled: options?.enabled ?? true,
  });

  const allSites = useMemo<SiteListItem[]>(() => {
    const apiSites = query.data ?? [];

    // Leer sitios locales filtrados por empresa activa
    let localSites: LocalSite[] = [];
    try {
      localSites = listLocalSitesForCompany(currentCompany?.id);
    } catch {
      // SSR o localStorage no disponible
    }

    // Convertir locales a SiteListItem para compatibilidad
    const localAsSiteList: SiteListItem[] = localSites.map((ls) => ({
      id: ls.id,
      name: ls.name,
      client_name: ls.client_name,
      address: ls.address,
      city: ls.city,
      state: ls.state,
      camera_count: ls.camera_count ?? 0,
      nvr_count: ls.nvr_count ?? 0,
      has_floor_plan: false,
    }));

    // Evitar duplicados por id
    const apiIds = new Set(apiSites.map((s) => s.id));
    const uniqueLocal = localAsSiteList.filter((ls) => !apiIds.has(ls.id));

    return [...apiSites, ...uniqueLocal];
  }, [query.data, currentCompany?.id]);

  return {
    sites: allSites,
    apiSites: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}
