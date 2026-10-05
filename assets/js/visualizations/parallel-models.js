import { setDetails, activateButton } from "./canvas-utils.js";

const details = {
  threads: {
    title: "한 process 안에서 무엇을 공유하는가",
    body: "OpenMP/Pthreads thread는 같은 process의 address space를 공유한다. 공유 heap/global data는 쉽게 접근할 수 있지만 동시에 쓰면 race가 생길 수 있고, 각 thread의 stack/register state는 독립적이다.",
    rows: [["공유", "code · heap · global data"], ["개별", "stack · registers · execution state"], ["비용", "synchronization · cache coherence · memory bandwidth"]],
    note: "Shared memory는 communication이 없는 모델이 아니라 load/store와 coherence가 communication 역할을 하는 모델로 볼 수 있다."
  },
  schedule: {
    title: "같은 iteration 수라도 끝나는 시각이 다를 수 있다",
    body: "Static은 미리 work를 나누고 dynamic은 runtime에서 남은 chunk를 재분배한다. 불균형한 loop에서는 dynamic이 idle tail을 줄일 수 있지만 scheduling overhead가 추가된다.",
    rows: [["Static", "낮은 overhead · 균일한 iteration에 유리"], ["Dynamic", "imbalance 완화 · runtime scheduling 비용"], ["측정", "thread별 useful work와 barrier wait를 분리"]],
    note: "schedule 이름만 비교하지 말고 chunk size와 barrier 도착 시각을 함께 기록한다."
  },
  hybrid: {
    title: "MPI rank와 OpenMP thread를 topology에 겹쳐 본다",
    body: "Hybrid 실행은 Node 간 rank와 Node 내부 thread를 동시에 배치한다. rank/node와 threads/rank가 CPU allocation, NUMA domain, memory footprint, MPI traffic을 함께 바꾼다.",
    rows: [["Node 간", "MPI message / collective"], ["Node 내부", "OpenMP shared-memory threads"], ["Baseline", "rank를 NUMA domain에 맞추고 thread를 그 안에 bind"]],
    note: "총 Core 수가 같아도 1×32, 2×16, 4×8은 서로 다른 communication/memory 구조다."
  }
};

export function mountParallelModels(host, initial = "threads") {
  host.innerHTML = `
    <div class="viz-shell textbook-viz parallel-model-viz">
      <div class="viz-toolbar">
        <strong>Shared memory · Scheduling · Hybrid placement</strong>
        <div class="viz-controls">
          <button class="viz-btn ${initial === "threads" ? "active" : ""}" data-mode="threads">Threads</button>
          <button class="viz-btn ${initial === "schedule" ? "active" : ""}" data-mode="schedule">Schedule</button>
          <button class="viz-btn ${initial === "hybrid" ? "active" : ""}" data-mode="hybrid">Hybrid</button>
        </div>
      </div>
      <div class="viz-layout">
        <div class="parallel-stage" data-parallel-stage></div>
        <aside class="viz-explain" aria-live="polite">
          <h3 data-viz-title></h3>
          <p data-viz-body></p>
          <dl data-viz-rows></dl>
          <div class="viz-note" data-viz-note></div>
        </aside>
      </div>
    </div>`;

  const controls = host.querySelector(".viz-controls");
  const stage = host.querySelector("[data-parallel-stage]");
  let mode = initial;

  const render = () => {
    setDetails(host, details[mode]);
    activateButton(controls, "[data-mode]", mode);
    stage.innerHTML = mode === "threads" ? threadsMarkup() : mode === "schedule" ? scheduleMarkup() : hybridMarkup();
  };

  const click = event => {
    const button = event.target.closest("[data-mode]");
    if (!button) return;
    mode = button.dataset.mode;
    render();
  };
  controls.addEventListener("click", click);
  render();
  return () => controls.removeEventListener("click", click);
}

function threadsMarkup() {
  return `
    <div class="pm-process">
      <div class="pm-heading"><strong>Process address space</strong><span>shared by all threads</span></div>
      <div class="pm-shared">
        <strong>Shared data</strong>
        <span>heap · global variables · file descriptors</span>
      </div>
      <div class="pm-thread-grid">
        ${[0,1,2,3].map(i => `<div class="pm-thread"><b>Thread ${i}</b><span>private stack</span><span>registers</span></div>`).join("")}
      </div>
      <div class="pm-sync-row">
        <span>critical / atomic</span><span>reduction</span><span>barrier</span>
      </div>
    </div>`;
}

function scheduleMarkup() {
  const staticRows = [
    ["T0", 82, 14], ["T1", 58, 38], ["T2", 90, 6], ["T3", 45, 51]
  ];
  const dynamicRows = [
    ["T0", 78, 8], ["T1", 74, 12], ["T2", 82, 4], ["T3", 76, 10]
  ];
  const panel = (title, rows, note) => `
    <section class="pm-schedule-panel">
      <header><strong>${title}</strong><span>${note}</span></header>
      <div class="pm-timeline">
        ${rows.map(([name,work,idle]) => `<div class="pm-lane"><b>${name}</b><div class="pm-track"><i style="width:${work}%"></i><em style="width:${idle}%"></em></div></div>`).join("")}
      </div>
      <div class="pm-legend"><span><i class="work"></i> useful work</span><span><i class="idle"></i> barrier wait / overhead</span></div>
    </section>`;
  return `<div class="pm-schedule-grid">${panel("Static schedule", staticRows, "fixed chunks")}${panel("Dynamic schedule", dynamicRows, "runtime work queue")}</div>`;
}

function hybridMarkup() {
  const node = n => `
    <section class="pm-node">
      <header><strong>Compute Node ${n}</strong><span>2 NUMA domains</span></header>
      <div class="pm-numa-grid">
        ${[0,1].map(d => `<div class="pm-numa"><b>NUMA ${d}</b><div class="pm-rank">MPI rank ${n*2+d}</div><div class="pm-threads">${[0,1,2,3].map(t=>`<span>T${t}</span>`).join("")}</div><small>local DRAM</small></div>`).join("")}
      </div>
    </section>`;
  return `
    <div class="pm-hybrid">
      ${node(0)}
      <div class="pm-fabric"><span>MPI fabric</span><strong>rank ↔ rank</strong></div>
      ${node(1)}
    </div>`;
}
