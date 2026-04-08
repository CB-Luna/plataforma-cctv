import { expect, test, type Page } from "@playwright/test";

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
];

const CLIENTS = [
  {
    id: "client-bimbo",
    tenant_id: BIMBO_TENANT.id,
    company_name: "Bimbo",
    legal_name: "Grupo Bimbo",
    city: "Tijuana",
    state: "BC",
    email: "seguridad@bimbo.demo",
    phone: "+52 664 000 0000",
    is_active: true,
    created_at: "2026-04-08T00:00:00Z",
    updated_at: "2026-04-08T00:00:00Z",
  },
];

const CAMERAS = [
  {
    id: "cam-1",
    tenant_id: BIMBO_TENANT.id,
    name: "Camara Anden 01",
    site_id: "site-bimbo-1",
    nvr_server_id: "nvr-1",
    camera_type: "dome",
    status: "active",
    is_active: true,
    counting_enabled: true,
    ip_address: "10.0.0.10",
    serial_number: "CAM-001",
    created_at: "2026-04-08T00:00:00Z",
    updated_at: "2026-04-08T00:00:00Z",
  },
];

const NVRS = [
  {
    id: "nvr-1",
    tenant_id: BIMBO_TENANT.id,
    site_id: "site-bimbo-1",
    name: "NVR Planta 01",
    status: "active",
    is_active: true,
    camera_count: 18,
    storage_tb: 12,
    created_at: "2026-04-08T00:00:00Z",
    updated_at: "2026-04-08T00:00:00Z",
  },
];

const IMPORT_BATCHES = [
  {
    id: "batch-1",
    batch_name: "Carga inicial Bimbo",
    source_type: "csv",
    source_filename: "cameras-import.csv",
    target_table: "cameras",
    total_rows: 18,
    processed_rows: 18,
    success_rows: 18,
    error_rows: 0,
    status: "completed",
    created_at: "2026-04-08T00:00:00Z",
  },
];

const TICKETS = [
  {
    id: "ticket-1",
    ticket_number: "TK-1001",
    tenant_id: BIMBO_TENANT.id,
    title: "Camara offline en anden",
    description: "Sin video en acceso principal",
    client_id: "client-bimbo",
    client_name: "Bimbo",
    site_id: "site-bimbo-1",
    site_name: "Bimbo Tijuana",
    type: "corrective",
    priority: "high",
    status: "open",
    assigned_to_name: "Tecnico Norte",
    coverage_status: "covered",
    sla_status: "ok",
    created_at: "2026-04-08T00:00:00Z",
    updated_at: "2026-04-08T00:00:00Z",
  },
];

const POLICIES = [
  {
    id: "policy-1",
    tenant_id: BIMBO_TENANT.id,
    policy_number: "POL-001",
    client_id: "client-bimbo",
    client_name: "Bimbo",
    site_id: "site-bimbo-1",
    site_name: "Bimbo Tijuana",
    status: "active",
    start_date: "2026-01-01",
    end_date: "2026-12-31",
    monthly_payment: 12000,
    vendor: "SyM",
    contract_type: "Integral",
    created_at: "2026-04-08T00:00:00Z",
    updated_at: "2026-04-08T00:00:00Z",
  },
];

