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

function compactWhitespace(value?: string | null): string {
  return normalizeValue(value).replace(/\s+/g, " ").trim();
}

export function getSiteCompanyLabel(site?: Pick<SiteListItem, "company_name" | "client_name"> | null): string {
  return site?.company_name?.trim() || site?.client_name?.trim() || "Sin empresa";
}

export function buildSiteSignature(site?: Pick<SiteListItem, "name" | "address" | "city" | "state"> | null): string {
  if (!site) return "";

  return [
    compactWhitespace(site.name),
    compactWhitespace(site.city),
    compactWhitespace(site.state),
    compactWhitespace(site.address),
  ]
    .filter(Boolean)
    .join("|");
}

export function resolvePersistedSiteId(site?: Pick<SiteListItem, "id" | "server_site_id"> | null): string | null {
  if (!site) return null;

  const explicitId = site.server_site_id?.trim();
  if (explicitId) return explicitId;

  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(site.id)
    ? site.id
    : null;
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
  const context = [getSiteCompanyLabel(site), location].filter(Boolean).join(" / ");

  return context || "Sitio operativo activo";
}
