import { create } from "zustand";
import type { SiteListItem } from "@/types/api";

interface SiteContextState {
  currentSite: SiteListItem | null;
  setSite: (site: SiteListItem) => void;
  clearSite: () => void;
}

export const useSiteStore = create<SiteContextState>((set) => ({
  currentSite: null,

  setSite: (site) => {
    localStorage.setItem("site_id", site.id);
    set({ currentSite: site });
  },

  clearSite: () => {
    localStorage.removeItem("site_id");
    set({ currentSite: null });
  },
}));
