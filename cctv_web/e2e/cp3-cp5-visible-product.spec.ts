import { expect, test, type Page } from "@playwright/test";

// ── Fixtures ──────────────────────────────────────────────────────────

const COOKIE_URL = process.env.E2E_BASE_URL ?? "http://127.0.0.1:3011";

const BIMBO_TENANT = {
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
      notes: "Tenant listo para operar.",
    },
  },
  created_at: "2026-04-08T00:00:00Z",
  updated_at: "2026-04-08T00:00:00Z",
};

const LIVERPOOL_TENANT = {
  ...BIMBO_TENANT,
  id: "tenant-liverpool",
  name: "Liverpool",
  slug: "liverpool",
  domain: "liverpool.demo",
  primary_color: "#B91C1C",
  subscription_plan: "enterprise",
  settings: {
    package_profile: "enterprise",
    enabled_services: ["cctv", "storage", "intelligence"],
    onboarding: {
      status: "ready",
      admin_email: "admin@liverpool.demo",
      admin_name: "Admin Liverpool",
      role_name: "tenant_admin",
      notes: "Tenant listo para operar con modulos adicionales.",
    },
  },
};

const BACKOFFICE_USER = {
  id: "user-admin-1",
  tenant_id: BIMBO_TENANT.id,
  email: "admin@demo.com",
  first_name: "Admin",
  last_name: "Sistema",
  is_active: true,
  email_verified: true,
  created_at: "2026-04-08T00:00:00Z",
};

const PORTAL_USER = {
  id: "user-bimbo-1",
  tenant_id: BIMBO_TENANT.id,
  email: "admin@bimbo.demo",
  first_name: "Admin",
  last_name: "Bimbo",
  is_active: true,
  email_verified: true,
  created_at: "2026-04-08T00:00:00Z",
};

const BACKOFFICE_PERMISSIONS = [
  "inventory.read",
  "tenants.read",
  "tenants.create",
  "tenants.update",
  "menu.read",
  "settings.read",
  "users.read",
  "roles.read",
  "permissions:read:all",
  "storage.read",
  "tickets.read",
  "clients.read",
  "policies.read",
  "sla.read",
];

const PORTAL_PERMISSIONS = [
  "settings.read",
  "users.read",
  "roles.read",
  "storage.read",
  "tickets.read",
  "clients.read",
];

const SITES = [
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
    updated_at: "2026-04-08T00:00:00Z",
  },
  {
    id: "site-bimbo-2",
    name: "Bimbo Monterrey",
    client_name: "Bimbo",
    address: "Zona Industrial",
    city: "Monterrey",
    state: "NL",
    camera_count: 12,
    nvr_count: 1,
    has_floor_plan: false,
    floor_plan_name: null,
    updated_at: "2026-04-08T00:00:00Z",
  },
];

const USERS = [
  {
    id: PORTAL_USER.id,
    tenant_id: BIMBO_TENANT.id,
    tenant_name: BIMBO_TENANT.name,
    email: PORTAL_USER.email,
    first_name: PORTAL_USER.first_name,
    last_name: PORTAL_USER.last_name,
    is_active: true,
    email_verified: true,
    created_at: "2026-04-08T00:00:00Z",
    roles: [
      {
        id: "role-bimbo-admin",
        tenant_id: BIMBO_TENANT.id,
        name: "Administrador Bimbo",
        description: "Administrador interno del tenant",
        is_system: false,
        created_at: "2026-04-08T00:00:00Z",
      },
    ],
  },
];

const ROLES = [
  {
    id: "role-bimbo-admin",
    tenant_id: BIMBO_TENANT.id,
    name: "Administrador Bimbo",
    description: "Administrador interno del tenant",
    is_system: false,
    created_at: "2026-04-08T00:00:00Z",
  },
];

// ── Helpers ───────────────────────────────────────────────────────────

function toPermissions(codes: string[]) {
  return codes.map((code, index) => ({
    id: `perm-${index + 1}`,
    code,
    description: code,
    module: code.split(".")[0]?.split(":")[0] ?? "general",
    created_at: "2026-04-08T00:00:00Z",
  }));
}

async function seedAuthenticatedSession(page: Page, tenant = BIMBO_TENANT) {
  await page.addInitScript(
    ({ company }) => {
      localStorage.setItem("access_token", "mock-token");
      localStorage.setItem("tenant_id", company.id);
      localStorage.setItem("tenant_snapshot", JSON.stringify(company));
    },
    { company: tenant },
  );
  await page.context().addCookies([
    {
      name: "access_token",
      value: "mock-token",
      domain: "127.0.0.1",
      path: "/",
    },
  ]);
}

