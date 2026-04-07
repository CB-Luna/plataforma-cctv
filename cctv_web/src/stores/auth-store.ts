import { create } from "zustand";
import type { User, Company, Permission } from "@/types/api";
import { setTokenCookie, removeTokenCookie } from "@/lib/cookies";

interface AuthState {
  user: User | null;
  companies: Company[];
  permissions: Permission[];
  token: string | null;
  isAuthenticated: boolean;

  setAuth: (token: string, user: User) => void;
  setProfile: (user: User, companies: Company[], permissions: Permission[]) => void;
  clearAuth: () => void;
  hasPermission: (code: string) => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  companies: [],
  permissions: [],
  token: typeof window !== "undefined" ? localStorage.getItem("access_token") : null,
  isAuthenticated: typeof window !== "undefined" ? !!localStorage.getItem("access_token") : false,

  setAuth: (token, user) => {
    localStorage.setItem("access_token", token);
    setTokenCookie(token);
    set({ token, user, isAuthenticated: true });
  },

  setProfile: (user, companies, permissions) => {
    set({ user, companies, permissions });
  },

  clearAuth: () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("tenant_id");
    removeTokenCookie();
    set({ token: null, user: null, companies: [], permissions: [], isAuthenticated: false });
  },

  hasPermission: (code) => {
    return get().permissions.some((p) => p.code === code);
  },
}));
