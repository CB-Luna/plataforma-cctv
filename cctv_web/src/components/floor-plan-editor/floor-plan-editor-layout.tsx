"use client";

import { useRef, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import type Konva from "konva";
import { FloorPlanToolbar } from "./floor-plan-toolbar";
import { FloorPlanToolsSidebar } from "./floor-plan-tools-sidebar";
import { FloorPlanPropertiesPanel } from "./floor-plan-properties-panel";
import { useFloorPlanEditorStore } from "@/stores/floor-plan-editor-store";
import { exportCanvasPNG } from "@/lib/floor-plan/exporter";
import type { ActiveTool } from "@/lib/floor-plan/types";

const FloorPlanCanvas = dynamic(() => import("./floor-plan-canvas"), { ssr: false });

interface FloorPlanEditorLayoutProps {
  onSave: () => void;
  isSaving: boolean;
}

const KEY_TOOL_MAP: Record<string, ActiveTool> = {
  v: "select",
  r: "room",
  w: "wall",
  t: "text",
  c: "camera",
  z: "zone",
  d: "door",
  p: "polygon",
  h: "pan",
};

export function FloorPlanEditorLayout({ onSave, isSaving }: FloorPlanEditorLayoutProps) {
  const stageRef = useRef<Konva.Stage | null>(null);
  const setActiveTool = useFloorPlanEditorStore((s) => s.setActiveTool);
  const deleteSelected = useFloorPlanEditorStore((s) => s.deleteSelected);
  const undo = useFloorPlanEditorStore((s) => s.undo);
  const redo = useFloorPlanEditorStore((s) => s.redo);
  const cancelDrawing = useFloorPlanEditorStore((s) => s.cancelDrawing);
  const finishPolygon = useFloorPlanEditorStore((s) => s.finishPolygon);

  const handleExport = useCallback(() => exportCanvasPNG(stageRef), []);

  // Keyboard shortcuts
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      // Ignore if a text input is focused
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if ((e.ctrlKey || e.metaKey) && e.key === "z" && e.shiftKey) {
        e.preventDefault();
        redo();
      } else if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        onSave();
      } else if (e.key === "Delete" || e.key === "Backspace") {
        deleteSelected();
      } else if (e.key === "Escape") {
        cancelDrawing();
      } else if (e.key === "Enter") {
        finishPolygon();
      } else {
        const tool = KEY_TOOL_MAP[e.key.toLowerCase()];
        if (tool) setActiveTool(tool);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [setActiveTool, deleteSelected, undo, redo, onSave, cancelDrawing, finishPolygon]);

  return (
    <div className="flex h-[calc(100vh-7rem)] flex-col gap-2">
      <FloorPlanToolbar onSave={onSave} onExport={handleExport} isSaving={isSaving} />
      <div className="flex flex-1 overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
        <FloorPlanToolsSidebar />
        <div className="flex-1 overflow-auto bg-gray-100 dark:bg-gray-950">
          <FloorPlanCanvas stageRef={stageRef} />
        </div>
        <FloorPlanPropertiesPanel />
      </div>
    </div>
  );
}
