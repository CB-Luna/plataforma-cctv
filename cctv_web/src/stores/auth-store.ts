import { create } from "zustand";
import type { User, Company, Permission, Role } from "@/types/api";
import { setTokenCookie, removeTokenCookie } from "@/lib/cookies";
import { hasAnyPermission, hasPermission } from "@/lib/auth/permissions";
import { useTenantStore } from "@/stores/tenant-store";

const PENDING_TENANT_SELECTION_KEY = "pending_tenant_selection";

interface PendingTenantSelection {
  email: string;
  password: string;
  companies: Company[];
  redirectTo: string;
}

interface AuthState {
  user: User | null;
  companies: Company[];
  roles: Role[];
  permissions: Permission[];
  token: string | null;
  isAuthenticated: boolean;
  pendingTenantSelection: PendingTenantSelection | null;

  setAuth: (token: string, user: User) => void;
  setProfile: (user: User, companies: Company[], roles: Role[], permissions: Permission[]) => void;
  setPendingTenantSelection: (pendingTenantSelection: PendingTenantSelection) => void;
  clearPendingTenantSelection: () => void;
  clearAuth: () => void;
  hasPermission: (code: string) => boolean;
  hasAnyPermission: (...codes: string[]) => boolean;
}

function readPendingTenantSelection(): PendingTenantSelection | null {
  if (typeof window === "undefined") return null;

  const rawValue = sessionStorage.getItem(PENDING_TENANT_SELECTION_KEY);
  if (!rawValue) return null;

  try {
    const parsedValue = JSON.parse(rawValue) as Partial<PendingTenantSelection>;
    if (
      typeof parsedValue.email === "string" &&
      typeof parsedValue.password === "string" &&
      typeof parsedValue.redirectTo === "string" &&
      Array.isArray(parsedValue.companies)
    ) {
      return {
        email: parsedValue.email,
        password: parsedValue.password,
        companies: parsedValue.companies,
        redirectTo: parsedValue.redirectTo,
      };
    }
  } catch {
    sessionStorage.removeItem(PENDING_TENANT_SELECTION_KEY);
  }

  return null;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  companies: [],
  roles: [],
  permissions: [],
  token: typeof window !== "undefined" ? localStorage.getItem("access_token") : null,
  isAuthenticated: typeof window !== "undefined" ? !!localStorage.getItem("access_token") : false,
  pendingTenantSelection: readPendingTenantSelection(),

  setAuth: (token, user) => {
    localStorage.setItem("access_token", token);
    setTokenCookie(token);
    set({ token, user, isAuthenticated: true });
  },

  setProfile: (user, companies, roles, permissions) => {
    set({ user, companies, roles, permissions });
  },

  setPendingTenantSelection: (pendingTenantSelection) => {
    sessionStorage.setItem(PENDING_TENANT_SELECTION_KEY, JSON.stringify(pendingTenantSelection));
    set({ pendingTenantSelection });
  },

  clearPendingTenantSelection: () => {
    if (typeof window !== "undefined") {
      sessionStorage.removeItem(PENDING_TENANT_SELECTION_KEY);
    }
    set({ pendingTenantSelection: null });
  },

  clearAuth: () => {
    localStorage.removeItem("access_token");
    removeTokenCookie();
    if (typeof window !== "undefined") {
      sessionStorage.removeItem(PENDING_TENANT_SELECTION_KEY);
    }
    useTenantStore.getState().clearCompany();
    set({
      token: null,
      user: null,
      companies: [],
      roles: [],
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