const SLA_POLICIES = [
  {
    id: "sla-1",
    name: "SLA Correctivo Alto",
    ticket_priority: "high",
    ticket_type: "corrective",
    response_time_hours: 4,
    resolution_time_hours: 12,
    business_hours: null,
    is_default: false,
    is_active: true,
    created_at: "2026-04-08T00:00:00Z",
    updated_at: "2026-04-08T00:00:00Z",
  },
  {
    id: "sla-2",
    name: "SLA Default",
    ticket_priority: "",
    ticket_type: "",
    response_time_hours: 8,
    resolution_time_hours: 24,
    business_hours: null,
    is_default: true,
    is_active: true,
    created_at: "2026-04-08T00:00:00Z",
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
  {
    id: "role-bimbo-ops",
    tenant_id: BIMBO_TENANT.id,
    name: "Supervisor Bimbo",
    description: "Supervisor operativo interno",
    is_system: false,
    created_at: "2026-04-08T00:00:00Z",
  },
];

function toPermissions(codes: string[]) {
  return codes.map((code, index) => ({
    id: `perm-${index + 1}`,
    code,
    description: code,
    module: code.split(".")[0]?.split(":")[0] ?? "general",
    created_at: "2026-04-08T00:00:00Z",
  }));
}

function getTenantById(tenantId: string) {
  return [BIMBO_TENANT, LIVERPOOL_TENANT].find((tenant) => tenant.id === tenantId) ?? BIMBO_TENANT;
}

async function seedAuthenticatedSession(page: Page, tenant = BIMBO_TENANT) {
  await page.addInitScript(({ company }) => {
    localStorage.setItem("access_token", "mock-token");
    localStorage.setItem("tenant_id", company.id);
    localStorage.setItem("tenant_snapshot", JSON.stringify(company));
  }, { company: tenant });

  await page.context().addCookies([
    {
      name: "access_token",
      value: "mock-token",
      url: COOKIE_URL,
    },
  ]);
}

async function mockBackofficeContract(page: Page) {
  let selectedTenantId = BIMBO_TENANT.id;

  await page.route("**/api/v1/**", async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname;

    if (path.endsWith("/auth/login")) {
      const payload = (request.postDataJSON() as { tenant_id?: string } | null) ?? {};

      if (payload.tenant_id) {
        selectedTenantId = payload.tenant_id;
      }

      const selectedTenant = getTenantById(selectedTenantId);

      await route.fulfill({
        json: {
          access_token: "mock-token",
          user: { ...BACKOFFICE_USER, tenant_id: selectedTenant.id },
          companies: payload.tenant_id ? [selectedTenant] : [BIMBO_TENANT, LIVERPOOL_TENANT],
        },
      });
      return;
    }

    if (path.endsWith("/auth/me")) {
      const selectedTenant = getTenantById(selectedTenantId);
      await route.fulfill({
        json: {
          user: { ...BACKOFFICE_USER, tenant_id: selectedTenant.id },
          companies: [selectedTenant],
          roles: [
            {
              id: "role-super-admin",
              tenant_id: selectedTenant.id,
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
      const selectedTenant = getTenantById(selectedTenantId);
      await route.fulfill({
        json: {
          ...selectedTenant,
          settings: selectedTenant.settings,
        },
      });
      return;
    }

    if (path.endsWith("/tenants/stats")) {
      await route.fulfill({
        json: { total_tenants: 2, active_tenants: 2 },
      });
      return;
    }

    if (path.endsWith("/tenants")) {
      await route.fulfill({ json: [BIMBO_TENANT, LIVERPOOL_TENANT] });
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

    if (path.endsWith("/inventory/cameras/search")) {
      await route.fulfill({ json: CAMERAS });
      return;
    }

    if (path.endsWith("/inventory/cameras")) {
      await route.fulfill({ json: CAMERAS });
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

    if (path.endsWith("/inventory/nvrs")) {
      await route.fulfill({ json: NVRS });
      return;
    }

    if (path.endsWith("/inventory/import/stats")) {
      await route.fulfill({
        json: {
          total_batches: 1,
          pending_batches: 0,
          completed_batches: 1,
          failed_batches: 0,
        },
      });
      return;
    }

    if (path.endsWith("/inventory/import/batches")) {
      await route.fulfill({ json: IMPORT_BATCHES });
      return;
    }

    if (path.endsWith("/tickets/stats")) {
      await route.fulfill({
        json: {
          open_count: 1,
          in_progress_count: 0,
          critical_count: 0,
          completed_count: 0,
        },
      });
      return;
    }

    if (path.endsWith("/tickets")) {
      await route.fulfill({ json: TICKETS });
      return;
    }

    if (path.endsWith("/policies")) {
      await route.fulfill({ json: POLICIES });
      return;
    }

    if (path.endsWith("/sla/policies")) {
      await route.fulfill({ json: SLA_POLICIES });
      return;
    }

    if (path.endsWith("/clients")) {
      await route.fulfill({ json: CLIENTS });
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

    if (path.endsWith("/sites")) {
      await route.fulfill({ json: SITES });
      return;
    }

    await route.fulfill({ json: [] });
  });
}

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

    if (path.endsWith("/users")) {
      await route.fulfill({ json: USERS });
      return;
    }

    if (path.endsWith("/roles")) {
      await route.fulfill({ json: ROLES });
      return;
    }

    if (path.endsWith("/sites")) {
      await route.fulfill({ json: SITES });
      return;
    }

    await route.fulfill({ json: [] });
  });
}

test.describe("Fase 7 - smoke reproducible", () => {
  test("login, seleccion de empresa y persistencia del tenant activo", async ({ page }) => {
    await mockBackofficeContract(page);

    await page.goto("/login");
    await page.getByLabel("Email").fill("admin@demo.com");
    await page.getByLabel(/Contrase/i).fill("Password123!");
    await page.getByRole("button", { name: "Ingresar" }).click();

    await expect(page).toHaveURL(/\/select-company/, { timeout: 15_000 });
    await expect(page.getByRole("heading", { name: "Selecciona una empresa" })).toBeVisible();
    await page.getByRole("button", { name: "Entrar" }).first().click();

    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15_000 });
    await expect(page.getByText("Bimbo", { exact: true }).first()).toBeVisible();
    await expect
      .poll(() => page.evaluate(() => localStorage.getItem("tenant_id")))
      .toBe(BIMBO_TENANT.id);

    await page.reload();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15_000 });
    await expect(page.getByText("Bimbo", { exact: true }).first()).toBeVisible();
  });

  test("backoffice y configuracion global se mantienen navegables con servicios y paquetes", async ({ page }) => {
    await mockBackofficeContract(page);
    await seedAuthenticatedSession(page);

    await page.goto("/settings?tab=servicios");

    await expect(page.getByRole("heading", { name: /Backoffice enterprise/i })).toBeVisible();
    await expect(page.getByRole("button", { name: "Servicios y paquetes", exact: true })).toBeVisible();
    await expect(page.getByText("Catalogo vigente de servicios y paquetes", { exact: true })).toBeVisible();
    await expect(page.getByText("Gobierno vigente de visibilidad", { exact: true })).toBeVisible();
    await expect(page.getByText("Control de Acceso - WIP", { exact: true }).first()).toBeVisible();
    await expect(page.getByText(/ya pueden aparecer en el menu del tenant/i)).toBeVisible();
  });

  test("portal tenant conserva experiencia separada del backoffice global", async ({ page }) => {
    await mockTenantPortalContract(page);
    await seedAuthenticatedSession(page);

    await page.goto("/dashboard");
    await expect(page.getByRole("heading", { name: "Portal de Bimbo", exact: true })).toBeVisible();
    await expect(page.getByText("Accesos rapidos del portal", { exact: true })).toBeVisible();

    await page.goto("/settings?tab=roles");
    await expect(page.getByRole("heading", { name: "Portal de Bimbo", exact: true })).toBeVisible();
    await expect(page.getByText("Portal tenant activo", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Empresas", exact: true })).toHaveCount(0);
    await expect(page.getByText("Roles internos y permisos del tenant", { exact: true })).toBeVisible();
  });

  test("cctv core carga con mensajes honestos y contexto operativo visible", async ({ page }) => {
    await mockBackofficeContract(page);
    await seedAuthenticatedSession(page);

    await page.goto("/cameras");
    await expect(page.getByRole("heading", { name: /Camaras|C.maras/i })).toBeVisible();
    await expect(page.getByText(/La creacion manual cubre contexto/i)).toBeVisible();

    await page.goto("/imports");
    await expect(page.getByRole("heading", { name: "Importacion masiva" })).toBeVisible();
    await expect(page.getByText(/La UI ya no crea lotes vacios/i)).toBeVisible();

    await page.goto("/map");
    await expect(page.getByRole("heading", { name: "Mapa de Sucursales" })).toBeVisible();
    await expect(page.getByText(/Precision geografica aproximada/i)).toBeVisible();
  });

  test("tickets, polizas y SLA mantienen la capa contractual actual", async ({ page }) => {
    await mockBackofficeContract(page);
    await seedAuthenticatedSession(page);

    await page.goto("/tickets");
    await expect(page.getByRole("heading", { name: "Tickets", exact: true })).toBeVisible();
    await expect(page.getByText(/Cobertura contractual/i)).toBeVisible();
    await expect(page.getByText(/Seguimiento SLA/i)).toBeVisible();

    await page.goto("/policies");
    await expect(page.getByRole("heading", { name: "Polizas", exact: true })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Alcance" })).toBeVisible();

    await page.goto("/sla");
    await expect(page.getByRole("heading", { name: "Politicas SLA" })).toBeVisible();
    await expect(page.getByText(/El backend elige la primera regla activa/i)).toBeVisible();
    await expect(page.getByText(/Coincidencia replica el criterio real/i)).toBeVisible();
  });
});
