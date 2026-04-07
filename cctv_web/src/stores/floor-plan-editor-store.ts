import { create } from "zustand";
import type {
  ActiveTool,
  EditorElement,
  EditorCamera,
  SerializedDocument,
} from "@/lib/floor-plan/types";

interface HistoryEntry {
  elements: EditorElement[];
  cameras: EditorCamera[];
}

interface FloorPlanEditorState {
  // Plan metadata
  planName: string;
  siteId: string;
  canvasWidth: number;
  canvasHeight: number;
  gridSize: number;
  gridEnabled: boolean;
  snapToGrid: boolean;

  // Data
  elements: EditorElement[];
  cameras: EditorCamera[];

  // Editor state
  activeTool: ActiveTool;
  selectedId: string | null;
  selectedType: "element" | "camera" | null;
  zoom: number;

  // Polygon / multi-point drawing
  drawingPoints: number[];
  mousePos: { x: number; y: number } | null;

  // History
  undoStack: HistoryEntry[];
  redoStack: HistoryEntry[];

  // Actions — Plan
  setPlanName: (name: string) => void;
  setSiteId: (id: string) => void;
  setCanvasSize: (w: number, h: number) => void;
  setGridSize: (size: number) => void;
  toggleGrid: () => void;
  toggleSnap: () => void;
  setZoom: (zoom: number) => void;

  // Actions — Tool
  setActiveTool: (tool: ActiveTool) => void;
  selectItem: (id: string | null, type?: "element" | "camera" | null) => void;

  // Actions — Drawing
  addDrawingPoint: (x: number, y: number) => void;
  setMousePos: (pos: { x: number; y: number } | null) => void;
  finishPolygon: () => void;
  cancelDrawing: () => void;

  // Actions — Elements
  addElement: (el: EditorElement) => void;
  updateElement: (id: string, updates: Partial<EditorElement>) => void;
  deleteElement: (id: string) => void;

  // Actions — Cameras
  addCamera: (cam: EditorCamera) => void;
  updateCamera: (id: string, updates: Partial<EditorCamera>) => void;
  deleteCamera: (id: string) => void;

  // Actions — History
  undo: () => void;
  redo: () => void;
  pushHistory: () => void;

  // Actions — Delete selected
  deleteSelected: () => void;

  // Actions — Serialization
  loadDocument: (doc: SerializedDocument, planName: string, siteId: string) => void;
  serializeDocument: () => SerializedDocument;
}

