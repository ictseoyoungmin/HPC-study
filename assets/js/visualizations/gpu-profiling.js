const views = {
  timeline: {
    label: "Timeline",
    title: "CPU launch → H2D → Kernel → D2H → Sync",
    intro: "System profiler에서는 각 단계의 길이뿐 아니라 어떤 구간이 서로 겹치고 어디서 GPU가 기다리는지를 본다.",
    lanes: [
      ["CPU", [["preprocess", 8, 24, "cpu"], ["launch", 38, 10, "cpu"], ["sync", 82, 10, "wait"]]],
      ["Copy", [["H2D", 28, 18, "copy"], ["D2H", 70, 12, "copy"]]],
      ["GPU", [["kernel A", 47, 22, "gpu"]]]
    ],
    note: "긴 CPU gap이 kernel 사이에 반복되면 kernel 내부보다 host 공급 경로를 먼저 조사한다."
  },
  overlap: {
    label: "Overlap",
    title: "두 duration이 있어도 wall time은 단순 합이 아닐 수 있다",
    intro: "독립 작업이 겹치면 total time은 합보다 짧아지고, synchronization이 끼면 빈 구간이 늘어난다.",
    lanes: [
      ["CPU", [["prep B", 8, 18, "cpu"], ["launch B", 36, 9, "cpu"]]],
      ["Copy", [["H2D B", 27, 24, "copy"], ["D2H A", 69, 18, "copy"]]],
      ["GPU", [["kernel A", 18, 38, "gpu"], ["kernel B", 57, 28, "gpu"]]]
    ],
    note: "Overlap은 bar가 겹쳐 보이는지 직접 확인해야 한다. stream 수만 보고 판단하지 않는다."
  },
  kernel: {
    label: "Kernel",
    title: "Hot kernel을 찾은 뒤에만 내부 metric으로 내려간다",
    intro: "Kernel profiler는 질문에 따라 metric을 선택한다. occupancy, memory throughput, stall reason을 한 번에 결론처럼 읽지 않는다.",
    cards: [
      ["Memory-bound 후보", "DRAM/L2 throughput, load/store efficiency, transaction pattern을 본다."],
      ["Latency hiding 후보", "occupancy와 eligible warp, stall reason을 함께 본다."],
      ["Control-flow 후보", "branch divergence와 instruction mix를 확인한다."],
      ["주의", "Profiler replay와 instrumentation overhead가 실행을 바꿀 수 있으므로 작은 대표 구간으로 좁힌다."]
    ],
    note: "Metric은 병목 가설을 검증하기 위한 증거이지 단독 진단 결과가 아니다."
  }
};

function render(host, id) {
  const view = views[id];
  host.querySelector("[data-prof-title]").textContent = view.title;
  host.querySelector("[data-prof-intro]").textContent = view.intro;
  const stage = host.querySelector("[data-prof-stage]");
  if (view.lanes) {
    stage.innerHTML = `<div class="gpu-prof-timeline">
      ${view.lanes.map(([lane, bars]) => `
        <div class="gpu-prof-lane">
          <strong>${lane}</strong>
          <div class="gpu-prof-track">
            ${bars.map(([label, left, width, type]) => `<span class="gpu-prof-bar ${type}" style="left:${left}%;width:${width}%">${label}</span>`).join("")}
          </div>
        </div>`).join("")}
      <div class="gpu-prof-axis"><span>0</span><span>time →</span></div>
    </div>`;
  } else {
    stage.innerHTML = `<div class="gpu-prof-card-grid">${view.cards.map(([title, text]) => `<article><strong>${title}</strong><p>${text}</p></article>`).join("")}</div>`;
  }
  host.querySelector("[data-prof-note]").textContent = view.note;
  host.querySelectorAll("[data-prof-view]").forEach(button => button.classList.toggle("active", button.dataset.profView === id));
}

export function mountGpuProfiling(host) {
  host.innerHTML = `
    <div class="viz-shell textbook-viz gpu-prof-viz">
      <div class="viz-toolbar">
        <strong>GPU profiling ladder</strong>
        <div class="viz-controls">
          ${Object.entries(views).map(([id, view], index) => `<button class="viz-btn ${index === 0 ? "active" : ""}" type="button" data-prof-view="${id}">${view.label}</button>`).join("")}
        </div>
      </div>
      <div class="gpu-prof-body">
        <header><h3 data-prof-title></h3><p data-prof-intro></p></header>
        <div data-prof-stage></div>
        <div class="gpu-concept-note"><b>다음 질문</b><span data-prof-note></span></div>
      </div>
    </div>`;
  let current = "timeline";
  render(host, current);
  const click = event => {
    const button = event.target.closest("[data-prof-view]");
    if (!button) return;
    current = button.dataset.profView;
    render(host, current);
  };
  host.addEventListener("click", click);
  return () => host.removeEventListener("click", click);
}
