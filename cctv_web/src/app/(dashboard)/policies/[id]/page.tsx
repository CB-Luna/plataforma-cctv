"use client";

import { use, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Plus, Trash2, FileText, Calendar, DollarSign, Building2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { getPolicy, addPolicyAsset, removePolicyAsset } from "@/lib/api/policies";

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
  const router = useRouter();
  const queryClient = useQueryClient();
  const [assetDialogOpen, setAssetDialogOpen] = useState(false);
  const [equipmentId, setEquipmentId] = useState("");
  const [nvrServerId, setNvrServerId] = useState("");
  const [cameraId, setCameraId] = useState("");
  const [assetNotes, setAssetNotes] = useState("");

  const { data: policy, isLoading } = useQuery({
    queryKey: ["policy", id],
    queryFn: () => getPolicy(id),
  });

  const addAssetMut = useMutation({
    mutationFn: (data: { equipment_id?: string; nvr_server_id?: string; camera_id?: string; notes?: string }) =>
      addPolicyAsset(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["policy", id] });
      toast.success("Activo agregado");
      setAssetDialogOpen(false);
      setEquipmentId("");
      setNvrServerId("");
      setCameraId("");
      setAssetNotes("");
    },
    onError: () => toast.error("Error al agregar activo"),
  });

  const removeAssetMut = useMutation({
    mutationFn: (assetId: string) => removePolicyAsset(id, assetId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["policy", id] });
      toast.success("Activo removido");
    },
    onError: () => toast.error("Error al remover activo"),
  });

  if (isLoading) {
    return <div className="flex items-center justify-center h-64 text-muted-foreground">Cargando...</div>;
  }

  if (!policy) {
    return <div className="flex items-center justify-center h-64 text-muted-foreground">Póliza no encontrada</div>;
  }

  const handleAddAsset = () => {
    const data: { equipment_id?: string; nvr_server_id?: string; camera_id?: string; notes?: string } = {};
    if (equipmentId.trim()) data.equipment_id = equipmentId.trim();
    if (nvrServerId.trim()) data.nvr_server_id = nvrServerId.trim();
    if (cameraId.trim()) data.camera_id = cameraId.trim();
    if (assetNotes.trim()) data.notes = assetNotes.trim();
    addAssetMut.mutate(data);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/policies" className="inline-flex items-center justify-center h-8 w-8 rounded-md border hover:bg-accent">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{policy.policy_number}</h1>
            <span className={`px-2 py-1 rounded text-xs font-medium ${statusColors[policy.status] ?? ""}`}>
              {statusLabels[policy.status] ?? policy.status}
            </span>
          </div>
          <p className="text-muted-foreground">{policy.client_name}</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Info general */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><FileText className="h-4 w-4" /> Información General</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-muted-foreground">Proveedor</dt>
                <dd className="font-medium">{policy.vendor ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Tipo de contrato</dt>
                <dd className="font-medium">{policy.contract_type ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Sitio</dt>
                <dd className="font-medium">{policy.site_name ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Notas</dt>
                <dd className="font-medium">{policy.notes ?? "—"}</dd>
              </div>
              {policy.contract_url && (
                <div className="col-span-2">
                  <dt className="text-muted-foreground">URL del contrato</dt>
                  <dd>
                    <a href={policy.contract_url} target="_blank" rel="noreferrer" className="text-blue-600 underline">
                      {policy.contract_url}
                    </a>
                  </dd>
                </div>
              )}
            </dl>
          </CardContent>
        </Card>

        {/* Financiero */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><DollarSign className="h-4 w-4" /> Financiero</CardTitle>
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
                  <span className="text-muted-foreground">Día de pago</span>
                  <p className="font-medium">{policy.payment_day}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Calendar className="h-4 w-4" /> Vigencia</CardTitle>
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

      {/* Assets */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2"><Building2 className="h-4 w-4" /> Activos Cubiertos</CardTitle>
          <Button size="sm" onClick={() => setAssetDialogOpen(true)}>
            <Plus className="mr-1 h-4 w-4" />
            Agregar
          </Button>
        </CardHeader>
        <CardContent>
          {(!policy.assets || policy.assets.length === 0) ? (
            <p className="text-muted-foreground text-sm">Sin activos asociados</p>
          ) : (
            <div className="space-y-2">
              {policy.assets.map((asset) => (
                <div key={asset.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="text-sm">
                    {asset.equipment_serial && <Badge variant="outline" className="mr-2">Equipo: {asset.equipment_serial}</Badge>}
                    {asset.nvr_name && <Badge variant="outline" className="mr-2">NVR: {asset.nvr_name}</Badge>}
                    {asset.camera_name && <Badge variant="outline" className="mr-2">Cámara: {asset.camera_name}</Badge>}
                    {asset.notes && <span className="text-muted-foreground ml-2">{asset.notes}</span>}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => { if (confirm("¿Remover este activo?")) removeAssetMut.mutate(asset.id); }}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Asset Dialog */}
      <Dialog open={assetDialogOpen} onOpenChange={setAssetDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Agregar Activo</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>ID Equipo</Label>
              <Input value={equipmentId} onChange={(e) => setEquipmentId(e.target.value)} placeholder="UUID del equipo" />
            </div>
            <div className="space-y-2">
              <Label>ID Servidor NVR</Label>
              <Input value={nvrServerId} onChange={(e) => setNvrServerId(e.target.value)} placeholder="UUID del NVR" />
            </div>
            <div className="space-y-2">
              <Label>ID Cámara</Label>
              <Input value={cameraId} onChange={(e) => setCameraId(e.target.value)} placeholder="UUID de la cámara" />
            </div>
            <div className="space-y-2">
              <Label>Notas</Label>
              <Input value={assetNotes} onChange={(e) => setAssetNotes(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssetDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleAddAsset} disabled={addAssetMut.isPending}>
              {addAssetMut.isPending ? "Agregando..." : "Agregar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
