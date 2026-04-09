"use client";

import { type ReactNode, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { LayoutTemplate, List, Pencil, Plus, Save, Trash2, Users } from "lucide-react";
import { toast } from "sonner";
import type { AdminMenuItem, MenuItem, MenuTemplate, MenuTenantBasic } from "@/types/api";
import { usePermissions } from "@/hooks/use-permissions";
import {
  assignTenantsToMenuTemplate,
  createMenuTemplate,
  deleteMenuTemplate,
  listAdminMenuItems,
  listMenuTemplates,
  listMenuTenants,
  listTemplateItems,
  listTemplateTenants,
  replaceTemplateItems,
  updateMenuTemplate,
} from "@/lib/api/menu";
import { getMenu } from "@/lib/api/settings";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { EmptyState } from "@/components/ui/empty-state";
import { StatsCard } from "@/components/ui/stats-card";
import { MenuTemplateDialog, type MenuTemplateFormValues } from "./menu-template-dialog";

export function MenuTemplatesTab() {
  const queryClient = useQueryClient();
  const { canAny } = usePermissions();
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<MenuTemplate | null>(null);
  const [selectedTenantIds, setSelectedTenantIds] = useState<string[]>([]);
  const [selectedMenuItemIds, setSelectedMenuItemIds] = useState<string[]>([]);

  const canCreateTemplate = canAny("menu:update:all", "menu.update");
  const canEditTemplate = canCreateTemplate;
  const canDeleteTemplate = canCreateTemplate;

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ["menu", "templates"],
    queryFn: listMenuTemplates,
  });

  const { data: menuItems = [] } = useQuery({
    queryKey: ["menu", "items", "admin"],
    queryFn: listAdminMenuItems,
  });

  const { data: tenants = [] } = useQuery({
    queryKey: ["menu", "tenants"],
    queryFn: listMenuTenants,
  });

  const { data: runtimeMenu } = useQuery({
    queryKey: ["menu", "runtime"],
    queryFn: getMenu,
  });

  const { data: templateTenants = [] } = useQuery({
    queryKey: ["menu", "template", selectedTemplateId, "tenants"],
    queryFn: () => listTemplateTenants(selectedTemplateId!),
    enabled: !!selectedTemplateId,
  });

  const { data: templateItems = [] } = useQuery({
    queryKey: ["menu", "template", selectedTemplateId, "items"],
    queryFn: () => listTemplateItems(selectedTemplateId!),
    enabled: !!selectedTemplateId,
  });

  useEffect(() => {
    if (!templates.length) {
      setSelectedTemplateId(null);
      return;
    }

    if (!selectedTemplateId || !templates.some((template) => template.id === selectedTemplateId)) {
      setSelectedTemplateId(templates[0].id);
    }
  }, [selectedTemplateId, templates]);

  useEffect(() => {
    setSelectedTenantIds(templateTenants.map((tenant) => tenant.id));
  }, [selectedTemplateId, templateTenants]);

  useEffect(() => {
    setSelectedMenuItemIds(templateItems.map((item) => item.menu_item_id));
  }, [selectedTemplateId, templateItems]);

  const selectedTemplate = templates.find((template) => template.id === selectedTemplateId) ?? null;
  const sortedMenuItems = useMemo(
    () =>
      [...menuItems].sort((left, right) => {
        if (left.display_order !== right.display_order) {
          return left.display_order - right.display_order;
        }
        return left.label.localeCompare(right.label, "es");
      }),
    [menuItems],
  );

  const statsData = useMemo(() => {
    const totalTenants = tenants.length;
    const assignedTenantIds = new Set(templates.flatMap((t) => Array.from({ length: t.tenant_count }, () => t.id)));
    const tenantsWithTemplate = templates.reduce((sum, t) => sum + t.tenant_count, 0);

    return {
      totalTemplates: templates.length,
      totalItems: menuItems.length,
      tenantsWithTemplate,
      tenantsWithout: Math.max(0, totalTenants - tenantsWithTemplate),
    };
  }, [menuItems.length, templates, tenants.length]);

  const createMutation = useMutation({
    mutationFn: createMenuTemplate,
    onSuccess: (template) => {
      queryClient.invalidateQueries({ queryKey: ["menu", "templates"] });
      setSelectedTemplateId(template.id);
      setTemplateDialogOpen(false);
      setEditingTemplate(null);
      toast.success("Plantilla de menu creada");
    },
    onError: () => toast.error("Error al crear plantilla de menu"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: MenuTemplateFormValues }) => updateMenuTemplate(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["menu", "templates"] });
      setTemplateDialogOpen(false);
      setEditingTemplate(null);
      toast.success("Plantilla de menu actualizada");
    },
    onError: () => toast.error("Error al actualizar plantilla de menu"),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteMenuTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["menu", "templates"] });
      toast.success("Plantilla de menu eliminada");
    },
    onError: () => toast.error("No fue posible eliminar la plantilla"),
  });

  const assignTenantsMutation = useMutation({
    mutationFn: ({ templateId, tenantIds }: { templateId: string; tenantIds: string[] }) =>
      assignTenantsToMenuTemplate(templateId, tenantIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["menu", "template", selectedTemplateId, "tenants"] });
      queryClient.invalidateQueries({ queryKey: ["menu", "templates"] });
      queryClient.invalidateQueries({ queryKey: ["menu", "runtime"] });
      toast.success("Asignacion de tenants actualizada");
    },
    onError: () => toast.error("Error al guardar asignacion de tenants"),
  });

  const replaceItemsMutation = useMutation({
    mutationFn: ({ templateId, menuItemIds }: { templateId: string; menuItemIds: string[] }) =>
      replaceTemplateItems(templateId, menuItemIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["menu", "template", selectedTemplateId, "items"] });
      queryClient.invalidateQueries({ queryKey: ["menu", "runtime"] });
      toast.success("Composicion base del menu actualizada");
    },
    onError: () => toast.error("Error al guardar composicion del menu"),
  });

  function handleSubmitTemplate(values: MenuTemplateFormValues) {
    const payload = {
      ...values,
      description: values.description?.trim() ? values.description.trim() : undefined,
    };

    if (editingTemplate) {
      updateMutation.mutate({ id: editingTemplate.id, data: payload });
      return;
    }

    createMutation.mutate(payload);
  }

  function handleDeleteTemplate(template: MenuTemplate) {
    if (template.is_default) {
      toast.info("La plantilla por defecto no puede eliminarse desde esta consola");
      return;
    }

    if (!confirm(`Eliminar la plantilla "${template.name}"?`)) return;
    deleteMutation.mutate(template.id);
  }

  return (
    <div className="space-y-6">
      {/* Stats resumen */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatsCard title="Plantillas" value={statsData.totalTemplates} icon={LayoutTemplate} color="blue" />
        <StatsCard title="Items en catalogo" value={statsData.totalItems} icon={List} color="teal" />
        <StatsCard title="Tenants asignados" value={statsData.tenantsWithTemplate} icon={Users} color="green" />
        <StatsCard
          title="Sin plantilla"
          value={statsData.tenantsWithout}
          icon={Users}
          color={statsData.tenantsWithout > 0 ? "amber" : "green"}
        />
      </div>

      <div className="grid gap-6 2xl:grid-cols-[360px,1fr]">
        <Card className="h-fit">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle className="text-base">Plantillas registradas</CardTitle>
                <CardDescription>Selecciona una plantilla global para editar tenants e items.</CardDescription>
              </div>
              {canCreateTemplate ? (
                <Button
                  size="sm"
                  onClick={() => {
                    setEditingTemplate(null);
                    setTemplateDialogOpen(true);
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Nueva
                </Button>
              ) : null}
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Cargando plantillas...</p>
            ) : templates.length ? (
              templates.map((template) => {
                const isSelected = template.id === selectedTemplateId;

                return (
                  <button
                    key={template.id}
                    type="button"
                    onClick={() => setSelectedTemplateId(template.id)}
                    className={`w-full rounded-2xl border p-4 text-left transition-all ${
                      isSelected
                        ? "border-blue-500 bg-blue-50 shadow-sm dark:border-blue-500 dark:bg-blue-950/20"
                        : "border-slate-200 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:hover:border-slate-700 dark:hover:bg-slate-900/60"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-slate-100">{template.name}</p>
                        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                          {template.description?.trim() || "Sin descripcion operativa."}
                        </p>
                      </div>
                      {isSelected ? (
                        <Badge className="bg-blue-600 text-white hover:bg-blue-600">Activa</Badge>
                      ) : null}
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {template.is_default ? <Badge variant="secondary">Default</Badge> : null}
                      <Badge variant="outline">{template.tenant_count} tenants</Badge>
                    </div>
                  </button>
                );
              })
            ) : (
              <EmptyState
                icon={LayoutTemplate}
                title="Sin plantillas de menu"
                description="Crea la primera plantilla para controlar la composicion base del menu por tenant."
                action={
                  canCreateTemplate
                    ? {
                        label: "Nueva plantilla",
                        onClick: () => {
                          setEditingTemplate(null);
                          setTemplateDialogOpen(true);
                        },
                      }
                    : undefined
                }
              />
            )}
          </CardContent>
        </Card>

        {selectedTemplate ? (
          <div className="space-y-6">
            <Card>
              <CardHeader className="gap-4 pb-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className="bg-blue-600 text-white hover:bg-blue-600">Template activo</Badge>
                      {selectedTemplate.is_default ? <Badge variant="secondary">Default</Badge> : null}
                      <Badge variant="outline">{selectedTenantIds.length} tenants asignados</Badge>
                      <Badge variant="outline">{selectedMenuItemIds.length} / {sortedMenuItems.length} items visibles</Badge>
                    </div>
                    <CardTitle className="mt-3 text-xl">{selectedTemplate.name}</CardTitle>
                    <CardDescription className="mt-1 max-w-3xl">
                      {selectedTemplate.description?.trim() ||
                        "Plantilla sin descripcion. Conviene documentar a que tipo de tenant o paquete esta orientada."}
                    </CardDescription>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {canEditTemplate ? (
                      <Button
                        variant="outline"
                        onClick={() => {
                          setEditingTemplate(selectedTemplate);
                          setTemplateDialogOpen(true);
                        }}
                      >
                        <Pencil className="mr-2 h-4 w-4" />
                        Editar
                      </Button>
                    ) : null}
                    {canDeleteTemplate ? (
                      <Button
                        variant="outline"
                        className="text-destructive"
                        onClick={() => handleDeleteTemplate(selectedTemplate)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Eliminar
                      </Button>
                    ) : null}
                  </div>
                </div>
              </CardHeader>
            </Card>

            <div className="grid gap-6 xl:grid-cols-2">
              <AssignmentCard
                title="Tenants asignados"
                description="La plantilla se liga a empresas operadoras concretas. El runtime efectivo del backend resuelve el template por tenant."
                items={tenants}
                selectedIds={selectedTenantIds}
                onToggle={(tenantId) =>
                  setSelectedTenantIds((current) =>
                    current.includes(tenantId)
                      ? current.filter((value) => value !== tenantId)
                      : [...current, tenantId],
                  )
                }
                getItemId={(tenant) => tenant.id}
                renderItem={(tenant) => (
                  <TenantRow tenant={tenant} assigned={selectedTenantIds.includes(tenant.id)} />
                )}
                footer={
                  <Button
                    onClick={() =>
                      selectedTemplateId &&
                      assignTenantsMutation.mutate({
                        templateId: selectedTemplateId,
                        tenantIds: selectedTenantIds,
                      })
                    }
                    disabled={!canEditTemplate || assignTenantsMutation.isPending}
                  >
                    <Save className="mr-2 h-4 w-4" />
                    {assignTenantsMutation.isPending ? "Guardando..." : "Guardar tenants"}
                  </Button>
                }
              />

              <AssignmentCard
                title="Composicion base del menu"
                description="Aqui se define que items quedan asignados a la plantilla. El orden avanzado y la visibilidad por item aun se gobiernan desde backend y quedan como siguiente cierre."
                items={sortedMenuItems}
                selectedIds={selectedMenuItemIds}
                onToggle={(menuItemId) =>
                  setSelectedMenuItemIds((current) =>
                    current.includes(menuItemId)
                      ? current.filter((value) => value !== menuItemId)
                      : [...current, menuItemId],
                  )
                }
                getItemId={(menuItem) => menuItem.id}
                renderItem={(menuItem) => (
                  <MenuItemRow menuItem={menuItem} assigned={selectedMenuItemIds.includes(menuItem.id)} />
                )}
                footer={
                  <Button
                    onClick={() =>
                      selectedTemplateId &&
                      replaceItemsMutation.mutate({
                        templateId: selectedTemplateId,
                        menuItemIds: selectedMenuItemIds,
                      })
                    }
                    disabled={!canEditTemplate || replaceItemsMutation.isPending}
                  >
                    <Save className="mr-2 h-4 w-4" />
                    {replaceItemsMutation.isPending ? "Guardando..." : "Guardar composicion"}
                  </Button>
                }
              />
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Vista efectiva del tenant activo</CardTitle>
                <CardDescription>
                  Este preview consulta `GET /menu` y refleja el menu resuelto por backend para el tenant y permisos activos del usuario actual.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {runtimeMenu?.items?.length ? (
                  <div className="space-y-3">
                    {runtimeMenu.items.map((item) => (
                      <RuntimeMenuNode key={item.id} item={item} depth={0} />
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No fue posible obtener un preview efectivo del menu con el contexto actual.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        ) : (
          <EmptyState
            icon={LayoutTemplate}
            title="Selecciona una plantilla"
            description="Aqui podras administrar tenants asignados, composicion base y el preview del menu efectivo."
          />
        )}
      </div>

      <MenuTemplateDialog
        open={templateDialogOpen}
        onOpenChange={(open) => {
          setTemplateDialogOpen(open);
          if (!open) setEditingTemplate(null);
        }}
        template={editingTemplate}
        onSubmit={handleSubmitTemplate}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
      />
    </div>
  );
}

function AssignmentCard<T>({
  title,
  description,
  items,
  selectedIds,
  onToggle,
  getItemId,
  renderItem,
  footer,
}: {
  title: string;
  description: string;
  items: T[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  getItemId: (item: T) => string;
  renderItem: (item: T) => ReactNode;
  footer?: ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="max-h-[28rem] space-y-3 overflow-y-auto pr-1">
          {items.map((item) => {
            const itemId = getItemId(item);
            const selected = selectedIds.includes(itemId);

            return (
              <label
                key={itemId}
                className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-3 transition-colors ${
                  selected
                    ? "border-blue-300 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/20"
                    : "border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-900/60"
                }`}
              >
                <Checkbox checked={selected} onCheckedChange={() => onToggle(itemId)} />
                <div className="min-w-0 flex-1">{renderItem(item)}</div>
              </label>
            );
          })}
        </div>
        <div className="flex justify-end">{footer}</div>
      </CardContent>
    </Card>
  );
}

function TenantRow({ tenant, assigned }: { tenant: MenuTenantBasic; assigned: boolean }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="font-medium text-slate-900 dark:text-slate-100">{tenant.name}</p>
        <p className="truncate text-sm text-slate-600 dark:text-slate-300">{tenant.slug}</p>
      </div>
      {assigned ? <Badge variant="secondary">Asignado</Badge> : null}
    </div>
  );
}

