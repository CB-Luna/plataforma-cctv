"use client";

import Link from "next/link";
import { ArrowRight, Building2 } from "lucide-react";
import { ServiceBadges } from "@/components/product/service-badges";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { CommercialPlanCode, ProductServiceCode } from "@/lib/product/service-catalog";
import type { WorkspaceExperience } from "@/lib/auth/workspace-experience";

export interface TenantPortalAction {
  href: string;
  label: string;
  description: string;
}

export function TenantPortalHero({
  experience,
  companyName,
  companySlug,
  roleLabel,
  plan,
  services,
  currentSiteName,
  actions,
}: {
  experience: WorkspaceExperience;
  companyName?: string;
  companySlug?: string;
  roleLabel: string;
  plan: CommercialPlanCode;
  services: ProductServiceCode[];
  currentSiteName?: string;
  actions: TenantPortalAction[];
}) {
  return (
    <Card className="overflow-hidden border-emerald-200/80 bg-gradient-to-br from-emerald-50 via-white to-sky-50 dark:border-emerald-900/50 dark:from-emerald-950/20 dark:via-slate-950 dark:to-sky-950/20">
      <CardContent className="grid gap-6 p-6 lg:grid-cols-[1.3fr_0.9fr]">
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

        <div className="rounded-3xl border border-slate-200 bg-white/80 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950/60">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-emerald-600" />
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Accesos rapidos del portal</p>
          </div>
          <div className="mt-4 space-y-3">
            {actions.map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className="group flex items-start justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3 transition-colors hover:border-emerald-300 hover:bg-white dark:border-slate-800 dark:bg-slate-900/70 dark:hover:border-emerald-900/70 dark:hover:bg-slate-950"
              >
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{action.label}</p>
                  <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">{action.description}</p>
                </div>
                <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-slate-400 transition-transform group-hover:translate-x-0.5 group-hover:text-emerald-600" />
              </Link>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
