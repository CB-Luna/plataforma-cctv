"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Brain, Activity, DollarSign, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { usePermissions } from "@/hooks/use-permissions";
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
  const { canAny } = usePermissions();
  const [editModel, setEditModel] = useState<ModelConfig | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const canCreateModel = canAny("ai_models.create", "ai_models:update:own", "ai_models:update:all");
  const canEditModel = canAny("ai_models.update", "ai_models:update:own", "ai_models:update:all");
  const canDeleteModel = canAny("ai_models.delete", "ai_models:delete:own", "ai_models:delete:all");
  const canSetDefaultModel = canEditModel;
  const canToggleModel = canEditModel;
  const canReindex = canEditModel;

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
      const total = results.reduce((sum, result) => sum + result.indexed, 0);
      toast.success(`Re-indexaciÃ³n completa: ${total} registros indexados`);
    },
    onError: () => toast.error("Error en re-indexaciÃ³n"),
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

  const columns = getColumns(
    {
      onEdit: (model) => { setEditModel(model); setDialogOpen(true); },
      onDelete: (model) => { if (confirm(`Â¿Eliminar modelo "${model.name}"?`)) deleteMut.mutate(model.id); },
      onSetDefault: (model) => setDefaultMut.mutate(model.id),
      onToggleActive: (model) => toggleActiveMut.mutate(model.id),
    },
    {
      canEdit: canEditModel,
      canDelete: canDeleteModel,
      canSetDefault: canSetDefaultModel,
      canToggleActive: canToggleModel,
    },
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-end gap-2">
        <Button
          variant="outline"
          onClick={() => reindexMut.mutate()}
          disabled={reindexMut.isPending || !canReindex}
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${reindexMut.isPending ? "animate-spin" : ""}`} />
          Re-indexar Embeddings
        </Button>
        {canCreateModel && (
          <Button onClick={() => { setEditModel(null); setDialogOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" /> Nuevo Modelo
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <StatsCard
          title="Llamadas API"
          value={usage?.total_api_calls ?? 0}
          subtitle={usage ? `${usage.successful_calls} exitosas Â· ${usage.failed_calls} fallidas` : undefined}
          icon={Activity}
          color="blue"
        />
        <StatsCard title="Tokens Usados" value={(usage?.total_tokens ?? 0).toLocaleString()} icon={Brain} color="purple" />
        <StatsCard title="Costo Total USD" value={`$${(usage?.total_cost_usd ?? 0).toFixed(2)}`} icon={DollarSign} color="amber" />
        <StatsCard title="Plantillas Activas" value={templates.filter((template) => template.is_active).length} icon={Brain} color="teal" />
      </div>

      <div>
        <h2 className="mb-4 text-xl font-semibold">Modelos Configurados</h2>
        <DataTable
          columns={columns}
          data={models}
          isLoading={isLoading}
          emptyState={
            <EmptyState
              icon={Brain}
              title="Sin modelos de IA configurados"
              description="Configura un modelo de inteligencia artificial."
              action={canCreateModel ? { label: "Nuevo Modelo", onClick: () => { setEditModel(null); setDialogOpen(true); } } : undefined}
            />
          }
        />
      </div>

      {templates.length > 0 && (
        <div>
          <h2 className="mb-4 text-xl font-semibold">Plantillas de Prompts</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {templates.map((template) => (
              <Card key={template.id}>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center justify-between text-sm">
                    {template.name}
                    <Badge variant={template.is_active ? "default" : "secondary"}>
                      {template.is_active ? "Activa" : "Inactiva"}
                    </Badge>
                  </CardTitle>
                  <CardDescription>{template.category} Â· v{template.version}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {template.description && <p className="text-sm text-muted-foreground">{template.description}</p>}
                  {template.variables.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {template.variables.map((variable) => (
                        <Badge key={variable} variant="outline" className="text-xs">{`{${variable}}`}</Badge>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-4 text-xs text-muted-foreground">
                    {template.temperature != null && <span>Temp: {template.temperature}</span>}
                    {template.max_tokens != null && <span>Max Tokens: {template.max_tokens}</span>}
                    {template.response_format && <span>Formato: {template.response_format}</span>}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      <ModelDialog
        open={dialogOpen}
        onOpenChange={(open) => { setDialogOpen(open); if (!open) setEditModel(null); }}
        onSubmit={handleSubmit}
        model={editModel}
        isLoading={createMut.isPending || updateMut.isPending}
      />
    </div>
  );
}
