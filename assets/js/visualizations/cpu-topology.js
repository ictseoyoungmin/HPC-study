import { css, roundRect, label, box, line, createLoop, viewerShell, setDetails, activateButton } from "./canvas-utils.js";

const details = {
  topology: {
    title: "Socket → Core → Logical CPU",
    body: "Linux가 세는 CPU 번호는 scheduler가 사용할 logical CPU다. SMT가 켜져 있으면 한 physical Core가 둘 이상의 logical CPU를 노출할 수 있으므로 CPU 수와 Core 수를 분리해서 읽어야 한다.",
    rows: [
      ["Socket", "여러 Core, cache, memory controller를 포함하는 processor package 단위"],
      ["Core", "실제 명령을 실행하는 physical compute resource"],
      ["Logical CPU", "kernel scheduler가 task를 배치하는 hardware-thread 실행 문맥"]
    ],
    note: "lscpu -e=CPU,CORE,SOCKET,NODE로 같은 Core의 SMT sibling과 Socket 경계를 확인한다."
  },
  smt: {
    title: "SMT는 Core를 복제하지 않는다",
    body: "하나의 physical Core 안에 여러 hardware thread가 들어가고 일부 execution resource를 공유한다. workload가 이미 core 자원을 포화시키면 SMT의 이득이 작거나 역효과가 날 수 있다.",
    rows: [
      ["공유", "execution units, cache path 등 core 내부 자원의 일부"],
      ["장점 후보", "한 thread가 사용하지 못하는 pipeline slot을 다른 thread가 활용"],
      ["주의", "logical CPU 2개를 physical Core 2개로 계산하지 않음"]
    ],
    note: "benchmark에는 SMT 상태와 binding을 함께 기록한다."
  },
  binding: {
    title: "Thread placement와 topology를 함께 본다",
    body: "같은 thread 수라도 한 Socket에 밀집하는지 두 Socket에 분산하는지에 따라 cache와 memory path가 달라진다. 실제 affinity를 확인해야 성능 측정을 재현할 수 있다.",
    rows: [
      ["Close", "가까운 Core에 배치해 shared-cache locality를 활용하는 전략 후보"],
      ["Spread", "Socket/Core에 넓게 분산해 memory bandwidth를 분산하는 전략 후보"],
      ["확인", "taskset, OMP_PROC_BIND/OMP_PLACES, Slurm --cpu-bind"]
    ],
    note: "어떤 binding이 유리한지는 workload와 NUMA 구조에 따라 비교 측정한다."
  }
};

export function mountCpu(host) {
  const { canvas, controls } = viewerShell(host, "CPU topology와 SMT",
    `<button class="viz-btn active" data-view="topology">Topology</button>
     <button class="viz-btn" data-view="smt">SMT</button>
     <button class="viz-btn" data-view="binding">Binding</button>`, details.topology);
  let view = "topology";

  const click = event => {
    const button = event.target.closest("[data-view]");
    if (!button) return;
    view = button.dataset.view;
    activateButton(controls, "[data-view]", view);
    setDetails(host, details[view]);
  };
  controls.addEventListener("click", click);

  const stop = createLoop(canvas, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    if (view === "smt") drawSmt(ctx, w, h);
    else if (view === "binding") drawBinding(ctx, w, h);
    else drawTopology(ctx, w, h);
  });

  return () => { stop(); controls.removeEventListener("click", click); };
}

function drawTopology(ctx, w, h) {
  const narrow = w < 620;
  const pad = 24;
  const gap = narrow ? 24 : 34;
  const socketW = narrow ? w - pad * 2 : (w - pad * 2 - gap) / 2;
  const socketH = narrow ? Math.min(190, (h - pad * 2 - gap) / 2) : h - 78;
  const positions = narrow
    ? [{ x: pad, y: 22 }, { x: pad, y: 22 + socketH + gap }]
    : [{ x: pad, y: 38 }, { x: pad + socketW + gap, y: 38 }];

  positions.forEach((p, s) => drawSocket(ctx, p.x, p.y, socketW, socketH, s));

  if (narrow) {
    const x = w / 2;
    const y1 = positions[0].y + socketH;
    const y2 = positions[1].y;
    line(ctx, x, y1 + 5, x, y2 - 5, css("--warning"), 2, true);
    label(ctx, "Socket boundary", x + 10, (y1 + y2) / 2, { align: "left", size: 10, color: css("--warning") });
  } else {
    const x1 = positions[0].x + socketW;
    const x2 = positions[1].x;
    const y = positions[0].y + socketH * .58;
    line(ctx, x1 + 5, y, x2 - 5, y, css("--warning"), 2, true);
    label(ctx, "Socket boundary", w / 2, y - 14, { size: 10, color: css("--warning") });
  }
}

