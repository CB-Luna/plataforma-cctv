import type { Client, SiteListItem } from "@/types/api";

interface SiteScopedRecord {
  site_id?: string | null;
}

function normalizeValue(value?: string | null): string {
  return (value ?? "")
    .trim()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

export function matchSiteToClient(site: SiteListItem, client?: Client | null): boolean {
  if (!client) return true;

  const siteClientName = normalizeValue(site.client_name);
  const clientCompanyName = normalizeValue(client.company_name);

  if (!siteClientName || !clientCompanyName) return false;

  return siteClientName === clientCompanyName;
}

export function filterByActiveSite<T extends SiteScopedRecord>(
  items: T[],
  siteId?: string | null,
  options?: { includeUnassigned?: boolean },
): T[] {
  if (!siteId) return items;

  return items.filter((item) => {
    if (!item.site_id) return options?.includeUnassigned === true;
    return item.site_id === siteId;
  });
}

export function describeSiteContext(site: SiteListItem): string {
  const location = [site.city, site.state].filter(Boolean).join(", ");
  const context = [site.client_name, location].filter(Boolean).join(" · ");

  return context || "Sitio operativo activo";
}

