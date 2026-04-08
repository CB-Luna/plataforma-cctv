import { describe, expect, it } from "vitest";
import { getPreferredTenantSettingsHref, getWorkspaceExperience } from "@/lib/auth/workspace-experience";
import type { Company, Permission, Role } from "@/types/api";

const company: Company = {
  id: "tenant-1",
  name: "Bimbo",
  slug: "bimbo",
  is_active: true,
  subscription_plan: "professional",
  settings: {
    package_profile: "professional",
    enabled_services: ["cctv", "storage"],
  },
};

const tenantPermissions: Permission[] = [
  { id: "p1", code: "users.read", description: "users", module: "users", created_at: "2026-04-07T00:00:00Z" },
  { id: "p2", code: "roles.read", description: "roles", module: "roles", created_at: "2026-04-07T00:00:00Z" },
  { id: "p3", code: "storage.read", description: "storage", module: "storage", created_at: "2026-04-07T00:00:00Z" },
];

const tenantRoles: Role[] = [
  {
    id: "r1",
    tenant_id: "tenant-1",
    name: "Administrador Bimbo",
    description: "Administrador interno",
    is_system: false,
    created_at: "2026-04-07T00:00:00Z",
  },
];

describe("workspace experience", () => {
  it("detects a tenant-only portal experience", () => {
    const experience = getWorkspaceExperience({
      permissions: tenantPermissions,
      roles: tenantRoles,
      company,
    });

    expect(experience.mode).toBe("tenant_portal");
    expect(experience.shellRootLabel).toBe("Portal");
    expect(experience.dashboardLabel).toBe("Inicio del portal");
    expect(experience.settingsLabel).toBe("Mi empresa");
    expect(experience.roleLabel).toBe("Administrador Bimbo");
  });

  it("detects a hybrid workspace when platform permissions exist", () => {
    const experience = getWorkspaceExperience({
      permissions: [
        ...tenantPermissions,
        { id: "p4", code: "tenants.read", description: "tenants", module: "tenants", created_at: "2026-04-07T00:00:00Z" },
      ],
      roles: [
        ...tenantRoles,
        {
          id: "r2",
          tenant_id: "tenant-1",
          name: "super_admin",
          description: "Administrador global",
          is_system: true,
          created_at: "2026-04-07T00:00:00Z",
        },
      ],
      company,
    });

    expect(experience.mode).toBe("hybrid_backoffice");
    expect(experience.shellRootLabel).toBe("Backoffice");
    expect(experience.settingsLabel).toBe("Configuracion");
    expect(experience.roleContext).toBe("mixed");
  });

  it("picks the first visible tenant settings tab based on permissions and services", () => {
    expect(getPreferredTenantSettingsHref(tenantPermissions, company)).toBe("/settings?tab=usuarios");

    expect(
      getPreferredTenantSettingsHref(
        [
          { id: "p5", code: "storage.read", description: "storage", module: "storage", created_at: "2026-04-07T00:00:00Z" },
        ],
        company,
      ),
    ).toBe("/settings?tab=almacenamiento");
  });
});
