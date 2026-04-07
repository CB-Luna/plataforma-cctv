"use client";


import { Stage, Layer, Rect, Circle, Line, Text, Group, Wedge, Transformer } from "react-konva";
import type Konva from "konva";
import { useRef, useEffect } from "react";
import { useFloorPlanEditorStore } from "@/stores/floor-plan-editor-store";
import { ZONE_COLORS } from "@/lib/floor-plan/types";
import type { EditorElement, EditorCamera } from "@/lib/floor-plan/types";

interface FloorPlanCanvasProps {
  stageRef: React.RefObject<Konva.Stage | null>;
}

/* ── Overlap detection helper ────────────────────────────── */

function getElementBounds(el: EditorElement): { x1: number; y1: number; x2: number; y2: number } | null {
  if (el.type === "room" || el.type === "zone") {
    return { x1: el.x, y1: el.y, x2: el.x + (el.width ?? 120), y2: el.y + (el.height ?? 80) };
  }
  if (el.type === "polygon" && el.points && el.points.length >= 4) {
    const xs = el.points.filter((_, i) => i % 2 === 0).map((v) => v + el.x);
    const ys = el.points.filter((_, i) => i % 2 === 1).map((v) => v + el.y);
    return { x1: Math.min(...xs), y1: Math.min(...ys), x2: Math.max(...xs), y2: Math.max(...ys) };
  }
  return null;
}

function boundsOverlap(a: { x1: number; y1: number; x2: number; y2: number }, b: { x1: number; y1: number; x2: number; y2: number }): boolean {
  return a.x1 < b.x2 && a.x2 > b.x1 && a.y1 < b.y2 && a.y2 > b.y1;
}

function getOverlappingIds(elements: EditorElement[]): Set<string> {
  const overlapping = new Set<string>();
  const bounded = elements
    .filter((e) => e.visible !== false && (e.type === "room" || e.type === "zone" || e.type === "polygon"))
    .map((e) => ({ id: e.id, bounds: getElementBounds(e) }))
    .filter((e): e is { id: string; bounds: NonNullable<ReturnType<typeof getElementBounds>> } => e.bounds !== null);

  for (let i = 0; i < bounded.length; i++) {
    for (let j = i + 1; j < bounded.length; j++) {
      if (boundsOverlap(bounded[i].bounds, bounded[j].bounds)) {
        overlapping.add(bounded[i].id);
        overlapping.add(bounded[j].id);
      }
    }
  }
  return overlapping;
}

/* ── Canvas component ────────────────────────────────────── */

