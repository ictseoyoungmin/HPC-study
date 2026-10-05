import { css, roundRect, label, box, line, arrow, particle, createLoop, viewerShell, setDetails, activateButton } from "./canvas-utils.js";

export function mountNuma(host) {
  const details = {
    local: {
      title: "Local memory access",
      body: "Thread가 실행되는 NUMA node와 memory page가 같은 NUMA node에 있으면 local memory controller를 통해 접근한다. 일반적으로 가장 짧은 경로다.",
      rows: [
        ["CPU 위치", "NUMA 0의 Core에서 thread가 실행된다."],
        ["Page 위치", "해당 page도 NUMA 0의 DRAM에 배치되어 있다."],
        ["관찰", "numactl --hardware로 node distance를 보고 taskset/numactl -s로 CPU·memory policy를 확인한다."]
      ],
      note: "NUMA 최적화의 핵심은 CPU affinity와 memory placement를 함께 맞추는 것이다."
    },
    remote: {
      title: "Remote memory access",
      body: "Thread는 NUMA 0에서 실행되지만 필요한 page가 NUMA 1에 있으면 socket 간 interconnect를 거쳐 remote DRAM에 접근한다.",
      rows: [
        ["추가 경로", "local memory controller만 사용하는 대신 socket 간 link를 한 번 더 통과한다."],
        ["영향", "latency가 늘고 inter-socket bandwidth를 사용하므로 memory-bound workload의 scaling이 악화될 수 있다."],
        ["진단", "한 Socket만 바쁜지, page가 어느 NUMA node에 배치됐는지, binding이 의도와 같은지 함께 확인한다."]
      ],
      note: "remote access의 실제 비용은 CPU 세대와 topology에 따라 다르므로 고정 배율로 가정하지 않는다."
    },
    firsttouch: {
      title: "First-touch allocation",
      body: "Linux의 일반적인 NUMA 배치에서는 page가 처음 실제로 쓰이는 시점의 실행 CPU 근처에 물리 page가 할당되는 경우가 많다.",
      rows: [
        ["초기화", "한 thread가 전체 배열을 먼저 초기화하면 page가 한 NUMA node에 몰릴 수 있다."],
        ["병렬 초기화", "각 thread가 자신이 계산할 영역을 먼저 touch하면 page locality를 맞추기 쉬워진다."],
        ["주의", "policy, allocator, cgroup, interleave 설정에 따라 동작은 달라질 수 있다."]
      ],
      note: "CPU binding만 고정하고 memory placement를 보지 않으면 locality 문제를 놓칠 수 있다."
    }
  };

  const { canvas, controls } = viewerShell(host, "NUMA locality와 memory placement",
    `<button class="viz-btn active" data-mode="local">Local</button>
     <button class="viz-btn" data-mode="remote">Remote</button>
     <button class="viz-btn" data-mode="firsttouch">First-touch</button>`, details.local);
  let mode = "local";
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
    const pad = 22;
    const gap = Math.max(34, Math.min(64, w * .08));
    const nodeW = (w - pad * 2 - gap) / 2;
    const top = 32;
    const nodeH = h - 66;
    const left = { x: pad, y: top, w: nodeW, h: nodeH };
    const right = { x: pad + nodeW + gap, y: top, w: nodeW, h: nodeH };

    [left, right].forEach((n, i) => {
      roundRect(ctx, n.x, n.y, n.w, n.h, 10, css("--viewer-side"), css("--viewer-line"));
      label(ctx, `NUMA ${i}`, n.x + 14, n.y + 18, { align: "left", size: 12, color: css("--viewer-muted") });
      const coresY = n.y + 50;
      for (let c = 0; c < 4; c++) {
        const cw = (n.w - 40) / 4;
        box(ctx, n.x + 12 + c * cw, coresY, cw - 6, 36, `C${i * 4 + c}`, { accent: i === 0 && c === 0, size: 10 });
      }
      box(ctx, n.x + 18, n.y + n.h - 76, n.w - 36, 48, `DRAM ${i}`, { size: 12 });
    });

    const interY = top + nodeH * .54;
    const leftEdge = left.x + left.w;
    const rightEdge = right.x;
    line(ctx, leftEdge, interY, rightEdge, interY, css("--warning"), 3);
    label(ctx, "socket interconnect", w / 2, interY - 14, { size: 10, color: css("--warning"), maxWidth: gap + 80 });

    const source = { x: left.x + left.w * .18, y: left.y + 90 };
    const localMem = { x: left.x + left.w / 2, y: left.y + left.h - 78 };
    const remoteMem = { x: right.x + right.w / 2, y: right.y + right.h - 78 };

    if (mode === "local" || mode === "firsttouch") {
      arrow(ctx, source.x, source.y + 18, localMem.x, localMem.y - 26, css("--accent-2"), 3);
      particle(ctx, { x: source.x, y: source.y + 18 }, { x: localMem.x, y: localMem.y - 26 }, t * .45, css("--accent-2"));
    } else {
      const midA = { x: leftEdge, y: interY };
      const midB = { x: rightEdge, y: interY };
      line(ctx, source.x, source.y + 18, midA.x, midA.y, css("--warning"), 3);
      line(ctx, midA.x, midA.y, midB.x, midB.y, css("--warning"), 3);
      arrow(ctx, midB.x, midB.y, remoteMem.x, remoteMem.y - 26, css("--warning"), 3);
      const phase = (t * .32) % 1;
      const path = [
        { a: { x: source.x, y: source.y + 18 }, b: midA },
        { a: midA, b: midB },
        { a: midB, b: { x: remoteMem.x, y: remoteMem.y - 26 } }
      ];
      const s = Math.min(path.length - 1, Math.floor(phase * path.length));
      particle(ctx, path[s].a, path[s].b, phase * path.length - s, css("--warning"));
    }

    const meterX = right.x + 20;
    const meterY = right.y + 116;
    label(ctx, "상대 경로 비용", meterX, meterY, { align: "left", size: 11, color: css("--viewer-muted") });
    const meterW = Math.max(46, right.w - 40);
    [["Local", .46, css("--accent-2")], ["Remote", .84, css("--warning")]].forEach(([name, p, color], i) => {
      const y = meterY + 26 + i * 31;
      label(ctx, name, meterX, y, { align: "left", size: 10, color: css("--viewer-muted"), maxWidth: 52 });
      ctx.fillStyle = css("--viewer-line");
      ctx.fillRect(meterX + 58, y - 5, Math.max(20, meterW - 58), 10);
      ctx.fillStyle = color;
      ctx.fillRect(meterX + 58, y - 5, Math.max(20, meterW - 58) * p, 10);
    });

    if (mode === "firsttouch") {
      label(ctx, "first write → page placement", left.x + left.w / 2, left.y + left.h * .58, { size: 11, color: css("--accent") });
    }
  });
  return () => { stop(); controls.removeEventListener("click", click); };
}
