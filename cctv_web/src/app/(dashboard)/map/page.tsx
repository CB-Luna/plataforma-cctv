"use client";

import dynamic from "next/dynamic";
import { MapPin } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { useSiteStore } from "@/stores/site-store";
import { useTenantStore } from "@/stores/tenant-store";
import { usePermissions } from "@/hooks/use-permissions";
import { useAllSites } from "@/hooks/use-all-sites";
import { getWorkspaceExperience } from "@/lib/auth/workspace-experience";
import { SiteContextBanner } from "@/components/context/site-context-banner";

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

  const currentCompany = useTenantStore((s) => s.currentCompany);
  const { permissions, roles } = usePermissions();
  const experience = getWorkspaceExperience({ permissions, roles, company: currentCompany });
  const isPlatformAdmin = experience.mode === "hybrid_backoffice";

  const { sites } = useAllSites({ enabled: true });

  const visibleSites = currentSite
    ? sites.filter((site) => site.id === currentSite.id)
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
        <p className="text-xs text-muted-foreground">
          {currentSite
            ? "Vista acotada al sitio activo."
            : currentCompany
              ? `Contexto: ${currentCompany.name}`
              : "Contexto: Todas las empresas"}
        </p>
      </div>

      {/* Map container */}
      <div className="relative flex-1 overflow-hidden rounded-xl border border-gray-200 shadow-sm dark:border-gray-800">
        <BranchMap
          sites={visibleSites}
          filterClient=""
          companyLogo={currentCompany?.logo_url ?? null}
          companyName={currentCompany?.name ?? (isPlatformAdmin ? "Todas las empresas" : null)}
        />
      </div>
    </div>
  );
}