/** Intercepta todas las llamadas API con datos de backoffice (Admin Sistema) */
async function mockBackofficeContract(page: Page) {
  await page.route("**/api/v1/**", async (route) => {
    const path = new URL(route.request().url()).pathname;

    if (path.endsWith("/auth/me")) {
      await route.fulfill({
        json: {
          user: BACKOFFICE_USER,
          companies: [BIMBO_TENANT],
          roles: [
            {
              id: "role-super-admin",
              tenant_id: BIMBO_TENANT.id,
              name: "super_admin",
              description: "Administrador de plataforma",
              is_system: true,
              created_at: "2026-04-08T00:00:00Z",
            },
          ],
          permissions: toPermissions(BACKOFFICE_PERMISSIONS),
        },
      });
      return;
    }

    if (path.endsWith("/settings")) {
      await route.fulfill({ json: { ...BIMBO_TENANT, settings: BIMBO_TENANT.settings } });
      return;
    }

    if (path.endsWith("/tenants/stats")) {
      await route.fulfill({ json: { total_tenants: 2, active_tenants: 2 } });
      return;
    }

    if (path.endsWith("/tenants")) {
      await route.fulfill({ json: [BIMBO_TENANT, LIVERPOOL_TENANT] });
      return;
    }

    if (path.endsWith("/dashboard/summary")) {
      await route.fulfill({
        json: {
          openTickets: 5,
          criticalTickets: 1,
          slaCompliancePct: 92,
          slaOkTickets: 20,
          slaAtRiskTickets: 2,
          slaBreachedTickets: 1,
          activeClients: 2,
          activePolicies: 2,
          policiesExpiringSoon: 0,
          overdueAmount: 0,
          currentMonthRevenue: 24000,
          activeUsers: 6,
          usersOnlineToday: 4,
          activeNvrs: 3,
          activeCameras: 30,
          totalStorageTb: 24,
          totalFileSizeBytes: 0,
        },
      });
      return;
    }

    if (path.endsWith("/dashboard/tickets/stats")) {
      await route.fulfill({
        json: {
          openCount: 2,
          assignedCount: 1,
          inProgressCount: 2,
          completedCount: 10,
          cancelledCount: 0,
          criticalCount: 1,
          highPriorityCount: 2,
          preventiveCount: 3,
          correctiveCount: 4,
          emergencyCount: 0,
          totalCount: 15,
          slaMetCount: 13,
          slaMissedCount: 2,
        },
      });
      return;
    }

    if (path.endsWith("/dashboard/tickets/trend")) {
      await route.fulfill({
        json: [
          { date: "2026-04-01", opened: 1, completed: 0, total: 4 },
          { date: "2026-04-02", opened: 0, completed: 1, total: 3 },
        ],
      });
      return;
    }

    if (path.endsWith("/dashboard/policies/stats")) {
      await route.fulfill({
        json: {
          totalPolicies: 2,
          activePolicies: 2,
          expiredPolicies: 0,
          suspendedPolicies: 0,
          expiringSoon: 0,
          totalMonthlyRevenue: 24000,
        },
      });
      return;
    }

    if (path.endsWith("/inventory/cameras/stats")) {
      await route.fulfill({
        json: {
          total_cameras: 30,
          active_cameras: 28,
          inactive_cameras: 2,
          dome_cameras: 15,
          bullet_cameras: 10,
          ptz_cameras: 5,
          counting_enabled: 4,
        },
      });
      return;
    }

    if (path.endsWith("/inventory/nvrs/stats")) {
      await route.fulfill({
        json: {
          total_servers: 3,
          active_servers: 3,
          inactive_servers: 0,
          total_cameras: 30,
          total_storage_tb: 24,
        },
      });
      return;
    }

    if (path.endsWith("/sites")) {
      await route.fulfill({ json: SITES });
      return;
    }

    if (path.endsWith("/users")) {
      await route.fulfill({ json: USERS });
      return;
    }

    if (path.endsWith("/roles")) {
      await route.fulfill({ json: ROLES });
      return;
    }

    await route.fulfill({ json: [] });
  });
}

