# Change log

프로젝트 내부 구현 기록이다. 사용자-facing 소개와 작업 로그를 분리하기 위해 루트 README에는 상세 변경 이력을 두지 않는다.

## 2026-10-05 · Foundation textbook quality pass v2

- 기능 확장보다 교재 완성도를 우선하도록 roadmap을 재정렬하고 `CONTENT-QUALITY.md`에 editorial/visual 기준을 정의했다.
- Foundation 5개 챕터를 `why + concepts[]` 중심의 요약형 콘텐츠에서 `학습 목표 → 용어 정의 → 설명형 본문 → 요약 → 시각화 → 진단 예시 → 명령어 → 실습 → self-check` 구조로 재작성했다.
- chapter schema에 `learningObjectives`, `terms`, `sections`, `example`, `selfCheck`를 추가하고 renderer가 rich schema를 지원하도록 확장했다.
- Foundation stage는 CI에서 learning objectives, 5개 이상의 용어 정의, 3개 이상의 설명 section, 3개 이상의 self-check를 요구하도록 했다.
- 첫 챕터에 DOM 기반 HPC system map을 추가해 긴 설명 text를 Canvas 좌표에 직접 배치하지 않도록 했다.
- Cluster 3D viewer를 새 구현으로 교체하고 node 간 all-to-all diagonal line을 central fabric hub의 4개 spoke로 단순화했다.
- `quality-v2.css`를 추가해 용어 카드, 설명 본문, worked example, self-check, 모바일 stacking과 viewer overflow 규칙을 분리했다.
- Foundation 각 챕터를 source registry의 기존 공식 reference에 연결했다.

## 2026-10-05 · Network benchmark teaching pass

- `network-benchmark` 챕터에 전용 Canvas viewer를 추가했다.
- Message size에 따른 relative latency와 bandwidth saturation curve를 분리해 읽도록 했다.
- same-node / same-switch / cross-switch topology를 같은 sweep에서 비교하는 실험 설계를 시각화했다.
- 반복 측정에서 median과 p95를 함께 보며 tail latency와 jitter를 분리하도록 했다.
- OSU Micro-Benchmarks와 iperf3의 측정 경로가 다를 수 있음을 설명하고, 두 공식 프로젝트를 source registry와 References에 추가했다.
- `network-benchmark`를 핵심 teaching visualization CI 목록에 추가했다.

## 2026-10-05 · Scientific I/O teaching pass

- `scientific-io` 챕터에 전용 Canvas viewer를 추가했다.
- Rank-per-file, shared file independent I/O, collective MPI-IO, Parallel HDF5/NetCDF, data staging을 서로 다른 data path로 비교한다.
- rank 수 증가가 file-count/metadata pressure에 미치는 영향과 collective aggregator의 역할을 시각적으로 분리했다.
- collective I/O의 장점뿐 아니라 rank 간 communication/synchronization 비용과 filesystem/access-pattern 의존성도 설명한다.
- `scientific-io`를 핵심 teaching visualization CI 목록에 추가했다.

## 2026-10-05 · Physical content boundary / storage stack

- 62개 chapter module을 `assets/js/content/`에서 `content/chapters/`로 이동해 CC BY 콘텐츠와 MIT 애플리케이션 코드의 경계를 디렉터리 수준으로 분리했다.
- curriculum 조립 로직은 `assets/js/core/curriculum.js`로 이동하고 교재 문장은 보유하지 않도록 했다.
- source registry도 `content/sources.js`로 이동하고 페이지 하단 References를 실제 renderer에 연결했다.
- CI가 `content/`의 syntax/import와 라이선스 경계를 검사하고 `assets/js/content/` 회귀를 실패 처리하도록 강화했다.
- Linux storage stack viewer를 추가해 page-cache hit/miss, dirty writeback, shared filesystem 경계를 비교하도록 했다.

## 2026-10-05 · Licensing / source governance

- 교재 콘텐츠는 CC BY 4.0, 웹 애플리케이션·시각화 코드는 MIT로 분리했다.
- `LICENSE-CONTENT`, `LICENSE-CODE`, `NOTICE.md`, `CONTRIBUTING.md`를 추가했다.
- Linux Kernel, MPI Forum, Open MPI, MPICH, Slurm, NVIDIA CUDA, AMD ROCm, Intel, OpenHPC, Red Hat의 공식 문서와 재사용 조건을 `docs/SOURCES.md`에 정리했다.
- 외부 문서는 사실 확인 reference로 사용하고 설명·예제·도식·시각화는 직접 제작한다는 정책을 `docs/LICENSING.md`에 명시했다.
- source registry와 chapter→source mapping을 추가했다.
- licensing/source metadata와 필수 notice 파일을 검사하는 CI 검증을 추가했다.
- third-party 파일을 실제로 포함할 때의 관리 규칙을 `assets/third-party/README.md`에 추가했다.

## 2026-10-05 · Memory / Fabric / Storage / GPU teaching pass

- Cache viewer를 별도 module로 분리하고 hierarchy / coherence / false sharing을 비교하도록 확장했다.
- Virtual memory viewer에 address translation / minor fault / major fault / memory pressure-OOM 경로를 추가했다.
- Network viewer에서 kernel TCP path, RDMA direct data path, MPI↔UCX/libfabric↔transport 계층을 비교하도록 했다.
- Parallel filesystem viewer에 metadata path, striped data I/O, small-file storm을 추가했다.
- GPU viewer를 execution model, memory hierarchy, host-device pipeline, stream overlap, Unified Memory, NCCL, GPUDirect RDMA까지 확장했다.
- 관련 챕터의 `why`와 `concepts`를 viewer 설명과 일치하도록 보강했다.
- 범용 `misc-labs.js`에 섞여 있던 memory/GPU viewer를 주제별 module로 분리하고 Roofline도 독립 module로 이동했다.
- README를 학습자 중심으로 다시 작성하고 개발 계획·구조·로그를 `docs/project/`로 이동했다.

## 2026-10-05 · CI and first visualization teaching pass

- GitHub Actions CI를 추가했다.
- JavaScript syntax, relative import, chapter schema/ID/stage, visualization registry, HTML asset, theme token 검사를 자동화했다.
- Cluster, CPU topology, NUMA, MPI, Slurm, Scaling 시각화를 교재형 viewer 구조로 고도화했다.
- 시각화 공통 Canvas utility를 분리했다.

## 2026-10-05 · Initial extensible curriculum

- 62개 챕터를 7개 stage의 content module로 이관했다.
- hash routing, sidebar search, progress, pagination, completion state, Light/Dark theme을 구성했다.
- GitHub Pages `main / (root)` 배포 구조를 적용했다.
