# Content & Visualization Quality Standard

HPC Study는 챕터 수보다 학습자가 실제로 개념 모델을 만들 수 있는지를 우선한다. 이 문서는 교재 본문과 시각화가 따라야 할 최소 품질 기준을 정의한다.

## 1. 챕터의 기본 학습 흐름

Quality Pass를 완료한 챕터는 가능한 한 다음 순서를 따른다.

```text
왜 중요한가
→ 학습 목표
→ 핵심 용어 정의
→ 설명형 본문
→ 한 장으로 정리
→ 개념 시각화
→ 실제 진단 예시
→ 스크립트 / 소스 코드 예제
→ Linux/Slurm에서 확인
→ 실습
→ 흔한 실수 / Troubleshooting
→ Self-check
→ References
```

`concepts[]` 몇 줄만 나열하는 방식은 요약으로만 사용한다. 핵심 설명은 `sections[]`의 문단으로 작성한다.

## 2. 용어 설명

- 약어와 전문 용어는 처음 등장할 때 뜻과 시스템에서의 역할을 설명한다.
- 정의는 사전식 한 문장으로 끝내지 않고 "왜 이 용어를 구분해야 하는가"를 함께 적는다.
- 비슷한 용어를 혼용하지 않는다. 예: CPU / Socket / Core / logical CPU.
- vendor-specific 용어를 일반 개념처럼 쓰지 않는다.

## 3. 설명형 본문

각 section은 최소 두 문단과 takeaway를 가진다.

좋은 section은 다음 질문 중 하나 이상에 답해야 한다.

- 왜 이 구조가 생겼는가?
- 무엇이 무엇을 포함하거나 공유하는가?
- 어느 경계에서 비용이 추가되는가?
- 정상 동작과 장애 증상은 어떻게 연결되는가?
- AA는 어떤 증거를 보고 다음 가설을 선택하는가?

기능 목록이나 명령어 목록을 본문 설명의 대체물로 사용하지 않는다.

## 4. 명령어·코드·실습

명령어는 항상 다음 세 요소를 연결한다.

```text
명령어
→ 이 명령을 실행하는 목적
→ 출력에서 관찰할 값과 해석 범위
```

Bash 명령, shell script, C/C++, Python, Slurm script, 예시 output은 같은 시각 컴포넌트에 문자열로 섞지 않는다. 공통 code-block abstraction을 사용하고 최소한 다음 metadata를 가진다.

```text
language   # bash / c / cpp / python / slurm / text / output
kind       # command / script / source / output / config
filename   # 저장해서 실행하는 예제일 때
code
```

표시 규칙은 다음과 같다.

- Bash command는 `Bash · 명령` container로 표시한다.
- 저장해서 실행하는 shell script는 `Bash · 스크립트 · filename.sh`처럼 command와 구분한다.
- compiler를 사용하는 병렬 프로그래밍 예제는 source code와 compile/run command를 서로 다른 code block으로 나눈다.
- output 예시는 실행 명령과 구분해 `Output` block으로 표시한다.
- 긴 command나 여러 줄 script를 `<li><code>...</code></li>` 형태의 inline text로 표시하지 않는다.
- 모든 실행 가능한 block은 copy 동작을 제공하되, 목적·관찰값·주의사항은 code 바깥의 설명 영역에 둔다.

Shell scripting은 운영 자동화의 핵심 학습 대상이다. 최소한 다음 세 유형을 구분해 다룬다.

1. **진단 script** — system/job 상태를 재현 가능한 evidence bundle로 수집한다.
2. **utility script** — log나 command output을 변환·요약하되 원본을 수정하지 않는다.
3. **automation script** — 여러 입력을 반복 처리하고 exit status를 통해 성공/실패를 다른 도구에 전달한다.

실습은 명령 실행 자체가 아니라 학습자가 설명할 수 있어야 하는 완료 기준을 가진다.

## 5. Performance 측정 원칙

Performance 챕터는 도구 이름보다 실험 설계와 evidence chain을 먼저 가르친다.

기본 순서는 다음과 같다.

```text
질문 / 가설
→ baseline
→ 통제 변수
→ 반복 측정
→ correctness 검증
→ profile / counter
→ 변경
→ 동일 protocol 재측정
```

추가 원칙:

- best run 하나를 성능 개선의 근거로 사용하지 않는다.
- median과 spread를 함께 보고 개선 폭이 natural variation보다 충분히 큰지 확인한다.
- PMU counter 하나를 root cause로 단정하지 않는다.
- 모델(Amdahl, Gustafson, Roofline)은 실제 시스템의 모든 overhead를 자동으로 포함하는 예측식으로 설명하지 않는다.
- performance와 correctness를 분리하지 않는다. 실패하거나 다른 계산을 한 run은 성능 통계에 포함하지 않는다.
- benchmark script는 raw measurement와 exit status, 가능하면 environment metadata를 보존한다.

## 6. Self-check

- 최소 3개 질문을 둔다.
- 단순 암기보다 차이와 인과관계를 묻는다.
- 정답은 접을 수 있는 형태로 제공한다.

## 7. 시각화 설계 원칙

시각화는 장식이 아니라 개념의 경계, 흐름, 비용 차이를 보여 주는 교재 요소다.

### Text

- 긴 설명 문장을 Canvas 좌표에 직접 그리지 않는다.
- 긴 설명은 DOM side panel 또는 HTML label을 사용해 자동 wrapping을 보장한다.
- Canvas 내부 text는 짧은 node label, axis, 수치처럼 공간이 명확한 경우에만 사용한다.
- 글자를 박스에 넣기 위해 font size를 과도하게 줄이지 않는다.

### Layout

- 요소 사이에 명시적인 padding과 최소 간격을 둔다.
- 화면 폭이 줄어들면 column을 쌓거나 layout mode를 바꾼다.
- text와 line, node와 arrow가 서로 겹치는 좌표를 만들지 않는다.
- viewer 안에서 설명이 잘리지 않도록 overflow와 min-height를 점검한다.

### Connector

- all-to-all 연결선을 교육적 이유 없이 그리지 않는다.
- network topology는 가능하면 hub/switch/fabric 또는 계층형 경로로 표현한다.
- 선은 의미가 있을 때만 사용하고, 대각선 교차를 최소화한다.
- control path, data path, I/O path가 다르면 동일한 선 스타일로 뒤섞지 않는다.

### Animation

- data movement나 state transition을 설명할 때만 사용한다.
- 장식용 회전, particle, blinking은 줄인다.
- animation이 멈춰도 정적인 구조만으로 개념을 이해할 수 있어야 한다.

## 8. Quality Pass 완료 기준

현재 `Foundation`, `System / OS`, `Parallel / Cluster`, `Performance` stage에 다음 schema를 CI에서 요구한다.

```text
learningObjectives[]
terms[]              # term / definition / why
sections[]           # title / 2+ paragraphs / takeaway
selfCheck[]          # question / answer
```

시각화가 있는 핵심 챕터는 visualization registry와 CI required list에 등록한다. 장문 code lesson은 `content/code-lessons.js`에서 관리하며 language/kind/code와 shell-script shebang을 별도 CI에서 검사한다.

## 9. 진행 방식

62개 챕터를 동시에 얕게 수정하지 않는다. Stage 단위로 앞에서부터 Quality Pass를 완료한다.

1. Foundation
2. System / OS
3. Parallel / Cluster
4. Performance
5. Accelerator
6. Operations / RCA
7. Expert Practice

새 기능 추가는 이 품질 개선보다 우선하지 않는다.
