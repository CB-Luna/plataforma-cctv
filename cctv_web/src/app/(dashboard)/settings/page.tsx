"use client";

import { TabLayout, type TabItem } from "@/components/ui/tab-layout";
import { Settings2, Users, Shield, HardDrive, Brain, Building2 } from "lucide-react";
import { GeneralTab } from "./tabs/general-tab";
import { UsersTab } from "./tabs/users-tab";
import { RolesTab } from "./tabs/roles-tab";
import { StorageTab } from "./tabs/storage-tab";
import { IntelligenceTab } from "./tabs/intelligence-tab";
import { TenantsTab } from "./tabs/tenants-tab";

const tabs: TabItem[] = [
  { key: "usuarios", label: "Usuarios", icon: Users, color: "indigo", component: <UsersTab /> },
  { key: "empresas", label: "Empresas", icon: Building2, color: "blue", component: <TenantsTab /> },
  { key: "roles", label: "Roles y Permisos", icon: Shield, color: "purple", component: <RolesTab /> },
  { key: "tema", label: "Tema", icon: Settings2, color: "teal", component: <GeneralTab /> },
  { key: "ia", label: "IA", icon: Brain, color: "amber", component: <IntelligenceTab /> },
  { key: "almacenamiento", label: "Storage", icon: HardDrive, color: "gray", component: <StorageTab /> },
];

export default function SettingsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Configuración</h1>
      <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
        Gestión de usuarios, empresas, roles, permisos, tema e IA
      </p>

      <div className="mt-6">
        <TabLayout tabs={tabs} defaultTab="usuarios" />
      </div>
    </div>
  );
}
