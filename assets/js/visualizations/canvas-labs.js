import { mountCpu } from "./cpu-topology.js";
import { mountNuma } from "./numa.js";
import { mountMpi } from "./mpi.js";
import { mountScheduler } from "./slurm.js";
import { mountResourceScaling } from "./resource-scaling.js";
import { mountStrongWeak } from "./strong-weak.js";
import { mountMemory, mountRoofline, mountGpu } from "./misc-labs.js";

const mounts = {
  "cpu-topology": mountCpu,
  "cache-coherence": mountMemory,
  "virtual-memory": mountMemory,
  "numa": mountNuma,
  "mpi-basics": mountMpi,
  "mpi-advanced": mountMpi,
  "slurm-basics": mountScheduler,
  "slurm-resources": mountScheduler,
  "scaling": mountResourceScaling,
  "strong-weak": mountStrongWeak,
  "roofline": mountRoofline,
  "gpu-basics": mountGpu,
  "gpu-memory": mountGpu,
  "multi-gpu": mountGpu
};

export const canvasLabIds = Object.freeze(Object.keys(mounts));

export function hasCanvasLab(id) {
  return Boolean(mounts[id]);
}

export function mountCanvasLab(id, host) {
  return mounts[id]?.(host) || (() => {});
}
