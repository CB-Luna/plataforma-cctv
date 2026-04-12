"use client";

import { Building2, Package2, LayoutTemplate, Activity } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { StatsCard } from "@/components/ui/stats-card";
import { ASSIGNABLE_SERVICE_CODES, PRODUCT_SERVICE_DEFINITIONS } from "@/lib/product/service-catalog";
import type { TenantStats } from "@/types/api";

export function PlatformDashboardHero({
  tenantStats,
  roleLabel,
}: {
  tenantStats?: TenantStats;
  roleLabel: string;
}) {
  const operationalServices = ASSIGNABLE_SERVICE_CODES.filter(
    (c) => PRODUCT_SERVICE_DEFINITIONS[c]?.status === "operational",
  ).length;

  return (
    <div className="space-y-6">
      {/* Encabezado de plataforma */}
      <Card className="overflow-hidden border-blue-200/80 bg-gradient-to-br from-blue-50 via-white to-slate-50 dark:border-blue-900/50 dark:from-blue-950/20 dark:via-slate-950 dark:to-slate-950">
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="bg-blue-600 text-white hover:bg-blue-600">Plataforma</Badge>
              <Badge variant="outline">Rol: {roleLabel}</Badge>
            </div>

            <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                INFRAIX
              </h1>
              <p className="mt-2 max-w-3xl text-sm text-slate-600 dark:text-slate-300">
                Gobierno de empresas, servicios, plantillas y monitoreo de onboarding desde la plataforma global.
              </p>
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
          title="Servicios operativos"
          value={operationalServices}
          subtitle={`${ASSIGNABLE_SERVICE_CODES.length} disponibles en catalogo`}
          icon={Activity}
          color="green"
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
          color="purple"
        />
      </div>
    </div>
  );
}
