"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import {
  Building2,
  ChevronLeft,
  ChevronRight,
  Edit2,
  Info,
  List,
  MapIcon,
  MapPin,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { useTenantStore } from "@/stores/tenant-store";
import { useSiteStore } from "@/stores/site-store";
import { usePermissions } from "@/hooks/use-permissions";
import { getWorkspaceExperience } from "@/lib/auth/workspace-experience";
import { useAllSites } from "@/hooks/use-all-sites";
import {
  createLocalSite,
  deleteLocalSite,
  updateLocalSite,
  type LocalSite,
} from "@/lib/sites/local-sites-store";
import { buildSiteSignature, getSiteCompanyLabel, resolvePersistedSiteId } from "@/lib/site-context";
import type { SiteListItem } from "@/types/api";
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

const BranchMap = dynamic(() => import("@/components/map/branch-map"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
      Cargando mapa...
    </div>
  ),
});

const MiniMapPicker = dynamic(() => import("@/components/map/mini-map-picker"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[220px] items-center justify-center rounded-lg border bg-muted/20 text-sm text-muted-foreground">
      Cargando mapa...
    </div>
  ),
});

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
  onOpenChange: (value: boolean) => void;
  initial?: SiteFormData;
  title: string;
  onSave: (data: SiteFormData) => void;
  showClientField?: boolean;
}

