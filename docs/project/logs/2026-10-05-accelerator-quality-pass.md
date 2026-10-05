# Accelerator Quality Pass v2

## Scope

Accelerator stage 6개 챕터를 Foundation/System/Parallel/Performance와 같은 rich textbook schema로 올리고, 기존 GPU Canvas viewer에서 발생할 수 있는 text collision과 작은 화면 축소 문제를 줄이는 것을 목표로 했다.

대상 챕터:

- `gpu-basics`
- `gpu-memory`
- `multi-gpu`
- `gpu-profiling`
- `ai-hpc`
- `containers`

## Content changes

각 챕터에 최소 3개 학습 목표, 5개 이상 용어 정의, 3개 이상의 설명 section, worked example, 3개 이상의 self-check를 추가했다.

설명 방향은 다음처럼 바꿨다.

- GPU fundamentals: Grid/Block/Thread 나열에서 programmer model과 Warp/SM 실행 관점의 관계로 확장
- GPU memory: stream API 나열에서 H2D/D2H, pinned memory, dependency, actual overlap timeline 중심으로 확장
- Multi-GPU: GPU 개수 중심에서 rank→GPU→CPU/NUMA→NIC physical path와 slow-rank collective 관점으로 확장
- GPU profiling: Nsight 도구 목록에서 system timeline → hot region → kernel metric의 profile ladder로 확장
- Distributed training: GPU utilization 중심에서 dataloader/H2D/compute/NCCL/checkpoint의 end-to-end step model로 확장
- HPC container: image 중심에서 image→bind→kernel/driver→MPI/transport boundary와 provenance로 확장

## Visualization changes

기존 `gpu-nccl.js` Canvas viewer 대신 `gpu-concepts.js` DOM viewer를 registry에 연결했다. 긴 설명은 Canvas 좌표에 넣지 않고 browser layout과 wrapping을 사용한다.

새 viewer:

- `gpu-concepts.js`: fundamentals / data movement / multi-GPU
- `gpu-profiling.js`: CPU·Copy·GPU timeline, overlap, hot-kernel decision
- `accelerator-models.js`: distributed training step, HPC container boundary

공통 responsive style은 `assets/css/accelerator-quality.css`에 둔다. desktop grid는 tablet에서 2열, mobile에서 1열로 재배치한다. GPU profiling timeline label은 bar 내부에서 ellipsis를 사용해 box 밖으로 넘치지 않도록 한다.

## CI changes

`Accelerator`를 rich-schema quality stage에 추가했다. 다음 viewer를 required teaching visualization로 강제한다.

- `gpu-basics`
- `gpu-memory`
- `multi-gpu`
- `gpu-profiling`
- `ai-hpc`
- `containers`

## Source governance

`ai-hpc` References를 기존 NVIDIA CUDA, AMD ROCm, Slurm, Open MPI source registry에 연결했다. 설명과 도식은 HPC Study 자체 제작 원칙을 유지한다.

## Remaining visual QA

코드 수준에서 text wrapping과 responsive stacking을 적용했지만 실제 브라우저 360px / 768px / desktop pixel-level QA는 별도 확인이 필요하다. 특히 profiling timeline의 짧은 bar label과 toolbar wrapping을 확인한다.
