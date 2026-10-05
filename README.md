# HPC Study

HPC Application Analyst 학습을 위한 정적 웹 교재입니다.

## GitHub Pages

이 저장소는 빌드 도구 없이 정적 파일만으로 동작하도록 구성했습니다.

GitHub Pages에서 `main` 브랜치의 `/ (root)`를 배포 소스로 선택하면 다음 형태로 사용할 수 있습니다.

`https://ictseoyoungmin.github.io/HPC-study/`

라우팅은 hash 기반이므로 각 챕터를 새로고침해도 GitHub Pages의 404 라우팅 설정이 필요하지 않습니다.

## 구조

```text
HPC-study/
├─ index.html
├─ .nojekyll
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
      │  ├─ 03-parallel-cluster.js
      │  ├─ 04-performance.js
      │  ├─ 05-accelerator.js
      │  ├─ 06-operations-rca.js
      │  └─ 07-expert-practice.js
      └─ visualizations/
         ├─ index.js
         └─ cluster3d.js
```

## 설계

- 학습 내용과 UI 코드를 분리했습니다.
- 62개 챕터는 7개 stage 파일로 나뉩니다.
- 새 챕터는 해당 stage 배열에 객체 하나를 추가하면 navigation과 pagination에 자동 반영됩니다.
- Light/Dark 테마는 CSS semantic token으로 관리합니다.
- 진도와 테마는 브라우저 `localStorage`에 저장합니다.
- URL은 `#/chapter/<id>` 형식의 hash route를 사용합니다.
- 개념 시각화는 `visualizations/index.js`의 registry에서 챕터 ID와 연결합니다.
- `cluster-architecture`는 Three.js를 CDN에서 동적으로 불러오고, 나머지 주요 개념은 Canvas 2D로 동작합니다.

## 콘텐츠 원칙

챕터는 다음 필드를 사용합니다.

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

이 구조는 교재 내용과 표현/시각화 로직을 분리하기 위한 기준입니다.
