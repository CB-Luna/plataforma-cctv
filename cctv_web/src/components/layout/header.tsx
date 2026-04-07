"use client";

import { useAuthStore } from "@/stores/auth-store";
import { useTenantStore } from "@/stores/tenant-store";
import { useSidebarStore } from "@/stores/sidebar-store";
import { useThemeStore } from "@/stores/theme-store";
import { useRouter, usePathname } from "next/navigation";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Building2, LogOut, Menu, PanelLeftClose, PanelLeft, Sun, Moon, Monitor, Bell, ChevronRight, Search } from "lucide-react";
import { logout } from "@/lib/api/auth";
import { SiteSelector } from "./site-selector";
import { Fragment } from "react";

const breadcrumbMap: Record<string, string> = {
  dashboard: "Dashboard",
  tickets: "Tickets",
  policies: "Pólizas",
  sla: "SLA",
  cameras: "Cámaras",
  nvrs: "NVRs",
  inventory: "Inventario",
  "floor-plans": "Planos",
  map: "Mapa",
  tenants: "Tenants",
  clients: "Clientes",
  settings: "Configuración",
  users: "Usuarios",
  roles: "Roles",
  storage: "Almacenamiento",
  intelligence: "Inteligencia",
  topology: "Topología",
  imports: "Importación",
  "mass-import": "Importación Masiva",
  capex: "CAPEX / Garantías",
  "camera-models": "Fichas Técnicas",
};

export function Header() {
  const user = useAuthStore((s) => s.user);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const companies = useAuthStore((s) => s.companies);
  const currentCompany = useTenantStore((s) => s.currentCompany);
  const setCompany = useTenantStore((s) => s.setCompany);
  const toggleCollapsed = useSidebarStore((s) => s.toggleCollapsed);
  const collapsed = useSidebarStore((s) => s.collapsed);
  const setMobileOpen = useSidebarStore((s) => s.setMobileOpen);
  const theme = useThemeStore((s) => s.theme);
  const setTheme = useThemeStore((s) => s.setTheme);
  const router = useRouter();
  const pathname = usePathname();

  async function handleLogout() {
    try {
      await logout();
    } catch {
      // ignore
    }
    clearAuth();
    router.push("/login");
  }

  const initials = user
    ? `${user.first_name.charAt(0)}${user.last_name.charAt(0)}`.toUpperCase()
    : "?";

  // Build breadcrumb segments from pathname
  const segments = pathname.split("/").filter(Boolean);
  const breadcrumbs = segments.map((seg) => breadcrumbMap[seg] ?? seg).filter(Boolean);

  return (
    <header className="flex h-14 items-center justify-between border-b border-gray-200/60 bg-white/70 px-4 backdrop-blur-xl dark:border-gray-800/60 dark:bg-gray-950/70">
      <div className="flex items-center gap-2">
        {/* Mobile hamburger */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setMobileOpen(true)}
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Desktop sidebar toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="hidden md:inline-flex"
          onClick={toggleCollapsed}
        >
          {collapsed ? <PanelLeft className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
        </Button>

        {/* Breadcrumb */}
        <nav className="hidden items-center gap-1.5 text-sm md:flex">
          <span className="text-muted-foreground">Panel</span>
          {breadcrumbs.map((crumb, i) => (
            <Fragment key={i}>
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50" />
              <span className={i === breadcrumbs.length - 1 ? "font-medium text-foreground" : "text-muted-foreground"}>
                {crumb}
              </span>
            </Fragment>
          ))}
        </nav>

        {/* Mobile title */}
        <h1 className="text-sm font-semibold md:hidden">SyMTickets CCTV</h1>
      </div>

      <div className="flex items-center gap-1 sm:gap-2">
        {/* Search trigger (visual placeholder) */}
        <button className="hidden items-center gap-3 rounded-xl border border-gray-200 bg-gray-50/80 px-3.5 py-1.5 text-sm text-muted-foreground shadow-sm transition-all hover:bg-white hover:shadow-md lg:flex dark:border-gray-700 dark:bg-gray-800/50 dark:hover:bg-gray-800">
          <Search className="h-3.5 w-3.5" />
          <span className="text-gray-400">Buscar...</span>
          <kbd className="pointer-events-none rounded-md border border-gray-200 bg-white px-1.5 py-0.5 text-[10px] font-mono text-gray-400 dark:border-gray-700 dark:bg-gray-800">⌘K</kbd>
        </button>

        {/* Site selector */}
        <SiteSelector />

        {/* Notifications placeholder */}
        <button className="relative rounded-lg p-2 transition-colors hover:bg-muted">
          <Bell className="h-4 w-4" />
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            3
          </span>
        </button>

        {/* Theme toggle */}
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

        {/* Company selector */}
        {companies.length > 1 && (
          <DropdownMenu>
            <DropdownMenuTrigger className="hidden items-center gap-1 rounded-lg border px-2 py-1 text-sm transition-colors hover:bg-muted sm:flex">
              <Building2 className="h-4 w-4" />
              <span>{currentCompany?.slug ?? "Seleccionar"}</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
            <DropdownMenuGroup>
              <DropdownMenuLabel>Empresas</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {companies.map((c) => (
                <DropdownMenuItem key={c.id} onClick={() => setCompany(c)}>
                  {c.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* User menu */}
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
              <DropdownMenuLabel>{user?.email}</DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push("/settings")}>
              <Building2 className="mr-2 h-4 w-4" />
              Configuración
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              Cerrar sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
