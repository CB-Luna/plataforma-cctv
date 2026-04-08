"use client";

import { useEffect, useMemo, useState } from "react";
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
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface TenantLogoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenant?: Tenant | null;
  onSubmit: (file: File) => Promise<void> | void;
  isSubmitting?: boolean;
}

export function TenantLogoDialog({
  open,
  onOpenChange,
  tenant,
  onSubmit,
  isSubmitting,
}: TenantLogoDialogProps) {
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    if (!open) {
      setFile(null);
    }
  }, [open]);

  const previewUrl = useMemo(() => {
    if (!file) return tenant?.logo_url ?? null;
    return URL.createObjectURL(file);
  }, [file, tenant?.logo_url]);

  useEffect(() => {
    return () => {
      if (file && previewUrl && previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [file, previewUrl]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Branding de empresa</DialogTitle>
          <DialogDescription>
            Sube el logo oficial de la empresa operadora. Si corresponde al tenant activo, el header y el branding se rehidratan con este snapshot.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center dark:border-slate-700 dark:bg-slate-900/60">
            {previewUrl ? (
              <img
                src={previewUrl}
                alt={tenant ? `Logo de ${tenant.name}` : "Vista previa de logo"}
                className="mx-auto h-20 max-w-full rounded-xl object-contain"
              />
            ) : (
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-slate-200 text-sm font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                Sin logo
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="tenant-logo-file">Archivo</Label>
            <Input
              id="tenant-logo-file"
              type="file"
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            />
            <p className="text-xs text-muted-foreground">
              Se recomienda una imagen horizontal transparente para que escale mejor en portal y comunicaciones.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button type="button" disabled={!file || isSubmitting} onClick={() => file && onSubmit(file)}>
            {isSubmitting ? "Subiendo..." : "Subir logo"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
