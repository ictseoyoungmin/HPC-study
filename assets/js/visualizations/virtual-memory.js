import { css, roundRect, label, box, line, arrow, createLoop, viewerShell, setDetails, activateButton } from "./canvas-utils.js";

const details = {
  translate: {
    title: "Virtual address와 physical frame은 page table로 연결된다",
    body: "프로세스는 연속적인 virtual address space를 보지만 physical frame은 DRAM의 여러 위치에 흩어질 수 있다. page table은 이 둘의 mapping과 permission을 관리한다.",
    rows: [["VmSize", "virtual address space와 mapping 규모에 가까운 관점"], ["RSS", "현재 physical memory에 resident한 양에 가까운 관점"], ["핵심", "virtual 크기와 DRAM 사용량을 같은 값으로 보지 않음"]],
    note: "그림의 VPN/PFN 번호는 개념 예시다."
  },
  minor: {
    title: "Minor fault는 storage I/O 없이 해결될 수 있다",
    body: "필요한 page data가 이미 memory에 있지만 현재 process의 mapping이 준비되지 않은 경우처럼 kernel이 page table을 갱신해 해결할 수 있는 fault다.",
    rows: [["예", "이미 cache된 file page mapping, copy-on-write 등"], ["비용", "major fault보다 작지만 매우 빈번하면 CPU overhead가 될 수 있음"], ["관찰", "minor fault 증가를 allocation·mapping pattern과 연결"]],
    note: "page fault라는 이름이 곧 disk access를 의미하지 않는다."
  },
  major: {
    title: "Major fault는 backing storage I/O가 개입할 수 있다",
    body: "필요한 page가 memory에 없어 storage에서 읽어와야 하면 I/O latency가 추가된다. application latency와 storage activity를 같은 시간축에서 확인해야 한다.",
    rows: [["경로", "storage → physical frame → page table → process"], ["관찰", "maj_flt, I/O wait, storage latency"], ["주의", "major fault 수만으로 storage 장애를 확정하지 않음"]],
    note: "workload access pattern과 page cache 상태를 함께 본다."
  },
  pressure: {
    title: "Memory pressure는 reclaim → swap → OOM의 후보 경로를 만든다",
    body: "available memory가 줄면 kernel은 reclaim을 수행하고 설정에 따라 swap을 사용할 수 있다. 그래도 allocation을 만족하지 못하거나 cgroup limit을 넘으면 OOM이 발생할 수 있다.",
    rows: [["Reclaim", "회수 가능한 page cache 등을 정리"], ["Swap", "anonymous page를 backing store로 내보내는 후보"], ["OOM", "system 또는 cgroup 범위에서 allocation 실패 처리"]],
    note: "free 하나보다 available, si/so, fault, I/O와 limit을 함께 본다."
  }
};

export function mountVirtualMemory(host) {
  const { canvas, controls } = viewerShell(host, "Virtual memory · Page fault · OOM",
    `<button class="viz-btn active" data-mode="translate">Translate</button>
     <button class="viz-btn" data-mode="minor">Minor fault</button>
     <button class="viz-btn" data-mode="major">Major fault</button>
     <button class="viz-btn" data-mode="pressure">Pressure / OOM</button>`, details.translate);
  let mode = "translate";

  const click = event => {
    const button = event.target.closest("[data-mode]");
    if (!button) return;
    mode = button.dataset.mode;
    activateButton(controls, "[data-mode]", mode);
    setDetails(host, details[mode]);
  };
  controls.addEventListener("click", click);

  const stop = createLoop(canvas, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    if (mode === "pressure") drawPressure(ctx, w, h);
    else drawMapping(ctx, w, h, mode);
  });

  return () => { stop(); controls.removeEventListener("click", click); };
}

