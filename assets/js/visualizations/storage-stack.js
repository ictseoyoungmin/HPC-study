import { css, box, line, arrow, particle, createLoop, viewerShell, setDetails, activateButton } from "./canvas-utils.js";

const details = {
  hit: {
    title: "Buffered read · Page cache hit",
    body: "애플리케이션이 read를 호출해도 필요한 page가 이미 page cache에 있으면 block device까지 내려가지 않고 memory에서 데이터를 돌려줄 수 있다.",
    rows: [["주 경로", "Process → VFS → Page cache"], ["관찰", "두 번째 read가 빨라지는 이유를 storage 자체 성능과 구분"]],
    note: "Page-cache hit를 NVMe의 raw throughput으로 오해하지 않는다."
  },
  miss: {
    title: "Buffered read · Cache miss",
    body: "cache에 데이터가 없으면 filesystem이 block I/O를 만들고 block layer와 device를 거쳐 데이터를 읽은 뒤 page cache를 채운다.",
    rows: [["주 경로", "Process → VFS → Cache → Filesystem → Block → Device"], ["비용", "device latency와 queueing이 실제 응답시간에 들어온다."]],
    note: "cold-cache와 warm-cache benchmark는 서로 다른 질문에 답한다."
  },
  writeback: {
    title: "Buffered write · Dirty page와 writeback",
    body: "write가 성공했다고 항상 device에 영구 기록이 끝난 것은 아니다. 일반 buffered write는 먼저 page cache를 dirty 상태로 만들고 이후 writeback이 filesystem과 block layer를 통해 device로 내린다.",
    rows: [["앞단", "Process → Page cache (dirty)"], ["뒷단", "Writeback → Filesystem → Block → Device"]],
    note: "fsync, dirty-page pressure, queue depth와 실제 persistence 시점을 구분한다."
  },
  shared: {
    title: "Shared / network filesystem",
    body: "NFS나 다른 shared filesystem에서는 local VFS와 client cache 이후에 network client, NIC, storage server라는 추가 경계가 생긴다. 느린 I/O가 local block device 문제라고 단정하면 안 된다.",
    rows: [["주 경로", "Process → VFS → Client cache → Network → Storage server"], ["진단", "client·network·server·metadata/data path를 분리"]],
    note: "filesystem마다 cache, locking, metadata, striping 모델이 다르므로 실제 mount type을 먼저 확인한다."
  }
};

export function mountStorageStack(host) {
  const buttons = `
    <button class="viz-btn active" data-mode="hit">Cache hit</button>
    <button class="viz-btn" data-mode="miss">Cache miss</button>
    <button class="viz-btn" data-mode="writeback">Writeback</button>
    <button class="viz-btn" data-mode="shared">Shared FS</button>`;
  const { canvas, controls } = viewerShell(host, "Linux storage data path", buttons, details.hit);
  let mode = "hit";

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
    const compact = w < 560;
    const boxW = Math.min(compact ? w - 48 : 260, 300);
    const x = (w - boxW) / 2;
    const top = 34;
    const bottom = h - 34;
    const labels = mode === "shared"
      ? ["Process", "VFS / syscalls", "Client page cache", "FS client", "NIC / network", "Storage server"]
      : ["Process", "VFS / syscalls", "Page cache", "Filesystem", "Block layer", "NVMe / device"];
    const ys = labels.map((_, i) => top + (bottom - top) * (i / (labels.length - 1)));
    const activeDepth = mode === "hit" ? 2 : labels.length - 1;

    labels.forEach((name, i) => {
      const active = i <= activeDepth;
      box(ctx, x, ys[i] - 20, boxW, 40, name, {
        accent: active,
        fill: active ? css("--viz-accent-bg") : css("--viz-node")
      });
      if (i < labels.length - 1) {
        const activeEdge = i < activeDepth;
        const color = activeEdge ? (mode === "writeback" && i >= 2 ? css("--warning") : css("--accent")) : css("--viewer-line");
        line(ctx, w / 2, ys[i] + 20, w / 2, ys[i + 1] - 20, color, activeEdge ? 2.5 : 1.5, !activeEdge);
      }
    });

    if (mode === "writeback") {
      labelDirty(ctx, x + boxW - 18, ys[2] - 28);
      const p = (t * .35) % 1;
      particle(ctx, { x: w / 2, y: ys[2] + 20 }, { x: w / 2, y: ys[5] - 20 }, p, css("--warning"));
      arrow(ctx, w / 2 + 18, ys[2] + 28, w / 2 + 18, ys[5] - 28, css("--warning"), 2);
    } else {
      const end = activeDepth;
      const p = (t * .32) % 1;
      particle(ctx, { x: w / 2, y: ys[0] + 20 }, { x: w / 2, y: ys[end] - 20 }, p, mode === "shared" ? css("--warning") : css("--accent"));
    }

    const caption = mode === "hit"
      ? "cache hit에서는 block device가 data path에 들어오지 않는다."
      : mode === "miss"
        ? "cache miss에서는 filesystem·block layer·device latency가 포함된다."
        : mode === "writeback"
          ? "buffered write의 완료 시점과 device persistence 시점은 다를 수 있다."
          : "shared filesystem은 local kernel stack 뒤에 network와 server 경계를 추가한다.";
    drawCaption(ctx, caption, w, h);
  });

  return () => {
    stop();
    controls.removeEventListener("click", click);
  };
}

function labelDirty(ctx, x, y) {
  ctx.save();
  ctx.fillStyle = css("--warning");
  ctx.beginPath();
  ctx.arc(x, y, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawCaption(ctx, text, w, h) {
  ctx.save();
  ctx.fillStyle = css("--viewer-muted");
  ctx.font = "500 12px system-ui";
  ctx.textAlign = "center";
  ctx.textBaseline = "bottom";
  ctx.fillText(text, w / 2, h - 8, Math.max(40, w - 28));
  ctx.restore();
}
