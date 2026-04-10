"use client";

import { useCallback, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import dynamic from "next/dynamic";
import { Building2, Edit2, Info, List, MapIcon, MapPin, Plus, Trash2 } from "lucide-react";
import type { SiteListItem } from "@/types/api";
import { listSites } from "@/lib/api/sites";
import {
  createLocalSite,
  deleteLocalSite,
  listLocalSites,
  updateLocalSite,
  type LocalSite,
} from "@/lib/sites/local-sites-store";
import { useTenantStore } from "@/stores/tenant-store";
import { usePermissions } from "@/hooks/use-permissions";
import { getWorkspaceExperience } from "@/lib/auth/workspace-experience";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Mapa Leaflet lazy-load (requiere browser)
const BranchMap = dynamic(() => import("@/components/map/branch-map"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
      Cargando mapa...
    </div>
  ),
});

// Mini mapa interactivo para seleccionar ubicacion en dialogo
const MiniMapPicker = dynamic(() => import("@/components/map/mini-map-picker"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[220px] items-center justify-center rounded-lg border bg-muted/20 text-sm text-muted-foreground">
      Cargando mapa...
    </div>
  ),
});

// ---------- formulario -------------------------------------------------------

interface SiteFormData {
  name: string;
  client_name: string;
  address: string;
  city: string;
  state: string;
  lat: string;
  lng: string;
}

const EMPTY_FORM: SiteFormData = {
  name: "",
  client_name: "",
  address: "",
  city: "",
  state: "",
  lat: "",
  lng: "",
};

interface SiteDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial?: SiteFormData;
  title: string;
  onSave: (data: SiteFormData) => void;
}

