import { expect, test, type Page } from "@playwright/test";

const BASE_TENANT = {
  id: "tenant-bimbo",
  name: "Bimbo",
  slug: "bimbo",
  domain: "bimbo.demo",
  logo_url: null,
  primary_color: "#0F766E",
  secondary_color: "#1E293B",
  tertiary_color: "#94A3B8",
  is_active: true,
  subscription_plan: "professional",
  max_users: 50,
  max_clients: 150,
  settings: {
    package_profile: "professional",
    enabled_services: ["cctv", "storage"],
    onboarding: {
      status: "ready",
      admin_email: "admin@bimbo.demo",
      admin_name: "Admin Bimbo",
      role_name: "Administrador Bimbo",
      notes: "Tenant listo para operar con portal propio.",
    },
  },
  created_at: "2026-04-07T00:00:00Z",
  updated_at: "2026-04-07T00:00:00Z",
};

const ME_RESPONSE = {
  user: {
    id: "user-bimbo-1",
    tenant_id: BASE_TENANT.id,
    email: "admin@bimbo.demo",
    first_name: "Admin",
    last_name: "Bimbo",
    is_active: true,
    email_verified: true,
    created_at: "2026-04-07T00:00:00Z",
  },
  companies: [BASE_TENANT],
  roles: [
    {
      id: "role-bimbo-admin",
      tenant_id: BASE_TENANT.id,
      name: "Administrador Bimbo",
      description: "Administrador interno del tenant",
      is_system: false,
      created_at: "2026-04-07T00:00:00Z",
    },
  ],
  permissions: [
    { id: "p1", code: "settings.read", description: "settings", module: "settings", created_at: "2026-04-07T00:00:00Z" },
    { id: "p2", code: "users.read", description: "users", module: "users", created_at: "2026-04-07T00:00:00Z" },
    { id: "p3", code: "users.update", description: "users", module: "users", created_at: "2026-04-07T00:00:00Z" },
    { id: "p4", code: "roles.read", description: "roles", module: "roles", created_at: "2026-04-07T00:00:00Z" },
    { id: "p5", code: "roles.create", description: "roles", module: "roles", created_at: "2026-04-07T00:00:00Z" },
    { id: "p6", code: "roles.update", description: "roles", module: "roles", created_at: "2026-04-07T00:00:00Z" },
    { id: "p7", code: "storage.read", description: "storage", module: "storage", created_at: "2026-04-07T00:00:00Z" },
    { id: "p8", code: "tickets.read", description: "tickets", module: "tickets", created_at: "2026-04-07T00:00:00Z" },
    { id: "p9", code: "clients.read", description: "clients", module: "clients", created_at: "2026-04-07T00:00:00Z" },
  ],
};

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

const USERS_RESPONSE = [
  {
    id: "user-bimbo-1",
    tenant_id: BASE_TENANT.id,
    tenant_name: "Bimbo",
    email: "admin@bimbo.demo",
    first_name: "Admin",
    last_name: "Bimbo",
    is_active: true,
    email_verified: true,
    created_at: "2026-04-07T00:00:00Z",
    roles: [
      {
        id: "role-bimbo-admin",
        tenant_id: BASE_TENANT.id,
        name: "Administrador Bimbo",
        is_system: false,
        created_at: "2026-04-07T00:00:00Z",
      },
    ],
  },
];

const ROLES_RESPONSE = [
  {
    id: "role-bimbo-admin",
    tenant_id: BASE_TENANT.id,
    name: "Administrador Bimbo",
    description: "Administrador interno del tenant",
    is_system: false,
    created_at: "2026-04-07T00:00:00Z",
  },
  {
    id: "role-bimbo-ops",
    tenant_id: BASE_TENANT.id,
    name: "Supervisor Bimbo",
    description: "Supervisor operativo interno",
    is_system: false,
    created_at: "2026-04-07T00:00:00Z",
  },
];

const SITES_RESPONSE = [
  {
    id: "site-bimbo-1",
    name: "Bimbo Tijuana",
    client_name: "Bimbo",
    address: "Parque Industrial",
    city: "Tijuana",
    state: "BC",
    camera_count: 18,
    nvr_count: 2,
    has_floor_plan: true,
    floor_plan_name: "Planta Principal",
    updated_at: "2026-04-07T00:00:00Z",
  },
];

