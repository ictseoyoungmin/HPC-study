# Operations / RCA Quality Pass v2

## 목적

Operations / RCA stage를 단순 운영 명령 모음이 아니라 **증상 → 증거 → 시간축 → failure boundary → root cause 후보 → corrective action**의 사고방식을 학습하는 교재로 재구성한다.

## 콘텐츠 재작성

11개 챕터에 `learningObjectives / terms / sections / example / selfCheck`를 추가했다.

- Slurm Operations: `slurmctld → slurmd → Prolog/plugin/cgroup → accounting` lifecycle boundary
- Failure RCA: `symptom → first causal event → propagation → impact → corrective action`
- Monitoring: CPU / memory / storage / network / GPU의 동일 incident window correlation
- Node Health: `DRAIN → evidence capture → A/B reproduction → fix → validation → RESUME`
- Cluster Operations: desired state / configuration drift / fleet cohort / blast radius / escalation
- Security: identity / path traversal / ACL-mode / quota-limit / secret handling
- Pending Runbook: scheduler Reason을 resource / priority / dependency / policy로 분류
- Slow Job Runbook: CPU / memory / storage / MPI-network / serial-imbalance bound 분류
- OOM Runbook: application / cgroup / system memory boundary와 rank/input growth model 구분
- I/O & MPI Hang Runbook: rank별 progress 차이와 D-state / collective / transport evidence 분리
- Low GPU Utilization Runbook: input → H2D → kernel → sync/collective → checkpoint dependency 추적

## 시각화 원칙

운영/RCA 시각화는 긴 문장을 Canvas 좌표에 넣지 않고 DOM card/lane layout을 사용한다.

- desktop: 2~3열 grid
- tablet: 2열
- mobile: 1열
- connector line보다 단계 번호와 semantic label을 사용해 crossing을 제거
- 원인과 결과를 색이나 화살표만으로 표현하지 않고 텍스트 label로 명시

추가 파일:

- `assets/js/visualizations/operations-rca.js`
- `assets/css/operations-quality.css`

## CI

`Operations / RCA`를 rich-schema quality stage에 포함한다. 11개 chapter 모두 최소 다음을 만족해야 한다.

- learning objectives 3+
- terms 5+
- explanatory sections 3+
- section당 paragraph 2+
- self-check 3+

또한 11개 Operations / RCA viewer를 required teaching visualization 목록에 포함한다.

## Source governance

기존 공식 source registry의 Linux Kernel / Linux man-pages / Slurm / MPI Forum / Open MPI / Red Hat / NVIDIA CUDA / AMD ROCm을 chapter별로 연결한다. 외부 문서는 기술 사실 확인용 reference로 사용하고 본문·도식·runbook 구조는 자체 작성한다.

## 남은 QA

실제 브라우저에서 360 / 768 / desktop 폭의 card spacing과 긴 한국어 문장 wrapping은 별도 visual QA가 필요하다. 이번 pass는 collision을 만들기 쉬운 Canvas text와 connector 구조를 제거하고 responsive layout 규칙을 코드 수준에서 적용한 1차 완료다.
