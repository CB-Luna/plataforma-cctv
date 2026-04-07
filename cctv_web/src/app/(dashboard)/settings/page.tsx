"use client";

import { useMemo } from "react";
import { Settings2, Users, Shield, HardDrive, Brain, Building2 } from "lucide-react";
import { TabLayout, type TabItem } from "@/components/ui/tab-layout";
import { Badge } from "@/components/ui/badge";
import { AccessDeniedState } from "@/components/auth/access-denied-state";
import { usePermissions } from "@/hooks/use-permissions";
import { GeneralTab } from "./tabs/general-tab";
import { UsersTab } from "./tabs/users-tab";
import { RolesTab } from "./tabs/roles-tab";
import { StorageTab } from "./tabs/storage-tab";
import { IntelligenceTab } from "./tabs/intelligence-tab";
import { TenantsTab } from "./tabs/tenants-tab";

interface SettingsTabDefinition extends TabItem {
  access: string[];
}

const tabs: SettingsTabDefinition[] = [
  { key: "usuarios", label: "Usuarios", icon: Users, color: "indigo", component: <UsersTab />, access: ["users.read", "users:read:own", "users:read:all"] },
  { key: "empresas", label: "Empresas", icon: Building2, color: "blue", component: <TenantsTab />, access: ["tenants.read", "tenants:read:all"] },
  { key: "roles", label: "Roles y Permisos", icon: Shield, color: "purple", component: <RolesTab />, access: ["roles.read", "roles:read:own", "roles:read:all", "permissions:read:all"] },
  { key: "tema", label: "Tema", icon: Settings2, color: "teal", component: <GeneralTab />, access: ["settings.read", "configuration.read", "configuration:read:own", "configuration:read:all", "themes:read:own", "themes:read:all"] },
  { key: "ia", label: "IA", icon: Brain, color: "amber", component: <IntelligenceTab />, access: ["ai_models.read", "ai_models:read:own", "ai_models:read:all"] },
  { key: "almacenamiento", label: "Storage", icon: HardDrive, color: "gray", component: <StorageTab />, access: ["storage.read", "storage:read:own", "storage:read:all"] },
];

export default function SettingsPage() {
  const { canAny } = usePermissions();

  const visibleTabs = useMemo(
    () => tabs.filter((tab) => canAny(...tab.access)),
    [canAny],
  );

  if (visibleTabs.length === 0) {
    return (
      <AccessDeniedState
        title="Sin acceso a configuración"
        description="Tu perfil no tiene permisos para visualizar apartados de configuración en este contexto."
      />
    );
  }

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">ConfiguraciÃ³n</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Espacio hÃ­brido de plataforma y tenant activo, con visibilidad ajustada por permisos reales.
          </p>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline">Global / Plataforma</Badge>
          <Badge variant="secondary">Tenant Activo</Badge>
        </div>
      </div>

      <div className="mt-6">
        <TabLayout tabs={visibleTabs} defaultTab={visibleTabs[0]?.key} />
      </div>
    </div>
  );
}