function drawSocket(ctx, x, y, w, h, socket) {
  roundRect(ctx, x, y, w, h, 10, css("--viewer-side"), css("--viewer-line"));
  label(ctx, `Socket ${socket}`, x + 14, y + 17, { align: "left", size: 12, color: css("--viewer-muted") });

  const innerX = x + 14;
  const innerW = w - 28;
  const coreGap = 7;
  const cols = 4;
  const coreW = (innerW - coreGap * 3) / 4;
  const coreY = y + 43;
  const coreH = Math.max(55, Math.min(72, h * .36));

  for (let c = 0; c < cols; c++) {
    const cx = innerX + c * (coreW + coreGap);
    roundRect(ctx, cx, coreY, coreW, coreH, 7, css("--viz-node"), css("--viewer-line"));
    label(ctx, `C${socket * 4 + c}`, cx + coreW / 2, coreY + 16, { size: 10, maxWidth: coreW - 8 });
    const cy = coreY + coreH - 17;
    [0.36, 0.64].forEach((p, i) => {
      ctx.beginPath();
      ctx.fillStyle = css(i ? "--accent-2" : "--accent");
      ctx.arc(cx + coreW * p, cy, Math.min(6, coreW * .10), 0, Math.PI * 2);
      ctx.fill();
    });
  }

  const sharedY = coreY + coreH + 12;
  box(ctx, innerX, sharedY, innerW, 30, "Shared LLC / memory controller", { size: 10 });
  const dramY = y + h - 34;
  box(ctx, innerX + innerW * .18, dramY, innerW * .64, 24, "Local DRAM", { size: 10 });
}

function drawSmt(ctx, w, h) {
  const boxW = Math.min(420, w - 64);
  const boxH = Math.min(260, h - 100);
  const x = (w - boxW) / 2;
  const y = Math.max(44, (h - boxH) / 2 - 10);
  roundRect(ctx, x, y, boxW, boxH, 12, css("--viewer-side"), css("--accent"));
  label(ctx, "Physical Core", x + 18, y + 22, { align: "left", size: 13, color: css("--accent") });

  box(ctx, x + 24, y + 52, boxW - 48, 54, "Shared execution resources", { size: 12 });
  const threadW = (boxW - 62) / 2;
  box(ctx, x + 24, y + 128, threadW, 74, "Logical CPU A", { accent: true, size: 12 });
  box(ctx, x + 38 + threadW, y + 128, threadW, 74, "Logical CPU B", { accent: true, size: 12 });
  line(ctx, x + 24 + threadW / 2, y + 128, x + boxW / 2, y + 106, css("--viewer-line"), 1.5);
  line(ctx, x + 38 + threadW + threadW / 2, y + 128, x + boxW / 2, y + 106, css("--viewer-line"), 1.5);
  label(ctx, "2 scheduler contexts · 1 physical Core", w / 2, y + boxH - 22, { size: 11, color: css("--viewer-muted"), maxWidth: boxW - 30 });
}

function drawBinding(ctx, w, h) {
  const narrow = w < 620;
  const pad = 26;
  const socketW = narrow ? w - pad * 2 : (w - pad * 2 - 26) / 2;
  const socketH = narrow ? 150 : 220;
  const positions = narrow
    ? [{ x: pad, y: 48 }, { x: pad, y: 48 + socketH + 22 }]
    : [{ x: pad, y: 86 }, { x: pad + socketW + 26, y: 86 }];

  label(ctx, "Example placement: spread across two sockets", w / 2, 28, { size: 12, color: css("--viewer-muted"), maxWidth: w - 40 });

  positions.forEach((p, s) => {
    roundRect(ctx, p.x, p.y, socketW, socketH, 10, css("--viewer-side"), css("--viewer-line"));
    label(ctx, `Socket ${s}`, p.x + 14, p.y + 18, { align: "left", size: 11, color: css("--viewer-muted") });
    const gap = 8;
    const coreW = (socketW - 28 - gap * 3) / 4;
    for (let c = 0; c < 4; c++) {
      const x = p.x + 14 + c * (coreW + gap);
      const y = p.y + 48;
      box(ctx, x, y, coreW, 56, `C${s * 4 + c}`, { accent: true, size: 11 });
      label(ctx, `T${s * 4 + c}`, x + coreW / 2, y + 39, { size: 9, color: css("--accent") });
    }
    box(ctx, p.x + 18, p.y + socketH - 38, socketW - 36, 24, "Local DRAM", { size: 10 });
  });
}