function SiteDialog({ open, onOpenChange, initial, title, onSave, showClientField = false }: SiteDialogProps) {
  const [form, setForm] = useState<SiteFormData>(initial ?? EMPTY_FORM);

  useEffect(() => {
    if (open) setForm(initial ?? EMPTY_FORM);
  }, [initial, open]);

  const setField = (field: keyof SiteFormData) => (event: React.ChangeEvent<HTMLInputElement>) =>
    setForm((current) => ({ ...current, [field]: event.target.value }));

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
                onChange={setField("name")}
              />
            </div>

            {showClientField ? (
              <div>
                <Label>Cliente / Empresa</Label>
                <Input
                  className="mt-1"
                  placeholder="Ej: Calimax"
                  value={form.client_name}
                  onChange={setField("client_name")}
                />
              </div>
            ) : null}

            <div>
              <Label>Estado</Label>
              <Input
                className="mt-1"
                placeholder="Ej: Baja California"
                value={form.state}
                onChange={setField("state")}
              />
            </div>

            <div className="sm:col-span-2">
              <Label>Direccion</Label>
              <Input
                className="mt-1"
                placeholder="Ej: Av. Constituyentes 1234"
                value={form.address}
                onChange={setField("address")}
              />
            </div>

            <div>
              <Label>Ciudad</Label>
              <Input
                className="mt-1"
                placeholder="Ej: Tijuana"
                value={form.city}
                onChange={setField("city")}
              />
            </div>
          </div>

          <div className="rounded-lg border bg-muted/40 p-3">
            <p className="mb-3 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" />
              Ubicacion en el mapa / haz clic para colocar el marcador
            </p>

            <div className="h-[220px] overflow-hidden rounded-lg border">
              <MiniMapPicker
                lat={form.lat ? parseFloat(form.lat) : undefined}
                lng={form.lng ? parseFloat(form.lng) : undefined}
                onPositionChange={(lat, lng) => {
                  setForm((current) => ({
                    ...current,
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
                  onChange={setField("lat")}
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
                  onChange={setField("lng")}
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
          <Button disabled={!form.name.trim()} onClick={() => onSave(form)}>
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function toEditableLocalSite(site: SiteListItem): LocalSite {
  return {
    id: site.id,
    name: site.name,
    address: site.address,
    city: site.city,
    state: site.state,
    client_name: site.client_name,
    lat: site.lat,
    lng: site.lng,
    camera_count: site.camera_count,
    nvr_count: site.nvr_count,
    createdAt: new Date().toISOString(),
    company_id: site.company_id,
    isLocal: true,
  };
}

export default function SitesPage() {
  const currentCompany = useTenantStore((state) => state.currentCompany);
  const currentSite = useSiteStore((state) => state.currentSite);
  const { permissions, roles } = usePermissions();
  const experience = getWorkspaceExperience({ permissions, roles, company: currentCompany });
  const isPlatformAdmin = experience.mode === "hybrid_backoffice";
  const isAllCompaniesView = isPlatformAdmin && !currentCompany;
  const canMutateSites = Boolean(currentCompany);

  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<LocalSite | null>(null);
  const [viewMode, setViewMode] = useState<"table" | "map">("table");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const { sites: allSites, isLoading } = useAllSites({ enabled: true });

  const scopedSites = useMemo(() => {
    if (!currentSite) return allSites;

    const currentSignature = buildSiteSignature(currentSite);
    const persistedSiteId = resolvePersistedSiteId(currentSite);

    return allSites.filter((site) =>
      site.id === currentSite.id
      || (persistedSiteId ? site.id === persistedSiteId : false)
      || (currentSignature !== "" && buildSiteSignature(site) === currentSignature),
    );
  }, [allSites, currentSite]);

  const filtered = useMemo(() => {
    if (!search.trim()) return scopedSites;

    const query = search.toLowerCase();
    return scopedSites.filter((site) =>
      site.name.toLowerCase().includes(query)
      || getSiteCompanyLabel(site).toLowerCase().includes(query)
      || site.address?.toLowerCase().includes(query)
      || site.city?.toLowerCase().includes(query),
    );
  }, [scopedSites, search]);

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paged = useMemo(
    () => filtered.slice((page - 1) * pageSize, page * pageSize),
    [filtered, page, pageSize],
  );

  const handleCreate = useCallback((data: SiteFormData) => {
    if (!currentCompany?.id) return;

    createLocalSite({
      name: data.name.trim(),
      client_name: data.client_name.trim() || currentCompany.name,
      address: data.address.trim() || undefined,
      city: data.city.trim() || undefined,
      state: data.state.trim() || undefined,
      lat: data.lat ? parseFloat(data.lat) : undefined,
      lng: data.lng ? parseFloat(data.lng) : undefined,
      company_id: currentCompany.id,
    });
    setCreateOpen(false);
  }, [currentCompany]);

  const handleUpdate = useCallback((data: SiteFormData) => {
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
    setEditTarget(null);
  }, [editTarget]);

  const handleDelete = useCallback((id: string) => {
    if (!confirm("Eliminar esta sucursal local?")) return;
    deleteLocalSite(id);
  }, []);

  const editInitial = editTarget ? {
    name: editTarget.name,
    client_name: editTarget.client_name ?? "",
    address: editTarget.address ?? "",
    city: editTarget.city ?? "",
    state: editTarget.state ?? "",
    lat: editTarget.lat != null ? String(editTarget.lat) : "",
    lng: editTarget.lng != null ? String(editTarget.lng) : "",
  } : undefined;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Sucursales</h1>
          <p className="text-sm text-muted-foreground">
            {isAllCompaniesView
              ? "Vista agregada de sucursales de todas las empresas."
              : "Gestiona las ubicaciones de la empresa activa y revisa su cobertura en mapa."}
          </p>
        </div>
        <div className="flex items-center gap-2">
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
          {canMutateSites ? (
            <Button size="sm" onClick={() => setCreateOpen(true)}>
              <Plus className="mr-1.5 h-4 w-4" />
              Nueva sucursal
            </Button>
          ) : null}
        </div>
      </div>

      <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-2.5 dark:border-blue-800 dark:bg-blue-950/30">
        <p className="flex items-center gap-2 text-xs text-blue-700 dark:text-blue-300">
          <Info className="h-3.5 w-3.5 shrink-0" />
          <span>
            {isAllCompaniesView
              ? "Vista de inspeccion global: aqui se consolidan sucursales de API y locales sin duplicar la misma sede."
              : "Modo preparacion: las sucursales locales se guardan en este dispositivo y se reconcilian con las del servidor cuando representan la misma sede."}
          </span>
        </p>
      </div>

      {viewMode === "table" ? (
        <Card>
          <CardContent className="space-y-3 p-4">
            <div className="relative max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre, empresa o direccion..."
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
                className="h-9 pl-9 text-sm"
              />
            </div>

            <div className="max-h-125 overflow-auto rounded-lg border">
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-background">
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>{isAllCompaniesView ? "Empresa" : "Cliente"}</TableHead>
                    <TableHead>Ubicacion</TableHead>
                    <TableHead className="text-center">Camaras</TableHead>
                    <TableHead className="text-center">NVRs</TableHead>
                    <TableHead className="text-center">Coordenadas</TableHead>
                    <TableHead className="w-24"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="py-10 text-center text-sm text-muted-foreground">
                        Cargando sucursales...
                      </TableCell>
                    </TableRow>
                  ) : null}

                  {!isLoading && filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="py-16 text-center">
                        <Building2 className="mx-auto mb-3 h-10 w-10 text-muted-foreground/30" />
                        <p className="text-sm font-medium text-muted-foreground">
                          {scopedSites.length === 0 ? "No hay sucursales registradas" : "Sin resultados para la busqueda"}
                        </p>
                        {scopedSites.length === 0 ? (
                          <p className="mt-1 text-xs text-muted-foreground">
                            {isAllCompaniesView
                              ? "Cuando existan sucursales de empresas reales o locales, apareceran aqui."
                              : "Crea tu primera sucursal o importa inventario para verlas aqui."}
                          </p>
                        ) : null}
                      </TableCell>
                    </TableRow>
                  ) : null}

                  {paged.map((site) => {
                    const isLocalOnly = Boolean(site.is_local && !site.server_site_id);
                    return (
                      <TableRow key={site.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
                              <Building2 className="h-4 w-4" />
                            </div>
                            <div className="flex items-center gap-1.5 font-medium">
                              {site.name}
                              {isLocalOnly ? (
                                <Badge variant="outline" className="border-amber-400 text-[10px] text-amber-600">
                                  local
                                </Badge>
                              ) : null}
                            </div>
                          </div>
                        </TableCell>

                        <TableCell className="text-sm text-muted-foreground">
                          {getSiteCompanyLabel(site)}
                        </TableCell>

                        <TableCell>
                          <div className="text-sm">
                            {site.address ?? "-"}
                            {site.city ? <span className="ml-1 text-muted-foreground">{site.city}</span> : null}
                            {site.state ? <span className="ml-1 text-muted-foreground">, {site.state}</span> : null}
                          </div>
                        </TableCell>

                        <TableCell className="text-center text-sm">{site.camera_count ?? 0}</TableCell>
                        <TableCell className="text-center text-sm">{site.nvr_count ?? 0}</TableCell>

                        <TableCell className="text-center">
                          {typeof site.lat === "number" && typeof site.lng === "number" ? (
                            <span className="inline-flex items-center gap-1 text-xs text-emerald-600">
                              <MapPin className="h-3 w-3" />
                              {site.lat.toFixed(4)}, {site.lng.toFixed(4)}
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">Sin coordenadas</span>
                          )}
                        </TableCell>

                        <TableCell>
                          {canMutateSites && isLocalOnly ? (
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7"
                                onClick={() => setEditTarget(toEditableLocalSite(site))}
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

            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>Mostrar</span>
                <Select
                  value={String(pageSize)}
                  onValueChange={(value) => {
                    setPageSize(Number(value ?? pageSize));
                    setPage(1);
                  }}
                >
                  <SelectTrigger className="h-7 w-17.5 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[10, 25, 50, 100].map((size) => (
                      <SelectItem key={size} value={String(size)}>
                        {size}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <span>de {filtered.length}</span>
              </div>

              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-7 w-7"
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="px-2 text-xs text-muted-foreground">
                  {page} / {totalPages || 1}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-7 w-7"
                  disabled={page >= totalPages}
                  onClick={() => setPage(page + 1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        scopedSites.length > 0 ? (
          <Card>
            <CardContent className="h-[calc(100vh-280px)] min-h-[400px] overflow-hidden rounded-xl p-0">
              <BranchMap
                sites={scopedSites}
                filterClient=""
                companyLogo={currentCompany?.logo_url ?? null}
                companyName={currentCompany?.name ?? null}
              />
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

      <SiteDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        title="Nueva sucursal"
        onSave={handleCreate}
      />

      <SiteDialog
        open={Boolean(editTarget)}
        onOpenChange={(value) => {
          if (!value) setEditTarget(null);
        }}
        initial={editInitial}
        title="Editar sucursal"
        onSave={handleUpdate}
      />
    </div>
  );
}
