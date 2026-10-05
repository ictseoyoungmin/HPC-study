const views = Object.freeze({
  method: {
    title: "성능 측정은 실험 설계부터 시작한다",
    intro: "도구보다 먼저 질문, 통제 변수, 반복 측정, correctness를 고정한다. 아래 단계는 benchmark를 재현 가능한 실험으로 만드는 최소 흐름이다.",
    steps: [
      ["1", "질문", "무엇이 얼마나 빨라져야 하는지 비교 조건과 지표를 한 문장으로 적는다."],
      ["2", "Baseline", "변경 전 binary와 input에서 wall time과 환경 metadata를 기록한다."],
      ["3", "통제", "thread/rank 수, affinity, node type, compiler/library, input을 고정한다."],
      ["4", "반복", "warm-up을 분리하고 여러 번 실행해 median과 spread를 계산한다."],
      ["5", "Correctness", "exit status, checksum 또는 domain validation으로 같은 계산인지 확인한다."],
      ["6", "판단", "효과 크기가 자연 변동보다 충분히 큰지 보고 다음 profile 여부를 결정한다."]
    ],
    note: "한 번의 best run은 evidence가 아니라 관찰 하나다. 비교 가능한 반복 측정이 있어야 성능 개선을 주장할 수 있다."
  },
  profile: {
    title: "Profiling ladder: 넓은 질문에서 좁은 원인으로",
    intro: "처음부터 모든 counter를 켜기보다 wall-time 회귀를 확인한 뒤 필요한 해상도로 내려간다.",
    steps: [
      ["1", "Wall time", "동일 protocol에서 regression이 반복되는지 먼저 확인한다."],
      ["2", "perf stat", "cycles, instructions, cache/branch event를 baseline과 비교해 bound 후보를 좁힌다."],
      ["3", "perf record", "sampling으로 hot instruction과 call stack을 찾는다."],
      ["4", "Source 연결", "hot path를 algorithm, data layout, branch, memory access와 연결한다."],
      ["5", "수정", "하나의 가설을 겨냥한 변경만 적용한다."],
      ["6", "재측정", "같은 benchmark protocol과 correctness check로 효과를 다시 검증한다."]
    ],
    note: "Counter 하나는 root cause가 아니다. PMU event, sampling profile, source code를 같은 가설에 연결해야 한다."
  },
  debug: {
    title: "Debugging ladder: 증상에 맞는 계층부터 본다",
    intro: "hang, syscall failure, crash, memory corruption은 서로 다른 증거를 요구한다. 전체 job에 무거운 도구를 붙이기 전에 범위를 줄인다.",
    steps: [
      ["1", "증상 고정", "exit code/signal, 실패 rank, node, timestamp와 재현 조건을 기록한다."],
      ["2", "Syscall", "ENOENT/EACCES/blocking 의심이면 strace로 kernel interface를 본다."],
      ["3", "Stack", "SIGSEGV나 hang이면 gdb/core dump로 thread와 backtrace를 확인한다."],
      ["4", "재현 축소", "input, rank 수, thread 수를 줄여 같은 failure가 유지되는지 본다."],
      ["5", "Memory 검사", "invalid access가 의심되면 작은 재현에 sanitizer/Valgrind를 적용한다."],
      ["6", "Production 검증", "수정 후 원래 workload에서 correctness와 stability를 다시 확인한다."]
    ],
    note: "좋은 debugging은 도구 수가 아니라 문제를 가장 작은 재현과 가장 직접적인 증거로 연결하는 과정이다."
  }
});

function render(host, view) {
  const data = views[view];
  host.innerHTML = `
    <div class="viz-shell perf-method-viz">
      <div class="viz-toolbar">
        <strong>Performance evidence workflow</strong>
        <div class="viz-controls">
          <button class="viz-btn ${view === "method" ? "active" : ""}" data-view="method">측정 방법</button>
          <button class="viz-btn ${view === "profile" ? "active" : ""}" data-view="profile">Profiling</button>
          <button class="viz-btn ${view === "debug" ? "active" : ""}" data-view="debug">Debugging</button>
        </div>
      </div>
      <div class="perf-method-body">
        <header>
          <h3>${data.title}</h3>
          <p>${data.intro}</p>
        </header>
        <div class="perf-flow" role="list">
          ${data.steps.map(([n,label,text]) => `
            <div class="perf-flow-step" role="listitem">
              <span class="perf-step-num">${n}</span>
              <div><strong>${label}</strong><p>${text}</p></div>
            </div>`).join("")}
        </div>
        <div class="perf-flow-note"><b>해석 기준</b><span>${data.note}</span></div>
      </div>
    </div>`;
}

export function mountPerformanceMethod(host, initial="method") {
  let view = views[initial] ? initial : "method";
  const click = event => {
    const button = event.target.closest("[data-view]");
    if (!button) return;
    view = button.dataset.view;
    render(host, view);
    host.querySelector(".viz-controls")?.addEventListener("click", click);
  };
  render(host, view);
  host.querySelector(".viz-controls")?.addEventListener("click", click);
  return () => host.querySelector(".viz-controls")?.removeEventListener("click", click);
}
