import { css, label, box, line, arrow, particle, createLoop, viewerShell, setDetails, activateButton } from "./canvas-utils.js";

const details = {
  metadata: {
    title: "Metadata path",
    body: "파일 이름 lookup, open, stat, create 같은 operation은 데이터 byte 자체가 아니라 namespace와 inode metadata를 다룬다. 작은 파일이 많으면 metadata service가 먼저 병목이 될 수 있다.",
    rows: [["Lustre 예", "client → MDS/MDT for metadata"], ["분리", "metadata latency와 bulk data throughput을 별도 symptom으로 봄"]],
    note: "1 TB 파일 1개와 1 KB 파일 10억 개는 capacity가 같아도 metadata workload가 완전히 다르다."
  },
  stripe: {
    title: "Striped data I/O",
    body: "큰 파일의 data extent를 여러 storage target에 나누면 여러 server/target의 bandwidth를 병렬로 사용할 수 있다. stripe count와 size는 access pattern에 맞춰야 한다.",
    rows: [["효과", "large sequential/parallel I/O에서 aggregate bandwidth 확대 가능"], ["trade-off", "작은 파일·작은 request에 과도한 striping은 overhead가 될 수 있음"]],
    note: "filesystem마다 용어는 다르지만 metadata service와 data target을 분리해 이해하면 진단이 쉬워진다."
  },
  small: {
    title: "Small-file storm",
    body: "많은 rank가 동시에 작은 파일을 create/stat/open하면 data bandwidth보다 metadata operation rate와 directory contention이 지배적일 수 있다.",
    rows: [["개선 후보", "파일 수 축소, sharding, collective format(HDF5 등), aggregation"], ["관찰", "파일 수·inode/quota·metadata latency를 byte/s와 함께 기록"]],
    note: "'스토리지가 느리다'를 metadata와 data path로 나누어 표현해야 원인 범위를 좁힐 수 있다."
  }
};

export function mountParallelFilesystem(host) {
  const { canvas, controls } = viewerShell(host, "Parallel filesystem · Metadata · Striping",
    `<button class="viz-btn active" data-mode="metadata">Metadata</button>
     <button class="viz-btn" data-mode="stripe">Striped I/O</button>
     <button class="viz-btn" data-mode="small">Small files</button>`, details.metadata);
  let mode = "metadata";
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
    const clients = 4;
    const clientY = 42;
    const cw = Math.min(100, (w - 70) / clients - 10);
    const gap = (w - cw * clients) / (clients + 1);
    const clientPos = [];
    for (let i = 0; i < clients; i++) {
      const x = gap + i * (cw + gap);
      box(ctx, x, clientY, cw, 44, `Rank ${i}`, { accent: mode === "small" });
      clientPos.push({ x: x + cw / 2, y: clientY + 44 });
    }

    const meta = { x: Math.max(80, w * .19), y: 150, w: Math.min(150, w - 40), h: 58 };
    box(ctx, meta.x - meta.w / 2, meta.y, meta.w, meta.h, "Metadata service", { accent: mode !== "stripe" });
    const targetW = Math.min(108, Math.max(54, (w - 50) / 4 - 8));
    const targetGap = (w - targetW * 4) / 5;
    const targets = [0, 1, 2, 3].map(i => ({ x: targetGap + targetW / 2 + i * (targetW + targetGap), y: 250 }));
    targets.forEach((p, i) => box(ctx, p.x - targetW / 2, p.y, targetW, 58, `Target ${i}`, { accent: mode === "stripe", size: 11 }));

    if (mode === "metadata" || mode === "small") {
      clientPos.forEach((p, i) => {
        line(ctx, p.x, p.y, meta.x, meta.y, css("--viewer-line"), mode === "small" ? 2.5 : 1.8);
        const rate = mode === "small" ? .9 + i * .12 : .35;
        particle(ctx, p, { x: meta.x, y: meta.y }, (t * rate + i * .13) % 1, mode === "small" ? css("--warning") : css("--accent"));
      });
      label(ctx, mode === "small" ? "create / stat / open 요청이 metadata service에 집중" : "namespace / inode lookup", w / 2, h - 28, { size: 12, color: css("--viewer-muted"), maxWidth: w - 30 });
    } else {
      clientPos.forEach((p, i) => {
        targets.forEach((target, j) => {
          if ((i + j) % 2 === 0) line(ctx, p.x, p.y, target.x, target.y, css("--viewer-line"), 1.4);
        });
      });
      targets.forEach((target, j) => particle(ctx, clientPos[j % clients], { x: target.x, y: target.y }, (t * (.38 + j * .05) + j * .17) % 1, css("--accent-2")));
      label(ctx, "하나의 큰 파일이 여러 data target에 분산", w / 2, h - 28, { size: 12, color: css("--viewer-muted") });
    }
  });

  return () => { stop(); controls.removeEventListener("click", click); };
}
