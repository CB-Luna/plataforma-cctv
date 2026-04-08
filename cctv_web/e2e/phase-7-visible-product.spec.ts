import fs from "node:fs/promises";
import path from "node:path";
import { expect, test, type Page } from "@playwright/test";

const COOKIE_URL = process.env.E2E_BASE_URL ?? "http://127.0.0.1:3011";
const SCREENSHOT_DIR = path.resolve(process.cwd(), "..", "docs", "producto-visible", "evidencia");

const CALIMAX_TENANT = {
  id: "tenant-calimax",
  name: "Calimax",
  slug: "calimax",
  domain: "calimax.demo",
  logo_url: null,
  primary_color: "#2563EB",
  secondary_color: "#0F172A",
  tertiary_color: "#94A3B8",
  is_active: true,
  subscription_plan: "enterprise",
  max_users: 80,
  max_clients: 240,
  settings: {
    package_profile: "enterprise",
    enabled_services: ["cctv", "access_control", "networking", "storage", "intelligence"],
    onboarding: {
      status: "ready",
      admin_email: "admin@calimax.demo",
      admin_name: "Admin Calimax",
      role_name: "tenant_admin",
      notes: "Calimax lista para operar con modulos multi-dominio.",
    },
  },
  created_at: "2026-04-08T00:00:00Z",
  updated_at: "2026-04-08T00:00:00Z",
};

const BIMBO_TENANT = {
  ...CALIMAX_TENANT,
  id: "tenant-bimbo",
  name: "Bimbo",
  slug: "bimbo",
  domain: "bimbo.demo",
  primary_color: "#0F766E",
  settings: {
    package_profile: "professional",
    enabled_services: ["cctv", "access_control", "storage"],
    onboarding: {
      status: "ready",
      admin_email: "admin@bimbo.demo",
      admin_name: "Admin Bimbo",
      role_name: "tenant_admin",
      notes: "Bimbo lista para operar.",
    },
  },
};

async function ensureScreenshotDir() {
  await fs.mkdir(SCREENSHOT_DIR, { recursive: true });
}

async function saveScreenshot(page: Page, filename: string) {
  await ensureScreenshotDir();
  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, filename),
    fullPage: true,
  });
}

async function seedSession(page: Page, tenant: typeof CALIMAX_TENANT) {
  await page.addInitScript(({ tenantSnapshot }) => {
    localStorage.setItem("access_token", "mock-token");
    localStorage.setItem("tenant_id", tenantSnapshot.id);
    localStorage.setItem("tenant_snapshot", JSON.stringify(tenantSnapshot));
  }, { tenantSnapshot: tenant });

  await page.context().addCookies([
    {
      name: "access_token",
      value: "mock-token",
      url: COOKIE_URL,
    },
  ]);
}

async function mockBackofficeVisible(page: Page) {
  await page.route("**/api/v1/**", async (route) => {
    const pathName = new URL(route.request().url()).pathname;

    if (pathName.endsWith("/auth/me")) {
      await route.fulfill({
        json: {
          user: {
            id: "user-platform-1",
            tenant_id: CALIMAX_TENANT.id,
            email: "admin@demo.com",
            first_name: "Admin",
            last_name: "Sistema",
            is_active: true,
            email_verified: true,
            created_at: "2026-04-08T00:00:00Z",
          },
          companies: [CALIMAX_TENANT],
          roles: [
            {
              id: "role-super-admin",
              tenant_id: CALIMAX_TENANT.id,
              name: "super_admin",
              description: "Administrador de plataforma",
              is_system: true,
              created_at: "2026-04-08T00:00:00Z",
            },
          ],
          permissions: [
            { id: "p1", code: "tenants.read", description: "tenants", module: "tenants", created_at: "2026-04-08T00:00:00Z" },
            { id: "p2", code: "tenants.create", description: "tenants", module: "tenants", created_at: "2026-04-08T00:00:00Z" },
            { id: "p3", code: "tenants.update", description: "tenants", module: "tenants", created_at: "2026-04-08T00:00:00Z" },
            { id: "p4", code: "menu.read", description: "menu", module: "menu", created_at: "2026-04-08T00:00:00Z" },
            { id: "p5", code: "settings.read", description: "settings", module: "settings", created_at: "2026-04-08T00:00:00Z" },
            { id: "p6", code: "users.read", description: "users", module: "users", created_at: "2026-04-08T00:00:00Z" },
            { id: "p7", code: "roles.read", description: "roles", module: "roles", created_at: "2026-04-08T00:00:00Z" },
            { id: "p8", code: "storage.read", description: "storage", module: "storage", created_at: "2026-04-08T00:00:00Z" },
            { id: "p9", code: "ai_models.read", description: "ia", module: "ai", created_at: "2026-04-08T00:00:00Z" },
          ],
        },
      });
      return;
    }

    if (pathName.endsWith("/tenants/stats")) {
      await route.fulfill({
        json: {
          total_tenants: 2,
          active_tenants: 2,
        },
      });
      return;
    }

    if (pathName.endsWith("/tenants")) {
      await route.fulfill({ json: [CALIMAX_TENANT, BIMBO_TENANT] });
      return;
    }

    if (pathName.endsWith("/settings")) {
      await route.fulfill({
        json: {
          ...CALIMAX_TENANT,
          settings: CALIMAX_TENANT.settings,
        },
      });
      return;
    }

    if (pathName.endsWith("/sites")) {
      await route.fulfill({ json: [] });
      return;
    }

    await route.fulfill({ json: [] });
  });

  await seedSession(page, CALIMAX_TENANT);
}

