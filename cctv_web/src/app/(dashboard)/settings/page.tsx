"use client";

import { useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Brain,
  Building2,
  HardDrive,
  LayoutTemplate,
  Package2,
  Settings2,
  Shield,
  Users,
} from "lucide-react";
import { AccessDeniedState } from "@/components/auth/access-denied-state";
import { Badge } from "@/components/ui/badge";
import type { TabItem } from "@/components/ui/tab-layout";
import { usePermissions } from "@/hooks/use-permissions";
import { getWorkspaceExperience } from "@/lib/auth/workspace-experience";
import { useTenantStore } from "@/stores/tenant-store";
import {
  isSettingsTabEnabledForServices,
  parseTenantProductProfile,
} from "@/lib/product/service-catalog";
import { cn } from "@/lib/utils";
import { GeneralTab } from "./tabs/general-tab";
import { IntelligenceTab } from "./tabs/intelligence-tab";
import { MenuTemplatesTab } from "./tabs/menu-templates-tab";
import { RolesTab } from "./tabs/roles-tab";
import { ServicesPackagesTab } from "./tabs/services-packages-tab";
import { StorageTab } from "./tabs/storage-tab";
import { TenantsTab } from "./tabs/tenants-tab";
import { UsersTab } from "./tabs/users-tab";

type SettingsScope = "platform" | "tenant";

interface SettingsTabDefinition extends TabItem {
  access: string[];
  scope: SettingsScope;
  summary: string;
}

const tabs: SettingsTabDefinition[] = [
  {
    key: "usuarios",
    label: "Usuarios",
    icon: Users,
    color: "indigo",
    component: <UsersTab />,
    scope: "tenant",
    summary: "Usuarios operativos y roles internos del tenant activo.",
    access: ["users.read", "users:read:own", "users:read:all"],
  },
  {
    key: "roles",
    label: "Roles y Permisos",
    icon: Shield,
    color: "purple",
    component: <RolesTab />,
    scope: "tenant",
    summary: "Roles internos del tenant activo.",
    access: ["roles.read", "roles:read:own", "roles:read:all", "permissions:read:all"],
  },
  {
    key: "tema",
    label: "Temas",
    icon: Settings2,
    color: "teal",
    component: <GeneralTab />,
    scope: "tenant",
    summary: "Identidad visual y datos base del tenant activo.",
    access: [
      "settings.read",
      "configuration.read",
      "configuration:read:own",
      "configuration:read:all",
      "themes:read:own",
      "themes:read:all",
    ],
  },
  {
    key: "empresas",
    label: "Empresas",
    icon: Building2,
    color: "blue",
    component: <TenantsTab />,
    scope: "platform",
    summary: "Gestion global de tenants, branding corporativo y estado operativo.",
    access: ["tenants.read", "tenants:read:all"],
  },
  {
    key: "servicios",
    label: "Servicios y paquetes",
    icon: Package2,
    color: "amber",
    component: <ServicesPackagesTab />,
    scope: "platform",
    summary: "Catalogo vigente de planes y servicios habilitados por empresa.",
    access: ["tenants.read", "tenants:read:all"],
  },
  {
    key: "menu",
    label: "Plantillas de menu",
    icon: LayoutTemplate,
    color: "pink",
    component: <MenuTemplatesTab />,
    scope: "platform",
    summary: "Templates de navegacion y asignacion por tenant.",
    access: ["menu:read:all", "menu.read"],
  },
  {
    key: "ia",
    label: "IA del sistema",
    icon: Brain,
    color: "amber",
    component: <IntelligenceTab />,
    scope: "tenant",
    summary: "Modelos, prompts y consumo de inteligencia.",
    access: ["ai_models.read", "ai_models:read:own", "ai_models:read:all"],
  },
  {
    key: "almacenamiento",
    label: "Storage",
    icon: HardDrive,
    color: "gray",
    component: <StorageTab />,
    scope: "tenant",
    summary: "Configuraciones de almacenamiento y archivos.",
    access: ["storage.read", "storage:read:own", "storage:read:all"],
  },
];

