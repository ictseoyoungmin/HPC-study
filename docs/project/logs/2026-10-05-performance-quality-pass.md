# Performance Quality Pass v2

Date: 2026-10-05

## Goal

Performance stage를 명령어/공식 나열에서 벗어나 **측정 설계 → 모델 → profile → 증거 해석 → 재측정**의 학습 흐름으로 재구성한다. 성능 문제를 해결할 때 단일 counter나 단일 run에 의존하지 않고 재현 가능한 실험과 evidence chain을 만드는 것을 목표로 한다.

## Content changes

대상 6개 chapter:

- `scaling`
- `strong-weak`
- `perf-method`
- `perf-pmu`
- `roofline`
- `debug-tools`

각 chapter에 다음 rich schema를 적용했다.

```text
learningObjectives
terms
sections
example
selfCheck
```

Performance stage는 이제 CI에서 Foundation / System / Parallel과 동일한 최소 품질 조건을 강제한다.

## Editorial decisions

### Scaling vocabulary

`scale-up/down/out/in`은 resource topology와 capacity/right-sizing 의사결정으로 다루고 `strong/weak scaling`은 problem size와 worker 수를 조절하는 성능 실험으로 분리했다. 두 용어군을 같은 축처럼 설명하지 않는다.

### Performance methodology

성능 측정은 다음 순서를 기본으로 한다.

```text
question / hypothesis
→ baseline
→ controlled variables
→ repetition
→ correctness
→ decision
```

도구 실행은 이 흐름을 대신하지 않는다.

### Profiling

`perf stat` counter 하나로 병목을 확정하지 않는다. wall-time regression 확인 후 aggregate counter, sampling profile, source code를 단계적으로 연결한다.

### Roofline

Roofline은 실제 runtime 예측기가 아니라 attainable performance의 상한 모델로 설명한다. arithmetic intensity 계산 시 어떤 memory level의 byte를 사용했는지 명시하고, measured bandwidth/compute roof와 vendor peak를 구분한다.

### Debugging

strace/gdb/core dump/memory checker는 tool catalog가 아니라 증상별 evidence ladder로 설명한다. 대규모 production job 전체에 무거운 tool을 먼저 적용하지 않고 작은 재현으로 범위를 줄인다.

## Visualization decisions

`perf-method`, `perf-pmu`, `debug-tools`는 텍스트 양이 많기 때문에 Canvas를 사용하지 않고 DOM workflow viewer를 사용한다. 각 step은 자동 wrapping되며 3-column → 2-column → 1-column responsive layout으로 바뀐다.

기존 `strong-weak`, `roofline`, `scaling` viewer는 graph/topology 좌표 자체가 학습 요소이므로 Canvas 기반을 유지한다. 실제 360 / 768 / desktop pixel QA는 별도 미완료 항목으로 남긴다.

## Code lessons

공통 code-block abstraction을 이용해 다음 Bash 예제를 추가했다.

- `perf-method`: 반복 wall-time benchmark harness
- `perf-pmu`: `perf stat`과 `perf record/report` 결과를 분리 저장하는 profiling wrapper

예제의 목적은 one-liner 암기가 아니라 raw measurement와 metadata를 재현 가능한 파일로 남기는 습관을 가르치는 것이다.

## CI

- Performance stage rich schema 검사 추가
- `perf-method`, `perf-pmu`, `debug-tools`를 required visualization 목록에 추가
- 기존 code lesson validator로 Performance Bash script schema와 shebang도 검사

## Follow-up

다음 Quality Pass stage는 Accelerator다. GPU execution model, memory hierarchy, stream/concurrency, multi-GPU communication, profiling을 Performance stage의 measurement discipline과 연결해 설명한다.
