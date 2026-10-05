# Parallel / Cluster Quality Pass v2

Date: 2026-10-05

## Scope

Parallel / Cluster stage의 19개 챕터를 Foundation / System OS와 같은 교재 품질 기준으로 끌어올렸다.

대상 영역:

- Pthreads / OpenMP / advanced schedule-task-affinity
- MPI fundamentals / nonblocking / RMA / topology
- Hybrid MPI + OpenMP placement
- TCP/IP / RDMA / UCX-libfabric / network benchmark
- Linux storage / parallel filesystem / Scientific I/O
- Compiler / linking / sanitizer-build / Modules-Lmod
- Slurm fundamentals / resources / policy / advanced workflow

## Editorial changes

각 chapter에 다음 rich schema를 적용했다.

```text
learningObjectives[]
terms[]            5개 이상, definition + why
sections[]         3개 이상, 각 section 2문단 이상 + takeaway
example            troubleshooting/performance reasoning flow
selfCheck[]        3개 이상
```

기존 `why + concepts[]` 요약은 제거하지 않고, 설명형 본문을 읽은 뒤 다시 압축하는 summary 역할로 유지한다.

주요 서술 원칙은 다음과 같다.

- OpenMP: thread 수 나열이 아니라 shared/private memory → synchronization → affinity/NUMA 순서로 설명한다.
- MPI: rank/process boundary → message matching → collective → placement 순서로 설명한다.
- Hybrid: rank×thread 총합이 아니라 communication endpoint, memory footprint, NUMA locality 변화로 설명한다.
- Network: latency/bandwidth/loss/retransmission을 한 개의 '속도'로 합치지 않는다.
- Storage: metadata와 bulk data path를 분리한다.
- Toolchain: source뿐 아니라 compiler/flags/library/module을 build identity로 다룬다.
- Slurm: option 암기보다 application parallel model → request → allocation → usage 흐름으로 설명한다.

## Content layout

기존 base chapter module은 유지하고 Quality Pass editorial data를 다음 파일로 분리했다.

```text
content/enrichments/
├─ 03-parallel-models.js
├─ 03-network-storage.js
└─ 03-toolchain-slurm.js
```

`assets/js/core/curriculum.js`가 chapter id 기준으로 base object와 enrichment를 merge한다. 이는 기존 command/lab metadata를 보존하면서 장문의 editorial content를 독립적으로 검토하기 위한 전환 구조다.

## Visualization changes

### OpenMP / Hybrid

`parallel-models.js` DOM viewer를 추가했다.

- Threads: shared process memory와 thread-private stack/register 구분
- Schedule: static과 dynamic의 useful work / barrier-wait timeline 비교
- Hybrid: Node → NUMA domain → MPI rank → OpenMP thread placement

긴 설명을 Canvas 내부에 넣지 않고 browser text layout을 사용한다.

### MPI

- P2P는 rank → NIC → fabric → NIC → rank의 end-to-end path로 단순화했다.
- Broadcast는 root-to-all fan-out을 제거하고 tree 모델로 변경했다.
- Allreduce는 crossing line이 없는 ring 모델로 변경했다.
- 작은 화면에서는 P2P path를 세로로 재배치한다.

### Network / RDMA

기존 side-by-side topology가 작은 화면에서 fabric과 endpoint box를 겹칠 수 있어, 620px 미만에서는 end-to-end vertical path를 사용하도록 변경했다.

### Parallel filesystem

- Metadata: rank fan-in diagonal lines 대신 client bus → metadata service 구조
- Striping: file extent 4개와 target 4개를 1:1 connector로 연결
- Small files: file request → metadata queue → metadata service 구조

교육적 의미가 없는 all-to-all/crossing connector를 제거했다.

## References

source registry에 다음 reference-only source를 추가했다.

- Linux man-pages
- OpenMP Specifications
- GCC Online Documentation
- CMake Documentation
- Lmod Documentation

구체적 재사용 license를 확정하지 않은 자료는 `reference-only / verify upstream terms`로 명시해 citation과 reuse permission을 혼동하지 않도록 했다.

## CI

`Parallel / Cluster` stage를 rich-schema validation 대상에 추가했다. 이제 이 stage의 chapter는 최소 다음 조건을 만족하지 않으면 CI가 실패한다.

- learning objectives 3개 이상
- terms 5개 이상, 각 term에 definition/why
- explanatory sections 3개 이상
- section마다 2문단 이상 + takeaway
- self-check 3개 이상

또한 OpenMP/Hybrid viewer route를 required teaching visualization 목록에 추가했다.

## Remaining visual QA

코드 레벨에서 connector crossing, narrow layout, long-label 위험을 줄였지만 실제 browser pixel QA는 별도 항목으로 남긴다.

확인 대상 viewport:

- 360px
- 768px
- desktop

특히 toolbar wrapping, viewer height, Canvas label spacing은 실제 렌더링으로 추가 점검한다.
