"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowRight,
  Camera,
  FileUp,
  HardDrive,
  Map,
  MapPin,
  Server,
} from "lucide-react";
import { listCameras } from "@/lib/api/cameras";
import { getInventoryDashboardStats, getInventorySummary } from "@/lib/api/inventory";
import { listNvrs } from "@/lib/api/nvrs";
import { useSiteStore } from "@/stores/site-store";
import { SiteContextBanner } from "@/components/context/site-context-banner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatsCard } from "@/components/ui/stats-card";
import { filterByActiveSite } from "@/lib/site-context";

export default function InventoryDashboardPage() {
  const currentSite = useSiteStore((s) => s.currentSite);
  const clearSite = useSiteStore((s) => s.clearSite);

  const { data: summary, isError: summaryError } = useQuery({
    queryKey: ["inventory", "summary"],
    queryFn: getInventorySummary,
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    staleTime: 5 * 60 * 1000,
  });

  const { data: stats, isError: statsError } = useQuery({
    queryKey: ["inventory", "dashboard-stats"],
    queryFn: getInventoryDashboardStats,
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    staleTime: 5 * 60 * 1000,
  });

  const { data: siteScopedCameras = [] } = useQuery({
    queryKey: ["inventory", "site-cameras", currentSite?.id],
    queryFn: () => listCameras({ limit: 500 }),
    enabled: !!currentSite,
    staleTime: 5 * 60 * 1000,
  });

  const { data: siteScopedNvrs = [] } = useQuery({
    queryKey: ["inventory", "site-nvrs", currentSite?.id],
    queryFn: listNvrs,
    enabled: !!currentSite,
    staleTime: 5 * 60 * 1000,
  });

  const scopedInventory = useMemo(() => {
    if (!currentSite) return null;

    const cameras = filterByActiveSite(siteScopedCameras, currentSite.id);
    const nvrs = filterByActiveSite(siteScopedNvrs, currentSite.id);
    const activeCameras = cameras.filter(
      (camera) => (camera.status ?? (camera.is_active ? "active" : "inactive")) === "active",
    ).length;
    const activeNvrs = nvrs.filter(
      (nvr) => (nvr.status ?? (nvr.is_active ? "active" : "inactive")) === "active",
    ).length;
    const recordingDays = nvrs
      .map((nvr) => nvr.recording_days)
      .filter((value): value is number => typeof value === "number");
    const totalStorageTb = nvrs.reduce((acc, nvr) => acc + (nvr.total_storage_tb ?? 0), 0);

    return {
      stats: {
        totalNvrs: nvrs.length,
        activeNvrs,
        totalCameras: cameras.length,
        activeCameras,
        totalStorageTb,
      },
      summary: {
        total_nvr_servers: nvrs.length,
        active_nvr_servers: activeNvrs,
        total_cameras: cameras.length,
        active_cameras: activeCameras,
        total_storage_tb: totalStorageTb,
        average_recording_days:
          recordingDays.length > 0
            ? Number((recordingDays.reduce((acc, value) => acc + value, 0) / recordingDays.length).toFixed(1))
            : 0,
        total_clients: currentSite.client_name ? 1 : 0,
        total_sites: 1,
      },
    };
  }, [currentSite, siteScopedCameras, siteScopedNvrs]);

  const displayedStats = scopedInventory?.stats ?? stats;
  const displayedSummary = scopedInventory?.summary ?? summary;

  return (
    <div className="space-y-6">
      <SiteContextBanner
        site={currentSite}
        description="Los KPI visibles se recalculan con los activos del sitio activo. Limpia el contexto para volver al agregado global del tenant."
        onClear={clearSite}
      />

      <div>
        <h2 className="text-2xl font-bold tracking-tight">Dashboard de Inventario</h2>
        <p className="text-muted-foreground">Resumen ejecutivo del inventario CCTV.</p>
      </div>

      {!currentSite && (summaryError || statsError) && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="flex items-center gap-3 py-4">
            <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600" />
            <div>
              <p className="text-sm font-medium text-amber-800">No se pudo cargar el resumen del inventario</p>
              <p className="text-xs text-amber-600">
                El servidor devolvio un error. Los datos se mostraran cuando el servicio este disponible.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Servidores NVR"
          value={displayedStats?.totalNvrs ?? displayedSummary?.total_nvr_servers ?? 0}
          subtitle={`${displayedStats?.activeNvrs ?? displayedSummary?.active_nvr_servers ?? 0} activos`}
          icon={Server}
          color="blue"
        />
        <StatsCard
          title="Camaras"
          value={displayedStats?.totalCameras ?? displayedSummary?.total_cameras ?? 0}
          subtitle={`${displayedStats?.activeCameras ?? displayedSummary?.active_cameras ?? 0} activas`}
          icon={Camera}
          color="teal"
        />
        <StatsCard
          title="Almacenamiento"
          value={`${displayedStats?.totalStorageTb ?? displayedSummary?.total_storage_tb ?? 0} TB`}
          subtitle={
            displayedSummary?.average_recording_days != null
              ? `~${displayedSummary.average_recording_days} dias grabacion`
              : undefined
          }
          icon={HardDrive}
          color="purple"
        />
        <StatsCard
          title="Sucursales"
          value={displayedSummary?.total_sites ?? 0}
          subtitle={`${displayedSummary?.total_clients ?? 0} clientes`}
          icon={MapPin}
          color="amber"
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            href: "/cameras",
            label: "Camaras",
            desc: "Listado completo, busqueda y exportacion",
            icon: Camera,
            color: "text-sky-500",
          },
          {
            href: "/nvrs",
            label: "Servidores NVR",
            desc: "Administrar servidores de grabacion",
            icon: Server,
            color: "text-blue-500",
          },
          {
            href: "/floor-plans",
            label: "Planos de planta",
            desc: "Editor visual de ubicacion de camaras",
            icon: Map,
            color: "text-emerald-500",
          },
          {
            href: "/imports",
            label: "Importacion",
            desc: "Carga masiva desde Excel / CSV",
            icon: FileUp,
            color: "text-amber-500",
          },
        ].map((nav) => (
          <Link key={nav.href} href={nav.href}>
            <Card className="group cursor-pointer transition-shadow hover:shadow-md">
              <CardContent className="flex items-center gap-3 py-4">
                <nav.icon className={`h-8 w-8 shrink-0 ${nav.color}`} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">{nav.label}</p>
                  <p className="truncate text-xs text-muted-foreground">{nav.desc}</p>
                </div>
                <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {displayedSummary && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Infraestructura</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">NVR activos / total</span>
                <span className="font-medium">
                  {displayedSummary.active_nvr_servers} / {displayedSummary.total_nvr_servers}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Camaras activas / total</span>
                <span className="font-medium">
                  {displayedSummary.active_cameras} / {displayedSummary.total_cameras}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Almacenamiento total</span>
                <span className="font-medium">{displayedSummary.total_storage_tb} TB</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Dias promedio grabacion</span>
                <span className="font-medium">{displayedSummary.average_recording_days} dias</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Cobertura</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Clientes</span>
                <span className="font-medium">{displayedSummary.total_clients}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Sucursales cubiertas</span>
                <span className="font-medium">{displayedSummary.total_sites}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Ratio camaras/sucursal</span>
                <span className="font-medium">
                  {displayedSummary.total_sites > 0
                    ? (displayedSummary.total_cameras / displayedSummary.total_sites).toFixed(1)
                    : "—"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Ratio NVR/sucursal</span>
                <span className="font-medium">
                  {displayedSummary.total_sites > 0
                    ? (displayedSummary.total_nvr_servers / displayedSummary.total_sites).toFixed(1)
                    : "—"}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
