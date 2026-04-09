export interface AccessRule {
  anyOf: string[];
  title: string;
  description: string;
}

const SETTINGS_ACCESS = [
  "configuration.read",
  "configuration:read:own",
  "configuration:read:all",
  "settings.read",
  "users.read",
  "users:read:own",
  "users:read:all",
  "roles.read",
  "roles:read:own",
  "roles:read:all",
  "permissions:read:all",
  "tenants.read",
  "tenants:read:all",
  "storage.read",
  "storage:read:own",
  "storage:read:all",
  "ai_models.read",
  "ai_models:read:own",
  "ai_models:read:all",
  "menu.read",
  "menu:read:all",
  "themes:read:own",
  "themes:read:all",
  "admin.read",
  "admin:read:own",
  "admin:read:all",
];

const CCTV_ACCESS = [
  "inventory.read",
  "inventory:read:own",
  "inventory:read:all",
];

const MODULE_DISCOVERY_ACCESS = [
  "inventory.read",
  "inventory:read:own",
  "inventory:read:all",
  "tickets.read",
  "tickets:read:own",
  "tickets:read:all",
  "settings.read",
  "configuration.read",
  "configuration:read:own",
  "configuration:read:all",
  "users.read",
  "users:read:own",
  "users:read:all",
  "roles.read",
  "roles:read:own",
  "roles:read:all",
  "admin.read",
  "admin:read:own",
  "admin:read:all",
];

const ROUTE_ACCESS_RULES: Array<{ route: string; rule: AccessRule }> = [
  {
    route: "/settings",
    rule: {
      anyOf: SETTINGS_ACCESS,
      title: "Sin acceso a configuración",
      description: "Tu rol no tiene permisos para entrar a este espacio híbrido de plataforma y tenant.",
    },
  },
  {
    route: "/users",
    rule: {
      anyOf: ["users.read", "users:read:own", "users:read:all"],
      title: "Sin acceso a usuarios",
      description: "Tu perfil no puede consultar la administración de usuarios en este contexto.",
    },
  },
  {
    route: "/roles",
    rule: {
      anyOf: ["roles.read", "roles:read:own", "roles:read:all"],
      title: "Sin acceso a roles",
      description: "Tu perfil no puede consultar roles y permisos en este contexto.",
    },
  },
  {
    route: "/tenants",
    rule: {
      anyOf: ["tenants.read", "tenants:read:all"],
      title: "Sin acceso a empresas",
      description: "La administración global de empresas solo está disponible para perfiles con alcance de plataforma.",
    },
  },
  {
    route: "/storage",
    rule: {
      anyOf: ["storage.read", "storage:read:own", "storage:read:all"],
      title: "Sin acceso a storage",
      description: "Tu perfil no puede consultar la configuración de almacenamiento del tenant activo.",
    },
  },
  {
    route: "/intelligence",
    rule: {
      anyOf: ["ai_models.read", "ai_models:read:own", "ai_models:read:all"],
      title: "Sin acceso a IA",
      description: "Tu perfil no puede consultar la configuración de inteligencia del tenant activo.",
    },
  },
  {
    route: "/tickets",
    rule: {
      anyOf: ["tickets.read", "tickets:read:own", "tickets:read:all"],
      title: "Sin acceso a tickets",
      description: "No tienes permisos para consultar tickets dentro de la empresa activa.",
    },
  },
  {
    route: "/clients",
    rule: {
      anyOf: ["clients.read", "clients:read:own", "clients:read:all"],
      title: "Sin acceso a clientes",
      description: "No tienes permisos para consultar clientes dentro de la empresa activa.",
    },
  },
  {
    route: "/policies",
    rule: {
      anyOf: ["policies.read", "policies:read:all"],
      title: "Sin acceso a pólizas",
      description: "No tienes permisos para consultar pólizas en este tenant.",
    },
  },
  {
    route: "/sla",
    rule: {
      anyOf: ["sla.read", "sla:read:all"],
      title: "Sin acceso a SLA",
      description: "No tienes permisos para consultar políticas SLA en este tenant.",
    },
  },
  {
    route: "/inventory",
    rule: {
      anyOf: CCTV_ACCESS,
      title: "Sin acceso a inventario",
      description: "No tienes permisos para consultar el inventario CCTV del tenant activo.",
    },
  },
  {
    route: "/sites",
    rule: {
      anyOf: CCTV_ACCESS,
      title: "Sin acceso a sucursales",
      description: "No tienes permisos para consultar las sucursales del tenant activo.",
    },
  },
  {
    route: "/cameras",
    rule: {
      anyOf: CCTV_ACCESS,
      title: "Sin acceso a cámaras",
      description: "No tienes permisos para consultar cámaras dentro del tenant activo.",
    },
  },
  {
    route: "/camera-models",
    rule: {
      anyOf: CCTV_ACCESS,
      title: "Sin acceso a fichas técnicas",
      description: "No tienes permisos para consultar fichas técnicas dentro del tenant activo.",
    },
  },
  {
    route: "/nvrs",
    rule: {
      anyOf: CCTV_ACCESS,
      title: "Sin acceso a NVR",
      description: "No tienes permisos para consultar NVR dentro del tenant activo.",
    },
  },
  {
    route: "/floor-plans",
    rule: {
      anyOf: CCTV_ACCESS,
      title: "Sin acceso a planos",
      description: "No tienes permisos para consultar planos dentro del tenant activo.",
    },
  },
  {
    route: "/imports",
    rule: {
      anyOf: CCTV_ACCESS,
      title: "Sin acceso a importaciones",
      description: "No tienes permisos para consultar el módulo de importación en este tenant.",
    },
  },
  {
    route: "/capex",
    rule: {
      anyOf: CCTV_ACCESS,
      title: "Sin acceso a CAPEX",
      description: "No tienes permisos para consultar CAPEX y garantías del tenant activo.",
    },
  },
  {
    route: "/map",
    rule: {
      anyOf: CCTV_ACCESS,
      title: "Sin acceso al mapa",
      description: "No tienes permisos para consultar el mapa del tenant activo.",
    },
  },
  {
    route: "/access-control",
    rule: {
      anyOf: MODULE_DISCOVERY_ACCESS,
      title: "Sin acceso a Control de Acceso",
      description: "Este modulo scaffold/WIP requiere al menos permisos base de operacion o configuracion dentro del tenant activo.",
    },
  },
  {
    route: "/networking",
    rule: {
      anyOf: MODULE_DISCOVERY_ACCESS,
      title: "Sin acceso a Redes",
      description: "Este modulo scaffold/WIP requiere al menos permisos base de operacion o configuracion dentro del tenant activo.",
    },
  },
];

export function getRouteAccessRule(pathname: string): AccessRule | null {
  const match = ROUTE_ACCESS_RULES.find(
    ({ route }) => pathname === route || pathname.startsWith(`${route}/`),
  );

  return match?.rule ?? null;
}
