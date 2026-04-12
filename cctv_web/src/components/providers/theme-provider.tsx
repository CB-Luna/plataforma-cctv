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

/**
 * Convierte hex (#RRGGBB) a una cadena oklch() aproximada.
 * Se usa para inyectar colores del tenant en las variables oklch de shadcn.
 */
function hexToOklch(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  // sRGB -> linear
  const toLinear = (c: number) => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  const rl = toLinear(r), gl = toLinear(g), bl = toLinear(b);

  // linear sRGB -> OKLab (via LMS)
  const l_ = 0.4122214708 * rl + 0.5363325363 * gl + 0.0514459929 * bl;
  const m_ = 0.2119034982 * rl + 0.6806995451 * gl + 0.1073969566 * bl;
  const s_ = 0.0883024619 * rl + 0.2817188376 * gl + 0.6299787005 * bl;

  const l3 = Math.cbrt(l_), m3 = Math.cbrt(m_), s3 = Math.cbrt(s_);

  const L = 0.2104542553 * l3 + 0.7936177850 * m3 - 0.0040720468 * s3;
  const a = 1.9779984951 * l3 - 2.4285922050 * m3 + 0.4505937099 * s3;
  const bk = 0.0259040371 * l3 + 0.7827717662 * m3 - 0.8086757660 * s3;

  const C = Math.sqrt(a * a + bk * bk);
  let H = Math.atan2(bk, a) * (180 / Math.PI);
  if (H < 0) H += 360;

  return `oklch(${L.toFixed(3)} ${C.toFixed(3)} ${H.toFixed(1)})`;
}

/** Genera un foreground contrastante (blanco u oscuro) para un color hex */
function contrastForeground(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  // Luminancia relativa simplificada
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum > 0.5 ? "oklch(0.205 0 0)" : "oklch(0.985 0 0)";
}

/** Convierte hex a HSL [h 0-360, s 0-1, l 0-1] */
function hexToHsl(hex: string): [number, number, number] {
  const rr = parseInt(hex.slice(1, 3), 16) / 255;
  const gg = parseInt(hex.slice(3, 5), 16) / 255;
  const bb = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(rr, gg, bb), min = Math.min(rr, gg, bb);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === rr) h = ((gg - bb) / d + (gg < bb ? 6 : 0)) / 6;
  else if (max === gg) h = ((bb - rr) / d + 2) / 6;
  else h = ((rr - gg) / d + 4) / 6;
  return [h * 360, s, l];
}

