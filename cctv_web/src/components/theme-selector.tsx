"use client";

import { useState } from "react";
import { Check, Palette } from "lucide-react";
import { Label } from "@/components/ui/label";

// ─── Tipos compartidos con general-tab ───────────────────────────────────────

interface ThemeConfig {
  preset: string;
  isDark: boolean;
  primary: string;
  secondary: string;
  accent: string;
  [key: string]: unknown;
}

interface CustomTemplate {
  id: string;
  name: string;
  category: string;
  colors: [string, string, string];
  theme: ThemeConfig;
}

const CUSTOM_TEMPLATES_KEY = "tenant_theme_templates_v2";

// Presets integrados (solo los colores base para selector)
const BUILT_IN_PRESETS: { code: string; name: string; colors: [string, string, string] }[] = [
  { code: "core-associates", name: "Core Associates", colors: ["#2563eb", "#7c3aed", "#f59e0b"] },
  { code: "emerald-pro", name: "Emerald Pro", colors: ["#059669", "#0d9488", "#f59e0b"] },
  { code: "sunset-corp", name: "Sunset Corp", colors: ["#dc2626", "#ea580c", "#facc15"] },
  { code: "ocean-deep", name: "Ocean Deep", colors: ["#0284c7", "#2563eb", "#06b6d4"] },
  { code: "slate-minimal", name: "Slate Minimal", colors: ["#475569", "#64748b", "#94a3b8"] },
  { code: "purple-reign", name: "Purple Reign", colors: ["#7c3aed", "#a855f7", "#ec4899"] },
  { code: "forest-brand", name: "Forest Brand", colors: ["#15803d", "#16a34a", "#84cc16"] },
  { code: "midnight-gold", name: "Midnight Gold", colors: ["#1e293b", "#334155", "#eab308"] },
];

export interface ThemeSelection {
  type: "preset" | "custom";
  code: string;
  name: string;
  colors: [string, string, string];
}

interface ThemeSelectorProps {
  value?: string | null;
  onChange: (selection: ThemeSelection | null) => void;
  label?: string;
}

/**
 * Selector de temas reutilizable.
 * Lee presets integrados + plantillas personalizadas de localStorage.
 */
function loadCustomTemplates(): CustomTemplate[] {
  try {
    const raw = localStorage.getItem(CUSTOM_TEMPLATES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function ThemeSelector({ value, onChange, label = "Tema visual" }: ThemeSelectorProps) {
  const [customTemplates] = useState<CustomTemplate[]>(loadCustomTemplates);

  const allOptions: (ThemeSelection & { id: string })[] = [
    ...BUILT_IN_PRESETS.map((p) => ({
      id: `preset-${p.code}`,
      type: "preset" as const,
      code: p.code,
      name: p.name,
      colors: p.colors,
    })),
    ...customTemplates.map((t) => ({
      id: `custom-${t.id}`,
      type: "custom" as const,
      code: t.id,
      name: t.name,
      colors: t.colors,
    })),
  ];

  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-1.5">
        <Palette className="h-3.5 w-3.5" />
        {label}
      </Label>
      <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto rounded-lg border p-2">
        {/* Opcion: sin tema */}
        <button
          type="button"
          onClick={() => onChange(null)}
          className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-xs transition-colors ${
            !value
              ? "border-blue-300 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/30"
              : "border-transparent hover:bg-muted/50"
          }`}
        >
          <div className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-dashed border-muted-foreground/40">
            {!value && <Check className="h-3 w-3 text-blue-600" />}
          </div>
          <span className="text-muted-foreground">Sin tema</span>
        </button>

        {allOptions.map((opt) => {
          const selected = value === opt.code;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => onChange(opt)}
              className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-xs transition-colors ${
                selected
                  ? "border-blue-300 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/30"
                  : "border-transparent hover:bg-muted/50"
              }`}
            >
              <div className="flex gap-0.5">
                {opt.colors.map((c, i) => (
                  <div
                    key={i}
                    className="h-4 w-4 rounded-full border border-white/20"
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
              <span className="truncate font-medium">{opt.name}</span>
              {selected && <Check className="ml-auto h-3 w-3 shrink-0 text-blue-600" />}
            </button>
          );
        })}
      </div>
      {allOptions.length === 0 && (
        <p className="text-xs text-muted-foreground">No hay temas disponibles. Crea uno en la pestana General.</p>
      )}
    </div>
  );
}

/**
 * Version compacta: muestra los 3 circulos de color + nombre del tema.
 */
export function ThemeBadge({ themeCode }: { themeCode?: string | null }) {
  const [customTemplates] = useState<CustomTemplate[]>(loadCustomTemplates);

  if (!themeCode) return <span className="text-xs text-muted-foreground">—</span>;

  const preset = BUILT_IN_PRESETS.find((p) => p.code === themeCode);
  const custom = customTemplates.find((t) => t.id === themeCode);
  const match = preset || (custom ? { name: custom.name, colors: custom.colors } : null);

  if (!match) return <span className="text-xs text-muted-foreground">—</span>;

  return (
    <div className="flex items-center gap-1.5">
      <div className="flex gap-0.5">
        {match.colors.map((c, i) => (
          <div
            key={i}
            className="h-3 w-3 rounded-full border border-white/20"
            style={{ backgroundColor: c }}
          />
        ))}
      </div>
      <span className="text-xs">{match.name}</span>
    </div>
  );
}
