# Architecture

## 목표

HPC Study는 챕터 수와 시각화 수가 계속 늘어나는 것을 전제로 한다. 콘텐츠, 학습 UI, 시각화 구현을 분리해 한 영역의 변경이 다른 영역의 하드코딩을 만들지 않도록 한다.

## 계층

```text
index.html
├─ content/                      CC BY 4.0 educational data
│  ├─ chapters/                  62-chapter curriculum modules
│  └─ sources.js                 source registry / chapter references
└─ assets/js/                    MIT application code
   ├─ main.js                    routing / page rendering
   ├─ core/                      theme / state / curriculum assembly
   └─ visualizations/            concept-specific viewers
```

### Content

`content/chapters/`의 챕터 객체가 교재의 source of truth다. 각 챕터는 최소한 다음 schema를 유지한다.

```text
id / stage / title / en / level / minutes / env
why / concepts / commands / lab / mistakes / troubleshoot / keywords
```

`assets/js/core/curriculum.js`는 content module을 순서대로 조립할 뿐 교재 문장을 보유하지 않는다. Navigation, progress, pagination은 최종 chapter array에서 자동 파생한다.

`content/sources.js`는 외부 reference의 canonical registry와 chapter→source mapping을 관리한다. 페이지의 References는 이 데이터에서 자동 생성한다.

### Visualization registry

`assets/js/visualizations/canvas-labs.js`는 chapter id와 mount function만 연결한다. 실제 시각화 구현은 주제별 파일로 분리한다.

```text
cluster3d.js             Core → Cluster 3D hierarchy
cpu-topology.js          Socket / Core / SMT / binding
cache-coherence.js       hierarchy / coherence / false sharing
virtual-memory.js        translation / faults / pressure
numa.js                  local / remote / first-touch
mpi.js                   P2P / broadcast / allreduce
network-rdma.js          TCP / RDMA / UCX-libfabric
network-benchmark.js     latency / bandwidth / topology / median-p95
storage-stack.js         page cache / filesystem / block / device / shared FS
parallel-filesystem.js   metadata / striping / small files
scientific-io.js         rank-per-file / collective MPI-IO / HDF5 / staging
slurm.js                 job lifecycle / resource allocation
resource-scaling.js      scale up/down/out/in
strong-weak.js           strong / weak / Amdahl
roofline.js              arithmetic intensity model
gpu-nccl.js              GPU execution / data movement / NCCL / GDR
```

시각화의 조작 control은 viewer toolbar 안에만 둔다. 본문 영역에는 viewer 조작을 위한 별도 버튼을 두지 않는다.

### Theme

CSS와 Canvas는 semantic token을 공유한다. Canvas 코드에서 Light/Dark 전용 색을 직접 하드코딩하지 않고 `canvas-utils.js`의 `css()`를 통해 theme variable을 읽는다.

## 새 챕터 추가

1. 해당 stage의 `content/chapters/` module에 chapter object를 추가한다.
2. 필요하면 `content/sources.js`에 source mapping을 추가한다.
3. 시각화가 필요하면 `assets/js/visualizations/`에 독립 module을 작성한다.
4. `canvas-labs.js` registry에 chapter id를 연결한다.
5. 핵심 viewer라면 `scripts/validate-content.mjs`의 required visualization 목록을 갱신한다.
6. `npm run ci`를 통과시킨다.

## 라이선스 경계

- `content/**` → CC BY 4.0
- `assets/js/**`, `assets/css/**`, `scripts/**` → MIT
- `assets/third-party/**` → upstream license

CI는 교재 파일이 다시 `assets/js/content/` 아래로 들어가는 것을 실패로 처리해 이 경계를 유지한다.

## 시각화 설계 원칙

- 장식보다 개념의 경계·흐름·비용 차이를 보여준다.
- 버튼 수를 최소화하고 상태 변화가 설명 패널과 함께 바뀌게 한다.
- 텍스트가 도형 밖으로 넘치지 않도록 `box()`와 `label(maxWidth)`를 사용한다.
- 작은 화면에서는 Canvas 자체보다 설명 패널의 읽기 가능성을 우선한다.
- 애니메이션은 data movement를 설명할 때만 사용하며 시각적 효과 자체를 목적으로 하지 않는다.
- 실제 hardware 수치나 vendor-specific 동작을 일반화하지 않고, 교재에는 topology/site별 확인 필요성을 명시한다.
