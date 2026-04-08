import { expect, test, type Page } from "@playwright/test";

const TEST_EMAIL = "admin@demo.com";
const TEST_PASSWORD = "Password123!";

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

test.describe("Fase 4 - operacion contractual", () => {
  test.beforeEach(async ({ page }) => {
    await loginFull(page);
  });

  test("tickets expone filtros y previsualizacion contractual", async ({ page }) => {
    await page.goto("/tickets");
    await expect(page.getByRole("heading", { name: "Tickets", exact: true })).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/Cobertura contractual/i)).toBeVisible();
    await expect(page.getByText(/Seguimiento SLA/i)).toBeVisible();

    const createButton = page.getByRole("button", { name: /nuevo ticket/i });
    if (await createButton.isVisible().catch(() => false)) {
      await createButton.click();
      await expect(page.getByRole("dialog")).toBeVisible();
      await expect(page.getByText(/Cobertura contractual estimada/i)).toBeVisible();
      await expect(page.getByText(/Regla SLA estimada/i)).toBeVisible();
      await expect(page.getByText(/Solo se muestran polizas activas y vigentes/i)).toBeVisible();
    }
  });

  test("polizas expone cobertura operativa en el formulario", async ({ page }) => {
    await page.goto("/policies");
    await expect(page.getByRole("heading", { name: "Polizas", exact: true })).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole("columnheader", { name: "Alcance" })).toBeVisible();

    await page.getByRole("button", { name: /nueva poliza/i }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.getByText(/Cobertura operativa/i)).toBeVisible();
    await expect(page.getByText(/Servicios cubiertos/i)).toBeVisible();
    await expect(page.getByText(/Alcance de activos/i)).toBeVisible();
  });

  test("sla comunica reglas reales y limitaciones del motor", async ({ page }) => {
    await page.goto("/sla");
    await expect(page.getByRole("heading", { name: "Politicas SLA" })).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/El backend elige la primera regla activa/i)).toBeVisible();
    await expect(page.getByText(/Coincidencia replica el criterio real/i)).toBeVisible();

    await page.getByRole("button", { name: /nueva politica sla/i }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.getByText(/Alcance actual de esta regla/i)).toBeVisible();
    await expect(page.getByText(/Politica por defecto/i)).toBeVisible();
  });
});
