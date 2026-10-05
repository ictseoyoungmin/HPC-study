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

out_dir=${1:-"./hpc-baseline-$(date +%Y%m%d-%H%M%S)"}
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

log=${1:?"usage: $0 JOB_LOG"}
summary=${2:-"${log}.summary"}

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
  }
});

export function codeLessonForChapter(chapterId) {
  return chapterCodeLessons[chapterId] || null;
}
