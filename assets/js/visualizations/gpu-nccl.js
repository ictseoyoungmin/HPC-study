import { css, label, box, line, arrow, particle, createLoop, viewerShell, setDetails, activateButton } from "./canvas-utils.js";

const sets = {
  fundamentals: {
    modes: ["execution", "memory", "pipeline"],
    initial: "execution",
    details: {
      execution: { title: "Grid → Block → Thread", body: "CUDA kernel은 많은 thread를 block과 grid 계층으로 묶어 실행한다. 실제 hardware에서는 thread들이 warp 단위로 실행되므로 divergence와 resource 사용량이 concurrency에 영향을 준다.", rows: [["Concurrency", "occupancy는 register/shared-memory/block 제한과 함께 결정"], ["오해 금지", "높은 occupancy 자체가 높은 성능을 보장하지 않음"]], note: "먼저 실행 계층과 data movement를 분리한 뒤 profiler metric을 해석한다." },
      memory: { title: "GPU memory hierarchy", body: "register, shared memory, cache, device memory는 용량·공유 범위·latency가 다르다. access pattern과 coalescing이 effective bandwidth에 큰 영향을 준다.", rows: [["가까운 계층", "register/shared memory는 빠르지만 용량이 제한"], ["global memory", "큰 용량과 높은 bandwidth를 제공하지만 access efficiency가 중요"]], note: "capacity 사용량과 memory throughput은 서로 다른 지표다." },
      pipeline: { title: "Host ↔ Device pipeline", body: "전체 wall time은 CPU preprocessing, H2D transfer, GPU kernel, D2H transfer, synchronization의 합과 overlap으로 결정된다.", rows: [["GPU idle", "CPU 공급이나 transfer가 늦으면 kernel이 없어도 발생"], ["측정", "phase별 시간을 분리해 transfer 비중을 정량화"]], note: "nvidia-smi의 순간 utilization만으로 병목 위치를 확정하지 않는다." }
    }
  },
  data: {
    modes: ["serial", "overlap", "unified"],
    initial: "serial",
    details: {
      serial: { title: "Serialized transfer + compute", body: "H2D → kernel → D2H가 순차 실행되면 transfer 구간 동안 GPU compute unit이 충분히 활용되지 않을 수 있다.", rows: [["병목", "PCIe/NVLink transfer 시간이 wall time에서 차지하는 비중"], ["관찰", "timeline에서 memcpy와 kernel 사이의 gap"]], note: "먼저 순차 baseline을 측정해야 overlap 효과를 설명할 수 있다." },
      overlap: { title: "Streams and overlap", body: "독립적인 data chunk와 dependency 조건이 맞으면 stream을 사용해 transfer와 kernel을 겹칠 수 있다. 단순히 stream 수를 늘린다고 자동으로 빨라지지는 않는다.", rows: [["필요 조건", "async-capable transfer, pinned memory, dependency 관리"], ["목표", "pipeline의 빈 구간을 줄이고 device를 지속적으로 공급"]], note: "동기화 지점이 과도하면 overlap이 사라질 수 있다." },
      unified: { title: "Unified Memory migration", body: "Unified Memory는 단일 주소 공간을 제공하지만 page migration과 fault가 발생할 수 있다. 편의성과 locality control 사이의 trade-off가 있다.", rows: [["관찰", "page fault / migration이 kernel timeline에 영향을 주는지"], ["주의", "메모리 모델이 단순해졌다고 data movement 자체가 사라지는 것은 아님"]], note: "큰 workload에서는 access pattern과 prefetch/policy를 측정으로 검증한다." }
    }
  },
  multi: {
    modes: ["topology", "nccl", "gdr"],
    initial: "topology",
    details: {
      topology: { title: "GPU ↔ GPU ↔ NIC topology", body: "같은 GPU 수라도 NVLink, PCIe switch, CPU socket, NIC proximity가 다르면 peer traffic과 multi-node collective 비용이 달라질 수 있다.", rows: [["확인", "nvidia-smi topo -m와 rank↔GPU↔NIC 배치"], ["핵심", "logical rank 수보다 실제 data path가 중요"]], note: "topology 차이를 기록하지 않으면 node 간 성능 차이를 설명하기 어렵다." },
      nccl: { title: "NCCL collective", body: "NCCL은 ring/tree 등 topology-aware algorithm으로 GPU collective를 수행한다. 느린 link나 rank가 collective 전체의 완료 시간을 제한할 수 있다.", rows: [["예", "AllReduce는 gradient 동기화에서 반복적으로 사용"], ["진단", "message size, algorithm/transport, slow rank, link counter를 함께 봄"]], note: "collective는 가장 느린 participant의 영향이 전체에 전파될 수 있다." },
      gdr: { title: "GPUDirect RDMA", body: "GPUDirect RDMA는 NIC와 GPU memory 사이의 data path를 최적화해 host staging을 줄이는 것을 목표로 한다.", rows: [["경로", "GPU memory ↔ NIC ↔ fabric ↔ remote GPU memory"], ["조건", "GPU/NIC topology, driver, RDMA stack, library support가 함께 맞아야 함"]], note: "기능 존재 여부와 실제 선택된 runtime path는 별도로 확인한다." }
    }
  }
};

