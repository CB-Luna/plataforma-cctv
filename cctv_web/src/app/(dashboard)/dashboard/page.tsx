"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { TenantPortalHero } from "@/components/portal/tenant-portal-hero";
import { PlatformDashboardHero } from "@/components/portal/platform-dashboard-hero";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatsCard } from "@/components/ui/stats-card";
import { usePermissions } from "@/hooks/use-permissions";
import { getWorkspaceExperience } from "@/lib/auth/workspace-experience";
import { getDashboardSummary, getDashboardTicketStats, getTicketsTrend, getPolicyStats } from "@/lib/api/dashboard";
import { getTenantStats } from "@/lib/api/tenants";
import { getCameraStats } from "@/lib/api/cameras";
import { getNvrStats } from "@/lib/api/nvrs";
import { parseTenantProductProfile } from "@/lib/product/service-catalog";
import { useSiteStore } from "@/stores/site-store";
import { useTenantStore } from "@/stores/tenant-store";
import {
  Ticket,
  Camera,
  Server,
  ShieldCheck,
  AlertTriangle,
  ChevronDown,
  DollarSign,
  TrendingUp,
  CheckCircle2,
  Clock,
  XCircle,
  HardDrive,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from "recharts";

export default function DashboardPage() {
  const [showTenantOps, setShowTenantOps] = useState(false);
  const { canAny, permissions, roles } = usePermissions();
  const currentCompany = useTenantStore((state) => state.currentCompany);
  const currentSite = useSiteStore((state) => state.currentSite);
  const experience = getWorkspaceExperience({
    permissions,
    roles,
    company: currentCompany,
  });
  const tenantProfile = parseTenantProductProfile(currentCompany);
  const { data: summary } = useQuery({
    queryKey: ["dashboard-summary"],
    queryFn: getDashboardSummary,
  });

  const { data: tenantStats } = useQuery({
    queryKey: ["tenant-stats"],
    queryFn: getTenantStats,
    enabled: experience.mode === "hybrid_backoffice",
  });

  const { data: ticketStats } = useQuery({
    queryKey: ["dashboard-ticket-stats"],
    queryFn: getDashboardTicketStats,
  });

  const { data: trend = [] } = useQuery({
    queryKey: ["dashboard-trend"],
    queryFn: () => getTicketsTrend(30),
  });

  const { data: policyStats } = useQuery({
    queryKey: ["dashboard-policy-stats"],
    queryFn: getPolicyStats,
  });

  const { data: cameraStats } = useQuery({
    queryKey: ["camera-stats"],
    queryFn: getCameraStats,
  });

  const { data: nvrStats } = useQuery({
    queryKey: ["nvr-stats"],
    queryFn: getNvrStats,
  });

  // NVR Health pie data
  const nvrPieData = useMemo(() => {
    if (!nvrStats) return [];
    return [
      { name: "Activos", value: nvrStats.active_servers, color: "#22c55e" },
      { name: "Inactivos", value: nvrStats.inactive_servers, color: "#ef4444" },
    ].filter((d) => d.value > 0);
  }, [nvrStats]);

  // Camera types bar data
  const cameraTypeData = useMemo(() => {
    if (!cameraStats) return [];
    const types = [
      { type: "Dome", count: cameraStats.dome_cameras, fill: "#3b82f6" },
      { type: "Bullet", count: cameraStats.bullet_cameras, fill: "#8b5cf6" },
      { type: "PTZ", count: cameraStats.ptz_cameras, fill: "#f59e0b" },
    ].filter((d) => d.count > 0);
    // Add "Otras" if there are cameras not categorized
    const categorized = (cameraStats.dome_cameras ?? 0) + (cameraStats.bullet_cameras ?? 0) + (cameraStats.ptz_cameras ?? 0);
    const other = (cameraStats.total_cameras ?? 0) - categorized;
    if (other > 0) types.push({ type: "Otras", count: other, fill: "#6b7280" });
    return types;
  }, [cameraStats]);

  // Ticket pie data
  const ticketPieData = useMemo(() => {
    if (!ticketStats) return [];
    return [
      { name: "Abiertos", value: ticketStats.openCount, color: "#3b82f6" },
      { name: "En progreso", value: ticketStats.inProgressCount, color: "#f59e0b" },
      { name: "Completados", value: ticketStats.completedCount, color: "#22c55e" },
      { name: "Cancelados", value: ticketStats.cancelledCount, color: "#ef4444" },
    ].filter((d) => d.value > 0);
  }, [ticketStats]);

  // Storage percentage
  const storagePct = useMemo(() => {
    if (!nvrStats || !nvrStats.total_storage_tb) return 0;
    // Estimate: assume 80% capacity as total available
    return Math.min(100, Math.round((nvrStats.total_storage_tb / (nvrStats.total_storage_tb * 1.25)) * 100));
  }, [nvrStats]);

  const now = new Date();
  const dateStr = now.toLocaleDateString("es-MX", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
  return (
    <div className="space-y-6">
      {experience.mode === "hybrid_backoffice" ? (
        <PlatformDashboardHero
          tenantStats={tenantStats}
          roleLabel={experience.roleLabel}
        />
      ) : (
        <TenantPortalHero
          experience={experience}
          companyName={currentCompany?.name}
          companySlug={currentCompany?.slug}
          roleLabel={experience.roleLabel}
          plan={tenantProfile.packageProfile}
          services={tenantProfile.enabledServices}
          currentSiteName={currentSite?.name}
        />
      )}

      {/* Toggle de seccion operativa — solo si existe empresa activa en backoffice */}
      {experience.mode === "hybrid_backoffice" && currentCompany ? (
        <Button
          variant="outline"
          className="w-full justify-between gap-2 border-slate-200 bg-slate-50 text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
          onClick={() => setShowTenantOps((prev) => !prev)}
          data-testid="toggle-tenant-ops"
        >
          <span>Operacion del tenant: {currentCompany.name}</span>
          <ChevronDown className={cn("h-4 w-4 transition-transform", showTenantOps && "rotate-180")} />
        </Button>
      ) : (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white">
              Operación CCTV
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Panel de control e indicadores de operación
            </p>
          </div>
          <span className="rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-medium tabular-nums text-gray-600 dark:bg-gray-800 dark:text-gray-300">{dateStr}</span>
        </div>
      )}

      {/* Contenido operativo: siempre visible en portal, colapsable en backoffice solo si hay empresa */}
      {(experience.mode !== "hybrid_backoffice" || (showTenantOps && currentCompany)) && (
      <>
      {/* Enterprise Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Cámaras Activas"
          value={cameraStats?.active_cameras ?? summary?.activeCameras ?? "—"}
          subtitle={`${cameraStats?.total_cameras ?? 0} total · ${cameraStats?.inactive_cameras ?? 0} inactivas`}
          icon={Camera}
          color="blue"
        />
        <StatsCard
          title="Servidores NVR"
          value={nvrStats?.active_servers ?? summary?.activeNvrs ?? "—"}
          subtitle={`${nvrStats?.total_servers ?? 0} total · ${nvrStats?.inactive_servers ?? 0} inactivos`}
          icon={Server}
          color="teal"
        />
        <StatsCard
          title="Almacenamiento"
          value={`${(nvrStats?.total_storage_tb ?? summary?.totalStorageTb ?? 0).toFixed(1)} TB`}
          subtitle={`${storagePct}% en uso estimado`}
          icon={HardDrive}
          color="amber"
        />
        <StatsCard
          title="Tickets Abiertos"
          value={summary?.openTickets ?? "—"}
          subtitle={`${summary?.criticalTickets ?? 0} críticos · SLA ${summary?.slaCompliancePct?.toFixed(0) ?? 0}%`}
          icon={Ticket}
          color="green"
        />
      </div>

      {/* CCTV Infrastructure charts */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* NVR Health donut */}
        <Card className="overflow-hidden rounded-2xl border-gray-200/80 shadow-sm dark:border-gray-800/80">
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-gray-700 dark:text-gray-200">Salud de NVRs</CardTitle>
          </CardHeader>
          <CardContent>
            {nvrPieData.length > 0 ? (
              <div className="flex items-center gap-4">
                <ResponsiveContainer width="50%" height={200}>
                  <PieChart>
                    <Pie data={nvrPieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                      {nvrPieData.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-3">
                  {nvrPieData.map((d) => (
                    <div key={d.name} className="flex items-center gap-2 text-sm">
                      <span className="h-3 w-3 rounded-full" style={{ backgroundColor: d.color }} />
                      <span className="text-muted-foreground">{d.name}</span>
                      <span className="ml-auto font-bold tabular-nums">{d.value}</span>
                    </div>
                  ))}
                  <div className="border-t pt-2 text-xs text-muted-foreground">
                    Total: <span className="font-semibold text-foreground">{nvrStats?.total_servers ?? 0}</span> servidores
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground">Sin datos de NVRs</div>
            )}
          </CardContent>
        </Card>

        {/* Camera types bar chart */}
        <Card className="overflow-hidden rounded-2xl border-gray-200/80 shadow-sm dark:border-gray-800/80">
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-gray-700 dark:text-gray-200">Cámaras por Tipo</CardTitle>
          </CardHeader>
          <CardContent>
            {cameraTypeData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={cameraTypeData} layout="vertical" margin={{ top: 4, right: 20, bottom: 0, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 10 }} allowDecimals={false} className="text-muted-foreground" />
                  <YAxis type="category" dataKey="type" tick={{ fontSize: 11 }} width={50} className="text-muted-foreground" />
                  <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                  <Bar dataKey="count" name="Cámaras" radius={[0, 4, 4, 0]}>
                    {cameraTypeData.map((entry) => (
                      <Cell key={entry.type} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground">Sin datos de cámaras</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tickets row */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Ticket distribution pie */}
        <Card className="overflow-hidden rounded-2xl border-gray-200/80 shadow-sm dark:border-gray-800/80">
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-gray-700 dark:text-gray-200">Distribución de Tickets</CardTitle>
          </CardHeader>
          <CardContent>
            {ticketPieData.length > 0 ? (
              <div className="flex items-center gap-4">
                <ResponsiveContainer width="50%" height={200}>
                  <PieChart>
                    <Pie data={ticketPieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                      {ticketPieData.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2">
                  {ticketPieData.map((d) => (
                    <div key={d.name} className="flex items-center gap-2 text-sm">
                      <span className="h-3 w-3 rounded-full" style={{ backgroundColor: d.color }} />
                      <span className="text-muted-foreground">{d.name}</span>
                      <span className="ml-auto font-bold tabular-nums">{d.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground">Sin datos</div>
            )}
          </CardContent>
        </Card>

        {/* Desglose de tickets */}
        <Card className="overflow-hidden rounded-2xl border-gray-200/80 shadow-sm dark:border-gray-800/80">
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-gray-700 dark:text-gray-200">Desglose de Tickets</CardTitle>
          </CardHeader>
          <CardContent>
            {ticketStats ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <StatRow icon={<Clock className="h-4 w-4 text-blue-500" />} label="Abiertos" value={ticketStats.openCount} />
                  <StatRow icon={<TrendingUp className="h-4 w-4 text-amber-500" />} label="En progreso" value={ticketStats.inProgressCount} />
                  <StatRow icon={<CheckCircle2 className="h-4 w-4 text-green-500" />} label="Completados" value={ticketStats.completedCount} />
                  <StatRow icon={<XCircle className="h-4 w-4 text-red-500" />} label="Cancelados" value={ticketStats.cancelledCount} />
                  <StatRow icon={<AlertTriangle className="h-4 w-4 text-red-600" />} label="Críticos" value={ticketStats.criticalCount} />
                  <StatRow icon={<Ticket className="h-4 w-4 text-gray-500" />} label="Total" value={ticketStats.totalCount} />
                </div>
                <div className="flex gap-4 border-t pt-3 text-xs">
                  <span className="text-green-600">SLA cumplidos: {ticketStats.slaMetCount}</span>
                  <span className="text-red-600">SLA fallidos: {ticketStats.slaMissedCount}</span>
                </div>
              </div>
            ) : (
              <div className="flex h-24 items-center justify-center text-sm text-muted-foreground">Cargando...</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Full-width trend chart */}
      <Card className="overflow-hidden rounded-2xl border-gray-200/80 shadow-sm dark:border-gray-800/80">
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-gray-700 dark:text-gray-200">Tendencia de Tickets (30 días)</CardTitle>
        </CardHeader>
        <CardContent>
          {trend.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={trend} margin={{ top: 4, right: 12, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(v: string) => v.slice(5)} className="text-muted-foreground" />
                <YAxis tick={{ fontSize: 10 }} allowDecimals={false} className="text-muted-foreground" />
                <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="opened" name="Abiertos" stroke="#3b82f6" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="completed" name="Cerrados" stroke="#22c55e" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-[260px] items-center justify-center text-sm text-muted-foreground">Sin datos de tendencia</div>
          )}
        </CardContent>
      </Card>

      {/* Policy stats */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="overflow-hidden rounded-2xl border-gray-200/80 shadow-sm dark:border-gray-800/80">
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-gray-700 dark:text-gray-200">Pólizas</CardTitle>
          </CardHeader>
          <CardContent>
            {policyStats ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <StatRow icon={<ShieldCheck className="h-4 w-4 text-green-500" />} label="Activas" value={policyStats.activePolicies} />
                  <StatRow icon={<XCircle className="h-4 w-4 text-red-500" />} label="Expiradas" value={policyStats.expiredPolicies} />
                  <StatRow icon={<AlertTriangle className="h-4 w-4 text-amber-500" />} label="Por vencer" value={policyStats.expiringSoon} />
                  <StatRow icon={<Ticket className="h-4 w-4 text-gray-500" />} label="Total" value={policyStats.totalPolicies} />
                </div>
                <div className="border-t pt-3 text-sm">
                  <span className="text-muted-foreground">Ingreso mensual total: </span>
                  <span className="font-bold">${policyStats.totalMonthlyRevenue?.toLocaleString("es-MX") ?? 0}</span>
                </div>
              </div>
            ) : (
              <div className="flex h-24 items-center justify-center text-sm text-muted-foreground">Cargando...</div>
            )}
          </CardContent>
        </Card>

        {/* Cumplimiento SLA visual */}
        <Card className="overflow-hidden rounded-2xl border-gray-200/80 shadow-sm dark:border-gray-800/80">
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-gray-700 dark:text-gray-200">Cumplimiento SLA</CardTitle>
          </CardHeader>
          <CardContent>
            {summary ? (
              <div className="space-y-4">
                <div className="flex items-end gap-2">
                  <span className="text-4xl font-extrabold tabular-nums text-gray-900 dark:text-white">
                    {summary.slaCompliancePct?.toFixed(1) ?? 0}%
                  </span>
                  <span className="mb-1 text-sm text-muted-foreground">cumplimiento</span>
                </div>
                <div className="h-3 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                  <div
                    className="h-full rounded-full bg-green-500 transition-all"
                    style={{ width: `${Math.min(100, summary.slaCompliancePct ?? 0)}%` }}
                  />
                </div>
                <div className="grid grid-cols-3 gap-3 text-sm">
                  <StatRow icon={<CheckCircle2 className="h-4 w-4 text-green-500" />} label="OK" value={summary.slaOkTickets} />
                  <StatRow icon={<AlertTriangle className="h-4 w-4 text-amber-500" />} label="Riesgo" value={summary.slaAtRiskTickets} />
                  <StatRow icon={<XCircle className="h-4 w-4 text-red-500" />} label="Vencidos" value={summary.slaBreachedTickets} />
                </div>
              </div>
            ) : (
              <div className="flex h-24 items-center justify-center text-sm text-muted-foreground">Cargando...</div>
            )}
          </CardContent>
        </Card>
      </div>
      </>
      )}
    </div>
  );
}

function StatRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2 dark:bg-gray-800/50">
      {icon}
      <span className="text-gray-600 dark:text-gray-400">{label}</span>
      <span className="ml-auto font-bold tabular-nums text-gray-900 dark:text-white">{value}</span>
    </div>
  );
}
