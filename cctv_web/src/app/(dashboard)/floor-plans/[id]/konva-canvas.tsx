"use client";

import { useRef, useEffect, useState } from "react";
import { Stage, Layer, Rect, Circle, Line, Text, Group, Wedge } from "react-konva";
import type Konva from "konva";
import type { FloorPlanElement } from "@/types/api";

interface KonvaCanvasProps {
  width: number;
  height: number;
  gridSize: number;
  showGrid: boolean;
  scale: number;
  elements: FloorPlanElement[];
  selectedId: string | null;
  backgroundUrl?: string;
  onSelect: (id: string | null) => void;
  onElementMove: (id: string, x: number, y: number) => void;
}

export default function KonvaCanvas({
  width,
  height,
  gridSize,
  showGrid,
  scale,
  elements,
  selectedId,
  backgroundUrl,
  onSelect,
  onElementMove,
}: KonvaCanvasProps) {
  const [bgImage, setBgImage] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    if (!backgroundUrl) {
      setBgImage(null);
      return;
    }
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.src = backgroundUrl;
    img.onload = () => setBgImage(img);
  }, [backgroundUrl]);

  // Grid lines
  const gridLines: React.ReactNode[] = [];
  if (showGrid) {
    for (let x = 0; x <= width; x += gridSize) {
      gridLines.push(
        <Line key={`gv-${x}`} points={[x, 0, x, height]} stroke="#e5e7eb" strokeWidth={0.5} />
      );
    }
    for (let y = 0; y <= height; y += gridSize) {
      gridLines.push(
        <Line key={`gh-${y}`} points={[0, y, width, y]} stroke="#e5e7eb" strokeWidth={0.5} />
      );
    }
  }

  function handleDragEnd(el: FloorPlanElement, e: Konva.KonvaEventObject<DragEvent>) {
    const node = e.target;
    onElementMove(el.id, node.x(), node.y());
  }

  function renderElement(el: FloorPlanElement) {
    const isSelected = selectedId === el.id;

    if (el.type === "camera") {
      const rotDeg = el.rotation ?? 0;
      const fovAngle = el.fov_angle ?? 90;
      const fovRange = el.fov_range ?? 80;

      return (
        <Group
          key={el.id}
          x={el.x}
          y={el.y}
          draggable
          onClick={() => onSelect(el.id)}
          onTap={() => onSelect(el.id)}
          onDragEnd={(e) => handleDragEnd(el, e)}
        >
          {/* FOV cone */}
          <Wedge
            radius={fovRange}
            angle={fovAngle}
            rotation={rotDeg - fovAngle / 2}
            fill={el.color ?? "#3b82f6"}
            opacity={0.15}
          />
          {/* Camera dot */}
          <Circle
            radius={8}
            fill={el.color ?? "#3b82f6"}
            stroke={isSelected ? "#000" : "transparent"}
            strokeWidth={isSelected ? 2 : 0}
          />
          {/* Label */}
          <Text
            text={el.name}
            fontSize={10}
            fill="#1f2937"
            offsetX={-12}
            offsetY={4}
          />
        </Group>
      );
    }

    if (el.type === "nvr") {
      return (
        <Group
          key={el.id}
          x={el.x}
          y={el.y}
          draggable
          onClick={() => onSelect(el.id)}
          onTap={() => onSelect(el.id)}
          onDragEnd={(e) => handleDragEnd(el, e)}
        >
          <Rect
            width={20}
            height={20}
            offsetX={10}
            offsetY={10}
            fill={el.color ?? "#8b5cf6"}
            cornerRadius={3}
            stroke={isSelected ? "#000" : "transparent"}
            strokeWidth={isSelected ? 2 : 0}
          />
          <Text
            text={el.name}
            fontSize={10}
            fill="#1f2937"
            offsetX={-14}
            offsetY={4}
          />
        </Group>
      );
    }

    // label type
    return (
      <Group
        key={el.id}
        x={el.x}
        y={el.y}
        draggable
        onClick={() => onSelect(el.id)}
        onTap={() => onSelect(el.id)}
        onDragEnd={(e) => handleDragEnd(el, e)}
      >
        <Text
          text={el.name}
          fontSize={14}
          fill={el.color ?? "#374151"}
          fontStyle={isSelected ? "bold" : "normal"}
        />
      </Group>
    );
  }

  return (
    <Stage
      width={width * scale}
      height={height * scale}
      scaleX={scale}
      scaleY={scale}
      onClick={(e) => {
        if (e.target === e.target.getStage()) onSelect(null);
      }}
    >
      <Layer>
        {/* Background */}
        <Rect x={0} y={0} width={width} height={height} fill="#ffffff" />

        {/* Background image */}
        {bgImage && (
          <Rect
            x={0}
            y={0}
            width={width}
            height={height}
            fillPatternImage={bgImage}
            fillPatternScaleX={width / bgImage.width}
            fillPatternScaleY={height / bgImage.height}
          />
        )}

        {/* Grid */}
        {gridLines}

        {/* Border */}
        <Rect x={0} y={0} width={width} height={height} stroke="#d1d5db" strokeWidth={1} />

        {/* Elements */}
        {elements.map(renderElement)}
      </Layer>
    </Stage>
  );
}
