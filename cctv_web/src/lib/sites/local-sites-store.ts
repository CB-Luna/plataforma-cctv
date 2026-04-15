/**
 * local-sites-store.ts
 * Gestión de sucursales creadas localmente (localStorage).
 * El backend no soporta POST/PUT/DELETE /sites (GAP-01/GAP-10).
 * Los sitios se almacenan con company_id para aislamiento por empresa.
 */

const STORAGE_KEY = "cctv_local_sites_v1";
export const LOCAL_SITES_CHANGED_EVENT = "cctv-local-sites-changed";

export interface LocalSite {
  id: string;
  name: string;
  address?: string;
  city?: string;
  state?: string;
  client_name?: string;
  lat?: number;
  lng?: number;
  camera_count?: number;
  nvr_count?: number;
  createdAt: string;
  /** ID de la empresa propietaria */
  company_id?: string;
  /** Siempre true para distinguir locales de los de la API */
  isLocal: true;
}

function readAll(): LocalSite[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as LocalSite[]) : [];
  } catch {
    return [];
  }
}

function writeAll(sites: LocalSite[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sites));
    window.dispatchEvent(new Event(LOCAL_SITES_CHANGED_EVENT));
  } catch {
    /* silencioso */
  }
}

/** Lista todas las sucursales locales (sin filtrar) */
export function listLocalSites(): LocalSite[] {
  return readAll();
}

/** Lista sucursales locales de una empresa especifica */
export function listLocalSitesForCompany(companyId: string | undefined): LocalSite[] {
  if (!companyId) return [];
  return readAll().filter((s) => s.company_id === companyId);
}

/** Crea una nueva sucursal local, retorna el objeto creado */
export function createLocalSite(
  data: Omit<LocalSite, "id" | "createdAt" | "isLocal">,
): LocalSite {
  const site: LocalSite = {
    ...data,
    id: `local_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    createdAt: new Date().toISOString(),
    isLocal: true,
  };
  const all = readAll();
  writeAll([...all, site]);
  return site;
}

/** Actualiza una sucursal local existente */
export function updateLocalSite(
  id: string,
  data: Partial<Omit<LocalSite, "id" | "createdAt" | "isLocal">>,
): LocalSite | null {
  const all = readAll();
  const idx = all.findIndex((s) => s.id === id);
  if (idx === -1) return null;
  const updated = { ...all[idx]!, ...data } as LocalSite;
  all[idx] = updated;
  writeAll(all);
  return updated;
}

/** Elimina una sucursal local */
export function deleteLocalSite(id: string): void {
  writeAll(readAll().filter((s) => s.id !== id));
}
