"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Camera } from "lucide-react";
import { renderIcon } from "@/lib/icon-map";
import { getRouteAccessRule } from "@/lib/auth/access-control";
import { useAuthStore } from "@/stores/auth-store";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

interface FlatItem {
  type: "link" | "section" | "separator";
  id: string;
  label: string;
  icon: string;
  route?: string;
  permissions?: string[];
}

const CCTV_ITEMS: FlatItem[] = [
  { type: "separator", id: "sep-cctv", label: "", icon: "" },
  { type: "section", id: "sec-cctv", label: "CCTV", icon: "" },
  { type: "link", id: "nav-inventory", label: "Inventario", icon: "inventory_2", route: "/inventory", permissions: getRouteAccessRule("/inventory")?.anyOf },
  { type: "link", id: "nav-cameras", label: "CÃ¡maras", icon: "videocam", route: "/cameras", permissions: getRouteAccessRule("/cameras")?.anyOf },
  { type: "link", id: "nav-camera-models", label: "Fichas TÃ©cnicas", icon: "camera", route: "/camera-models", permissions: getRouteAccessRule("/camera-models")?.anyOf },
  { type: "link", id: "nav-nvrs", label: "Servidores NVR", icon: "storage", route: "/nvrs", permissions: getRouteAccessRule("/nvrs")?.anyOf },
  { type: "link", id: "nav-floor-plans", label: "Planos", icon: "map", route: "/floor-plans", permissions: getRouteAccessRule("/floor-plans")?.anyOf },
  { type: "link", id: "nav-map", label: "Mapa", icon: "location_on", route: "/map", permissions: getRouteAccessRule("/map")?.anyOf },
  { type: "link", id: "nav-imports", label: "ImportaciÃ³n", icon: "description", route: "/imports", permissions: getRouteAccessRule("/imports")?.anyOf },
];

const OPERATIONS_ITEMS: FlatItem[] = [
  { type: "separator", id: "sep-ops", label: "", icon: "" },
  { type: "section", id: "sec-ops", label: "Operaciones", icon: "" },
  { type: "link", id: "nav-tickets", label: "Tickets", icon: "assignment", route: "/tickets", permissions: getRouteAccessRule("/tickets")?.anyOf },
  { type: "link", id: "nav-clients", label: "Clientes", icon: "business", route: "/clients", permissions: getRouteAccessRule("/clients")?.anyOf },
  { type: "link", id: "nav-policies", label: "PÃ³lizas y SLA", icon: "description", route: "/policies", permissions: getRouteAccessRule("/policies")?.anyOf },
  { type: "link", id: "nav-sla", label: "Niveles SLA", icon: "assessment", route: "/sla", permissions: getRouteAccessRule("/sla")?.anyOf },
  { type: "link", id: "nav-capex", label: "CAPEX / GarantÃ­as", icon: "verified_user", route: "/capex", permissions: getRouteAccessRule("/capex")?.anyOf },
];

function buildMenu(): FlatItem[] {
  return [
    { type: "link", id: "nav-dashboard", label: "Dashboard", icon: "dashboard", route: "/dashboard" },
    ...CCTV_ITEMS,
    ...OPERATIONS_ITEMS,
    { type: "separator", id: "sep-config", label: "", icon: "" },
    { type: "link", id: "nav-settings", label: "ConfiguraciÃ³n", icon: "settings", route: "/settings", permissions: getRouteAccessRule("/settings")?.anyOf },
  ];
}

interface SidebarProps {
  collapsed?: boolean;
  onNavigate?: () => void;
}

export function Sidebar({ collapsed = false, onNavigate }: SidebarProps) {
  const pathname = usePathname();
  const hasAnyPermission = useAuthStore((s) => s.hasAnyPermission);
  const flatItems = buildMenu();

  return (
    <div className="flex h-full flex-col">
      <SidebarBranding collapsed={collapsed} />

      <nav
        className={cn(
          "flex flex-1 flex-col gap-0.5 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10",
          collapsed ? "items-center px-2 py-4" : "px-3 py-4",
        )}
      >
        {flatItems.map((item) => {
          if (item.type === "separator") {
            return (
              <div key={item.id} className={cn("my-3", collapsed ? "mx-auto w-6" : "mx-2")}>
                <hr className="border-white/10" />
              </div>
            );
          }

          if (item.type === "section") {
            if (collapsed) return null;

            return (
              <div key={item.id} className="px-3 pb-1 pt-5">
                <span className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">
                  {item.label}
                </span>
              </div>
            );
          }

          if (item.permissions && !hasAnyPermission(...item.permissions)) {
            return null;
          }

          return (
            <MenuLink
              key={item.id}
              item={item}
              pathname={pathname}
              collapsed={collapsed}
              onNavigate={onNavigate}
            />
          );
        })}
      </nav>

      <SidebarFooter collapsed={collapsed} />
    </div>
  );
}

function SidebarBranding({ collapsed }: { collapsed: boolean }) {
  return (
    <div
      className={cn(
        "flex shrink-0 items-center border-b border-white/10",
        collapsed ? "h-16 justify-center px-2" : "h-16 gap-3 px-6",
      )}
    >
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-sky-400 to-blue-600 text-sm font-bold text-white shadow-lg shadow-sky-500/25">
        <Camera className="h-4 w-4" />
      </div>
      {!collapsed && (
        <div className="min-w-0">
          <h2 className="truncate text-sm font-bold leading-tight text-white">SyMTickets</h2>
          <p className="truncate text-[10px] leading-tight text-slate-400/70">CCTV Platform</p>
        </div>
      )}
    </div>
  );
}

function SidebarFooter({ collapsed }: { collapsed: boolean }) {
  return (
    <div
      className={cn(
        "shrink-0 border-t border-white/10 py-3 text-center",
        collapsed ? "px-1" : "px-4",
      )}
    >
      <p className="text-[10px] text-slate-600">{collapsed ? "v1" : "v1.0.0"}</p>
    </div>
  );
}

function MenuLink({
  item,
  pathname,
  collapsed = false,
  onNavigate,
}: {
  item: FlatItem;
  pathname: string;
  collapsed?: boolean;
  onNavigate?: () => void;
}) {
  const active = item.route ? pathname === item.route || pathname.startsWith(`${item.route}/`) : false;

  const link = (
    <Link
      href={item.route ?? "#"}
      onClick={onNavigate}
      className={cn(
        "group relative flex items-center rounded-lg text-sm font-medium transition-all duration-200",
        collapsed ? "justify-center p-2.5" : "gap-3 px-3 py-2.5",
        active
          ? "bg-white/15 text-white shadow-sm"
          : "text-slate-400 hover:bg-white/5 hover:text-slate-200",
      )}
    >
      {active && !collapsed && (
        <span className="absolute left-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-r-full bg-sky-400" />
      )}
      {renderIcon(
        item.icon,
        cn(
          "h-5 w-5 shrink-0 transition-transform duration-200",
          active ? "scale-110 text-sky-400" : "text-slate-500 group-hover:text-slate-300",
        ),
      )}
      {!collapsed && <span>{item.label}</span>}
    </Link>
  );

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger className="w-full">{link}</TooltipTrigger>
        <TooltipContent side="right">{item.label}</TooltipContent>
      </Tooltip>
    );
  }

  return link;
}
