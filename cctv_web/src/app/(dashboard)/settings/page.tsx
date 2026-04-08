"use client";

import { useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Brain, Building2, HardDrive, Settings2, Shield, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { TabLayout, type TabItem } from "@/components/ui/tab-layout";
import { AccessDeniedState } from "@/components/auth/access-denied-state";
import { usePermissions } from "@/hooks/use-permissions";
import { GeneralTab } from "./tabs/general-tab";
import { IntelligenceTab } from "./tabs/intelligence-tab";
import { RolesTab } from "./tabs/roles-tab";
import { StorageTab } from "./tabs/storage-tab";
import { TenantsTab } from "./tabs/tenants-tab";
import { UsersTab } from "./tabs/users-tab";

interface SettingsTabDefinition extends TabItem {
  access: string[];
}

const tabs: SettingsTabDefinition[] = [
  {
    key: "usuarios",
    label: "Usuarios",
    icon: Users,
    color: "indigo",
    component: <UsersTab />,
    access: ["users.read", "users:read:own", "users:read:all"],
  },
  {
    key: "empresas",
    label: "Empresas",
    icon: Building2,
    color: "blue",
    component: <TenantsTab />,
    access: ["tenants.read", "tenants:read:all"],
  },
  {
    key: "roles",
    label: "Roles y permisos",
    icon: Shield,
    color: "purple",
    component: <RolesTab />,
    access: ["roles.read", "roles:read:own", "roles:read:all", "permissions:read:all"],
  },
  {
    key: "tema",
    label: "Tema",
    icon: Settings2,
    color: "teal",
    component: <GeneralTab />,
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
    access: ["ai_models.read", "ai_models:read:own", "ai_models:read:all"],
  },
  {
    key: "almacenamiento",
    label: "Storage",
    icon: HardDrive,
    color: "gray",
    component: <StorageTab />,
    access: ["storage.read", "storage:read:own", "storage:read:all"],
  },
];

export default function SettingsPage() {
  const { canAny } = usePermissions();
  const router = useRouter();
  const searchParams = useSearchParams();

  const visibleTabs = useMemo(() => tabs.filter((tab) => canAny(...tab.access)), [canAny]);
  const requestedTab = searchParams.get("tab");
  const activeTab = visibleTabs.some((tab) => tab.key === requestedTab)
    ? requestedTab ?? visibleTabs[0]?.key
    : visibleTabs[0]?.key;

  useEffect(() => {
    if (visibleTabs.length === 0) return;
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
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Configuracion</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Espacio hibrido de plataforma y tenant activo, con visibilidad ajustada por permisos reales.
          </p>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline">Global / Plataforma</Badge>
          <Badge variant="secondary">Tenant activo</Badge>
        </div>
      </div>

      <div className="mt-6">
        <TabLayout
          tabs={visibleTabs}
          activeTab={activeTab}
          onTabChange={(nextTab) => router.replace(`/settings?tab=${nextTab}`, { scroll: false })}
        />
      </div>
    </div>
  );
}
