# Sources and references

This file records major external sources used to verify technical facts in HPC
Study. The default usage is **reference only**: HPC Study writes its own text,
examples, labs, diagrams, and visualizations.

License observations were checked on **2026-10-05**. Upstream terms can change,
and individual files or product documents may have different terms. Verify the
exact item before copying, adapting, or redistributing it.

| ID | Source | Primary use | Observed license / terms | HPC Study policy |
| --- | --- | --- | --- | --- |
| `linux-kernel` | [Linux Kernel Documentation](https://docs.kernel.org/) | Linux memory, NUMA, scheduler, kernel behavior | Kernel source as a whole is GPL-2.0-only; individual source/documentation files can carry compatible or dual SPDX identifiers | `technical-reference`; do not copy text/figures without checking the exact file SPDX/license |
| `mpi-forum` | [MPI Forum standards](https://www.mpi-forum.org/docs/) | MPI API semantics and terminology | MPI Forum procedures are explicitly CC BY 4.0; verify the copyright/license notice on the specific standard release before reuse | `api-semantics`; standards used as reference, not copied into the textbook |
| `openmpi` | [Open MPI Documentation](https://docs.open-mpi.org/) | Open MPI behavior, runtime terminology, implementation reference | Open MPI project is distributed under its BSD 3-clause Open MPI variant; copied material should still be checked at file/release level | `technical-reference` / `command-reference` |
| `mpich` | [MPICH](https://www.mpich.org/) and [official repository](https://github.com/pmodels/mpich) | MPI implementation behavior and examples | MPICH `COPYRIGHT` grants permission to use, reproduce, prepare derivative works, and redistribute, subject to its notice/disclaimer terms | `technical-reference`; preserve upstream notice if material is ever reused |
| `slurm` | [SchedMD Slurm Documentation](https://slurm.schedmd.com/) | Slurm commands, scheduling, accounting, resource behavior | Upstream `COPYING` states that Slurm code and documentation are under GNU GPL v2 or later; contrib items can differ | `technical-reference` / `command-reference`; do not copy documentation into CC BY content without compatibility review |
| `nvidia-cuda` | [NVIDIA CUDA Documentation](https://docs.nvidia.com/cuda/) | CUDA execution model, memory, streams, GPU behavior | CUDA SDK EULA applies to associated documentation; NVIDIA retains rights and redistribution is limited to what the agreement permits | `technical-reference`; no text or diagrams reproduced unless a specific item grants permission |
| `amd-rocm` | [AMD ROCm Documentation](https://rocm.docs.amd.com/) | HIP/ROCm execution, GPU memory, runtime and tools | Current ROCm top-level repository, which primarily contains documentation, is MIT; individual ROCm components may use separate licenses | `technical-reference`; verify the component repository before reusing component-specific material |
| `intel-sdm` | [Intel 64 and IA-32 Software Developer Manuals](https://www.intel.com/content/www/us/en/developer/articles/technical/intel-sdm.html) | CPU topology, cache, memory architecture terminology | Intel website/document terms permit limited informational/personal use and impose restrictions on posting/modification; broader uses may require permission | `technical-reference`; no reproduction of Intel text/figures in HPC Study |
| `openhpc` | [OpenHPC](https://openhpc.community/) / [repository](https://github.com/openhpc/ohpc) | Cluster stack integration, deployment terminology | OpenHPC repository `LICENSE` is Apache License 2.0 | `technical-reference`; if upstream material is reused, retain Apache-2.0 notices and attribution requirements |
| `redhat-docs` | [Red Hat Documentation](https://docs.redhat.com/) | Linux administration, cgroups, containers, storage operations | Red Hat documentation generally states CC BY-SA 3.0 for text and illustrations, except where otherwise noted | `technical-reference`; avoid adapting/copying into CC BY content unless ShareAlike implications are intentionally handled |
| `three-js` | [three.js](https://github.com/mrdoob/three.js) | 3D rendering runtime | MIT, copyright © 2010-2026 three.js authors | Runtime dependency; preserve MIT notice in `NOTICE.md` |

## Source notes

### Linux Kernel

Reference: https://docs.kernel.org/process/license-rules.html

The kernel documentation explains that the kernel is provided under GPL-2.0-only
as a whole and that individual files can have other compatible licenses, usually
expressed with SPDX identifiers. Therefore the license of a specific
Documentation file must be checked before any direct reuse.

### MPI Forum

Reference: https://www.mpi-forum.org/docs/

MPI standards are the primary reference for API semantics. The MPI Forum's
current procedures document is CC BY 4.0, but HPC Study does not infer that all
historical or current MPI standard artifacts have identical reuse terms. The
specific document notice should be checked before copying.

### Open MPI

Reference: https://www.open-mpi.org/community/license.php

Open MPI identifies its distribution license as the 3-clause BSD Open MPI
variant. HPC Study uses the documentation to check implementation behavior and
writes independent explanations.

### MPICH

Reference: https://github.com/pmodels/mpich/blob/main/COPYRIGHT

The MPICH notice grants broad permissions to use, reproduce, prepare derivative
works, and redistribute, while requiring its notice/disclaimer handling. HPC
Study currently uses it only as a technical reference.

### Slurm

Reference: https://github.com/SchedMD/slurm/blob/master/COPYING

SchedMD's upstream COPYING states that all Slurm code and documentation is
available under the GNU GPL, version 2 or later, with exceptions for some
contributed tools. Because HPC Study textbook content is CC BY 4.0, Slurm text or
figures are not copied into the textbook by default.

### NVIDIA CUDA

References:

- https://docs.nvidia.com/cuda/
- https://docs.nvidia.com/cuda/eula/

The CUDA documentation landing page states that the CUDA Toolkit EULA applies to
the associated API, programming-model, and development-tool documentation. HPC
Study therefore treats NVIDIA documentation as reference-only unless a specific
asset or sample has a separate reusable license.

### AMD ROCm

References:

- https://rocm.docs.amd.com/
- https://rocm.docs.amd.com/en/latest/about/license.html

ROCm's current top-level repository primarily contains documentation and is
licensed under MIT. Individual ROCm components have separate licenses and must be
checked independently.

### Intel

References:

- https://www.intel.com/content/www/us/en/developer/articles/technical/intel-sdm.html
- https://www.intel.com/content/www/us/en/legal/terms-of-use.html

Intel's Terms of Use place restrictions on copying, posting, modifying, and
redistributing Intel documents, with limited informational/personal and
classroom permissions. HPC Study uses Intel manuals for fact checking only.

### OpenHPC

Reference: https://github.com/openhpc/ohpc/blob/master/LICENSE

The OpenHPC integration, packaging, and test repository uses Apache License 2.0.
This does not automatically determine the license of every package distributed
through OpenHPC; each packaged component retains its own upstream license.

### Red Hat

Reference: https://docs.redhat.com/en/legal-notice

Red Hat documentation legal notices generally license text and illustrations
under CC BY-SA 3.0, except where otherwise noted. HPC Study uses Red Hat
documentation as a reference and avoids direct adaptation unless ShareAlike and
attribution requirements are intentionally satisfied.

## Adding a source

When a new external source materially informs a chapter:

1. add it to this file;
2. add the same source ID to `assets/js/content/sources.js`;
3. map relevant chapter IDs to the source ID;
4. record the exact license/terms page rather than relying only on a project
   homepage;
5. if any material is copied or adapted, update `NOTICE.md` and review
   `docs/LICENSING.md` before merging.
