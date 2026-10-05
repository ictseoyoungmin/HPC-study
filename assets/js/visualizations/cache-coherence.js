import { css, roundRect, label, box, line, createLoop, viewerShell, setDetails, activateButton } from "./canvas-utils.js";

const details = {
  hierarchy: {
    title: "Cache hierarchy는 latency·capacity·sharing 범위를 함께 본다",
    body: "Core에 가까운 cache는 작고 빠르며 바깥 계층으로 갈수록 용량이 커지고 접근 비용이 증가한다. 정확한 크기와 공유 범위는 CPU 세대에 따라 다르다.",
    rows: [["L1 / L2", "대개 Core에 가까운 private 또는 소수 Core 공유 cache"], ["LLC", "여러 Core가 공유할 수 있는 last-level cache"], ["DRAM", "cache miss가 더 바깥 memory path로 진행하는 대상"]],
    note: "lscpu --caches와 sysfs의 shared_cpu_list로 실제 platform을 확인한다."
  },
  coherence: {
    title: "Coherence는 cache line의 최신 값과 write ownership을 관리한다",
    body: "두 Core가 같은 line을 읽고 쓸 때 hardware는 최신 사본과 쓰기 권한을 추적한다. 한 Core가 write ownership을 얻으면 다른 Core의 copy가 invalidation될 수 있다.",
    rows: [["단위", "개별 변수보다 cache line 단위"], ["비용", "write ownership 이동과 invalidation traffic"], ["오해 금지", "coherence는 application synchronization을 대신하지 않음"]],
    note: "MESI/MOESI 같은 정확한 state 이름보다 line ownership이 이동한다는 개념을 먼저 이해한다."
  },
  false: {
    title: "False sharing은 서로 다른 변수도 같은 line이면 발생할 수 있다",
    body: "Thread A와 B가 논리적으로 다른 변수를 수정해도 두 변수가 같은 cache line에 있으면 line 전체의 write ownership이 Core 사이를 왕복할 수 있다.",
    rows: [["증상", "thread 수 증가 후 scaling이 갑자기 악화"], ["원인 후보", "인접 counter/struct field가 같은 line을 공유"], ["개선 후보", "padding, per-thread buffer, data layout 변경"]],
    note: "false sharing은 data race가 없어도 발생할 수 있다."
  }
};

export function mountCacheCoherence(host) {
  const { canvas, controls } = viewerShell(host, "Cache · Coherence · False sharing",
    `<button class="viz-btn active" data-mode="hierarchy">Hierarchy</button>
     <button class="viz-btn" data-mode="coherence">Coherence</button>
     <button class="viz-btn" data-mode="false">False sharing</button>`, details.hierarchy);
  let mode = "hierarchy";

  const click = event => {
    const button = event.target.closest("[data-mode]");
    if (!button) return;
    mode = button.dataset.mode;
    activateButton(controls, "[data-mode]", mode);
    setDetails(host, details[mode]);
  };
  controls.addEventListener("click", click);

  const stop = createLoop(canvas, (ctx, w, h, t) => {
    ctx.clearRect(0, 0, w, h);
    if (mode === "hierarchy") drawHierarchy(ctx, w, h);
    else if (mode === "coherence") drawCoherence(ctx, w, h, t);
    else drawFalseSharing(ctx, w, h, t);
  });

  return () => { stop(); controls.removeEventListener("click", click); };
}

function drawHierarchy(ctx, w, h) {
  const cx = w / 2;
  const maxW = Math.min(430, w - 56);
  const items = [
    ["Core", .42, true],
    ["L1", .52, false],
    ["L2", .64, false],
    ["Shared LLC", .80, false],
    ["DRAM", 1.0, false]
  ];
  const startY = 54;
  const gap = Math.min(64, (h - 110) / items.length);

  items.forEach(([name, scale, accent], i) => {
    const bw = maxW * scale;
    const bh = 40;
    const y = startY + i * gap;
    box(ctx, cx - bw / 2, y, bw, bh, name, { accent, size: 12 });
    if (i < items.length - 1) {
      line(ctx, cx, y + bh, cx, y + gap, css("--viewer-line"), 1.5);
    }
  });

  label(ctx, "가까움 · 작음 · 빠름", cx, 26, { size: 11, color: css("--viewer-muted") });
  label(ctx, "멀어짐 · 용량 증가 · latency 증가", cx, h - 24, { size: 11, color: css("--viewer-muted"), maxWidth: w - 40 });
}

