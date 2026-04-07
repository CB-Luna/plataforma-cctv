import { describe, it, expect, beforeEach, vi } from "vitest";
import { useAuthStore } from "@/stores/auth-store";
import type { User, Company, Permission } from "@/types/api";

// Mock cookies module
vi.mock("@/lib/cookies", () => ({
  setTokenCookie: vi.fn(),
  removeTokenCookie: vi.fn(),
}));

const mockUser: User = {
  id: "u1",
  email: "admin@demo.com",
  first_name: "Admin",
  last_name: "Demo",
  is_active: true,
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
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
  { id: "p1", code: "cameras.view", name: "View Cameras", module: "cameras" },
  { id: "p2", code: "cameras.edit", name: "Edit Cameras", module: "cameras" },
];

describe("auth-store", () => {
  beforeEach(() => {
    localStorage.clear();
    useAuthStore.setState({
      user: null,
      companies: [],
      permissions: [],
      token: null,
      isAuthenticated: false,
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
    useAuthStore.getState().setProfile(mockUser, [mockCompany], mockPermissions);
    const state = useAuthStore.getState();

    expect(state.user?.first_name).toBe("Admin");
    expect(state.companies).toHaveLength(1);
    expect(state.permissions).toHaveLength(2);
  });

  it("hasPermission returns true for existing code", () => {
    useAuthStore.getState().setProfile(mockUser, [], mockPermissions);

    expect(useAuthStore.getState().hasPermission("cameras.view")).toBe(true);
    expect(useAuthStore.getState().hasPermission("cameras.edit")).toBe(true);
    expect(useAuthStore.getState().hasPermission("tickets.view")).toBe(false);
  });

  it("clearAuth resets everything", () => {
    useAuthStore.getState().setAuth("tok123", mockUser);
    useAuthStore.getState().setProfile(mockUser, [mockCompany], mockPermissions);
    useAuthStore.getState().clearAuth();

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
    expect(state.token).toBeNull();
    expect(state.companies).toHaveLength(0);
    expect(state.permissions).toHaveLength(0);
    expect(localStorage.getItem("access_token")).toBeNull();
  });
});
