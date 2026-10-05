import { mountHpcOverview } from "./hpc-overview.js";
import { mountCpu } from "./cpu-topology.js";
import { mountNuma } from "./numa.js";
import { mountMpi } from "./mpi.js";
import { mountScheduler } from "./slurm.js";
import { mountResourceScaling } from "./resource-scaling.js";
import { mountStrongWeak } from "./strong-weak.js";
import { mountCacheCoherence } from "./cache-coherence.js";
import { mountVirtualMemory } from "./virtual-memory.js";
import { mountNetworkRdma } from "./network-rdma.js";
import { mountNetworkBenchmark } from "./network-benchmark.js";
import { mountStorageStack } from "./storage-stack.js";
import { mountParallelFilesystem } from "./parallel-filesystem.js";
import { mountScientificIo } from "./scientific-io.js";
import { mountGpuNccl } from "./gpu-nccl.js";
import { mountRoofline } from "./roofline.js";

const mounts = {
  "hpc-aa-role": mountHpcOverview,
  "cpu-topology": mountCpu,
  "cache-coherence": mountCacheCoherence,
  "virtual-memory": mountVirtualMemory,
  "numa": mountNuma,
  "mpi-basics": mountMpi,
  "mpi-advanced": mountMpi,
  "network-basics": host => mountNetworkRdma(host, "tcp"),
  "rdma-interconnect": host => mountNetworkRdma(host, "rdma"),
  "network-benchmark": mountNetworkBenchmark,
  "storage-stack": mountStorageStack,
  "parallel-filesystems": mountParallelFilesystem,
  "scientific-io": mountScientificIo,
  "slurm-basics": mountScheduler,
  "slurm-resources": mountScheduler,
  "scaling": mountResourceScaling,
  "strong-weak": mountStrongWeak,
  "roofline": mountRoofline,
  "gpu-basics": host => mountGpuNccl(host, "fundamentals"),
  "gpu-memory": host => mountGpuNccl(host, "data"),
  "multi-gpu": host => mountGpuNccl(host, "multi")
};

export const canvasLabIds = Object.freeze(Object.keys(mounts));

export function hasCanvasLab(id) {
  return Boolean(mounts[id]);
}

export function mountCanvasLab(id, host) {
  return mounts[id]?.(host) || (() => {});
}
