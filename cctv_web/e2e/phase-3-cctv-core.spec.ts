import { expect, test, type Page } from "@playwright/test";

const TEST_EMAIL = "admin@demo.com";
const TEST_PASSWORD = "Password123!";
const CSV_FIXTURE = "e2e/fixtures/cameras-import.csv";

async function loginFull(page: Page) {
  await page.goto("/login");
  await page.locator("#email").fill(TEST_EMAIL);
  await page.locator("#password").fill(TEST_PASSWORD);
  await page.getByRole("button", { name: "Ingresar" }).click();
  await page.waitForURL(/\/(select-company|dashboard)/, { timeout: 15_000 });

  if (page.url().includes("/select-company")) {
    await page.getByRole("button", { name: "Entrar" }).first().click();
    await page.waitForURL("**/dashboard", { timeout: 10_000 });
  }
}

test.describe("Fase 3 - cierre CCTV core", () => {
  test.beforeEach(async ({ page }) => {
    await loginFull(page);
  });

  test("camaras y nvrs muestran capacidades manuales honestas", async ({ page }) => {
    await page.goto("/cameras");
    await expect(page.getByRole("heading", { name: "Camaras", exact: true })).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/La edicion se difiere/i)).toBeVisible();

    await page.goto("/nvrs");
    await expect(page.getByRole("heading", { name: "Servidores NVR", exact: true })).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/edicion manual parcial/i)).toBeVisible();
  });

  test("imports parsea archivo y expone mapeo visible", async ({ page }) => {
    await page.goto("/imports");
    await expect(page.getByRole("heading", { name: "Importacion masiva" })).toBeVisible({ timeout: 10_000 });

    await page.getByRole("button", { name: /nueva importacion/i }).first().click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.locator('input[type="file"]').setInputFiles(CSV_FIXTURE);

    await expect(page.getByText("Mapeo de columnas")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText("Nombre de la camara")).toBeVisible();
    await expect(page.getByText("Columnas mapeadas").first()).toBeVisible();
  });

  test("mapa comunica precision aproximada", async ({ page }) => {
    await page.goto("/map");
    await expect(page.getByRole("heading", { name: "Mapa de Sucursales" })).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/Precision geografica aproximada/i)).toBeVisible();
  });

  test("floor plans muestra mensaje de persistencia defendible", async ({ page }) => {
    await page.goto("/floor-plans");
    await expect(page.getByRole("heading", { name: "Planos Interactivos" })).toBeVisible({ timeout: 10_000 });

    const firstPlanAction = page.getByRole("button", { name: /Ver Plano|Crear Plano/ }).first();
    await expect(firstPlanAction).toBeVisible({ timeout: 10_000 });
    await firstPlanAction.click();

    await expect(page.getByText(/Persistencia defendible del editor/i)).toBeVisible({ timeout: 10_000 });
  });
});