function drawCoherence(ctx, w, h, t) {
  const narrow = w < 620;
  if (narrow) return drawCoherenceNarrow(ctx, w, h, t);

  const cardW = Math.min(190, (w - 150) / 2);
  const cardH = 150;
  const leftX = 34;
  const rightX = w - 34 - cardW;
  const top = 92;
  drawCoreCard(ctx, leftX, top, cardW, cardH, "Core 0", Math.floor(t * .55) % 2 === 0);
  drawCoreCard(ctx, rightX, top, cardW, cardH, "Core 1", Math.floor(t * .55) % 2 !== 0);

  const busX1 = leftX + cardW + 18;
  const busX2 = rightX - 18;
  const busY = top + cardH / 2;
  line(ctx, busX1, busY, busX2, busY, css("--warning"), 3);
  roundRect(ctx, w / 2 - 66, busY - 19, 132, 38, 7, css("--viewer"), css("--viewer-line"));
  label(ctx, "Coherence fabric", w / 2, busY, { size: 11, color: css("--viewer-muted") });

  const ownerLeft = Math.floor(t * .55) % 2 === 0;
  const ownerX = ownerLeft ? leftX + cardW / 2 : rightX + cardW / 2;
  label(ctx, "write owner", ownerX, top - 22, { size: 11, color: css("--accent") });
  label(ctx, "ownership 이동", w / 2, busY + 38, { size: 11, color: css("--warning") });
}

function drawCoherenceNarrow(ctx, w, h, t) {
  const cardW = Math.min(260, w - 70);
  const cardH = 104;
  const x = (w - cardW) / 2;
  const top1 = 42;
  const top2 = h - cardH - 42;
  const ownerLeft = Math.floor(t * .55) % 2 === 0;
  drawCoreCard(ctx, x, top1, cardW, cardH, "Core 0", ownerLeft);
  drawCoreCard(ctx, x, top2, cardW, cardH, "Core 1", !ownerLeft);

  const y1 = top1 + cardH + 12;
  const y2 = top2 - 12;
  line(ctx, w / 2, y1, w / 2, y2, css("--warning"), 3);
  roundRect(ctx, w / 2 - 64, (y1 + y2) / 2 - 18, 128, 36, 7, css("--viewer"), css("--viewer-line"));
  label(ctx, "Coherence fabric", w / 2, (y1 + y2) / 2, { size: 10, color: css("--viewer-muted") });
}

function drawCoreCard(ctx, x, y, w, h, title, owner) {
  roundRect(ctx, x, y, w, h, 9, css("--viewer-side"), owner ? css("--accent") : css("--viewer-line"));
  label(ctx, title, x + 14, y + 19, { align: "left", size: 12, color: owner ? css("--accent") : css("--viewer-text") });
  box(ctx, x + 14, y + 44, w - 28, 42, "Private cache", { accent: owner, size: 11 });
  label(ctx, owner ? "M / owner" : "I / shared", x + w / 2, y + h - 22, { size: 10, color: owner ? css("--accent") : css("--viewer-muted") });
}

function drawFalseSharing(ctx, w, h, t) {
  const narrow = w < 560;
  const lineW = Math.min(430, w - 52);
  const x = (w - lineW) / 2;
  const lineY = narrow ? h * .55 : h * .58;
  const segGap = 4;
  const segW = (lineW - segGap) / 2;

  label(ctx, "같은 cache line", w / 2, lineY - 74, { size: 12, color: css("--viewer-muted") });
  box(ctx, x, lineY, segW, 58, "A · Thread 0", { accent: true, size: 12 });
  box(ctx, x + segW + segGap, lineY, segW, 58, "B · Thread 1", { accent: true, size: 12 });

  const ownerLeft = Math.floor(t * .8) % 2 === 0;
  const badgeW = 126;
  const badgeX = ownerLeft ? x + segW / 2 - badgeW / 2 : x + segW + segGap + segW / 2 - badgeW / 2;
  roundRect(ctx, badgeX, lineY + 76, badgeW, 32, 16, css("--viz-accent-bg"), css("--warning"));
  label(ctx, ownerLeft ? "owner → Core 0" : "owner → Core 1", badgeX + badgeW / 2, lineY + 92, { size: 10, color: css("--warning") });

  const topY = narrow ? 58 : 72;
  const cardW = Math.min(180, (w - 76) / 2);
  const left = 28;
  const right = w - 28 - cardW;
  box(ctx, left, topY, cardW, 54, "Thread 0 writes A", { size: 11 });
  box(ctx, right, topY, cardW, 54, "Thread 1 writes B", { size: 11 });
  label(ctx, "변수는 달라도 ownership 단위는 line", w / 2, h - 24, { size: 11, color: css("--viewer-muted"), maxWidth: w - 36 });
}
