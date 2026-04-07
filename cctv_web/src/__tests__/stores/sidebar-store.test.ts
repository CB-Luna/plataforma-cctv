import { describe, it, expect, beforeEach } from "vitest";
import { useSidebarStore } from "@/stores/sidebar-store";

describe("sidebar-store", () => {
  beforeEach(() => {
    localStorage.clear();
    useSidebarStore.setState({ collapsed: false, mobileOpen: false });
  });

  it("starts expanded and mobile closed", () => {
    const state = useSidebarStore.getState();
    expect(state.collapsed).toBe(false);
    expect(state.mobileOpen).toBe(false);
  });

  it("toggleCollapsed flips state and persists", () => {
    useSidebarStore.getState().toggleCollapsed();
    expect(useSidebarStore.getState().collapsed).toBe(true);
    expect(localStorage.getItem("sidebar_collapsed")).toBe("true");

    useSidebarStore.getState().toggleCollapsed();
    expect(useSidebarStore.getState().collapsed).toBe(false);
    expect(localStorage.getItem("sidebar_collapsed")).toBe("false");
  });

  it("setMobileOpen controls mobile sidebar", () => {
    useSidebarStore.getState().setMobileOpen(true);
    expect(useSidebarStore.getState().mobileOpen).toBe(true);

    useSidebarStore.getState().setMobileOpen(false);
    expect(useSidebarStore.getState().mobileOpen).toBe(false);
  });
});
