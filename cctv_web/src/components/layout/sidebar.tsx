"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, Camera } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { getRouteAccessRule } from "@/lib/auth/access-control";
import { getWorkspaceExperience } from "@/lib/auth/workspace-experience";
import {
  PRODUCT_SERVICE_DEFINITIONS,
  getServiceStatusMeta,
  isRouteEnabledForServices,
  isServiceRuntimeVisible,
  parseTenantProductProfile,
  type ProductServiceCode,
} from "@/lib/product/service-catalog";
import { renderIcon } from "@/lib/icon-map";
import { useAuthStore } from "@/stores/auth-store";
import { useTenantStore } from "@/stores/tenant-store";
import { cn } from "@/lib/utils";

interface MenuLinkItem {
  id: string;
  label: string;
  icon: string;
  route: string;
  permissions?: string[];
  service?: ProductServiceCode;
}

interface MenuSection {
  id: string;
  label: string;
  service?: ProductServiceCode;
  items: MenuLinkItem[];
}

const MENU_SECTIONS: MenuSection[] = [
  {
    id: "cctv",
    label: "CCTV",
    items: [
      {
        id: "nav-inventory",
        label: "Inventario",
        icon: "inventory_2",
        route: "/inventory",
        permissions: getRouteAccessRule("/inventory")?.anyOf,
        service: "cctv",
      },
      {
        id: "nav-cameras",
        label: "Camaras",
        icon: "videocam",
        route: "/cameras",
        permissions: getRouteAccessRule("/cameras")?.anyOf,
        service: "cctv",
      },
      {
        id: "nav-camera-models",
        label: "Fichas tecnicas",
        icon: "camera",
        route: "/camera-models",
        permissions: getRouteAccessRule("/camera-models")?.anyOf,
        service: "cctv",
      },
      {
        id: "nav-nvrs",
        label: "Servidores NVR",
        icon: "storage",
        route: "/nvrs",
        permissions: getRouteAccessRule("/nvrs")?.anyOf,
        service: "cctv",
      },
      {
        id: "nav-floor-plans",
        label: "Planos",
        icon: "map",
        route: "/floor-plans",
        permissions: getRouteAccessRule("/floor-plans")?.anyOf,
        service: "cctv",
      },
      {
        id: "nav-map",
        label: "Mapa",
        icon: "location_on",
        route: "/map",
        permissions: getRouteAccessRule("/map")?.anyOf,
        service: "cctv",
      },
      {
        id: "nav-imports",
        label: "Importacion",
        icon: "description",
        route: "/imports",
        permissions: getRouteAccessRule("/imports")?.anyOf,
        service: "cctv",
      },
    ],
  },
  {
    id: "ops",
    label: "Operaciones",
    items: [
      {
        id: "nav-tickets",
        label: "Tickets",
        icon: "assignment",
        route: "/tickets",
        permissions: getRouteAccessRule("/tickets")?.anyOf,
      },
      {
        id: "nav-clients",
        label: "Clientes",
        icon: "business",
        route: "/clients",
        permissions: getRouteAccessRule("/clients")?.anyOf,
      },
      {
        id: "nav-policies",
        label: "Polizas y SLA",
        icon: "description",
        route: "/policies",
        permissions: getRouteAccessRule("/policies")?.anyOf,
      },
      {
        id: "nav-sla",
        label: "Niveles SLA",
        icon: "assessment",
        route: "/sla",
        permissions: getRouteAccessRule("/sla")?.anyOf,
      },
      {
        id: "nav-capex",
        label: "CAPEX / Garantias",
        icon: "verified_user",
        route: "/capex",
        permissions: getRouteAccessRule("/capex")?.anyOf,
      },
    ],
  },
  {
    id: "access-control",
    label: "Control de Acceso",
    service: "access_control",
    items: [
      {
        id: "nav-access-control-overview",
        label: "Resumen",
        icon: "dashboard",
        route: "/access-control",
        permissions: getRouteAccessRule("/access-control")?.anyOf,
        service: "access_control",
      },
      {
        id: "nav-access-control-inventory",
        label: "Inventario",
        icon: "inventory_2",
        route: "/access-control/inventory",
        permissions: getRouteAccessRule("/access-control/inventory")?.anyOf,
        service: "access_control",
      },
      {
        id: "nav-access-control-tech-sheets",
        label: "Fichas tecnicas",
        icon: "description",
        route: "/access-control/technical-sheets",
        permissions: getRouteAccessRule("/access-control/technical-sheets")?.anyOf,
        service: "access_control",
      },
      {
        id: "nav-access-control-maintenance",
        label: "Mantenimiento",
        icon: "build",
        route: "/access-control/maintenance",
        permissions: getRouteAccessRule("/access-control/maintenance")?.anyOf,
        service: "access_control",
      },
      {
        id: "nav-access-control-incidents",
        label: "Incidentes",
        icon: "warning",
        route: "/access-control/incidents",
        permissions: getRouteAccessRule("/access-control/incidents")?.anyOf,
        service: "access_control",
      },
      {
        id: "nav-access-control-reports",
        label: "Reportes",
        icon: "assessment",
        route: "/access-control/reports",
        permissions: getRouteAccessRule("/access-control/reports")?.anyOf,
        service: "access_control",
      },
    ],
  },
  {
    id: "networking",
    label: "Redes",
    service: "networking",
    items: [
      {
        id: "nav-networking-overview",
        label: "Resumen",
        icon: "dashboard",
        route: "/networking",
        permissions: getRouteAccessRule("/networking")?.anyOf,
        service: "networking",
      },
      {
        id: "nav-networking-inventory",
        label: "Inventario",
        icon: "inventory_2",
        route: "/networking/inventory",
        permissions: getRouteAccessRule("/networking/inventory")?.anyOf,
        service: "networking",
      },
      {
        id: "nav-networking-tech-sheets",
        label: "Fichas tecnicas",
        icon: "description",
        route: "/networking/technical-sheets",
        permissions: getRouteAccessRule("/networking/technical-sheets")?.anyOf,
        service: "networking",
      },
      {
        id: "nav-networking-maintenance",
        label: "Mantenimiento",
        icon: "build",
        route: "/networking/maintenance",
        permissions: getRouteAccessRule("/networking/maintenance")?.anyOf,
        service: "networking",
      },
      {
        id: "nav-networking-incidents",
        label: "Incidentes",
        icon: "warning",
        route: "/networking/incidents",
        permissions: getRouteAccessRule("/networking/incidents")?.anyOf,
        service: "networking",
      },
      {
        id: "nav-networking-reports",
        label: "Reportes",
        icon: "assessment",
        route: "/networking/reports",
        permissions: getRouteAccessRule("/networking/reports")?.anyOf,
        service: "networking",
      },
    ],
  },
];

