import { create } from "zustand";
import type { User, Company, Permission } from "@/types/api";
import { setTokenCookie, removeTokenCookie } from "@/lib/cookies";
import { hasAnyPermission, hasPermission } from "@/lib/auth/permissions";
import { useTenantStore } from "@/stores/tenant-store";

interface PendingTenantSelection {
  email: string;
  password: string;
  companies: Company[];
  redirectTo: string;
}

interface AuthState {
  user: User | null;
  companies: Company[];
  permissions: Permission[];
  token: string | null;
  isAuthenticated: boolean;
  pendingTenantSelection: PendingTenantSelection | null;

  setAuth: (token: string, user: User) => void;
  setProfile: (user: User, companies: Company[], permissions: Permission[]) => void;
  setPendingTenantSelection: (pendingTenantSelection: PendingTenantSelection) => void;
  clearPendingTenantSelection: () => void;
  clearAuth: () => void;
  hasPermission: (code: string) => boolean;
  hasAnyPermission: (...codes: string[]) => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  companies: [],
  permissions: [],
  token: typeof window !== "undefined" ? localStorage.getItem("access_token") : null,
  isAuthenticated: typeof window !== "undefined" ? !!localStorage.getItem("access_token") : false,
  pendingTenantSelection: null,

  setAuth: (token, user) => {
    localStorage.setItem("access_token", token);
    setTokenCookie(token);
    set({ token, user, isAuthenticated: true });
  },

  setProfile: (user, companies, permissions) => {
    set({ user, companies, permissions });
  },

  setPendingTenantSelection: (pendingTenantSelection) => {
    set({ pendingTenantSelection });
  },

  clearPendingTenantSelection: () => {
    set({ pendingTenantSelection: null });
  },

  clearAuth: () => {
    localStorage.removeItem("access_token");
    removeTokenCookie();
    useTenantStore.getState().clearCompany();
    set({
      token: null,
      user: null,
      companies: [],
      permissions: [],
      isAuthenticated: false,
      pendingTenantSelection: null,
    });
  },

  hasPermission: (code) => {
    return hasPermission(
      get().permissions.map((permission) => permission.code),
      code,
    );
  },

  hasAnyPermission: (...codes) =>
    hasAnyPermission(
      get().permissions.map((permission) => permission.code),
      codes,
    ),
}));