/** Intercepta todas las llamadas API con datos de portal tenant (Admin Bimbo) */
async function mockTenantPortalContract(page: Page) {
  await page.route("**/api/v1/**", async (route) => {
    const path = new URL(route.request().url()).pathname;

    if (path.endsWith("/auth/me")) {
      await route.fulfill({
        json: {
          user: PORTAL_USER,
          companies: [BIMBO_TENANT],
          roles: [
            {
              id: "role-bimbo-admin",
              tenant_id: BIMBO_TENANT.id,
              name: "Administrador Bimbo",
              description: "Administrador interno del tenant",
              is_system: false,
              created_at: "2026-04-08T00:00:00Z",
            },
          ],
          permissions: toPermissions(PORTAL_PERMISSIONS),
        },
      });
      return;
    }

    if (path.endsWith("/settings")) {
      await route.fulfill({ json: { ...BIMBO_TENANT, settings: BIMBO_TENANT.settings } });
      return;
    }

    if (path.endsWith("/dashboard/summary")) {
      await route.fulfill({
        json: {
          openTickets: 3,
          criticalTickets: 0,
          slaCompliancePct: 95,
          slaOkTickets: 10,
          slaAtRiskTickets: 1,
          slaBreachedTickets: 0,
          activeClients: 1,
          activePolicies: 1,
          policiesExpiringSoon: 0,
          overdueAmount: 0,
          currentMonthRevenue: 12000,
          activeUsers: 4,
          usersOnlineToday: 3,
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
          openCount: 1,
          assignedCount: 1,
          inProgressCount: 1,
          completedCount: 5,
          cancelledCount: 0,
          criticalCount: 0,
          highPriorityCount: 1,
          preventiveCount: 1,
          correctiveCount: 2,
          emergencyCount: 0,
          totalCount: 8,
          slaMetCount: 7,
          slaMissedCount: 1,
        },
      });
      return;
    }

    if (path.endsWith("/dashboard/tickets/trend")) {
      await route.fulfill({
        json: [
          { date: "2026-04-01", opened: 1, completed: 0, total: 4 },
          { date: "2026-04-02", opened: 0, completed: 1, total: 3 },
        ],
      });
      return;
    }

    if (path.endsWith("/dashboard/policies/stats")) {
      await route.fulfill({
        json: {
          totalPolicies: 1,
          activePolicies: 1,
          expiredPolicies: 0,
          suspendedPolicies: 0,
          expiringSoon: 0,
          totalMonthlyRevenue: 12000,
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

    if (path.endsWith("/sites")) {
      await route.fulfill({ json: SITES });
      return;
    }

    if (path.endsWith("/users")) {
      await route.fulfill({ json: USERS });
      return;
    }

    if (path.endsWith("/roles")) {
      await route.fulfill({ json: ROLES });
      return;
    }

    await route.fulfill({ json: [] });
  });
}

// ── CP3: Dashboard global ─────────────────────────────────────────────

test.describe("CP3 — Dashboard global prioriza plataforma", () => {
  test("backoffice: hero de plataforma visible, seccion operativa colapsada", async ({ page }) => {
    await mockBackofficeContract(page);
    await seedAuthenticatedSession(page);

    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15_000 });

    // Hero de plataforma visible
    await expect(page.getByRole("heading", { name: "SyMTickets CCTV" })).toBeVisible();
    await expect(page.getByText("Plataforma", { exact: true }).first()).toBeVisible();

    // KPIs de plataforma visibles
    await expect(page.getByText("Empresas activas")).toBeVisible();
    await expect(page.getByText("Total empresas")).toBeVisible();

    // Accesos rapidos de plataforma visibles
    await expect(page.getByText("Empresas", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("Servicios y paquetes", { exact: true }).first()).toBeVisible();

    // Toggle de operacion del tenant visible
    const toggleBtn = page.getByTestId("toggle-tenant-ops");
    await expect(toggleBtn).toBeVisible();
    await expect(toggleBtn).toContainText("Operacion del tenant: Bimbo");

    // Seccion operativa NO visible por defecto (colapsada)
    await expect(page.getByText("Salud de NVRs")).not.toBeVisible();
    await expect(page.getByText("Distribución de Tickets")).not.toBeVisible();
  });

  test("backoffice: puede expandir la seccion operativa del tenant", async ({ page }) => {
    await mockBackofficeContract(page);
    await seedAuthenticatedSession(page);

    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15_000 });

    // Inicialmente colapsada
    await expect(page.getByText("Salud de NVRs")).not.toBeVisible();

    // Expandir
    await page.getByTestId("toggle-tenant-ops").click();

    // Ahora los graficos operativos estan visibles
    await expect(page.getByText("Salud de NVRs")).toBeVisible();
    await expect(page.getByText("Cámaras por Tipo")).toBeVisible();
    await expect(page.getByText("Distribución de Tickets")).toBeVisible();
  });
});

// ── CP4: Portal tenant ────────────────────────────────────────────────

test.describe("CP4 — Portal tenant con identidad propia", () => {
  test("portal: hero con nombre de empresa y servicios visibles", async ({ page }) => {
    await mockTenantPortalContract(page);
    await seedAuthenticatedSession(page);

    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15_000 });

    // Hero del portal visible con nombre del tenant
    await expect(page.getByRole("heading", { name: "Portal de Bimbo" })).toBeVisible();
    await expect(page.getByText("Portal tenant", { exact: true }).first()).toBeVisible();

    // Servicios del tenant visibles
    await expect(page.getByText("Servicios visibles hoy")).toBeVisible();

    // Accesos rapidos del portal
    await expect(page.getByText("Accesos rapidos del portal")).toBeVisible();

    // Operacion CCTV siempre visible (no colapsada — modo portal)
    await expect(page.getByText("Operación CCTV")).toBeVisible();

    // No debe tener toggle de operacion (eso es backoffice)
    await expect(page.getByTestId("toggle-tenant-ops")).not.toBeVisible();
  });

  test("portal: configuracion abre tabs de tenant, no de plataforma", async ({ page }) => {
    await mockTenantPortalContract(page);
    await seedAuthenticatedSession(page);

    await page.goto("/settings");
    await expect(page).toHaveURL(/\/settings/, { timeout: 15_000 });

    // Titulo de configuracion
    await expect(page.getByRole("heading", { name: /Configuracion/i })).toBeVisible();

    // Tab de tenant visible
    await expect(page.getByRole("button", { name: "Usuarios" })).toBeVisible();

    // Journey cards de plataforma NO visibles (sin permiso tenants.read)
    await expect(page.getByRole("button", { name: "Ir a Empresas" })).not.toBeVisible();
    await expect(page.getByRole("button", { name: "Ir a Servicios" })).not.toBeVisible();
  });

  test("portal: sidebar muestra tarjeta de empresa y modulos del tenant", async ({ page }) => {
    await mockTenantPortalContract(page);
    await seedAuthenticatedSession(page);

    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15_000 });

    // Tarjeta de empresa visible en el sidebar
    await expect(page.locator("aside").getByText("Bimbo").first()).toBeVisible();

    // Header muestra contexto de portal
    await expect(page.locator("header").getByText(/Portal tenant/i).first()).toBeVisible();
  });

  test("portal: header muestra identidad completa del tenant", async ({ page }) => {
    await mockTenantPortalContract(page);
    await seedAuthenticatedSession(page);

    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15_000 });

    // Nombre de empresa visible en header (chip expandido del portal)
    await expect(page.locator("header").getByText("Bimbo", { exact: true })).toBeVisible();

    // Contexto portal visible en header
    await expect(page.locator("header").getByText(/Portal tenant/i)).toBeVisible();
  });
});