function SiteDialog({ open, onOpenChange, initial, title, onSave }: SiteDialogProps) {
  const [form, setForm] = useState<SiteFormData>(initial ?? EMPTY_FORM);

  // Sincronizar cuando cambia `initial`
  useMemo(() => {
    if (open) setForm(initial ?? EMPTY_FORM);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const set = (field: keyof SiteFormData) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSave = () => {
    if (!form.name.trim()) return;
    onSave(form);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label>
                Nombre de la sucursal <span className="text-destructive">*</span>
              </Label>
              <Input
                className="mt-1"
                placeholder="Ej: Sucursal Norte"
                value={form.name}
                onChange={set("name")}
              />
            </div>

            <div>
              <Label>Cliente / Empresa</Label>
              <Input
                className="mt-1"
                placeholder="Ej: Calimax"
                value={form.client_name}
                onChange={set("client_name")}
              />
            </div>

            <div>
              <Label>Estado</Label>
              <Input
                className="mt-1"
                placeholder="Ej: Baja California"
                value={form.state}
                onChange={set("state")}
              />
            </div>

            <div className="sm:col-span-2">
              <Label>Direccion</Label>
              <Input
                className="mt-1"
                placeholder="Ej: Av. Constituyentes 1234"
                value={form.address}
                onChange={set("address")}
              />
            </div>

            <div>
              <Label>Ciudad</Label>
              <Input
                className="mt-1"
                placeholder="Ej: Tijuana"
                value={form.city}
                onChange={set("city")}
              />
            </div>
          </div>

          {/* Coordenadas + mini mapa interactivo */}
          <div className="rounded-lg border bg-muted/40 p-3">
            <p className="mb-3 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" />
              Ubicacion en el mapa — haz clic para colocar el marcador
            </p>
            <div className="h-[220px] overflow-hidden rounded-lg border">
              <MiniMapPicker
                lat={form.lat ? parseFloat(form.lat) : undefined}
                lng={form.lng ? parseFloat(form.lng) : undefined}
                onPositionChange={(lat, lng) => {
                  setForm((f) => ({
                    ...f,
                    lat: lat.toFixed(6),
                    lng: lng.toFixed(6),
                  }));
                }}
              />
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div>
                <Label>Latitud</Label>
                <Input
                  className="mt-1 font-mono text-sm"
                  placeholder="Ej: 32.5149"
                  type="number"
                  step="any"
                  value={form.lat}
                  onChange={set("lat")}
                />
              </div>
              <div>
                <Label>Longitud</Label>
                <Input
                  className="mt-1 font-mono text-sm"
                  placeholder="Ej: -117.0382"
                  type="number"
                  step="any"
                  value={form.lng}
                  onChange={set("lng")}
                />
              </div>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Tambien puedes escribir las coordenadas manualmente.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button disabled={!form.name.trim()} onClick={handleSave}>
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------- pagina -----------------------------------------------------------

type CombinedSite = (SiteListItem & { isLocal?: false }) | LocalSite;

export default function SitesPage() {
  const [localSites, setLocalSites] = useState<LocalSite[]>(() => listLocalSites());
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<LocalSite | null>(null);
  const [viewMode, setViewMode] = useState<"table" | "map">("table");

  const currentCompany = useTenantStore((s) => s.currentCompany);
  const { permissions, roles } = usePermissions();
  const experience = getWorkspaceExperience({ permissions, roles, company: currentCompany });
  const isPlatformAdmin = experience.mode === "hybrid_backoffice";

  const { data: apiSites = [], isLoading } = useQuery<SiteListItem[]>({
    queryKey: ["sites"],
    queryFn: listSites,
    retry: false,
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: false,
    enabled: !isPlatformAdmin || !!currentCompany,
  });

  const allSites = useMemo<CombinedSite[]>(() => {
    return [...apiSites, ...localSites];
  }, [apiSites, localSites]);

  const refreshLocal = useCallback(() => {
    setLocalSites(listLocalSites());
  }, []);

  const handleCreate = useCallback(
    (data: SiteFormData) => {
      createLocalSite({
        name: data.name.trim(),
        client_name: data.client_name.trim() || undefined,
        address: data.address.trim() || undefined,
        city: data.city.trim() || undefined,
        state: data.state.trim() || undefined,
        lat: data.lat ? parseFloat(data.lat) : undefined,
        lng: data.lng ? parseFloat(data.lng) : undefined,
      });
      refreshLocal();
      setCreateOpen(false);
    },
    [refreshLocal],
  );

  const handleUpdate = useCallback(
    (data: SiteFormData) => {
      if (!editTarget) return;
      updateLocalSite(editTarget.id, {
        name: data.name.trim(),
        client_name: data.client_name.trim() || undefined,
        address: data.address.trim() || undefined,
        city: data.city.trim() || undefined,
        state: data.state.trim() || undefined,
        lat: data.lat ? parseFloat(data.lat) : undefined,
        lng: data.lng ? parseFloat(data.lng) : undefined,
      });
      refreshLocal();
      setEditTarget(null);
    },
    [editTarget, refreshLocal],
  );

  const handleDelete = useCallback(
    (id: string) => {
      if (!confirm("Eliminar esta sucursal local?")) return;
      deleteLocalSite(id);
      refreshLocal();
    },
    [refreshLocal],
  );

  const editInitial = editTarget
    ? {
        name: editTarget.name,
        client_name: editTarget.client_name ?? "",
        address: editTarget.address ?? "",
        city: editTarget.city ?? "",
        state: editTarget.state ?? "",
        lat: editTarget.lat != null ? String(editTarget.lat) : "",
        lng: editTarget.lng != null ? String(editTarget.lng) : "",
      }
    : undefined;

  return (
    <div className="space-y-5">
      {/* Guard: Admin del Sistema sin empresa seleccionada */}
      {isPlatformAdmin && !currentCompany ? (
        <>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Sucursales</h1>
            <p className="text-sm text-muted-foreground">
              Gestiona las ubicaciones de cada empresa.
            </p>
          </div>
          <EmptyState
            icon={Building2}
            title="Selecciona una empresa"
            description="Para ver las sucursales, primero selecciona una empresa desde Configuracion."
          />
        </>
      ) : (
        <>
      {/* Encabezado */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Sucursales</h1>
          <p className="text-sm text-muted-foreground">
            Gestiona las ubicaciones de tu empresa. Las sucursales creadas aqui se guardan
            localmente y aparecen en el mapa con sus coordenadas.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Toggle vista tabla / mapa */}
          <div className="flex rounded-md border">
            <Button
              size="sm"
              variant={viewMode === "table" ? "default" : "ghost"}
              className="rounded-r-none"
              onClick={() => setViewMode("table")}
            >
              <List className="mr-1.5 h-4 w-4" />
              Tabla
            </Button>
            <Button
              size="sm"
              variant={viewMode === "map" ? "default" : "ghost"}
              className="rounded-l-none"
              onClick={() => setViewMode("map")}
            >
              <MapIcon className="mr-1.5 h-4 w-4" />
              Mapa
            </Button>
          </div>
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="mr-1.5 h-4 w-4" />
            Nueva sucursal
          </Button>
        </div>
      </div>

      {/* Banner GAP-01: creacion de sucursales en modo preparacion */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-2.5 dark:border-blue-800 dark:bg-blue-950/30">
        <p className="flex items-center gap-2 text-xs text-blue-700 dark:text-blue-300">
          <Info className="h-3.5 w-3.5 shrink-0" />
          <span>
            <strong>Modo preparacion:</strong> La creacion y edicion de sucursales se guarda
            localmente en este dispositivo. La persistencia en servidor estara disponible
            proximamente.
          </span>
        </p>
      </div>

      {/* Vista Tabla */}
      {viewMode === "table" && (
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Ubicacion</TableHead>
                  <TableHead className="text-center">Camaras</TableHead>
                  <TableHead className="text-center">NVRs</TableHead>
                  <TableHead className="text-center">Coordenadas</TableHead>
                  <TableHead className="w-24"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && (
                  <TableRow>
                    <TableCell colSpan={7} className="py-10 text-center text-sm text-muted-foreground">
                      Cargando sucursales...
                    </TableCell>
                  </TableRow>
                )}
                {!isLoading && allSites.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="py-16 text-center">
                      <Building2 className="mx-auto mb-3 h-10 w-10 text-muted-foreground/30" />
                      <p className="text-sm font-medium text-muted-foreground">
                        No hay sucursales registradas
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Crea tu primera sucursal con el boton superior
                      </p>
                    </TableCell>
                  </TableRow>
                )}
                {allSites.map((site) => {
                  const isLocal = "isLocal" in site && site.isLocal;
                  const lat = isLocal ? (site as LocalSite).lat : undefined;
                  const lng = isLocal ? (site as LocalSite).lng : undefined;
                  return (
                    <TableRow key={site.id}>
                      <TableCell>
                        <div className="flex items-center gap-1.5 font-medium">
                          {site.name}
                          {isLocal && (
                            <Badge
                              variant="outline"
                              className="border-amber-400 text-[10px] text-amber-600"
                            >
                              local
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {site.client_name ?? "—"}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {site.address ?? "—"}
                          {site.city && (
                            <span className="ml-1 text-muted-foreground">{site.city}</span>
                          )}
                          {site.state && (
                            <span className="ml-1 text-muted-foreground">, {site.state}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center text-sm">
                        {site.camera_count ?? 0}
                      </TableCell>
                      <TableCell className="text-center text-sm">
                        {site.nvr_count ?? 0}
                      </TableCell>
                      <TableCell className="text-center">
                        {lat != null && lng != null ? (
                          <span className="inline-flex items-center gap-1 text-xs text-emerald-600">
                            <MapPin className="h-3 w-3" />
                            {lat.toFixed(4)}, {lng.toFixed(4)}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">Sin coordenadas</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {isLocal ? (
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7"
                              onClick={() => setEditTarget(site as LocalSite)}
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 text-destructive hover:text-destructive"
                              onClick={() => handleDelete(site.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground/60">Solo lectura</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      )}

      {/* Vista Mapa */}
      {viewMode === "map" && (
        allSites.length > 0 ? (
        <Card>
          <CardContent className="h-[calc(100vh-280px)] min-h-[400px] p-0 overflow-hidden rounded-xl">
            <BranchMap sites={allSites.map((s) => ({
              id: s.id,
              name: s.name,
              client_name: s.client_name,
              address: s.address,
              city: s.city,
              state: s.state,
              camera_count: s.camera_count ?? 0,
              nvr_count: s.nvr_count ?? 0,
              has_floor_plan: false,
            }))} filterClient="" />
          </CardContent>
        </Card>
        ) : (
        <Card>
          <CardContent className="py-16 text-center">
            <MapIcon className="mx-auto mb-3 h-10 w-10 text-muted-foreground/30" />
            <p className="text-sm font-medium text-muted-foreground">
              No hay sucursales para mostrar en el mapa
            </p>
          </CardContent>
        </Card>
        )
      )}

      {/* Dialogo crear */}
      <SiteDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        title="Nueva sucursal"
        onSave={handleCreate}
      />

      {/* Dialogo editar */}
      <SiteDialog
        open={!!editTarget}
        onOpenChange={(v) => { if (!v) setEditTarget(null); }}
        initial={editInitial}
        title="Editar sucursal"
        onSave={handleUpdate}
      />
        </>
      )}
    </div>
  );
}
