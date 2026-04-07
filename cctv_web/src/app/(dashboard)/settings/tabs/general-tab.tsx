"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Settings2, Palette, Save } from "lucide-react";
import { toast } from "sonner";
import { usePermissions } from "@/hooks/use-permissions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { getSettings, updateTheme } from "@/lib/api/settings";

export function GeneralTab() {
  const queryClient = useQueryClient();
  const { canAny } = usePermissions();
  const canUpdateTheme = canAny(
    "settings.update",
    "configuration.update",
    "configuration:update:own",
    "configuration:update:all",
    "themes:update:own",
    "themes:update:all",
  );

  const { data: settings, isLoading } = useQuery({
    queryKey: ["settings"],
    queryFn: getSettings,
  });

  const [primary, setPrimary] = useState("");
  const [secondary, setSecondary] = useState("");
  const [tertiary, setTertiary] = useState("");
  const [initialized, setInitialized] = useState(false);

  if (settings && !initialized) {
    setPrimary(settings.primary_color || "#000000");
    setSecondary(settings.secondary_color || "#000000");
    setTertiary(settings.tertiary_color || "#000000");
    setInitialized(true);
  }

  const themeMut = useMutation({
    mutationFn: () =>
      updateTheme({
        primary_color: primary,
        secondary_color: secondary,
        tertiary_color: tertiary,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      toast.success("Tema actualizado");
    },
    onError: () => toast.error("Error al actualizar tema"),
  });

  if (isLoading) {
    return <div className="flex h-64 items-center justify-center text-muted-foreground">Cargando configuraciÃ³n...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings2 className="h-5 w-5" /> InformaciÃ³n General
          </CardTitle>
          <CardDescription>Datos del tenant actual</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <Label className="text-xs text-muted-foreground">Nombre</Label>
              <p className="font-medium">{settings?.name}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Slug</Label>
              <p className="font-medium">{settings?.slug}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Plan de SuscripciÃ³n</Label>
              <Badge variant="secondary">{settings?.subscription_plan || "N/A"}</Badge>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Estado</Label>
              <Badge variant={settings?.is_active ? "default" : "destructive"}>
                {settings?.is_active ? "Activo" : "Inactivo"}
              </Badge>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">MÃ¡x. Usuarios</Label>
              <p className="font-medium">{settings?.max_users ?? "â€”"}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">MÃ¡x. Clientes</Label>
              <p className="font-medium">{settings?.max_clients ?? "â€”"}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Creado</Label>
              <p className="font-medium">{settings ? new Date(settings.created_at).toLocaleDateString("es") : "â€”"}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Actualizado</Label>
              <p className="font-medium">{settings ? new Date(settings.updated_at).toLocaleDateString("es") : "â€”"}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" /> Tema Visual
          </CardTitle>
          <CardDescription>Personaliza los colores de la interfaz</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="primary">Color Primario</Label>
              <div className="flex items-center gap-2">
                <Input id="primary" type="color" value={primary} onChange={(event) => setPrimary(event.target.value)} className="h-10 w-14 cursor-pointer p-1" />
                <Input value={primary} onChange={(event) => setPrimary(event.target.value)} className="flex-1" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="secondary">Color Secundario</Label>
              <div className="flex items-center gap-2">
                <Input id="secondary" type="color" value={secondary} onChange={(event) => setSecondary(event.target.value)} className="h-10 w-14 cursor-pointer p-1" />
                <Input value={secondary} onChange={(event) => setSecondary(event.target.value)} className="flex-1" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tertiary">Color Terciario</Label>
              <div className="flex items-center gap-2">
                <Input id="tertiary" type="color" value={tertiary} onChange={(event) => setTertiary(event.target.value)} className="h-10 w-14 cursor-pointer p-1" />
                <Input value={tertiary} onChange={(event) => setTertiary(event.target.value)} className="flex-1" />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4 rounded-lg border p-4">
            <span className="text-sm text-muted-foreground">Vista previa:</span>
            <div className="flex gap-2">
              <div className="h-10 w-10 rounded" style={{ backgroundColor: primary }} title="Primario" />
              <div className="h-10 w-10 rounded" style={{ backgroundColor: secondary }} title="Secundario" />
              <div className="h-10 w-10 rounded" style={{ backgroundColor: tertiary }} title="Terciario" />
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={() => themeMut.mutate()} disabled={themeMut.isPending || !canUpdateTheme}>
              <Save className="mr-2 h-4 w-4" />
              {themeMut.isPending ? "Guardando..." : "Guardar Tema"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
