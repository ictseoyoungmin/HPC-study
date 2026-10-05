# Roadmap

## 현재 기준

HPC Study는 62개 chapter / 7개 stage curriculum, navigation/search/pagination, Light/Dark theme, 학습 상태 저장, GitHub Pages, CI, content/code 이중 라이선스, source registry와 chapter References를 갖춘 정적 교재다.

2026-10-05 기준으로 **7개 stage 모두 Content & Visualization Quality Pass v2의 1차 content pass를 완료**했다. 모든 stage가 `learningObjectives / terms / sections / example / selfCheck` 구조를 사용하고 CI가 최소 품질 schema를 강제한다.

완료된 구현 상세는 `CHANGELOG.md`와 `logs/`에 둔다. 이 문서는 아직 남은 일과 우선순위만 관리한다.

## Phase 4 · Quality Pass v2 — content pass 완료 / visual QA 남음

- [ ] Foundation: 360 / 768 / desktop 실제 브라우저 visual QA
- [ ] System / OS: CPU topology / cache / virtual memory / NUMA collision·spacing QA
- [ ] Parallel / Cluster: MPI / network / filesystem connector·spacing QA
- [ ] Performance: curve label / workflow spacing QA
- [ ] Accelerator: timeline bar / card spacing QA
- [ ] Operations / RCA: evidence lane / runbook card spacing QA
- [ ] Expert Practice: signature / roadmap / authority stack spacing QA
- [ ] 전체 stage에서 keyboard focus, tab order, button label, reduced-motion 대응 검토

## Phase 5 · I/O / Diagnostics teaching pass — 완료

- [x] Linux storage stack
- [x] Scientific I/O / MPI-IO / staging
- [x] Network benchmark curve와 topology 비교
- [x] GPU profiling timeline과 hot-kernel drill-down
- [x] Slurm RCA evidence timeline
- [x] CPU-memory-network-storage-GPU monitoring correlation

## Phase 6 · 교재 운영 품질 — 진행 중

- [x] Command Evidence 공통 schema/UI/CI 추가
- [x] 7개 stage의 핵심 17개 chapter에 `command → representative output → 관찰 포인트 → 다음 분기` 1차 연결
- [ ] 나머지 chapter 중 진단 가치가 높은 command를 같은 evidence 형식으로 확대
- [ ] 실제 lab/cluster에서 확보한 site-specific output을 별도 provenance와 함께 추가할 수 있는 형식 정의
- [ ] 용어 glossary를 중앙 registry로 만들고 first-use 정의와 chapter 간 교차 링크 연결
- [ ] chapter 완료율과 stage별 학습 진행 요약 강화
- [ ] Quality Pass 완료 chapter의 editorial review checklist를 CI에서 가능한 범위까지 자동화
- [ ] visual QA용 viewport checklist와 수동 검수 기록 형식 정의
- [ ] source/reference dead-link와 누락 metadata 정기 검사 방식 검토

## Phase 7 · 실행형 프로그래밍 학습

- [ ] C 기본 build/run code lesson 추가
- [ ] OpenMP: serial → parallel for → schedule/binding 예제
- [ ] MPI: hello/rank → point-to-point → collective → nonblocking 예제
- [ ] Hybrid MPI+OpenMP placement 실습
- [ ] Python 기반 benchmark/result parsing 예제
- [ ] Slurm batch script를 source → submit → output → accounting 흐름으로 연결
- [ ] source code, build command, run command, output, interpretation을 공통 code-block abstraction으로 표시

## Phase 8 · 운영형 실습과 평가

- [ ] PENDING / OOM / slow job / MPI hang / low GPU incident drill을 단계형 exercise로 확장
- [ ] evidence가 주어질 때 next-best-test를 고르는 branching self-test 검토
- [ ] ticket / postmortem / benchmark report template 제공
- [ ] capacity worksheet와 regression report worksheet 제공
- [ ] chapter별 lab 결과를 개인 기록으로 남길 수 있는 export 방식 검토

## 유지 원칙

Roadmap에는 앞으로 할 일과 현재 우선순위만 둔다. 완료된 변경의 요약은 `CHANGELOG.md`, 긴 설계 판단과 검수 기록은 `docs/project/logs/`에 둔다. 루트 `README.md`는 학습자와 GitHub 방문자를 위한 user-facing 문서로 유지한다.