async function mockPortalVisible(page: Page) {
  await page.route("**/api/v1/**", async (route) => {
    const pathName = new URL(route.request().url()).pathname;

    if (pathName.endsWith("/auth/me")) {
      await route.fulfill({
        json: {
          user: {
            id: "user-calimax-admin",
            tenant_id: CALIMAX_TENANT.id,
            email: "admin@calimax.demo",
            first_name: "Admin",
            last_name: "Calimax",
            is_active: true,
            email_verified: true,
            created_at: "2026-04-08T00:00:00Z",
          },
          companies: [CALIMAX_TENANT],
          roles: [
            {
              id: "role-calimax-admin",
              tenant_id: CALIMAX_TENANT.id,
              name: "Administrador Calimax",
              description: "Administrador interno del tenant",
              is_system: false,
              created_at: "2026-04-08T00:00:00Z",
            },
          ],
          permissions: [
            { id: "p1", code: "settings.read", description: "settings", module: "settings", created_at: "2026-04-08T00:00:00Z" },
            { id: "p2", code: "users.read", description: "users", module: "users", created_at: "2026-04-08T00:00:00Z" },
            { id: "p3", code: "users.update", description: "users", module: "users", created_at: "2026-04-08T00:00:00Z" },
            { id: "p4", code: "roles.read", description: "roles", module: "roles", created_at: "2026-04-08T00:00:00Z" },
            { id: "p5", code: "roles.create", description: "roles", module: "roles", created_at: "2026-04-08T00:00:00Z" },
            { id: "p6", code: "roles.update", description: "roles", module: "roles", created_at: "2026-04-08T00:00:00Z" },
            { id: "p7", code: "inventory.read", description: "inventory", module: "inventory", created_at: "2026-04-08T00:00:00Z" },
            { id: "p8", code: "tickets.read", description: "tickets", module: "tickets", created_at: "2026-04-08T00:00:00Z" },
            { id: "p9", code: "storage.read", description: "storage", module: "storage", created_at: "2026-04-08T00:00:00Z" },
            { id: "p10", code: "ai_models.read", description: "ia", module: "ai", created_at: "2026-04-08T00:00:00Z" },
          ],
        },
      });
      return;
    }

    if (pathName.endsWith("/settings")) {
      await route.fulfill({
        json: {
          ...CALIMAX_TENANT,
          settings: CALIMAX_TENANT.settings,
        },
      });
      return;
    }

    if (pathName.endsWith("/users")) {
      await route.fulfill({
        json: [
          {
            id: "user-calimax-admin",
            tenant_id: CALIMAX_TENANT.id,
            tenant_name: CALIMAX_TENANT.name,
            email: "admin@calimax.demo",
            first_name: "Admin",
            last_name: "Calimax",
            is_active: true,
            email_verified: true,
            created_at: "2026-04-08T00:00:00Z",
            roles: [
              {
                id: "role-calimax-admin",
                tenant_id: CALIMAX_TENANT.id,
                name: "Administrador Calimax",
                is_system: false,
                created_at: "2026-04-08T00:00:00Z",
              },
            ],
          },
        ],
      });
      return;
    }

    if (pathName.endsWith("/roles")) {
      await route.fulfill({
        json: [
          {
            id: "role-calimax-admin",
            tenant_id: CALIMAX_TENANT.id,
            name: "Administrador Calimax",
            description: "Administrador interno del tenant",
            is_system: false,
            created_at: "2026-04-08T00:00:00Z",
          },
          {
            id: "role-calimax-supervisor",
            tenant_id: CALIMAX_TENANT.id,
            name: "Supervisor Calimax",
            description: "Supervisor operativo",
            is_system: false,
            created_at: "2026-04-08T00:00:00Z",
          },
        ],
      });
      return;
    }

    if (pathName.endsWith("/sites")) {
      await route.fulfill({ json: [] });
      return;
    }

    await route.fulfill({ json: [] });
  });

  await seedSession(page, CALIMAX_TENANT);
}

test.describe("Fase 7 - producto visible", () => {
  test("backoffice global hace visible empresa operable, paquetes y onboarding", async ({ page }) => {
    await mockBackofficeVisible(page);

    await page.goto("/settings?tab=empresas");
    await expect(page.getByText("Configuracion visible de tenant operable", { exact: true })).toBeVisible();
    await expect(page.getByText("Lo que vera la empresa al iniciar sesion", { exact: true })).toBeVisible();
    await saveScreenshot(page, "configuracion-empresas-visible.png");

    await page.goto("/settings?tab=servicios");
    await expect(page.getByText("Matriz visible por paquete", { exact: true })).toBeVisible();
    await expect(page.getByText("Configuracion efectiva de empresa", { exact: true })).toBeVisible();
    await saveScreenshot(page, "configuracion-paquetes-modulos.png");

    await page.goto("/settings?tab=empresas");
    await page.getByRole("button", { name: /Nueva empresa/i }).click();
    await expect(page.getByText("Vista previa del producto visible", { exact: true })).toBeVisible();
    await saveScreenshot(page, "alta-empresa-con-preview.png");
  });

  test("portal tenant muestra branding, roles internos y menu por empresa", async ({ page }) => {
    await mockPortalVisible(page);

    await page.goto("/settings?tab=usuarios");
    await expect(page.getByText(/Usuarios internos de Calimax/i)).toBeVisible();
    await expect(page.getByRole("complementary").getByText("Control de Acceso", { exact: true }).first()).toBeVisible();
    await expect(page.getByRole("complementary").getByText("Redes", { exact: true }).first()).toBeVisible();
    await saveScreenshot(page, "portal-tenant-usuarios.png");

    await page.goto("/settings?tab=tema");
    await expect(page.getByText("Plantillas visuales reutilizables", { exact: true })).toBeVisible();
    await expect(page.getByText("Preview del portal con este branding", { exact: true })).toBeVisible();
    await saveScreenshot(page, "portal-tenant-branding.png");
  });
});
