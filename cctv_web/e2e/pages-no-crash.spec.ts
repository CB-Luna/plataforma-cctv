import { test, expect, type Page, type ConsoleMessage } from "@playwright/test";

const TEST_EMAIL = "admin@demo.com";
const TEST_PASSWORD = "Password123!";

// ─── Helpers ──────────────────────────────────────────────────

async function loginFull(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(TEST_EMAIL);
  await page.getByLabel("Contraseña").fill(TEST_PASSWORD);
  await page.getByRole("button", { name: "Ingresar" }).click();
  await page.waitForURL(/\/(select-company|dashboard)/, { timeout: 15_000 });
  if (page.url().includes("/select-company")) {
    await page.getByRole("button", { name: "Entrar" }).first().click();
    await page.waitForURL("**/dashboard", { timeout: 10_000 });
  }
}

/**
 * Collects console errors during navigation and asserts none are critical.
 * Returns { errors, warnings } arrays for further inspection.
 */
function trackConsoleErrors(page: Page) {
  const errors: string[] = [];
  const warnings: string[] = [];

  const handler = (msg: ConsoleMessage) => {
    if (msg.type() === "error") errors.push(msg.text());
    if (msg.type() === "warning") warnings.push(msg.text());
  };
  page.on("console", handler);

  return {
    errors,
    warnings,
    stop: () => page.removeListener("console", handler),
  };
}

// ─── Inventory page ─────────────────────────────────────────

test.describe("Inventory page - no infinite errors", () => {
  test.beforeEach(async ({ page }) => {
    await loginFull(page);
  });

  test("loads without infinite 500 errors", async ({ page }) => {
    const tracker = trackConsoleErrors(page);

    await page.goto("/inventory");
    await expect(page.getByText("Dashboard de Inventario")).toBeVisible({ timeout: 10_000 });

    // Wait a bit to see if errors accumulate
    await page.waitForTimeout(3000);
    tracker.stop();

    // Count 500 errors on inventory/summary
    const summaryErrors = tracker.errors.filter((e) => e.includes("inventory/summary") && e.includes("500"));
    // With retry: false, we should get at most 1 error per query (2 total: summary + stats)
    expect(summaryErrors.length).toBeLessThanOrEqual(2);
  });

  test("shows warning banner on API failure, not crash", async ({ page }) => {
    await page.goto("/inventory");
    // Should show the heading regardless of API status
    await expect(page.getByText("Dashboard de Inventario")).toBeVisible({ timeout: 10_000 });
    // The page renders with either data (stats cards) or warning banner — both are acceptable
    const main = page.getByRole("main");
    const hasWarning = await main.getByText("No se pudo cargar").isVisible().catch(() => false);
    const hasNvrCard = await main.getByText("Servidores NVR").isVisible().catch(() => false);
    const hasCamCard = await main.getByText("Cámaras").first().isVisible().catch(() => false);
    expect(hasWarning || hasNvrCard || hasCamCard).toBeTruthy();
  });

  test("page refresh does not crash", async ({ page }) => {
    await page.goto("/inventory");
    await expect(page.getByText("Dashboard de Inventario")).toBeVisible({ timeout: 10_000 });

    // Refresh the page
    await page.reload();
    // After reload the page should still be visible (no hydration crash)
    await expect(page.getByText("Dashboard de Inventario")).toBeVisible({ timeout: 10_000 });
  });
});

// ─── Camera Models (Fichas Técnicas) page ───────────────────

