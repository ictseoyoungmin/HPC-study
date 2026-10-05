export const sources = Object.freeze({
  "linux-kernel": {
    title: "Linux Kernel Documentation",
    publisher: "Linux Kernel",
    url: "https://docs.kernel.org/",
    license: "GPL-2.0-only framework; verify per-file SPDX",
    usage: "technical-reference"
  },
  "linux-man-pages": {
    title: "Linux man-pages",
    publisher: "Linux man-pages project",
    url: "https://man7.org/linux/man-pages/",
    license: "reference-only in HPC Study; verify the notice of any artifact before reuse",
    usage: "command-reference"
  },
  "openmp-spec": {
    title: "OpenMP Specifications",
    publisher: "OpenMP Architecture Review Board",
    url: "https://www.openmp.org/specifications/",
    license: "reference-only in HPC Study; verify specification terms before reuse",
    usage: "api-semantics"
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
  "osu-omb": {
    title: "OSU Micro-Benchmarks",
    publisher: "The Ohio State University / MVAPICH Project",
    url: "https://mvapich.cse.ohio-state.edu/benchmarks/",
    license: "BSD license according to the official benchmark distribution page",
    usage: "technical-reference"
  },
  "iperf3": {
    title: "iperf3",
    publisher: "ESnet / Lawrence Berkeley National Laboratory",
    url: "https://software.es.net/iperf/",
    license: "BSD 3-clause",
    usage: "technical-reference"
  },
  "gcc-docs": {
    title: "GCC Online Documentation",
    publisher: "GNU Project",
    url: "https://gcc.gnu.org/onlinedocs/",
    license: "reference-only in HPC Study; verify manual/source terms before reuse",
    usage: "technical-reference"
  },
  "cmake-docs": {
    title: "CMake Documentation",
    publisher: "Kitware",
    url: "https://cmake.org/documentation/",
    license: "reference-only in HPC Study; verify upstream terms before reuse",
    usage: "technical-reference"
  },
  "lmod-docs": {
    title: "Lmod Documentation",
    publisher: "Lmod project",
    url: "https://lmod.readthedocs.io/",
    license: "reference-only in HPC Study; verify upstream terms before reuse",
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
  "hpc-aa-role": ["openhpc"],
  "cluster-architecture": ["linux-kernel", "openhpc"],
  "linux-files": ["linux-kernel", "redhat-docs"],
  "shell-text": ["redhat-docs"],
  "ssh-transfer": ["redhat-docs"],

  "process-signals": ["linux-kernel", "linux-man-pages", "redhat-docs"],
  "os-control": ["linux-kernel", "redhat-docs"],
  "virtual-memory": ["linux-kernel", "redhat-docs"],
  "cpu-topology": ["linux-kernel", "intel-sdm", "amd-rocm"],
  "microarchitecture": ["linux-kernel", "intel-sdm"],
  "cache-coherence": ["linux-kernel", "intel-sdm"],
  "numa": ["linux-kernel", "intel-sdm"],
  "frequency-power": ["linux-kernel", "intel-sdm", "redhat-docs"],

  "pthreads-openmp": ["openmp-spec", "linux-man-pages"],
  "openmp-advanced": ["openmp-spec"],
  "mpi-basics": ["mpi-forum", "openmpi", "mpich"],
  "mpi-advanced": ["mpi-forum", "openmpi", "mpich"],
  "hybrid": ["openmp-spec", "mpi-forum", "slurm"],
  "network-basics": ["linux-kernel", "linux-man-pages", "openhpc"],
  "rdma-interconnect": ["openmpi", "openhpc"],
  "network-benchmark": ["osu-omb", "iperf3", "openmpi"],
  "storage-stack": ["linux-kernel", "redhat-docs"],
  "parallel-filesystems": ["linux-kernel", "openhpc"],
  "scientific-io": ["mpi-forum", "openmpi", "openhpc"],
  "compiler-build": ["gcc-docs", "cmake-docs", "openhpc"],
  "libraries-linking": ["gcc-docs", "openhpc"],
  "build-repro": ["gcc-docs", "cmake-docs"],
  "modules": ["lmod-docs", "openhpc"],
  "slurm-basics": ["slurm"],
  "slurm-resources": ["slurm"],
  "slurm-policy": ["slurm"],
  "slurm-advanced": ["slurm"],

  "scaling": ["slurm", "openmpi", "openmp-spec"],
  "strong-weak": ["openmpi", "openmp-spec", "slurm"],
  "perf-method": ["linux-man-pages", "redhat-docs"],
  "perf-pmu": ["linux-kernel", "intel-sdm"],
  "roofline": ["intel-sdm", "nvidia-cuda", "amd-rocm"],
  "debug-tools": ["linux-man-pages", "gcc-docs", "redhat-docs"],

  "gpu-basics": ["nvidia-cuda", "amd-rocm"],
  "gpu-memory": ["nvidia-cuda", "amd-rocm"],
  "multi-gpu": ["nvidia-cuda", "amd-rocm"],
  "gpu-profiling": ["nvidia-cuda", "amd-rocm"],
  "ai-hpc": ["nvidia-cuda", "amd-rocm", "slurm", "openmpi"],
  "containers": ["redhat-docs", "openhpc"],

  "slurm-admin": ["slurm", "linux-kernel"],
  "rca-failures": ["linux-kernel", "linux-man-pages", "slurm", "openmpi"],
  "monitoring": ["linux-kernel", "linux-man-pages", "redhat-docs"],
  "node-health": ["slurm", "linux-kernel", "redhat-docs"],
  "cluster-ops": ["openhpc", "slurm", "redhat-docs"],
  "security": ["linux-man-pages", "redhat-docs"],
  "runbook-pending": ["slurm"],
  "runbook-slow": ["linux-kernel", "linux-man-pages", "slurm", "openmpi"],
  "runbook-oom": ["linux-kernel", "slurm", "redhat-docs"],
  "runbook-io-mpi": ["linux-kernel", "openmpi", "mpi-forum", "slurm"],
  "runbook-gpu": ["nvidia-cuda", "amd-rocm", "slurm"],

  "workloads": ["openmp-spec", "mpi-forum", "openmpi", "nvidia-cuda", "amd-rocm"],
  "capacity": ["slurm", "openhpc"],
  "regression": ["linux-kernel", "slurm", "openmpi", "nvidia-cuda", "amd-rocm", "intel-sdm"],
  "ticket-postmortem": ["slurm", "linux-man-pages", "redhat-docs"],
  "roadmap": ["linux-man-pages", "slurm", "openmpi", "openmp-spec", "nvidia-cuda"],
  "selftest": ["linux-man-pages", "slurm", "openmpi", "nvidia-cuda"],
  "reference": ["linux-kernel", "linux-man-pages", "slurm", "mpi-forum", "openmpi", "mpich", "openmp-spec", "gcc-docs", "lmod-docs", "nvidia-cuda", "amd-rocm", "openhpc", "redhat-docs"]
});

export function sourcesForChapter(chapterId) {
  return (chapterReferences[chapterId] || []).map(id => ({ id, ...sources[id] })).filter(item => item.title);
}
