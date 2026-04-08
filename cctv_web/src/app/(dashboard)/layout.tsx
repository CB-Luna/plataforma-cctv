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
    () => isRouteEnabledForServices(pathname, enabledServices),
    [enabledServices, pathname],
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

    const activeCompany = companies[0];
    if (!activeCompany) {
      void hydrateSession();
      return;
    }

    if (!currentCompany || currentCompany.id !== activeCompany.id || currentCompany.id !== user.tenant_id) {
      setCompany(activeCompany);
    }

    setIsHydrating(false);
  }, [clearAuth, companies, currentCompany, isAuthenticated, router, setCompany, setProfile, user]);

  if (!isAuthenticated || isHydrating) return null;

  return (
    <ThemeProvider>
      <div className="flex h-screen flex-col">
        <Header />
        <div className="flex flex-1 overflow-hidden">
          <aside
            className={cn(
              "hidden shrink-0 overflow-y-auto bg-sidebar-nav-bg transition-[width] duration-200 md:block",
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
