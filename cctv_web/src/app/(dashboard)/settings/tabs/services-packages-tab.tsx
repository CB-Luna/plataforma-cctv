"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Layers3, Package2 } from "lucide-react";
import { ServiceBadges } from "@/components/product/service-badges";
import { ScopeCallout } from "@/components/settings/scope-callout";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { listTenants } from "@/lib/api/tenants";
import {
  ASSIGNABLE_SERVICE_CODES,
  COMMERCIAL_PLAN_PRESETS,
  PLANNED_SERVICE_CODES,
  PRODUCT_SERVICE_DEFINITIONS,
  getServiceStatusMeta,
  parseTenantProductProfile,
} from "@/lib/product/service-catalog";

export function ServicesPackagesTab() {
  const { data: tenants = [] } = useQuery({
    queryKey: ["tenants", "services-packages"],
    queryFn: () => listTenants(),
  });

  const stats = useMemo(() => {
    const explicitAssignments = tenants.filter(
      (tenant) => parseTenantProductProfile(tenant).source === "explicit",
    ).length;

    return {
      basic: tenants.filter((tenant) => parseTenantProductProfile(tenant).packageProfile === "basic").length,
      professional: tenants.filter((tenant) => parseTenantProductProfile(tenant).packageProfile === "professional").length,
      enterprise: tenants.filter((tenant) => parseTenantProductProfile(tenant).packageProfile === "enterprise").length,
      explicitAssignments,
    };
  }, [tenants]);

  return (
    <div className="space-y-6">
      <ScopeCallout
        badge="Plataforma"
        accent="platform"
        title="Catalogo vigente de servicios y paquetes"
        description="Este tab hace explicito que incluye hoy cada plan comercial dentro del shell actual y como se transforma en visibilidad real por tenant."
        footer={
          <div className="flex flex-wrap gap-2 text-xs text-slate-600 dark:text-slate-300">
            <Badge variant="outline">{tenants.length} tenants auditados</Badge>
            <Badge variant="outline">{stats.explicitAssignments} con asignacion explicita de servicios</Badge>
            <Badge variant="secondary">La visibilidad final depende de permiso + servicio + modulo real</Badge>
          </div>
        }
      />

      <div className="grid gap-4 xl:grid-cols-3">
        {Object.values(COMMERCIAL_PLAN_PRESETS).map((plan) => (
          <Card key={plan.code}>
            <CardHeader>
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Package2 className="h-4 w-4" />
                  {plan.label}
                </CardTitle>
                <Badge variant="outline">
                  {stats[plan.code]} tenants
                </Badge>
              </div>
              <CardDescription>{plan.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                  Incluye por defecto
                </p>
                <div className="mt-2">
                  <ServiceBadges services={plan.suggestedServices} />
                </div>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                El plan es una base comercial. En el alta del tenant puede ajustarse que servicios quedan realmente habilitados.
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Layers3 className="h-4 w-4" />
            Servicios habilitables hoy
          </CardTitle>
          <CardDescription>
            Solo estos servicios participan ya en visibilidad del shell actual porque existe modulo o configuracion real en la web.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 lg:grid-cols-3">
          {ASSIGNABLE_SERVICE_CODES.map((serviceCode) => {
            const service = PRODUCT_SERVICE_DEFINITIONS[serviceCode];
            const meta = getServiceStatusMeta(service.status);

            return (
              <div
                key={service.code}
                className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-900/40"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold text-slate-900 dark:text-slate-100">{service.label}</p>
                  <Badge variant={meta.tone === "default" ? "default" : "secondary"}>{meta.label}</Badge>
                </div>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{service.description}</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {service.modules.map((moduleName) => (
                    <Badge key={moduleName} variant="outline">
                      {moduleName}
                    </Badge>
                  ))}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Dominios planeados, sin modulo operativo aun</CardTitle>
          <CardDescription>
            Se muestran aqui para dejar claro el gap actual. No se habilitan en runtime porque el repo todavia no tiene superficie web operativa para ellos.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          {PLANNED_SERVICE_CODES.map((serviceCode) => {
            const service = PRODUCT_SERVICE_DEFINITIONS[serviceCode];

            return (
              <div key={service.code} className="rounded-2xl border border-dashed p-4">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-slate-900 dark:text-slate-100">{service.label}</p>
                  <Badge variant="secondary">Planeado</Badge>
                </div>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{service.description}</p>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Gobierno vigente de visibilidad</CardTitle>
          <CardDescription>
            Regla actual de producto para no vender capacidades que el backend o la web todavia no sostienen.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 lg:grid-cols-3">
          <GovernanceCard
            title="1. Permisos"
            description="El usuario debe tener permiso para la ruta o tab correspondiente."
          />
          <GovernanceCard
            title="2. Servicio habilitado"
            description="El tenant debe tener ese servicio dentro de `enabled_services`."
          />
          <GovernanceCard
            title="3. Modulo real"
            description="Solo se muestra lo que hoy existe realmente en la web; lo planeado queda documentado como gap."
          />
        </CardContent>
      </Card>
    </div>
  );
}

function GovernanceCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 dark:border-slate-800 dark:bg-slate-900/40">
      <p className="font-semibold text-slate-900 dark:text-slate-100">{title}</p>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{description}</p>
    </div>
  );
}
