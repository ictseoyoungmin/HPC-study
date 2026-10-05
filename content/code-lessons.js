export const chapterCodeLessons = Object.freeze({
  "shell-text": {
    title: "Shell script로 진단 절차를 재현 가능하게 만들기",
    intro: "one-liner는 빠른 탐색에 좋지만 같은 조사를 반복해야 하거나 동료와 공유해야 한다면 script로 승격하는 편이 안전하다. script에는 입력, 실패 조건, 출력 위치가 드러나야 하고 원본 데이터를 파괴하지 않는 방향을 기본값으로 삼는다.",
    principles: [
      { title: "입력 경계를 명시한다", text: "위치 인자와 환경변수를 quote하고, 필수 입력이 없으면 사용법과 함께 명확히 실패한다." },
      { title: "실패를 숨기지 않는다", text: "set -euo pipefail과 exit status를 활용하되, 실패가 허용되는 command에는 의도를 드러내는 예외 처리를 둔다." },
      { title: "증거를 보존한다", text: "원본 로그를 수정하지 않고 timestamp가 있는 별도 directory와 summary 파일에 결과를 남긴다." }
    ],
    samples: [
      {
        id: "collect-baseline",
        title: "진단 스크립트 · 최소 시스템 baseline 수집",
        language: "bash",
        kind: "script",
        filename: "collect-baseline.sh",
        description: "문제 시점의 host, CPU, memory, filesystem, network 상태를 하나의 directory에 보존하는 예제다.",
        code: `#!/usr/bin/env bash
set -euo pipefail

out_dir=\${1:-"./hpc-baseline-$(date +%Y%m%d-%H%M%S)"}
mkdir -p "$out_dir"

{
  printf 'collected_at=%s\n' "$(date -Is)"
  printf 'host=%s\n' "$(hostname)"
  printf 'user=%s\n' "$(id -un)"
} > "$out_dir/context.txt"

nproc > "$out_dir/nproc.txt"
free -h > "$out_dir/memory.txt"
df -hT > "$out_dir/filesystems.txt"
ip -s link > "$out_dir/network.txt" 2>&1 || true

printf 'wrote %s\n' "$out_dir"`,
        observe: "한 번의 화면 출력보다 사건 단위 directory를 남기면 정상/문제 run과 diff하기 쉽다.",
        caution: "운영 cluster에서는 사이트 정책에 따라 허용되는 명령과 수집 범위를 확인한다."
      },
      {
        id: "summarize-log",
        title: "유틸리티 스크립트 · job log 오류 후보 요약",
        language: "bash",
        kind: "script",
        filename: "summarize-log.sh",
        description: "입력 log를 수정하지 않고 오류 후보 line과 반복 token 빈도를 별도 summary로 만든다.",
        code: `#!/usr/bin/env bash
set -euo pipefail

log=\${1:?"usage: $0 JOB_LOG"}
summary=\${2:-"\${log}.summary"}

{
  echo '=== first error candidates ==='
  grep -nEi 'error|fail|oom|killed' "$log" | head -40 || true
  echo
  echo '=== repeated first fields ==='
  awk '{print $1}' "$log" | sort | uniq -c | sort -nr | head -20
} > "$summary"

printf 'summary=%s\n' "$summary"`,
        observe: "grep 결과와 집계 결과는 결론이 아니라 원본 log를 다시 읽기 위한 index다."
      },
      {
        id: "batch-check",
        title: "자동화 스크립트 · 여러 log를 같은 규칙으로 검사",
        language: "bash",
        kind: "script",
        filename: "batch-check.sh",
        description: "여러 파일을 같은 규칙으로 반복 검사하고, 하나라도 오류 후보가 있으면 non-zero exit status를 반환하는 예제다.",
        code: `#!/usr/bin/env bash
set -euo pipefail

if (( $# == 0 )); then
  echo "usage: $0 LOG..." >&2
  exit 2
fi

failed=0
for log in "$@"; do
  if grep -qiE 'error|fail|oom|killed' "$log"; then
    printf 'WARN  %s\n' "$log"
    failed=1
  else
    printf 'OK    %s\n' "$log"
  fi
done

exit "$failed"`,
        observe: "자동화에서는 사람이 읽는 메시지와 다른 프로그램이 읽는 exit status를 함께 설계한다."
      }
    ]
  },

  "perf-method": {
    title: "반복 가능한 benchmark harness 만들기",
    intro: "성능 측정은 command를 여러 번 치는 것이 아니라 조건과 결과를 함께 남기는 작은 실험 자동화다. 아래 예제는 실행 시간과 exit status를 TSV로 저장해 이후 median과 spread를 계산할 수 있게 한다.",
    principles: [
      { title: "환경과 명령을 함께 기록한다", text: "binary, input, thread 수와 host 같은 조건을 결과 파일 옆에 남긴다." },
      { title: "실패 run을 통계에 섞지 않는다", text: "exit status를 기록하고 correctness check를 통과한 run만 성능 비교에 사용한다." },
      { title: "원시 측정값을 보존한다", text: "요약값만 저장하지 않고 각 반복의 raw wall time을 남겨 outlier를 다시 조사할 수 있게 한다." }
    ],
    samples: [
      {
        id: "benchmark-harness",
        title: "자동화 스크립트 · 반복 wall-time 측정",
        language: "bash",
        kind: "script",
        filename: "bench.sh",
        description: "같은 command를 여러 번 실행하고 elapsed time과 status를 TSV로 기록한다.",
        code: `#!/usr/bin/env bash
set -u

if (( $# < 2 )); then
  echo "usage: $0 REPEATS COMMAND [ARG...]" >&2
  exit 2
fi

repeats=$1
shift
out="bench-$(date +%Y%m%d-%H%M%S).tsv"
printf 'run\tseconds\tstatus\n' > "$out"

for ((i=1; i<=repeats; i++)); do
  tmp=$(mktemp)
  /usr/bin/time -f '%e' -o "$tmp" "$@"
  status=$?
  seconds=$(cat "$tmp")
  rm -f "$tmp"
  printf '%d\t%s\t%d\n' "$i" "$seconds" "$status" | tee -a "$out"
done

printf 'results=%s\n' "$out"`,
        observe: "각 run의 raw value와 status를 보존하고, 같은 조건의 baseline/variant 파일을 별도로 만든다.",
        caution: "benchmark 대상 command가 output correctness를 별도로 검증할 수 있도록 checksum 또는 test 단계를 추가하는 것이 좋다."
      }
    ]
  },

  "perf-pmu": {
    title: "Profiling 절차를 작은 스크립트로 표준화하기",
    intro: "perf를 사용할 때도 command와 output file 이름을 고정하면 baseline과 variant를 비교하기 쉽다. aggregate counter와 sampling profile을 서로 다른 산출물로 분리한다.",
    principles: [
      { title: "stat과 record를 분리한다", text: "counter summary와 sampling profile은 질문이 다르므로 각각 별도 output으로 저장한다." },
      { title: "build metadata를 함께 남긴다", text: "compiler flags와 symbol 상태가 profile 품질에 영향을 주므로 executable identity를 기록한다." },
      { title: "같은 protocol로 비교한다", text: "baseline과 변경 버전 모두 같은 event set, affinity, input으로 수집한다." }
    ],
    samples: [
      {
        id: "profile-wrapper",
        title: "진단 스크립트 · perf stat + sampling profile",
        language: "bash",
        kind: "script",
        filename: "profile.sh",
        description: "한 executable에 대해 aggregate counter와 call-stack sampling 결과를 분리해 저장한다.",
        code: `#!/usr/bin/env bash
set -euo pipefail

if (( $# == 0 )); then
  echo "usage: $0 COMMAND [ARG...]" >&2
  exit 2
fi

tag=$(date +%Y%m%d-%H%M%S)
mkdir -p "profile-$tag"

perf stat -d -o "profile-$tag/stat.txt" -- "$@"
perf record -g -o "profile-$tag/perf.data" -- "$@"
perf report --stdio -i "profile-$tag/perf.data" > "profile-$tag/report.txt"

printf 'profile_dir=%s\n' "profile-$tag"`,
        observe: "stat.txt는 counter 비교, report.txt는 hot stack 비교에 사용한다. 두 결과를 하나의 원인처럼 섞지 않는다.",
        caution: "shared production node에서는 perf 권한과 profiling overhead에 대한 site policy를 먼저 확인한다."
      }
    ]
  }
});

export function codeLessonForChapter(chapterId) {
  return chapterCodeLessons[chapterId] || null;
}
