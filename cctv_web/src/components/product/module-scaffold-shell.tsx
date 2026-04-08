"use client";

import Link from "next/link";
import { ArrowRight, Blocks, Building2, Construction, MapPinned, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  PRODUCT_SERVICE_DEFINITIONS,
  getServiceStatusMeta,
  type ProductServiceCode,
} from "@/lib/product/service-catalog";
import { useAuthStore } from "@/stores/auth-store";
import { useSiteStore } from "@/stores/site-store";
import { useTenantStore } from "@/stores/tenant-store";
import { cn } from "@/lib/utils";

export interface ModuleScaffoldNavItem {
  key: string;
  label: string;
  href: string;
  description: string;
}

export function ModuleScaffoldShell({
  serviceCode,
  title,
  summary,
  sections,
  activeSectionKey,
  backendGaps,
  productNotes,
}: {
  serviceCode: ProductServiceCode;
  title: string;
  summary: string;
  sections: ModuleScaffoldNavItem[];
  activeSectionKey: string;
  backendGaps: string[];
  productNotes: string[];
}) {
  const currentCompany = useTenantStore((state) => state.currentCompany);
  const currentSite = useSiteStore((state) => state.currentSite);
  const roles = useAuthStore((state) => state.roles);
  const service = PRODUCT_SERVICE_DEFINITIONS[serviceCode];
  const statusMeta = getServiceStatusMeta(service.status);
  const activeSection = sections.find((section) => section.key === activeSectionKey) ?? sections[0];

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden border-amber-200/80 bg-gradient-to-br from-amber-50 via-white to-slate-50 dark:border-amber-900/50 dark:from-amber-950/20 dark:via-slate-950 dark:to-slate-950">
        <CardContent className="grid gap-6 p-6 lg:grid-cols-[1.35fr_0.95fr]">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">{service.label}</Badge>
              <Badge variant="outline">{statusMeta.label}</Badge>
              {currentCompany ? <Badge variant="outline">Tenant: {currentCompany.name}</Badge> : null}
              {currentSite ? <Badge variant="outline">Sitio: {currentSite.name}</Badge> : null}
              <Badge variant="outline">Roles visibles: {roles.length}</Badge>
            </div>

            <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">{title}</h1>
              <p className="mt-2 max-w-3xl text-sm text-slate-600 dark:text-slate-300">{summary}</p>
            </div>

            <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-4 text-sm text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/20 dark:text-amber-100">
              <div className="flex items-center gap-2">
                <Construction className="h-4 w-4" />
                <p className="font-semibold">Work in progress visible</p>
              </div>
              <p className="mt-2">
                Este modulo ya forma parte real del producto: aparece en menu, tiene rutas navegables y respeta tenant + servicio habilitado. Todavia no se presenta como CRUD terminado ni como backend cerrado.
              </p>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white/90 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950/70">
            <div className="flex items-center gap-2">
              <Blocks className="h-4 w-4 text-amber-600" />
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Secciones del scaffold</p>
            </div>
            <div className="mt-4 space-y-3">
              {sections.map((section) => {
                const isActive = section.key === activeSection.key;

                return (
                  <Link
                    key={section.href}
                    href={section.href}
                    className={cn(
                      "group flex items-start justify-between gap-3 rounded-2xl border px-4 py-3 transition-colors",
                      isActive
                        ? "border-amber-300 bg-amber-50 dark:border-amber-900/70 dark:bg-amber-950/20"
                        : "border-slate-200 bg-slate-50/70 hover:border-amber-300 hover:bg-white dark:border-slate-800 dark:bg-slate-900/70 dark:hover:border-amber-900/70 dark:hover:bg-slate-950",
                    )}
                  >
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{section.label}</p>
                      <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">{section.description}</p>
                    </div>
                    <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-slate-400 transition-transform group-hover:translate-x-0.5 group-hover:text-amber-600" />
                  </Link>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ShieldCheck className="h-4 w-4" />
              Lo que ya existe en este modulo
            </CardTitle>
            <CardDescription>
              Base minima ya materializada para que el dominio exista visiblemente dentro del producto.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
            {productNotes.map((note) => (
              <div key={note} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-900/40">
                {note}
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <MapPinned className="h-4 w-4" />
              Bloqueos actuales
            </CardTitle>
            <CardDescription>
              GAPs que todavia requieren backend, modelado adicional o desarrollo operativo del dominio.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
            {backendGaps.map((gap) => (
              <div key={gap} className="rounded-2xl border border-dashed border-slate-300 p-3 dark:border-slate-700">
                {gap}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Building2 className="h-4 w-4" />
            Seccion actual
          </CardTitle>
          <CardDescription>
            {activeSection?.description}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-2xl border border-dashed border-amber-300 bg-amber-50/70 p-5 dark:border-amber-900/60 dark:bg-amber-950/20">
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              {activeSection?.label} en construccion
            </p>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              Esta pantalla ya esta conectada al tenant activo y al runtime del producto, pero por ahora funciona como scaffold navegable. El siguiente avance de este dominio debe cerrar modelo de datos, APIs disponibles y flujos operativos antes de venderlo como terminado.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
