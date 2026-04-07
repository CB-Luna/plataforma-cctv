"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { Tenant } from "@/types/api";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const tenantSchema = z.object({
  name: z.string().min(2, "Mínimo 2 caracteres"),
  slug: z.string().min(2, "Mínimo 2 caracteres").regex(/^[a-z0-9-]+$/, "Solo minúsculas, números y guiones"),
  domain: z.string().optional(),
  primary_color: z.string().optional(),
  secondary_color: z.string().optional(),
  tertiary_color: z.string().optional(),
  subscription_plan: z.string().optional(),
  max_users: z.number().int().positive(),
  max_clients: z.number().int().positive(),
});

type TenantFormValues = z.infer<typeof tenantSchema>;

export type { TenantFormValues };

interface TenantDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenant?: Tenant | null;
  onSubmit: (data: TenantFormValues) => Promise<void>;
  isSubmitting?: boolean;
}

export function TenantDialog({
  open,
  onOpenChange,
  tenant,
  onSubmit,
  isSubmitting,
}: TenantDialogProps) {
  const isEdit = !!tenant;

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<TenantFormValues>({
    resolver: zodResolver(tenantSchema),
    defaultValues: tenant
      ? {
          name: tenant.name,
          slug: tenant.slug,
          domain: tenant.domain ?? "",
          primary_color: tenant.primary_color ?? "#1976D2",
          secondary_color: tenant.secondary_color ?? "#424242",
          tertiary_color: tenant.tertiary_color ?? "#757575",
          subscription_plan: tenant.subscription_plan ?? "basic",
          max_users: tenant.max_users ?? 10,
          max_clients: tenant.max_clients ?? 50,
        }
      : {
          primary_color: "#1976D2",
          secondary_color: "#424242",
          tertiary_color: "#757575",
          subscription_plan: "basic",
          max_users: 10,
          max_clients: 50,
        },
  });

  // Reset form when dialog opens with new data
  const handleOpenChange = (val: boolean) => {
    if (!val) reset();
    onOpenChange(val);
  };

  const subscriptionPlan = watch("subscription_plan");

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar Tenant" : "Nuevo Tenant"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Actualiza la información del tenant."
              : "Completa los datos para crear un nuevo tenant."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre *</Label>
              <Input id="name" {...register("name")} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">Slug *</Label>
              <Input id="slug" {...register("slug")} disabled={isEdit} />
              {errors.slug && <p className="text-xs text-destructive">{errors.slug.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="domain">Dominio</Label>
            <Input id="domain" placeholder="empresa.ejemplo.com" {...register("domain")} />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="primary_color">Color primario</Label>
              <div className="flex gap-2">
                <Input id="primary_color" type="color" className="h-9 w-12 p-1" {...register("primary_color")} />
                <Input {...register("primary_color")} className="flex-1" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="secondary_color">Secundario</Label>
              <div className="flex gap-2">
                <Input type="color" className="h-9 w-12 p-1" {...register("secondary_color")} />
                <Input {...register("secondary_color")} className="flex-1" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tertiary_color">Terciario</Label>
              <div className="flex gap-2">
                <Input type="color" className="h-9 w-12 p-1" {...register("tertiary_color")} />
                <Input {...register("tertiary_color")} className="flex-1" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Plan</Label>
              <Select
                value={subscriptionPlan}
                onValueChange={(val) => { if (val) setValue("subscription_plan", val); }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="basic">Basic</SelectItem>
                  <SelectItem value="professional">Professional</SelectItem>
                  <SelectItem value="enterprise">Enterprise</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="max_users">Máx. Usuarios</Label>
              <Input id="max_users" type="number" {...register("max_users", { valueAsNumber: true })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="max_clients">Máx. Clientes</Label>
              <Input id="max_clients" type="number" {...register("max_clients", { valueAsNumber: true })} />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Guardando..." : isEdit ? "Actualizar" : "Crear"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