// ── Colores para los tabs ──────────────────────────────────────────────
const tabColorMap: Record<string, { activeBg: string; activeText: string; activeBorder: string; iconBg: string }> = {
  blue:   { activeBg: "bg-blue-50 dark:bg-blue-950/30",     activeText: "text-blue-600 dark:text-blue-400",     activeBorder: "border-blue-500",   iconBg: "bg-blue-100 dark:bg-blue-900/40" },
  purple: { activeBg: "bg-purple-50 dark:bg-purple-950/30", activeText: "text-purple-600 dark:text-purple-400", activeBorder: "border-purple-500", iconBg: "bg-purple-100 dark:bg-purple-900/40" },
  amber:  { activeBg: "bg-amber-50 dark:bg-amber-950/30",   activeText: "text-amber-600 dark:text-amber-400",   activeBorder: "border-amber-500",  iconBg: "bg-amber-100 dark:bg-amber-900/40" },
  teal:   { activeBg: "bg-teal-50 dark:bg-teal-950/30",     activeText: "text-teal-600 dark:text-teal-400",     activeBorder: "border-teal-500",   iconBg: "bg-teal-100 dark:bg-teal-900/40" },
  pink:   { activeBg: "bg-pink-50 dark:bg-pink-950/30",     activeText: "text-pink-600 dark:text-pink-400",     activeBorder: "border-pink-500",   iconBg: "bg-pink-100 dark:bg-pink-900/40" },
  gray:   { activeBg: "bg-gray-50 dark:bg-gray-800",        activeText: "text-gray-600 dark:text-gray-400",     activeBorder: "border-gray-500",   iconBg: "bg-gray-200 dark:bg-gray-700" },
  indigo: { activeBg: "bg-indigo-50 dark:bg-indigo-950/30", activeText: "text-indigo-600 dark:text-indigo-400", activeBorder: "border-indigo-500", iconBg: "bg-indigo-100 dark:bg-indigo-900/40" },
};

export default function SettingsPage() {
  const { canAny, permissions, roles } = usePermissions();
  const currentCompany = useTenantStore((state) => state.currentCompany);
  const router = useRouter();
  const searchParams = useSearchParams();

  const enabledServices = useMemo(
    () => parseTenantProductProfile(currentCompany).enabledServices,
    [currentCompany],
  );
  const experience = useMemo(
    () =>
      getWorkspaceExperience({
        permissions,
        roles,
        company: currentCompany,
      }),
    [currentCompany, permissions, roles],
  );

  // Todas las tabs visibles segun permisos y servicios, sin filtrado por scope
  const visibleTabs = useMemo(
    () =>
      tabs.filter(
        (tab) => canAny(...tab.access) && isSettingsTabEnabledForServices(tab.key, enabledServices),
      ),
    [canAny, enabledServices],
  );

  const requestedTab = searchParams.get("tab");
  const activeTabItem = visibleTabs.find((tab) => tab.key === requestedTab) ?? visibleTabs[0];
  const activeTab = activeTabItem?.key;

  useEffect(() => {
    if (!visibleTabs.length || !activeTab) return;
    if (requestedTab === activeTab) return;
    router.replace(`/settings?tab=${activeTab}`, { scroll: false });
  }, [activeTab, requestedTab, router, visibleTabs.length]);

  if (visibleTabs.length === 0) {
    return (
      <AccessDeniedState
        title="Sin acceso a configuracion"
        description="Tu perfil no tiene permisos para visualizar apartados de configuracion en este contexto."
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Header compacto ─────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
          Configuracion
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Gestion de usuarios, roles, permisos y sistema
        </p>
      </div>

      {/* ── Barra de tabs unificada ─────────────────────────────────── */}
      <div>
        {/* Movil: select */}
        <div className="md:hidden">
          <div className="relative">
            {activeTabItem && (
              <div className="pointer-events-none absolute left-3 top-1/2 flex -translate-y-1/2 items-center">
                <activeTabItem.icon className="h-4 w-4 text-gray-500" />
              </div>
            )}
            <select
              value={activeTab ?? ""}
              onChange={(e) => router.replace(`/settings?tab=${e.target.value}`, { scroll: false })}
              className="w-full appearance-none rounded-xl border border-gray-200 bg-white py-3 pl-10 pr-4 text-sm font-medium text-gray-700 shadow-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
            >
              {visibleTabs.map((tab) => (
                <option key={tab.key} value={tab.key}>{tab.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Desktop: tabs inline */}
        <div className="hidden md:block">
          <div className="rounded-xl border border-gray-200 bg-white/80 p-1.5 shadow-sm backdrop-blur dark:border-gray-700 dark:bg-gray-800/80">
            <div className="flex flex-wrap gap-1">
              {visibleTabs.map((tab) => {
                const isActive = tab.key === activeTab;
                const colors = tabColorMap[tab.color] ?? tabColorMap.blue;
                const Icon = tab.icon;

                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => router.replace(`/settings?tab=${tab.key}`, { scroll: false })}
                    className={cn(
                      "flex items-center gap-2 rounded-lg border-b-[3px] px-4 py-2.5 text-sm font-medium transition-all",
                      isActive
                        ? `${colors.activeBg} ${colors.activeBorder} ${colors.activeText}`
                        : "border-transparent text-gray-500 hover:bg-gray-50 hover:text-gray-700 dark:hover:bg-gray-700/50 dark:hover:text-gray-300",
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-lg",
                        isActive
                          ? `${colors.iconBg} ${colors.activeText}`
                          : "bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500",
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ── Contenido del tab activo ────────────────────────────────── */}
      <div>{activeTabItem?.component}</div>
    </div>
  );
}
