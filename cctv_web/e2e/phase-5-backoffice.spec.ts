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

test.describe("Fase 5 - backoffice enterprise", () => {
  test.beforeEach(async ({ page }) => {
    await loginFull(page);
    await page.goto("/settings");
  });

  test("settings separa plataforma y tenant activo", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Backoffice enterprise" })).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole("button", { name: /backoffice global/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /portal de empresa/i })).toBeVisible();
    await expect(page.getByText(/deja de ser una sola bolsa/i)).toBeVisible();
  });

  test("plantillas de menu expone consola global real", async ({ page }) => {
    await page.getByRole("button", { name: "Plantillas de menu", exact: true }).click();
    await expect(page.getByText(/Plantillas globales de navegacion/i)).toBeVisible();
    await expect(page.getByText("Tenants asignados", { exact: true })).toBeVisible();
    await expect(page.getByText("Composicion base del menu", { exact: true })).toBeVisible();
    await expect(page.getByText("Vista efectiva del tenant activo", { exact: true })).toBeVisible();
  });

  test("tenant scope ordena tema, ia y storage con ownership explicito", async ({ page }) => {
    await page.getByRole("button", { name: /portal de empresa/i }).click();
    await expect(page.getByRole("button", { name: /usuarios/i })).toBeVisible();

    await page.getByRole("button", { name: "Tema", exact: true }).click();
    await expect(page.getByText(/Branding y configuracion visual del tenant/i)).toBeVisible();

    await page.getByRole("button", { name: /^IA$/i }).click();
    await expect(page.getByText(/IA operativa por tenant/i)).toBeVisible();

    await page.getByRole("button", { name: "Storage", exact: true }).click();
    await expect(page.getByText(/Storage operativo del tenant/i)).toBeVisible();
  });
});
