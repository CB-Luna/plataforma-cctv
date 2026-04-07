"use client";

import { use } from "react";
import { useQuery } from "@tanstack/react-query";
import { getCamera } from "@/lib/api/cameras";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import {
  ArrowLeft,
  Camera as CameraIcon,
  Network,
  MapPin,
  Cpu,
  BarChart3,
  Info,
} from "lucide-react";

function Field({ label, value }: { label: string; value?: string | number | boolean | null }) {
  if (value == null || value === "") return null;
  return (
    <div className="space-y-1">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-sm font-medium">
        {typeof value === "boolean" ? (value ? "Sí" : "No") : String(value)}
      </dd>
    </div>
  );
}

export default function CameraDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const { data: camera, isLoading } = useQuery({
    queryKey: ["camera", id],
    queryFn: () => getCamera(id),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
      </div>
    );
  }

  if (!camera) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <p>Cámara no encontrada</p>
        <Link href="/cameras" className="text-primary underline text-sm mt-2">
          Volver al listado
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/cameras"
          className="inline-flex items-center justify-center h-9 w-9 rounded-md hover:bg-accent"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">{camera.name}</h1>
          {camera.code && (
            <p className="text-muted-foreground font-mono text-sm">{camera.code}</p>
          )}
        </div>
        <Badge variant={camera.is_active ? "default" : "secondary"}>
          {camera.status ?? (camera.is_active ? "Activa" : "Inactiva")}
        </Badge>
      </div>

      <Separator />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Información general */}
        <Card>
          <CardHeader className="flex flex-row items-center gap-2 pb-3">
            <CameraIcon className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-base">Información general</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-4">
              <Field label="Tipo" value={camera.camera_type} />
              <Field label="Modelo" value={camera.camera_model_name} />
              <Field label="Generación" value={camera.generation} />
              <Field label="No. Serie" value={camera.serial_number} />
              <Field label="Firmware" value={camera.firmware_version} />
              <Field label="Consecutivo" value={camera.consecutive} />
            </dl>
          </CardContent>
        </Card>

        {/* Red */}
        <Card>
          <CardHeader className="flex flex-row items-center gap-2 pb-3">
            <Network className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-base">Red</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-4">
              <Field label="IP" value={camera.ip_address} />
              <Field label="MAC" value={camera.mac_address} />
            </dl>
          </CardContent>
        </Card>

        {/* Especificaciones */}
        <Card>
          <CardHeader className="flex flex-row items-center gap-2 pb-3">
            <Cpu className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-base">Especificaciones</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-4">
              <Field label="Resolución" value={camera.resolution} />
              <Field label="Megapíxeles" value={camera.megapixels} />
              <Field label="IPS" value={camera.ips} />
              <Field label="Bitrate (kbps)" value={camera.bitrate_kbps} />
              <Field label="Calidad" value={camera.quality} />
            </dl>
          </CardContent>
        </Card>

        {/* Ubicación */}
        <Card>
          <CardHeader className="flex flex-row items-center gap-2 pb-3">
            <MapPin className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-base">Ubicación</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-4">
              <Field label="Área" value={camera.area} />
              <Field label="Zona" value={camera.zone} />
              <Field label="Descripción" value={camera.location_description} />
              <Field label="Proyecto" value={camera.project} />
            </dl>
          </CardContent>
        </Card>

        {/* Conteo */}
        <Card>
          <CardHeader className="flex flex-row items-center gap-2 pb-3">
            <BarChart3 className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-base">Conteo de personas</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-4">
              <Field label="Tiene conteo" value={camera.has_counting} />
              <Field label="Conteo habilitado" value={camera.counting_enabled} />
            </dl>
          </CardContent>
        </Card>

        {/* Notas */}
        {(camera.notes || camera.comments) && (
          <Card>
            <CardHeader className="flex flex-row items-center gap-2 pb-3">
              <Info className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-base">Notas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {camera.notes && (
                <div>
                  <span className="text-xs text-muted-foreground">Notas</span>
                  <p>{camera.notes}</p>
                </div>
              )}
              {camera.comments && (
                <div>
                  <span className="text-xs text-muted-foreground">Comentarios</span>
                  <p>{camera.comments}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Metadata */}
      <div className="text-xs text-muted-foreground">
        Creada: {new Date(camera.created_at).toLocaleString("es-MX")} · Actualizada:{" "}
        {new Date(camera.updated_at).toLocaleString("es-MX")}
      </div>
    </div>
  );
}
