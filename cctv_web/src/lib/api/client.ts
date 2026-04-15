import ky from "ky";
import { removeTokenCookie } from "@/lib/cookies";
import { PLATFORM_TENANT_ID } from "@/lib/platform";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8088/api/v1";

function applyTenantOverride(request: Request): Request {
  if (typeof window === "undefined" || request.method.toUpperCase() !== "GET") {
    return request;
  }

  const tenantId = localStorage.getItem("tenant_id");
  if (!tenantId || tenantId === PLATFORM_TENANT_ID) {
    return request;
  }

  const url = new URL(request.url);
  if (url.searchParams.has("tenant_id")) {
    return request;
  }

  url.searchParams.set("tenant_id", tenantId);
  return new Request(url.toString(), request);
}

export const api = ky.create({
  prefixUrl: API_URL,
  timeout: 30_000,
  hooks: {
    beforeRequest: [
      (request) => {
        if (typeof window === "undefined") return;

        const token = localStorage.getItem("access_token");
        if (token) {
          request.headers.set("Authorization", `Bearer ${token}`);
        }

        return applyTenantOverride(request);
      },
    ],
    afterResponse: [
      (_request, _options, response) => {
        // ⚠️ No hay refresh token (GAP-04) — redirect a login en 401
        if (response.status === 401 && typeof window !== "undefined") {
          localStorage.removeItem("access_token");
          localStorage.removeItem("tenant_id");
          localStorage.removeItem("tenant_snapshot");
          localStorage.removeItem("site_id");
          localStorage.removeItem("site_snapshot");
          removeTokenCookie();
          window.location.href = "/login";
        }
      },
    ],
  },
});

export const publicApi = ky.create({
  prefixUrl: API_URL,
  timeout: 30_000,
});
