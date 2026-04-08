"use client";

import { use, useMemo, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Building2,
  Calendar,
  DollarSign,
  FileText,
  Plus,
  Shield,
  TicketIcon,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { listCameras } from "@/lib/api/cameras";
import { listNvrs } from "@/lib/api/nvrs";
import { getPolicy, addPolicyAsset, removePolicyAsset } from "@/lib/api/policies";
import { listTickets } from "@/lib/api/tickets";
import { SiteContextBanner } from "@/components/context/site-context-banner";
import { PolicyCoverageSummary } from "@/components/contracts/policy-coverage-summary";
import { CoverageStatusBadge, SlaStatusBadge } from "@/components/contracts/status-badges";
import type { SiteListItem } from "@/types/api";

const statusLabels: Record<string, string> = {
  active: "Activa",
  expired: "Expirada",
  suspended: "Suspendida",
  cancelled: "Cancelada",
};

const statusColors: Record<string, string> = {
  active: "bg-green-100 text-green-800",
  expired: "bg-amber-100 text-amber-800",
  suspended: "bg-gray-100 text-gray-800",
  cancelled: "bg-red-100 text-red-800",
};

export default function PolicyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const queryClient = useQueryClient();
  const [assetDialogOpen, setAssetDialogOpen] = useState(false);
  const [nvrServerId, setNvrServerId] = useState("");
  const [cameraId, setCameraId] = useState("");
  const [assetNotes, setAssetNotes] = useState("");

  const { data: policy, isLoading } = useQuery({
    queryKey: ["policy", id],
    queryFn: () => getPolicy(id),
  });

  const { data: nvrs = [] } = useQuery({
    queryKey: ["nvrs", "policy-assets"],
    queryFn: listNvrs,
    staleTime: 5 * 60 * 1000,
  });

  const { data: cameras = [] } = useQuery({
    queryKey: ["cameras", "policy-assets"],
    queryFn: () => listCameras({ limit: 500 }),
    staleTime: 5 * 60 * 1000,
  });

  const { data: tickets = [] } = useQuery({
    queryKey: ["tickets", "policy-detail"],
    queryFn: () => listTickets({ limit: 200 }),
    staleTime: 60 * 1000,
  });

  const siteSnapshot: SiteListItem | null = useMemo(() => {
    if (!policy?.site_id) return null;

    return {
      id: policy.site_id,
      name: policy.site_name ?? "Sitio",
      client_name: policy.client_name,
      camera_count: 0,
      nvr_count: 0,
      has_floor_plan: false,
    };
  }, [policy]);

  const availableNvrs = useMemo(() => {
    if (!policy?.site_id) return nvrs;
    return nvrs.filter((nvr) => nvr.site_id === policy.site_id);
  }, [nvrs, policy?.site_id]);

  const availableCameras = useMemo(() => {
    if (!policy?.site_id) return cameras;
    return cameras.filter((camera) => camera.site_id === policy.site_id);
  }, [cameras, policy?.site_id]);

  const relatedTickets = useMemo(
    () => tickets.filter((ticket) => ticket.policy_id === id),
    [id, tickets],
  );

  const addAssetMutation = useMutation({
    mutationFn: (data: { nvr_server_id?: string; camera_id?: string; notes?: string }) =>
      addPolicyAsset(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["policy", id] });
      toast.success("Activo agregado");
      setAssetDialogOpen(false);
      setNvrServerId("");
      setCameraId("");
      setAssetNotes("");
    },
    onError: () => toast.error("Error al agregar activo"),
  });

  const removeAssetMutation = useMutation({
    mutationFn: (assetId: string) => removePolicyAsset(id, assetId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["policy", id] });
      toast.success("Activo removido");
    },
    onError: () => toast.error("Error al remover activo"),
  });

  if (isLoading) {
    return <div className="flex h-64 items-center justify-center text-muted-foreground">Cargando...</div>;
  }

  if (!policy) {
    return <div className="flex h-64 items-center justify-center text-muted-foreground">Poliza no encontrada</div>;
  }

  const handleAddAsset = () => {
    const data: { nvr_server_id?: string; camera_id?: string; notes?: string } = {};

    if (nvrServerId.trim()) data.nvr_server_id = nvrServerId.trim();
    if (cameraId.trim()) data.camera_id = cameraId.trim();
    if (assetNotes.trim()) data.notes = assetNotes.trim();

    if (!data.nvr_server_id && !data.camera_id) {
      toast.error("Selecciona al menos una camara o un NVR para agregarlo a la poliza");
      return;
    }

    addAssetMutation.mutate(data);
  };

  return (
    <div className="space-y-6">
      <SiteContextBanner
        site={siteSnapshot}
        title="Cobertura operativa de la poliza"
        description="Los activos cubiertos se filtran por el sitio ligado a la poliza cuando existe. El catalogo de equipos genericos queda diferido hasta tener endpoint dedicado."
      />

      <div className="flex items-center gap-4">
        <Link
          href="/policies"
          className="inline-flex h-8 w-8 items-center justify-center rounded-md border hover:bg-accent"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{policy.policy_number}</h1>
            <span className={`rounded px-2 py-1 text-xs font-medium ${statusColors[policy.status] ?? ""}`}>
              {statusLabels[policy.status] ?? policy.status}
            </span>
          </div>
          <p className="text-muted-foreground">{policy.client_name}</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Informacion general
            </CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-muted-foreground">Proveedor</dt>
                <dd className="font-medium">{policy.vendor ?? "-"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Tipo de contrato</dt>
                <dd className="font-medium">{policy.contract_type ?? "-"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Sitio</dt>
                <dd className="font-medium">{policy.site_name ?? "Cobertura cliente"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Notas</dt>
                <dd className="font-medium">{policy.notes ?? "-"}</dd>
              </div>
              {policy.contract_url && (
                <div className="col-span-2">
                  <dt className="text-muted-foreground">URL del contrato</dt>
                  <dd>
                    <a
                      href={policy.contract_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-600 underline"
                    >
                      {policy.contract_url}
                    </a>
                  </dd>
                </div>
              )}
            </dl>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Financiero
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <span className="text-muted-foreground">Pago mensual</span>
                <p className="text-lg font-bold">${policy.monthly_payment.toLocaleString("es-MX")}</p>
              </div>
              {policy.annual_value != null && (
                <div>
                  <span className="text-muted-foreground">Valor anual</span>
                  <p className="font-medium">${policy.annual_value.toLocaleString("es-MX")}</p>
                </div>
              )}
              {policy.payment_day != null && (
                <div>
                  <span className="text-muted-foreground">Dia de pago</span>
                  <p className="font-medium">{policy.payment_day}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Vigencia
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div>
                <span className="text-muted-foreground">Inicio</span>
                <p className="font-medium">{policy.start_date}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Fin</span>
                <p className="font-medium">{policy.end_date}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center gap-2">
            <Shield className="h-4 w-4" />
            <CardTitle className="text-base">Cobertura declarada</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <PolicyCoverageSummary policy={policy} />
            <div className="rounded-lg border border-dashed border-sky-300 bg-sky-50 px-3 py-2 text-xs text-sky-800">
              La poliza fija cobertura y alcance. El SLA se aplica despues en tickets segun tipo y prioridad.
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center gap-2">
            <TicketIcon className="h-4 w-4" />
            <CardTitle className="text-base">Tickets ligados</CardTitle>
          </CardHeader>
          <CardContent>
            {relatedTickets.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Todavia no hay tickets visibles ligados a esta poliza dentro del limite de consulta actual.
              </p>
            ) : (
              <div className="space-y-3">
                {relatedTickets.map((ticket) => (
                  <Link
                    key={ticket.id}
                    href={`/tickets/${ticket.id}`}
                    className="flex items-start justify-between rounded-lg border p-3 transition-colors hover:bg-accent"
                  >
                    <div className="space-y-1">
                      <p className="font-medium">{ticket.ticket_number}</p>
                      <p className="text-sm text-muted-foreground">{ticket.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {ticket.site_name ?? "Sin sitio"} · {ticket.client_name ?? "Sin cliente"}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <CoverageStatusBadge status={ticket.coverage_status} />
                      <SlaStatusBadge status={ticket.sla_status} />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Activos cubiertos
          </CardTitle>
          <Button size="sm" onClick={() => setAssetDialogOpen(true)}>
            <Plus className="mr-1 h-4 w-4" />
            Agregar
          </Button>
        </CardHeader>
        <CardContent>
          {!policy.assets || policy.assets.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin activos asociados</p>
          ) : (
            <div className="space-y-2">
              {policy.assets.map((asset) => (
                <div key={asset.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div className="text-sm">
                    {asset.nvr_name && (
                      <Badge variant="outline" className="mr-2">
                        NVR: {asset.nvr_name}
                      </Badge>
                    )}
                    {asset.camera_name && (
                      <Badge variant="outline" className="mr-2">
                        Camara: {asset.camera_name}
                      </Badge>
                    )}
                    {asset.equipment_serial && (
                      <Badge variant="outline" className="mr-2">
                        Equipo: {asset.equipment_serial}
                      </Badge>
                    )}
                    {asset.notes && <span className="ml-2 text-muted-foreground">{asset.notes}</span>}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (confirm("Remover este activo?")) {
                        removeAssetMutation.mutate(asset.id);
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={assetDialogOpen} onOpenChange={setAssetDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Agregar activo cubierto</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Servidor NVR</Label>
              <Select
                value={nvrServerId || "__none__"}
                onValueChange={(value) => setNvrServerId(value && value !== "__none__" ? value : "")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un NVR" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Sin NVR</SelectItem>
                  {availableNvrs.map((nvr) => (
                    <SelectItem key={nvr.id} value={nvr.id}>
                      {nvr.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Camara</Label>
              <Select
                value={cameraId || "__none__"}
                onValueChange={(value) => setCameraId(value && value !== "__none__" ? value : "")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una camara" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Sin camara</SelectItem>
                  {availableCameras.map((camera) => (
                    <SelectItem key={camera.id} value={camera.id}>
                      {camera.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Notas</Label>
              <Textarea value={assetNotes} onChange={(event) => setAssetNotes(event.target.value)} rows={3} />
            </div>

            <div className="rounded-md border border-dashed border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800">
              La asociacion manual por `equipment_id` se mantiene diferida porque no existe un catalogo navegable real de equipos genericos en el backend actual.
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssetDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddAsset} disabled={addAssetMutation.isPending}>
              {addAssetMutation.isPending ? "Agregando..." : "Agregar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
