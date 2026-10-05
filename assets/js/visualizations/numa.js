import { css, roundRect, label, box, line, arrow, createLoop, viewerShell, setDetails, activateButton } from "./canvas-utils.js";

const details = {
  local: {
    title: "Local memory access는 같은 NUMA node 안의 짧은 경로다",
    body: "Thread가 실행되는 NUMA node와 page가 배치된 memory node가 같으면 local memory controller를 통해 접근한다. 일반적으로 remote path보다 짧다.",
    rows: [["CPU", "NUMA 0의 Core에서 thread 실행"], ["Page", "NUMA 0의 DRAM에 배치"], ["확인", "numactl --hardware + taskset/numactl -s"]],
    note: "NUMA locality는 CPU affinity와 memory placement를 함께 맞추는 문제다."
  },
  remote: {
    title: "Remote memory access는 socket interconnect를 추가로 지난다",
    body: "Thread가 NUMA 0에서 실행되지만 page가 NUMA 1 DRAM에 있으면 local controller만으로 끝나지 않고 inter-socket path를 거쳐야 한다.",
    rows: [["추가 경로", "source CPU → local controller → interconnect → remote controller → DRAM"], ["영향", "latency 증가와 inter-socket bandwidth 사용 가능"], ["주의", "실제 비용은 CPU와 topology에 따라 다름"]],
    note: "고정된 'remote=몇 배' 숫자를 일반화하지 않고 실측한다."
  },
  firsttouch: {
    title: "First-touch는 초기화 위치와 page placement를 연결한다",
    body: "Linux의 일반적인 NUMA 배치에서는 page가 처음 실제로 쓰이는 CPU locality가 physical page placement에 영향을 줄 수 있다. 병렬 초기화는 계산 thread와 page locality를 맞추는 대표적인 방법이다.",
    rows: [["Serial init", "한 thread가 전체 배열을 touch해 한 node에 page가 몰릴 수 있음"], ["Parallel init", "각 thread가 담당 영역을 먼저 touch해 locality를 분산"], ["예외", "allocator·membind·interleave·cgroup policy가 동작을 바꿀 수 있음"]],
    note: "CPU binding만 고정하고 page placement를 확인하지 않으면 locality 문제를 놓칠 수 있다."
  }
};

export function mountNuma(host) {
  const { canvas, controls } = viewerShell(host, "NUMA locality와 memory placement",
    `<button class="viz-btn active" data-mode="local">Local</button>
     <button class="viz-btn" data-mode="remote">Remote</button>
     <button class="viz-btn" data-mode="firsttouch">First-touch</button>`, details.local);
  let mode = "local";

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
    if (w < 620) drawNarrow(ctx, w, h, mode);
    else drawWide(ctx, w, h, mode);
  });

  return () => { stop(); controls.removeEventListener("click", click); };
}

function drawWide(ctx, w, h, mode) {
  const pad = 24;
  const gap = 70;
  const nodeW = (w - pad * 2 - gap) / 2;
  const nodeH = Math.min(340, h - 96);
  const top = 48;
  const left = { x: pad, y: top, w: nodeW, h: nodeH };
  const right = { x: pad + nodeW + gap, y: top, w: nodeW, h: nodeH };
  drawNode(ctx, left, 0, mode === "local" || mode === "remote" || mode === "firsttouch");
  drawNode(ctx, right, 1, mode === "firsttouch");

  const interY = top + nodeH * .58;
  line(ctx, left.x + left.w + 8, interY, right.x - 8, interY, css("--warning"), 3);
  roundRect(ctx, w / 2 - 54, interY - 18, 108, 36, 7, css("--viewer"), css("--viewer-line"));
  label(ctx, "Interconnect", w / 2, interY, { size: 10, color: css("--warning") });

  const source = coreCenter(left, 0);
  const leftMc = memoryController(left);
  const rightMc = memoryController(right);
  const leftDram = dramCenter(left);
  const rightDram = dramCenter(right);

  if (mode === "local") {
    line(ctx, source.x, source.y + 16, source.x, leftMc.y, css("--accent-2"), 3);
    arrow(ctx, source.x, leftMc.y, leftDram.x, leftDram.y - 22, css("--accent-2"), 3);
    label(ctx, "LOCAL", left.x + left.w - 42, left.y + 24, { size: 10, color: css("--accent-2") });
  } else if (mode === "remote") {
    const edgeL = left.x + left.w;
    const edgeR = right.x;
    line(ctx, source.x, source.y + 16, source.x, leftMc.y, css("--warning"), 3);
    line(ctx, source.x, leftMc.y, edgeL, leftMc.y, css("--warning"), 3);
    line(ctx, edgeL, leftMc.y, edgeL, interY, css("--warning"), 3);
    line(ctx, edgeL, interY, edgeR, interY, css("--warning"), 3);
    line(ctx, edgeR, interY, edgeR, rightMc.y, css("--warning"), 3);
    line(ctx, edgeR, rightMc.y, rightMc.x, rightMc.y, css("--warning"), 3);
    arrow(ctx, rightMc.x, rightMc.y, rightDram.x, rightDram.y - 22, css("--warning"), 3);
    label(ctx, "REMOTE", right.x + right.w - 48, right.y + 24, { size: 10, color: css("--warning") });
  } else {
    label(ctx, "Thread 0 first writes its region", left.x + left.w / 2, left.y + nodeH - 16, { size: 10, color: css("--accent"), maxWidth: left.w - 26 });
    label(ctx, "Thread 1 first writes its region", right.x + right.w / 2, right.y + nodeH - 16, { size: 10, color: css("--accent"), maxWidth: right.w - 26 });
    line(ctx, source.x, source.y + 16, source.x, leftDram.y - 22, css("--accent-2"), 2.5);
    const srcR = coreCenter(right, 0);
    line(ctx, srcR.x, srcR.y + 16, srcR.x, rightDram.y - 22, css("--accent-2"), 2.5);
  }
}

