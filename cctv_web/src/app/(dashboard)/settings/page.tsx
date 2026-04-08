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
import { TabLayout, type TabItem } from "@/components/ui/tab-layout";
import { usePermissions } from "@/hooks/use-permissions";
import { getWorkspaceExperience } from "@/lib/auth/workspace-experience";
import { useTenantStore } from "@/stores/tenant-store";
import { isSettingsTabEnabledForServices, parseTenantProductProfile } from "@/lib/product/service-catalog";
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
    summary: "Catalogo vigente de planes, servicios habilitados y criterio real de visibilidad por tenant.",
    access: ["tenants.read", "tenants:read:all"],
  },
  {
    key: "menu",
    label: "Plantillas de menu",
    icon: LayoutTemplate,
    color: "pink",
    component: <MenuTemplatesTab />,
    scope: "platform",
    summary: "Backoffice real de templates, asignacion por tenant y composicion base.",
    access: ["menu:read:all", "menu.read"],
  },
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
    label: "Roles y permisos",
    icon: Shield,
    color: "purple",
    component: <RolesTab />,
    scope: "tenant",
    summary: "Roles internos del tenant activo; la gestion global explicita sigue siendo GAP.",
    access: ["roles.read", "roles:read:own", "roles:read:all", "permissions:read:all"],
  },
  {
    key: "tema",
    label: "Tema",
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
    key: "ia",
    label: "IA",
    icon: Brain,
    color: "amber",
    component: <IntelligenceTab />,
    scope: "tenant",
    summary: "Modelos, prompts y consumo de inteligencia para el tenant activo.",
    access: ["ai_models.read", "ai_models:read:own", "ai_models:read:all"],
  },
  {
    key: "almacenamiento",
    label: "Storage",
    icon: HardDrive,
    color: "gray",
    component: <StorageTab />,
    scope: "tenant",
    summary: "Configuraciones de almacenamiento y archivos del tenant activo.",
    access: ["storage.read", "storage:read:own", "storage:read:all"],
  },
];

const scopeMeta: Record<
  SettingsScope,
  {
    badge: string;
    title: string;
    description: string;
    cardClass: string;
    badgeClass: string;
  }