function drawMapping(ctx, w, h, mode) {
  const narrow = w < 620;
  if (narrow) return drawMappingNarrow(ctx, w, h, mode);

  const pad = 28;
  const colGap = 40;
  const colW = (w - pad * 2 - colGap * 2) / 3;
  const x = [pad, pad + colW + colGap, pad + (colW + colGap) * 2];
  const top = 54;
  const panelH = Math.min(300, h - 130);
  const titles = ["Virtual pages", "Page table", "Physical frames"];

  x.forEach((cx, i) => {
    roundRect(ctx, cx, top, colW, panelH, 9, css("--viewer-side"), css("--viewer-line"));
    label(ctx, titles[i], cx + colW / 2, top + 20, { size: 11, color: css("--viewer-muted"), maxWidth: colW - 14 });
  });

  const rows = [0, 1, 2];
  const rowY = rows.map(i => top + 62 + i * 70);
  const pfns = [5, 1, 7];
  rows.forEach((n, i) => {
    box(ctx, x[0] + 14, rowY[i], colW - 28, 38, `VPN ${n}`, { accent: i === 1, size: 11 });
    box(ctx, x[1] + 14, rowY[i], colW - 28, 38, mode === "minor" && i === 1 ? "mapping missing" : `entry ${n}`, { accent: mode === "minor" && i === 1, size: 10 });
    box(ctx, x[2] + 14, rowY[i], colW - 28, 38, `PFN ${pfns[i]}`, { accent: i === 1 && mode !== "major", size: 11 });
  });

  const cy = rowY[1] + 19;
  const a = x[0] + colW;
  const b = x[1];
  const c = x[1] + colW;
  const d = x[2];
  line(ctx, a + 6, cy, b - 6, cy, css("--accent"), 2);
  line(ctx, c + 6, cy, d - 6, cy, mode === "major" ? css("--warning") : css("--accent"), 2);

  if (mode === "minor") {
    label(ctx, "kernel updates mapping", x[1] + colW / 2, top + panelH - 28, { size: 10, color: css("--accent") });
  } else if (mode === "major") {
    const storeW = Math.min(190, colW + 30);
    const storeX = x[2] + colW / 2 - storeW / 2;
    const storeY = top + panelH + 24;
    box(ctx, storeX, storeY, storeW, 42, "Backing storage", { accent: true, size: 11 });
    arrow(ctx, x[2] + colW / 2, storeY, x[2] + colW / 2, rowY[1] + 38, css("--warning"), 2);
  } else {
    label(ctx, "same virtual order ≠ same physical order", w / 2, top + panelH + 34, { size: 11, color: css("--viewer-muted"), maxWidth: w - 50 });
  }
}

function drawMappingNarrow(ctx, w, h, mode) {
  const pad = 28;
  const bw = w - pad * 2;
  const bh = 52;
  const x = pad;
  const y1 = 48;
  const y2 = 156;
  const y3 = 264;
  box(ctx, x, y1, bw, bh, "Virtual page · VPN 1", { accent: true, size: 12 });
  box(ctx, x, y2, bw, bh, mode === "minor" ? "Page-table mapping missing" : "Page-table entry", { accent: mode === "minor", size: 11 });
  box(ctx, x, y3, bw, bh, "Physical frame · PFN 1", { accent: mode === "translate", size: 12 });
  line(ctx, w / 2, y1 + bh, w / 2, y2, css("--accent"), 2);
  line(ctx, w / 2, y2 + bh, w / 2, y3, mode === "major" ? css("--warning") : css("--accent"), 2);

  if (mode === "major") {
    const sy = h - 72;
    box(ctx, x + bw * .15, sy, bw * .70, 42, "Backing storage", { accent: true, size: 11 });
    arrow(ctx, w / 2, sy, w / 2, y3 + bh, css("--warning"), 2);
  } else {
    label(ctx, mode === "minor" ? "RAM에 page가 있고 mapping을 준비" : "translation path", w / 2, h - 34, { size: 11, color: css("--viewer-muted"), maxWidth: w - 44 });
  }
}

function drawPressure(ctx, w, h) {
  const narrow = w < 560;
  const bw = Math.min(360, w - 56);
  const x = (w - bw) / 2;
  const top = 42;
  const boxH = 48;
  const gap = 24;
  const items = [
    ["Application working set grows", true],
    ["Available memory decreases", false],
    ["Reclaim page cache", false]
  ];

  items.forEach(([name, accent], i) => {
    const y = top + i * (boxH + gap);
    box(ctx, x, y, bw, boxH, name, { accent, size: narrow ? 10 : 11 });
    if (i < items.length - 1) line(ctx, w / 2, y + boxH, w / 2, y + boxH + gap, css("--viewer-line"), 2);
  });

  const branchY = top + items.length * (boxH + gap) + 4;
  const childW = narrow ? bw : (bw - 18) / 2;
  if (narrow) {
    box(ctx, x, branchY, childW, 44, "Swap activity", { size: 11 });
    line(ctx, w / 2, top + 2 * (boxH + gap) + boxH, w / 2, branchY, css("--warning"), 2);
    box(ctx, x, branchY + 70, childW, 44, "cgroup / system OOM", { accent: true, size: 11 });
    line(ctx, w / 2, branchY + 44, w / 2, branchY + 70, css("--warning"), 2);
  } else {
    const left = x;
    const right = x + childW + 18;
    box(ctx, left, branchY, childW, 46, "Swap activity", { size: 11 });
    box(ctx, right, branchY, childW, 46, "cgroup / system OOM", { accent: true, size: 11 });
    const parentY = top + 2 * (boxH + gap) + boxH;
    line(ctx, w / 2, parentY, w / 2, branchY - 12, css("--warning"), 2);
    line(ctx, left + childW / 2, branchY - 12, right + childW / 2, branchY - 12, css("--warning"), 2);
    line(ctx, left + childW / 2, branchY - 12, left + childW / 2, branchY, css("--warning"), 2);
    line(ctx, right + childW / 2, branchY - 12, right + childW / 2, branchY, css("--warning"), 2);
  }

  label(ctx, "실제 경로는 workload·limit·kernel policy에 따라 달라진다", w / 2, h - 24, { size: 10, color: css("--viewer-muted"), maxWidth: w - 40 });
}
