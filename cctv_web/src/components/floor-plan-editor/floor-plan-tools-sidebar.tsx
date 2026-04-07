"use client";

import {
  MousePointer2,
  Square,
  Minus,
  Type,
  Video,
  Layers,
  DoorOpen,
  Hand,
  Hexagon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFloorPlanEditorStore } from "@/stores/floor-plan-editor-store";
import type { ActiveTool } from "@/lib/floor-plan/types";
import { TOOL_LABELS } from "@/lib/floor-plan/types";

const TOOLS: { tool: ActiveTool; icon: typeof MousePointer2; shortcut?: string }[] = [
  { tool: "select", icon: MousePointer2, shortcut: "V" },
  { tool: "room", icon: Square, shortcut: "R" },
  { tool: "wall", icon: Minus, shortcut: "W" },
  { tool: "text", icon: Type, shortcut: "T" },
  { tool: "camera", icon: Video, shortcut: "C" },
  { tool: "zone", icon: Layers, shortcut: "Z" },
  { tool: "door", icon: DoorOpen, shortcut: "D" },
  { tool: "polygon", icon: Hexagon, shortcut: "P" },
  { tool: "pan", icon: Hand, shortcut: "H" },
];

export function FloorPlanToolsSidebar() {
  const activeTool = useFloorPlanEditorStore((s) => s.activeTool);
  const setActiveTool = useFloorPlanEditorStore((s) => s.setActiveTool);

  return (
    <div className="flex w-12 flex-col items-center gap-1 border-r border-gray-200 bg-gray-50 py-2 dark:border-gray-700 dark:bg-gray-900">
      {TOOLS.map(({ tool, icon: Icon, shortcut }) => (
        <Button
          key={tool}
          variant={activeTool === tool ? "default" : "ghost"}
          size="icon"
          className="h-9 w-9"
          onClick={() => setActiveTool(tool)}
          title={`${TOOL_LABELS[tool]}${shortcut ? ` (${shortcut})` : ""}`}
        >
          <Icon className="h-4 w-4" />
        </Button>
      ))}
    </div>
  );
}
