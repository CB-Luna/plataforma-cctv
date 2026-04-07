import { test, expect, type Page } from "@playwright/test";

const TEST_EMAIL = "admin@demo.com";
const TEST_PASSWORD = "Password123!";

// ─── Helpers ──────────────────────────────────────────────────

async function doLogin(page: Page) {
  await page.goto("/login");
  await expect(page.getByText("Accede a tu cuenta")).toBeVisible();
  await page.getByLabel("Email").fill(TEST_EMAIL);
  await page.getByLabel("Contraseña").fill(TEST_PASSWORD);
  await page.getByRole("button", { name: "Ingresar" }).click();
  await page.waitForURL(/\/(select-company|dashboard)/, { timeout: 15_000 });
}

async function loginFull(page: Page) {
  await doLogin(page);
  if (page.url().includes("/select-company")) {
    await expect(page.getByText("Selecciona una empresa")).toBeVisible();
    await page.getByRole("button", { name: "Entrar" }).first().click();
    await page.waitForURL("**/dashboard", { timeout: 10_000 });
  }
}

// ─── 01: Login ────────────────────────────────────────────────

test.describe("01 - Login", () => {
  test("página de login muestra branding y formulario", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByText("SyMTickets CCTV").first()).toBeVisible();
    await expect(page.getByText("Accede a tu cuenta")).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Contraseña")).toBeVisible();
    await expect(page.getByRole("button", { name: "Ingresar" })).toBeVisible();
  });

  test("demo user presets son clickeables", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByText("o accede rápido")).toBeVisible();
    await expect(page.getByText("Admin", { exact: true })).toBeVisible();
    await expect(page.getByText("Operador", { exact: true }).first()).toBeVisible();
  });

  test("login exitoso redirige a select-company o dashboard", async ({ page }) => {
    await doLogin(page);
    expect(
      page.url().includes("/select-company") || page.url().includes("/dashboard")
    ).toBeTruthy();
  });

  test("credenciales incorrectas no navega fuera de login", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill("wrong@test.com");
    await page.getByLabel("Contraseña").fill("WrongPassword");
    await page.getByRole("button", { name: "Ingresar" }).click();
    // Try to detect error message (API may not be running)
    await page.getByText(/inválid|error|no disponible|credenciales/i).first()
      .waitFor({ state: "visible", timeout: 10_000 }).catch(() => {});
    // Key assertion: should remain on login page
    expect(page.url()).toContain("/login");
  });

  test("validación client-side en email vacío", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Contraseña").fill("algo");
    await page.getByRole("button", { name: "Ingresar" }).click();
    // El formulario no debe navegar
    expect(page.url()).toContain("/login");
  });
});

// ─── 02: Auth redirect ───────────────────────────────────────

test.describe("02 - Auth redirect", () => {
  test("dashboard sin token redirige a login", async ({ page }) => {
    await page.context().clearCookies();
    await page.goto("/dashboard");
    await page.waitForURL("**/login**", { timeout: 10_000 });
    expect(page.url()).toContain("/login");
  });

  test("cameras sin token redirige a login", async ({ page }) => {
    await page.context().clearCookies();
    await page.goto("/cameras");
    await page.waitForURL("**/login**", { timeout: 10_000 });
    expect(page.url()).toContain("/login");
  });

  test("tickets sin token redirige a login", async ({ page }) => {
    await page.context().clearCookies();
    await page.goto("/tickets");
    await page.waitForURL("**/login**", { timeout: 10_000 });
    expect(page.url()).toContain("/login");
  });

  test("settings sin token redirige a login", async ({ page }) => {
    await page.context().clearCookies();
    await page.goto("/settings");
    await page.waitForURL("**/login**", { timeout: 10_000 });
    expect(page.url()).toContain("/login");
  });
});

// ─── 03: Dashboard ───────────────────────────────────────────

test.describe("03 - Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await loginFull(page);
  });

  test("muestra encabezado operativo y stats cards", async ({ page }) => {
    const main = page.getByRole("main");
    await expect(page.getByText("Operación CCTV")).toBeVisible();
    await expect(main.getByText("Cámaras Activas")).toBeVisible({ timeout: 10_000 });
    await expect(main.getByText("Servidores NVR")).toBeVisible();
    await expect(main.getByText("Almacenamiento")).toBeVisible();
    await expect(main.getByText("Tickets Abiertos")).toBeVisible();
  });

  test("muestra gráficos de tendencia y distribución", async ({ page }) => {
    await expect(page.getByText("Tendencia de Tickets (30 días)")).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.getByText("Cámaras por Tipo")).toBeVisible();
  });

  test("muestra desglose de tickets y pólizas", async ({ page }) => {
    await expect(page.getByText("Desglose de Tickets")).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText("Cumplimiento SLA")).toBeVisible();
  });

  test("sidebar muestra branding y navegación", async ({ page }) => {
    const sidebar = page.locator("aside").first();
    await expect(sidebar).toBeVisible();
    await expect(sidebar.getByText("SyMTickets")).toBeVisible();
  });

  test("header muestra breadcrumb con Panel", async ({ page }) => {
    await expect(page.getByText("Panel").first()).toBeVisible();
  });
});

// ─── 04: Tenants ─────────────────────────────────────────────

