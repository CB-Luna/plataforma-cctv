"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  Server,
  Camera,
  Search,
  Building2,
  AlertTriangle,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatsCard } from "@/components/ui/stats-card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { listNvrs } from "@/lib/api/nvrs";
import { listCameras } from "@/lib/api/cameras";
import { usePermissions } from "@/hooks/use-permissions";
import { useTenantStore } from "@/stores/tenant-store";
import { getWorkspaceExperience } from "@/lib/auth/workspace-experience";

/* ── Types ── */
interface EquipmentRow {
  id: string;
  type: "nvr" | "camera";
  name: string;
  model: string;
  serial: string;
  site: string;
  brand: string;
  warrantyDate: string | null;
  warrantyStatus: "vigente" | "por_vencer_12" | "por_vencer_6" | "vencida" | "sin_info";
  status: string;
}

function extractStatus(val: unknown): string {
  if (typeof val === "string") return val;
  if (val && typeof val === "object") {
    const obj = val as Record<string, unknown>;
    for (const key of ["inventory_equipment_status", "name", "label", "code", "status"]) {
      if (typeof obj[key] === "string") return obj[key] as string;
    }
  }
  return "active";
}

function classifyWarranty(dateStr: string | null | undefined): EquipmentRow["warrantyStatus"] {
  if (!dateStr) return "sin_info";
  const expiry = new Date(dateStr);
  const now = new Date();
  if (expiry < now) return "vencida";
  const diffMs = expiry.getTime() - now.getTime();
  const diffMonths = diffMs / (1000 * 60 * 60 * 24 * 30);
  if (diffMonths <= 6) return "por_vencer_6";
  if (diffMonths <= 12) return "por_vencer_12";
  return "vigente";
}

const WARRANTY_BADGE: Record<EquipmentRow["warrantyStatus"], { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  vigente: { label: "Vigente", variant: "default" },
  por_vencer_12: { label: "Vence < 12m", variant: "secondary" },
  por_vencer_6: { label: "Vence < 6m", variant: "outline" },
  vencida: { label: "Vencida", variant: "destructive" },
  sin_info: { label: "Sin info", variant: "secondary" },
};

type SortField = "name" | "type" | "warrantyDate" | "status";
type SortDir = "asc" | "desc";

function SortIndicator({ field, active }: { field: SortField; active: SortField }) {
  return (
    <ArrowUpDown className={`ml-1 inline h-3 w-3 ${active === field ? "text-foreground" : "text-muted-foreground/50"}`} />
  );
}