> = {
  platform: {
    badge: "Plataforma",
    title: "Backoffice global",
    description: "Administra empresas operadoras, branding corporativo y plantillas de menu compartidas.",
    cardClass: "border-blue-200 bg-blue-50/80 dark:border-blue-900/70 dark:bg-blue-950/20",
    badgeClass: "bg-blue-600 text-white hover:bg-blue-600",
  },
  tenant: {
    badge: "Tenant activo",
    title: "Portal de empresa",
    description: "Opera usuarios, roles internos, tema, IA y storage del tenant seleccionado.",
    cardClass: "border-emerald-200 bg-emerald-50/80 dark:border-emerald-900/70 dark:bg-emerald-950/20",
    badgeClass: "bg-emerald-600 text-white hover:bg-emerald-600",
  },
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
  const tenantProductProfile = useMemo(() => parseTenantProductProfile(currentCompany), [currentCompany]);
  const experience = useMemo(
    () =>
      getWorkspaceExperience({
        permissions,
        roles,
        company: currentCompany,
      }),
    [currentCompany, permissions, roles],
  );
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
  const activeScope = activeTabItem?.scope ?? "tenant";
  const scopeTabs = visibleTabs.filter((tab) => tab.scope === activeScope);
  const platformTabs = visibleTabs.filter((tab) => tab.scope === "platform");
  const tenantTabs = visibleTabs.filter((tab) => tab.scope === "tenant");
  const activeScopeMeta = scopeMeta[activeScope];
  const hasScopeSwitch = platformTabs.length > 0 && tenantTabs.length > 0;

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
      <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">Fase 6</Badge>
            <Badge className={activeScopeMeta.badgeClass}>{activeScopeMeta.badge}</Badge>
            {currentCompany ? <Badge variant="secondary">{currentCompany.name}</Badge> : null}
            <Badge variant="outline">Plan: {tenantProductProfile.packageProfile}</Badge>
            <Badge variant="outline">Rol: {experience.roleLabel}</Badge>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {experience.mode === "tenant_portal" ? experience.shellTitle : "Backoffice enterprise y producto"}
            </h1>
            <p className="mt-1 max-w-3xl text-sm text-slate-600 dark:text-slate-300">
              {experience.mode === "tenant_portal"
                ? "Este espacio ya prioriza usuarios, roles internos, branding y capacidades operativas de la empresa activa."
                : "`/settings` separa plataforma global del portal tenant y ahora tambien expone el catalogo vigente de servicios y paquetes que gobierna visibilidad real."}
            </p>
          </div>
        </div>

        {hasScopeSwitch ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:min-w-[540px]">
          <ScopeCard
            scope="platform"
            activeScope={activeScope}
            title={scopeMeta.platform.title}
            description={scopeMeta.platform.description}
            tabCount={platformTabs.length}
            tenantName={currentCompany?.name}
            onClick={() => goToScopeTab(platformTabs[0], router)}
          />
          <ScopeCard
            scope="tenant"
            activeScope={activeScope}
            title={scopeMeta.tenant.title}
            description={scopeMeta.tenant.description}
            tabCount={tenantTabs.length}
            tenantName={currentCompany?.name}
            onClick={() => goToScopeTab(tenantTabs[0], router)}
          />
        </div>
        ) : (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 text-sm text-slate-700 dark:border-emerald-900/60 dark:bg-emerald-950/20 dark:text-slate-200 xl:min-w-[420px]">
            <p className="font-semibold">Portal tenant activo</p>
            <p className="mt-1">
              La configuracion visible ya esta filtrada al ownership de empresa. No se muestran controles globales de plataforma en este contexto.
            </p>
          </div>
        )}
      </div>

      <div className={cn("rounded-2xl border p-4", activeScopeMeta.cardClass)}>
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
              Contexto visible
            </p>
            <h2 className="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-100">
              {activeScopeMeta.title}
            </h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              {activeTabItem?.summary}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge className={activeScopeMeta.badgeClass}>{activeScopeMeta.badge}</Badge>
            <Badge variant="outline">{scopeTabs.length} tabs visibles</Badge>
            {activeScope === "tenant" && currentCompany ? (
              <Badge variant="secondary">Tenant: {currentCompany.slug}</Badge>
            ) : null}
            {currentCompany ? (
              <Badge variant="outline">{tenantProductProfile.enabledServices.length} servicios visibles</Badge>
            ) : null}
          </div>
        </div>
      </div>

      <TabLayout
        tabs={scopeTabs}
        activeTab={activeTab}
        onTabChange={(nextTab) => router.replace(`/settings?tab=${nextTab}`, { scroll: false })}
      />
    </div>
  );
}

function goToScopeTab(tab: SettingsTabDefinition | undefined, router: ReturnType<typeof useRouter>) {
  if (!tab) return;
  router.replace(`/settings?tab=${tab.key}`, { scroll: false });
}

function ScopeCard({
  scope,
  activeScope,
  title,
  description,
  tabCount,
  tenantName,
  onClick,
}: {
  scope: SettingsScope;
  activeScope: SettingsScope;
  title: string;
  description: string;
  tabCount: number;
  tenantName?: string;
  onClick: () => void;
}) {
  const meta = scopeMeta[scope];
  const isActive = scope === activeScope;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={tabCount === 0}
      className={cn(
        "rounded-2xl border p-4 text-left transition-all",
        meta.cardClass,
        isActive ? "ring-2 ring-offset-2 dark:ring-offset-slate-950" : "opacity-90 hover:opacity-100",
        scope === "platform" ? "ring-blue-500" : "ring-emerald-500",
        tabCount === 0 ? "cursor-not-allowed opacity-50" : "",
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <Badge className={meta.badgeClass}>{meta.badge}</Badge>
        <Badge variant="outline">{tabCount} tabs</Badge>
      </div>
      <h3 className="mt-3 text-base font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{description}</p>
      {scope === "tenant" && tenantName ? (
        <p className="mt-3 text-xs font-medium uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
          Contexto actual: {tenantName}
        </p>
      ) : null}
    </button>
  );
}
