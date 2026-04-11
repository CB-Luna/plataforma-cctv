"use client";

import { useCallback, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, Info } from "lucide-react";
import { getFloorPlanBySite, saveFloorPlan } from "@/lib/api/floor-plans";
import { useFloorPlanEditorStore } from "@/stores/floor-plan-editor-store";
import { FloorPlanEditorLayout } from "@/components/floor-plan-editor/floor-plan-editor-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { FloorPlanDocument, SaveFloorPlanRequest } from "@/types/api";
import type { EditorCamera, EditorElement, SerializedDocument } from "@/lib/floor-plan/types";

interface ExtendedFloorPlanDocument extends FloorPlanDocument {
  editor_document?: SerializedDocument;
}

function buildEditorDocument(
  document: ExtendedFloorPlanDocument | undefined,
  canvas: { width?: number; height?: number; grid?: number },
): SerializedDocument {
  if (document?.editor_document) {
    return document.editor_document;
  }

  const editorElements: EditorElement[] = [];
  const editorCameras: EditorCamera[] = [];

  for (const element of document?.elements ?? []) {
    if (element.type === "camera") {
      editorCameras.push({
        id: element.id,
        linkedCameraId: element.entity_id ?? null,
        name: element.name,
        iconType: "dome",
        x: element.x,
        y: element.y,
        rotation: element.rotation ?? 0,
        fovAngle: element.fov_angle ?? 90,
        range: element.fov_range ?? 80,
        color: element.color,
      });
      continue;
    }

    if (element.type === "nvr") {
      // NVR legacy se convierte a texto, no a "room" para evitar confusion con salas
      editorElements.push({
        id: element.id,
        type: "text",
        x: element.x,
        y: element.y,
        text: element.name ?? "NVR",
        fontSize: 12,
      });
      continue;
    }

    editorElements.push({
      id: element.id,
      type: "text",
      x: element.x,
      y: element.y,
      text: element.name,
      fontSize: 14,
    });
  }

  return {
    elements: editorElements,
    cameras: editorCameras,
    config: {
      canvasWidth: canvas.width ?? 1200,
      canvasHeight: canvas.height ?? 800,
      gridSize: canvas.grid ?? 20,
      gridEnabled: true,
    },
  };
}

export default function FloorPlanDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const siteId = params.id as string;
  const initializedRef = useRef(false);

  const loadDocument = useFloorPlanEditorStore((state) => state.loadDocument);
  const serializeDocument = useFloorPlanEditorStore((state) => state.serializeDocument);
  const planName = useFloorPlanEditorStore((state) => state.planName);

  const { data, isLoading } = useQuery({
    queryKey: ["floor-plan", siteId],
    queryFn: () => getFloorPlanBySite(siteId),
  });

  useEffect(() => {
    if (!data || initializedRef.current) return;
    initializedRef.current = true;

    const floorPlan = data.floor_plan;
    const editorDocument = buildEditorDocument(
      floorPlan?.document as ExtendedFloorPlanDocument | undefined,
      {
        width: floorPlan?.canvas_width,
        height: floorPlan?.canvas_height,
        grid: floorPlan?.grid_size,
      },
    );

    loadDocument(
      {
        ...editorDocument,
        config: {
          canvasWidth: floorPlan?.canvas_width ?? editorDocument.config.canvasWidth,
          canvasHeight: floorPlan?.canvas_height ?? editorDocument.config.canvasHeight,
          gridSize: floorPlan?.grid_size ?? editorDocument.config.gridSize,
          gridEnabled: editorDocument.config.gridEnabled ?? true,
        },
      },
      floorPlan?.name ?? `Plano - ${data.site.name}`,
      siteId,
    );
  }, [data, loadDocument, siteId]);

  const saveMutation = useMutation({
    mutationFn: (payload: SaveFloorPlanRequest) => saveFloorPlan(siteId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["floor-plan", siteId] });
      queryClient.invalidateQueries({ queryKey: ["floor-plan-sites"] });
      toast.success("Plano guardado");
    },
    onError: () => toast.error("No se pudo guardar el plano"),
  });

  const handleSave = useCallback(() => {
    const editorDocument = serializeDocument();
    const legacyElements = [
      ...editorDocument.cameras.map((camera) => ({
        id: camera.id,
        type: "camera" as const,
        entity_id: camera.linkedCameraId ?? undefined,
        name: camera.name,
        x: camera.x,
        y: camera.y,
        rotation: camera.rotation,
        fov_angle: camera.fovAngle,
        fov_range: camera.range,
        color: camera.color,
      })),
      ...editorDocument.elements.map((element) => ({
        id: element.id,
        type: "label" as const,
        name: element.name ?? element.text ?? "",
        x: element.x,
        y: element.y,
        color: element.fillColor,
      })),
    ];

    const existingDocument = (data?.floor_plan?.document as ExtendedFloorPlanDocument | undefined) ?? {};
    const document: ExtendedFloorPlanDocument = {
      ...existingDocument,
      elements: legacyElements,
      editor_document: editorDocument,
      backgroundImage: existingDocument.backgroundImage,
    };

    saveMutation.mutate({
      name: planName,
      version: data?.floor_plan?.version ?? 1,
      canvas_width: editorDocument.config.canvasWidth,
      canvas_height: editorDocument.config.canvasHeight,
      grid_size: editorDocument.config.gridSize,
      background_file_id: data?.floor_plan?.background_file_id,
      document,
    });
  }, [data?.floor_plan?.background_file_id, data?.floor_plan?.document, data?.floor_plan?.version, planName, saveMutation, serializeDocument]);

  if (isLoading) {
    return <div className="flex h-64 items-center justify-center text-muted-foreground">Cargando plano...</div>;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push("/floor-plans")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-xl font-bold tracking-tight">{data?.site.name}</h1>
          <p className="text-xs text-muted-foreground">
            {data?.site.camera_count} camaras · {data?.site.nvr_count} NVRs
          </p>
        </div>
      </div>

      <Card className="border-sky-200 bg-sky-50/80">
        <CardContent className="flex gap-3 py-4 text-sm text-sky-950">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-sky-700" />
          <div>
            <p className="font-medium">Persistencia defendible del editor</p>
            <p className="mt-1 text-xs text-sky-800">
              El guardado conserva una proyeccion legacy para compatibilidad y, ademas, una version
              enriquecida del documento editor para no perder habitaciones, zonas, puertas o poligonos.
            </p>
          </div>
        </CardContent>
      </Card>

      <FloorPlanEditorLayout onSave={handleSave} isSaving={saveMutation.isPending} />
    </div>
  );
}
