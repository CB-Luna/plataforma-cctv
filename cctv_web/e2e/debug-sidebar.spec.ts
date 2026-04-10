import { test, expect, type Page } from "@playwright/test";

/**
 * Test de diagnostico: verifica que el sidebar es navegable
 * desde /cameras y /imports (bug reportado).
 * Usa el mismo patron de login que critical-flows.spec.ts.
 */

const TEST_EMAIL = "admin@demo.com";
const TEST_PASSWORD = "Password123!";

async function doLogin(page: Page) {
  const API = "http://localhost:8088/api/v1";

  // 1. Login directo via API
  const loginRes = await page.request.post(`${API}/auth/login`, {
    data: { email: TEST_EMAIL, password: TEST_PASSWORD },
  });
  const loginBody = await loginRes.json();
  const token = loginBody.access_token;
  if (!token) throw new Error("No token: " + JSON.stringify(loginBody));

  // 2. Obtener perfil
  const meRes = await page.request.get(`${API}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const meBody = await meRes.json();
  console.log("Me response:", JSON.stringify(meBody).slice(0, 200));

  // 3. Preparar datos de auth
  const user = meBody.user;
  const companies = meBody.companies;
  const roles = meBody.roles;
  const permissions = meBody.permissions;
  const firstCompany = companies[0];

  // 4. Inyectar estado completo via evaluate ANTES de navegar al dashboard
  //    Esto setea localStorage y el estado de Zustand
  await page.goto("/login"); // Ir primero a cualquier pagina del dominio para tener acceso a localStorage
  await page.waitForLoadState("domcontentloaded");

  await page.evaluate(({ token, user, companies, roles, permissions, firstCompany }) => {
    // Inyectar token
    localStorage.setItem("access_token", token);
    // Inyectar tenant
    if (firstCompany) {
      localStorage.setItem("tenant_id", firstCompany.id);
      localStorage.setItem("tenant_snapshot", JSON.stringify(firstCompany));
    }
  }, { token, user, companies, roles, permissions, firstCompany });

  // 5. Navegar al dashboard — el layout.tsx vera el token y llamara hydrateSession()
  await page.goto("/dashboard", { waitUntil: "networkidle" });
  await page.waitForTimeout(3000);

  console.log("URL after dashboard nav:", page.url());

  // Si sigue en login, intentar ir directo
  if (page.url().includes("/login")) {
    console.log("Still on login, trying force navigate...");
    await page.goto("/dashboard", { waitUntil: "networkidle" });
    await page.waitForTimeout(3000);
    console.log("URL after second nav:", page.url());
  }
}

async function loginFull(page: Page) {
  await doLogin(page);
  // Si estamos en select-company, elegir primera
  if (page.url().includes("/select-company")) {
    await expect(page.getByText("Selecciona una empresa")).toBeVisible();
    await page.getByRole("button", { name: "Entrar" }).first().click();
    await page.waitForURL("**/dashboard", { timeout: 10_000 });
  }
  // Verificar que llegamos a alguna pagina autenticada
  const url = page.url();
  console.log("loginFull URL final:", url);
  if (url.includes("/login")) {
    throw new Error("Login failed - still on login page");
  }
}

/** Captura estado del DOM relevante para diagnostico del sidebar */
async function captureDomState(page: Page, label: string) {
  const result = await page.evaluate(() => {
    const aside = document.querySelector("aside");
    if (!aside) return { error: "aside no encontrado en el DOM" };
    const asideRect = aside.getBoundingClientRect();
    const asideStyle = getComputedStyle(aside);
    const links = Array.from(aside.querySelectorAll("a"));
    const allInert = Array.from(document.querySelectorAll("[inert]"));
    const allBaseUiInert = Array.from(document.querySelectorAll("[data-base-ui-inert]"));
    const allPortals = Array.from(document.querySelectorAll("[data-base-ui-portal]"));

    // Verificar si algo cubre el aside visualmente
    const centerPoint = { x: asideRect.left + asideRect.width / 2, y: asideRect.top + asideRect.height / 2 };
    const elAtCenter = document.elementFromPoint(centerPoint.x, centerPoint.y);

    // Verificar cada link del sidebar
    const linkDetails = links.slice(0, 8).map((a) => {
      const rect = a.getBoundingClientRect();
      const linkCenter = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
      const elAtLink = document.elementFromPoint(linkCenter.x, linkCenter.y);
      return {
        href: a.getAttribute("href"),
        text: (a.textContent || "").trim().slice(0, 30),
        pointerEvents: getComputedStyle(a).pointerEvents,
        inert: a.hasAttribute("inert") || a.closest("[inert]") !== null,
        ariaHidden: a.getAttribute("aria-hidden") || a.closest("[aria-hidden]")?.getAttribute("aria-hidden"),
        rect: { x: Math.round(rect.x), y: Math.round(rect.y), w: Math.round(rect.width), h: Math.round(rect.height) },
        elementAtLinkCenter: elAtLink ? {
          tag: elAtLink.tagName,
          id: elAtLink.id,
          isTheLink: elAtLink === a || a.contains(elAtLink),
        } : null,
      };
    });

    return {
      aside: {
        inert: aside.hasAttribute("inert"),
        ariaHidden: aside.getAttribute("aria-hidden"),
        pointerEvents: asideStyle.pointerEvents,
        display: asideStyle.display,
        visibility: asideStyle.visibility,
        zIndex: asideStyle.zIndex,
        overflow: asideStyle.overflow,
        rect: { x: Math.round(asideRect.x), y: Math.round(asideRect.y), w: Math.round(asideRect.width), h: Math.round(asideRect.height) },
      },
      elementAtAsideCenter: elAtCenter ? {
        tag: elAtCenter.tagName,
        id: elAtCenter.id,
        classes: (elAtCenter.className?.toString() || "").slice(0, 120),
        isInsideAside: aside.contains(elAtCenter),
      } : null,
      links: linkDetails,
      linkCount: links.length,
      inertElements: allInert.map((el) => ({
        tag: el.tagName,
        id: el.id,
        classes: (el.className?.toString() || "").slice(0, 100),
      })),
      baseUiInertCount: allBaseUiInert.length,
      portalCount: allPortals.length,
      bodyOverflow: getComputedStyle(document.body).overflow,
      bodyPointerEvents: getComputedStyle(document.body).pointerEvents,
    };
  });

  console.log(`\n=== ${label} DOM State ===`);
  console.log(JSON.stringify(result, null, 2));
  return result;
}

test.describe("DEBUG - Sidebar navigation", () => {
  test("capturar estado DOM y probar clicks en sidebar", async ({ page }) => {
    // Login con el patron que funciona
    await loginFull(page);

    // -- NVRs (pagina que funciona) --
    await page.goto("/nvrs");
    await page.waitForLoadState("networkidle");
    const nvrsState = await captureDomState(page, "NVRs");

    // -- Cameras (pagina potencialmente rota) --
    await page.goto("/cameras");
    await page.waitForLoadState("networkidle");
    const camerasState = await captureDomState(page, "Cameras");

    // -- Imports (pagina potencialmente rota) --
    await page.goto("/imports");
    await page.waitForLoadState("networkidle");
    const importsState = await captureDomState(page, "Imports");

    // -- Probar click en sidebar desde /cameras --
    console.log("\n=== Test de navegacion desde /cameras ===");
    await page.goto("/cameras");
    await page.waitForLoadState("networkidle");

    const sidebarLink = page.locator("aside a[href='/dashboard']").first();
    const isVisible = await sidebarLink.isVisible().catch(() => false);
    console.log("Dashboard link visible:", isVisible);

    if (isVisible) {
      const box = await sidebarLink.boundingBox();
      console.log("Link bounding box:", JSON.stringify(box));

      const urlBefore = page.url();
      try {
        await sidebarLink.click({ timeout: 5000 });
        await page.waitForTimeout(2000);
      } catch (e) {
        console.log("Click fallo:", (e as Error).message.slice(0, 200));
      }
      const urlAfter = page.url();
      console.log(`Nav: ${urlBefore} -> ${urlAfter} (cambio: ${urlBefore !== urlAfter})`);
    }

    // -- Probar click en sidebar desde /imports --
    console.log("\n=== Test de navegacion desde /imports ===");
    await page.goto("/imports");
    await page.waitForLoadState("networkidle");

    const sidebarLink2 = page.locator("aside a[href='/dashboard']").first();
    if (await sidebarLink2.isVisible().catch(() => false)) {
      const urlBefore = page.url();
      try {
        await sidebarLink2.click({ timeout: 5000 });
        await page.waitForTimeout(2000);
      } catch (e) {
        console.log("Click fallo:", (e as Error).message.slice(0, 200));
      }
      const urlAfter = page.url();
      console.log(`Nav: ${urlBefore} -> ${urlAfter} (cambio: ${urlBefore !== urlAfter})`);
    }

    // Verificaciones
    expect(nvrsState).not.toHaveProperty("error");
    expect(camerasState).not.toHaveProperty("error");
    expect(importsState).not.toHaveProperty("error");
  });
});
