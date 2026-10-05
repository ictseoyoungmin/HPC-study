import { css, box, line, arrow, particle, createLoop, viewerShell, setDetails, activateButton } from "./canvas-utils.js";

const details = {
  rankfiles: {
    title: "Rank-per-file: 데이터 경로보다 metadata가 먼저 커질 수 있다",
    body: "각 MPI rank가 자신의 checkpoint 파일을 만들면 구현은 단순하지만 rank 수와 checkpoint 횟수에 비례해 create/open/close/stat 같은 metadata operation과 파일 수가 증가한다.",
    rows: [["파일 모델", "N ranks → N files per checkpoint"], ["병목 후보", "metadata service · directory contention · file count"], ["AA 관찰", "파일 수, create latency, checkpoint 구간, metadata 지표"]],
    note: "총 바이트가 같아도 1개의 큰 파일과 수천 개의 작은 파일은 filesystem에 전혀 다른 부하를 만든다."
  },
  shared: {
    title: "Shared file · independent I/O: 파일 수는 줄지만 access pattern이 중요하다",
    body: "여러 rank가 하나의 shared file의 서로 다른 offset에 독립적으로 접근하면 파일 수와 일부 metadata 비용은 줄일 수 있다. 그러나 작은 비연속 request와 동시 접근은 lock, request fragmentation, storage target 사용 방식에 따라 비효율적일 수 있다.",
    rows: [["파일 모델", "N ranks → 1 shared file"], ["데이터 경로", "각 rank가 자신의 offset에 직접 I/O"], ["AA 관찰", "request size, offset pattern, synchronization, filesystem striping"]],
    note: "shared file 자체가 자동으로 collective I/O를 의미하지는 않는다."
  },
  collective: {
    title: "Collective MPI-IO: 작은 요청을 모아 더 큰 I/O로 재구성한다",
    body: "collective I/O에서는 rank들이 가진 분산된 request를 MPI-IO 계층이 함께 고려한다. 일부 rank가 aggregator 역할을 하며 데이터를 모아 비교적 큰 연속 I/O로 재구성할 수 있다.",
    rows: [["핵심", "communication + aggregation → larger storage requests"], ["기대 효과", "작은 비연속 I/O와 metadata/data-path overhead 감소 가능"], ["비용", "rank 간 데이터 교환과 collective synchronization"]],
    note: "collective I/O가 항상 더 빠른 것은 아니다. access pattern, implementation, filesystem, process placement를 같은 조건에서 비교한다."
  },
  hdf5: {
    title: "Parallel HDF5 / NetCDF: 고수준 데이터 모델과 MPI-IO backend",
    body: "Parallel HDF5나 parallel NetCDF는 application에 dataset/variable 같은 고수준 데이터 모델을 제공하지만, 실제 parallel I/O가 동작하려면 parallel-enabled build와 MPI-IO backend, 호출 방식이 맞아야 한다.",
    rows: [["상위 계층", "Application → HDF5/NetCDF"], ["하위 계층", "MPI-IO → parallel filesystem"], ["AA 관찰", "linked library, parallel build, collective call 여부, file layout"]],
    note: "라이브러리가 설치되어 있다는 사실만으로 I/O가 자동 확장되는 것은 아니다."
  },
  staging: {
    title: "Data staging: compute와 persistent storage 사이에 단계를 둔다",
    body: "checkpoint를 곧바로 shared persistent filesystem에 쓰는 대신 node-local storage나 burst buffer 같은 중간 계층으로 먼저 기록하고 이후 이동하면 compute phase와 장기 저장 경로를 분리할 수 있다.",
    rows: [["앞단", "Compute → fast local/intermediate tier"], ["뒷단", "Stage-out → persistent shared storage"], ["주의", "capacity, durability, stage-out 완료 시점, failure semantics"]],
    note: "staging은 데이터 이동을 없애는 것이 아니라 시간과 경로를 재배치하는 전략이다."
  }
};

