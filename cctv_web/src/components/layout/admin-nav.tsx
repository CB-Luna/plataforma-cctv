"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Settings2,
  Palette,
  Users,
  Shield,
  HardDrive,
  Brain,
  type LucideIcon,
} from "lucide-react";

interface Tab {
  id: string;
  label: string;
  icon: LucideIcon;
  href: string;
  color: string;
}

const tabs: Tab[] = [
  { id: "general", label: "General", icon: Settings2, href: "/settings", color: "blue" },
  { id: "users", label: "Usuarios", icon: Users, href: "/users", color: "indigo" },
  { id: "roles", label: "Roles", icon: Shield, href: "/roles", color: "purple" },
  { id: "storage", label: "Almacenamiento", icon: HardDrive, href: "/storage", color: "gray" },
  { id: "intelligence", label: "Inteligencia", icon: Brain, href: "/intelligence", color: "teal" },
];

const colorStyles: Record<string, { active: string; iconBg: string }> = {
  blue: { active: "border-blue-600 text-blue-700 dark:text-blue-400", iconBg: "bg-blue-50 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400" },
  indigo: { active: "border-indigo-600 text-indigo-700 dark:text-indigo-400", iconBg: "bg-indigo-50 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-400" },
  purple: { active: "border-purple-600 text-purple-700 dark:text-purple-400", iconBg: "bg-purple-50 text-purple-600 dark:bg-purple-900/40 dark:text-purple-400" },
  gray: { active: "border-gray-600 text-gray-700 dark:text-gray-400", iconBg: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400" },
  teal: { active: "border-teal-600 text-teal-700 dark:text-teal-400", iconBg: "bg-teal-50 text-teal-600 dark:bg-teal-900/40 dark:text-teal-400" },
};

export function AdminNav() {
  const pathname = usePathname();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Administración</h1>
        <p className="text-sm text-muted-foreground">Configuración del sistema, usuarios, roles y servicios</p>
      </div>

      <nav className="flex gap-1 overflow-x-auto border-b pb-px">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href;
          const style = colorStyles[tab.color];
          return (
            <Link
              key={tab.id}
              href={tab.href}
              className={cn(
                "flex items-center gap-2 whitespace-nowrap border-b-[3px] px-4 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? style.active
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              <span className={cn("flex h-7 w-7 items-center justify-center rounded-lg", isActive ? style.iconBg : "")}>
                <tab.icon className="h-4 w-4" />
              </span>
              <span className="hidden sm:inline">{tab.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
