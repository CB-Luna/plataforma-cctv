"use client";

import {
  Save,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Grid3x3,
  Undo2,
  Redo2,
  Download,
  Magnet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFloorPlanEditorStore } from "@/stores/floor-plan-editor-store";

interface FloorPlanToolbarProps {
  onSave: () => void;
  onExport: () => void;
  isSaving: boolean;
}

export function FloorPlanToolbar({ onSave, onExport, isSaving }: FloorPlanToolbarProps) {
  const zoom = useFloorPlanEditorStore((s) => s.zoom);
  const setZoom = useFloorPlanEditorStore((s) => s.setZoom);
  const gridEnabled = useFloorPlanEditorStore((s) => s.gridEnabled);
  const toggleGrid = useFloorPlanEditorStore((s) => s.toggleGrid);
  const snapToGrid = useFloorPlanEditorStore((s) => s.snapToGrid);
  const toggleSnap = useFloorPlanEditorStore((s) => s.toggleSnap);
  const undo = useFloorPlanEditorStore((s) => s.undo);
  const redo = useFloorPlanEditorStore((s) => s.redo);
  const undoStack = useFloorPlanEditorStore((s) => s.undoStack);
  const redoStack = useFloorPlanEditorStore((s) => s.redoStack);
  const elements = useFloorPlanEditorStore((s) => s.elements);
  const cameras = useFloorPlanEditorStore((s) => s.cameras);

  return (
    <div className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2 py-1 shadow-sm dark:border-gray-700 dark:bg-gray-900">
      <Button variant="outline" size="sm" className="h-7 gap-1" onClick={onSave} disabled={isSaving}>
        <Save className="h-3.5 w-3.5" />
        <span className="hidden sm:inline text-xs">{isSaving ? "Guardando..." : "Guardar"}</span>
      </Button>

      <div className="mx-1 h-5 w-px bg-gray-200 dark:bg-gray-700" />

      <Button variant="outline" size="icon" className="h-7 w-7" onClick={undo} disabled={undoStack.length === 0} title="Deshacer (Ctrl+Z)">
        <Undo2 className="h-3.5 w-3.5" />
      </Button>
      <Button variant="outline" size="icon" className="h-7 w-7" onClick={redo} disabled={redoStack.length === 0} title="Rehacer (Ctrl+Shift+Z)">
        <Redo2 className="h-3.5 w-3.5" />
      </Button>

      <div className="mx-1 h-5 w-px bg-gray-200 dark:bg-gray-700" />

      <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => setZoom(zoom + 0.1)} title="Zoom In">
        <ZoomIn className="h-3.5 w-3.5" />
      </Button>
      <span className="min-w-[3rem] text-center text-xs tabular-nums text-muted-foreground">{Math.round(zoom * 100)}%</span>
      <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => setZoom(zoom - 0.1)} title="Zoom Out">
        <ZoomOut className="h-3.5 w-3.5" />
      </Button>
      <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => setZoom(1)} title="Reset Zoom">
        <RotateCcw className="h-3.5 w-3.5" />
      </Button>

      <div className="mx-1 h-5 w-px bg-gray-200 dark:bg-gray-700" />

      <Button variant={gridEnabled ? "default" : "outline"} size="icon" className="h-7 w-7" onClick={toggleGrid} title="Grid">
        <Grid3x3 className="h-3.5 w-3.5" />
      </Button>
      <Button variant={snapToGrid ? "default" : "outline"} size="icon" className="h-7 w-7" onClick={toggleSnap} title="Snap to Grid">
        <Magnet className="h-3.5 w-3.5" />
      </Button>

      <div className="mx-1 h-5 w-px bg-gray-200 dark:bg-gray-700" />

      <Button variant="outline" size="icon" className="h-7 w-7" onClick={onExport} title="Exportar PNG">
        <Download className="h-3.5 w-3.5" />
      </Button>

      <span className="ml-auto text-xs text-muted-foreground">
        {elements.length + cameras.length} elementos
      </span>
    </div>
  );
}