function hslToHex(h: number, s: number, l: number): string {
  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1; if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  h /= 360;
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const r = Math.round(hue2rgb(p, q, h + 1 / 3) * 255);
  const g = Math.round(hue2rgb(p, q, h) * 255);
  const b = Math.round(hue2rgb(p, q, h - 1 / 3) * 255);
  return "#" + [r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("");
}

/** Deriva un color sidebar oscuro a partir del primario (misma logica que la vista previa) */
function deriveSidebarBg(primary: string): string {
  const [h, s] = hexToHsl(primary);
  return hslToHex(h, Math.min(s, 0.7), 0.12);
}

/** Mezcla un color hex con blanco. factor=1 → blanco puro, factor=0 → color original. */
function tintColor(hex: string, factor: number): string {
  const h = hex.replace("#", "");
  const r = Math.round(parseInt(h.slice(0, 2), 16) + (255 - parseInt(h.slice(0, 2), 16)) * factor);
  const g = Math.round(parseInt(h.slice(2, 4), 16) + (255 - parseInt(h.slice(2, 4), 16)) * factor);
  const b = Math.round(parseInt(h.slice(4, 6), 16) + (255 - parseInt(h.slice(4, 6), 16)) * factor);
  return "#" + [r, g, b].map((x) => Math.min(255, x).toString(16).padStart(2, "0")).join("");
}

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

    /** Devuelve true si el color hex es claro (luminancia relativa > 0.5) */
    function isLightColor(hex: string): boolean {
      const h = hex.replace("#", "");
      const r = parseInt(h.slice(0, 2), 16);
      const g = parseInt(h.slice(2, 4), 16);
      const b = parseInt(h.slice(4, 6), 16);
      return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.5;
    }

    /** Inyecta los 3 colores principales tanto en vars tenant como en vars shadcn */
    function applyCoreColors(primary: string, secondary: string, tertiary: string) {
      // Variables tenant propias
      root.style.setProperty("--tenant-primary", primary);
      root.style.setProperty("--tenant-secondary", secondary);
      root.style.setProperty("--tenant-tertiary", tertiary);
      root.style.setProperty("--sidebar-nav-indicator", tertiary);
      appliedVars.push("--tenant-primary", "--tenant-secondary", "--tenant-tertiary", "--sidebar-nav-indicator");

      // Sidebar nav — fondo usa version oscura del primario (igual que la vista previa)
      const sidebarBg = deriveSidebarBg(primary);
      const light = isLightColor(sidebarBg);
      root.style.setProperty("--sidebar-nav-bg", sidebarBg);
      root.style.setProperty("--sidebar-nav-text", light ? "rgba(0,0,0,0.7)" : "rgba(255,255,255,0.85)");
      root.style.setProperty("--sidebar-nav-text-active", light ? "#000000" : "#ffffff");
      root.style.setProperty("--sidebar-nav-active-bg", light ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.12)");
      appliedVars.push("--sidebar-nav-bg", "--sidebar-nav-text", "--sidebar-nav-text-active", "--sidebar-nav-active-bg");

      // Variables oklch de shadcn — para que botones, badges, etc usen colores del tenant
      const primaryOklch = hexToOklch(primary);
      const secondaryOklch = hexToOklch(secondary);
      const accentOklch = hexToOklch(tertiary);
      const primaryFg = contrastForeground(primary);
      const secondaryFg = contrastForeground(secondary);
      const accentFg = contrastForeground(tertiary);

      root.style.setProperty("--primary", primaryOklch);
      root.style.setProperty("--primary-foreground", primaryFg);
      root.style.setProperty("--accent", accentOklch);
      root.style.setProperty("--accent-foreground", accentFg);
      root.style.setProperty("--ring", primaryOklch);
      // Sidebar primary = tema primario
      root.style.setProperty("--sidebar-primary", primaryOklch);
      root.style.setProperty("--sidebar-primary-foreground", primaryFg);
      root.style.setProperty("--sidebar-accent", accentOklch);
      root.style.setProperty("--sidebar-accent-foreground", accentFg);
      // Charts usan primario / secundario / terciario
      root.style.setProperty("--chart-1", primaryOklch);
      root.style.setProperty("--chart-2", secondaryOklch);
      root.style.setProperty("--chart-3", accentOklch);

      // Colores de tabla derivados del primario (tintes suaves)
      root.style.setProperty("--table-header-bg", tintColor(primary, 0.92));
      root.style.setProperty("--table-stripe-bg", tintColor(primary, 0.96));
      root.style.setProperty("--table-hover-bg", tintColor(primary, 0.90));

      appliedVars.push(
        "--primary", "--primary-foreground", "--accent", "--accent-foreground", "--ring",
        "--sidebar-primary", "--sidebar-primary-foreground",
        "--sidebar-accent", "--sidebar-accent-foreground",
        "--chart-1", "--chart-2", "--chart-3",
        "--table-header-bg", "--table-stripe-bg", "--table-hover-bg",
      );
    }

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

    // Prioridad: 1) Colores de empresa (branding), 2) Tema completo del configurador, 3) Preset de usuario
    if (currentCompany) {
      // 1) Colores de branding de la empresa (fuente: /settings?tab=empresas)
      const { primary_color, secondary_color, tertiary_color } = currentCompany;
      if (primary_color && secondary_color && tertiary_color) {
        applyCoreColors(primary_color, secondary_color, tertiary_color);
      } else {
        // Aplicacion parcial si no estan los 3
        if (primary_color) {
          root.style.setProperty("--tenant-primary", primary_color);
          root.style.setProperty("--sidebar-nav-indicator", primary_color);
          root.style.setProperty("--primary", hexToOklch(primary_color));
          root.style.setProperty("--primary-foreground", contrastForeground(primary_color));
          root.style.setProperty("--ring", hexToOklch(primary_color));
          appliedVars.push("--tenant-primary", "--sidebar-nav-indicator", "--primary", "--primary-foreground", "--ring");
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
    } else {
      // Sin empresa activa: intentar tema completo del configurador local
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
        // Tambien mapear a shadcn si hay colores core disponibles
        const p = fullTheme.primary, s = fullTheme.secondary, a = fullTheme.accent;
        if (p && s && a) {
          applyCoreColors(p, s, a);
        }
      } else if (userPresetColors) {
        // Fallback: preset de usuario (fuente: /settings?tab=usuarios)
        applyCoreColors(userPresetColors[0], userPresetColors[1], userPresetColors[2]);
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
