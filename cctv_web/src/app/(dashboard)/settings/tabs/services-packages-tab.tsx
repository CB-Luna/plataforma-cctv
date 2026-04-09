"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Package2 } from "lucide-react";
import { ServiceBadges } from "@/components/product/service-badges";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { listTenants } from "@/lib/api/tenants";
import {
  ASSIGNABLE_SERVICE_CODES,
  COMMERCIAL_PLAN_PRESETS,
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
    return {
      basic: tenants.filter((t) => parseTenantProductProfile(t).packageProfile === "basic").length,
      professional: tenants.filter((t) => parseTenantProductProfile(t).packageProfile === "professional").length,
      enterprise: tenants.filter((t) => parseTenantProductProfile(t).packageProfile === "enterprise").length,
    };
  }, [tenants]);

  return (
    <div className="space-y-6">
      {/* Planes comerciales */}
      <div className="grid gap-4 xl:grid-cols-3">
        {Object.values(COMMERCIAL_PLAN_PRESETS).map((plan) => (
          <Card key={plan.code}>
            <CardHeader>
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Package2 className="h-4 w-4" />
                  {plan.label}
                </CardTitle>
                <Badge variant="outline">{stats[plan.code]} tenants</Badge>
              </div>
              <CardDescription>{plan.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <ServiceBadges services={plan.suggestedServices} />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Matriz de servicios por plan */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Matriz de servicios por plan</CardTitle>
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
                const def = PRODUCT_SERVICE_DEFINITIONS[serviceCode];
                if (!def) return null;
                const meta = getServiceStatusMeta(def.status);

                const inBasic = COMMERCIAL_PLAN_PRESETS.basic.suggestedServices.includes(serviceCode);
                const inPro = COMMERCIAL_PLAN_PRESETS.professional.suggestedServices.includes(serviceCode);
                const inEnt = COMMERCIAL_PLAN_PRESETS.enterprise.suggestedServices.includes(serviceCode);

                return (
                  <tr key={serviceCode} className="border-b last:border-0">
                    <td className="px-3 py-2 font-medium">{def.label}</td>
                    <td className="px-3 py-2">
                      <Badge variant={meta.tone} className="text-xs">{meta.label}</Badge>
                    </td>
                    <td className="px-3 py-2">{inBasic ? <Badge variant="default" className="text-xs">Incluido</Badge> : <span className="text-slate-400">—</span>}</td>
                    <td className="px-3 py-2">{inPro ? <Badge variant="default" className="text-xs">Incluido</Badge> : <span className="text-slate-400">—</span>}</td>
                    <td className="px-3 py-2">{inEnt ? <Badge variant="default" className="text-xs">Incluido</Badge> : <span className="text-slate-400">—</span>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Catalogo de servicios */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Catalogo de servicios</CardTitle>
          <CardDescription>Todos los servicios disponibles en la plataforma</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {ASSIGNABLE_SERVICE_CODES.map((serviceCode) => {
              const def = PRODUCT_SERVICE_DEFINITIONS[serviceCode];
              if (!def) return null;
              const meta = getServiceStatusMeta(def.status);

              return (
                <div
                  key={serviceCode}
                  className="flex flex-col gap-2 rounded-lg border p-4"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">{def.label}</span>
                    <Badge variant={meta.tone} className="text-xs">{meta.label}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{def.description}</p>
                  {def.modules && def.modules.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {def.modules.map((mod) => (
                        <Badge key={mod} variant="outline" className="text-[10px]">{mod}</Badge>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
