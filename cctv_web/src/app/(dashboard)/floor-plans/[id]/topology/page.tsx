"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  type Node,
  type Edge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getFloorPlanBySite } from "@/lib/api/floor-plans";
import { listNvrs } from "@/lib/api/nvrs";
import { listCameras } from "@/lib/api/cameras";
import type { Camera, NvrServer } from "@/types/api";

export default function TopologyPage() {
  const params = useParams();
  const router = useRouter();
  const siteId = params.id as string;

  const { data: fpData } = useQuery({
    queryKey: ["floor-plan", siteId],
    queryFn: () => getFloorPlanBySite(siteId),
  });

  const { data: allNvrs = [] } = useQuery({
    queryKey: ["nvrs"],
    queryFn: () => listNvrs(),
  });

  const { data: allCameras = [] } = useQuery({
    queryKey: ["cameras"],
    queryFn: () => listCameras(),
  });

  const siteNvrs = useMemo(() => allNvrs.filter((n) => n.site_id === siteId), [allNvrs, siteId]);
  const siteCameras = useMemo(() => allCameras.filter((c) => c.site_id === siteId), [allCameras, siteId]);

  const { nodes, edges } = useMemo(() => {
    const n: Node[] = [];
    const e: Edge[] = [];

    // Site node (root)
    n.push({
      id: `site-${siteId}`,
      type: "default",
      position: { x: 400, y: 50 },
      data: { label: fpData?.site.name ?? "Sitio" },
      style: {
        background: "#dbeafe",
        border: "2px solid #3b82f6",
        borderRadius: 8,
        padding: "10px 20px",
        fontWeight: 600,
      },
    });

    // NVR nodes
    siteNvrs.forEach((nvr, i) => {
      const nvrNodeId = `nvr-${nvr.id}`;
      const xPos = 100 + i * 350;

      n.push({
        id: nvrNodeId,
        type: "default",
        position: { x: xPos, y: 200 },
        data: {
          label: `🖥 ${nvr.name}\n${nvr.ip_address ?? ""}`,
        },
        style: {
          background: "#ede9fe",
          border: "2px solid #8b5cf6",
          borderRadius: 8,
          padding: "8px 16px",
          whiteSpace: "pre-line" as const,
          textAlign: "center" as const,
        },
      });

      e.push({
        id: `e-site-${nvr.id}`,
        source: `site-${siteId}`,
        target: nvrNodeId,
        animated: true,
        style: { stroke: "#8b5cf6" },
      });

      // Camera nodes connected to this NVR
      const nvrCams = siteCameras.filter((c) => c.nvr_server_id === nvr.id);

      nvrCams.forEach((cam, j) => {
        const camNodeId = `cam-${cam.id}`;
        const camX = xPos - 100 + j * 150;

        n.push({
          id: camNodeId,
          type: "default",
          position: { x: camX, y: 380 },
          data: {
            label: `📷 ${cam.name}\n${cam.ip_address ?? ""}\n${cam.status ?? ""}`,
          },
          style: {
            background: cam.status === "active" ? "#dcfce7" : "#fef3c7",
            border: `1px solid ${cam.status === "active" ? "#22c55e" : "#f59e0b"}`,
            borderRadius: 6,
            padding: "6px 12px",
            fontSize: "11px",
            whiteSpace: "pre-line" as const,
            textAlign: "center" as const,
          },
        });

        e.push({
          id: `e-nvr-${cam.id}`,
          source: nvrNodeId,
          target: camNodeId,
          style: { stroke: "#a3a3a3" },
        });
      });
    });

    return { nodes: n, edges: e };
  }, [fpData, siteNvrs, siteCameras, siteId]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push("/floor-plans")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Topología — {fpData?.site.name ?? "Sitio"}</h1>
          <p className="text-sm text-muted-foreground">
            {siteNvrs.length} NVRs · Vista de red
          </p>
        </div>
      </div>

      <div className="border rounded-lg overflow-hidden" style={{ height: "calc(100vh - 180px)" }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          fitView
          proOptions={{ hideAttribution: true }}
        >
          <Background />
          <Controls />
          <MiniMap />
        </ReactFlow>
      </div>
    </div>
  );
}
