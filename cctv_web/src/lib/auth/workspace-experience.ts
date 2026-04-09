import type { Company, Permission, Role } from "@/types/api";
import { hasAnyPermission } from "@/lib/auth/permissions";
import { isSettingsTabEnabledForServices, parseTenantProductProfile } from "@/lib/product/service-catalog";

const PLATFORM_PERMISSION_HINTS = [
  "tenants.read",
  "tenants:read:all",
  "tenants.create",
  "tenants.update",
  "tenants:update:all",
  "menu.read",
  "menu:read:all",
  "permissions:read:all",
  "admin.read",
  "admin:read:all",
];

const TENANT_SETTINGS_DESTINATIONS: Array<{
  tab: string;
  access: string[];
}> = [
  {
    tab: "usuarios",
    access: ["users.read", "users:read:own", "users:read:all"],
  },
  {
    tab: "roles",
    access: ["roles.read", "roles:read:own", "roles:read:all", "permissions:read:all"],
  },
  {
    tab: "tema",
    access: [
      "settings.read",
      "configuration.read",
      "configuration:read:own",
      "configuration:read:all",
      "themes:read:own",
      "themes:read:all",
    ],
  },
  {
    tab: "almacenamiento",
    access: ["storage.read", "storage:read:own", "storage:read:all"],
  },
  {
    tab: "ia",
    access: ["ai_models.read", "ai_models:read:own", "ai_models:read:all"],
  },
];

type WorkspaceMode = "tenant_portal" | "hybrid_backoffice";
type RoleContext = "tenant" | "platform" | "mixed";

export interface WorkspaceExperience {
  mode: WorkspaceMode;
  hasPlatformWorkspace: boolean;
  shellRootLabel: string;
  shellBadgeLabel: string;
  shellTitle: string;
  shellDescription: string;
  dashboardLabel: string;
  settingsLabel: string;
  settingsHref: string;
  roleLabel: string;
  roleContext: RoleContext;
}

function resolveRoleContext(roles: Role[]): {
  roleLabel: string;
  roleContext: RoleContext;
} {
  if (!roles.length) {
    return {
      roleLabel: "Sin rol confirmado",
      roleContext: "tenant",
    };
  }

  const tenantRoles = roles.filter((role) => !role.is_system || role.name === "tenant_admin");
  const platformRoles = roles.filter((role) => role.is_system && role.name !== "tenant_admin");

  if (tenantRoles.length && platformRoles.length) {
    return {
      roleLabel: tenantRoles[0]?.name ?? platformRoles[0]?.name ?? "Acceso mixto",
      roleContext: "mixed",
    };
  }

  if (tenantRoles.length) {
    return {
      roleLabel: tenantRoles[0]?.name ?? "Rol tenant",
      roleContext: "tenant",
    };
  }

  return {
    roleLabel: platformRoles[0]?.name ?? "Rol plataforma",
    roleContext: "platform",
  };
}

export function getPreferredTenantSettingsHref(
  permissions: Permission[],
  company: Company | null | undefined,
): string {
  const permissionCodes = permissions.map((permission) => permission.code);
  const enabledServices = parseTenantProductProfile(company).enabledServices;

  const destination = TENANT_SETTINGS_DESTINATIONS.find(
    (candidate) =>
      hasAnyPermission(permissionCodes, candidate.access) &&
      isSettingsTabEnabledForServices(candidate.tab, enabledServices),
  );

  return destination ? `/settings?tab=${destination.tab}` : "/settings";
}

export function getWorkspaceExperience(params: {
  permissions: Permission[];
  roles: Role[];
  company: Company | null | undefined;
}): WorkspaceExperience {
  const permissionCodes = params.permissions.map((permission) => permission.code);
  // Determinar si el usuario opera la plataforma por sus ROLES (no solo permisos).
  // tenant_admin también tiene permissions:read:all, así que no alcanza con permisos.
  const hasPlatformRoles = params.roles.some(
    (role) => role.is_system && role.name !== "tenant_admin",
  );
  // Fallback a permisos solo cuando no hay roles definidos (e.g. usuarios sin rol asignado)
  const hasPlatformWorkspace =
    hasPlatformRoles ||
    (params.roles.length === 0 && hasAnyPermission(permissionCodes, PLATFORM_PERMISSION_HINTS));
  const roleContext = resolveRoleContext(params.roles);
  const mode: WorkspaceMode = hasPlatformWorkspace ? "hybrid_backoffice" : "tenant_portal";
  const companyName = params.company?.name ?? "tu empresa";

  if (mode === "tenant_portal") {
    return {
      mode,
      hasPlatformWorkspace,
      shellRootLabel: "Portal",
      shellBadgeLabel: "Portal tenant",
      shellTitle: `Portal de ${companyName}`,
      shellDescription: "Operacion cotidiana, usuarios internos y configuracion propia de la empresa activa.",
      dashboardLabel: "Inicio del portal",
      settingsLabel: "Mi empresa",
      settingsHref: getPreferredTenantSettingsHref(params.permissions, params.company),
      roleLabel: roleContext.roleLabel,
      roleContext: roleContext.roleContext,
    };
  }

  return {
    mode,
    hasPlatformWorkspace,
    shellRootLabel: "Plataforma",
    shellBadgeLabel: "Plataforma",
    shellTitle: "SyMTickets CCTV",
    shellDescription: "Gobierno de empresas, servicios, plantillas y monitoreo de onboarding desde la plataforma global.",
    dashboardLabel: "Dashboard",
    settingsLabel: "Configuracion",
    settingsHref: "/settings",
    roleLabel: roleContext.roleLabel,
    roleContext: roleContext.roleContext,
  };
}
