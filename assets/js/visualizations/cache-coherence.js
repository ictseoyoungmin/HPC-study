import { css, label, box, line, arrow, particle, createLoop, viewerShell, setDetails, activateButton } from "./canvas-utils.js";

const details = {
  hierarchy: {
    title: "Cache hierarchy",
    body: "Core에 가까운 cache일수록 작고 빠르며, 바깥 계층으로 갈수록 용량은 커지고 접근 비용은 증가한다. 공유 범위도 L1/L2/L3마다 다를 수 있다.",
    rows: [["읽을 것", "latency뿐 아니라 어느 Core들이 같은 cache를 공유하는지"], ["성능 관점", "working set과 data reuse가 가까운 cache에 남는지가 중요"]],
    note: "실제 크기·공유 범위는 CPU 세대마다 다르므로 lscpu --caches와 sysfs로 확인한다."
  },
  coherence: {
    title: "Coherence ownership",
    body: "두 Core가 같은 cache line을 읽고 쓰면 coherence protocol이 line의 최신 사본과 쓰기 권한을 추적한다. 쓰기 권한이 이동할 때 상대 cache의 사본은 무효화될 수 있다.",
    rows: [["관찰", "같은 주소를 여러 Core가 자주 쓰면 line ownership 이동이 늘어남"], ["오해 금지", "coherence는 data race를 해결하는 동기화 primitive가 아님"]],
    note: "정확한 protocol state 이름(MESI/MOESI 등)은 CPU에 따라 다르지만 핵심은 line 단위의 일관성 유지다."
  },
  false: {
    title: "False sharing",
    body: "Thread A와 B가 서로 다른 변수를 수정해도 두 변수가 같은 cache line에 있으면 line 전체의 쓰기 권한이 Core 사이를 왕복할 수 있다.",
    rows: [["증상", "thread 수를 늘릴수록 특정 구간에서 scaling이 갑자기 악화"], ["개선 후보", "padding, data layout 변경, thread-private accumulation"]],
    note: "false sharing은 논리적 data race가 없어도 발생할 수 있다는 점이 핵심이다."
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
    const pad = 24;
    if (mode === "hierarchy") {
      const cx = w / 2;
      const layers = [
        ["Core", 88, 44, .12, true],
        ["L1", 126, 42, .27, true],
        ["L2", 176, 44, .42, false],
        ["Shared L3 / LLC", 250, 48, .61, false],
        ["DRAM", 300, 52, .82, false]
      ];
      layers.forEach(([name, bw, bh, py, accent]) => box(ctx, cx - bw / 2, h * py - bh / 2, bw, bh, name, { accent }));
      for (let i = 0; i < layers.length - 1; i++) {
        const y1 = h * layers[i][3] + layers[i][2] / 2;
        const y2 = h * layers[i + 1][3] - layers[i + 1][2] / 2;
        arrow(ctx, cx, y1, cx, y2, css("--viewer-line"), 2);
      }
      label(ctx, "가까울수록 빠르고 작음", pad, 26, { align: "left", size: 12, color: css("--viewer-muted") });
      label(ctx, "멀수록 크고 느림", pad, h - 22, { align: "left", size: 12, color: css("--viewer-muted") });
      return;
    }

    const narrow = w < 520;
    const coreW = narrow ? Math.min(210, w - 56) : 160;
    const coreH = narrow ? 48 : 62;
    const leftX = narrow ? (w - coreW) / 2 : Math.max(18, w * .10);
    const rightX = narrow ? leftX : Math.min(w - coreW - 18, w * .68);
    const leftY = narrow ? 28 : 56;
    const rightY = narrow ? 184 : 56;
    const cacheOffset = narrow ? 58 : 92;
    const cacheH = narrow ? 46 : 62;
    box(ctx, leftX, leftY, coreW, coreH, "Core 0", { accent: true });
    box(ctx, rightX, rightY, coreW, coreH, "Core 1", { accent: mode === "false" });
    box(ctx, leftX, leftY + cacheOffset, coreW, cacheH, "Private cache", {});
    box(ctx, rightX, rightY + cacheOffset, coreW, cacheH, "Private cache", {});

    const sharedW = Math.min(340, w - 36);
    const lineY = narrow ? h - 82 : h - 115;
    box(ctx, w / 2 - sharedW / 2, lineY, sharedW, narrow ? 48 : 62, "Shared cache line · 64 B example", { accent: mode === "coherence", size: narrow ? 11 : 13 });
    line(ctx, leftX + coreW / 2, leftY + cacheOffset + cacheH, w / 2 - (narrow ? 38 : 90), lineY, css("--viewer-line"), 2);
    line(ctx, rightX + coreW / 2, rightY + cacheOffset + cacheH, w / 2 + (narrow ? 38 : 90), lineY, css("--viewer-line"), 2);

    const leftState = { x: leftX + coreW / 2, y: leftY + cacheOffset + cacheH / 2 };
    const rightState = { x: rightX + coreW / 2, y: rightY + cacheOffset + cacheH / 2 };
    if (mode === "coherence") {
      const ownerLeft = Math.floor(t * .55) % 2 === 0;
      label(ctx, ownerLeft ? "M / owner" : "I", leftState.x, leftState.y, { size: 11, color: ownerLeft ? css("--accent") : css("--viewer-muted") });
      label(ctx, ownerLeft ? "I" : "M / owner", rightState.x, rightState.y, { size: 11, color: ownerLeft ? css("--viewer-muted") : css("--accent") });
      const a = ownerLeft ? leftState : rightState;
      const b = ownerLeft ? rightState : leftState;
      arrow(ctx, a.x, a.y, b.x, b.y, css("--warning"), 2);
      particle(ctx, a, b, (t * .8) % 1, css("--warning"));
      label(ctx, "write ownership 이동 / invalidation", w / 2, narrow ? 166 : leftY + 28, { size: 11, color: css("--viewer-muted"), maxWidth: w - 32 });
    } else {
      const segGap = 10;
      const segW = Math.min(128, (sharedW - 38) / 2);
      const x0 = w / 2 - (segW * 2 + segGap) / 2;
      box(ctx, x0, lineY + 6, segW, narrow ? 34 : 42, "A · Thread 0", { accent: true, size: 11 });
      box(ctx, x0 + segW + segGap, lineY + 6, segW, narrow ? 34 : 42, "B · Thread 1", { accent: true, size: 11 });
      const p = (t * .9) % 1;
      const fromLeft = Math.floor(t * .9) % 2 === 0;
      particle(ctx, fromLeft ? leftState : rightState, fromLeft ? rightState : leftState, p, css("--warning"));
      if (!narrow) label(ctx, "서로 다른 변수지만 같은 line", w / 2, h - 26, { size: 12, color: css("--viewer-muted") });
    }
  });

  return () => { stop(); controls.removeEventListener("click", click); };
}