test.describe("Camera Models page - no crash", () => {
  test.beforeEach(async ({ page }) => {
    await loginFull(page);
  });

  test("loads without hydration errors or TypeError", async ({ page }) => {
    const tracker = trackConsoleErrors(page);

    await page.goto("/camera-models");
    await expect(page.getByRole("heading", { name: "Fichas Técnicas" })).toBeVisible({ timeout: 10_000 });

    await page.waitForTimeout(2000);
    tracker.stop();

    // No hydration errors
    const hydrationErrors = tracker.errors.filter((e) =>
      e.includes("Hydration") || e.includes("hydration")
    );
    expect(hydrationErrors).toHaveLength(0);

    // No TypeError
    const typeErrors = tracker.errors.filter((e) =>
      e.includes("TypeError") || e.includes("toLowerCase")
    );
    expect(typeErrors).toHaveLength(0);
  });

  test("shows model cards or empty state", async ({ page }) => {
    await page.goto("/camera-models");
    await expect(page.getByRole("heading", { name: "Fichas Técnicas" })).toBeVisible({ timeout: 10_000 });

    // Wait for data to load
    await page.waitForTimeout(3000);
    const main = page.getByRole("main");
    // Either shows camera model cards (with "unidad" text) or empty state or loading
    const hasCards = await main.getByText(/unidad/).first().isVisible().catch(() => false);
    const hasEmpty = await main.getByText("No hay cámaras").isVisible().catch(() => false);
    const hasSearch = await main.getByPlaceholder(/Buscar/).isVisible().catch(() => false);
    expect(hasCards || hasEmpty || hasSearch).toBeTruthy();
  });

  test("page refresh does not crash", async ({ page }) => {
    await page.goto("/camera-models");
    await expect(page.getByRole("heading", { name: "Fichas Técnicas" })).toBeVisible({ timeout: 10_000 });

    await page.reload();
    await expect(page.getByRole("heading", { name: "Fichas Técnicas" })).toBeVisible({ timeout: 10_000 });
  });
});

// ─── CAPEX page ─────────────────────────────────────────────

test.describe("CAPEX page - no script tag error", () => {
  test.beforeEach(async ({ page }) => {
    await loginFull(page);
  });

  test("loads without script tag errors", async ({ page }) => {
    const tracker = trackConsoleErrors(page);

    await page.goto("/capex");
    await expect(page.getByText("CAPEX / Gestión de Garantías")).toBeVisible({ timeout: 10_000 });

    await page.waitForTimeout(2000);
    tracker.stop();

    // No script tag errors
    const scriptErrors = tracker.errors.filter((e) =>
      e.includes("script tag") || e.includes("script")
    );
    // Should have 0 script-related errors
    expect(scriptErrors.length).toBe(0);
  });

  test("shows equipment table or empty state", async ({ page }) => {
    await page.goto("/capex");
    await expect(page.getByRole("heading", { name: /CAPEX/ })).toBeVisible({ timeout: 10_000 });

    // Wait for data to load
    await page.waitForTimeout(5000);
    const main = page.getByRole("main");
    const hasTable = await main.locator("table").isVisible().catch(() => false);
    const hasEmpty = await main.getByText(/Sin equipos|Sin resultados/).isVisible().catch(() => false);
    const hasError = await main.getByText(/No se pudo cargar|couldn't load/).isVisible().catch(() => false);
    const hasHeading = await main.getByText("Equipos").isVisible().catch(() => false);
    expect(hasTable || hasEmpty || hasError || hasHeading).toBeTruthy();
  });
});

// ─── No hydration errors on key pages ───────────────────────

test.describe("No hydration errors across pages", () => {
  test.beforeEach(async ({ page }) => {
    await loginFull(page);
  });

  const pages = [
    { path: "/dashboard", title: "Operación CCTV" },
    { path: "/inventory", title: "Dashboard de Inventario" },
    { path: "/camera-models", title: "Fichas Técnicas" },
    { path: "/capex", title: "CAPEX" },
    { path: "/cameras", title: "Cámaras" },
  ];

  for (const p of pages) {
    test(`${p.path} loads without hydration mismatch`, async ({ page }) => {
      const tracker = trackConsoleErrors(page);

      await page.goto(p.path);
      await page.waitForTimeout(3000);
      tracker.stop();

      const hydrationErrors = tracker.errors.filter((e) =>
        e.includes("Hydration failed") || e.includes("did not match")
      );
      expect(hydrationErrors).toHaveLength(0);
    });
  }
});