export default function FloorPlanCanvas({ stageRef }: FloorPlanCanvasProps) {
  const {
    canvasWidth, canvasHeight, gridSize, gridEnabled, zoom,
    elements, cameras, selectedId, activeTool, snapToGrid,
    drawingPoints, mousePos,
    selectItem, updateElement, updateCamera, addElement, addCamera,
    addDrawingPoint, setMousePos, finishPolygon,
  } = useFloorPlanEditorStore();

  const transformerRef = useRef<Konva.Transformer | null>(null);
  const selectedNodeRef = useRef<Konva.Node | null>(null);

  const snap = (v: number) => (snapToGrid ? Math.round(v / gridSize) * gridSize : v);

  // Overlap detection
  const overlappingIds = getOverlappingIds(elements);

  // Attach transformer to selected node
  useEffect(() => {
    const tr = transformerRef.current;
    if (!tr) return;
    if (selectedId && selectedNodeRef.current) {
      tr.nodes([selectedNodeRef.current]);
      tr.getLayer()?.batchDraw();
    } else {
      tr.nodes([]);
      tr.getLayer()?.batchDraw();
    }
  }, [selectedId]);

  // Grid lines
  const gridLines: React.ReactNode[] = [];
  if (gridEnabled) {
    for (let x = 0; x <= canvasWidth; x += gridSize) {
      gridLines.push(<Line key={`gv-${x}`} points={[x, 0, x, canvasHeight]} stroke="#e5e7eb" strokeWidth={0.5} listening={false} />);
    }
    for (let y = 0; y <= canvasHeight; y += gridSize) {
      gridLines.push(<Line key={`gh-${y}`} points={[0, y, canvasWidth, y]} stroke="#e5e7eb" strokeWidth={0.5} listening={false} />);
    }
  }

  function getPointerPos(e: Konva.KonvaEventObject<MouseEvent>): { x: number; y: number } | null {
    const stage = e.target.getStage();
    if (!stage) return null;
    const pos = stage.getPointerPosition();
    if (!pos) return null;
    return { x: snap(pos.x / zoom), y: snap(pos.y / zoom) };
  }

  function handleStageClick(e: Konva.KonvaEventObject<MouseEvent>) {
    const target = e.target;
    const stage = target.getStage();
    if (!stage) return;
    const isBackground = target === stage || target.attrs?.id === "canvas-bg";
    if (!isBackground) return;
    const pos = getPointerPos(e);
    if (!pos) return;
    const { x, y } = pos;

    if (activeTool === "polygon") {
      addDrawingPoint(x, y);
      return;
    }

    if (activeTool === "room") {
      addElement({ id: `room-${Date.now()}`, type: "room", x, y, width: 120, height: 80, name: "Sala", fillColor: "#e0f2fe", strokeColor: "#0284c7" });
    } else if (activeTool === "wall") {
      addElement({ id: `wall-${Date.now()}`, type: "wall", x, y, points: [0, 0, 100, 0], thickness: 4 });
    } else if (activeTool === "text") {
      addElement({ id: `text-${Date.now()}`, type: "text", x, y, text: "Texto", fontSize: 16 });
    } else if (activeTool === "camera") {
      addCamera({ id: `cam-${Date.now()}`, name: "Cámara", iconType: "dome", x, y, rotation: 0, fovAngle: 90, range: 80, color: "#3b82f6" });
    } else if (activeTool === "zone") {
      addElement({ id: `zone-${Date.now()}`, type: "zone", x, y, width: 160, height: 120, zoneType: "coverage", name: "Zona" });
    } else if (activeTool === "door") {
      addElement({ id: `door-${Date.now()}`, type: "door", x, y, width: 60, doorSwing: "left" });
    } else {
      selectItem(null, null);
    }
  }

  function handleDoubleClick(e: Konva.KonvaEventObject<MouseEvent>) {
    // Double-click closes polygon
    if (activeTool === "polygon" && drawingPoints.length >= 6) {
      e.evt.preventDefault();
      finishPolygon();
    }
  }

  function handleMouseMove(e: Konva.KonvaEventObject<MouseEvent>) {
    // Track mouse for polygon drawing guides and room/zone placement preview
    if (activeTool === "polygon" && drawingPoints.length > 0) {
      const pos = getPointerPos(e);
      if (pos) setMousePos(pos);
      return;
    }
    if (activeTool === "room" || activeTool === "zone" || activeTool === "door" || activeTool === "camera") {
      const pos = getPointerPos(e);
      if (pos) setMousePos(pos);
      return;
    }
    if (mousePos) setMousePos(null);
  }

  function onElementDragEnd(el: EditorElement, e: Konva.KonvaEventObject<DragEvent>) {
    updateElement(el.id, { x: snap(e.target.x()), y: snap(e.target.y()) });
  }

  function onCameraDragEnd(cam: EditorCamera, e: Konva.KonvaEventObject<DragEvent>) {
    updateCamera(cam.id, { x: snap(e.target.x()), y: snap(e.target.y()) });
  }

  function handleTransformEnd(el: EditorElement, e: Konva.KonvaEventObject<Event>) {
    const node = e.target;
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();
    node.scaleX(1);
    node.scaleY(1);
    updateElement(el.id, {
      x: snap(node.x()),
      y: snap(node.y()),
      width: Math.max(20, snap((el.width ?? 120) * scaleX)),
      height: Math.max(20, snap((el.height ?? 80) * scaleY)),
      rotation: Math.round(node.rotation()),
    });
  }

  function setNodeRef(id: string) {
    return (node: Konva.Group | Konva.Rect | null) => {
      if (id === selectedId) selectedNodeRef.current = node;
    };
  }

  function renderElement(el: EditorElement) {
    const isSel = selectedId === el.id;
    const isLocked = el.locked;
    const isOverlapping = overlappingIds.has(el.id);
    const overlapStroke = isOverlapping ? "#ef4444" : undefined;

    if (el.type === "room") {
      return (
        <Group key={el.id} ref={setNodeRef(el.id)} x={el.x} y={el.y}
          rotation={el.rotation ?? 0}
          draggable={!isLocked}
          onClick={() => selectItem(el.id, "element")} onTap={() => selectItem(el.id, "element")}
          onDragEnd={(e) => onElementDragEnd(el, e)}
          onTransformEnd={(e) => handleTransformEnd(el, e)}>
          <Rect width={el.width ?? 120} height={el.height ?? 80}
            fill={el.fillColor ?? "#e0f2fe"}
            stroke={isSel ? "#000" : (overlapStroke ?? el.strokeColor ?? "#0284c7")}
            strokeWidth={isSel ? 2 : (isOverlapping ? 2 : 1)} cornerRadius={2} />
          {el.name && <Text text={el.name} fontSize={11} fill="#1e3a5f" x={4} y={4} listening={false} />}
          {isOverlapping && (
            <Text text="⚠" fontSize={14} x={(el.width ?? 120) - 18} y={2} fill="#ef4444" listening={false} />
          )}
        </Group>
      );
    }

    if (el.type === "wall") {
      return (
        <Line key={el.id} x={el.x} y={el.y} points={el.points ?? [0, 0, 100, 0]}
          stroke={isSel ? "#000" : "#374151"} strokeWidth={el.thickness ?? 4}
          lineCap="round" draggable={!isLocked}
          onClick={() => selectItem(el.id, "element")} onTap={() => selectItem(el.id, "element")}
          onDragEnd={(e) => onElementDragEnd(el, e)} />
      );
    }

    if (el.type === "zone") {
      const zoneColor = el.zoneType ? ZONE_COLORS[el.zoneType] : "#22c55e";
      return (
        <Group key={el.id} ref={setNodeRef(el.id)} x={el.x} y={el.y}
          rotation={el.rotation ?? 0}
          draggable={!isLocked}
          onClick={() => selectItem(el.id, "element")} onTap={() => selectItem(el.id, "element")}
          onDragEnd={(e) => onElementDragEnd(el, e)}
          onTransformEnd={(e) => handleTransformEnd(el, e)}>
          <Rect width={el.width ?? 160} height={el.height ?? 120}
            fill={zoneColor} opacity={0.18}
            stroke={isSel ? "#000" : (overlapStroke ?? zoneColor)}
            strokeWidth={isSel ? 2 : (isOverlapping ? 2 : 1)} dash={[6, 4]} />
          {el.name && <Text text={el.name} fontSize={11} fill={zoneColor} x={4} y={4} fontStyle="bold" listening={false} />}
          {isOverlapping && (
            <Text text="⚠" fontSize={14} x={(el.width ?? 160) - 18} y={2} fill="#ef4444" listening={false} />
          )}
        </Group>
      );
    }

    if (el.type === "door") {
      const w = el.width ?? 60;
      const swing = el.doorSwing ?? "left";
      return (
        <Group key={el.id} x={el.x} y={el.y} draggable={!isLocked}
          onClick={() => selectItem(el.id, "element")} onTap={() => selectItem(el.id, "element")}
          onDragEnd={(e) => onElementDragEnd(el, e)}>
          <Line points={[0, 0, w, 0]} stroke={isSel ? "#000" : "#8b5cf6"} strokeWidth={3} lineCap="round" />
          <Wedge
            x={swing === "left" ? 0 : w} y={0}
            radius={w} angle={90}
            rotation={swing === "left" ? -90 : 180}
            fill="#8b5cf6" opacity={0.1}
            stroke={isSel ? "#000" : "#8b5cf6"} strokeWidth={1} dash={[4, 4]}
          />
          <Circle x={swing === "left" ? 0 : w} y={0} radius={3} fill="#8b5cf6" />
        </Group>
      );
    }

    if (el.type === "polygon") {
      const pts = el.points ?? [];
      if (pts.length < 4) return null;
      return (
        <Group key={el.id} ref={setNodeRef(el.id)} x={el.x} y={el.y}
          rotation={el.rotation ?? 0}
          draggable={!isLocked}
          onClick={() => selectItem(el.id, "element")} onTap={() => selectItem(el.id, "element")}
          onDragEnd={(e) => onElementDragEnd(el, e)}>
          <Line points={pts} closed fill={el.fillColor ?? "#dbeafe"}
            stroke={isSel ? "#000" : (overlapStroke ?? el.strokeColor ?? "#2563eb")}
            strokeWidth={isSel ? 2 : (isOverlapping ? 2 : 1)} />
          {el.name && <Text text={el.name} fontSize={11} fill="#1e3a5f" x={4} y={4} listening={false} />}
          {/* Show vertex dots when selected */}
          {isSel && pts.length >= 2 && (
            <>
              {Array.from({ length: pts.length / 2 }).map((_, i) => (
                <Circle key={`v-${i}`} x={pts[i * 2]} y={pts[i * 2 + 1]}
                  radius={4} fill="#2563eb" stroke="#fff" strokeWidth={1} listening={false} />
              ))}
            </>
          )}
          {isOverlapping && (
            <Text text="⚠" fontSize={14} x={4} y={18} fill="#ef4444" listening={false} />
          )}
        </Group>
      );
    }

    // Text
    return (
      <Group key={el.id} x={el.x} y={el.y} draggable={!isLocked}
        onClick={() => selectItem(el.id, "element")} onTap={() => selectItem(el.id, "element")}
        onDragEnd={(e) => onElementDragEnd(el, e)}>
        <Text text={el.text ?? "Texto"} fontSize={el.fontSize ?? 16}
          fill={isSel ? "#000" : "#374151"} fontStyle={isSel ? "bold" : "normal"} />
      </Group>
    );
  }

  function renderCamera(cam: EditorCamera) {
    const isSel = selectedId === cam.id;
    return (
      <Group key={cam.id} x={cam.x} y={cam.y} draggable
        onClick={() => selectItem(cam.id, "camera")} onTap={() => selectItem(cam.id, "camera")}
        onDragEnd={(e) => onCameraDragEnd(cam, e)}>
        <Wedge radius={cam.range} angle={cam.fovAngle}
          rotation={cam.rotation - cam.fovAngle / 2}
          fill={cam.color ?? "#3b82f6"} opacity={0.15} />
        <Circle radius={cam.iconType === "dome" ? 9 : 7}
          fill={cam.color ?? "#3b82f6"}
          stroke={isSel ? "#000" : "transparent"} strokeWidth={isSel ? 2 : 0} />
        <Text text={cam.name} fontSize={10} fill="#1f2937" offsetX={-12} offsetY={4} listening={false} />
      </Group>
    );
  }

  /* ── Drawing preview (guide lines) ──────────────────────── */
  function renderDrawingPreview() {
    if (activeTool !== "polygon" || drawingPoints.length === 0) return null;

    const nodes: React.ReactNode[] = [];

    // Solid lines between placed points
    if (drawingPoints.length >= 4) {
      nodes.push(
        <Line key="draw-solid" points={drawingPoints}
          stroke="#2563eb" strokeWidth={2} listening={false} />
      );
    }

    // Dotted line from last point to cursor
    if (mousePos && drawingPoints.length >= 2) {
      const lastX = drawingPoints[drawingPoints.length - 2];
      const lastY = drawingPoints[drawingPoints.length - 1];
      nodes.push(
        <Line key="draw-cursor" points={[lastX, lastY, mousePos.x, mousePos.y]}
          stroke="#2563eb" strokeWidth={1.5} dash={[6, 4]} opacity={0.7} listening={false} />
      );

      // Closing guide: dotted line from cursor to first point
      if (drawingPoints.length >= 6) {
        const firstX = drawingPoints[0];
        const firstY = drawingPoints[1];
        nodes.push(
          <Line key="draw-close" points={[mousePos.x, mousePos.y, firstX, firstY]}
            stroke="#2563eb" strokeWidth={1} dash={[4, 4]} opacity={0.4} listening={false} />
        );
      }

      // Horizontal + vertical crosshair guides from cursor
      nodes.push(
        <Line key="guide-h" points={[0, mousePos.y, canvasWidth, mousePos.y]}
          stroke="#3b82f6" strokeWidth={0.5} dash={[4, 8]} opacity={0.3} listening={false} />
      );
      nodes.push(
        <Line key="guide-v" points={[mousePos.x, 0, mousePos.x, canvasHeight]}
          stroke="#3b82f6" strokeWidth={0.5} dash={[4, 8]} opacity={0.3} listening={false} />
      );
    }

    // Vertex dots
    for (let i = 0; i < drawingPoints.length; i += 2) {
      const isFirst = i === 0;
      nodes.push(
        <Circle key={`dp-${i}`} x={drawingPoints[i]} y={drawingPoints[i + 1]}
          radius={isFirst ? 6 : 4}
          fill={isFirst ? "#16a34a" : "#2563eb"}
          stroke="#fff" strokeWidth={isFirst ? 2 : 1}
          listening={false} />
      );
    }

    // Instruction text
    const instrText = drawingPoints.length < 6
      ? "Clic para añadir puntos (mín. 3)"
      : "Doble-clic o Enter para cerrar • Esc para cancelar";
    nodes.push(
      <Text key="draw-instr"
        x={drawingPoints[0] ?? 0} y={(drawingPoints[1] ?? 0) - 20}
        text={instrText} fontSize={11} fill="#2563eb" opacity={0.8} listening={false} />
    );

    return nodes;
  }

  /* ── Placement preview (room, zone, door, camera) ──────── */
  function renderPlacementPreview() {
    if (!mousePos) return null;
    if (activeTool === "polygon" || activeTool === "select" || activeTool === "pan" || activeTool === "wall" || activeTool === "text") return null;
    const nodes: React.ReactNode[] = [];

    // Crosshair guides
    nodes.push(
      <Line key="ph-h" points={[0, mousePos.y, canvasWidth, mousePos.y]}
        stroke="#3b82f6" strokeWidth={0.5} dash={[4, 8]} opacity={0.3} listening={false} />,
      <Line key="ph-v" points={[mousePos.x, 0, mousePos.x, canvasHeight]}
        stroke="#3b82f6" strokeWidth={0.5} dash={[4, 8]} opacity={0.3} listening={false} />
    );

    if (activeTool === "room") {
      const w = 120, h = 80;
      nodes.push(
        <Rect key="ph-room" x={mousePos.x} y={mousePos.y} width={w} height={h}
          fill="#e0f2fe" opacity={0.5} stroke="#0284c7" strokeWidth={1} dash={[6, 3]} listening={false} />,
        <Text key="ph-room-t" x={mousePos.x + 4} y={mousePos.y + 4}
          text="Sala" fontSize={11} fill="#0284c7" opacity={0.7} listening={false} />
      );
    } else if (activeTool === "zone") {
      const w = 160, h = 120;
      nodes.push(
        <Rect key="ph-zone" x={mousePos.x} y={mousePos.y} width={w} height={h}
          fill="#22c55e" opacity={0.12} stroke="#22c55e" strokeWidth={1} dash={[6, 4]} listening={false} />,
        <Text key="ph-zone-t" x={mousePos.x + 4} y={mousePos.y + 4}
          text="Zona" fontSize={11} fill="#22c55e" opacity={0.7} listening={false} />
      );
    } else if (activeTool === "door") {
      const w = 60;
      nodes.push(
        <Line key="ph-door" points={[mousePos.x, mousePos.y, mousePos.x + w, mousePos.y]}
          stroke="#8b5cf6" strokeWidth={3} opacity={0.5} dash={[6, 3]} lineCap="round" listening={false} />
      );
    } else if (activeTool === "camera") {
      nodes.push(
        <Circle key="ph-cam" x={mousePos.x} y={mousePos.y} radius={9}
          fill="#3b82f6" opacity={0.4} stroke="#3b82f6" strokeWidth={1} dash={[4, 3]} listening={false} />,
        <Wedge key="ph-fov" x={mousePos.x} y={mousePos.y} radius={80} angle={90}
          rotation={-45} fill="#3b82f6" opacity={0.08} listening={false} />
      );
    }

    // Instruction text
    const labels: Record<string, string> = {
      room: "Clic para colocar habitación",
      zone: "Clic para colocar zona",
      door: "Clic para colocar puerta",
      camera: "Clic para colocar cámara",
    };
    const label = labels[activeTool];
    if (label) {
      nodes.push(
        <Text key="ph-instr" x={mousePos.x} y={mousePos.y - 20}
          text={label} fontSize={11} fill="#2563eb" opacity={0.8} listening={false} />
      );
    }

    return nodes;
  }

  /* ── Cursor style ───────────────────────────────────────── */
  const cursorStyle = activeTool === "pan" ? "grab"
    : activeTool === "select" ? "default"
    : activeTool === "polygon" ? "crosshair"
    : "crosshair";

  return (
    <Stage
      ref={stageRef}
      width={canvasWidth * zoom}
      height={canvasHeight * zoom}
      scaleX={zoom}
      scaleY={zoom}
      onClick={handleStageClick}
      onDblClick={handleDoubleClick}
      onMouseMove={handleMouseMove}
      style={{ cursor: cursorStyle }}
    >
      <Layer>
        <Rect id="canvas-bg" x={0} y={0} width={canvasWidth} height={canvasHeight} fill="#ffffff" />
        {gridLines}
        <Rect x={0} y={0} width={canvasWidth} height={canvasHeight} stroke="#d1d5db" strokeWidth={1} listening={false} />
        {elements.filter((e) => e.visible !== false).map(renderElement)}
        {cameras.map(renderCamera)}
        {renderDrawingPreview()}
        {renderPlacementPreview()}
        {/* Transformer for rotation/resize handles */}
        <Transformer
          ref={transformerRef}
          rotateEnabled
          enabledAnchors={["top-left", "top-right", "bottom-left", "bottom-right", "middle-left", "middle-right", "top-center", "bottom-center"]}
          boundBoxFunc={(_oldBox, newBox) => {
            if (newBox.width < 20 || newBox.height < 20) return _oldBox;
            return newBox;
          }}
        />
      </Layer>
    </Stage>
  );
}
