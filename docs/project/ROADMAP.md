# Roadmap

## 현재 기준

62개 챕터 curriculum, navigation/search/pagination, Light/Dark theme, 학습 상태 저장, GitHub Pages, CI가 동작한다. 교재 콘텐츠와 코드의 이중 라이선스, source registry, chapter reference 표시, 물리적 content/code 디렉터리 경계도 적용되어 있다.

기능 범위를 더 넓히기보다 **처음부터 읽었을 때 실제 교재로 학습 가능한가**를 우선 기준으로 전환했다. 상세 기준은 `CONTENT-QUALITY.md`에 둔다.

## Phase 1 · 핵심 구조 시각화 — 완료

- [x] Cluster hierarchy
- [x] CPU topology / SMT / binding
- [x] NUMA locality / first-touch
- [x] MPI communication
- [x] Slurm lifecycle
- [x] Resource scaling / Strong-Weak-Amdahl 분리

## Phase 2 · Memory / Fabric / Storage / Accelerator — 완료

- [x] Cache hierarchy / coherence / false sharing
- [x] Virtual memory / minor-major fault / pressure-OOM
- [x] TCP data path / RDMA / UCX-libfabric
- [x] Parallel filesystem metadata / striping / small-file storm
- [x] GPU execution / data movement
- [x] NCCL topology / GPUDirect RDMA

## Phase 3 · Source / licensing governance — 완료

- [x] Content CC BY 4.0 / code MIT 경계 정의
- [x] `NOTICE.md`와 third-party asset policy
- [x] 주요 공식 문서 license/terms 조사와 `docs/SOURCES.md`
- [x] chapter→source registry와 페이지 하단 References
- [x] CI licensing/source metadata 검사
- [x] 교육 콘텐츠를 `content/`로 이동해 코드/콘텐츠 라이선스 경계를 물리적으로 분리

## Phase 4 · Content & Visualization Quality Pass v2 — 최우선 진행 중

### Foundation — 1차 완료

- [x] `HPC와 Application Analyst의 역할` 설명형 본문 / 용어 / self-check 재작성
- [x] `클러스터 구조와 서비스 경로` 설명형 본문 재작성
- [x] Linux 파일·권한·ACL 챕터 재작성
- [x] Shell·환경변수·텍스트 처리 챕터 재작성
- [x] SSH·SCP·rsync 챕터 재작성
- [x] `learningObjectives / terms / sections / selfCheck` rich schema와 renderer 추가
- [x] Foundation rich schema CI 검증
- [x] 첫 장에 text-safe DOM system map 추가
- [x] Cluster 3D의 all-to-all 연결선을 central fabric hub 구조로 교체
- [ ] Foundation 모바일 360 px / 768 px 레이아웃 실제 시각 검수 및 미세 조정

### System / OS — 1차 완료

- [x] Process / Thread / Signal / FD / ulimit 설명형 본문 재작성
- [x] Linux scheduler / cgroup / namespace / systemd 설명형 본문 재작성
- [x] Virtual memory / page fault / swap / OOM 설명형 본문 재작성
- [x] CPU topology / SMT / binding 설명형 본문 재작성
- [x] Pipeline / IPC / branch / vectorization 설명형 본문 재작성
- [x] Cache / coherence / false sharing 설명형 본문 재작성
- [x] NUMA / first-touch / memory placement 설명형 본문 재작성
- [x] Frequency / turbo / power-state 설명형 본문 재작성
- [x] System / OS rich schema를 CI 품질 기준에 포함
- [x] Process model과 OS control path를 text-safe DOM viewer로 추가
- [x] CPU topology / cache / virtual memory / NUMA viewer의 connector·responsive layout 코드 1차 정리
- [ ] System / OS 실제 브라우저 visual QA: 360 / 768 / desktop에서 collision·spacing 미세 조정

### Parallel / Cluster — 1차 완료

- [x] Pthreads/OpenMP와 advanced scheduling/task/affinity 설명형 본문 재작성
- [x] MPI fundamentals / nonblocking / RMA / topology 설명형 본문 재작성
- [x] Hybrid MPI+OpenMP placement / NUMA / thread-level 설명형 본문 재작성
- [x] TCP/IP / RDMA / UCX-libfabric / network benchmark 설명형 본문 재작성
- [x] Linux storage / parallel filesystem / scientific I/O 설명형 본문 재작성
- [x] Compiler / linking / sanitizer-build / Modules-Lmod 설명형 본문 재작성
- [x] Slurm fundamentals / resources / scheduling policy / advanced workflow 설명형 본문 재작성
- [x] 19개 Parallel / Cluster chapter에 objectives / 5+ terms / 3+ sections / worked example / self-check 적용
- [x] Parallel / Cluster stage를 CI rich-schema 품질 기준에 포함
- [x] OpenMP / scheduling / hybrid placement를 text-safe DOM viewer로 추가
- [x] MPI broadcast의 root-to-all 선을 tree view로, allreduce는 non-crossing ring으로 재설계
- [x] Parallel filesystem striping을 1:1 extent→target connector로 바꾸고 small-file metadata queue를 별도 시각화
- [x] TCP/RDMA viewer에 narrow-screen vertical data path 추가
- [ ] Parallel / Cluster 실제 브라우저 visual QA: 360 / 768 / desktop에서 collision·spacing 미세 조정

### 다음 Stage

- [ ] Performance Quality Pass
- [ ] Accelerator Quality Pass
- [ ] Operations / RCA Quality Pass
- [ ] Expert Practice Quality Pass

## Phase 5 · I/O / Diagnostics teaching pass — Quality Pass 이후 재개

- [x] Linux storage stack: page cache → filesystem → block layer → device / shared FS
- [x] Scientific I/O: rank-per-file vs shared file vs collective MPI-IO / HDF5 / staging
- [x] Network benchmark: message-size latency/bandwidth curve, topology comparison, median/p95
- [ ] GPU profiling: CPU/GPU timeline과 idle gap
- [ ] Slurm RCA: pending reason / OOM / node failure evidence timeline
- [ ] Monitoring: CPU-memory-network-storage-GPU time correlation

## Phase 6 · 교재 운영 품질

- [ ] Linux command 결과 예시를 실제 출력과 설명으로 연결
- [ ] 시각화 keyboard accessibility 전수 검토
- [ ] 용어 glossary와 챕터 간 교차 링크
- [ ] 챕터 완료율과 stage별 학습 진행 요약
- [ ] Quality Pass 완료 stage의 editorial review checklist 자동화 범위 검토

## 유지 원칙

Roadmap은 아직 하지 않은 일과 우선순위를 기록한다. 완료된 구현의 상세 내역은 `CHANGELOG.md`로 이동하고, 사용자-facing 기능 설명은 루트 `README.md`에 필요한 수준만 유지한다.
