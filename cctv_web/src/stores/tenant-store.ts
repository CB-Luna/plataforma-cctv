import { create } from "zustand";
import type { Company } from "@/types/api";

const TENANT_ID_STORAGE_KEY = "tenant_id";
const TENANT_SNAPSHOT_STORAGE_KEY = "tenant_snapshot";

function loadStoredCompany(): Company | null {
  if (typeof window === "undefined") return null;

  const storedSnapshot = localStorage.getItem(TENANT_SNAPSHOT_STORAGE_KEY);
  if (!storedSnapshot) return null;

  try {
    return JSON.parse(storedSnapshot) as Company;
  } catch {
    localStorage.removeItem(TENANT_SNAPSHOT_STORAGE_KEY);
    localStorage.removeItem(TENANT_ID_STORAGE_KEY);
    return null;
  }
}

interface TenantState {
  currentCompany: Company | null;
  setCompany: (company: Company) => void;
  clearCompany: () => void;
}

export const useTenantStore = create<TenantState>((set) => ({
  currentCompany: loadStoredCompany(),

  setCompany: (company) => {
    localStorage.setItem(TENANT_ID_STORAGE_KEY, company.id);
    localStorage.setItem(TENANT_SNAPSHOT_STORAGE_KEY, JSON.stringify(company));
    set({ currentCompany: company });
  },

  clearCompany: () => {
    localStorage.removeItem(TENANT_ID_STORAGE_KEY);
    localStorage.removeItem(TENANT_SNAPSHOT_STORAGE_KEY);
    set({ currentCompany: null });
  },
}));
