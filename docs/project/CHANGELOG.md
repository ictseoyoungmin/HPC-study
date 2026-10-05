# Change log

프로젝트 내부 구현의 **요약 기록**이다. 사용자-facing 소개는 루트 `README.md`, 앞으로 할 일은 `ROADMAP.md`, 긴 설계 판단과 QA 기록은 `logs/`에 둔다.

## 2026-10-05 · Expert Practice textbook quality pass v2

- Expert Practice 7개 chapter를 `learningObjectives / terms / sections / example / selfCheck` 구조로 보강했다.
- workload archetype을 resource signature와 execution phase 기반 진단으로 재구성했다.
- capacity planning을 demand distribution / queue latency / fragmentation / headroom / acceptance 관점으로 연결했다.
- regression을 golden baseline / noise floor / fingerprint / effect size / bisect / decision의 governance workflow로 재작성했다.
- ticket/postmortem, 30/60/90 roadmap, cumulative self-test, reference desk를 실제 AA 판단·communication 중심으로 보강했다.
- `expert-practice.js`와 `expert-quality.css`를 추가해 7개 chapter에 text-safe responsive DOM viewer를 연결했다.
- Expert Practice stage를 CI rich-schema 품질 기준과 required visualization 목록에 포함했다.
- 상세 작업 기록: `logs/2026-10-05-expert-practice-quality-pass.md`

## 2026-10-05 · Operations / RCA textbook quality pass v2

- Operations / RCA 11개 chapter를 symptom → evidence → timeline → causal event → corrective action 흐름으로 보강했다.
- Slurm lifecycle, failure RCA, monitoring correlation, node lifecycle, cluster operations, security와 5개 runbook을 재작성했다.
- `operations-rca.js`와 responsive CSS를 추가하고 stage 전체를 CI rich-schema 품질 기준에 포함했다.
- Slurm RCA timeline과 CPU-memory-network-storage-GPU monitoring correlation teaching pass를 완료했다.
- 상세 작업 기록: `logs/2026-10-05-operations-rca-quality-pass.md`

## 2026-10-05 · Accelerator textbook quality pass v2

- Accelerator 6개 chapter를 GPU execution, memory/data movement, multi-GPU, profiling, distributed training, container boundary 중심으로 보강했다.
- GPU profiling을 Nsight Systems → hot region → Nsight Compute의 profiling ladder로 재구성했다.
- text-safe responsive DOM viewer와 GPU timeline을 추가하고 Accelerator stage를 CI 품질 기준에 포함했다.
- 상세 작업 기록: `logs/2026-10-05-accelerator-quality-pass.md`

## 2026-10-05 · Performance textbook quality pass v2

- Performance 6개 chapter를 rich textbook schema로 보강했다.
- scaling, measurement methodology, perf/PMU, Roofline, debugging을 실험과 evidence 해석 중심으로 재구성했다.
- `performance-method.js`와 Bash benchmark/profiling code lesson을 추가했다.
- 상세 작업 기록: `logs/2026-10-05-performance-quality-pass.md`

## 2026-10-05 · Code block / shell scripting learning pass

- Bash command와 source/output을 language-aware code block abstraction으로 분리했다.
- `content/code-lessons.js`를 추가하고 진단 baseline, log utility, batch automation shell script 예제를 연결했다.
- `validate-code-lessons.mjs`로 chapter/language/kind/sample/shebang을 검증한다.

## 2026-10-05 · Parallel / Cluster textbook quality pass v2

- Parallel / Cluster 19개 chapter를 설명형 rich schema로 보강했다.
- OpenMP/hybrid DOM viewer, MPI tree/ring, network narrow layout, parallel filesystem connector를 재설계했다.
- 상세 작업 기록: `logs/2026-10-05-parallel-cluster-quality-pass.md`

## 2026-10-05 · System / OS textbook quality pass v2

- System / OS 8개 chapter를 rich schema로 재작성했다.
- process/OS control은 DOM viewer로, CPU topology/cache/virtual memory/NUMA는 connector와 responsive layout을 1차 정리했다.
- stage 전체를 CI 품질 기준에 포함했다.

## 2026-10-05 · Foundation textbook quality pass v2

- Foundation 5개 chapter를 용어 정의와 설명형 본문 중심으로 재작성하고 rich schema renderer와 CI 검증을 도입했다.
- 첫 장에 HPC system map을 추가하고 Cluster 3D의 all-to-all line을 central fabric hub 구조로 단순화했다.
- `CONTENT-QUALITY.md`를 교재와 시각화 품질 기준으로 정의했다.

## 2026-10-05 · Diagnostics teaching passes

- Network benchmark: message-size latency/bandwidth curve, topology comparison, median/p95를 추가했다.
- Scientific I/O: rank-per-file, shared file, collective MPI-IO, Parallel HDF5/NetCDF, staging을 시각화했다.
- Linux storage stack, cache/coherence, virtual memory, RDMA, parallel filesystem, GPU/NCCL teaching visualization을 주제별 module로 분리했다.

## 2026-10-05 · Licensing / source governance

- 교재 콘텐츠는 CC BY 4.0, 애플리케이션·시각화 코드는 MIT로 분리했다.
- `LICENSE-CONTENT`, `LICENSE-CODE`, `NOTICE.md`, `CONTRIBUTING.md`, `docs/LICENSING.md`, `docs/SOURCES.md`를 추가했다.
- source registry와 chapter References를 연결하고 licensing/source metadata를 CI에서 검증한다.
- 교육 콘텐츠를 `content/`로 옮겨 코드와 물리적으로 분리했다.

## 2026-10-05 · CI and extensible curriculum

- GitHub Actions CI, hash routing, sidebar search, progress/pagination, completion state, Light/Dark theme을 구성했다.
- 62개 chapter를 7개 stage의 content module로 이관했다.
- GitHub Pages `main / (root)` 배포 구조를 적용했다.
