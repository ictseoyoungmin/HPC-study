# Code block / shell scripting learning pass

## 배경

Virtual Memory 실습처럼 여러 줄 Bash 명령이 `<li><code>...</code></li>` 안에 들어가면 언어, 실행 단위, 줄바꿈, copy 동작이 모두 불명확해진다. 향후 진단·유틸리티·자동화 shell script와 OpenMP/MPI 소스 예제를 추가하려면 명령어 전용 UI가 아니라 언어 독립적인 code presentation 계층이 필요하다.

## 결정

- 실행 가능한 code는 공통 `code-block` UI로 표시한다.
- Bash command는 `Bash · 명령`, 저장형 script는 `Bash · 스크립트 · filename.sh`로 구분한다.
- C/C++, Python, Slurm, output/config도 동일한 metadata schema를 사용한다.
- 교육용 source는 `content/code-lessons.js`에 두고 renderer/copy 동작은 `assets/js/ui/code-block.js`에 둔다.
- 기존 `commands[]`는 자동으로 Bash command block으로 렌더링한다.
- 기존 lab string 중 명령으로 판별되는 항목은 Bash block으로 승격한다. 신규 lab은 가능하면 explicit object schema를 사용한다.

## 첫 교육 예제

`Shell·환경변수·텍스트 처리` 챕터에 세 유형을 추가했다.

1. 진단 script: 사건 단위 baseline directory 생성
2. utility script: 원본 log를 수정하지 않고 오류 후보와 빈도 summary 생성
3. automation script: 여러 log를 반복 검사하고 exit status로 결과 전달

## 향후 확장

병렬 프로그래밍 예제에서는 source와 실행 절차를 분리한다.

```text
C / C++ source block
→ compiler command block
→ runtime / launcher command block
→ output block
→ 관찰 / 성능 해석
```

OpenMP, MPI, CUDA/HIP 예제를 추가하더라도 동일한 code-block UI를 재사용하고 교육용 source의 라이선스 경계는 `content/` 아래에서 유지한다.
