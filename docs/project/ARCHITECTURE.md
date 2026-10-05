# Architecture

## 목표

HPC Study는 챕터 수와 시각화 수가 계속 늘어나는 것을 전제로 한다. 콘텐츠, 학습 UI, 시각화 구현을 분리해 한 영역의 변경이 다른 영역의 하드코딩을 만들지 않도록 한다.

교재 품질 기준은 `CONTENT-QUALITY.md`를 따른다. 기능 수보다 설명의 깊이와 시각적 가독성을 우선한다.

## 계층

```text
index.html
├─ content/                      CC BY 4.0 educational data
│  ├─ chapters/                  62-chapter base curriculum modules
│  ├─ enrichments/               Quality Pass rich-schema overlays
│  ├─ code-lessons.js            shell/C/C++/Python/Slurm educational examples
│  └─ sources.js                 source registry / chapter references
└─ assets/
   ├─ css/
   │  ├─ app.css                 base UI / theme
   │  ├─ quality-v2.css          rich textbook content / common visual rules
   │  ├─ code-block.css          language-aware code/script/lab containers
   │  ├─ system-os-v2.css        System / OS DOM viewer layouts
   │  ├─ parallel-quality.css    Parallel / Cluster DOM viewer layouts
   │  └─ performance-quality.css Performance DOM workflow layouts
   └─ js/                        MIT application code
      ├─ main.js                 routing / page rendering
      ├─ core/                   theme / state / curriculum assembly
      ├─ ui/
      │  └─ code-block.js        shared code block renderer / copy behavior
      └─ visualizations/         concept-specific viewers
```

### Content

`content/chapters/`의 챕터 객체가 기본 curriculum을 정의한다. 모든 챕터는 최소 schema를 유지한다.

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

현재 `Foundation`, `System / OS`, `Parallel / Cluster`, `Performance`가 이 rich schema를 CI에서 강제한다. 이후 stage도 Quality Pass가 끝나는 순서대로 같은 검증 집합에 추가한다.

`concepts[]`는 더 이상 본문을 대체하지 않는다. 설명형 본문을 읽은 뒤 핵심을 다시 압축하는 summary로 사용한다.

Parallel / Cluster와 Performance에서는 기존 base module을 유지하면서 `content/enrichments/03-*.js`, `content/enrichments/04-performance.js`에 설명형 schema를 분리했다. `assets/js/core/curriculum.js`가 chapter id 기준으로 base object와 enrichment를 merge한다. 이 구조는 대규모 재작성 중에도 기존 명령어/실습/최소 schema를 안정적으로 보존하면서 editorial content를 독립적으로 리뷰하기 위한 전환 구조다. 향후 base module 자체를 rich schema로 통합할 수 있지만, 사용자-facing 결과와 CI 기준은 merge된 최종 chapter object를 기준으로 한다.

`content/code-lessons.js`는 command 한두 줄보다 긴 교육용 code sample을 별도 관리한다. 현재 diagnostic/utility/automation Bash script와 Performance benchmark/profiling script를 제공하며 이후 OpenMP/MPI C source, Python 분석 script, Slurm batch script, example output도 같은 schema로 확장한다.

```text
chapterId
└─ code lesson
   ├─ title / intro / principles[]
   └─ samples[]
      ├─ id / title
      ├─ language     bash / c / cpp / python / slurm / text / output
      ├─ kind         command / script / source / output / config
      ├─ filename
      ├─ code
      └─ description / observe / caution
```