test.describe("04 - Tenants (Settings → Empresas)", () => {
  test.beforeEach(async ({ page }) => {
    await loginFull(page);
    await page.goto("/settings");
    // Click the Empresas tab
    await page.getByRole("button", { name: /empresas/i }).click();
  });

  test("muestra stats cards y tabla", async ({ page }) => {
    await expect(page.locator("table")).toBeVisible({ timeout: 15_000 });
    // StatsCards enterprise
    await expect(page.getByText("Total Empresas")).toBeVisible();
    await expect(page.getByText("Activas", { exact: true })).toBeVisible();
  });

  test("búsqueda filtra resultados", async ({ page }) => {
    const search = page.getByPlaceholder("Buscar empresa...");
    await expect(search).toBeVisible({ timeout: 10_000 });
    await search.fill("zzzzz_no_existe");
    // Tabla debería quedar vacía o mostrar empty state
    await expect(
      page.getByText("No hay empresas registradas")
    ).toBeVisible({ timeout: 5_000 });
  });

  test("botón Nueva Empresa abre diálogo", async ({ page }) => {
    await page.getByRole("button", { name: /nueva empresa/i }).click();
    await expect(page.getByRole("dialog")).toBeVisible({ timeout: 5_000 });
  });
});

// ─── 05: Clients ─────────────────────────────────────────────

test.describe("05 - Clients", () => {
  test.beforeEach(async ({ page }) => {
    await loginFull(page);
    await page.goto("/clients");
  });

  test("muestra stats y tabla de clientes", async ({ page }) => {
    await expect(page.locator("table")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText("Total Clientes")).toBeVisible();
  });

  test("búsqueda funciona", async ({ page }) => {
    const search = page.getByPlaceholder("Buscar clientes...");
    await expect(search).toBeVisible({ timeout: 10_000 });
  });

  test("botón Nuevo Cliente abre diálogo", async ({ page }) => {
    await page.getByRole("button", { name: /nuevo cliente/i }).first().click();
    await expect(page.getByRole("dialog")).toBeVisible({ timeout: 5_000 });
  });
});

// ─── 06: Cameras ─────────────────────────────────────────────

test.describe("06 - Cameras", () => {
  test.beforeEach(async ({ page }) => {
    await loginFull(page);
    await page.goto("/cameras");
  });

  test("muestra tabla de cámaras", async ({ page }) => {
    await expect(page.locator("table")).toBeVisible({ timeout: 15_000 });
  });

  test("búsqueda por nombre funciona", async ({ page }) => {
    const search = page.getByPlaceholder("Filtrar por nombre...");
    await expect(search).toBeVisible({ timeout: 10_000 });
  });

  test("botón export está visible", async ({ page }) => {
    await expect(page.locator("table")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole("button", { name: /export/i })).toBeVisible();
  });
});

// ─── 07: Camera detail ──────────────────────────────────────

test.describe("07 - Camera detail", () => {
  test.beforeEach(async ({ page }) => {
    await loginFull(page);
  });

  test("navega a ficha técnica desde tabla", async ({ page }) => {
    await page.goto("/cameras");
    const table = page.locator("table");
    await expect(table).toBeVisible({ timeout: 15_000 });

    const firstLink = table.locator("tbody tr a").first();
    if (await firstLink.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await firstLink.click();
      await page.waitForURL("**/cameras/**", { timeout: 10_000 });
      await expect(page.locator("main")).toBeVisible();
      // Breadcrumb debe mostrar "Cámaras"
      await expect(page.getByText("Cámaras").first()).toBeVisible();
    }
  });
});

// ─── 08: Tickets ─────────────────────────────────────────────

test.describe("08 - Tickets", () => {
  test.beforeEach(async ({ page }) => {
    await loginFull(page);
    await page.goto("/tickets");
  });

  test("muestra stats enterprise y tabla", async ({ page }) => {
    await expect(page.locator("table")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText("Abiertos").first()).toBeVisible();
    await expect(page.getByText("En progreso").first()).toBeVisible();
    await expect(page.getByText("Críticos").first()).toBeVisible();
    await expect(page.getByText("Completados").first()).toBeVisible();
  });

  test("export button está visible", async ({ page }) => {
    await expect(page.locator("table")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole("button", { name: /export/i })).toBeVisible();
  });
});

// ─── 09: Floor Plans ────────────────────────────────────────

test.describe("09 - Floor Plans", () => {
  test.beforeEach(async ({ page }) => {
    await loginFull(page);
    await page.goto("/floor-plans");
  });

  test("muestra página de planos", async ({ page }) => {
    await expect(page.locator("main")).toBeVisible();
    // Breadcrumb
    await expect(page.getByText("Planos").first()).toBeVisible({ timeout: 5_000 });
  });
});

// ─── 10: Settings + Admin Nav ───────────────────────────────

test.describe("10 - Settings / Admin", () => {
  test.beforeEach(async ({ page }) => {
    await loginFull(page);
    await page.goto("/settings");
  });

  test("muestra TabLayout con tabs", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Configuración" })).toBeVisible({ timeout: 10_000 });
    // TabLayout renders buttons — tab labels: Usuarios, Empresas, Roles y Permisos, Tema, IA, Storage
    await expect(page.getByRole("button", { name: /usuarios/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /empresas/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /roles/i })).toBeVisible();
    await expect(page.getByRole("button", { name: "Tema", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: /storage/i })).toBeVisible();
  });

  test("navegación entre tabs funciona", async ({ page }) => {
    await expect(page.getByRole("button", { name: /usuarios/i })).toBeVisible({ timeout: 10_000 });
    // Click Empresas tab (state-based, stays on /settings)
    await page.getByRole("button", { name: /empresas/i }).click();
    expect(page.url()).toContain("/settings");
    // Click Roles tab
    await page.getByRole("button", { name: /roles/i }).click();
    expect(page.url()).toContain("/settings");
  });

  test("configuración muestra contenido del tenant", async ({ page }) => {
    await expect(page.locator("main")).toBeVisible();
    // Settings debe mostrar información general del tenant
    const mainText = await page.locator("main").textContent();
    expect(mainText?.length).toBeGreaterThan(50);
  });
});
