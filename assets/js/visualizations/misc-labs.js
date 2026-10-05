import { css, roundRect, label, box, line, arrow, particle, createLoop, viewerShell, setDetails, activateButton } from "./canvas-utils.js";

export function mountRoofline(host) {
  host.innerHTML = `
    <div class="viz-shell">
      <div class="viz-toolbar"><strong>Roofline model</strong></div>
      <div class="scaling-controls">
        <label>Arithmetic intensity <output data-ai>4</output><input data-air type="range" min=".25" max="32" step=".25" value="4"></label>
        <label>Memory BW (GB/s) <output data-bw>200</output><input data-bwr type="range" min="50" max="500" step="10" value="200"></label>
        <label>Peak (GF/s) <output data-pk>2000</output><input data-pkr type="range" min="500" max="5000" step="100" value="2000"></label>
      </div>
      <div class="metric-grid">
        <div><span>Bound</span><strong data-bound></strong></div>
        <div><span>Ceiling</span><strong data-ceil></strong></div>
        <div><span>Ridge point</span><strong data-ridge></strong></div>
      </div>
    </div>`;
  const ai = host.querySelector("[data-air]"), bw = host.querySelector("[data-bwr]"), pk = host.querySelector("[data-pkr]");
  function update() {
    const A = +ai.value, B = +bw.value, P = +pk.value, perf = Math.min(P, A * B);
    host.querySelector("[data-ai]").value = A;
    host.querySelector("[data-bw]").value = B;
    host.querySelector("[data-pk]").value = P;
    host.querySelector("[data-bound]").textContent = A * B < P ? "Memory" : "Compute";
    host.querySelector("[data-ceil]").textContent = `${perf.toFixed(0)} GF/s`;
    host.querySelector("[data-ridge]").textContent = `${(P / B).toFixed(2)} FLOP/B`;
  }
  [ai, bw, pk].forEach(input => input.addEventListener("input", update)); update();
  return () => [ai, bw, pk].forEach(input => input.removeEventListener("input", update));
}

export function mountGpu(host) {
  const canvas = document.createElement("canvas");
  host.innerHTML = `<div class="viz-shell"><div class="viz-toolbar"><strong>GPU execution pipeline</strong></div><div class="canvas-stage textbook"></div></div>`;
  host.querySelector(".canvas-stage").appendChild(canvas);
  return createLoop(canvas, (ctx, w, h, t) => {
    ctx.clearRect(0, 0, w, h);
    const labels = ["CPU prep", "H2D", "GPU kernel", "D2H"], widths = [.20, .16, .48, .16];
    let x = 30; const avail = w - 60;
    labels.forEach((name, i) => { const ww = avail * widths[i] - 8; box(ctx, x, h / 2 - 38, ww, 76, name, { accent: i === 2 }); x += avail * widths[i]; });
    const phase = (t * .25) % 1, px = 30 + avail * phase;
    ctx.beginPath(); ctx.fillStyle = css("--warning"); ctx.arc(px, h / 2 + 58, 5, 0, Math.PI * 2); ctx.fill();
    label(ctx, "GPU utilization은 CPU 공급·전송·kernel·동기화를 포함한 전체 pipeline과 함께 해석한다.", w / 2, h - 24, { size: 12, color: css("--viewer-muted"), maxWidth: w - 30 });
  });
}

export function mountMemory(host) {
  const details = {
    cache: { title: "Cache hit", body: "필요한 데이터가 Core 가까운 cache에 있으면 가장 짧은 경로로 재사용된다.", rows: [["경로", "Core ↔ Cache"], ["핵심", "locality와 data reuse"]], note: "같은 데이터를 가까운 계층에서 반복 사용하는 것이 중요하다." },
    ram: { title: "Local RAM", body: "Cache에 없으면 Node의 주 메모리까지 접근한다.", rows: [["경로", "Core → Cache → RAM"], ["비용", "cache hit보다 긴 memory latency"]], note: "연속 접근과 blocking/tiling으로 memory traffic을 줄일 수 있다." },
    remote: { title: "Remote memory / node", body: "다른 NUMA node 또는 다른 compute node의 데이터는 추가 경계를 넘어야 한다.", rows: [["경로", "memory controller 또는 interconnect 추가"], ["비용", "local access보다 통신·동기화가 더 중요해진다."]], note: "remote 경로의 실제 비용은 topology에 따라 측정한다." }
  };
  const { canvas, controls } = viewerShell(host, "메모리 계층과 데이터 이동",
    `<button class="viz-btn active" data-level="cache">Cache</button><button class="viz-btn" data-level="ram">RAM</button><button class="viz-btn" data-level="remote">Remote</button>`, details.cache);
  let level = "cache";
  const click = event => { const b = event.target.closest("[data-level]"); if (!b) return; level = b.dataset.level; activateButton(controls, "[data-level]", level); setDetails(host, details[level]); };
  controls.addEventListener("click", click);
  const stop = createLoop(canvas, (ctx, w, h, t) => {
    ctx.clearRect(0, 0, w, h);
    const levels = [["Core", .14], ["Cache", .31], ["RAM", .52], ["Interconnect", .72], ["Remote RAM", .88]];
    levels.forEach(([name, p], i) => box(ctx, w / 2 - 105, h * p - 22, 210, 44, name, { accent: (level === "cache" && i <= 1) || (level === "ram" && i <= 2) || level === "remote" }));
    const idx = level === "cache" ? 1 : level === "ram" ? 2 : 4, end = levels[idx][1], p = (t * .35) % 1;
    line(ctx, w / 2, h * .14 + 24, w / 2, h * end - 24, level === "remote" ? css("--warning") : css("--accent"), 3);
    particle(ctx, { x: w / 2, y: h * .14 + 24 }, { x: w / 2, y: h * end - 24 }, p, level === "remote" ? css("--warning") : css("--accent"));
  });
  return () => { stop(); controls.removeEventListener("click", click); };
}