async function mockPortalTenantContext(page: Page) {
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

    if (path.endsWith("/dashboard/summary")) {
      await route.fulfill({
        json: {
          openTickets: 7,
          criticalTickets: 1,
          slaCompliancePct: 92.5,
          slaOkTickets: 30,
          slaAtRiskTickets: 2,
          slaBreachedTickets: 1,
          activeClients: 6,
          activePolicies: 4,
          policiesExpiringSoon: 1,
          overdueAmount: 0,
          currentMonthRevenue: 145000,
          activeUsers: 8,
          usersOnlineToday: 5,
          activeNvrs: 2,
          activeCameras: 18,
          totalStorageTb: 12,
          totalFileSizeBytes: 0,
        },
      });
      return;
    }

    if (path.endsWith("/dashboard/tickets/stats")) {
      await route.fulfill({
        json: {
          openCount: 4,
          assignedCount: 2,
          inProgressCount: 3,
          completedCount: 12,
          cancelledCount: 0,
          criticalCount: 1,
          highPriorityCount: 2,
          preventiveCount: 4,
          correctiveCount: 10,
          emergencyCount: 1,
          totalCount: 19,
          slaMetCount: 17,
          slaMissedCount: 2,
        },
      });
      return;
    }

    if (path.endsWith("/dashboard/tickets/trend")) {
      await route.fulfill({
        json: [
          { date: "2026-04-01", opened: 2, completed: 1, total: 8 },
          { date: "2026-04-02", opened: 3, completed: 2, total: 9 },
          { date: "2026-04-03", opened: 1, completed: 4, total: 6 },
        ],
      });
      return;
    }

    if (path.endsWith("/dashboard/policies/stats")) {
      await route.fulfill({
        json: {
          totalPolicies: 4,
          activePolicies: 3,
          expiredPolicies: 1,
          suspendedPolicies: 0,
          expiringSoon: 1,
          totalMonthlyRevenue: 120000,
        },
      });
      return;
    }

    if (path.endsWith("/inventory/cameras/stats")) {
      await route.fulfill({
        json: {
          total_cameras: 18,
          active_cameras: 17,
          inactive_cameras: 1,
          dome_cameras: 10,
          bullet_cameras: 5,
          ptz_cameras: 3,
          counting_enabled: 2,
        },
      });
      return;
    }

    if (path.endsWith("/inventory/nvrs/stats")) {
      await route.fulfill({
        json: {
          total_servers: 2,
          active_servers: 2,
          inactive_servers: 0,
          total_cameras: 18,
          total_storage_tb: 12,
        },
      });
      return;
    }

    if (path.endsWith("/users")) {
      await route.fulfill({ json: USERS_RESPONSE });
      return;
    }

    if (path.endsWith("/roles")) {
      await route.fulfill({ json: ROLES_RESPONSE });
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
      url: "http://127.0.0.1:3061",
    },
  ]);
}

test.describe("Fase 6 - portal tenant", () => {
  test.beforeEach(async ({ page }) => {
    await mockPortalTenantContext(page);
  });

  test("dashboard muestra shell de portal tenant y accesos rapidos propios", async ({ page }) => {
    await page.goto("/dashboard");

    await expect(page.getByText("Portal").first()).toBeVisible();
    await expect(page.getByRole("heading", { name: "Portal de Bimbo", exact: true })).toBeVisible();
    await expect(page.getByRole("main").getByText("Portal tenant", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("Administrador Bimbo", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("Accesos rapidos del portal", { exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: /Mi equipo/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /Branding y empresa/i })).toBeVisible();
    await expect(page.getByRole("link", { name: "Inicio del portal", exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: "Mi empresa", exact: true })).toBeVisible();
  });

  test("settings tenant-only oculta backoffice global y prioriza ownership de empresa", async ({ page }) => {
    await page.goto("/settings");

    await expect(page.getByRole("heading", { name: "Portal de Bimbo", exact: true })).toBeVisible();
    await expect(page.getByText("Portal tenant activo", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Usuarios", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Empresas", exact: true })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Servicios y paquetes", exact: true })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Plantillas de menu", exact: true })).toHaveCount(0);
    await expect(page.getByText("Contexto visible", { exact: true })).toBeVisible();
    await expect(page.getByText("Portal de empresa", { exact: true })).toBeVisible();
  });

  test("roles internos del tenant se presentan como dominio separado del plano global", async ({ page }) => {
    await page.goto("/settings?tab=roles");

    await expect(page.getByText("Roles internos y permisos del tenant", { exact: true })).toBeVisible();
    await expect(page.getByText("Los system roles o un plano global de plataforma no tienen CRUD separado en la API actual", { exact: false })).toBeVisible();
    await expect(page.getByText("Eliminacion de roles: no soportada por API", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Nuevo rol", exact: true })).toBeVisible();
    await expect(page.getByRole("table").getByText("Administrador Bimbo", { exact: true })).toBeVisible();
  });
});
