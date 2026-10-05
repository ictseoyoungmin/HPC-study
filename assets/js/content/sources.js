export const sources = Object.freeze({
  "linux-kernel": {
    title: "Linux Kernel Documentation",
    publisher: "Linux Kernel",
    url: "https://docs.kernel.org/",
    license: "GPL-2.0-only framework; verify per-file SPDX",
    usage: "technical-reference"
  },
  "mpi-forum": {
    title: "MPI Forum Standards",
    publisher: "MPI Forum",
    url: "https://www.mpi-forum.org/docs/",
    license: "verify specific standard artifact; Forum procedures are CC BY 4.0",
    usage: "api-semantics"
  },
  "openmpi": {
    title: "Open MPI Documentation",
    publisher: "Open MPI Project",
    url: "https://docs.open-mpi.org/",
    license: "Open MPI BSD 3-clause variant",
    usage: "technical-reference"
  },
  "mpich": {
    title: "MPICH",
    publisher: "Argonne National Laboratory / MPICH contributors",
    url: "https://www.mpich.org/",
    license: "MPICH COPYRIGHT permissive notice",
    usage: "technical-reference"
  },
  "slurm": {
    title: "Slurm Documentation",
    publisher: "SchedMD",
    url: "https://slurm.schedmd.com/",
    license: "GNU GPL v2 or later for Slurm code and documentation",
    usage: "command-reference"
  },
  "nvidia-cuda": {
    title: "NVIDIA CUDA Documentation",
    publisher: "NVIDIA",
    url: "https://docs.nvidia.com/cuda/",
    license: "NVIDIA CUDA SDK / documentation terms",
    usage: "technical-reference"
  },
  "amd-rocm": {
    title: "AMD ROCm Documentation",
    publisher: "AMD",
    url: "https://rocm.docs.amd.com/",
    license: "MIT for the top-level ROCm documentation repository; components vary",
    usage: "technical-reference"
  },
  "intel-sdm": {
    title: "Intel 64 and IA-32 Software Developer Manuals",
    publisher: "Intel",
    url: "https://www.intel.com/content/www/us/en/developer/articles/technical/intel-sdm.html",
    license: "Intel document / website terms; reference-only in HPC Study",
    usage: "technical-reference"
  },
  "openhpc": {
    title: "OpenHPC",
    publisher: "OpenHPC Project",
    url: "https://openhpc.community/",
    license: "Apache-2.0 for the OpenHPC integration repository",
    usage: "technical-reference"
  },
  "redhat-docs": {
    title: "Red Hat Documentation",
    publisher: "Red Hat",
    url: "https://docs.redhat.com/",
    license: "generally CC BY-SA 3.0 except where otherwise noted",
    usage: "technical-reference"
  }
});

export const chapterReferences = Object.freeze({
  "cluster-architecture": ["linux-kernel", "openhpc"],
  "cpu-topology": ["linux-kernel", "intel-sdm", "amd-rocm"],
  "cache-coherence": ["linux-kernel", "intel-sdm"],
  "virtual-memory": ["linux-kernel", "redhat-docs"],
  "numa": ["linux-kernel", "intel-sdm"],
  "mpi-basics": ["mpi-forum", "openmpi", "mpich"],
  "mpi-advanced": ["mpi-forum", "openmpi", "mpich"],
  "network-basics": ["linux-kernel", "openhpc"],
  "rdma-interconnect": ["openmpi", "openhpc"],
  "parallel-filesystems": ["linux-kernel", "openhpc"],
  "slurm-basics": ["slurm"],
  "slurm-resources": ["slurm"],
  "slurm-policy": ["slurm"],
  "slurm-advanced": ["slurm"],
  "gpu-basics": ["nvidia-cuda", "amd-rocm"],
  "gpu-memory": ["nvidia-cuda", "amd-rocm"],
  "multi-gpu": ["nvidia-cuda", "amd-rocm"],
  "gpu-profiling": ["nvidia-cuda", "amd-rocm"],
  "containers": ["redhat-docs", "openhpc"]
});

export function sourcesForChapter(chapterId) {
  return (chapterReferences[chapterId] || []).map(id => ({ id, ...sources[id] })).filter(item => item.title);
}