export default function CapexPage() {
  const { permissions, roles } = usePermissions();
  const currentCompany = useTenantStore((s) => s.currentCompany);
  const experience = getWorkspaceExperience({ permissions, roles, company: currentCompany });
  const isPlatformAdmin = experience.mode === "hybrid_backoffice";

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [warrantyFilter, setWarrantyFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<SortField>("warrantyDate");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const { data: nvrs = [], isLoading: nvrLoading, isError: nvrError } = useQuery({
    queryKey: ["nvrs", currentCompany?.id],
    queryFn: listNvrs,
    retry: 1,
    enabled: !isPlatformAdmin || !!currentCompany,
  });

  const { data: cameras = [], isLoading: camLoading, isError: camError } = useQuery({
    queryKey: ["cameras", "all", currentCompany?.id],
    queryFn: () => listCameras({ limit: 1000 }),
    retry: 1,
    enabled: !isPlatformAdmin || !!currentCompany,
  });

  const isLoading = nvrLoading || camLoading;

  /* ── Merge equipment ── */
  const equipment: EquipmentRow[] = useMemo(() => {
    const rows: EquipmentRow[] = [];

    for (const nvr of nvrs) {
      rows.push({
        id: nvr.id,
        type: "nvr",
        name: nvr.name,
        model: nvr.model ?? "—",
        serial: nvr.service_tag ?? "—",
        site: nvr.code ?? "—",
        brand: "",
        warrantyDate: nvr.warranty_expiry_date ?? null,
        warrantyStatus: classifyWarranty(nvr.warranty_expiry_date),
        status: extractStatus(nvr.status),
      });
    }

    for (const cam of cameras) {
      rows.push({
        id: cam.id,
        type: "camera",
        name: cam.name,
        model: cam.camera_model_name ?? "—",
        serial: cam.serial_number ?? "—",
        site: cam.zone ?? cam.area ?? "—",
        brand: "",
        warrantyDate: null,
        warrantyStatus: "sin_info",
        status: extractStatus(cam.status),
      });
    }

    return rows;
  }, [nvrs, cameras]);

  /* ── Stats ── */
  const stats = useMemo(() => {
    const total = equipment.length;
    const vigente = equipment.filter((e) => e.warrantyStatus === "vigente").length;
    const porVencer12 = equipment.filter((e) => e.warrantyStatus === "por_vencer_12").length;
    const porVencer6 = equipment.filter((e) => e.warrantyStatus === "por_vencer_6").length;
    const vencida = equipment.filter((e) => e.warrantyStatus === "vencida").length;
    const sinInfo = equipment.filter((e) => e.warrantyStatus === "sin_info").length;
    return { total, vigente, porVencer12, porVencer6, vencida, sinInfo };
  }, [equipment]);

  /* ── Filtered + sorted ── */
  const filtered = useMemo(() => {
    let rows = equipment;

    if (search) {
      const q = search.toLowerCase();
      rows = rows.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          r.model.toLowerCase().includes(q) ||
          r.serial.toLowerCase().includes(q)
      );
    }
    if (typeFilter !== "all") {
      rows = rows.filter((r) => r.type === typeFilter);
    }
    if (warrantyFilter !== "all") {
      rows = rows.filter((r) => r.warrantyStatus === warrantyFilter);
    }

    rows = [...rows].sort((a, b) => {
      let cmp = 0;
      if (sortField === "name") cmp = a.name.localeCompare(b.name);
      else if (sortField === "type") cmp = a.type.localeCompare(b.type);
      else if (sortField === "status") cmp = a.status.localeCompare(b.status);
      else if (sortField === "warrantyDate") {
        const da = a.warrantyDate ? new Date(a.warrantyDate).getTime() : Infinity;
        const db = b.warrantyDate ? new Date(b.warrantyDate).getTime() : Infinity;
        cmp = da - db;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

    return rows;
  }, [equipment, search, typeFilter, warrantyFilter, sortField, sortDir]);

  function toggleSort(field: SortField) {
    if (sortField === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortField(field); setSortDir("asc"); }
    setPage(1);
  }

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginatedRows = filtered.slice((page - 1) * pageSize, page * pageSize);

  // F9: guardia de contexto — Admin del Sistema sin empresa seleccionada
  if (isPlatformAdmin && !currentCompany) {
    return (
      <EmptyState
        icon={ShieldCheck}
        title="Selecciona una empresa"
        description="Este modulo muestra equipos CAPEX del tenant activo. Selecciona una empresa desde la barra de navegacion para continuar."
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">CAPEX / Gestión de Garantías</h2>
        <p className="text-muted-foreground">
          Control de garantías y vida útil de equipos CCTV.
        </p>
      </div>

      {/* Error banner */}
      {(nvrError || camError) && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="flex items-center gap-3 py-4">
            <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600" />
            <div>
              <p className="text-sm font-medium text-amber-800">No se pudo cargar algunos datos</p>
              <p className="text-xs text-amber-600">Los datos parciales se mostrarán cuando el servicio esté disponible.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <StatsCard title="Total Equipos" value={stats.total} icon={Server} color="blue" />
        <StatsCard title="Garantía Vigente" value={stats.vigente} icon={ShieldCheck} color="green"
          subtitle={stats.vigente > 0 ? `${Math.round((stats.vigente / Math.max(stats.total, 1)) * 100)}%` : "—"} />
        <StatsCard title="Por Vencer (12m)" value={stats.porVencer12} icon={ShieldAlert} color="amber"
          subtitle={stats.porVencer12 > 0 ? "Revisar próximamente" : "Ninguno"} />
        <StatsCard title="Por Vencer (6m)" value={stats.porVencer6} icon={ShieldAlert} color="red"
          subtitle={stats.porVencer6 > 0 ? "Acción requerida" : "Ninguno"} />
        <StatsCard title="Garantía Vencida" value={stats.vencida} icon={ShieldX} color="red"
          subtitle={stats.vencida > 0 ? "Riesgo" : "Todo al día"} />
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Equipos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <div className="relative min-w-55 flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar equipo, modelo o serial..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="pl-9"
              />
            </div>

            <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v ?? "all"); setPage(1); }}>
              <SelectTrigger className="w-40">
                <Building2 className="mr-2 h-4 w-4 text-muted-foreground" />
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                <SelectItem value="nvr">Servidores NVR</SelectItem>
                <SelectItem value="camera">Cámaras</SelectItem>
              </SelectContent>
            </Select>

            <Select value={warrantyFilter} onValueChange={(v) => { setWarrantyFilter(v ?? "all"); setPage(1); }}>
              <SelectTrigger className="w-45">
                <ShieldCheck className="mr-2 h-4 w-4 text-muted-foreground" />
                <SelectValue placeholder="Garantía" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las garantías</SelectItem>
                <SelectItem value="vigente">Vigente</SelectItem>
                <SelectItem value="por_vencer_12">Por vencer (&lt;12m)</SelectItem>
                <SelectItem value="por_vencer_6">Por vencer (&lt;6m)</SelectItem>
                <SelectItem value="vencida">Vencida</SelectItem>
                <SelectItem value="sin_info">Sin información</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={search || typeFilter !== "all" || warrantyFilter !== "all" ? Search : Server}
              title={search || typeFilter !== "all" || warrantyFilter !== "all" ? "Sin resultados" : "Sin equipos"}
              description={
                search || typeFilter !== "all" || warrantyFilter !== "all"
                  ? "No hay equipos que coincidan con los filtros."
                  : "Aún no hay equipos registrados en el inventario."
              }
            />
          ) : (
            <div className="max-h-125 overflow-auto rounded-md border">
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-background">
                  <TableRow>
                    <TableHead className="w-40">
                      <button onClick={() => toggleSort("type")} className="flex items-center font-medium">
                        Tipo <SortIndicator field="type" active={sortField} />
                      </button>
                    </TableHead>
                    <TableHead>
                      <button onClick={() => toggleSort("name")} className="flex items-center font-medium">
                        Equipo <SortIndicator field="name" active={sortField} />
                      </button>
                    </TableHead>
                    <TableHead>Modelo</TableHead>
                    <TableHead>Serial / Tag</TableHead>
                    <TableHead>
                      <button onClick={() => toggleSort("warrantyDate")} className="flex items-center font-medium">
                        Garantía Hasta <SortIndicator field="warrantyDate" active={sortField} />
                      </button>
                    </TableHead>
                    <TableHead>Estado Garantía</TableHead>
                    <TableHead>
                      <button onClick={() => toggleSort("status")} className="flex items-center font-medium">
                        Estado <SortIndicator field="status" active={sortField} />
                      </button>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedRows.map((row) => {
                    const badge = WARRANTY_BADGE[row.warrantyStatus];
                    return (
                      <TableRow key={`${row.type}-${row.id}`}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {row.type === "nvr" ? (
                              <Server className="h-4 w-4 text-blue-500" />
                            ) : (
                              <Camera className="h-4 w-4 text-green-500" />
                            )}
                            <span className="text-xs font-medium uppercase text-muted-foreground">
                              {row.type === "nvr" ? "NVR" : "Cámara"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{row.name}</TableCell>
                        <TableCell className="text-muted-foreground">{row.model}</TableCell>
                        <TableCell className="font-mono text-xs">{row.serial}</TableCell>
                        <TableCell>
                          {row.warrantyDate
                            ? new Date(row.warrantyDate).toLocaleDateString("es-MX", {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              })
                            : "—"}
                        </TableCell>
                        <TableCell>
                          <Badge variant={badge.variant}>{badge.label}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={row.status === "active" ? "default" : "secondary"}>
                            {row.status === "active" ? "Activo" : row.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}

          {!isLoading && filtered.length > 0 && (
            <div className="mt-4 flex flex-col items-center justify-between gap-3 sm:flex-row">
              <p className="text-xs text-muted-foreground">
                Mostrando {Math.min((page - 1) * pageSize + 1, filtered.length)}–{Math.min(page * pageSize, filtered.length)} de {filtered.length} equipos
              </p>
              <div className="flex items-center gap-2">
                <Select
                  value={String(pageSize)}
                  onValueChange={(v) => { setPageSize(Number(v)); setPage(1); }}
                >
                  <SelectTrigger className="h-8 w-20 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10 / pag</SelectItem>
                    <SelectItem value="25">25 / pag</SelectItem>
                    <SelectItem value="50">50 / pag</SelectItem>
                    <SelectItem value="100">100 / pag</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-xs text-muted-foreground">
                  Pag. {page} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
