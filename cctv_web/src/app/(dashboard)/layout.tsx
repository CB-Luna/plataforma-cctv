"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";
import { useTenantStore } from "@/stores/tenant-store";
import { useSidebarStore } from "@/stores/sidebar-store";
import { getMe } from "@/lib/api/auth";
import { getRouteAccessRule } from "@/lib/auth/access-control";
import { isRouteEnabledForServices, parseTenantProductProfile } from "@/lib/product/service-catalog";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { AccessDeniedState } from "@/components/auth/access-denied-state";
import { Toaster } from "@/components/ui/sonner";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const companies = useAuthStore((s) => s.companies);
  const roles = useAuthStore((s) => s.roles);
  const setProfile = useAuthStore((s) => s.setProfile);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const hasAnyPermission = useAuthStore((s) => s.hasAnyPermission);
  const setCompany = useTenantStore((s) => s.setCompany);
  const currentCompany = useTenantStore((s) => s.currentCompany);
  const collapsed = useSidebarStore((s) => s.collapsed);
  const mobileOpen = useSidebarStore((s) => s.mobileOpen);
  const setMobileOpen = useSidebarStore((s) => s.setMobileOpen);
  const [isHydrating, setIsHydrating] = useState(true);

  const routeAccessRule = useMemo(() => getRouteAccessRule(pathname), [pathname]);
  const hasRouteAccess = !routeAccessRule || hasAnyPermission(...routeAccessRule.anyOf);
  const enabledServices = useMemo(
    () => parseTenantProductProfile(currentCompany).enabledServices,
    [currentCompany],
  );
  const hasServiceAccess = useMemo(
    () => isRouteEnabledForServices(pathname, enabledServices, { hasRoleContext: roles.length > 0 }),
    [enabledServices, pathname, roles.length],
  );

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }

    async function hydrateSession() {
      try {
        const me = await getMe();
        setProfile(me.user, me.companies, me.roles, me.permissions);

        // Admin del sistema (rol is_system): NO auto-seleccionar empresa.
        // Inicia en modo plataforma global; puede elegir empresa desde CompanySelector.
        const hasPlatformRoles = me.roles.some(
          (r) => r.is_system && r.name !== "tenant_admin",
        );

        if (hasPlatformRoles) {
          // Modo plataforma: sin empresa activa por defecto
          setIsHydrating(false);
          return;
        }

        const activeCompany = me.companies[0];
        if (!activeCompany) {
          clearAuth();
          router.replace("/login");
          return;
        }

        setCompany(activeCompany);
        setIsHydrating(false);
      } catch {
        clearAuth();
        router.replace("/login");
      }
    }

    if (!user) {
      void hydrateSession();
      return;
    }

    if (companies.length === 0) {
      void hydrateSession();
      return;
    }

    // Admin del sistema con sesion previa: no forzar empresa
    const isSystemUser = roles.some(
      (r) => r.is_system && r.name !== "tenant_admin",
    );
    if (isSystemUser) {
      // Sistema admin puede estar sin empresa seleccionada (modo plataforma)
      setIsHydrating(false);
      return;
    }

    // Solo establecer empresa si no hay ninguna seleccionada,
    // o si la seleccionada ya no existe en la lista de empresas.
    if (!currentCompany || !companies.some((c) => c.id === currentCompany.id)) {
      setCompany(companies[0]);
    }

    // Refrescar datos de empresa en background para sesiones existentes
    // (actualiza logo_url, colores, settings que pudieron cambiar desde otra sesion)
    if (currentCompany) {
      getMe()
        .then((me) => {
          const fresh = me.companies.find((c) => c.id === currentCompany.id);
          if (fresh) setCompany(fresh);
        })
        .catch(() => { /* ignorar error de refresco silencioso */ });
    }

    setIsHydrating(false);
  }, [clearAuth, companies, currentCompany, isAuthenticated, router, setCompany, setProfile, user]);

  if (!isAuthenticated || isHydrating) return null;

  return (
    <ThemeProvider>
      <div className="flex h-screen">
        <aside
          className={cn(
            "hidden shrink-0 overflow-y-auto bg-sidebar-nav-bg transition-[width] duration-200 md:flex md:flex-col",
            collapsed ? "w-16" : "w-64",
          )}
        >
          <Sidebar collapsed={collapsed} />
        </aside>

        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent side="left" className="w-64 bg-sidebar-nav-bg p-0" showCloseButton={false}>
            <Sidebar collapsed={false} onNavigate={() => setMobileOpen(false)} />
          </SheetContent>
        </Sheet>

        <div className="flex flex-1 flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto bg-bg-page p-4 md:p-6">
            {hasRouteAccess && hasServiceAccess ? (
              children
            ) : !hasServiceAccess ? (
              <AccessDeniedState
                title="Servicio no habilitado"
                description="La ruta existe en la plataforma, pero no esta habilitada para el tenant activo segun sus servicios asignados."
              />
            ) : (
              <AccessDeniedState
                title={routeAccessRule?.title ?? "Sin acceso"}
                description={routeAccessRule?.description ?? "Tu rol no tiene permisos para entrar a esta sección."}
              />
            )}
          </main>
        </div>
        <Toaster richColors position="top-right" />
      </div>
    </ThemeProvider>
  );
}
