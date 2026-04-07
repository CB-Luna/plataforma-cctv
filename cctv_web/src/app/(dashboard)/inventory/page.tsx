"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { getInventorySummary, getInventoryDashboardStats } from "@/lib/api/inventory";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatsCard } from "@/components/ui/stats-card";
import { Server, Camera, HardDrive, MapPin, Map, FileUp, ArrowRight, AlertTriangle } from "lucide-react";

export default function InventoryDashboardPage() {
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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Dashboard de Inventario</h2>
        <p className="text-muted-foreground">
          Resumen ejecutivo del inventario CCTV.
        </p>
      </div>

      {(summaryError || statsError) && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="flex items-center gap-3 py-4">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
            <div>
              <p className="text-sm font-medium text-amber-800">No se pudo cargar el resumen del inventario</p>
              <p className="text-xs text-amber-600">El servidor devolvió un error. Los datos se mostrarán cuando el servicio esté disponible.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Servidores NVR"
          value={stats?.totalNvrs ?? summary?.total_nvr_servers ?? 0}
          subtitle={`${stats?.activeNvrs ?? summary?.active_nvr_servers ?? 0} activos`}
          icon={Server}
          color="blue"
        />
        <StatsCard
          title="Cámaras"
          value={stats?.totalCameras ?? summary?.total_cameras ?? 0}
          subtitle={`${stats?.activeCameras ?? summary?.active_cameras ?? 0} activas`}
          icon={Camera}
          color="teal"
        />
        <StatsCard
          title="Almacenamiento"
          value={`${stats?.totalStorageTb ?? summary?.total_storage_tb ?? 0} TB`}
          subtitle={summary?.average_recording_days != null ? `~${summary.average_recording_days} días grabación` : undefined}
          icon={HardDrive}
          color="purple"
        />
        <StatsCard
          title="Sucursales"
          value={summary?.total_sites ?? 0}
          subtitle={`${summary?.total_clients ?? 0} clientes`}
          icon={MapPin}
          color="amber"
        />
      </div>

      {/* Quick access navigation */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { href: "/cameras", label: "Cámaras", desc: "Listado completo, búsqueda y exportación", icon: Camera, color: "text-sky-500" },
          { href: "/nvrs", label: "Servidores NVR", desc: "Administrar servidores de grabación", icon: Server, color: "text-blue-500" },
          { href: "/floor-plans", label: "Planos de Planta", desc: "Editor visual de ubicación de cámaras", icon: Map, color: "text-emerald-500" },
          { href: "/imports", label: "Importación", desc: "Carga masiva desde Excel / CSV", icon: FileUp, color: "text-amber-500" },
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

      {/* Summary section */}
      {summary && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Infraestructura</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">NVR activos / total</span>
                <span className="font-medium">{summary.active_nvr_servers} / {summary.total_nvr_servers}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Cámaras activas / total</span>
                <span className="font-medium">{summary.active_cameras} / {summary.total_cameras}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Almacenamiento total</span>
                <span className="font-medium">{summary.total_storage_tb} TB</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Días promedio grabación</span>
                <span className="font-medium">{summary.average_recording_days} días</span>
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
                <span className="font-medium">{summary.total_clients}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Sucursales cubiertas</span>
                <span className="font-medium">{summary.total_sites}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Ratio cámaras/sucursal</span>
                <span className="font-medium">
                  {summary.total_sites > 0
                    ? (summary.total_cameras / summary.total_sites).toFixed(1)
                    : "—"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Ratio NVR/sucursal</span>
                <span className="font-medium">
                  {summary.total_sites > 0
                    ? (summary.total_nvr_servers / summary.total_sites).toFixed(1)
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
