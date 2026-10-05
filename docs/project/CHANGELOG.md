# Change log

프로젝트 내부 구현 기록이다. 사용자-facing 소개와 작업 로그를 분리하기 위해 루트 README에는 상세 변경 이력을 두지 않는다.

## 2026-10-05 · Licensing / source governance

- 교재 콘텐츠는 CC BY 4.0, 웹 애플리케이션·시각화 코드는 MIT로 분리했다.
- `LICENSE-CONTENT`, `LICENSE-CODE`, `NOTICE.md`, `CONTRIBUTING.md`를 추가했다.
- Linux Kernel, MPI Forum, Open MPI, MPICH, Slurm, NVIDIA CUDA, AMD ROCm, Intel, OpenHPC, Red Hat의 공식 문서와 재사용 조건을 `docs/SOURCES.md`에 정리했다.
- 외부 문서는 사실 확인 reference로 사용하고 설명·예제·도식·시각화는 직접 제작한다는 정책을 `docs/LICENSING.md`에 명시했다.
- `assets/js/content/sources.js`에 source registry와 chapter→source mapping을 추가하고, 관련 챕터 하단에 References가 자동 표시되도록 했다.
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