function MenuItemRow({ menuItem, assigned }: { menuItem: AdminMenuItem; assigned: boolean }) {
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <p className="font-medium text-slate-900 dark:text-slate-100">{menuItem.label}</p>
        {!menuItem.is_active ? <Badge variant="secondary">Inactivo</Badge> : null}
        {assigned ? <Badge variant="secondary">Incluido</Badge> : null}
      </div>
      <div className="flex flex-wrap gap-2 text-xs text-slate-500 dark:text-slate-400">
        <span>Codigo: {menuItem.code}</span>
        {menuItem.route ? <span>Ruta: {menuItem.route}</span> : null}
        {menuItem.required_permission ? <span>Permiso: {menuItem.required_permission}</span> : null}
        <span>Reuso: {menuItem.template_count} templates</span>
      </div>
      {menuItem.description ? (
        <p className="text-sm text-slate-600 dark:text-slate-300">{menuItem.description}</p>
      ) : null}
    </div>
  );
}

function RuntimeMenuNode({ item, depth }: { item: MenuItem; depth: number }) {
  return (
    <div className="space-y-2" style={{ paddingLeft: depth === 0 ? 0 : depth * 16 }}>
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-800 dark:bg-slate-900/60">
        <span className="font-medium text-slate-900 dark:text-slate-100">{item.label}</span>
        {item.route ? <Badge variant="outline">{item.route}</Badge> : null}
        {item.permission ? <Badge variant="secondary">{item.permission}</Badge> : null}
        {item.badge ? (
          <Badge className="bg-slate-700 text-white hover:bg-slate-700">{item.badge.value}</Badge>
        ) : null}
      </div>
      {item.children?.length ? (
        <div className="space-y-2">
          {item.children.map((child) => (
            <RuntimeMenuNode key={child.id} item={child} depth={depth + 1} />
          ))}
        </div>
      ) : null}
    </div>
  );
}
