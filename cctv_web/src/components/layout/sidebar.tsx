"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2 } from "lucide-react";
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
import { getVisibleRuntimeMenu, type RuntimeMenuLinkItem } from "@/lib/product/runtime-navigation";
import { renderIcon } from "@/lib/icon-map";
import { useAuthStore } from "@/stores/auth-store";
import { useTenantStore } from "@/stores/tenant-store";
import { cn } from "@/lib/utils";

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
  const sections = getVisibleRuntimeMenu({
    enabledServices: tenantProfile.enabledServices,
    hasRoleContext: roles.length > 0,
    hasAnyPermission,
    disabledScreens: tenantProfile.disabledScreens,
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
        company={experience.mode === "tenant_portal" ? currentCompany : undefined}
        experienceBadge={experience.shellBadgeLabel}
        roleLabel={experience.roleLabel}
        services={visibleRuntimeServices}
      />

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
  items: RuntimeMenuLinkItem[],
  hasAnyPermission: (...permissions: string[]) => boolean,
  enabledServices: ProductServiceCode[],
  hasRoleContext: boolean,
): RuntimeMenuLinkItem[] {
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
  company,
  experienceBadge,
  roleLabel,
  services,
}: {
  collapsed: boolean;
  company?: { name: string; logo_url?: string | null; primary_color?: string | null } | null;
  experienceBadge: string;
  roleLabel?: string;
  services?: ProductServiceCode[];
}) {
  const isTenant = Boolean(company);

  return (
    <div
      className={cn(
        "shrink-0 border-b border-white/10",
        collapsed ? "flex h-16 items-center justify-center px-2" : "px-4 py-4",
      )}
    >
      <div className={cn("flex items-center", collapsed ? "" : "gap-3")}>
        {isTenant && company?.logo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={company.logo_url}
            alt={company.name}
            className="h-9 w-9 shrink-0 rounded-xl border border-white/10 object-cover"
          />
        ) : isTenant && company ? (
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white"
            style={{ backgroundColor: company.primary_color ?? "#1976D2" }}
          >
            {company.name.charAt(0).toUpperCase()}
          </div>
        ) : (
          /* Admin del sistema: logo de la plataforma */
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src="/logo.png"
            alt="INFRAIX"
            className="h-9 w-9 shrink-0 rounded-xl border border-white/10 object-cover"
          />
        )}
        {!collapsed ? (
          <div className="min-w-0">
            <h2 className="truncate text-sm font-bold leading-tight text-white">
              {company?.name ?? "INFRAIX"}
            </h2>
            <p className="truncate text-[10px] leading-tight text-slate-400/70">
              {isTenant && roleLabel ? roleLabel : experienceBadge}
            </p>
          </div>
        ) : null}
      </div>
      {/* Servicios visibles del tenant */}
      {!collapsed && isTenant && services && services.length > 0 ? (
        <div className="mt-2.5 flex flex-wrap gap-1.5 pl-12">
          {services.map((serviceCode) => (
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
  item: RuntimeMenuLinkItem;
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
        <span className="absolute left-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-r-full bg-tenant-primary" />
      ) : null}
      {renderIcon(
        item.icon,
        cn(
          "h-5 w-5 shrink-0 transition-transform duration-200",
          active ? "scale-110 text-tenant-primary" : "text-slate-500 group-hover:text-slate-300",
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