function drawNarrow(ctx, w, h, mode) {
  const pad = 26;
  const nodeW = w - pad * 2;
  const nodeH = Math.min(170, (h - 110) / 2);
  const top = 28;
  const gap = 54;
  const first = { x: pad, y: top, w: nodeW, h: nodeH };
  const second = { x: pad, y: top + nodeH + gap, w: nodeW, h: nodeH };
  drawNodeCompact(ctx, first, 0, true);
  drawNodeCompact(ctx, second, 1, mode === "firsttouch");

  const interX = w / 2;
  const y1 = first.y + first.h + 7;
  const y2 = second.y - 7;
  line(ctx, interX, y1, interX, y2, css("--warning"), 3);
  roundRect(ctx, interX - 50, (y1 + y2) / 2 - 15, 100, 30, 7, css("--viewer"), css("--viewer-line"));
  label(ctx, "Interconnect", interX, (y1 + y2) / 2, { size: 9.5, color: css("--warning") });

  if (mode === "local") {
    line(ctx, first.x + 56, first.y + 62, first.x + 56, first.y + first.h - 40, css("--accent-2"), 3);
    arrow(ctx, first.x + 56, first.y + first.h - 40, first.x + first.w / 2, first.y + first.h - 26, css("--accent-2"), 3);
  } else if (mode === "remote") {
    const sx = first.x + 56;
    const startY = first.y + 62;
    line(ctx, sx, startY, sx, first.y + first.h - 30, css("--warning"), 3);
    line(ctx, sx, first.y + first.h - 30, interX, first.y + first.h - 30, css("--warning"), 3);
    line(ctx, interX, first.y + first.h - 30, interX, second.y + 30, css("--warning"), 3);
    line(ctx, interX, second.y + 30, second.x + second.w / 2, second.y + 30, css("--warning"), 3);
    arrow(ctx, second.x + second.w / 2, second.y + 30, second.x + second.w / 2, second.y + second.h - 28, css("--warning"), 3);
  } else {
    label(ctx, "first write → local page", first.x + first.w - 16, first.y + 24, { align: "right", size: 9.5, color: css("--accent") });
    label(ctx, "first write → local page", second.x + second.w - 16, second.y + 24, { align: "right", size: 9.5, color: css("--accent") });
  }
}

function drawNode(ctx, node, index, highlight) {
  roundRect(ctx, node.x, node.y, node.w, node.h, 10, css("--viewer-side"), highlight ? css("--accent") : css("--viewer-line"));
  label(ctx, `NUMA ${index}`, node.x + 14, node.y + 18, { align: "left", size: 12, color: highlight ? css("--accent") : css("--viewer-muted") });

  const coreGap = 7;
  const coreW = (node.w - 28 - coreGap * 3) / 4;
  const coreY = node.y + 48;
  for (let c = 0; c < 4; c++) box(ctx, node.x + 14 + c * (coreW + coreGap), coreY, coreW, 38, `C${index * 4 + c}`, { accent: index === 0 && c === 0, size: 10 });
  box(ctx, node.x + 28, node.y + 116, node.w - 56, 34, "Memory controller", { size: 10 });
  box(ctx, node.x + 24, node.y + node.h - 76, node.w - 48, 48, `DRAM ${index}`, { size: 11 });
}

function drawNodeCompact(ctx, node, index, highlight) {
  roundRect(ctx, node.x, node.y, node.w, node.h, 10, css("--viewer-side"), highlight ? css("--accent") : css("--viewer-line"));
  label(ctx, `NUMA ${index}`, node.x + 14, node.y + 18, { align: "left", size: 11, color: highlight ? css("--accent") : css("--viewer-muted") });
  const coreW = Math.min(52, (node.w - 50) / 4);
  for (let c = 0; c < 4; c++) box(ctx, node.x + 14 + c * (coreW + 5), node.y + 42, coreW, 34, `C${index * 4 + c}`, { accent: index === 0 && c === 0, size: 9 });
  box(ctx, node.x + node.w * .55, node.y + 88, node.w * .35, 30, "Memory ctl", { size: 9 });
  box(ctx, node.x + 18, node.y + node.h - 42, node.w - 36, 28, `DRAM ${index}`, { size: 10 });
}

function coreCenter(node, core) {
  const coreGap = 7;
  const coreW = (node.w - 28 - coreGap * 3) / 4;
  return { x: node.x + 14 + core * (coreW + coreGap) + coreW / 2, y: node.y + 48 + 19 };
}

function memoryController(node) {
  return { x: node.x + node.w / 2, y: node.y + 133 };
}

function dramCenter(node) {
  return { x: node.x + node.w / 2, y: node.y + node.h - 52 };
}
