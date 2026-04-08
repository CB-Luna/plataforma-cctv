import { expect, test, type Page } from "@playwright/test";

const COOKIE_URL = process.env.E2E_BASE_URL ?? "http://127.0.0.1:3011";

const TENANT_WITH_MODULES = {
  id: "tenant-bimbo",
  name: "Bimbo",
  slug: "bimbo",
  domain: "bimbo.demo",
  logo_url: null,
  primary_color: "#1976D2",
  secondary_color: "#424242",
  tertiary_color: "#757575",
  is_active: true,
  subscription_plan: "enterprise",
  max_users: 50,
  max_clients: 100,
  settings: {
    package_profile: "enterprise",
    enabled_services: ["cctv", "access_control", "networking", "storage", "intelligence"],
    onboarding: {
      status: "ready",
      admin_email: "admin@bimbo.demo",
      role_name: "tenant_admin",
      notes: "Tenant listo para operar.",
    },
  },
  created_at: "2026-04-08T00:00:00Z",
  updated_at: "2026-04-08T00:00:00Z",
};

const TENANT_CCTV_ONLY = {
  ...TENANT_WITH_MODULES,
  id: "tenant-cctv",
  name: "Tenant CCTV",
  slug: "tenant-cctv",
  subscription_plan: "basic",
  settings: {
    package_profile: "basic",
    enabled_services: ["cctv"],
    onboarding: {
      status: "ready",
      admin_email: "ops@tenant-cctv.demo",
      role_name: "tenant_admin",
      notes: "Solo CCTV habilitado.",
    },
  },
};

function buildMeResponse(tenant: typeof TENANT_WITH_MODULES) {
  return {
    user: {
      id: "user-1",
      tenant_id: tenant.id,
      email: "admin@demo.com",
      first_name: "Admin",
      last_name: "Tenant",
      is_active: true,
      email_verified: true,
      created_at: "2026-04-08T00:00:00Z",
    },
    companies: [tenant],
    roles: [
      {
        id: "role-tenant-admin",
        tenant_id: tenant.id,
        name: "tenant_admin",
        description: "Admin del tenant",
        is_system: true,
        created_at: "2026-04-08T00:00:00Z",
      },
    ],
    permissions: [
      { id: "p1", code: "inventory.read", description: "inventario", module: "inventory", created_at: "2026-04-08T00:00:00Z" },
      { id: "p2", code: "tickets.read", description: "tickets", module: "tickets", created_at: "2026-04-08T00:00:00Z" },
      { id: "p3", code: "settings.read", description: "settings", module: "settings", created_at: "2026-04-08T00:00:00Z" },
      { id: "p4", code: "users.read", description: "users", module: "users", created_at: "2026-04-08T00:00:00Z" },
      { id: "p5", code: "roles.read", description: "roles", module: "roles", created_at: "2026-04-08T00:00:00Z" },
      { id: "p6", code: "storage.read", description: "storage", module: "storage", created_at: "2026-04-08T00:00:00Z" },
      { id: "p7", code: "ai_models.read", description: "ia", module: "ai", created_at: "2026-04-08T00:00:00Z" },
    ],
  };
}

async function mockRuntimeModules(page: Page, tenant: typeof TENANT_WITH_MODULES) {
  await page.route("**/api/v1/**", async (route) => {
    const path = new URL(route.request().url()).pathname;

    if (path.endsWith("/auth/me")) {
      await route.fulfill({ json: buildMeResponse(tenant) });
      return;
    }

    if (path.endsWith("/settings")) {
      await route.fulfill({
        json: {
          ...tenant,
          settings: tenant.settings,
        },
      });
      return;
    }

    if (path.endsWith("/sites")) {
      await route.fulfill({ json: [] });
      return;
    }

    await route.fulfill({ json: [] });
  });

  await page.addInitScript(({ tenant }) => {
    localStorage.setItem("access_token", "mock-token");
    localStorage.setItem("tenant_id", tenant.id);
    localStorage.setItem("tenant_snapshot", JSON.stringify(tenant));
  }, { tenant });

  await page.context().addCookies([
    {
      name: "access_token",
      value: "mock-token",
      url: COOKIE_URL,
    },
  ]);
}

test.describe("Fase 7 - runtime visible de modulos WIP", () => {
  test("el tenant con Control de Acceso y Redes habilitados los ve en el menu y navega sus rutas", async ({ page }) => {
    await mockRuntimeModules(page, TENANT_WITH_MODULES);

    await page.goto("/dashboard");

    await expect(page.getByRole("complementary").getByText("Control de Acceso", { exact: true })).toBeVisible();
    await expect(page.getByRole("complementary").getByText("Redes", { exact: true })).toBeVisible();
    await expect(page.getByText("WIP").first()).toBeVisible();

    await page.goto("/access-control");
    await expect(page.getByRole("heading", { name: "Control de Acceso", exact: true })).toBeVisible();
    await expect(page.getByText("Work in progress visible", { exact: true })).toBeVisible();

    await page.goto("/networking/reports");
    await expect(page.getByRole("heading", { name: "Redes", exact: true })).toBeVisible();
    await expect(page.getByText("Reportes en construccion", { exact: true })).toBeVisible();
  });

  test("el tenant sin esos servicios no ve los dominios y queda bloqueado por servicio", async ({ page }) => {
    await mockRuntimeModules(page, TENANT_CCTV_ONLY);

    await page.goto("/dashboard");

    await expect(page.getByText("Control de Acceso", { exact: true })).toHaveCount(0);
    await expect(page.getByText("Redes", { exact: true })).toHaveCount(0);

    await page.goto("/access-control");
    await expect(page.getByText("Servicio no habilitado", { exact: true })).toBeVisible();
  });
});
