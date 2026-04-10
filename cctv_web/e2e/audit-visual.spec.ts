/**
 * Auditoria visual automatizada — v2 con mejor manejo de login
 * Ejecutar: npx playwright test e2e/audit-visual.spec.ts --timeout=120000
 */
import { test, type Page } from "@playwright/test";

const BASE = "http://localhost:3011";
const DIR = "audit-screenshots";

// Se usan los botones de acceso rapido que llaman setValue de RHF

async function doLogin(page: Page, demoName: string, label: string) {
  await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(3000); // esperar hidratacion completa
  await page.screenshot({ path: `${DIR}/${label}_00_login.png`, fullPage: true });

  // Usar boton de acceso rapido (que llama setValue de RHF internamente)
  const demoBtn = page.locator("button").filter({ hasText: demoName }).first();
  await demoBtn.click();
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${DIR}/${label}_00a_filled.png`, fullPage: true });

  // Submit
  await page.locator('button[type="submit"]').click();
  await page.waitForTimeout(5000); // esperar API + navegacion

  // Capturar estado post-submit (puede mostrar error o navegar)
  await page.screenshot({ path: `${DIR}/${label}_00b_post_submit.png`, fullPage: true });

  // Verificar si salio del login
  const currentUrl = page.url();
  if (currentUrl.includes("/login")) {
    return false;
  }

  // Si hay select-company, seleccionar la primera empresa
  if (currentUrl.includes("select-company")) {
    await page.screenshot({ path: `${DIR}/${label}_00c_select_company.png`, fullPage: true });
    // Clickear primera tarjeta de empresa visible
    const companyCard = page.locator("button, [role='button'], .cursor-pointer").filter({ hasText: /\w+/ }).first();
    await companyCard.click();
    await page.waitForTimeout(4000);
    await page.screenshot({ path: `${DIR}/${label}_00d_after_select.png`, fullPage: true });
  }

  // Captura final post-login
  await page.waitForTimeout(2000);
  await page.screenshot({ path: `${DIR}/${label}_00e_dashboard.png`, fullPage: true });
  return true;
}

async function snap(page: Page, path: string, label: string, seq: string) {
  const safeName = path.replace(/\//g, "_").replace(/^_/, "");
  try {
    await page.goto(`${BASE}${path}`, { waitUntil: "domcontentloaded", timeout: 15000 });
    await page.waitForTimeout(2500);
    await page.screenshot({ path: `${DIR}/${label}_${seq}_${safeName}.png`, fullPage: true });
  } catch {
    try {
      await page.screenshot({ path: `${DIR}/${label}_${seq}_${safeName}_ERR.png`, fullPage: true });
    } catch { /* ignorar */ }
  }
}

const PAGES: [string, string][] = [
  ["/dashboard", "01"],
  ["/cameras", "02"],
  ["/nvrs", "03"],
  ["/sites", "04"],
  ["/map", "05"],
  ["/tickets", "06"],
  ["/clients", "07"],
  ["/inventory", "08"],
  ["/imports", "09"],
  ["/floor-plans", "10"],
  ["/capex", "11"],
  ["/policies", "12"],
  ["/sla", "13"],
  ["/users", "14"],
  ["/roles", "15"],
  ["/settings", "16"],
  ["/storage", "17"],
];

test.describe("Auditoria Calimax", () => {
  test.skip("screenshots Calimax — ya completado", async ({ page }) => {
    test.setTimeout(120000);
    const ok = await doLogin(page, "Calimax", "calimax");
    if (!ok) return;
    for (const [path, seq] of PAGES) {
      await snap(page, path, "calimax", seq);
    }
  });
});

test.describe("Auditoria Admin", () => {
  test("screenshots Admin", async ({ page }) => {
    test.setTimeout(120000);
    const ok = await doLogin(page, "Admin", "admin");
    if (!ok) return;
    for (const [path, seq] of PAGES) {
      await snap(page, path, "admin", seq);
    }
  });
});