function modeLabel(mode) {
  return ({ execution: "Execution", memory: "Memory", pipeline: "Pipeline", serial: "Serial", overlap: "Overlap", unified: "Unified", topology: "Topology", nccl: "NCCL", gdr: "GPUDirect RDMA" })[mode] || mode;
}

export function mountGpuNccl(host, kind = "fundamentals") {
  const set = sets[kind];
  const buttons = set.modes.map((mode, i) => `<button class="viz-btn ${i === 0 ? "active" : ""}" data-mode="${mode}">${modeLabel(mode)}</button>`).join("");
  const { canvas, controls } = viewerShell(host, kind === "multi" ? "Multi-GPU · NCCL · GPUDirect RDMA" : kind === "data" ? "GPU data movement · Streams" : "GPU execution model", buttons, set.details[set.initial]);
  let mode = set.initial;
  const click = event => {
    const button = event.target.closest("[data-mode]");
    if (!button) return;
    mode = button.dataset.mode;
    activateButton(controls, "[data-mode]", mode);
    setDetails(host, set.details[mode]);
  };
  controls.addEventListener("click", click);

  const stop = createLoop(canvas, (ctx, w, h, t) => {
    ctx.clearRect(0, 0, w, h);

    if (["execution", "memory", "pipeline"].includes(mode)) {
      if (mode === "execution") {
        box(ctx, w / 2 - 150, 42, 300, 50, "Grid", { accent: true });
        const narrow = w < 520;
        const blockCount = narrow ? 1 : 2;
        const blockW = narrow ? Math.min(250, w - 56) : Math.min(180, (w - 70) / 2);
        const blockXs = blockCount === 1 ? [(w - blockW) / 2] : [28, w - 28 - blockW];
        blockXs.forEach((x, i) => box(ctx, x, 130, blockW, 62, `Block ${i}`, {}));
        blockXs.forEach((bx, bi) => {
          const threadW = Math.min(30, (blockW - 30) / 4);
          const tg = (blockW - threadW * 4) / 5;
          for (let i = 0; i < 8; i++) {
            const col = i % 4, row = Math.floor(i / 4);
            const x = bx + tg + col * (threadW + tg), y = 220 + row * 48;
            box(ctx, x, y, threadW, 30, `t${bi * 8 + i}`, { accent: i < 4, size: 9 });
          }
        });
        label(ctx, "여러 thread는 warp 단위로 실행", w / 2, h - 28, { size: 12, color: css("--viewer-muted") });
      } else if (mode === "memory") {
        const rows = [["Registers", .14, 130], ["Shared memory / L1", .31, 220], ["L2 cache", .50, 280], ["Device memory (HBM/GDDR)", .72, 340]];
        rows.forEach(([name, py, bw], i) => box(ctx, w / 2 - bw / 2, h * py - 24, bw, 48, name, { accent: i < 2 }));
        rows.slice(0, -1).forEach((r, i) => arrow(ctx, w / 2, h * r[1] + 24, w / 2, h * rows[i + 1][1] - 24, css("--viewer-line"), 2));
        label(ctx, "용량 · 공유 범위 · latency가 계층마다 다름", w / 2, h - 25, { size: 12, color: css("--viewer-muted") });
      } else {
        const parts = [["CPU prep", .05, .20], ["H2D", .27, .16], ["GPU kernel", .45, .34], ["D2H / sync", .81, .14]];
        parts.forEach(([name, x, ww], i) => box(ctx, w * x, h / 2 - 38, w * ww, 76, name, { accent: i === 2 }));
        particle(ctx, { x: w * .05, y: h / 2 + 62 }, { x: w * .95, y: h / 2 + 62 }, (t * .25) % 1, css("--warning"));
        label(ctx, "wall time은 kernel만이 아니라 전체 pipeline으로 결정", w / 2, h - 26, { size: 12, color: css("--viewer-muted"), maxWidth: w - 30 });
      }
      return;
    }

    if (["serial", "overlap", "unified"].includes(mode)) {
      const x0 = 35, x1 = w - 35, y1 = 95, y2 = 205;
      label(ctx, "Stream / timeline", x0, 48, { align: "left", size: 12, color: css("--viewer-muted") });
      line(ctx, x0, y1, x1, y1, css("--viewer-line"), 1);
      line(ctx, x0, y2, x1, y2, css("--viewer-line"), 1);
      label(ctx, "Copy", x0, y1 - 25, { align: "left", size: 12 });
      label(ctx, "Compute", x0, y2 - 25, { align: "left", size: 12 });
      if (mode === "serial") {
        const span = x1 - x0;
        box(ctx, x0 + span * .05, y1 - 18, span * .22, 36, "H2D", { accent: true, size: 11 });
        box(ctx, x0 + span * .31, y2 - 18, span * .40, 36, "Kernel", { accent: true, size: 11 });
        box(ctx, x0 + span * .75, y1 - 18, span * .20, 36, "D2H", { accent: true, size: 11 });
      } else if (mode === "overlap") {
        const span = x1 - x0;
        box(ctx, x0 + span * .05, y1 - 18, span * .27, 36, "H2D B", { accent: true, size: 11 });
        box(ctx, x0 + span * .20, y2 - 18, span * .42, 36, "Kernel A", { accent: true, size: 11 });
        box(ctx, x0 + span * .66, y1 - 18, span * .25, 36, "D2H A", { accent: true, size: 11 });
        label(ctx, "독립 chunk의 transfer와 compute를 겹침", w / 2, h - 28, { size: 12, color: css("--viewer-muted") });
      } else {
        box(ctx, w / 2 - 155, 110, 310, 56, "Unified virtual address space", { accent: true });
        const pageW = Math.min(150, Math.max(90, (w - 86) / 2));
        const hostX = 28, gpuX = w - 28 - pageW;
        box(ctx, hostX, 255, pageW, 48, "Host pages", {});
        box(ctx, gpuX, 255, pageW, 48, "GPU pages", {});
        arrow(ctx, hostX + pageW, 279, gpuX, 279, css("--warning"), 2);
        particle(ctx, { x: hostX + pageW, y: 279 }, { x: gpuX, y: 279 }, (t * .45) % 1, css("--warning"));
        label(ctx, "page migration / fault", w / 2, 318, { size: 12, color: css("--viewer-muted") });
      }
      return;
    }

    const gpuY = 72, gw = Math.min(120, Math.max(54, (w - 50) / 4)), gh = 58;
    const gpuGap = (w - gw * 4) / 5;
    const gpuXs = [0, 1, 2, 3].map(i => gpuGap + i * (gw + gpuGap));
    gpuXs.forEach((x, i) => box(ctx, x, gpuY, gw, gh, `GPU ${i}`, { accent: mode === "nccl" }));
    const nic = { x: w / 2 - 70, y: h - 100, w: 140, h: 52 };
    box(ctx, nic.x, nic.y, nic.w, nic.h, "NIC / HCA", { accent: mode === "gdr" });

    if (mode === "topology") {
      line(ctx, gpuXs[0] + gw, gpuY + gh / 2, gpuXs[1], gpuY + gh / 2, css("--accent-2"), 4);
      line(ctx, gpuXs[2] + gw, gpuY + gh / 2, gpuXs[3], gpuY + gh / 2, css("--accent-2"), 4);
      line(ctx, gpuXs[1] + gw / 2, gpuY + gh, nic.x + 38, nic.y, css("--viewer-line"), 2);
      line(ctx, gpuXs[2] + gw / 2, gpuY + gh, nic.x + nic.w - 38, nic.y, css("--viewer-line"), 2);
      label(ctx, "NVLink / PCIe / NUMA proximity가 rank placement 비용을 바꿈", w / 2, h - 24, { size: 12, color: css("--viewer-muted"), maxWidth: w - 30 });
    } else if (mode === "nccl") {
      const centers = gpuXs.map(x => ({ x: x + gw / 2, y: gpuY + gh / 2 }));
      centers.forEach((a, i) => {
        const b = centers[(i + 1) % centers.length];
        arrow(ctx, a.x, a.y, b.x, b.y, css("--accent"), 2);
      });
      const i = Math.floor(t * 1.2) % centers.length;
      particle(ctx, centers[i], centers[(i + 1) % centers.length], (t * 1.2) % 1, css("--warning"));
      label(ctx, "collective 완료 시간은 slow link / slow rank 영향을 받음", w / 2, h - 24, { size: 12, color: css("--viewer-muted"), maxWidth: w - 30 });
    } else {
      line(ctx, gpuXs[1] + gw / 2, gpuY + gh, nic.x + 40, nic.y, css("--accent-2"), 3);
      line(ctx, gpuXs[2] + gw / 2, gpuY + gh, nic.x + nic.w - 40, nic.y, css("--accent-2"), 3);
      box(ctx, w / 2 - 120, h - 42, 240, 36, "Remote GPU memory", { accent: true, size: 12 });
      arrow(ctx, w / 2, nic.y + nic.h, w / 2, h - 42, css("--accent-2"), 3);
      particle(ctx, { x: gpuXs[2] + gw / 2, y: gpuY + gh }, { x: w / 2, y: h - 24 }, (t * .5) % 1, css("--accent-2"));
      label(ctx, "host staging을 줄이는 GPU ↔ NIC direct path", w / 2, h - 14, { size: 11, color: css("--viewer-muted") });
    }
  });

  return () => { stop(); controls.removeEventListener("click", click); };
}
