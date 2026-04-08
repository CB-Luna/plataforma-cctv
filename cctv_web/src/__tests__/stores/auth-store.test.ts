import { describe, it, expect, beforeEach, vi } from "vitest";
import { useAuthStore } from "@/stores/auth-store";
import type { User, Company, Permission, Role } from "@/types/api";

// Mock cookies module
vi.mock("@/lib/cookies", () => ({
  setTokenCookie: vi.fn(),
  removeTokenCookie: vi.fn(),
}));

const mockUser: User = {
  id: "u1",
  tenant_id: "c1",
  email: "admin@demo.com",
  first_name: "Admin",
  last_name: "Demo",
  email_verified: true,
  is_active: true,
  last_login_at: null,
  created_at: "2024-01-01T00:00:00Z",
};

const mockCompany: Company = {
  id: "c1",
  name: "Demo Corp",
  slug: "demo",
  is_active: true,
  primary_color: "#1976D2",
  secondary_color: "#424242",
  tertiary_color: "#757575",
};

const mockPermissions: Permission[] = [
  { id: "p1", code: "cameras.view", description: "View Cameras", module: "cameras", created_at: "2024-01-01T00:00:00Z" },
  { id: "p2", code: "cameras.edit", description: "Edit Cameras", module: "cameras", created_at: "2024-01-01T00:00:00Z" },
];

const mockRoles: Role[] = [
  {
    id: "r1",
    tenant_id: "c1",
    name: "tenant_admin",
    description: "Administrador del tenant",
    is_system: true,
    created_at: "2024-01-01T00:00:00Z",
  },
];

describe("auth-store", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    useAuthStore.setState({
      user: null,
      companies: [],
      roles: [],
      permissions: [],
      token: null,
      isAuthenticated: false,
      pendingTenantSelection: null,
    });
  });

  it("starts unauthenticated", () => {
    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
    expect(state.token).toBeNull();
  });

  it("setAuth stores token and user", () => {
    useAuthStore.getState().setAuth("tok123", mockUser);
    const state = useAuthStore.getState();

    expect(state.isAuthenticated).toBe(true);
    expect(state.token).toBe("tok123");
    expect(state.user?.email).toBe("admin@demo.com");
    expect(localStorage.getItem("access_token")).toBe("tok123");
  });

  it("setProfile stores user, companies, permissions", () => {
    useAuthStore.getState().setProfile(mockUser, [mockCompany], mockRoles, mockPermissions);
    const state = useAuthStore.getState();

    expect(state.user?.first_name).toBe("Admin");
    expect(state.companies).toHaveLength(1);
    expect(state.roles).toHaveLength(1);
    expect(state.permissions).toHaveLength(2);
  });

  it("hasPermission returns true for existing code", () => {
    useAuthStore.getState().setProfile(mockUser, [], mockRoles, mockPermissions);

    expect(useAuthStore.getState().hasPermission("cameras.view")).toBe(true);
    expect(useAuthStore.getState().hasPermission("cameras.edit")).toBe(true);
    expect(useAuthStore.getState().hasPermission("tickets.view")).toBe(false);
  });

  it("setPendingTenantSelection stores snapshot in memory and sessionStorage", () => {
    const pendingSelection = {
      email: "admin@demo.com",
      password: "Password123!",
      companies: [mockCompany],
      redirectTo: "/dashboard",
    };

    useAuthStore.getState().setPendingTenantSelection(pendingSelection);
    const state = useAuthStore.getState();

    expect(state.pendingTenantSelection).toEqual(pendingSelection);
    expect(sessionStorage.getItem("pending_tenant_selection")).toContain("admin@demo.com");
  });

  it("clearPendingTenantSelection removes the session snapshot", () => {
    useAuthStore.getState().setPendingTenantSelection({
      email: "admin@demo.com",
      password: "Password123!",
      companies: [mockCompany],
      redirectTo: "/dashboard",
    });

    useAuthStore.getState().clearPendingTenantSelection();

    expect(useAuthStore.getState().pendingTenantSelection).toBeNull();
    expect(sessionStorage.getItem("pending_tenant_selection")).toBeNull();
  });

  it("clearAuth resets everything", () => {
    useAuthStore.getState().setAuth("tok123", mockUser);
    useAuthStore.getState().setProfile(mockUser, [mockCompany], mockRoles, mockPermissions);
    useAuthStore.getState().setPendingTenantSelection({
      email: "admin@demo.com",
      password: "Password123!",
      companies: [mockCompany],
      redirectTo: "/dashboard",
    });
    useAuthStore.getState().clearAuth();

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
    expect(state.token).toBeNull();
    expect(state.companies).toHaveLength(0);
    expect(state.roles).toHaveLength(0);
    expect(state.permissions).toHaveLength(0);
    expect(localStorage.getItem("access_token")).toBeNull();
    expect(sessionStorage.getItem("pending_tenant_selection")).toBeNull();
  });
});
