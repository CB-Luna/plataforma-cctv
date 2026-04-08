import { expect, test, type Page } from "@playwright/test";

const COOKIE_URL = process.env.E2E_BASE_URL ?? "http://127.0.0.1:3010";

const BASE_TENANT = {
  id: "tenant-1",
  name: "Bimbo",
  slug: "bimbo",
  domain: "bimbo.demo",
  logo_url: null,
  primary_color: "#1976D2",
  secondary_color: "#424242",
  tertiary_color: "#757575",
  is_active: true,
  subscription_plan: "professional",
  max_users: 25,
  max_clients: 100,
  settings: {
    package_profile: "professional",
    enabled_services: ["cctv", "storage"],
    onboarding: {
      status: "ready",
      admin_email: "admin@bimbo.demo",
      role_name: "tenant_admin",
      notes: "Tenant listo para operar.",
    },
  },
  created_at: "2026-04-07T00:00:00Z",
  updated_at: "2026-04-07T00:00:00Z",
};

const TENANTS = [
  BASE_TENANT,
  {
    ...BASE_TENANT,
    id: "tenant-2",
    name: "Demo CCTV",
    slug: "demo-cctv",
    subscription_plan: "basic",
    settings: {
      package_profile: "basic",
      enabled_services: ["cctv"],
      onboarding: {
        status: "tenant_created_only",
        notes: "Falta bootstrap de admin inicial.",
      },
    },
  },
  {
    ...BASE_TENANT,
    id: "tenant-3",
    name: "Enterprise Labs",
    slug: "enterprise-labs",
    subscription_plan: "enterprise",
    settings: {
      package_profile: "enterprise",
      enabled_services: ["cctv", "storage", "intelligence"],
      onboarding: {
        status: "ready",
        admin_email: "admin@labs.demo",
        role_name: "tenant_admin",
      },
    },
  },
];

const SETTINGS_RESPONSE = {
  id: BASE_TENANT.id,
  name: BASE_TENANT.name,
  slug: BASE_TENANT.slug,
  primary_color: BASE_TENANT.primary_color,
  secondary_color: BASE_TENANT.secondary_color,
  tertiary_color: BASE_TENANT.tertiary_color,
  is_active: true,
  settings: BASE_TENANT.settings,
  subscription_plan: BASE_TENANT.subscription_plan,
  max_users: BASE_TENANT.max_users,
  max_clients: BASE_TENANT.max_clients,
  created_at: BASE_TENANT.created_at,
  updated_at: BASE_TENANT.updated_at,
};

const SITES_RESPONSE = [];

const ME_RESPONSE = {
  user: {
    id: "user-1",
    tenant_id: BASE_TENANT.id,
    email: "admin@demo.com",
    first_name: "Admin",
    last_name: "Sistema",
    is_active: true,
    email_verified: true,
    created_at: "2026-04-07T00:00:00Z",
  },
  companies: [BASE_TENANT],
  roles: [],
  permissions: [
    { id: "p1", code: "tenants.read", created_at: "2026-04-07T00:00:00Z" },
    { id: "p2", code: "menu.read", created_at: "2026-04-07T00:00:00Z" },
    { id: "p3", code: "users.read", created_at: "2026-04-07T00:00:00Z" },
    { id: "p4", code: "roles.read", created_at: "2026-04-07T00:00:00Z" },
    { id: "p5", code: "settings.read", created_at: "2026-04-07T00:00:00Z" },
    { id: "p6", code: "storage.read", created_at: "2026-04-07T00:00:00Z" },
    { id: "p7", code: "ai_models.read", created_at: "2026-04-07T00:00:00Z" },
    { id: "p8", code: "tenants.create", created_at: "2026-04-07T00:00:00Z" },
    { id: "p9", code: "tenants.update", created_at: "2026-04-07T00:00:00Z" },
  ],
};

async function mockPhase6Context(page: Page) {
  await page.route("**/api/v1/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname;

    if (path.endsWith("/auth/me")) {
      await route.fulfill({ json: ME_RESPONSE });
      return;
    }

    if (path.endsWith("/settings")) {
      await route.fulfill({ json: SETTINGS_RESPONSE });
      return;
    }

    if (path.endsWith("/tenants/stats")) {
      await route.fulfill({
        json: {
          total_tenants: TENANTS.length,
          active_tenants: TENANTS.length,
        },
      });
      return;
    }

    if (path.endsWith("/tenants")) {
      await route.fulfill({ json: TENANTS });
      return;
    }

    if (path.endsWith("/sites")) {
      await route.fulfill({ json: SITES_RESPONSE });
      return;
    }

    await route.fulfill({ json: [] });
  });

  await page.addInitScript(({ tenant }) => {
    localStorage.setItem("access_token", "mock-token");
    localStorage.setItem("tenant_id", tenant.id);
    localStorage.setItem("tenant_snapshot", JSON.stringify(tenant));
  }, { tenant: BASE_TENANT });

  await page.context().addCookies([
    {
      name: "access_token",
      value: "mock-token",
      url: COOKIE_URL,
    },
  ]);
}

test.describe("Fase 6 - onboarding tenant y servicios", () => {
  test.beforeEach(async ({ page }) => {
    await mockPhase6Context(page);
  });

  test("settings expone el catalogo vigente de servicios y paquetes", async ({ page }) => {
    await page.goto("/settings?tab=servicios");

    await expect(page.getByRole("button", { name: "Servicios y paquetes", exact: true })).toBeVisible();
    await expect(page.getByText("Catalogo vigente de servicios y paquetes", { exact: true })).toBeVisible();
    await expect(page.getByText("Basic", { exact: true })).toBeVisible();
    await expect(page.getByText("Professional", { exact: true })).toBeVisible();
    await expect(page.getByText("Enterprise", { exact: true })).toBeVisible();
    await expect(page.getByText("Gobierno vigente de visibilidad", { exact: true })).toBeVisible();
    await expect(page.getByText("Control de Acceso", { exact: true })).toBeVisible();
    await expect(page.getByText(/no tiene rutas web ni API operativa/i)).toBeVisible();
  });

  test("servicios habilitados gobiernan tabs tenant del settings", async ({ page }) => {
    await page.goto("/settings?tab=tema");

    await expect(page.getByRole("button", { name: "Storage", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: /^IA$/i })).toHaveCount(0);
    await expect(page.getByText("Contexto operativo del tenant", { exact: true })).toBeVisible();
    await expect(page.getByText("Storage - Configuracion", { exact: true })).toBeVisible();
  });

  test("alta de empresa expone servicios habilitados y bootstrap inicial", async ({ page }) => {
    await page.goto("/settings?tab=empresas");
    await page.getByRole("button", { name: /Nueva empresa/i }).click();

    const dialog = page.getByRole("dialog");

    await expect(dialog).toBeVisible();
    await expect(dialog.getByText("Nuevo tenant operable", { exact: true })).toBeVisible();
    await expect(dialog.getByText("C6.2 Servicios y paquetes", { exact: true })).toBeVisible();
    await expect(dialog.getByText("Servicios planeados, sin modulo web ni API operativa", { exact: true })).toBeVisible();
    await expect(dialog.getByText("Control de Acceso", { exact: true })).toBeVisible();
    await expect(dialog.getByText("C6.1 Onboarding tenant", { exact: true })).toBeVisible();
    await expect(dialog.getByText("Crear admin inicial ahora", { exact: true })).toBeVisible();
    await expect(dialog.locator('input[type="password"]')).toBeVisible();
  });
});
