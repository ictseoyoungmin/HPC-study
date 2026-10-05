import { mountCluster3D } from "./cluster3d.js";
import { hasCanvasLab, mountCanvasLab } from "./canvas-labs.js";

export function hasVisualization(id) {
  return id === "cluster-architecture" || hasCanvasLab(id);
}

export async function mountVisualization(id, host) {
  if (id === "cluster-architecture") return await mountCluster3D(host);
  return mountCanvasLab(id, host);
}
