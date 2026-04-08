import { getRouteAccessRule } from "@/lib/auth/access-control";
import {
  isRouteEnabledForServices,
  isServiceRuntimeVisible,
  type ProductServiceCode,
} from "@/lib/product/service-catalog";

export interface RuntimeMenuLinkItem {
  id: string;
  label: string;
  icon: string;
  route: string;
  permissions?: string[];
  service?: ProductServiceCode;
}

export interface RuntimeMenuSection {
  id: string;
  label: string;
  service?: ProductServiceCode;
  items: RuntimeMenuLinkItem[];
}

export const RUNTIME_MENU_SECTIONS: RuntimeMenuSection[] = [
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

export function filterVisibleRuntimeLinks(params: {
  items: RuntimeMenuLinkItem[];
  hasAnyPermission?: (...permissions: string[]) => boolean;
  enabledServices: ProductServiceCode[];
  hasRoleContext: boolean;
  ignorePermissions?: boolean;
}): RuntimeMenuLinkItem[] {
  const { items, hasAnyPermission, enabledServices, hasRoleContext, ignorePermissions = false } = params;

  return items.filter((item) => {
    if (!ignorePermissions && item.permissions && hasAnyPermission && !hasAnyPermission(...item.permissions)) {
      return false;
    }

    if (!item.service) {
      return true;
    }

    return isRouteEnabledForServices(item.route, enabledServices, { hasRoleContext });
  });
}

export function getVisibleRuntimeMenu(params: {
  enabledServices: ProductServiceCode[];
  hasRoleContext: boolean;
  hasAnyPermission?: (...permissions: string[]) => boolean;
  ignorePermissions?: boolean;
}): RuntimeMenuSection[] {
  return RUNTIME_MENU_SECTIONS.map((section) => ({
    ...section,
    items: filterVisibleRuntimeLinks({
      items: section.items,
      hasAnyPermission: params.hasAnyPermission,
      enabledServices: params.enabledServices,
      hasRoleContext: params.hasRoleContext,
      ignorePermissions: params.ignorePermissions,
    }),
  })).filter((section) => {
    if (!section.items.length) {
      return false;
    }

    if (!section.service) {
      return true;
    }

    return (
      params.enabledServices.includes(section.service) &&
      isServiceRuntimeVisible(section.service, { hasRoleContext: params.hasRoleContext })
    );
  });
}
