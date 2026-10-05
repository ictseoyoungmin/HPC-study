# Architecture

## 목표

HPC Study는 챕터 수와 시각화 수가 계속 늘어나는 것을 전제로 한다. 콘텐츠, 학습 UI, 시각화 구현을 분리해 한 영역의 변경이 다른 영역의 하드코딩을 만들지 않도록 한다.

교재 품질 기준은 `CONTENT-QUALITY.md`를 따른다. 기능 수보다 설명의 깊이와 시각적 가독성을 우선한다.

## 계층

```text
index.html
├─ content/                      CC BY 4.0 educational data
│  ├─ chapters/                  62-chapter curriculum modules
│  └─ sources.js                 source registry / chapter references
└─ assets/
   ├─ css/
   │  ├─ app.css                 base UI / theme
   │  └─ quality-v2.css          textbook-rich content / visual layout rules
   └─ js/                        MIT application code
      ├─ main.js                 routing / page rendering
      ├─ core/                   theme / state / curriculum assembly
      └─ visualizations/         concept-specific viewers
```

### Content

`content/chapters/`의 챕터 객체가 교재의 source of truth다. 모든 챕터는 최소 schema를 유지한다.

```text
id / stage / title / en / level / minutes / env
why / concepts / commands / lab / mistakes / troubleshoot / keywords
```

Quality Pass가 끝난 stage는 다음 rich schema를 추가한다.

```text
learningObjectives[]
terms[]
  term / en / definition / why
sections[]
  title / paragraphs[] / takeaway
example
  title / intro / steps[] / conclusion
selfCheck[]
  question / answer
```

`concepts[]`는 더 이상 본문을 대체하지 않는다. 설명형 본문을 읽은 뒤 핵심을 다시 압축하는 summary로 사용한다.

`assets/js/core/curriculum.js`는 content module을 순서대로 조립할 뿐 교재 문장을 보유하지 않는다. Navigation, progress, pagination은 최종 chapter array에서 자동 파생한다.

`content/sources.js`는 외부 reference의 canonical registry와 chapter→source mapping을 관리한다. 페이지의 References는 이 데이터에서 자동 생성한다.

### Renderer

`assets/js/main.js`는 rich schema가 있는 챕터에서는 다음 흐름으로 렌더링한다.

```text
Header / why
→ Learning objectives
→ Terms
→ Explanatory sections
→ Concept summary
→ Visualization
→ Worked example
→ Commands
→ Lab
→ Mistakes / troubleshooting
→ Self-check
→ References
```

아직 Quality Pass 전인 챕터는 기존 최소 schema로도 렌더링된다. Stage를 순차적으로 전환하기 위한 호환 계층이다.

### Visualization registry

`assets/js/visualizations/canvas-labs.js`는 chapter id와 mount function을 연결한다. 실제 시각화 구현은 주제별 파일로 분리한다.

```text
hpc-overview.js          DOM-based system map / AA diagnostic map
cluster3d-v2.js          Core → Socket → Node → Cluster / central fabric hub
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

시각화 control은 viewer toolbar 안에 둔다. 본문 영역에는 viewer 조작을 위한 별도 버튼을 두지 않는다.

### Text-heavy visualization

긴 설명을 Canvas 안에 직접 그리지 않는다. Text-heavy concept map은 DOM/CSS를 사용해 wrapping과 responsive layout을 브라우저에 맡긴다.

Canvas는 다음과 같이 좌표가 의미를 갖는 경우에 우선 사용한다.

- graph / curve / axis
- short node labels
- dynamic packet / data movement
- topology whose labels are short and bounded

Network topology에서 교육적 이유가 없는 all-to-all line은 피하고 switch/fabric hub 또는 계층형 connector를 사용한다.

### Theme

CSS와 Canvas는 semantic token을 공유한다. Canvas 코드에서 Light/Dark 전용 색을 직접 하드코딩하지 않고 `canvas-utils.js`의 `css()`를 통해 theme variable을 읽는다.

## 새 챕터 추가

1. 해당 stage의 `content/chapters/` module에 chapter object를 추가한다.
2. Quality Pass 대상이면 rich schema를 `CONTENT-QUALITY.md` 기준으로 작성한다.
3. 필요하면 `content/sources.js`에 source mapping을 추가한다.
4. 시각화가 필요하면 `assets/js/visualizations/`에 독립 module을 작성한다.
5. registry에 chapter id를 연결한다.
6. 핵심 viewer라면 `scripts/validate-content.mjs`의 required visualization 목록을 갱신한다.
7. `npm run ci`를 통과시킨다.

## 라이선스 경계

- `content/**` → CC BY 4.0
- `assets/js/**`, `assets/css/**`, `scripts/**` → MIT
- `assets/third-party/**` → upstream license

CI는 교재 파일이 다시 `assets/js/content/` 아래로 들어가는 것을 실패로 처리해 이 경계를 유지한다.

## 시각화 설계 원칙

- 장식보다 개념의 경계·흐름·비용 차이를 보여준다.
- 버튼 수를 최소화하고 상태 변화가 설명 패널과 함께 바뀌게 한다.
- 긴 설명은 DOM side panel에 두고 Canvas label은 짧게 유지한다.
- 박스에 글자를 맞추기 위해 폰트를 지나치게 축소하지 않는다.
- 대각선 connector crossing과 의미 없는 all-to-all line을 줄인다.
- 작은 화면에서는 column을 stack하고 설명 패널의 읽기 가능성을 우선한다.
- 애니메이션은 data movement를 설명할 때만 사용하며 시각적 효과 자체를 목적으로 하지 않는다.
- 실제 hardware 수치나 vendor-specific 동작을 일반화하지 않고 topology/site별 확인 필요성을 명시한다.
