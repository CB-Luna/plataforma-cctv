"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod/v4";
import { zodResolver } from "@hookform/resolvers/zod";
import type { MenuTemplate } from "@/types/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const menuTemplateSchema = z.object({
  name: z.string().min(2, "Minimo 2 caracteres"),
  description: z.string().optional(),
});

export type MenuTemplateFormValues = z.infer<typeof menuTemplateSchema>;

interface MenuTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template?: MenuTemplate | null;
  onSubmit: (values: MenuTemplateFormValues) => void;
  isSubmitting?: boolean;
}

export function MenuTemplateDialog({
  open,
  onOpenChange,
  template,
  onSubmit,
  isSubmitting,
}: MenuTemplateDialogProps) {
  const { register, reset, handleSubmit, formState: { errors } } = useForm<MenuTemplateFormValues>({
    resolver: zodResolver(menuTemplateSchema),
  });

  useEffect(() => {
    if (!open) return;

    reset({
      name: template?.name ?? "",
      description: template?.description ?? "",
    });
  }, [open, reset, template]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{template ? "Editar plantilla de menu" : "Nueva plantilla de menu"}</DialogTitle>
          <DialogDescription>
            Esta consola opera sobre el backend real de plantillas por tenant. La aplicacion web todavia mantiene sidebar fijo en runtime.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="template-name">Nombre</Label>
            <Input id="template-name" {...register("name")} />
            {errors.name ? <p className="text-sm text-destructive">{errors.name.message}</p> : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="template-description">Descripcion</Label>
            <Textarea
              id="template-description"
              rows={4}
              placeholder="Uso recomendado, tenants objetivo, o notas operativas."
              {...register("description")}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Guardando..." : template ? "Actualizar" : "Crear"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
