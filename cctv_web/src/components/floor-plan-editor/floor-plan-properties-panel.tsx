"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useFloorPlanEditorStore } from "@/stores/floor-plan-editor-store";
import { ZONE_LABELS } from "@/lib/floor-plan/types";
import type { ZoneType } from "@/lib/floor-plan/types";
import { Trash2, Lock, Unlock, EyeOff } from "lucide-react";

export function FloorPlanPropertiesPanel() {
  const selectedId = useFloorPlanEditorStore((s) => s.selectedId);
  const selectedType = useFloorPlanEditorStore((s) => s.selectedType);
  const elements = useFloorPlanEditorStore((s) => s.elements);
  const cameras = useFloorPlanEditorStore((s) => s.cameras);
  const updateElement = useFloorPlanEditorStore((s) => s.updateElement);
  const updateCamera = useFloorPlanEditorStore((s) => s.updateCamera);
  const deleteSelected = useFloorPlanEditorStore((s) => s.deleteSelected);
  const planName = useFloorPlanEditorStore((s) => s.planName);
  const setPlanName = useFloorPlanEditorStore((s) => s.setPlanName);
  const canvasWidth = useFloorPlanEditorStore((s) => s.canvasWidth);
  const canvasHeight = useFloorPlanEditorStore((s) => s.canvasHeight);
  const setCanvasSize = useFloorPlanEditorStore((s) => s.setCanvasSize);
  const gridSize = useFloorPlanEditorStore((s) => s.gridSize);
  const setGridSize = useFloorPlanEditorStore((s) => s.setGridSize);

  const el = selectedType === "element" ? elements.find((e) => e.id === selectedId) : null;
  const cam = selectedType === "camera" ? cameras.find((c) => c.id === selectedId) : null;

  return (
    <div className="w-56 shrink-0 overflow-y-auto border-l border-gray-200 bg-gray-50 p-3 text-xs dark:border-gray-700 dark:bg-gray-900">
      {/* Plan config - always visible */}
      <p className="mb-2 font-semibold text-muted-foreground uppercase tracking-wider" style={{ fontSize: 10 }}>Plano</p>
      <div className="space-y-2 mb-4">
        <div>
          <Label className="text-xs">Nombre</Label>
          <Input className="h-7 text-xs" value={planName} onChange={(e) => setPlanName(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-1">
          <div>
            <Label className="text-xs">Ancho</Label>
            <Input className="h-7 text-xs" type="number" value={canvasWidth} onChange={(e) => setCanvasSize(Number(e.target.value), canvasHeight)} />
          </div>
          <div>
            <Label className="text-xs">Alto</Label>
            <Input className="h-7 text-xs" type="number" value={canvasHeight} onChange={(e) => setCanvasSize(canvasWidth, Number(e.target.value))} />
          </div>
        </div>
        <div>
          <Label className="text-xs">Grid (px)</Label>
          <Input className="h-7 text-xs" type="number" value={gridSize} onChange={(e) => setGridSize(Number(e.target.value))} />
        </div>
      </div>

      {!el && !cam && (
        <p className="text-muted-foreground text-center py-4">Selecciona un elemento para editar sus propiedades</p>
      )}

      {/* Element properties */}
      {el && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="font-semibold uppercase tracking-wider" style={{ fontSize: 10 }}>
              {el.type === "room" ? "Habitación" : el.type === "wall" ? "Muro" : el.type === "zone" ? "Zona" : el.type === "polygon" ? "Polígono" : el.type === "door" ? "Puerta" : "Texto"}
            </p>
            <div className="flex gap-0.5">
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => updateElement(el.id, { locked: !el.locked })} title={el.locked ? "Desbloquear" : "Bloquear"}>
                {el.locked ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3" />}
              </Button>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => updateElement(el.id, { visible: false })} title="Ocultar">
                <EyeOff className="h-3 w-3" />
              </Button>
              <Button variant="ghost" size="icon" className="h-6 w-6 text-red-500" onClick={deleteSelected} title="Eliminar">
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-1">
            <div><Label className="text-xs">X</Label><Input className="h-7 text-xs" type="number" value={Math.round(el.x)} onChange={(e) => updateElement(el.id, { x: Number(e.target.value) })} /></div>
            <div><Label className="text-xs">Y</Label><Input className="h-7 text-xs" type="number" value={Math.round(el.y)} onChange={(e) => updateElement(el.id, { y: Number(e.target.value) })} /></div>
          </div>

          {(el.type === "room" || el.type === "zone" || el.type === "polygon") && (
            <>
              <div><Label className="text-xs">Nombre</Label><Input className="h-7 text-xs" value={el.name ?? ""} onChange={(e) => updateElement(el.id, { name: e.target.value })} /></div>
            </>
          )}

          {(el.type === "room" || el.type === "zone") && (
            <div className="grid grid-cols-2 gap-1">
              <div><Label className="text-xs">Ancho</Label><Input className="h-7 text-xs" type="number" value={el.width ?? 120} onChange={(e) => updateElement(el.id, { width: Number(e.target.value) })} /></div>
              <div><Label className="text-xs">Alto</Label><Input className="h-7 text-xs" type="number" value={el.height ?? 80} onChange={(e) => updateElement(el.id, { height: Number(e.target.value) })} /></div>
            </div>
          )}

          {/* Rotation slider for rooms, zones, and polygons */}
          {(el.type === "room" || el.type === "zone" || el.type === "polygon") && (
            <div>
              <div className="flex items-center justify-between">
                <Label className="text-xs">Rotación</Label>
                <span className="text-[10px] font-mono text-muted-foreground">{el.rotation ?? 0}°</span>
              </div>
              <Slider
                min={0} max={360} step={1}
                value={[el.rotation ?? 0]}
                onValueChange={(v) => updateElement(el.id, { rotation: Array.isArray(v) ? v[0] : v })}
                className="mt-1"
              />
            </div>
          )}

          {el.type === "room" && (
            <div className="grid grid-cols-2 gap-1">
              <div><Label className="text-xs">Relleno</Label><input type="color" className="h-7 w-full rounded border" value={el.fillColor ?? "#e0f2fe"} onChange={(e) => updateElement(el.id, { fillColor: e.target.value })} /></div>
              <div><Label className="text-xs">Borde</Label><input type="color" className="h-7 w-full rounded border" value={el.strokeColor ?? "#0284c7"} onChange={(e) => updateElement(el.id, { strokeColor: e.target.value })} /></div>
            </div>
          )}

          {el.type === "zone" && (
            <div>
              <Label className="text-xs">Tipo de zona</Label>
              <select className="h-7 w-full rounded border bg-white text-xs dark:bg-gray-800" value={el.zoneType ?? "coverage"} onChange={(e) => updateElement(el.id, { zoneType: e.target.value as ZoneType })}>
                {Object.entries(ZONE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
          )}

          {el.type === "polygon" && (
            <>
              <div className="grid grid-cols-2 gap-1">
                <div><Label className="text-xs">Relleno</Label><input type="color" className="h-7 w-full rounded border" value={el.fillColor ?? "#dbeafe"} onChange={(e) => updateElement(el.id, { fillColor: e.target.value })} /></div>
                <div><Label className="text-xs">Borde</Label><input type="color" className="h-7 w-full rounded border" value={el.strokeColor ?? "#2563eb"} onChange={(e) => updateElement(el.id, { strokeColor: e.target.value })} /></div>
              </div>
              {el.points && <p className="text-[10px] text-muted-foreground">{el.points.length / 2} vértices</p>}
            </>
          )}

          {el.type === "wall" && (
            <div><Label className="text-xs">Grosor</Label><Input className="h-7 text-xs" type="number" value={el.thickness ?? 4} onChange={(e) => updateElement(el.id, { thickness: Number(e.target.value) })} /></div>
          )}

          {el.type === "text" && (
            <>
              <div><Label className="text-xs">Texto</Label><Input className="h-7 text-xs" value={el.text ?? ""} onChange={(e) => updateElement(el.id, { text: e.target.value })} /></div>
              <div><Label className="text-xs">Tamaño</Label><Input className="h-7 text-xs" type="number" value={el.fontSize ?? 16} onChange={(e) => updateElement(el.id, { fontSize: Number(e.target.value) })} /></div>
            </>
          )}
        </div>
      )}

      {/* Camera properties */}
      {cam && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="font-semibold uppercase tracking-wider" style={{ fontSize: 10 }}>Cámara</p>
            <Button variant="ghost" size="icon" className="h-6 w-6 text-red-500" onClick={deleteSelected} title="Eliminar">
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
          <div><Label className="text-xs">Nombre</Label><Input className="h-7 text-xs" value={cam.name} onChange={(e) => updateCamera(cam.id, { name: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-1">
            <div><Label className="text-xs">X</Label><Input className="h-7 text-xs" type="number" value={Math.round(cam.x)} onChange={(e) => updateCamera(cam.id, { x: Number(e.target.value) })} /></div>
            <div><Label className="text-xs">Y</Label><Input className="h-7 text-xs" type="number" value={Math.round(cam.y)} onChange={(e) => updateCamera(cam.id, { y: Number(e.target.value) })} /></div>
          </div>

          {/* Rotation slider */}
          <div>
            <div className="flex items-center justify-between">
              <Label className="text-xs">Rotación</Label>
              <span className="text-[10px] font-mono text-muted-foreground">{cam.rotation}°</span>
            </div>
            <Slider
              min={0} max={360} step={1}
              value={[cam.rotation]}
              onValueChange={(v) => updateCamera(cam.id, { rotation: Array.isArray(v) ? v[0] : v })}
              className="mt-1"
            />
          </div>

          {/* FOV slider */}
          <div>
            <div className="flex items-center justify-between">
              <Label className="text-xs">Ángulo FOV</Label>
              <span className="text-[10px] font-mono text-muted-foreground">{cam.fovAngle}°</span>
            </div>
            <Slider
              min={10} max={360} step={5}
              value={[cam.fovAngle]}
              onValueChange={(v) => updateCamera(cam.id, { fovAngle: Array.isArray(v) ? v[0] : v })}
              className="mt-1"
            />
          </div>

          {/* Range slider */}
          <div>
            <div className="flex items-center justify-between">
              <Label className="text-xs">Alcance</Label>
              <span className="text-[10px] font-mono text-muted-foreground">{cam.range} px</span>
            </div>
            <Slider
              min={10} max={400} step={5}
              value={[cam.range]}
              onValueChange={(v) => updateCamera(cam.id, { range: Array.isArray(v) ? v[0] : v })}
              className="mt-1"
            />
          </div>

          <div>
            <Label className="text-xs">Tipo</Label>
            <select className="h-7 w-full rounded border bg-white text-xs dark:bg-gray-800" value={cam.iconType} onChange={(e) => updateCamera(cam.id, { iconType: e.target.value as "bullet" | "dome" | "ptz" })}>
              <option value="dome">Domo</option>
              <option value="bullet">Bullet</option>
              <option value="ptz">PTZ</option>
            </select>
          </div>
          <div><Label className="text-xs">Color</Label><input type="color" className="h-7 w-full rounded border" value={cam.color ?? "#3b82f6"} onChange={(e) => updateCamera(cam.id, { color: e.target.value })} /></div>
        </div>
      )}
    </div>
  );
}