export function mountScientificIo(host) {
  const buttons = `
    <button class="viz-btn active" data-mode="rankfiles">Rank-per-file</button>
    <button class="viz-btn" data-mode="shared">Shared file</button>
    <button class="viz-btn" data-mode="collective">Collective MPI-IO</button>
    <button class="viz-btn" data-mode="hdf5">HDF5 / NetCDF</button>
    <button class="viz-btn" data-mode="staging">Staging</button>`;
  const { canvas, controls } = viewerShell(host, "Scientific I/O data path", buttons, details.rankfiles);
  let mode = "rankfiles";

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
    if (mode === "rankfiles") drawRankFiles(ctx, w, h, t);
    else if (mode === "shared") drawSharedFile(ctx, w, h, t);
    else if (mode === "collective") drawCollective(ctx, w, h, t);
    else if (mode === "hdf5") drawHdf5(ctx, w, h, t);
    else drawStaging(ctx, w, h, t);
  });

  return () => {
    stop();
    controls.removeEventListener("click", click);
  };
}

function rankLayout(w, h) {
  const compact = w < 600;
  const rankW = compact ? Math.min(86, (w - 56) / 4) : Math.min(110, (w - 100) / 4);
  const gap = compact ? 8 : 18;
  const total = rankW * 4 + gap * 3;
  const x0 = (w - total) / 2;
  const rankY = Math.max(34, h * .14);
  return { rankW, gap, x0, rankY };
}

function drawRanks(ctx, w, h) {
  const { rankW, gap, x0, rankY } = rankLayout(w, h);
  const centers = [];
  for (let i = 0; i < 4; i++) {
    const x = x0 + i * (rankW + gap);
    box(ctx, x, rankY, rankW, 42, `Rank ${i}`, { accent: true, size: 12 });
    centers.push({ x: x + rankW / 2, y: rankY + 42 });
  }
  return centers;
}

function drawRankFiles(ctx, w, h, t) {
  const ranks = drawRanks(ctx, w, h);
  const fileY = Math.min(h - 88, h * .60);
  ranks.forEach((rank, i) => {
    const fw = Math.max(54, Math.min(90, w / 7));
    box(ctx, rank.x - fw / 2, fileY, fw, 48, `chk.${i}`, { size: 11 });
    arrow(ctx, rank.x, rank.y + 4, rank.x, fileY - 3, css("--accent"), 2);
    particle(ctx, { x: rank.x, y: rank.y + 6 }, { x: rank.x, y: fileY - 4 }, (t * .35 + i * .17) % 1, css("--accent"));
  });
  const metaY = h - 28;
  line(ctx, 34, metaY, w - 34, metaY, css("--warning"), 3);
  caption(ctx, "파일 수와 create/open/close metadata operation이 rank 수와 함께 증가", w, h, metaY - 8);
}

function drawSharedFile(ctx, w, h, t) {
  const ranks = drawRanks(ctx, w, h);
  const fileW = Math.min(w - 72, 460);
  const fileX = (w - fileW) / 2;
  const fileY = Math.min(h - 104, h * .60);
  box(ctx, fileX, fileY, fileW, 54, "shared checkpoint file", { accent: false, size: 13 });
  const seg = fileW / 4;
  for (let i = 1; i < 4; i++) line(ctx, fileX + seg * i, fileY + 5, fileX + seg * i, fileY + 49, css("--viewer-line"), 1, true);
  ranks.forEach((rank, i) => {
    const target = { x: fileX + seg * (i + .5), y: fileY };
    arrow(ctx, rank.x, rank.y + 4, target.x, target.y - 3, css("--accent"), 1.8);
    particle(ctx, { x: rank.x, y: rank.y + 5 }, target, (t * .32 + i * .14) % 1, css("--accent"));
  });
  caption(ctx, "하나의 파일이어도 rank별 작은·비연속 request가 그대로 남을 수 있다", w, h);
}

function drawCollective(ctx, w, h, t) {
  const ranks = drawRanks(ctx, w, h);
  const compact = w < 600;
  const aggY = Math.min(h - 150, h * .48);
  const aggGap = compact ? 110 : 180;
  const aggs = [
    { x: w / 2 - aggGap / 2, y: aggY },
    { x: w / 2 + aggGap / 2, y: aggY }
  ];
  aggs.forEach((p, i) => box(ctx, p.x - 54, p.y, 108, 42, `Aggregator ${i}`, { accent: true, size: 11 }));
  ranks.forEach((rank, i) => {
    const agg = aggs[i < 2 ? 0 : 1];
    arrow(ctx, rank.x, rank.y + 4, agg.x, agg.y - 3, css("--viewer-line"), 1.5);
    particle(ctx, { x: rank.x, y: rank.y + 5 }, { x: agg.x, y: agg.y - 2 }, (t * .45 + i * .19) % 1, css("--viewer-muted"));
  });
  const fileW = Math.min(w - 72, 430);
  const fileX = (w - fileW) / 2;
  const fileY = h - 82;
  box(ctx, fileX, fileY, fileW, 48, "parallel filesystem · larger contiguous requests", { size: 11 });
  aggs.forEach((agg, i) => {
    const tx = fileX + fileW * (i ? .72 : .28);
    arrow(ctx, agg.x, agg.y + 45, tx, fileY - 3, css("--accent"), 2.5);
    particle(ctx, { x: agg.x, y: agg.y + 45 }, { x: tx, y: fileY - 3 }, (t * .28 + i * .4) % 1, css("--accent"));
  });
}

