"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useCallback, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getFloorPlanBySite, saveFloorPlan } from "@/lib/api/floor-plans";
import { useFloorPlanEditorStore } from "@/stores/floor-plan-editor-store";
import { FloorPlanEditorLayout } from "@/components/floor-plan-editor/floor-plan-editor-layout";
import type { FloorPlanDocument, SaveFloorPlanRequest } from "@/types/api";
import type { EditorCamera, EditorElement } from "@/lib/floor-plan/types";

export default function FloorPlanDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const siteId = params.id as string;
  const initializedRef = useRef(false);

  const loadDocument = useFloorPlanEditorStore((s) => s.loadDocument);
  const serializeDocument = useFloorPlanEditorStore((s) => s.serializeDocument);
  const planName = useFloorPlanEditorStore((s) => s.planName);

  const { data, isLoading } = useQuery({
    queryKey: ["floor-plan", siteId],
    queryFn: () => getFloorPlanBySite(siteId),
  });

  // Initialize store from server data
  useEffect(() => {
    if (!data || initializedRef.current) return;
    initializedRef.current = true;

    const fp = data.floor_plan;
    const apiElements = fp?.document?.elements ?? [];
    // Convert legacy API elements → new editor format
    const editorElements: EditorElement[] = [];
    const editorCameras: EditorCamera[] = [];
    for (const el of apiElements) {
      if (el.type === "camera") {
        editorCameras.push({
          id: el.id,
          linkedCameraId: el.entity_id ?? null,
          name: el.name,
          iconType: "dome",
          x: el.x,
          y: el.y,
          rotation: el.rotation ?? 0,
          fovAngle: el.fov_angle ?? 90,
          range: el.fov_range ?? 80,
          color: el.color,
        });
      } else if (el.type === "nvr") {
        // Keep NVRs as room elements for now
        editorElements.push({
          id: el.id,
          type: "room",
          x: el.x,
          y: el.y,
          width: 24,
          height: 24,
          name: el.name,
          fillColor: el.color ?? "#8b5cf6",
          strokeColor: "#6d28d9",
        });
      } else {
        editorElements.push({
          id: el.id,
          type: "text",
          x: el.x,
          y: el.y,
          text: el.name,
          fontSize: 14,
        });
      }
    }

    loadDocument(
      {
        elements: editorElements,
        cameras: editorCameras,
        config: {
          canvasWidth: fp?.canvas_width ?? 1200,
          canvasHeight: fp?.canvas_height ?? 800,
          gridSize: fp?.grid_size ?? 20,
          gridEnabled: true,
        },
      },
      fp?.name ?? `Plano - ${data.site.name}`,
      siteId,
    );
  }, [data, siteId, loadDocument]);

  const saveMut = useMutation({
    mutationFn: (req: SaveFloorPlanRequest) => saveFloorPlan(siteId, req),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["floor-plan", siteId] });
      queryClient.invalidateQueries({ queryKey: ["floor-plan-sites"] });
      toast.success("Plano guardado");
    },
    onError: () => toast.error("Error al guardar plano"),
  });

  const handleSave = useCallback(() => {
    const doc = serializeDocument();
    // Map back to API format
    const apiElements = [
      ...doc.cameras.map((c) => ({
        id: c.id,
        type: "camera" as const,
        entity_id: c.linkedCameraId ?? undefined,
        name: c.name,
        x: c.x,
        y: c.y,
        rotation: c.rotation,
        fov_angle: c.fovAngle,
        fov_range: c.range,
        color: c.color,
      })),
      ...doc.elements.map((el) => ({
        id: el.id,
        type: (el.type === "room" || el.type === "zone" ? "label" : "label") as "camera" | "nvr" | "label",
        name: el.name ?? el.text ?? "",
        x: el.x,
        y: el.y,
        color: el.fillColor,
      })),
    ];
    const apiDoc: FloorPlanDocument = { elements: apiElements };
    saveMut.mutate({
      name: planName,
      version: data?.floor_plan?.version ?? 1,
      canvas_width: doc.config.canvasWidth,
      canvas_height: doc.config.canvasHeight,
      grid_size: doc.config.gridSize,
      background_file_id: data?.floor_plan?.background_file_id,
      document: apiDoc,
    });
  }, [serializeDocument, planName, data, saveMut, siteId]);

  if (isLoading) {
    return <div className="flex items-center justify-center h-64 text-muted-foreground">Cargando plano...</div>;
  }

  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push("/floor-plans")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-xl font-bold tracking-tight">{data?.site.name}</h1>
          <p className="text-xs text-muted-foreground">
            {data?.site.camera_count} cámaras · {data?.site.nvr_count} NVRs
          </p>
        </div>
      </div>

      <FloorPlanEditorLayout onSave={handleSave} isSaving={saveMut.isPending} />
    </div>
  );
}
