import { describe, expect, it } from "vitest";
import {
  LEGACY_DEFAULT_ENABLED_SERVICES,
  buildTenantSettings,
  isRouteEnabledForServices,
  isServiceRuntimeVisible,
  isSettingsTabEnabledForServices,
  parseTenantProductProfile,
} from "@/lib/product/service-catalog";

describe("service catalog helpers", () => {
  it("parses explicit package, services and onboarding snapshot from settings", () => {
    const profile = parseTenantProductProfile({
      subscription_plan: "basic",
      settings: {
        package_profile: "enterprise",
        enabled_services: ["cctv", "storage"],
        onboarding: {
          status: "ready",
          admin_email: "admin@tenant.test",
          role_name: "tenant_admin",
        },
      },
    });

    expect(profile.packageProfile).toBe("enterprise");
    expect(profile.source).toBe("explicit");
    expect(profile.enabledServices).toEqual(["cctv", "storage"]);
    expect(profile.onboarding.status).toBe("ready");
    expect(profile.onboarding.adminEmail).toBe("admin@tenant.test");
    expect(profile.onboarding.roleName).toBe("tenant_admin");
  });

  it("falls back to legacy defaults when the tenant has no explicit service assignment", () => {
    const profile = parseTenantProductProfile({
      subscription_plan: "professional",
      settings: {},
    });

    expect(profile.packageProfile).toBe("professional");
    expect(profile.source).toBe("legacy_default");
    expect(profile.enabledServices).toEqual(LEGACY_DEFAULT_ENABLED_SERVICES);
  });

  it("builds tenant settings preserving unrelated keys", () => {
    const settings = buildTenantSettings({
      existingSettings: {
        custom_flag: true,
        nested: { keep: "value" },
      },
      packageProfile: "professional",
      enabledServices: ["cctv", "storage", "cctv"],
      onboarding: {
        status: "admin_created_pending_role",
        adminEmail: "ops@tenant.test",
        notes: "Pendiente de rol",
      },
    });

    expect(settings.custom_flag).toBe(true);
    expect(settings.nested).toEqual({ keep: "value" });
    expect(settings.package_profile).toBe("professional");
    expect(settings.enabled_services).toEqual(["cctv", "storage"]);
    expect(settings.onboarding).toEqual({
      status: "admin_created_pending_role",
      admin_email: "ops@tenant.test",
      admin_name: undefined,
      role_name: undefined,
      notes: "Pendiente de rol",
      updated_at: undefined,
    });
  });

  it("gates routes and settings tabs by enabled service", () => {
    expect(isRouteEnabledForServices("/cameras", ["cctv"])).toBe(true);
    expect(isRouteEnabledForServices("/cameras", ["storage"])).toBe(false);
    expect(isRouteEnabledForServices("/tickets", ["storage"])).toBe(true);
    expect(isRouteEnabledForServices("/access-control", ["access_control"], { hasRoleContext: true })).toBe(true);
    expect(isRouteEnabledForServices("/access-control", ["access_control"], { hasRoleContext: false })).toBe(false);

    expect(isSettingsTabEnabledForServices("ia", ["cctv", "intelligence"])).toBe(true);
    expect(isSettingsTabEnabledForServices("ia", ["cctv"])).toBe(false);
    expect(isSettingsTabEnabledForServices("usuarios", ["cctv"])).toBe(true);
  });

  it("distinguishes runtime visible services from partial capabilities", () => {
    expect(isServiceRuntimeVisible("cctv")).toBe(true);
    expect(isServiceRuntimeVisible("access_control", { hasRoleContext: true })).toBe(true);
    expect(isServiceRuntimeVisible("access_control", { hasRoleContext: false })).toBe(false);
    expect(isServiceRuntimeVisible("storage")).toBe(false);
  });
});
