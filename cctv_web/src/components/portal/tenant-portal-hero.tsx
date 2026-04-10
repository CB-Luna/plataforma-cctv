"use client";

import { ServiceBadges } from "@/components/product/service-badges";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { CommercialPlanCode, ProductServiceCode } from "@/lib/product/service-catalog";
import type { WorkspaceExperience } from "@/lib/auth/workspace-experience";

export function TenantPortalHero({
  experience,
  companyName,
  companySlug,
  roleLabel,
  plan,
  services,
  currentSiteName,
}: {
  experience: WorkspaceExperience;
  companyName?: string;
  companySlug?: string;
  roleLabel: string;
  plan: CommercialPlanCode;
  services: ProductServiceCode[];
  currentSiteName?: string;
}) {
  return (
    <Card className="overflow-hidden border-emerald-200/80 bg-gradient-to-br from-emerald-50 via-white to-sky-50 dark:border-emerald-900/50 dark:from-emerald-950/20 dark:via-slate-950 dark:to-sky-950/20">
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{experience.shellBadgeLabel}</Badge>
            <Badge variant="outline">Plan: {plan}</Badge>
            <Badge variant="outline">Rol: {roleLabel}</Badge>
            {companySlug ? <Badge variant="outline">Tenant: {companySlug}</Badge> : null}
            {currentSiteName ? <Badge variant="outline">Sitio: {currentSiteName}</Badge> : null}
          </div>

          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              {companyName ? `Portal de ${companyName}` : experience.shellTitle}
            </h1>
            <p className="mt-2 max-w-3xl text-sm text-slate-600 dark:text-slate-300">
              {experience.shellDescription}
            </p>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
              Servicios visibles hoy
            </p>
            <ServiceBadges services={services} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