function drawHdf5(ctx, w, h, t) {
  const layers = [
    ["Application datasets / variables", .12],
    ["Parallel HDF5 / NetCDF", .32],
    ["MPI-IO", .52],
    ["Parallel filesystem", .72],
    ["Storage targets", .90]
  ];
  const bw = Math.min(w - 70, 400);
  const x = (w - bw) / 2;
  layers.forEach(([name, p], i) => {
    const y = Math.max(24, Math.min(h - 58, h * p - 20));
    box(ctx, x, y, bw, 40, name, { accent: i === 1 || i === 2, size: 12 });
    if (i < layers.length - 1) {
      const ny = Math.max(24, Math.min(h - 58, h * layers[i + 1][1] - 20));
      arrow(ctx, w / 2, y + 40, w / 2, ny - 3, css("--accent"), 1.8);
    }
  });
  const y0 = Math.max(44, h * .12 + 20);
  const y1 = Math.min(h - 58, h * .90 - 20);
  particle(ctx, { x: w / 2, y: y0 }, { x: w / 2, y: y1 }, (t * .22) % 1, css("--warning"));
}

function drawStaging(ctx, w, h, t) {
  const compact = w < 600;
  if (compact) {
    const bw = Math.min(w - 56, 320);
    const x = (w - bw) / 2;
    const ys = [h * .18, h * .46, h * .74];
    const names = ["Compute ranks", "Fast intermediate tier", "Persistent shared storage"];
    names.forEach((name, i) => box(ctx, x, ys[i] - 22, bw, 44, name, { accent: i === 1, size: 11 }));
    arrow(ctx, w / 2, ys[0] + 24, w / 2, ys[1] - 24, css("--accent"), 2.2);
    arrow(ctx, w / 2, ys[1] + 24, w / 2, ys[2] - 24, css("--warning"), 2.2);
    particle(ctx, { x: w / 2, y: ys[0] + 25 }, { x: w / 2, y: ys[1] - 25 }, (t * .4) % 1, css("--accent"));
    particle(ctx, { x: w / 2, y: ys[1] + 25 }, { x: w / 2, y: ys[2] - 25 }, (t * .18) % 1, css("--warning"));
  } else {
    const y = h * .45;
    const bw = Math.min(190, (w - 100) / 3);
    const xs = [w * .18, w * .50, w * .82];
    const names = ["Compute ranks", "Fast intermediate tier", "Persistent storage"];
    names.forEach((name, i) => box(ctx, xs[i] - bw / 2, y - 28, bw, 56, name, { accent: i === 1, size: 11 }));
    arrow(ctx, xs[0] + bw / 2 + 4, y, xs[1] - bw / 2 - 4, y, css("--accent"), 2.3);
    arrow(ctx, xs[1] + bw / 2 + 4, y, xs[2] - bw / 2 - 4, y, css("--warning"), 2.3);
    particle(ctx, { x: xs[0] + bw / 2 + 5, y }, { x: xs[1] - bw / 2 - 5, y }, (t * .4) % 1, css("--accent"));
    particle(ctx, { x: xs[1] + bw / 2 + 5, y }, { x: xs[2] - bw / 2 - 5, y }, (t * .18) % 1, css("--warning"));
    caption(ctx, "빠른 checkpoint 경로와 느린 stage-out 경로를 시간적으로 분리", w, h);
  }
}

function caption(ctx, text, w, h, y = h - 12) {
  ctx.save();
  ctx.fillStyle = css("--viewer-muted");
  ctx.font = "500 12px system-ui";
  ctx.textAlign = "center";
  ctx.textBaseline = "bottom";
  ctx.fillText(text, w / 2, y, Math.max(60, w - 28));
  ctx.restore();
}
