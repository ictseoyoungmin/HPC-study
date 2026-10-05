import { css, label, box, line, arrow, particle, createLoop, viewerShell, setDetails, activateButton } from "./canvas-utils.js";

const details = {
  tcp: {
    title: "Kernel TCP path",
    body: "일반 TCP 통신은 application buffer와 socket, kernel network stack, NIC를 지나 상대 Node의 역방향 경로로 전달된다.",
    rows: [["볼 것", "MTU, drops, retransmits, socket queue, routing"], ["주의", "ping RTT 하나로 MPI/RDMA 성능을 대표할 수 없음"]],
    note: "문제 범위는 interface → route → TCP/socket → application transport 순으로 좁힌다."
  },
  rdma: {
    title: "RDMA data path",
    body: "RDMA는 등록된 memory와 NIC가 직접 data를 주고받아 CPU/kernel 개입을 줄이는 경로를 제공한다. 낮은 overhead를 위해 memory registration과 queue pair 같은 별도 상태가 필요하다.",
    rows: [["경로", "registered memory ↔ HCA/NIC ↔ fabric ↔ remote registered memory"], ["확인", "port state, rate, error counters, device visibility"]],
    note: "RDMA라고 해서 fabric 문제가 사라지는 것은 아니다. link와 congestion, transport 설정을 함께 본다."
  },
  ucx: {
    title: "MPI ↔ UCX/libfabric ↔ transport",
    body: "MPI 같은 상위 통신 라이브러리는 UCX 또는 libfabric 같은 portability layer를 통해 shared memory, TCP, InfiniBand/RoCE 등의 transport를 선택할 수 있다.",
    rows: [["핵심", "MPI 자체와 실제 wire transport를 같은 것으로 보지 않음"], ["진단", "library build, runtime selection, device availability를 분리 확인"]],
    note: "환경변수를 무작정 강제하기보다 사이트 권장 설정과 실제 선택된 transport 증거를 먼저 확보한다."
  }
};

export function mountNetworkRdma(host, initial = "tcp") {
  const { canvas, controls } = viewerShell(host, "Network path · RDMA · UCX/libfabric",
    `<button class="viz-btn ${initial === "tcp" ? "active" : ""}" data-mode="tcp">TCP</button>
     <button class="viz-btn ${initial === "rdma" ? "active" : ""}" data-mode="rdma">RDMA</button>
     <button class="viz-btn ${initial === "ucx" ? "active" : ""}" data-mode="ucx">UCX / libfabric</button>`, details[initial]);
  let mode = initial;
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
    const bw = Math.min(160, Math.max(88, (w - 76) / 2));
    const left = 22, right = w - 22 - bw, bh = 46;
    if (mode === "ucx") {
      const rows = [["MPI application", .12], ["MPI runtime", .28], ["UCX / libfabric", .45], ["SHM · TCP · RDMA", .64], ["NIC / Fabric", .82]];
      rows.forEach(([name, py], i) => box(ctx, w / 2 - 120, h * py - 23, 240, 46, name, { accent: i === 2 || i === 3 }));
      rows.slice(0, -1).forEach((row, i) => arrow(ctx, w / 2, h * row[1] + 23, w / 2, h * rows[i + 1][1] - 23, css("--viewer-line"), 2));
      label(ctx, "상위 API와 실제 transport selection은 서로 다른 계층", w / 2, h - 18, { size: 12, color: css("--viewer-muted"), maxWidth: w - 30 });
      return;
    }

    const y0 = 40;
    const leftLabels = mode === "tcp" ? ["App buffer", "Socket", "TCP/IP kernel", "NIC"] : ["Registered memory", "RDMA verbs / queue", "HCA / NIC"];
    const rightLabels = mode === "tcp" ? ["App buffer", "Socket", "TCP/IP kernel", "NIC"] : ["Registered memory", "RDMA verbs / queue", "HCA / NIC"];
    const count = leftLabels.length;
    const step = 64;
    leftLabels.forEach((name, i) => box(ctx, left, y0 + i * step, bw, bh, name, { accent: mode === "rdma" && i === 0 }));
    rightLabels.forEach((name, i) => box(ctx, right, y0 + i * step, bw, bh, name, { accent: mode === "rdma" && i === 0 }));
    for (let i = 0; i < count - 1; i++) {
      arrow(ctx, left + bw / 2, y0 + i * step + bh, left + bw / 2, y0 + (i + 1) * step, css("--viewer-line"), 2);
      arrow(ctx, right + bw / 2, y0 + (i + 1) * step, right + bw / 2, y0 + i * step + bh, css("--viewer-line"), 2);
    }
    const nicY = y0 + (count - 1) * step + bh / 2;
    const fabricW = Math.min(160, Math.max(86, w - (left + bw) - (w - right) - 12));
    box(ctx, w / 2 - fabricW / 2, nicY - 26, fabricW, 52, "Fabric / Switch", { accent: true, size: 11 });
    arrow(ctx, left + bw, nicY, w / 2 - fabricW / 2, nicY, css("--accent"), 2);
    arrow(ctx, w / 2 + fabricW / 2, nicY, right, nicY, css("--accent"), 2);
    particle(ctx, { x: left + bw, y: nicY }, { x: right, y: nicY }, (t * .42) % 1, mode === "rdma" ? css("--accent-2") : css("--warning"));

    if (mode === "rdma") {
      line(ctx, left + bw / 2, y0 + bh / 2, left + bw / 2, nicY, css("--accent-2"), 3, true);
      line(ctx, right + bw / 2, nicY, right + bw / 2, y0 + bh / 2, css("--accent-2"), 3, true);
      label(ctx, "kernel data path를 줄인 direct data path", w / 2, h - 18, { size: 12, color: css("--viewer-muted") });
    } else {
      label(ctx, "application ↔ socket ↔ kernel ↔ NIC", w / 2, h - 18, { size: 12, color: css("--viewer-muted") });
    }
  });

  return () => { stop(); controls.removeEventListener("click", click); };
}
