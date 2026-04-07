"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";
import { useTenantStore } from "@/stores/tenant-store";
import { useSidebarStore } from "@/stores/sidebar-store";
import { getMe } from "@/lib/api/auth";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const setProfile = useAuthStore((s) => s.setProfile);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const setCompany = useTenantStore((s) => s.setCompany);
  const currentCompany = useTenantStore((s) => s.currentCompany);
  const collapsed = useSidebarStore((s) => s.collapsed);
  const mobileOpen = useSidebarStore((s) => s.mobileOpen);
  const setMobileOpen = useSidebarStore((s) => s.setMobileOpen);

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }

    // Hydrate profile if we only have a token (page reload)
    if (!user) {
      getMe()
        .then((me) => {
          setProfile(me.user, me.companies, me.permissions);
          if (!currentCompany && me.companies.length > 0) {
            setCompany(me.companies[0]);
          }
        })
        .catch(() => {
          clearAuth();
          router.replace("/login");
        });
    }
  }, [isAuthenticated, user, router, setProfile, clearAuth, setCompany, currentCompany]);

  if (!isAuthenticated) return null;

  return (
    <ThemeProvider>
      <div className="flex h-screen flex-col">
        <Header />
        <div className="flex flex-1 overflow-hidden">
          {/* Desktop sidebar */}
          <aside
            className={cn(
              "hidden shrink-0 overflow-y-auto bg-sidebar-nav-bg transition-[width] duration-200 md:block",
              collapsed ? "w-16" : "w-64"
            )}
          >
            <Sidebar collapsed={collapsed} />
          </aside>

          {/* Mobile sidebar (Sheet) */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetContent side="left" className="w-64 bg-sidebar-nav-bg p-0" showCloseButton={false}>
              <Sidebar collapsed={false} onNavigate={() => setMobileOpen(false)} />
            </SheetContent>
          </Sheet>

          <main className="flex-1 overflow-y-auto bg-bg-page p-4 md:p-6">{children}</main>
        </div>
        <Toaster richColors position="top-right" />
      </div>
    </ThemeProvider>
  );
}
