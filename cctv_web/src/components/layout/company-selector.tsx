"use client";

import { useQueryClient, useQuery } from "@tanstack/react-query";
import { Building2, ChevronDown, Check } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuthStore } from "@/stores/auth-store";
import { useTenantStore } from "@/stores/tenant-store";
import { useSiteStore } from "@/stores/site-store";
import { usePermissions } from "@/hooks/use-permissions";
import { listTenants } from "@/lib/api/tenants";
import { isPlatformTenant } from "@/lib/platform";
import type { Tenant, Company } from "@/types/api";

/**
 * Selector global de empresa.
 * - Admin Sistema: dropdown con todas las empresas (via API real, se actualiza al crear empresas).
 * - Tenant Admin (1 sola empresa): no se renderiza (el contexto ya es fijo).
 */
export function CompanySelector() {
  const authCompanies = useAuthStore((s) => s.companies);
  const currentCompany = useTenantStore((s) => s.currentCompany);
  const setCompany = useTenantStore((s) => s.setCompany);
  const clearCompany = useTenantStore((s) => s.clearCompany);
  const clearSite = useSiteStore((s) => s.clearSite);
  const queryClient = useQueryClient();
  const { isSystemAdmin } = usePermissions();

  // Admin del sistema: fetch empresas via API (se actualiza cuando se invalida ["tenants"])
  const { data: apiTenants } = useQuery<Tenant[]>({
    queryKey: ["tenants"],
    queryFn: () => listTenants(200),
    enabled: isSystemAdmin,
    staleTime: 2 * 60 * 1000,
    retry: false,
  });

  // Para admins del sistema, usar empresas del API; para tenant admin, las del auth store
  // Filtrar tenant plataforma — no es empresa real
  const companies: Company[] = (isSystemAdmin && apiTenants
    ? apiTenants
        .filter((t) => !isPlatformTenant(t.id))
        .map((t) => ({
          id: t.id,
          name: t.name,
          slug: t.slug ?? t.name.toLowerCase().replace(/\s+/g, "-"),
          primary_color: t.primary_color ?? undefined,
          secondary_color: t.secondary_color ?? undefined,
          tertiary_color: t.tertiary_color ?? undefined,
          logo_url: t.logo_url ?? null,
          is_active: t.is_active,
        }))
    : authCompanies
  ).filter((c) => !isPlatformTenant(c.id));

  // Admin del sistema siempre ve el selector (puede no tener empresa seleccionada)
  // Tenant admin con 1 sola empresa: no mostrar selector
  if (!isSystemAdmin && companies.length <= 1) return null;

  // Admin del sistema puede deseleccionar empresa para volver a modo plataforma
  function handleSelect(company: typeof companies[0]) {
    if (company.id === currentCompany?.id) {
      // Click en la misma empresa: deseleccionar (volver a modo plataforma)
      if (isSystemAdmin) {
        clearCompany();
        clearSite();
        void queryClient.invalidateQueries({ queryKey: ["sites"] });
        void queryClient.invalidateQueries({ queryKey: ["cameras"] });
        void queryClient.invalidateQueries({ queryKey: ["nvrs"] });
        void queryClient.invalidateQueries({ queryKey: ["inventory"] });
        void queryClient.invalidateQueries({ queryKey: ["tickets"] });
      }
      return;
    }
    setCompany(company);
    clearSite();
    void queryClient.invalidateQueries({ queryKey: ["sites"] });
    void queryClient.invalidateQueries({ queryKey: ["cameras"] });
    void queryClient.invalidateQueries({ queryKey: ["nvrs"] });
    void queryClient.invalidateQueries({ queryKey: ["inventory"] });
    void queryClient.invalidateQueries({ queryKey: ["tickets"] });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-sm shadow-sm transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:hover:bg-gray-800">
        <div
          className="flex h-5 w-5 items-center justify-center rounded"
          style={{ backgroundColor: currentCompany?.primary_color ?? "#6366f1" }}
        >
          <Building2 className="h-3 w-3 text-white" />
        </div>
        <span className="hidden max-w-[140px] truncate font-medium sm:inline">
          {currentCompany?.name ?? "Todas las empresas"}
        </span>
        <ChevronDown className="h-3 w-3 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Empresas disponibles</DropdownMenuLabel>
          <p className="px-2 pb-2 text-xs text-muted-foreground">
            Selecciona una empresa para inspeccionar sus datos, sucursales y configuracion.
          </p>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        {companies.map((company) => {
          const isSelected = company.id === currentCompany?.id;
          return (
            <DropdownMenuItem
              key={company.id}
              onClick={() => handleSelect(company)}
              className="flex items-center gap-2.5"
            >
              <div
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-white"
                style={{ backgroundColor: company.primary_color ?? "#6366f1" }}
              >
                <Building2 className="h-3.5 w-3.5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{company.name}</p>
                <p className="truncate text-xs text-muted-foreground">{company.slug}</p>
              </div>
              {isSelected && (
                <Check className="h-4 w-4 shrink-0 text-primary" />
              )}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
