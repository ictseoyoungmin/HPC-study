import { css, roundRect, label, box, line, arrow, particle, createLoop, viewerShell, setDetails, activateButton } from "./canvas-utils.js";

export function mountStrongWeak(host) {
  const details = {
    strong: {
      title: "Strong scaling: 문제 크기는 고정",
      body: "같은 전체 문제를 더 많은 worker로 나눠 runtime이 얼마나 줄어드는지 본다. 이상적으로는 worker 수에 비례해 시간이 줄지만 serial 구간과 communication 때문에 efficiency가 떨어진다.",
      rows: [["고정", "전체 problem size"], ["변화", "processor / rank / thread 수"], ["측정", "T(N), Speedup=T1/TN, Efficiency=Speedup/N"]],
      note: "input을 바꾸면 strong scaling 실험이 아니다."
    },
    weak: {
      title: "Weak scaling: worker당 문제 크기는 고정",
      body: "worker 수를 늘리면서 각 worker가 맡는 work를 비슷하게 유지해 전체 문제 크기를 키운다. 이상적이면 총 문제는 커져도 runtime은 비슷하게 유지된다.",
      rows: [["고정", "worker당 problem size"], ["변화", "worker 수와 전체 problem size가 함께 증가"], ["측정", "runtime 증가율과 communication/I/O overhead를 별도로 관찰"]],
      note: "weak scaling과 scale-out은 같은 개념이 아니다."
    },
    amdahl: {
      title: "Amdahl: serial fraction이 만드는 상한",
      body: "병렬화되지 않는 비율 s가 남아 있으면 worker 수 N을 늘려도 Speedup은 1/(s+(1-s)/N)을 넘기 어렵다. 그래프는 선택한 s에 따른 이론적 곡선이다.",
      rows: [["Speedup", "S(N)=1/(s+(1-s)/N)"], ["Efficiency", "E(N)=S(N)/N"], ["해석", "실제 시스템의 communication·I/O overhead는 이 식과 별도로 측정해야 한다."]],
      note: "Amdahl curve는 실제 runtime을 자동 예측하는 모델이 아니라 serial fraction의 한계를 보는 기준선이다."
    }
  };

  host.innerHTML = `
    <div class="viz-shell textbook-viz">
      <div class="viz-toolbar">
        <strong>Strong / Weak scaling과 Amdahl</strong>
        <div class="viz-controls">
          <button class="viz-btn active" data-view="strong">Strong</button>
          <button class="viz-btn" data-view="weak">Weak</button>
          <button class="viz-btn" data-view="amdahl">Amdahl</button>
        </div>
      </div>
      <div class="viz-layout">
        <div>
          <div class="scaling-controls" data-sliders>
            <label>Serial fraction s <output data-s>0.08</output><input data-serial type="range" min="0" max="0.5" step="0.01" value="0.08"></label>
            <label>Workers N <output data-n>16</output><input data-workers type="range" min="1" max="128" value="16"></label>
          </div>
          <div class="metric-grid" data-metrics>
            <div><span>Speedup</span><strong data-speed></strong></div>
            <div><span>Efficiency</span><strong data-eff></strong></div>
            <div><span>Amdahl limit</span><strong data-limit></strong></div>
          </div>
          <div class="canvas-stage small"><canvas></canvas></div>
        </div>
        <aside class="viz-explain" aria-live="polite">
          <h3 data-viz-title></h3><p data-viz-body></p><dl data-viz-rows></dl><div class="viz-note" data-viz-note></div>
        </aside>
      </div>
    </div>`;
  let view = "strong";
  const controls = host.querySelector(".viz-controls");
  const s = host.querySelector("[data-serial]");
  const n = host.querySelector("[data-workers]");
  const sliders = host.querySelector("[data-sliders]");
  const metrics = host.querySelector("[data-metrics]");
  const canvas = host.querySelector("canvas");

  function update() {
    const serial = Number(s.value), workers = Number(n.value);
    const speedup = 1 / (serial + (1 - serial) / workers);
    host.querySelector("[data-s]").value = serial.toFixed(2);
    host.querySelector("[data-n]").value = workers;
    host.querySelector("[data-speed]").textContent = `${speedup.toFixed(2)}×`;
    host.querySelector("[data-eff]").textContent = `${(speedup / workers * 100).toFixed(1)}%`;
    host.querySelector("[data-limit]").textContent = serial === 0 ? "∞" : `${(1 / serial).toFixed(1)}×`;
    sliders.hidden = view !== "amdahl";
    metrics.hidden = view !== "amdahl";
  }
  function changeView(next) {
    view = next;
    activateButton(controls, "[data-view]", view);
    setDetails(host, details[view]);
    update();
  }
  const click = event => { const button = event.target.closest("[data-view]"); if (button) changeView(button.dataset.view); };
  controls.addEventListener("click", click);
  s.addEventListener("input", update); n.addEventListener("input", update);
  setDetails(host, details.strong); update();

  const stop = createLoop(canvas, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    if (view === "amdahl") {
      const serial = Number(s.value);
      const workers = Number(n.value);
      const maxY = Math.max(4, Math.min(serial === 0 ? 128 : 1 / serial, 40)) * 1.08;
      const pad = { l: 52, r: 20, t: 22, b: 40 };
      ctx.strokeStyle = css("--viewer-line"); ctx.lineWidth = 1;
      for (let i = 0; i <= 4; i++) {
        const y = pad.t + (h - pad.t - pad.b) * i / 4;
        line(ctx, pad.l, y, w - pad.r, y, css("--viewer-line"), 1);
      }
      line(ctx, pad.l, pad.t, pad.l, h - pad.b, css("--viewer-muted"), 1.5);
      line(ctx, pad.l, h - pad.b, w - pad.r, h - pad.b, css("--viewer-muted"), 1.5);

      ctx.strokeStyle = css("--viewer-muted"); ctx.lineWidth = 1.5; ctx.setLineDash([5, 5]); ctx.beginPath();
      for (let N = 1; N <= 128; N++) {
        const x = pad.l + (w - pad.l - pad.r) * (N - 1) / 127;
        const y = pad.t + (h - pad.t - pad.b) * (1 - Math.min(N, maxY) / maxY);
        N === 1 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke(); ctx.setLineDash([]);

      ctx.strokeStyle = css("--accent"); ctx.lineWidth = 2.5; ctx.beginPath();
      for (let N = 1; N <= 128; N++) {
        const sp = 1 / (serial + (1 - serial) / N);
        const x = pad.l + (w - pad.l - pad.r) * (N - 1) / 127;
        const y = pad.t + (h - pad.t - pad.b) * (1 - sp / maxY);
        N === 1 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();
      const current = 1 / (serial + (1 - serial) / workers);
      const cx = pad.l + (w - pad.l - pad.r) * (workers - 1) / 127;
      const cy = pad.t + (h - pad.t - pad.b) * (1 - current / maxY);
      ctx.beginPath(); ctx.fillStyle = css("--accent-2"); ctx.arc(cx, cy, 6, 0, Math.PI * 2); ctx.fill();
      label(ctx, "workers", w - pad.r, h - 15, { align: "right", size: 10, color: css("--viewer-muted") });
      label(ctx, "speedup", 8, pad.t, { align: "left", size: 10, color: css("--viewer-muted") });
      return;
    }

    const count = 8;
    const pad = 28;
    const gap = 8;
    const blockW = (w - pad * 2 - gap * (count - 1)) / count;
    const top = h * .30;
    const workerH = 56;
    const workY = top + 92;
    const totalWork = view === "strong" ? 1 : count;
    for (let i = 0; i < count; i++) {
      const x = pad + i * (blockW + gap);
      box(ctx, x, top, blockW, workerH, `W${i}`, { accent: true, size: 10 });
      const relative = view === "strong" ? 1 / count : 1;
      const height = Math.max(22, 70 * relative);
      roundRect(ctx, x + 4, workY + 70 - height, blockW - 8, height, 4, css("--accent-2"), css("--viewer-line"));
      label(ctx, view === "strong" ? "1/8" : "1 unit", x + blockW / 2, workY + 84, { size: 9, color: css("--viewer-muted"), maxWidth: blockW - 4 });
    }
    label(ctx, view === "strong" ? "전체 문제 크기 고정 → worker당 work 감소" : "worker당 work 고정 → 전체 문제 크기 증가", w / 2, h - 30, { size: 12, color: css("--viewer-muted"), maxWidth: w - 40 });
    label(ctx, `total work: ${view === "strong" ? "1 fixed problem" : `${totalWork} units`}`, w / 2, 24, { size: 11, color: css("--viewer-muted") });
  });
  return () => { stop(); controls.removeEventListener("click", click); s.removeEventListener("input", update); n.removeEventListener("input", update); };
}
