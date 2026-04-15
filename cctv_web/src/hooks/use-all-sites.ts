"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { usePermissions } from "@/hooks/use-permissions";
import { listSites } from "@/lib/api/sites";
import { listTenants } from "@/lib/api/tenants";
import { isPlatformTenant } from "@/lib/platform";
import {
  listLocalSites,
  listLocalSitesForCompany,
  LOCAL_SITES_CHANGED_EVENT,
  type LocalSite,
} from "@/lib/sites/local-sites-store";
import { buildSiteSignature, getSiteCompanyLabel } from "@/lib/site-context";
import { useTenantStore } from "@/stores/tenant-store";
import type { SiteListItem, Tenant } from "@/types/api";

type ExtendedSite = SiteListItem;

function mergeSiteCollections(apiSites: ExtendedSite[], localSites: LocalSite[], tenantLookup: Map<string, Tenant>): ExtendedSite[] {
  const byScopeAndSignature = new Map<string, ExtendedSite>();
  const ordered: ExtendedSite[] = [];

  const put = (site: ExtendedSite) => {
    const scope = site.tenant_id ?? site.company_id ?? getSiteCompanyLabel(site);
    const signature = buildSiteSignature(site) || site.id;
    const key = `${scope}::${signature}`;
    const existing = byScopeAndSignature.get(key);

    if (!existing) {
      byScopeAndSignature.set(key, site);
      ordered.push(site);
      return;
    }

    const merged: ExtendedSite = {
      ...existing,
      ...site,
      id: existing.server_site_id ?? existing.id,
      server_site_id: existing.server_site_id ?? site.server_site_id ?? site.id,
      tenant_id: existing.tenant_id ?? site.tenant_id,
      company_id: existing.company_id ?? site.company_id,
      company_name: existing.company_name ?? site.company_name,
      company_logo_url: existing.company_logo_url ?? site.company_logo_url ?? null,
      client_name: existing.client_name ?? site.client_name,
      address: existing.address || site.address,
      city: existing.city || site.city,
      state: existing.state || site.state,
      lat: existing.lat ?? site.lat,
      lng: existing.lng ?? site.lng,
      is_local: Boolean(existing.is_local && site.is_local),
      camera_count: Math.max(existing.camera_count ?? 0, site.camera_count ?? 0),
      nvr_count: Math.max(existing.nvr_count ?? 0, site.nvr_count ?? 0),
      has_floor_plan: Boolean(existing.has_floor_plan || site.has_floor_plan),
    };

    byScopeAndSignature.set(key, merged);
    const index = ordered.findIndex((entry) => entry.id === existing.id);
    if (index >= 0) ordered[index] = merged;
  };

  for (const site of apiSites) {
    put({
      ...site,
      server_site_id: site.id,
      is_local: false,
    });
  }

  for (const localSite of localSites) {
    const tenant = localSite.company_id ? tenantLookup.get(localSite.company_id) : undefined;
    put({
      id: localSite.id,
      tenant_id: localSite.company_id,
      company_id: localSite.company_id,
      company_name: tenant?.name,
      company_logo_url: tenant?.logo_url ?? null,
      name: localSite.name,
      client_name: localSite.client_name,
      address: localSite.address,
      city: localSite.city,
      state: localSite.state,
      lat: localSite.lat,
      lng: localSite.lng,
      is_local: true,
      camera_count: localSite.camera_count ?? 0,
      nvr_count: localSite.nvr_count ?? 0,
      has_floor_plan: false,
    });
  }

  return ordered.sort((a, b) => {
    const companyCompare = getSiteCompanyLabel(a).localeCompare(getSiteCompanyLabel(b));
    if (companyCompare !== 0) return companyCompare;

    const nameCompare = a.name.localeCompare(b.name);
    if (nameCompare !== 0) return nameCompare;

    return a.id.localeCompare(b.id);
  });
}

/**
 * Hook que combina sitios del backend (API) + sitios creados localmente (localStorage).
 * Garantiza que el SiteSelector y las pantallas de CCTV vean una sola lista reconciliada.
 */
export function useAllSites(options?: { enabled?: boolean }) {
  const currentCompany = useTenantStore((s) => s.currentCompany);
  const { isSystemAdmin } = usePermissions();
  const isAllCompaniesView = isSystemAdmin && !currentCompany;
  const [localRevision, setLocalRevision] = useState(0);

  useEffect(() => {
    const handleLocalSitesChanged = () => setLocalRevision((value) => value + 1);

    window.addEventListener(LOCAL_SITES_CHANGED_EVENT, handleLocalSitesChanged);
    window.addEventListener("storage", handleLocalSitesChanged);
    return () => {
      window.removeEventListener(LOCAL_SITES_CHANGED_EVENT, handleLocalSitesChanged);
      window.removeEventListener("storage", handleLocalSitesChanged);
    };
  }, []);

  const query = useQuery<{ apiSites: ExtendedSite[]; tenantLookup: Map<string, Tenant> }>({
    queryKey: ["sites", isAllCompaniesView ? "all-companies" : currentCompany?.id ?? "current"],
    queryFn: async () => {
      if (!isAllCompaniesView) {
        const tenantLookup = new Map<string, Tenant>();
        if (currentCompany?.id) {
          tenantLookup.set(currentCompany.id, {
            id: currentCompany.id,
            name: currentCompany.name,
            slug: currentCompany.slug,
            logo_url: currentCompany.logo_url ?? undefined,
            primary_color: currentCompany.primary_color,
            secondary_color: currentCompany.secondary_color,
            tertiary_color: currentCompany.tertiary_color,
            is_active: currentCompany.is_active,
            settings: currentCompany.settings ?? {},
            subscription_plan: currentCompany.subscription_plan,
            max_users: currentCompany.max_users,
            max_clients: currentCompany.max_clients,
            created_at: "",
            updated_at: "",
          });
        }

        const apiSites = (await listSites({ tenantId: currentCompany?.id })).map((site) => ({
          ...site,
          tenant_id: currentCompany?.id,
          company_id: currentCompany?.id,
          company_name: currentCompany?.name,
          company_logo_url: currentCompany?.logo_url ?? null,
        }));

        return { apiSites, tenantLookup };
      }

      const tenants = await listTenants(200);
      const realTenants = tenants.filter((tenant) => !isPlatformTenant(tenant.id));
      const tenantLookup = new Map(realTenants.map((tenant) => [tenant.id, tenant]));
      const collections = await Promise.all(
        realTenants.map(async (tenant) => {
          const sites = await listSites({ tenantId: tenant.id });
          return sites.map((site) => ({
            ...site,
            tenant_id: tenant.id,
            company_id: tenant.id,
            company_name: tenant.name,
            company_logo_url: tenant.logo_url ?? null,
          }));
        }),
      );

      return {
        apiSites: collections.flat(),
        tenantLookup,
      };
    },
    staleTime: 5 * 60 * 1000,
    retry: false,
    enabled: options?.enabled ?? true,
  });

  const allSites = useMemo<ExtendedSite[]>(() => {
    const apiSites = query.data?.apiSites ?? [];
    const tenantLookup = query.data?.tenantLookup ?? new Map<string, Tenant>();

    let localSites: LocalSite[] = [];
    try {
      localSites = isAllCompaniesView
        ? listLocalSites()
        : listLocalSitesForCompany(currentCompany?.id);
    } catch {
      localSites = [];
    }

    void localRevision;
    return mergeSiteCollections(apiSites, localSites, tenantLookup);
  }, [currentCompany?.id, isAllCompaniesView, localRevision, query.data]);

  return {
    sites: allSites,
    apiSites: query.data?.apiSites ?? [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}
