import { css, roundRect, label, line, createLoop, viewerShell, setDetails, activateButton } from "./canvas-utils.js";

const details = {
  latency: {
    title: "Latency curve: 한 점이 아니라 message-size sweep을 읽는다",
    body: "OSU latency 같은 microbenchmark는 message size를 바꾸며 지연 특성을 보여준다. 작은 message의 baseline, 크기가 커지며 생기는 slope와 knee, 반복 측정의 흔들림을 함께 보는 것이 핵심이다.",
    rows: [["x축", "Message size (B → KiB → MiB)"], ["y축", "상대 latency · 낮을수록 유리"], ["AA 관찰", "baseline · knee · topology 변화 · tail/outlier"]],
    note: "그림의 값은 교육용 정규화 모델이다. 실제 수치로 해석하지 말고 동일 조건의 실측 curve를 비교한다."
  },
  bandwidth: {
    title: "Bandwidth curve: 작은 message의 overhead와 saturation을 구분한다",
    body: "message가 작을 때는 고정 overhead가 지배하고, message가 커지면 effective bandwidth가 상승해 link·transport·memory 경로의 한계에 가까워진다. plateau가 어디서 형성되는지 비교한다.",
    rows: [["OSU", "MPI point-to-point bandwidth 경로 확인"], ["iperf3", "TCP/IP path의 achievable throughput 확인"], ["AA 관찰", "ramp-up · plateau · retransmit/drop · transport 차이"]],
    note: "iperf3와 MPI/RDMA benchmark는 서로 다른 data path를 측정할 수 있으므로 같은 지표로 취급하지 않는다."
  },
  topology: {
    title: "Topology comparison: same-node / same-switch / cross-switch를 분리한다",
    body: "같은 message-size sweep을 topology만 바꿔 반복하면 path length와 fabric placement 영향을 분리하기 쉽다. 동일 executable, rank placement, iteration, CPU binding 조건을 유지한다.",
    rows: [["Same node", "intra-node transport / shared-memory path 후보"], ["Same switch", "한 switch 안의 fabric path"], ["Cross switch", "추가 hop · uplink · congestion 후보"]],
    note: "곡선의 상대 순서는 개념 모델이다. 실제 cluster에서는 topology, transport, oversubscription, placement를 반드시 기록한다."
  },
  distribution: {
    title: "Median / p95: 평균 하나로 변동성을 숨기지 않는다",
    body: "같은 node pair와 message size를 여러 번 반복해 median과 p95를 함께 보면 안정적인 baseline과 tail latency를 분리할 수 있다. p95가 넓어지면 간헐적 congestion, jitter, competing traffic 같은 후보를 추가로 확인한다.",
    rows: [["Median", "typical run의 중심값"], ["p95", "느린 tail을 포함하는 상위 지연 경계"], ["AA 관찰", "반복 횟수 · topology · 시간대 · node pair · placement"]],
    note: "p95만으로 원인을 확정하지 않는다. 같은 구간의 NIC/fabric/application evidence와 교차검증한다."
  }
};

const messageLabels = ["8 B", "64 B", "1 KiB", "8 KiB", "64 KiB", "1 MiB", "8 MiB"];
const latencyCurve = [1.00, 1.02, 1.06, 1.16, 1.48, 2.65, 5.10];
const bandwidthCurve = [3, 8, 22, 48, 73, 91, 97];
const topologyCurves = [
  { name: "Same node", color: "--accent-2", values: [0.48, 0.50, 0.54, 0.63, 0.82, 1.55, 3.30] },
  { name: "Same switch", color: "--accent", values: [1.00, 1.02, 1.06, 1.16, 1.48, 2.65, 5.10] },
  { name: "Cross switch", color: "--warning", values: [1.34, 1.36, 1.43, 1.57, 1.98, 3.38, 6.10] }
];

export function mountNetworkBenchmark(host) {
  const buttons = `
    <button class="viz-btn active" data-mode="latency">Latency</button>
    <button class="viz-btn" data-mode="bandwidth">Bandwidth</button>
    <button class="viz-btn" data-mode="topology">Topology</button>
    <button class="viz-btn" data-mode="distribution">Median / p95</button>`;
  const { canvas, controls } = viewerShell(host, "Network benchmark curve reading", buttons, details.latency);
  let mode = "latency";

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
    if (mode === "latency") drawLatency(ctx, w, h);
    else if (mode === "bandwidth") drawBandwidth(ctx, w, h);
    else if (mode === "topology") drawTopology(ctx, w, h);
    else drawDistribution(ctx, w, h);
  });

  return () => {
    stop();
    controls.removeEventListener("click", click);
  };
}

function plotArea(w, h) {
  return {
    left: w < 560 ? 50 : 68,
    right: w - 22,
    top: 38,
    bottom: h - 58
  };
}

function drawAxes(ctx, w, h, yMax, yTicks, yFormat, yTitle) {
  const p = plotArea(w, h);
  line(ctx, p.left, p.top, p.left, p.bottom, css("--viewer-line"), 1.2);
  line(ctx, p.left, p.bottom, p.right, p.bottom, css("--viewer-line"), 1.2);

  for (let i = 0; i <= yTicks; i++) {
    const value = (yMax / yTicks) * i;
    const y = p.bottom - (p.bottom - p.top) * (value / yMax);
    line(ctx, p.left, y, p.right, y, css("--viewer-line"), 1, true);
    label(ctx, yFormat(value), p.left - 8, y, { size: 10, weight: 500, color: css("--viewer-muted"), align: "right" });
  }

  messageLabels.forEach((text, i) => {
    const x = xAt(p, i, messageLabels.length);
    label(ctx, text, x, p.bottom + 18, { size: w < 560 ? 9 : 10, weight: 500, color: css("--viewer-muted") });
  });

  label(ctx, "message size", (p.left + p.right) / 2, h - 18, { size: 10, weight: 600, color: css("--viewer-muted") });
  label(ctx, yTitle, p.left, 16, { size: 10, weight: 600, color: css("--viewer-muted"), align: "left" });
  return p;
}

