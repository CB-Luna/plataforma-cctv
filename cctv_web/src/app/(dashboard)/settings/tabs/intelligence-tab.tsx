"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Brain, Activity, DollarSign, RefreshCw } from "lucide-react";
import { StatsCard } from "@/components/ui/stats-card";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/data-table/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import {
  listModelConfigs,
  createModelConfig,
  updateModelConfig,
  deleteModelConfig,
  setDefaultModelConfig,
  toggleModelConfigActive,
  listPromptTemplates,
  getUsageStats,
  reindexAllEmbeddings,
} from "@/lib/api/intelligence";
import { getColumns } from "../../intelligence/columns";
import { ModelDialog, type ModelFormValues } from "../../intelligence/model-dialog";
import type { ModelConfig } from "@/types/api";

export function IntelligenceTab() {
  const queryClient = useQueryClient();
  const [editModel, setEditModel] = useState<ModelConfig | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: models = [], isLoading } = useQuery({
    queryKey: ["model-configs"],
    queryFn: listModelConfigs,
  });

  const { data: templates = [] } = useQuery({
    queryKey: ["prompt-templates"],
    queryFn: listPromptTemplates,
  });

  const { data: usage } = useQuery({
    queryKey: ["usage-stats"],
    queryFn: getUsageStats,
  });

  const createMut = useMutation({
    mutationFn: (data: ModelFormValues) => createModelConfig(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["model-configs"] });
      toast.success("Modelo creado");
      setDialogOpen(false);
    },
    onError: () => toast.error("Error al crear modelo"),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: ModelFormValues }) => updateModelConfig(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["model-configs"] });
      toast.success("Modelo actualizado");
      setDialogOpen(false);
      setEditModel(null);
    },
    onError: () => toast.error("Error al actualizar modelo"),
  });

  const deleteMut = useMutation({
    mutationFn: deleteModelConfig,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["model-configs"] });
      toast.success("Modelo eliminado");
    },
    onError: () => toast.error("Error al eliminar modelo"),
  });

  const setDefaultMut = useMutation({
    mutationFn: setDefaultModelConfig,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["model-configs"] });
      toast.success("Modelo predeterminado actualizado");
    },
    onError: () => toast.error("Error al establecer predeterminado"),
  });

  const toggleActiveMut = useMutation({
    mutationFn: toggleModelConfigActive,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["model-configs"] });
      toast.success("Estado actualizado");
    },
    onError: () => toast.error("Error al cambiar estado"),
  });

  const reindexMut = useMutation({
    mutationFn: reindexAllEmbeddings,
    onSuccess: (results) => {
      const total = results.reduce((sum, r) => sum + r.indexed, 0);
      toast.success(`Re-indexación completa: ${total} registros indexados`);
    },
    onError: () => toast.error("Error en re-indexación"),
  });

  function handleSubmit(values: ModelFormValues) {
    const clean = { ...values };
    if (!clean.api_key_encrypted) delete clean.api_key_encrypted;
    if (!clean.api_endpoint) delete clean.api_endpoint;
    if (!clean.api_version) delete clean.api_version;
    if (!clean.description) delete clean.description;

    if (editModel) {
      updateMut.mutate({ id: editModel.id, data: clean });
    } else {
      createMut.mutate(clean);
    }
  }

  const columns = getColumns({
    onEdit: (m) => { setEditModel(m); setDialogOpen(true); },
    onDelete: (m) => { if (confirm(`¿Eliminar modelo "${m.name}"?`)) deleteMut.mutate(m.id); },
    onSetDefault: (m) => setDefaultMut.mutate(m.id),
    onToggleActive: (m) => toggleActiveMut.mutate(m.id),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-end gap-2">
        <Button
          variant="outline"
          onClick={() => reindexMut.mutate()}
          disabled={reindexMut.isPending}
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${reindexMut.isPending ? "animate-spin" : ""}`} />
          Re-indexar Embeddings
        </Button>
        <Button onClick={() => { setEditModel(null); setDialogOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" /> Nuevo Modelo
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatsCard
          title="Llamadas API"
          value={usage?.total_api_calls ?? 0}
          subtitle={usage ? `${usage.successful_calls} exitosas · ${usage.failed_calls} fallidas` : undefined}
          icon={Activity}
          color="blue"
        />
        <StatsCard title="Tokens Usados" value={(usage?.total_tokens ?? 0).toLocaleString()} icon={Brain} color="purple" />
        <StatsCard title="Costo Total USD" value={`$${(usage?.total_cost_usd ?? 0).toFixed(2)}`} icon={DollarSign} color="amber" />
        <StatsCard title="Plantillas Activas" value={templates.filter((t) => t.is_active).length} icon={Brain} color="teal" />
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">Modelos Configurados</h2>
        <DataTable
          columns={columns}
          data={models}
          isLoading={isLoading}
          emptyState={
            <EmptyState
              icon={Brain}
              title="Sin modelos de IA configurados"
              description="Configura un modelo de inteligencia artificial."
              action={{ label: "Nuevo Modelo", onClick: () => { setEditModel(null); setDialogOpen(true); } }}
            />
          }
        />
      </div>

      {templates.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Plantillas de Prompts</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {templates.map((t) => (
              <Card key={t.id}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center justify-between">
                    {t.name}
                    <Badge variant={t.is_active ? "default" : "secondary"}>
                      {t.is_active ? "Activa" : "Inactiva"}
                    </Badge>
                  </CardTitle>
                  <CardDescription>{t.category} · v{t.version}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {t.description && <p className="text-sm text-muted-foreground">{t.description}</p>}
                  {t.variables.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {t.variables.map((v) => (
                        <Badge key={v} variant="outline" className="text-xs">{`{${v}}`}</Badge>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-4 text-xs text-muted-foreground">
                    {t.temperature != null && <span>Temp: {t.temperature}</span>}
                    {t.max_tokens != null && <span>Max Tokens: {t.max_tokens}</span>}
                    {t.response_format && <span>Formato: {t.response_format}</span>}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      <ModelDialog
        open={dialogOpen}
        onOpenChange={(v) => { setDialogOpen(v); if (!v) setEditModel(null); }}
        onSubmit={handleSubmit}
        model={editModel}
        isLoading={createMut.isPending || updateMut.isPending}
      />
    </div>
  );
}
