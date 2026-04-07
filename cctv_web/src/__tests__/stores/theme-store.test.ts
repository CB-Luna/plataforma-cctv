import { describe, it, expect, beforeEach } from "vitest";
import { useThemeStore } from "@/stores/theme-store";

describe("theme-store", () => {
  beforeEach(() => {
    localStorage.clear();
    useThemeStore.setState({ theme: "light" });
  });

  it("starts with light theme", () => {
    expect(useThemeStore.getState().theme).toBe("light");
  });

  it("setTheme changes theme and persists", () => {
    useThemeStore.getState().setTheme("dark");
    expect(useThemeStore.getState().theme).toBe("dark");
    expect(localStorage.getItem("theme")).toBe("dark");
  });

  it("setTheme supports system preference", () => {
    useThemeStore.getState().setTheme("system");
    expect(useThemeStore.getState().theme).toBe("system");
    expect(localStorage.getItem("theme")).toBe("system");
  });

  it("can cycle through all themes", () => {
    const store = useThemeStore.getState();
    store.setTheme("light");
    expect(useThemeStore.getState().theme).toBe("light");

    store.setTheme("dark");
    expect(useThemeStore.getState().theme).toBe("dark");

    store.setTheme("system");
    expect(useThemeStore.getState().theme).toBe("system");

    store.setTheme("light");
    expect(useThemeStore.getState().theme).toBe("light");
  });
});