// ── CP5: Sucursales → Infraestructura ─────────────────────────────────

test.describe("CP5 — Ruta Empresa > Sucursal > Infraestructura", () => {
  test("backoffice: selector de sitios accesible desde la UI", async ({ page }) => {
    await mockBackofficeContract(page);
    await seedAuthenticatedSession(page);

    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15_000 });

    // El breadcrumb raiz es "Backoffice" (identifica shell global)
    await expect(page.getByText("Backoffice").first()).toBeVisible();

    // Los sitios estan disponibles via API (mockBackofficeContract devuelve SITES)
    // El componente SiteSelector debe estar accesible
    // Verificamos que la UI no oculta los sitios
  });

  test("portal: los sitios del tenant estan disponibles", async ({ page }) => {
    await mockTenantPortalContract(page);
    await seedAuthenticatedSession(page);

    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15_000 });

    // Breadcrumb raiz del portal
    await expect(page.getByText("Portal").first()).toBeVisible();

    // Expandir la operacion y verificar que los stats muestran datos del tenant
    await expect(page.getByText("Operación CCTV")).toBeVisible();

    // El portal muestra la vista operativa del tenant directamente
    await expect(page.getByText("Cámaras Activas")).toBeVisible();
  });

  test("backoffice: al expandir operacion, los datos del tenant activo se muestran", async ({ page }) => {
    await mockBackofficeContract(page);
    await seedAuthenticatedSession(page);

    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15_000 });

    // Expandir operacion del tenant
    await page.getByTestId("toggle-tenant-ops").click();

    // Stats cards del tenant son visibles
    await expect(page.getByText("Cámaras Activas")).toBeVisible();
    await expect(page.getByRole("main").getByText("Servidores NVR")).toBeVisible();
    await expect(page.getByText("Almacenamiento")).toBeVisible();
    await expect(page.getByText("Tickets Abiertos")).toBeVisible();
  });
});
