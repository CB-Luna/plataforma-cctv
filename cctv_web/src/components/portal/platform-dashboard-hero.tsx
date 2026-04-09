"use client";

import Link from "next/link";
import { ArrowRight, Building2, Package2, LayoutTemplate, Activity } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { StatsCard } from "@/components/ui/stats-card";
import type { TenantStats } from "@/types/api";

export interface PlatformQuickAction {
  href: string;
  label: string;
  description: string;
}

const DEFAULT_ACTIONS: PlatformQuickAction[] = [
  {
    href: "/settings?tab=empresas",
    label: "Empresas",
    description: "Gestiona tenants, branding corporativo y estado de onboarding.",
  },
  {
    href: "/settings?tab=servicios",
    label: "Servicios y paquetes",
    description: "Catalogo vigente de planes y servicios habilitados por empresa.",
  },
  {
    href: "/settings?tab=menu",
    label: "Plantillas de menu",
    description: "Templates de navegacion y asignacion por tenant.",
  },
];

export function PlatformDashboardHero({
  tenantStats,
  roleLabel,
}: {
  tenantStats?: TenantStats;
  roleLabel: string;
}) {
  return (
    <div className="space-y-6">
      {/* Encabezado de plataforma */}
      <Card className="overflow-hidden border-blue-200/80 bg-gradient-to-br from-blue-50 via-white to-slate-50 dark:border-blue-900/50 dark:from-blue-950/20 dark:via-slate-950 dark:to-slate-950">
        <CardContent className="grid gap-6 p-6 lg:grid-cols-[1.3fr_0.9fr]">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="bg-blue-600 text-white hover:bg-blue-600">Plataforma</Badge>
              <Badge variant="outline">Rol: {roleLabel}</Badge>
            </div>

            <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                SyMTickets CCTV
              </h1>
              <p className="mt-2 max-w-3xl text-sm text-slate-600 dark:text-slate-300">
                Gobierno de empresas, servicios, plantillas y monitoreo de onboarding desde la plataforma global.
              </p>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white/80 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950/60">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-blue-600" />
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Accesos rapidos</p>
            </div>
            <div className="mt-4 space-y-3">
              {DEFAULT_ACTIONS.map((action) => (
                <Link
                  key={action.href}
                  href={action.href}
                  className="group flex items-start justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3 transition-colors hover:border-blue-300 hover:bg-white dark:border-slate-800 dark:bg-slate-900/70 dark:hover:border-blue-900/70 dark:hover:bg-slate-950"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{action.label}</p>
                    <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">{action.description}</p>
                  </div>
                  <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-slate-400 transition-transform group-hover:translate-x-0.5 group-hover:text-blue-600" />
                </Link>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPIs de plataforma */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Empresas activas"
          value={tenantStats?.active_tenants ?? "—"}
          subtitle={`${tenantStats?.total_tenants ?? 0} total registradas`}
          icon={Building2}
          color="blue"
        />
        <StatsCard
          title="Total empresas"
          value={tenantStats?.total_tenants ?? "—"}
          subtitle="Incluyendo inactivas"
          icon={Building2}
          color="teal"
        />
        <StatsCard
          title="Servicios"
          value="—"
          subtitle="Catalogo vigente"
          icon={Package2}
          color="amber"
        />
        <StatsCard
          title="Plantillas"
          value="—"
          subtitle="Templates de menu"
          icon={LayoutTemplate}
          color="green"
        />
      </div>
    </div>
  );
}
