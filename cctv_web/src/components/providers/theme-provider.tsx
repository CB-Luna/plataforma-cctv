"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/stores/auth-store";
import { useTenantStore } from "@/stores/tenant-store";
import { useThemeStore } from "@/stores/theme-store";

const THEME_STORAGE_KEY = "tenant_full_theme_v2";
const USER_THEMES_KEY = "user_theme_assignments_v1";

// Presets integrados (sincronizados con theme-selector.tsx)
const BUILT_IN_PRESETS: Record<string, [string, string, string]> = {
  "core-associates": ["#2563eb", "#7c3aed", "#f59e0b"],
  "emerald-pro": ["#059669", "#0d9488", "#f59e0b"],
  "sunset-corp": ["#dc2626", "#ea580c", "#facc15"],
  "ocean-deep": ["#0284c7", "#2563eb", "#06b6d4"],
  "slate-minimal": ["#475569", "#64748b", "#94a3b8"],
  "purple-reign": ["#7c3aed", "#a855f7", "#ec4899"],
  "forest-brand": ["#15803d", "#16a34a", "#84cc16"],
  "midnight-gold": ["#1e293b", "#334155", "#eab308"],
};

// Mapeo de campos de ThemeConfig a variables CSS
const THEME_VAR_MAP: Record<string, string> = {
  primary: "--tenant-primary",
  secondary: "--tenant-secondary",
  accent: "--tenant-tertiary",
  success: "--tenant-success",
  warning: "--tenant-warning",
  error: "--tenant-error",
  info: "--tenant-info",
  bgSurface: "--bg-surface",
  bgPage: "--bg-page",
  textPrimary: "--tenant-text-primary",
  textSecondary: "--tenant-text-secondary",
  borderColor: "--tenant-border-color",
  tableHeaderBg: "--table-header-bg",
  tableStripeBg: "--table-stripe-bg",
  tableHoverBg: "--table-hover-bg",
};

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const currentCompany = useTenantStore((s) => s.currentCompany);
  const currentUser = useAuthStore((s) => s.user);
  const theme = useThemeStore((s) => s.theme);
  // Contador para forzar re-lectura del localStorage al guardar desde el configurador
  const [themeVersion, setThemeVersion] = useState(0);

  // Escuchar evento personalizado del configurador de temas
  useEffect(() => {
    const handler = () => setThemeVersion((v) => v + 1);
    window.addEventListener("theme-config-changed", handler);
    return () => window.removeEventListener("theme-config-changed", handler);
  }, []);

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

  // Inyeccion de variables CSS del tenant (user theme > localStorage completo > backend parcial)
  useEffect(() => {
    const root = document.documentElement;
    const appliedVars: string[] = [];

    // 1) Intentar tema asignado al usuario actual
    let userPresetColors: [string, string, string] | null = null;
    if (currentUser?.id) {
      try {
        const raw = localStorage.getItem(USER_THEMES_KEY);
        if (raw) {
          const assignments = JSON.parse(raw) as Record<string, string>;
          const themeCode = assignments[currentUser.id];
          if (themeCode && BUILT_IN_PRESETS[themeCode]) {
            userPresetColors = BUILT_IN_PRESETS[themeCode];
          }
        }
      } catch {
        // JSON invalido, ignorar
      }
    }

    if (userPresetColors) {
      // Aplicar los 3 colores del preset del usuario
      root.style.setProperty("--tenant-primary", userPresetColors[0]);
      root.style.setProperty("--tenant-secondary", userPresetColors[1]);
      root.style.setProperty("--tenant-tertiary", userPresetColors[2]);
      root.style.setProperty("--sidebar-nav-indicator", userPresetColors[0]);
      appliedVars.push("--tenant-primary", "--tenant-secondary", "--tenant-tertiary", "--sidebar-nav-indicator");
    } else {
      // 2) Intentar leer tema completo del configurador local
      let fullTheme: Record<string, string> | null = null;
      const stored = localStorage.getItem(THEME_STORAGE_KEY);
      if (stored) {
        try {
          fullTheme = JSON.parse(stored);
        } catch {
          // JSON invalido, ignorar
        }
      }

      if (fullTheme) {
        // Aplicar las 15 variables del tema completo
        for (const [key, cssVar] of Object.entries(THEME_VAR_MAP)) {
          const val = fullTheme[key];
          if (val && typeof val === "string") {
            root.style.setProperty(cssVar, val);
            appliedVars.push(cssVar);
          }
        }
        // Sincronizar indicador del sidebar con color primario
        if (fullTheme.primary) {
          root.style.setProperty("--sidebar-nav-indicator", fullTheme.primary);
          appliedVars.push("--sidebar-nav-indicator");
        }
      } else if (currentCompany) {
        // 3) Fallback: solo los 3 colores del backend
        const { primary_color, secondary_color, tertiary_color } = currentCompany;
        if (primary_color) {
          root.style.setProperty("--tenant-primary", primary_color);
          root.style.setProperty("--sidebar-nav-indicator", primary_color);
          appliedVars.push("--tenant-primary", "--sidebar-nav-indicator");
        }
        if (secondary_color) {
          root.style.setProperty("--tenant-secondary", secondary_color);
          appliedVars.push("--tenant-secondary");
        }
        if (tertiary_color) {
          root.style.setProperty("--tenant-tertiary", tertiary_color);
          appliedVars.push("--tenant-tertiary");
        }
      }
    }

    return () => {
      for (const v of appliedVars) {
        root.style.removeProperty(v);
      }
    };
  }, [currentCompany, currentUser, themeVersion]);

  return <>{children}</>;
}