`assets/js/core/curriculum.js`는 content module을 순서대로 조립하고 enrichment를 합칠 뿐 교재 문장을 직접 보유하지 않는다. Navigation, progress, pagination은 최종 chapter array에서 자동 파생한다.

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
→ Code / script lesson (when present)
→ Commands
→ Lab
→ Mistakes / troubleshooting
→ Self-check
→ References
```

아직 Quality Pass 전인 챕터는 기존 최소 schema로도 렌더링된다. Stage를 순차적으로 전환하기 위한 호환 계층이다.

### Code block abstraction

`assets/js/ui/code-block.js`는 code presentation을 한 곳에서 책임진다. Bash command, script, C/C++/Python source, Slurm script, config, sample output을 같은 frame에 넣되 language와 kind를 header에 명시한다.

기존 `command` 데이터도 이 abstraction을 거쳐 `Bash · 명령` block으로 렌더링한다. 실습 step은 prose와 executable code를 구분하며, shell command로 판별되는 기존 문자열 step도 같은 Bash block으로 올려 보여 준다. 이후 신규 실습은 가능하면 object schema를 사용해 language/kind를 명시한다.

```text
{
  title,
  language,
  kind,
  filename,
  code,
  description,
  observe,
  caution
}
```

Copy 동작은 HTML attribute에 source string을 다시 넣지 않고 해당 block의 `<code>` text를 읽는다. 따라서 multiline script와 quote가 포함된 source도 동일하게 복사할 수 있다.

### Visualization registry

`assets/js/visualizations/canvas-labs.js`는 chapter id와 mount function을 연결한다. 이름은 초기 구조의 흔적이지만 DOM viewer와 Canvas viewer를 모두 registry에서 관리한다.

```text
hpc-overview.js          DOM-based system map / AA diagnostic map
system-os-map.js         process model / task state / cgroup / namespace-service DOM maps
parallel-models.js       thread sharing / OpenMP schedule / hybrid placement DOM maps
performance-method.js    benchmark / profiling / debugging DOM workflows
cluster3d-v2.js          Core → Socket → Node → Cluster / central fabric hub
cpu-topology.js          Socket / Core / SMT / binding
cache-coherence.js       hierarchy / coherence / false sharing
virtual-memory.js        translation / faults / pressure
numa.js                  local / remote / first-touch
mpi.js                   P2P / tree broadcast / non-crossing allreduce ring
network-rdma.js          TCP / RDMA / UCX-libfabric with narrow vertical path
network-benchmark.js     latency / bandwidth / topology / median-p95
storage-stack.js         page cache / filesystem / block / device / shared FS
parallel-filesystem.js   metadata bus / 1:1 striping / small-file queue
scientific-io.js         rank-per-file / collective MPI-IO / HDF5 / staging
slurm.js                 job lifecycle / resource allocation
resource-scaling.js      scale up/down/out/in
strong-weak.js           strong / weak / Amdahl
roofline.js              arithmetic intensity model
gpu-nccl.js              GPU execution / data movement / NCCL / GDR
```

시각화 control은 viewer toolbar 안에 둔다. 본문 영역에는 viewer 조작을 위한 별도 버튼을 두지 않는다.

### Text-heavy visualization

긴 설명을 Canvas 안에 직접 그리지 않는다. Text-heavy concept map과 workflow는 DOM/CSS를 사용해 wrapping과 responsive layout을 브라우저에 맡긴다.

Canvas는 다음과 같이 좌표가 의미를 갖는 경우에 우선 사용한다.

- graph / curve / axis
- short node labels
- dynamic packet / data movement
- topology whose labels are short and bounded

Network topology에서 교육적 이유가 없는 all-to-all line은 피하고 switch/fabric hub 또는 계층형 경로로 표현한다. Broadcast는 tree, allreduce는 ring처럼 **communication pattern 자체가 connector shape의 이유가 되는 경우**에만 연결선을 사용한다. 작은 화면에서는 같은 개념을 세로 path나 stacked domain으로 재배치하고, desktop 그림을 단순 축소하지 않는다.

Performance workflow처럼 text가 핵심인 시각화는 선을 많이 그리지 않고 ordered card sequence로 관계를 표현한다. 3-column desktop layout은 tablet에서 2-column, mobile에서 1-column으로 stack한다.

### Theme

CSS와 Canvas는 semantic token을 공유한다. Canvas 코드에서 Light/Dark 전용 색을 직접 하드코딩하지 않고 `canvas-utils.js`의 `css()`를 통해 theme variable을 읽는다.

## 새 챕터 추가

1. 해당 stage의 `content/chapters/` module에 chapter object를 추가한다.
2. Quality Pass 대상이면 rich schema를 `CONTENT-QUALITY.md` 기준으로 작성한다. 전환 중인 stage는 `content/enrichments/` overlay를 사용할 수 있다.
3. 필요하면 `content/sources.js`와 `docs/SOURCES.md`에 source를 추가하고 chapter mapping을 연결한다.
4. 장문 script/source 예제가 있으면 `content/code-lessons.js`에 language와 kind를 명시해 추가한다.
5. 시각화가 필요하면 `assets/js/visualizations/`에 독립 module을 작성한다.
6. registry에 chapter id를 연결한다.
7. 핵심 viewer라면 `scripts/validate-content.mjs`의 required visualization 목록을 갱신한다.
8. `npm run ci`를 통과시킨다.

## 라이선스 경계

- `content/**` → CC BY 4.0
- `assets/js/**`, `assets/css/**`, `scripts/**` → MIT
- `assets/third-party/**` → upstream license

CI는 교재 파일이 다시 `assets/js/content/` 아래로 들어가는 것을 실패로 처리해 이 경계를 유지한다. Educational code sample도 `content/code-lessons.js` 아래에 두므로 presentation code와 라이선스 경계가 섞이지 않는다.

## 시각화 설계 원칙

- 장식보다 개념의 경계·흐름·비용 차이를 보여준다.
- 버튼 수를 최소화하고 상태 변화가 설명 패널과 함께 바뀌게 한다.
- 긴 설명은 DOM side panel 또는 workflow card에 두고 Canvas label은 짧게 유지한다.
- 박스에 글자를 맞추기 위해 폰트를 지나치게 축소하지 않는다.
- 대각선 connector crossing과 의미 없는 all-to-all line을 줄인다.
- 작은 화면에서는 column을 stack하거나 end-to-end path를 세로로 재배치하고 설명 패널의 읽기 가능성을 우선한다.
- 애니메이션은 data movement를 설명할 때만 사용하며 시각적 효과 자체를 목적으로 하지 않는다.
- 실제 hardware 수치나 vendor-specific 동작을 일반화하지 않고 topology/site별 확인 필요성을 명시한다.
