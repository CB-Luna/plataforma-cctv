import { create } from "zustand";
import type { Company } from "@/types/api";

interface TenantState {
  currentCompany: Company | null;
  setCompany: (company: Company) => void;
  clearCompany: () => void;
}

export const useTenantStore = create<TenantState>((set) => ({
  currentCompany: null,

  setCompany: (company) => {
    localStorage.setItem("tenant_id", company.id);
    set({ currentCompany: company });
  },

  clearCompany: () => {
    localStorage.removeItem("tenant_id");
    set({ currentCompany: null });
  },
}));
