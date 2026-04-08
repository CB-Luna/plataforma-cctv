"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Layers3, Package2 } from "lucide-react";
import { TenantPortalPreview } from "@/components/settings/tenant-portal-preview";
import { ServiceBadges } from "@/components/product/service-badges";
import { ScopeCallout } from "@/components/settings/scope-callout";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { listTenants } from "@/lib/api/tenants";
import {
  ASSIGNABLE_SERVICE_CODES,
  COMMERCIAL_PLAN_PRESETS,
  PARTIAL_SERVICE_CODES,
  PRODUCT_SERVICE_DEFINITIONS,
  RUNTIME_VISIBLE_SERVICE_CODES,
  getServiceStatusMeta,
  parseTenantProductProfile,
} from "@/lib/product/service-catalog";
import { useTenantStore } from "@/stores/tenant-store";

export function ServicesPackagesTab() {
  const currentCompany = useTenantStore((state) => state.currentCompany);
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
  const effectiveTenant = currentCompany ?? tenants[0] ?? null;
  const effectiveProfile = parseTenantProductProfile(effectiveTenant);

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

      <Card className="border-slate-200 dark:border-slate-800">
        <CardHeader>
          <CardTitle className="text-base">Matriz visible por paquete</CardTitle>
          <CardDescription>
            Esta tabla ya responde a la pregunta de producto mas importante: que dominios ve una empresa segun el paquete base que le asignes.
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b text-left text-slate-500 dark:text-slate-400">
                <th className="px-3 py-3 font-semibold">Dominio</th>
                <th className="px-3 py-3 font-semibold">Estado</th>
                <th className="px-3 py-3 font-semibold">Basic</th>
                <th className="px-3 py-3 font-semibold">Professional</th>
                <th className="px-3 py-3 font-semibold">Enterprise</th>
              </tr>
            </thead>
            <tbody>
              {ASSIGNABLE_SERVICE_CODES.map((serviceCode) => {
                const service = PRODUCT_SERVICE_DEFINITIONS[serviceCode];
                const meta = getServiceStatusMeta(service.status);

                return (
                  <tr key={`matrix-${service.code}`} className="border-b last:border-b-0">
                    <td className="px-3 py-3">
                      <div>
                        <p className="font-medium text-slate-900 dark:text-slate-100">{service.label}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{service.modules.slice(0, 3).join(", ")}</p>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <Badge variant={meta.tone === "default" ? "default" : "secondary"}>{meta.label}</Badge>
                    </td>
                    {(["basic", "professional", "enterprise"] as const).map((planCode) => {
                      const included = COMMERCIAL_PLAN_PRESETS[planCode].suggestedServices.includes(serviceCode);
                      return (
                        <td key={`${service.code}-${planCode}`} className="px-3 py-3">
                          <Badge variant={included ? "default" : "outline"}>
                            {included ? "Incluido" : "Opcional"}
                          </Badge>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Layers3 className="h-4 w-4" />
            Servicios habilitables hoy
          </CardTitle>
          <CardDescription>
            El catalogo ya separa dominios operativos, capacidades parciales y modulos scaffold/WIP visibles por tenant.
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

      <div className="grid gap-6 xl:grid-cols-[0.95fr,1.05fr]">
        <Card className="border-slate-200 dark:border-slate-800">
          <CardHeader>
            <CardTitle className="text-base">Configuracion efectiva de empresa</CardTitle>
            <CardDescription>
              Asi aterriza el paquete comercial en una empresa real del sistema.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-3xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-900/40">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-semibold text-slate-900 dark:text-slate-100">{effectiveTenant?.name ?? "Sin tenant activo"}</p>
                <Badge variant="outline">Plan {effectiveProfile.packageProfile}</Badge>
              </div>
              <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
                Este resumen hace visible la diferencia entre plan comercial y producto realmente visible para una empresa concreta.
              </p>
              <div className="mt-4">
                <ServiceBadges services={effectiveProfile.enabledServices} />
              </div>
            </div>

            <div className="grid gap-3">
              <GovernanceCard
                title="Paquete base"
                description={`El plan ${effectiveProfile.packageProfile} sugiere un conjunto inicial, pero la empresa se define de verdad por sus servicios habilitados.`}
              />
              <GovernanceCard
                title="Servicios efectivos"
                description="Estos servicios son los que realmente gobiernan su sidebar, sus tabs y la presencia de modulos visibles en portal."
              />
              <GovernanceCard
                title="Estado del modulo"
                description="El runtime ya no es binario: un modulo puede ser operativo, parcial o WIP y aun asi formar parte del producto visible."
              />
            </div>
          </CardContent>
        </Card>

        <TenantPortalPreview
          tenant={effectiveTenant}
          title="Preview del menu por empresa"
          description="Esta preview deja visible que modulos aparecerán realmente para la empresa segun su configuracion de servicios."
          compact
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Dominios visibles en runtime</CardTitle>
          <CardDescription>
            Estos dominios ya pueden aparecer en el menu del tenant cuando el servicio esta habilitado. Su estado define si son operativos o WIP.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          {RUNTIME_VISIBLE_SERVICE_CODES.map((serviceCode) => {
            const service = PRODUCT_SERVICE_DEFINITIONS[serviceCode];
            const meta = getServiceStatusMeta(service.status);

            return (
              <div key={service.code} className="rounded-2xl border border-dashed p-4">
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
          <CardTitle className="text-base">Capacidades parciales fuera del side menu</CardTitle>
          <CardDescription>
            Estas capacidades ya existen en el producto, pero viven hoy dentro de `Configuracion` y no como dominio lateral completo.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          {PARTIAL_SERVICE_CODES.map((serviceCode) => {
            const service = PRODUCT_SERVICE_DEFINITIONS[serviceCode];

            return (
              <div key={service.code} className="rounded-2xl border p-4">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-slate-900 dark:text-slate-100">{service.label}</p>
                  <Badge variant="secondary">Parcial</Badge>
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
          <CardTitle className="text-base">Gobierno vigente de visibilidad</CardTitle>
          <CardDescription>
            Regla actual de producto para no vender capacidades que el backend o la web todavia no sostienen.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 lg:grid-cols-3">
          <GovernanceCard
            title="1. Permisos"
            description="El usuario debe tener permiso para la ruta o tab correspondiente, o la regla temporal de descubrimiento del scaffold."
          />
          <GovernanceCard
            title="2. Servicio habilitado"
            description="El tenant debe tener ese servicio dentro de `enabled_services`."
          />
          <GovernanceCard
            title="3. Estado del modulo"
            description="El runtime ya distingue modulo operativo, capacidad parcial y scaffold/WIP sin esconder dominios reales del producto."
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
