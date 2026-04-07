import { create } from "zustand";

interface SidebarState {
  collapsed: boolean;
  mobileOpen: boolean;
  toggleCollapsed: () => void;
  setMobileOpen: (open: boolean) => void;
}

export const useSidebarStore = create<SidebarState>((set) => ({
  collapsed: typeof window !== "undefined" ? localStorage.getItem("sidebar_collapsed") === "true" : false,
  mobileOpen: false,

  toggleCollapsed: () =>
    set((s) => {
      const next = !s.collapsed;
      localStorage.setItem("sidebar_collapsed", String(next));
      return { collapsed: next };
    }),

  setMobileOpen: (open) => set({ mobileOpen: open }),
}));
