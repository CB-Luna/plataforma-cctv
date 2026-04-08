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

test.describe("Fase 2 - contexto operativo", () => {
  test.beforeEach(async ({ page }) => {
    await loginFull(page);
  });

  test("tickets muestra formulario con selectores operativos", async ({ page }) => {
    await page.goto("/tickets");
    await expect(page.getByRole("heading", { name: "Tickets", exact: true })).toBeVisible({ timeout: 10_000 });

    const createButton = page.getByRole("button", { name: /nuevo ticket/i });
    if (await createButton.isVisible().catch(() => false)) {
      await createButton.click();
      const dialog = page.getByRole("dialog");
      await expect(dialog).toBeVisible({ timeout: 5_000 });
      await expect(dialog.locator("label").filter({ hasText: "Cliente" })).toBeVisible();
      await expect(dialog.locator("label").filter({ hasText: "Sitio / sucursal" })).toBeVisible();
      await expect(dialog.locator("label").filter({ hasText: "Poliza / cobertura" })).toBeVisible();
    }
  });

  test("polizas muestra columnas de cliente y sitio", async ({ page }) => {
    await page.goto("/policies");
    await expect(page.getByRole("heading", { name: "Polizas", exact: true })).toBeVisible({ timeout: 10_000 });
    await expect(page.locator("table")).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole("columnheader", { name: "Cliente" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Sitio" })).toBeVisible();
  });

  test("alias administrativos redirigen a la tab correcta de settings", async ({ page }) => {
    await page.goto("/users");
    await page.waitForURL("**/settings?tab=usuarios", { timeout: 10_000 });
    await expect(page.getByRole("heading", { name: "Backoffice enterprise" })).toBeVisible();

    await page.goto("/roles");
    await page.waitForURL("**/settings?tab=roles", { timeout: 10_000 });

    await page.goto("/storage");
    await page.waitForURL("**/settings?tab=almacenamiento", { timeout: 10_000 });
  });
});
