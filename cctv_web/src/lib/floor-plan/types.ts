// ──── Floor Plan Editor Types ────

export type ActiveTool =
  | "select"
  | "room"
  | "wall"
  | "text"
  | "camera"
  | "zone"
  | "door"
  | "polygon"
  | "pan";

export type FloorPlanElementType = "room" | "wall" | "text" | "zone" | "door" | "polygon";

export type ZoneType = "restricted" | "critical" | "coverage" | "evacuation";

export type CameraIconType = "bullet" | "dome" | "ptz";

export interface EditorElement {
  id: string;
  type: FloorPlanElementType;
  x: number;
  y: number;
  width?: number;
  height?: number;
  rotation?: number;
  locked?: boolean;
  visible?: boolean;
  // Room
  name?: string;
  fillColor?: string;
  strokeColor?: string;
  // Wall / Polygon
  points?: number[];
  thickness?: number;
  // Text
  text?: string;
  fontSize?: number;
  // Zone
  zoneType?: ZoneType;
  // Door
  doorSwing?: "left" | "right";
}

export interface EditorCamera {
  id: string;
  linkedCameraId?: string | null;
  name: string;
  iconType: CameraIconType;
  x: number;
  y: number;
  rotation: number;
  fovAngle: number;
  range: number;
  color?: string;
}

export interface SerializedDocument {
  elements: EditorElement[];
  cameras: EditorCamera[];
  config: {
    canvasWidth: number;
    canvasHeight: number;
    gridSize: number;
    gridEnabled: boolean;
  };
}

export const ZONE_COLORS: Record<ZoneType, string> = {
  restricted: "#ef4444",
  critical: "#f59e0b",
  coverage: "#22c55e",
  evacuation: "#3b82f6",
};

export const ZONE_LABELS: Record<ZoneType, string> = {
  restricted: "Restringida",
  critical: "Crítica",
  coverage: "Cobertura",
  evacuation: "Evacuación",
};

export const TOOL_LABELS: Record<ActiveTool, string> = {
  select: "Seleccionar",
  room: "Habitación",
  wall: "Muro",
  text: "Texto",
  camera: "Cámara",
  zone: "Zona",
  door: "Puerta",
  polygon: "Polígono",
  pan: "Mover",
};
