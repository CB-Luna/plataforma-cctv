import ky from "ky";
import { removeTokenCookie } from "@/lib/cookies";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8087/api/v1";

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

        const tenantId = localStorage.getItem("tenant_id");
        if (tenantId) {
          request.headers.set("X-Company-ID", tenantId);
        }
      },
    ],
    afterResponse: [
      (_request, _options, response) => {
        // ⚠️ No hay refresh token (GAP-04) — redirect a login en 401
        if (response.status === 401 && typeof window !== "undefined") {
          localStorage.removeItem("access_token");
          localStorage.removeItem("tenant_id");
          removeTokenCookie();
          window.location.href = "/login";
        }
      },
    ],
  },
});
