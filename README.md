# HPC Study

HPC Application Analyst가 시스템 구조부터 성능 분석, 운영·RCA까지 단계적으로 학습할 수 있도록 만든 인터랙티브 교재입니다.

## 학습 페이지

**https://ictseoyoungmin.github.io/HPC-study/**

별도 설치 없이 브라우저에서 바로 사용할 수 있습니다. Light가 기본이며 Dark 테마로 전환할 수 있고, 마지막으로 본 챕터와 학습 완료 상태는 브라우저에 저장됩니다.

## 무엇을 배우나

62개 챕터를 7개 단계로 구성합니다.

1. **Foundation** — HPC 구조, 병렬 계산의 기본 언어
2. **System / OS** — Linux process, CPU topology, cache, virtual memory, NUMA
3. **Parallel / Cluster** — OpenMP/MPI, network/RDMA, storage, Slurm
4. **Performance** — profiling, scaling, Roofline, 성능 실험 설계
5. **Accelerator** — GPU/CUDA, data movement, NCCL, multi-GPU
6. **Operations / RCA** — monitoring, 장애 분석, runbook과 운영 절차
7. **Expert Practice** — 재현 가능한 분석과 실전 문제 해결

## 교재 사용 방식

각 챕터는 가능한 한 같은 학습 흐름을 따릅니다.

**왜 중요한가 → 핵심 개념 → 개념 시각화 → Linux에서 확인 → 실습 → 흔한 실수 → Troubleshooting 관점**

검색과 좌측 navigation으로 챕터를 이동할 수 있으며, 이전/다음 버튼과 `←`, `→`, `PageUp`, `PageDown` 키도 사용할 수 있습니다.

개념 설명이 공간 관계나 데이터 이동을 필요로 하는 곳에는 Three.js 또는 Canvas 2D 시각화를 사용합니다. 현재 주요 인터랙티브 주제는 다음과 같습니다.

- Core → CPU/Socket → Node → Cluster 구조
- CPU topology와 SMT/binding
- Cache hierarchy, coherence, false sharing
- Virtual memory, page fault, memory pressure/OOM
- NUMA locality와 affinity
- MPI point-to-point / collective
- TCP path, RDMA, UCX/libfabric
- Parallel filesystem metadata / striping
- Slurm job lifecycle와 resource allocation
- Scale-up/out, Strong/Weak scaling, Amdahl
- Roofline
- GPU execution/data movement, NCCL, GPUDirect RDMA

## 로컬에서 보기

정적 사이트이므로 저장소를 내려받은 뒤 간단한 HTTP server로 열면 됩니다.

```bash
python -m http.server 8000
```

그 다음 `http://localhost:8000`을 엽니다.

개발 검증은 Node.js 22 이상에서 실행합니다.

```bash
npm run ci
```

## 프로젝트 문서

README는 학습자에게 필요한 정보만 유지합니다. 구조·개발 계획·변경 기록은 별도 문서에서 관리합니다.

- [Architecture](docs/project/ARCHITECTURE.md)
- [Roadmap](docs/project/ROADMAP.md)
- [Change log](docs/project/CHANGELOG.md)
- [Project documentation index](docs/project/README.md)
