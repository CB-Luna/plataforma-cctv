"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Activity, Brain, DollarSign, Plus, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import type { ModelConfig } from "@/types/api";
import { ScopeCallout } from "@/components/settings/scope-callout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/data-table/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { StatsCard } from "@/components/ui/stats-card";
import { usePermissions } from "@/hooks/use-permissions";
import {
  createModelConfig,
  deleteModelConfig,
  getUsageStats,
  listModelConfigs,
  listPromptTemplates,
  reindexAllEmbeddings,
  setDefaultModelConfig,
  toggleModelConfigActive,
  updateModelConfig,
} from "@/lib/api/intelligence";
import { getColumns } from "../../intelligence/columns";
import { ModelDialog, type ModelFormValues } from "../../intelligence/model-dialog";

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

  const createMutation = useMutation({
    mutationFn: (data: ModelFormValues) => createModelConfig(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["model-configs"] });
      toast.success("Modelo creado");
      setDialogOpen(false);
    },
    onError: () => toast.error("Error al crear modelo"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: ModelFormValues }) => updateModelConfig(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["model-configs"] });
      toast.success("Modelo actualizado");
      setDialogOpen(false);
      setEditModel(null);
    },
    onError: () => toast.error("Error al actualizar modelo"),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteModelConfig,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["model-configs"] });
      toast.success("Modelo eliminado");
    },
    onError: () => toast.error("Error al eliminar modelo"),
  });

  const setDefaultMutation = useMutation({
    mutationFn: setDefaultModelConfig,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["model-configs"] });
      toast.success("Modelo predeterminado actualizado");
    },
    onError: () => toast.error("Error al establecer predeterminado"),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: toggleModelConfigActive,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["model-configs"] });
      toast.success("Estado actualizado");
    },
    onError: () => toast.error("Error al cambiar estado"),
  });

  const reindexMutation = useMutation({
    mutationFn: reindexAllEmbeddings,
    onSuccess: (results) => {
      const total = results.reduce((sum, result) => sum + result.indexed, 0);
      toast.success(`Reindexacion completa: ${total} registros indexados`);
    },
    onError: () => toast.error("Error al reindexar embeddings"),
  });

  function handleSubmit(values: ModelFormValues) {
    const clean = { ...values };
    if (!clean.api_key_encrypted) delete clean.api_key_encrypted;
    if (!clean.api_endpoint) delete clean.api_endpoint;
    if (!clean.api_version) delete clean.api_version;
    if (!clean.description) delete clean.description;

    if (editModel) {
      updateMutation.mutate({ id: editModel.id, data: clean });
      return;
    }

    createMutation.mutate(clean);
  }

  const columns = getColumns(
    {
      onEdit: (model) => {
        setEditModel(model);
        setDialogOpen(true);
      },
      onDelete: (model) => {
        if (confirm(`Eliminar modelo "${model.name}"?`)) {
          deleteMutation.mutate(model.id);
        }
      },
      onSetDefault: (model) => setDefaultMutation.mutate(model.id),
      onToggleActive: (model) => toggleActiveMutation.mutate(model.id),
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
      <ScopeCallout
        badge="Tenant activo"
        accent="tenant"
        title="IA operativa por tenant"
        description="Los modelos, limites de consumo y reindexacion se ejecutan en el contexto del tenant activo. Las plantillas listadas aqui salen del backend real y pueden incluir catalogo compartido."
        footer={
          <div className="flex flex-wrap gap-2 text-xs text-slate-600 dark:text-slate-300">
            <Badge variant="outline">{models.length} modelos configurados</Badge>
            <Badge variant="outline">{templates.length} plantillas disponibles</Badge>
            <Badge variant="secondary">Uso mostrado segun tenant activo</Badge>
          </div>
        }
      />

      <div className="flex items-center justify-end gap-2">
        <Button
          variant="outline"
          onClick={() => reindexMutation.mutate()}
          disabled={reindexMutation.isPending || !canReindex}
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${reindexMutation.isPending ? "animate-spin" : ""}`} />
          Reindexar embeddings
        </Button>
        {canCreateModel ? (
          <Button
            onClick={() => {
              setEditModel(null);
              setDialogOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Nuevo modelo
          </Button>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <StatsCard
          title="Llamadas API"
          value={usage?.total_api_calls ?? 0}
          subtitle={usage ? `${usage.successful_calls} exitosas · ${usage.failed_calls} fallidas` : undefined}
          icon={Activity}
          color="blue"
        />
        <StatsCard
          title="Tokens usados"
          value={(usage?.total_tokens ?? 0).toLocaleString()}
          icon={Brain}
          color="purple"
        />
        <StatsCard
          title="Costo total USD"
          value={`$${(usage?.total_cost_usd ?? 0).toFixed(2)}`}
          icon={DollarSign}
          color="amber"
        />
        <StatsCard
          title="Plantillas activas"
          value={templates.filter((template) => template.is_active).length}
          icon={Brain}
          color="teal"
        />
      </div>

      <div>
        <h2 className="mb-4 text-xl font-semibold">Modelos configurados</h2>
        <DataTable
          columns={columns}
          data={models}
          isLoading={isLoading}
          emptyState={
            <EmptyState
              icon={Brain}
              title="Sin modelos de IA configurados"
              description="Configura un modelo de inteligencia artificial para el tenant activo."
              action={
                canCreateModel
                  ? {
                      label: "Nuevo modelo",
                      onClick: () => {
                        setEditModel(null);
                        setDialogOpen(true);
                      },
                    }
                  : undefined
              }
            />
          }
        />
      </div>

      {templates.length ? (
        <div>
          <h2 className="mb-4 text-xl font-semibold">Plantillas de prompts</h2>
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
                  <CardDescription>
                    {template.category} · v{template.version}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {template.description ? (
                    <p className="text-sm text-muted-foreground">{template.description}</p>
                  ) : null}
                  {template.variables.length ? (
                    <div className="flex flex-wrap gap-1">
                      {template.variables.map((variable) => (
                        <Badge key={variable} variant="outline" className="text-xs">{`{${variable}}`}</Badge>
                      ))}
                    </div>
                  ) : null}
                  <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                    {template.temperature != null ? <span>Temp: {template.temperature}</span> : null}
                    {template.max_tokens != null ? <span>Max tokens: {template.max_tokens}</span> : null}
                    {template.response_format ? <span>Formato: {template.response_format}</span> : null}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ) : null}

      <ModelDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditModel(null);
        }}
        onSubmit={handleSubmit}
        model={editModel}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />
    </div>
  );
}
