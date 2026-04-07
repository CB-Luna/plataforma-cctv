"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listCameras, getCameraStats, createCamera, updateCamera, deleteCamera } from "@/lib/api/cameras";
import type { Camera } from "@/types/api";
import { DataTable } from "@/components/data-table";
import { getColumns } from "./columns";
import { CameraDialog, type CameraFormValues } from "./camera-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Plus, Camera as CameraIcon, Activity, Eye, Search } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { ExportButton } from "@/components/shared/export-button";
import { toast } from "sonner";
import { searchCameras } from "@/lib/api/cameras";

export default function CamerasPage() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCamera, setEditingCamera] = useState<Camera | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Camera[] | null>(null);

  const { data: cameras = [], isLoading } = useQuery({
    queryKey: ["cameras"],
    queryFn: () => listCameras({ limit: 200 }),
  });

  const { data: stats } = useQuery({
    queryKey: ["cameras", "stats"],
    queryFn: getCameraStats,
  });

  const createMutation = useMutation({
    mutationFn: createCamera,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cameras"] });
      toast.success("Cámara creada correctamente");
      setDialogOpen(false);
    },
    onError: () => toast.error("Error al crear la cámara"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: CameraFormValues }) =>
      updateCamera(id, data as Parameters<typeof updateCamera>[1]),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cameras"] });
      toast.success("Cámara actualizada correctamente");
      setDialogOpen(false);
      setEditingCamera(null);
    },
    onError: () => toast.error("Error al actualizar la cámara"),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCamera,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cameras"] });
      toast.success("Cámara eliminada correctamente");
    },
    onError: () => toast.error("Error al eliminar la cámara"),
  });

  const columns = getColumns({
    onEdit: (camera) => {
      setEditingCamera(camera);
      setDialogOpen(true);
    },
    onDelete: (camera) => {
      if (confirm(`¿Eliminar la cámara "${camera.name}"?`)) {
        deleteMutation.mutate(camera.id);
      }
    },
    onView: (camera) => {
      router.push(`/cameras/${camera.id}`);
    },
  });

  async function handleSubmit(data: CameraFormValues) {
    if (editingCamera) {
      await updateMutation.mutateAsync({ id: editingCamera.id, data });
    } else {
      await createMutation.mutateAsync(data as Parameters<typeof createCamera>[0]);
    }
  }

  async function handleSearch() {
    if (!searchQuery.trim()) {
      setSearchResults(null);
      return;
    }
    setIsSearching(true);
    try {
      const results = await searchCameras(searchQuery);
      setSearchResults(results);
    } catch {
      toast.error("Error en la búsqueda");
    } finally {
      setIsSearching(false);
    }
  }

  const displayData = searchResults ?? cameras;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Cámaras</h2>
          <p className="text-muted-foreground">
            Gestión del inventario de cámaras de videovigilancia.
          </p>
        </div>
        <Button onClick={() => { setEditingCamera(null); setDialogOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" />
          Nueva Cámara
        </Button>
      </div>

      {/* Stats cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Cámaras</CardTitle>
              <CameraIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_cameras}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Activas</CardTitle>
              <Activity className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.active_cameras}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tipos</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 text-xs">
                <span>Domo: {stats.dome_cameras}</span>
                <span>Bullet: {stats.bullet_cameras}</span>
                <span>PTZ: {stats.ptz_cameras}</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Con Conteo</CardTitle>
              <Activity className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.counting_enabled}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Semantic search bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Búsqueda semántica de cámaras..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleSearch(); }}
          />
        </div>
        <Button variant="secondary" onClick={handleSearch} disabled={isSearching}>
          {isSearching ? "Buscando..." : "Buscar"}
        </Button>
        {searchResults && (
          <Button variant="ghost" onClick={() => { setSearchResults(null); setSearchQuery(""); }}>
            Limpiar
          </Button>
        )}
      </div>

      {searchResults && (
        <p className="text-sm text-muted-foreground">
          {searchResults.length} resultado(s) para &quot;{searchQuery}&quot;
        </p>
      )}

      <DataTable
        columns={columns}
        data={displayData}
        isLoading={isLoading}
        searchKey="name"
        searchPlaceholder="Filtrar por nombre..."
        emptyState={
          <EmptyState
            icon={CameraIcon}
            title="No hay cámaras registradas"
            description="Importa desde Excel o crea una cámara manualmente para comenzar."
            action={{ label: "Nueva Cámara", onClick: () => { setEditingCamera(null); setDialogOpen(true); } }}
          />
        }
        toolbar={
          <ExportButton
            data={displayData as unknown as Record<string, unknown>[]}
            columns={[
              { header: "Nombre", accessorKey: "name" },
              { header: "IP/Host", accessorKey: "ip_address" },
              { header: "Estado", accessorKey: "status" },
              { header: "Modelo", accessorKey: "model" },
              { header: "Fabricante", accessorKey: "manufacturer" },
            ]}
            filename="Camaras"
          />
        }
      />

      <CameraDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        camera={editingCamera}
        onSubmit={handleSubmit}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
      />
    </div>
  );
}
