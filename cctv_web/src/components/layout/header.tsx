"use client";

import { Fragment } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  Building2,
  ChevronRight,
  LogOut,
  Menu,
  Monitor,
  Moon,
  PanelLeft,
  PanelLeftClose,
  Search,
  Sun,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { logout } from "@/lib/api/auth";
import { getWorkspaceExperience } from "@/lib/auth/workspace-experience";
import { useAuthStore } from "@/stores/auth-store";
import { useSidebarStore } from "@/stores/sidebar-store";
import { useSiteStore } from "@/stores/site-store";
import { useTenantStore } from "@/stores/tenant-store";
import { useThemeStore } from "@/stores/theme-store";
import { SiteSelector } from "./site-selector";

const breadcrumbMap: Record<string, string> = {
  dashboard: "Dashboard",
  tickets: "Tickets",
  policies: "Polizas",
  sla: "SLA",
  cameras: "Camaras",
  nvrs: "NVRs",
  inventory: "Inventario",
  "floor-plans": "Planos",
  map: "Mapa",
  tenants: "Empresas",
  clients: "Clientes",
  settings: "Configuracion",
  users: "Usuarios",
  roles: "Roles",
  storage: "Almacenamiento",
  intelligence: "Inteligencia",
  topology: "Topologia",
  imports: "Importacion",
  "mass-import": "Importacion Masiva",
  capex: "CAPEX / Garantias",
  "camera-models": "Fichas Tecnicas",
};

function resolveBreadcrumbLabel(segment: string, settingsLabel: string, dashboardLabel: string) {
  if (segment === "settings") {
    return settingsLabel;
  }

  if (segment === "dashboard") {
    return dashboardLabel;
  }

  return breadcrumbMap[segment] ?? segment;
}

export function Header() {
  const user = useAuthStore((state) => state.user);
  const roles = useAuthStore((state) => state.roles);
  const permissions = useAuthStore((state) => state.permissions);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const clearCompany = useTenantStore((state) => state.clearCompany);
  const currentCompany = useTenantStore((state) => state.currentCompany);
  const currentSite = useSiteStore((state) => state.currentSite);
  const toggleCollapsed = useSidebarStore((state) => state.toggleCollapsed);
  const collapsed = useSidebarStore((state) => state.collapsed);
  const setMobileOpen = useSidebarStore((state) => state.setMobileOpen);
  const theme = useThemeStore((state) => state.theme);
  const setTheme = useThemeStore((state) => state.setTheme);
  const router = useRouter();
  const pathname = usePathname();

  const experience = getWorkspaceExperience({
    permissions,
    roles,
    company: currentCompany,
  });

  async function handleLogout() {
    try {
      await logout();
    } catch {
      // Ignore remote logout errors and clear local session anyway.
    }

    clearCompany();
    clearAuth();
    router.push("/login");
  }

  const initials = user
    ? `${user.first_name.charAt(0)}${user.last_name.charAt(0)}`.toUpperCase()
    : "?";

  const breadcrumbs = pathname
    .split("/")
    .filter(Boolean)
    .map((segment) =>
      resolveBreadcrumbLabel(segment, experience.settingsLabel, experience.dashboardLabel),
    )
    .filter(Boolean);

  return (
    <header className="flex h-14 items-center justify-between border-b border-gray-200/60 bg-white/70 px-4 backdrop-blur-xl dark:border-gray-800/60 dark:bg-gray-950/70">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setMobileOpen(true)}
        >
          <Menu className="h-5 w-5" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="hidden md:inline-flex"
          onClick={toggleCollapsed}
        >
          {collapsed ? <PanelLeft className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
        </Button>

        <nav className="hidden items-center gap-1.5 text-sm md:flex">
          <span className="text-muted-foreground">{experience.shellRootLabel}</span>
          {breadcrumbs.map((crumb, index) => (
            <Fragment key={`${crumb}-${index}`}>
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50" />
              <span
                className={
                  index === breadcrumbs.length - 1
                    ? "font-medium text-foreground"
                    : "text-muted-foreground"
                }
              >
                {crumb}
              </span>
            </Fragment>
          ))}
        </nav>

        <h1 className="text-sm font-semibold md:hidden">{experience.shellTitle}</h1>
      </div>

      <div className="flex items-center gap-1 sm:gap-2">
        <button className="hidden items-center gap-3 rounded-xl border border-gray-200 bg-gray-50/80 px-3.5 py-1.5 text-sm text-muted-foreground shadow-sm transition-all hover:bg-white hover:shadow-md lg:flex dark:border-gray-700 dark:bg-gray-800/50 dark:hover:bg-gray-800">
          <Search className="h-3.5 w-3.5" />
          <span className="text-gray-400">Buscar...</span>
          <kbd className="pointer-events-none rounded-md border border-gray-200 bg-white px-1.5 py-0.5 text-[10px] font-mono text-gray-400 dark:border-gray-700 dark:bg-gray-800">
            Cmd+K
          </kbd>
        </button>

        <SiteSelector />

        {currentCompany ? (
          <div className="hidden items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-1.5 shadow-sm sm:flex dark:border-gray-700 dark:bg-gray-900">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-lg text-white"
              style={{ backgroundColor: currentCompany.primary_color ?? "#1976D2" }}
            >
              <Building2 className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{currentCompany.name}</p>
              <p className="truncate text-xs text-muted-foreground">
                {currentSite
                  ? `${experience.shellBadgeLabel} - ${currentCompany.slug} - Sitio: ${currentSite.name}`
                  : `${experience.shellBadgeLabel} - ${currentCompany.slug}`}
              </p>
            </div>
            <Badge variant="outline">{experience.roleLabel}</Badge>
            <Badge variant="secondary">{experience.shellBadgeLabel}</Badge>
            {currentSite ? <Badge variant="secondary">Sitio</Badge> : null}
          </div>
        ) : null}

        <button className="relative rounded-lg p-2 transition-colors hover:bg-muted">
          <Bell className="h-4 w-4" />
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            3
          </span>
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center justify-center rounded-lg p-2 transition-colors hover:bg-muted">
            {theme === "dark" ? (
              <Moon className="h-4 w-4" />
            ) : theme === "system" ? (
              <Monitor className="h-4 w-4" />
            ) : (
              <Sun className="h-4 w-4" />
            )}
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setTheme("light")}>
              <Sun className="mr-2 h-4 w-4" />
              Claro
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme("dark")}>
              <Moon className="mr-2 h-4 w-4" />
              Oscuro
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme("system")}>
              <Monitor className="mr-2 h-4 w-4" />
              Sistema
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 rounded-xl px-2 py-1.5 transition-all hover:bg-gray-100 dark:hover:bg-gray-800">
            <Avatar className="h-8 w-8 ring-2 ring-gray-200 dark:ring-gray-700">
              <AvatarFallback className="bg-gradient-to-br from-sky-500 to-blue-700 text-xs font-bold text-white">
                {initials}
              </AvatarFallback>
            </Avatar>
            <span className="hidden text-sm font-medium md:inline">
              {user?.first_name} {user?.last_name}
            </span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuGroup>
              <div className="px-2 py-1.5 text-xs text-muted-foreground">{user?.email}</div>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push(experience.settingsHref)}>
              <Building2 className="mr-2 h-4 w-4" />
              {experience.settingsLabel}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              Cerrar sesion
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
