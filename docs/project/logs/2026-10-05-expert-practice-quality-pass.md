# Expert Practice Quality Pass v2 — 2026-10-05

## 목표

Expert Practice stage를 단순 실무 팁 모음에서 AA가 실제로 판단·설명·문서화하는 방법을 학습하는 마무리 과정으로 전환한다. 7개 chapter 모두 앞선 stage와 동일한 rich textbook schema와 CI 품질 기준을 적용한다.

## Content pass

- `workloads`: application 이름이 아니라 compute / memory / network / storage / GPU resource signature와 phase behavior로 workload를 분류하도록 재작성.
- `capacity`: utilization, queue latency, demand distribution, fragmentation, headroom, acceptance criteria를 service objective 관점에서 연결.
- `regression`: golden baseline, noise floor, environment fingerprint, effect size, bisect, rollback/acceptance decision을 benchmark governance 흐름으로 정리.
- `ticket-postmortem`: symptom / impact / scope / evidence / hypothesis / action / validation을 구분하고 사용자 communication과 postmortem action item을 연결.
- `roadmap`: 30/60/90일을 지식량이 아니라 supervised operation → independent closure → service-level judgement의 역량 성장으로 재구성.
- `selftest`: 정답 명령 암기 대신 next-best-test, evidence update, stopping rule과 escalation을 평가하도록 재작성.
- `reference`: upstream specification, implementation docs, local policy, installed-version help의 authority boundary와 provenance를 설명.

## Visualization pass

`assets/js/visualizations/expert-practice.js`를 추가했다. 긴 텍스트를 Canvas 좌표에 배치하지 않고 responsive DOM card/grid로 구현했다.

- Workload resource-signature axes + execution phase row
- Capacity decision cards
- Regression governance pipeline
- Ticket/Postmortem fact-hypothesis-action separation
- 30/60/90 competency roadmap
- Incident drill decision flow
- Reference authority stack

`assets/css/expert-quality.css`는 desktop / tablet / mobile에서 grid column 수를 줄이고 text wrapping을 browser layout에 맡긴다. connector line을 사용하지 않아 line crossing과 label collision 가능성을 줄였다.

## Governance / CI

- Expert Practice를 `qualityStages`에 포함.
- 7개 chapter에 objectives 3+, terms 5+, sections 3+, self-check 3+를 강제.
- 7개 chapter visualization route를 required teaching visualization 목록에 포함.
- chapter References를 기존 Linux / Slurm / MPI / OpenMP / GPU / OpenHPC source registry에 연결.

## 남은 QA

실제 브라우저 360 px / 768 px / desktop에서 card spacing, authority stack wrapping, roadmap density를 눈으로 확인하는 visual QA는 별도 backlog로 유지한다. 이 작업에서는 DOM 구조와 responsive breakpoint를 코드 수준에서 정리했으며 pixel-level 검수를 완료했다고 간주하지 않는다.
