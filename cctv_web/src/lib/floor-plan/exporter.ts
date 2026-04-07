import type Konva from "konva";

/** Export the Konva stage to a PNG data-URL and trigger a download. */
export function exportCanvasPNG(stageRef: React.RefObject<Konva.Stage | null>, fileName = "plano.png") {
  const stage = stageRef.current;
  if (!stage) return;

  const dataUrl = stage.toDataURL({ pixelRatio: 2 });
  const link = document.createElement("a");
  link.download = fileName;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
