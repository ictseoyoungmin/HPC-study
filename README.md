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

큰 stage는 의미 단위로 다시 나눴습니다. `content/index.js`가 모든 파일을 한 curriculum으로 합치므로 navigation과 pagination에서는 하나의 순서를 유지합니다.

## Chapter schema

```js
{
  id,
  stage,
  title,
  en,
  level,
  minutes,
  env,
  why,
  concepts,
  commands,
  lab,
  mistakes,
  troubleshoot,
  keywords
}
```

새 챕터를 추가할 때는 해당 content 파일에 객체를 추가하면 검색, navigation, 페이지 번호와 pagination에 자동 반영됩니다.

## 시각화

`assets/js/visualizations/index.js`가 챕터 ID와 시각화 구현을 연결합니다. 콘텐츠와 시각화가 분리되어 있으므로 시각화가 없는 챕터도 동일한 교재 레이아웃을 사용하고, 필요한 챕터에만 인터랙티브 설명을 추가할 수 있습니다.

현재 `cluster-architecture`는 Three.js를 사용하며 Three.js는 unpkg CDN에서 동적으로 로드합니다. Canvas 2D 시각화는 외부 라이브러리 없이 실행됩니다.
