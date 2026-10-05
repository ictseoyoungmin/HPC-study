# Roadmap

## 현재 기준

62개 챕터 curriculum, navigation/search/pagination, Light/Dark theme, 학습 상태 저장, GitHub Pages, CI가 동작한다.

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

## Phase 3 · 다음 우선순위

- [ ] Linux storage stack: page cache → filesystem → block layer → device
- [ ] Scientific I/O: rank-per-file vs collective MPI-IO/HDF5
- [ ] Network benchmark: message size에 따른 latency/bandwidth curve
- [ ] GPU profiling: CPU/GPU timeline과 idle gap
- [ ] Slurm RCA: pending reason / OOM / node failure evidence timeline
- [ ] Monitoring: CPU-memory-network-storage-GPU time correlation

## Phase 4 · 교재 품질

- [ ] 챕터별 learning objective와 self-check question 추가
- [ ] Linux command 결과 예시를 실제 출력과 설명으로 연결
- [ ] 시각화 keyboard accessibility 검토
- [ ] 모바일 360 px 기준 viewer 레이아웃 점검
- [ ] 용어 glossary와 교차 링크
- [ ] 챕터 완료율과 stage별 학습 진행 요약

## 유지 원칙

Roadmap은 아직 하지 않은 일과 우선순위를 기록한다. 완료된 구현의 상세 내역은 `CHANGELOG.md`로 이동하고, 사용자-facing 기능 설명은 루트 `README.md`에 필요한 수준만 유지한다.
