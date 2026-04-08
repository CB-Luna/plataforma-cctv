import { create } from "zustand";
import type { SiteListItem } from "@/types/api";

const SITE_ID_STORAGE_KEY = "site_id";
const SITE_SNAPSHOT_STORAGE_KEY = "site_snapshot";

function loadStoredSite(): SiteListItem | null {
  if (typeof window === "undefined") return null;

  const snapshot = localStorage.getItem(SITE_SNAPSHOT_STORAGE_KEY);
  if (!snapshot) return null;

  try {
    return JSON.parse(snapshot) as SiteListItem;
  } catch {
    localStorage.removeItem(SITE_ID_STORAGE_KEY);
    localStorage.removeItem(SITE_SNAPSHOT_STORAGE_KEY);
    return null;
  }
}

interface SiteContextState {
  currentSite: SiteListItem | null;
  setSite: (site: SiteListItem) => void;
  clearSite: () => void;
  reconcileSite: (sites: SiteListItem[]) => void;
}

export const useSiteStore = create<SiteContextState>((set) => ({
  currentSite: loadStoredSite(),

  setSite: (site) => {
    localStorage.setItem(SITE_ID_STORAGE_KEY, site.id);
    localStorage.setItem(SITE_SNAPSHOT_STORAGE_KEY, JSON.stringify(site));
    set({ currentSite: site });
  },

  clearSite: () => {
    localStorage.removeItem(SITE_ID_STORAGE_KEY);
    localStorage.removeItem(SITE_SNAPSHOT_STORAGE_KEY);
    set({ currentSite: null });
  },

  reconcileSite: (sites) =>
    set((state) => {
      if (!state.currentSite) return state;

      const refreshedSite = sites.find((site) => site.id === state.currentSite?.id);
      if (!refreshedSite) {
        localStorage.removeItem(SITE_ID_STORAGE_KEY);
        localStorage.removeItem(SITE_SNAPSHOT_STORAGE_KEY);
        return { currentSite: null };
      }

      localStorage.setItem(SITE_ID_STORAGE_KEY, refreshedSite.id);
      localStorage.setItem(SITE_SNAPSHOT_STORAGE_KEY, JSON.stringify(refreshedSite));
      return { currentSite: refreshedSite };
    }),
}));
