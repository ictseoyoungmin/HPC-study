import { mountHpcOverview } from "./hpc-overview.js";
import { mountProcessModel, mountOsControl } from "./system-os-map.js";
import { mountParallelModels } from "./parallel-models.js";
import { mountPerformanceMethod } from "./performance-method.js";
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
import { mountGpuConcepts } from "./gpu-concepts.js";
import { mountGpuProfiling } from "./gpu-profiling.js";
import { mountDistributedTraining, mountContainerBoundary } from "./accelerator-models.js";
import { mountRoofline } from "./roofline.js";

const mounts = {
  "hpc-aa-role": mountHpcOverview,
  "process-signals": mountProcessModel,
  "os-control": mountOsControl,
  "cpu-topology": mountCpu,
  "cache-coherence": mountCacheCoherence,
  "virtual-memory": mountVirtualMemory,
  "numa": mountNuma,
  "pthreads-openmp": host => mountParallelModels(host, "threads"),
  "openmp-advanced": host => mountParallelModels(host, "schedule"),
  "hybrid": host => mountParallelModels(host, "hybrid"),
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
  "perf-method": host => mountPerformanceMethod(host, "method"),
  "perf-pmu": host => mountPerformanceMethod(host, "profile"),
  "roofline": mountRoofline,
  "debug-tools": host => mountPerformanceMethod(host, "debug"),
  "gpu-basics": host => mountGpuConcepts(host, "fundamentals"),
  "gpu-memory": host => mountGpuConcepts(host, "data"),
  "multi-gpu": host => mountGpuConcepts(host, "multi"),
  "gpu-profiling": mountGpuProfiling,
  "ai-hpc": mountDistributedTraining,
  "containers": mountContainerBoundary
};

export const canvasLabIds = Object.freeze(Object.keys(mounts));

export function hasCanvasLab(id) {
  return Boolean(mounts[id]);
}

export function mountCanvasLab(id, host) {
  return mounts[id]?.(host) || (() => {});
}
