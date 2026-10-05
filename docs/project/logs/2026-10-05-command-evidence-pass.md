# 2026-10-05 · Command Evidence teaching pass

## 목표

기존 `commands[]`는 무엇을 실행하고 무엇을 관찰해야 하는지는 설명했지만, 학습자가 실제 terminal output을 보았을 때 **어느 필드를 읽고 그 결과를 다음 진단 행동으로 어떻게 연결하는지**는 충분히 훈련하지 못했다.

이번 pass는 명령 암기보다 `command → output → interpretation → next-best-test`의 반복 가능한 사고 흐름을 교재에 추가하는 데 목적이 있다.

## 구현

`content/command-evidence.js`에 content 전용 schema를 추가했다.

```text
chapter id
  └─ evidence[]
      ├─ title
      ├─ command
      ├─ output
      ├─ read[] { field, meaning }
      ├─ branches[] { when, next }
      └─ note
```

UI는 `Command Evidence` section에서 다음 순서로 렌더링한다.

1. 진단 목적과 실행 명령
2. 학습용 대표 출력 예시
3. 어떤 필드를 읽어야 하는지
4. 결과별 다음 진단 분기
5. version/site 차이에 대한 caveat

대표 출력은 특정 사용자의 실제 cluster capture가 아니다. 숫자·hostname·모델명 자체를 외우지 않도록 UI에 **학습용 대표 형식**임을 명시했다. 실제 lab/cluster output은 이후 provenance를 보존하는 별도 형식으로 추가할 수 있게 roadmap에 남겼다.

## 1차 coverage

7개 stage 전체가 최소 한 개 이상의 Command Evidence chapter를 갖도록 했다.

- Foundation: Linux permission
- System / OS: process state, virtual memory, CPU topology, NUMA
- Parallel / Cluster: MPI placement, parallel filesystem, Slurm basics/resources
- Performance: GNU time baseline, perf/PMU
- Accelerator: GPU utilization/memory/power
- Operations / RCA: PENDING, OOM
- Expert Practice: workload signature, regression fingerprint, ticket context

총 17개 chapter가 1차 coverage다.

## CI

`scripts/validate-command-evidence.mjs`는 다음을 검사한다.

- evidence가 존재하는 chapter id가 curriculum에 실제로 존재하는가
- title / command / output이 비어 있지 않은가
- 각 evidence에 2개 이상의 read point가 있는가
- 각 evidence에 2개 이상의 diagnostic branch가 있는가
- 7개 stage가 모두 최소 한 번 coverage되는가

`package.json`의 `npm run ci`에 이 검증을 포함했다.

## 다음 작업

이번 pass는 구조와 핵심 대표 사례를 먼저 고정한 것이다. 다음에는 모든 command를 기계적으로 확장하기보다, troubleshooting 결정에 실제 가치가 큰 chapter를 우선 확장한다. 그 다음 중앙 Glossary와 cross-link 작업으로 이동한다.
