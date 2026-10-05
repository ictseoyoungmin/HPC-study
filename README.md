# HPC Study

HPC Application Analyst를 위한 확장형 인터랙티브 학습 교재입니다.

## GitHub Pages

정적 파일만 사용하므로 별도 빌드 과정이 필요하지 않습니다.

GitHub에서 **Settings → Pages → Deploy from a branch → `main` → `/ (root)`** 를 선택하면 다음 주소로 사용할 수 있습니다.

`https://ictseoyoungmin.github.io/HPC-study/`

챕터 주소는 hash route를 사용합니다.

`#/chapter/<chapter-id>`

따라서 개별 챕터를 새로고침해도 별도의 SPA rewrite 설정이 필요하지 않습니다.

## 현재 범위

두 참고 HTML 중 62개 챕터 커리큘럼을 콘텐츠 기준으로 이관하고, 기존 Field Manual의 주제별 인터랙션 방식을 시각화 계층으로 분리했습니다.

- 62 chapters
- 7 stages
- Light 기본 / Dark 전환
- sidebar 검색과 단계별 navigation
- 현재 페이지 / 전체 페이지 진행률
- 이전 / 다음 pagination
- `←` `→` `PageUp` `PageDown` 키 이동
- 학습 완료 상태, 마지막 챕터, 테마를 `localStorage`에 저장
- Three.js 3D 클러스터 구조
- Canvas 2D CPU / Memory / NUMA / MPI / Slurm / Scaling / Roofline / GPU 시각화

## 구조

```text
HPC-study/
├─ index.html
├─ .nojekyll
├─ README.md
└─ assets/
   ├─ css/
   │  └─ app.css
   └─ js/
      ├─ main.js
      ├─ core/
      │  ├─ state.js
      │  └─ theme.js
      ├─ content/
      │  ├─ index.js
      │  ├─ 01-foundation.js
      │  ├─ 02-system-os.js
      │  ├─ 03-parallel-models.js
      │  ├─ 03-network-storage.js
      │  ├─ 03-toolchain-slurm.js
      │  ├─ 04-performance.js
      │  ├─ 05-accelerator.js
      │  ├─ 06-slurm-rca.js
      │  ├─ 06-monitoring-ops.js
      │  ├─ 06-runbooks.js
      │  └─ 07-expert-practice.js
      └─ visualizations/
         ├─ index.js
         ├─ cluster3d.js
         └─ canvas-labs.js
```

## CI

`.github/workflows/ci.yml`이 `main` push와 pull request마다 정적 사이트를 검증합니다.

```text
JavaScript syntax
→ relative import path
→ 62 chapter schema / duplicate ID / stage
→ visualization registry
→ index.html local assets
→ Light/Dark semantic theme tokens
```

로컬에서도 같은 검사를 실행할 수 있습니다.

```bash
npm run ci
```

GitHub Pages 배포는 기존 `main / (root)` 설정을 그대로 사용합니다. CI는 배포를 대체하는 것이 아니라 깨진 콘텐츠와 모듈이 `main`에 들어오는 것을 조기에 발견하는 역할입니다.

## 우선 고도화한 시각화

교재 설명력이 중요한 순서부터 viewer와 본문을 확장했습니다.

1. **클러스터 구조** — Core → CPU/Socket → Node → Cluster를 Three.js 계층 전환으로 설명하고 Memory/NIC/Interconnect 경계를 함께 표시합니다.
2. **CPU Topology** — Socket, physical Core, SMT logical CPU, thread binding을 하나의 topology에서 비교합니다.
3. **NUMA** — Local/Remote/First-touch 경로와 CPU affinity ↔ memory placement 관계를 설명합니다.
4. **MPI** — 두 Compute Node 안의 rank/private memory를 구분하고 P2P/Broadcast/Allreduce의 통신 경계를 비교합니다.
5. **Slurm** — Submit → PENDING → Allocate → RUNNING → Accounting의 lifecycle을 request/allocation/execution 관점으로 연결합니다.
6. **Scaling** — Scale-up/down/out/in과 Strong/Weak/Amdahl을 서로 다른 개념으로 분리해 시각화합니다.

각 viewer의 조작 버튼은 viewer toolbar에만 두고, 오른쪽 패널은 개념·경계·성능 해석을 읽는 교재 영역으로 유지합니다.
