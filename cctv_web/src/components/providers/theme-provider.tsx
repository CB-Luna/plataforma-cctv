"use client";

import { useEffect } from "react";
import { useTenantStore } from "@/stores/tenant-store";
import { useThemeStore } from "@/stores/theme-store";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const currentCompany = useTenantStore((s) => s.currentCompany);
  const theme = useThemeStore((s) => s.theme);

  // Dark mode class
  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else if (theme === "light") {
      root.classList.remove("dark");
    } else {
      // system
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      const apply = () => {
        if (mq.matches) root.classList.add("dark");
        else root.classList.remove("dark");
      };
      apply();
      mq.addEventListener("change", apply);
      return () => mq.removeEventListener("change", apply);
    }
  }, [theme]);

  // Tenant custom colors
  useEffect(() => {
    const root = document.documentElement;
    if (!currentCompany) return;

    const { primary_color, secondary_color, tertiary_color } = currentCompany;

    if (primary_color) {
      root.style.setProperty("--tenant-primary", primary_color);
      // Sincronizar el indicador activo del sidebar con el color de la empresa
      root.style.setProperty("--sidebar-nav-indicator", primary_color);
    }
    if (secondary_color) root.style.setProperty("--tenant-secondary", secondary_color);
    if (tertiary_color) root.style.setProperty("--tenant-tertiary", tertiary_color);

    return () => {
      root.style.removeProperty("--tenant-primary");
      root.style.removeProperty("--tenant-secondary");
      root.style.removeProperty("--tenant-tertiary");
      root.style.removeProperty("--sidebar-nav-indicator");
    };
  }, [currentCompany]);

  return <>{children}</>;
}