interface SidebarProps {
  collapsed?: boolean;
  onNavigate?: () => void;
}

export function Sidebar({ collapsed = false, onNavigate }: SidebarProps) {
  const pathname = usePathname();
  const permissions = useAuthStore((state) => state.permissions);
  const roles = useAuthStore((state) => state.roles);
  const hasAnyPermission = useAuthStore((state) => state.hasAnyPermission);
  const currentCompany = useTenantStore((state) => state.currentCompany);
  const tenantProfile = parseTenantProductProfile(currentCompany);
  const experience = getWorkspaceExperience({
    permissions,
    roles,
    company: currentCompany,
  });
  const visibleRuntimeServices = tenantProfile.enabledServices.filter((serviceCode) =>
    isServiceRuntimeVisible(serviceCode, { hasRoleContext: roles.length > 0 }),
  );
  const primaryLinks = filterVisibleLinks(
    [
      {
        id: "nav-dashboard",
        label: experience.dashboardLabel,
        icon: "dashboard",
        route: "/dashboard",
      },
    ],
    hasAnyPermission,
    tenantProfile.enabledServices,
    roles.length > 0,
  );
  const sections = MENU_SECTIONS.map((section) => ({
    ...section,
    items: filterVisibleLinks(
      section.items,
      hasAnyPermission,
      tenantProfile.enabledServices,
      roles.length > 0,
    ),
  })).filter((section) => {
    if (!section.items.length) {
      return false;
    }

    if (!section.service) {
      return true;
    }

    return (
      tenantProfile.enabledServices.includes(section.service) &&
      isServiceRuntimeVisible(section.service, { hasRoleContext: roles.length > 0 })
    );
  });
  const secondaryLinks = filterVisibleLinks(
    [
      {
        id: "nav-settings",
        label: experience.settingsLabel,
        icon: "settings",
        route: experience.settingsHref,
        permissions: getRouteAccessRule("/settings")?.anyOf,
      },
    ],
    hasAnyPermission,
    tenantProfile.enabledServices,
    roles.length > 0,
  );

  return (
    <div className="flex h-full flex-col">
      <SidebarBranding
        collapsed={collapsed}
        companyName={currentCompany?.name}
        experienceBadge={experience.shellBadgeLabel}
      />

      {experience.mode === "tenant_portal" && currentCompany && !collapsed ? (
        <div className="mx-3 mt-3 rounded-2xl border border-white/10 bg-white/5 p-3 text-white/90">
          <div className="flex items-center gap-2">
            {currentCompany.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={currentCompany.logo_url}
                alt={currentCompany.name}
                className="h-8 w-8 rounded-xl border border-white/10 object-cover"
              />
            ) : (
              <div
                className="flex h-8 w-8 items-center justify-center rounded-xl text-white"
                style={{ backgroundColor: currentCompany.primary_color ?? "#1976D2" }}
              >
                <Building2 className="h-4 w-4" />
              </div>
            )}
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{currentCompany.name}</p>
              <p className="truncate text-[11px] text-slate-300">{experience.roleLabel}</p>
            </div>
          </div>
          <p className="mt-3 text-xs text-slate-300">
            Este shell ya prioriza la operacion de tu empresa y sus modulos habilitados.
          </p>
          {visibleRuntimeServices.length ? (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {visibleRuntimeServices.map((serviceCode) => (
                <span
                  key={`sidebar-service-${serviceCode}`}
                  className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] font-medium text-white/80"
                >
                  {PRODUCT_SERVICE_DEFINITIONS[serviceCode].shortLabel}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      <nav
        className={cn(
          "flex flex-1 flex-col gap-0.5 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10",
          collapsed ? "items-center px-2 py-4" : "px-3 py-4",
        )}
      >
        {primaryLinks.map((item) => (
          <MenuLink
            key={item.id}
            item={item}
            pathname={pathname}
            collapsed={collapsed}
            onNavigate={onNavigate}
          />
        ))}

        {sections.map((section) => (
          <div key={section.id}>
            <SidebarSeparator collapsed={collapsed} />
            {!collapsed ? (
              <div className="px-3 pb-1 pt-5">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">
                    {section.label}
                  </span>
                  {section.service ? (
                    <span className="rounded-full border border-white/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                      {getServiceStatusMeta(PRODUCT_SERVICE_DEFINITIONS[section.service].status).label}
                    </span>
                  ) : null}
                </div>
              </div>
            ) : null}
            {section.items.map((item) => (
              <MenuLink
                key={item.id}
                item={item}
                pathname={pathname}
                collapsed={collapsed}
                onNavigate={onNavigate}
              />
            ))}
          </div>
        ))}

        {secondaryLinks.length ? (
          <div>
            <SidebarSeparator collapsed={collapsed} />
            {secondaryLinks.map((item) => (
              <MenuLink
                key={item.id}
                item={item}
                pathname={pathname}
                collapsed={collapsed}
                onNavigate={onNavigate}
              />
            ))}
          </div>
        ) : null}
      </nav>

      <SidebarFooter collapsed={collapsed} />
    </div>
  );
}

function filterVisibleLinks(
  items: MenuLinkItem[],
  hasAnyPermission: (...permissions: string[]) => boolean,
  enabledServices: ProductServiceCode[],
  hasRoleContext: boolean,
): MenuLinkItem[] {
  return items.filter((item) => {
    if (item.permissions && !hasAnyPermission(...item.permissions)) {
      return false;
    }

    if (!item.service) {
      return true;
    }

    return isRouteEnabledForServices(item.route, enabledServices, { hasRoleContext });
  });
}

function SidebarSeparator({ collapsed }: { collapsed: boolean }) {
  return (
    <div className={cn("my-3", collapsed ? "mx-auto w-6" : "mx-2")}>
      <hr className="border-white/10" />
    </div>
  );
}

function SidebarBranding({
  collapsed,
  companyName,
  experienceBadge,
}: {
  collapsed: boolean;
  companyName?: string;
  experienceBadge: string;
}) {
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
      {!collapsed ? (
        <div className="min-w-0">
          <h2 className="truncate text-sm font-bold leading-tight text-white">
            {companyName ?? "SyMTickets"}
          </h2>
          <p className="truncate text-[10px] leading-tight text-slate-400/70">{experienceBadge}</p>
        </div>
      ) : null}
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
  item: MenuLinkItem;
  pathname: string;
  collapsed?: boolean;
  onNavigate?: () => void;
}) {
  const routePath = item.route.split("?")[0] ?? item.route;
  const active = pathname === routePath || pathname.startsWith(`${routePath}/`);

  const link = (
    <Link
      href={item.route}
      onClick={onNavigate}
      className={cn(
        "group relative flex items-center rounded-lg text-sm font-medium transition-all duration-200",
        collapsed ? "justify-center p-2.5" : "gap-3 px-3 py-2.5",
        active
          ? "bg-white/15 text-white shadow-sm"
          : "text-slate-400 hover:bg-white/5 hover:text-slate-200",
      )}
    >
      {active && !collapsed ? (
        <span className="absolute left-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-r-full bg-sky-400" />
      ) : null}
      {renderIcon(
        item.icon,
        cn(
          "h-5 w-5 shrink-0 transition-transform duration-200",
          active ? "scale-110 text-sky-400" : "text-slate-500 group-hover:text-slate-300",
        ),
      )}
      {!collapsed ? <span>{item.label}</span> : null}
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