function xAt(p, index, length) {
  return p.left + (p.right - p.left) * (index / Math.max(1, length - 1));
}

function yAt(p, value, yMax) {
  return p.bottom - (p.bottom - p.top) * (value / yMax);
}

function drawCurve(ctx, p, values, yMax, color, width = 2.5) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  values.forEach((value, i) => {
    const x = xAt(p, i, values.length);
    const y = yAt(p, value, yMax);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();
  values.forEach((value, i) => {
    const x = xAt(p, i, values.length);
    const y = yAt(p, value, yMax);
    ctx.beginPath();
    ctx.fillStyle = color;
    ctx.arc(x, y, 3.5, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.restore();
}

function drawLatency(ctx, w, h) {
  const p = drawAxes(ctx, w, h, 6, 3, value => value.toFixed(0), "relative latency");
  drawCurve(ctx, p, latencyCurve, 6, css("--accent"));
  const kneeX = xAt(p, 4, latencyCurve.length);
  const kneeY = yAt(p, latencyCurve[4], 6);
  line(ctx, kneeX, p.top, kneeX, p.bottom, css("--warning"), 1.2, true);
  label(ctx, "knee 후보", kneeX + 6, kneeY - 16, { size: 10, color: css("--warning"), align: "left" });
  metricBadge(ctx, p.right - 146, p.top + 8, 136, "OSU: size → latency");
}

function drawBandwidth(ctx, w, h) {
  const p = drawAxes(ctx, w, h, 100, 4, value => `${Math.round(value)}%`, "relative bandwidth");
  drawCurve(ctx, p, bandwidthCurve, 100, css("--accent-2"));
  line(ctx, p.left, yAt(p, 90, 100), p.right, yAt(p, 90, 100), css("--warning"), 1.2, true);
  label(ctx, "plateau / saturation 후보", p.right - 4, yAt(p, 90, 100) - 12, { size: 10, color: css("--warning"), align: "right" });
  metricBadge(ctx, p.right - 160, p.top + 8, 150, "OSU BW / iperf3 비교");
}

function drawTopology(ctx, w, h) {
  const p = drawAxes(ctx, w, h, 6.5, 3, value => value.toFixed(1), "relative latency");
  topologyCurves.forEach(curve => drawCurve(ctx, p, curve.values, 6.5, css(curve.color), 2.2));
  drawLegend(ctx, p);
}

function drawLegend(ctx, p) {
  const compact = (p.right - p.left) < 430;
  const startX = compact ? p.left + 8 : p.right - 260;
  const y = p.top + 8;
  topologyCurves.forEach((curve, i) => {
    const x = compact ? startX : startX + i * 88;
    const yy = compact ? y + i * 18 : y;
    line(ctx, x, yy, x + 18, yy, css(curve.color), 3);
    label(ctx, curve.name, x + 24, yy, { size: 9.5, weight: 600, color: css("--viewer-muted"), align: "left" });
  });
}

function drawDistribution(ctx, w, h) {
  const p = plotArea(w, h);
  const rows = [
    { name: "Same node", median: 0.72, p95: 0.92, color: "--accent-2" },
    { name: "Same switch", median: 1.00, p95: 1.28, color: "--accent" },
    { name: "Cross switch", median: 1.42, p95: 1.88, color: "--warning" }
  ];
  const max = 2.1;
  label(ctx, "illustrative repeated runs · fixed message size", p.left, p.top - 16, { size: 10, weight: 600, color: css("--viewer-muted"), align: "left" });
  const x0 = p.left + (w < 560 ? 76 : 112);
  const x1 = p.right;
  line(ctx, x0, p.bottom, x1, p.bottom, css("--viewer-line"), 1.2);
  [0, .5, 1, 1.5, 2].forEach(v => {
    const x = x0 + (x1 - x0) * (v / max);
    line(ctx, x, p.top, x, p.bottom, css("--viewer-line"), 1, true);
    label(ctx, v.toFixed(1), x, p.bottom + 16, { size: 9.5, weight: 500, color: css("--viewer-muted") });
  });
  label(ctx, "relative latency", (x0 + x1) / 2, h - 18, { size: 10, weight: 600, color: css("--viewer-muted") });

  const rowGap = (p.bottom - p.top) / rows.length;
  rows.forEach((row, i) => {
    const y = p.top + rowGap * (i + .55);
    label(ctx, row.name, x0 - 10, y, { size: 10.5, weight: 600, color: css("--viewer-text"), align: "right" });
    const mx = x0 + (x1 - x0) * (row.median / max);
    const px = x0 + (x1 - x0) * (row.p95 / max);
    line(ctx, x0, y, px, y, css(row.color), 8);
    ctx.beginPath();
    ctx.fillStyle = css("--viewer");
    ctx.strokeStyle = css(row.color);
    ctx.lineWidth = 2;
    ctx.arc(mx, y, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    line(ctx, px, y - 10, px, y + 10, css(row.color), 2);
    label(ctx, "median", mx, y - 15, { size: 8.5, weight: 500, color: css("--viewer-muted") });
    label(ctx, "p95", px, y - 15, { size: 8.5, weight: 500, color: css("--viewer-muted") });
  });
}

function metricBadge(ctx, x, y, w, text) {
  roundRect(ctx, x, y, w, 28, 6, css("--viz-node"), css("--viewer-line"));
  label(ctx, text, x + w / 2, y + 14, { size: 10, weight: 600, color: css("--viewer-muted"), maxWidth: w - 12 });
}