export const useFloorPlanEditorStore = create<FloorPlanEditorState>((set, get) => ({
  planName: "",
  siteId: "",
  canvasWidth: 1200,
  canvasHeight: 800,
  gridSize: 20,
  gridEnabled: true,
  snapToGrid: true,
  elements: [],
  cameras: [],
  activeTool: "select",
  selectedId: null,
  selectedType: null,
  zoom: 1,
  drawingPoints: [],
  mousePos: null,
  undoStack: [],
  redoStack: [],

  setPlanName: (name) => set({ planName: name }),
  setSiteId: (id) => set({ siteId: id }),
  setCanvasSize: (w, h) => set({ canvasWidth: w, canvasHeight: h }),
  setGridSize: (size) => set({ gridSize: size }),
  toggleGrid: () => set((s) => ({ gridEnabled: !s.gridEnabled })),
  toggleSnap: () => set((s) => ({ snapToGrid: !s.snapToGrid })),
  setZoom: (zoom) => set({ zoom: Math.max(0.2, Math.min(3, zoom)) }),

  setActiveTool: (tool) => set({ activeTool: tool, selectedId: null, selectedType: null, drawingPoints: [], mousePos: null }),
  selectItem: (id, type = null) => set({ selectedId: id, selectedType: type }),

  // Drawing
  addDrawingPoint: (x, y) => set((s) => ({ drawingPoints: [...s.drawingPoints, x, y] })),
  setMousePos: (pos) => set({ mousePos: pos }),
  finishPolygon: () => {
    const { drawingPoints, pushHistory: push } = get();
    if (drawingPoints.length < 6) return; // need at least 3 points (6 coords)
    push();
    const xs = drawingPoints.filter((_, i) => i % 2 === 0);
    const ys = drawingPoints.filter((_, i) => i % 2 === 1);
    const minX = Math.min(...xs);
    const minY = Math.min(...ys);
    const relPoints = drawingPoints.map((v, i) => (i % 2 === 0 ? v - minX : v - minY));
    set((s) => ({
      elements: [...s.elements, {
        id: `poly-${Date.now()}`,
        type: "polygon" as const,
        x: minX,
        y: minY,
        points: relPoints,
        name: "Polígono",
        fillColor: "#dbeafe",
        strokeColor: "#2563eb",
      }],
      drawingPoints: [],
      mousePos: null,
      activeTool: "select" as const,
    }));
  },
  cancelDrawing: () => set({ drawingPoints: [], mousePos: null }),

  pushHistory: () => {
    const { elements, cameras, undoStack } = get();
    const entry: HistoryEntry = {
      elements: JSON.parse(JSON.stringify(elements)),
      cameras: JSON.parse(JSON.stringify(cameras)),
    };
    set({ undoStack: [...undoStack.slice(-49), entry], redoStack: [] });
  },

  addElement: (el) => {
    get().pushHistory();
    set((s) => ({ elements: [...s.elements, el] }));
  },
  updateElement: (id, updates) => {
    set((s) => ({
      elements: s.elements.map((e) => (e.id === id ? { ...e, ...updates } : e)),
    }));
  },
  deleteElement: (id) => {
    get().pushHistory();
    set((s) => ({
      elements: s.elements.filter((e) => e.id !== id),
      selectedId: s.selectedId === id ? null : s.selectedId,
      selectedType: s.selectedId === id ? null : s.selectedType,
    }));
  },

  addCamera: (cam) => {
    get().pushHistory();
    set((s) => ({ cameras: [...s.cameras, cam] }));
  },
  updateCamera: (id, updates) => {
    set((s) => ({
      cameras: s.cameras.map((c) => (c.id === id ? { ...c, ...updates } : c)),
    }));
  },
  deleteCamera: (id) => {
    get().pushHistory();
    set((s) => ({
      cameras: s.cameras.filter((c) => c.id !== id),
      selectedId: s.selectedId === id ? null : s.selectedId,
      selectedType: s.selectedId === id ? null : s.selectedType,
    }));
  },

  deleteSelected: () => {
    const { selectedId, selectedType } = get();
    if (!selectedId) return;
    if (selectedType === "camera") get().deleteCamera(selectedId);
    else get().deleteElement(selectedId);
  },

  undo: () => {
    const { undoStack, elements, cameras } = get();
    if (undoStack.length === 0) return;
    const prev = undoStack[undoStack.length - 1];
    set((s) => ({
      undoStack: s.undoStack.slice(0, -1),
      redoStack: [
        ...s.redoStack,
        { elements: JSON.parse(JSON.stringify(elements)), cameras: JSON.parse(JSON.stringify(cameras)) },
      ],
      elements: prev.elements,
      cameras: prev.cameras,
      selectedId: null,
      selectedType: null,
    }));
  },

  redo: () => {
    const { redoStack, elements, cameras } = get();
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    set((s) => ({
      redoStack: s.redoStack.slice(0, -1),
      undoStack: [
        ...s.undoStack,
        { elements: JSON.parse(JSON.stringify(elements)), cameras: JSON.parse(JSON.stringify(cameras)) },
      ],
      elements: next.elements,
      cameras: next.cameras,
      selectedId: null,
      selectedType: null,
    }));
  },

  loadDocument: (doc, planName, siteId) => {
    set({
      planName,
      siteId,
      elements: doc.elements ?? [],
      cameras: doc.cameras ?? [],
      canvasWidth: doc.config?.canvasWidth ?? 1200,
      canvasHeight: doc.config?.canvasHeight ?? 800,
      gridSize: doc.config?.gridSize ?? 20,
      gridEnabled: doc.config?.gridEnabled ?? true,
      undoStack: [],
      redoStack: [],
      selectedId: null,
      selectedType: null,
      drawingPoints: [],
      mousePos: null,
      activeTool: "select",
      zoom: 1,
    });
  },

  serializeDocument: (): SerializedDocument => {
    const { elements, cameras, canvasWidth, canvasHeight, gridSize, gridEnabled } = get();
    return {
      elements,
      cameras,
      config: { canvasWidth, canvasHeight, gridSize, gridEnabled },
    };
  },
}));
