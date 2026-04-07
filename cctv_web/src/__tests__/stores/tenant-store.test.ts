import { describe, it, expect, beforeEach } from "vitest";
import { useTenantStore } from "@/stores/tenant-store";
import type { Company } from "@/types/api";

const mockCompany: Company = {
  id: "c1",
  name: "Demo Corp",
  slug: "demo",
  is_active: true,
  primary_color: "#1976D2",
  secondary_color: "#424242",
  tertiary_color: "#757575",
};

const mockCompany2: Company = {
  id: "c2",
  name: "Acme Inc",
  slug: "acme",
  is_active: true,
  primary_color: "#FF5722",
  secondary_color: "#333",
  tertiary_color: "#666",
};

describe("tenant-store", () => {
  beforeEach(() => {
    localStorage.clear();
    useTenantStore.setState({ currentCompany: null });
  });

  it("starts with null company", () => {
    expect(useTenantStore.getState().currentCompany).toBeNull();
  });

  it("setCompany stores company and persists tenant_id", () => {
    useTenantStore.getState().setCompany(mockCompany);

    expect(useTenantStore.getState().currentCompany?.name).toBe("Demo Corp");
    expect(localStorage.getItem("tenant_id")).toBe("c1");
  });

  it("setCompany can switch between companies", () => {
    useTenantStore.getState().setCompany(mockCompany);
    expect(useTenantStore.getState().currentCompany?.id).toBe("c1");

    useTenantStore.getState().setCompany(mockCompany2);
    expect(useTenantStore.getState().currentCompany?.id).toBe("c2");
    expect(localStorage.getItem("tenant_id")).toBe("c2");
  });

  it("clearCompany resets state and removes from localStorage", () => {
    useTenantStore.getState().setCompany(mockCompany);
    useTenantStore.getState().clearCompany();

    expect(useTenantStore.getState().currentCompany).toBeNull();
    expect(localStorage.getItem("tenant_id")).toBeNull();
  });
});
