import { css, roundRect, label, box, line, arrow, particle, createLoop, viewerShell, setDetails, activateButton } from "./canvas-utils.js";

export function mountCpu(host) {
  const details = {
    topology: {
      title: "Socket → Core → Logical CPU",
      body: "운영체제가 세는 CPU 번호와 실제 물리 Core는 같은 개념이 아니다. 한 Socket 안에 여러 Core가 있고, SMT가 켜져 있으면 한 Core가 둘 이상의 logical CPU를 노출할 수 있다.",
      rows: [
        ["포함 관계", "Socket은 프로세서 패키지, Core는 실제 계산 자원, logical CPU는 스케줄 가능한 실행 문맥이다."],
        ["공유 자원", "같은 Core의 SMT sibling은 execution resource를 공유하고, 같은 Socket의 Core는 일부 cache와 memory path를 공유한다."],
        ["확인", "lscpu -e=CPU,CORE,SOCKET,NODE 로 CPU 번호가 어느 Core와 Socket에 속하는지 읽는다."]
      ],
      note: "Slurm의 CPU 수와 OpenMP thread 수를 정할 때 logical CPU와 physical Core를 구분해야 한다."
    },
    smt: {
      title: "SMT는 Core 수를 늘리지 않는다",
      body: "SMT는 한 물리 Core에 여러 hardware thread를 노출해 pipeline의 유휴 자원을 활용한다. 두 logical CPU가 서로 독립된 Core 두 개가 되는 것은 아니다.",
      rows: [
        ["그림에서", "각 Core 안의 두 작은 실행 문맥이 SMT sibling을 나타낸다."],
        ["성능", "workload가 execution unit, cache, memory bandwidth를 이미 포화시키면 SMT의 이득이 작거나 역효과가 날 수 있다."],
        ["기록", "benchmark에는 SMT on/off와 binding 정책을 함께 기록한다."]
      ],
      note: "CPU(s)=32라고 해서 physical Core가 32개라고 단정하지 않는다."
    },
    binding: {
      title: "Thread placement와 affinity",
      body: "같은 thread 수라도 어느 Core와 Socket에 배치되느냐에 따라 cache locality와 NUMA 경로가 달라진다. 배치를 고정하면 성능 측정의 재현성도 높아진다.",
      rows: [
        ["Close", "가까운 Core에 밀집시키면 공유 cache locality에 유리한 경우가 있다."],
        ["Spread", "Socket/Core에 넓게 분산하면 memory bandwidth 사용을 분산할 수 있다."],
        ["관찰", "taskset, OMP_PROC_BIND, OMP_PLACES, Slurm --cpu-bind 결과를 topology와 함께 본다."]
      ],
      note: "항상 한 binding이 정답인 것은 아니며 workload와 NUMA 구조에 따라 비교 측정한다."
    }
  };

  const { canvas, controls } = viewerShell(host, "CPU topology와 SMT",
    `<button class="viz-btn active" data-view="topology">Topology</button>
     <button class="viz-btn" data-view="smt">SMT</button>
     <button class="viz-btn" data-view="binding">Binding</button>`, details.topology);
  let view = "topology";
  const click = event => {
    const button = event.target.closest("[data-view]");
    if (!button) return;
    view = button.dataset.view;
    activateButton(controls, "[data-view]", view);
    setDetails(host, details[view]);
  };
  controls.addEventListener("click", click);

  const stop = createLoop(canvas, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    const pad = 22;
    const gap = w < 620 ? 18 : 26;
    const vertical = w < 620;
    const socketW = vertical ? w - pad * 2 : (w - pad * 2 - gap) / 2;
    const socketH = vertical ? (h - 54 - gap) / 2 : h - 64;
    const positions = vertical
      ? [{ x: pad, y: 22 }, { x: pad, y: 22 + socketH + gap }]
      : [{ x: pad, y: 32 }, { x: pad + socketW + gap, y: 32 }];

    positions.forEach((p, socket) => {
      roundRect(ctx, p.x, p.y, socketW, socketH, 10, css("--viewer-side"), css("--viewer-line"));
      label(ctx, `Socket ${socket}`, p.x + 14, p.y + 18, { align: "left", size: 12, color: css("--viewer-muted") });

      const llcY = p.y + 36;
      box(ctx, p.x + 14, llcY, socketW - 28, 28, "Shared LLC / memory controller", { size: 11 });

      const cols = 4;
      const coreGap = 8;
      const usableW = socketW - 28;
      const coreW = (usableW - coreGap * (cols - 1)) / cols;
      const coreH = Math.max(54, Math.min(78, socketH - 92));
      const coreY = p.y + 78;
      for (let c = 0; c < cols; c++) {
        const x = p.x + 14 + c * (coreW + coreGap);
        const selected = view === "binding" && socket === 0 && c < 3;
        roundRect(ctx, x, coreY, coreW, coreH, 7,
          selected ? css("--viz-accent-bg") : css("--viz-node"),
          selected ? css("--accent") : css("--viewer-line"));
        label(ctx, `Core ${socket * 4 + c}`, x + coreW / 2, coreY + 17, { size: 11, maxWidth: coreW - 8 });

        const threadY = coreY + coreH - 18;
        const threadRadius = Math.min(8, coreW * .11);
        const centers = [x + coreW * .34, x + coreW * .66];
        centers.forEach((cx, sibling) => {
          ctx.beginPath();
          ctx.fillStyle = view === "smt" || selected ? css("--accent-2") : css("--viewer-line");
          ctx.arc(cx, threadY, threadRadius, 0, Math.PI * 2);
          ctx.fill();
          if (view === "smt") {
            label(ctx, `CPU${(socket * 4 + c) * 2 + sibling}`, cx, threadY + 17, { size: 9, color: css("--viewer-muted"), maxWidth: coreW / 2 });
          }
        });
        if (selected) label(ctx, `T${c}`, x + coreW / 2, coreY + coreH / 2, { size: 11, color: css("--accent") });
      }

      label(ctx, "DRAM", p.x + socketW / 2, p.y + socketH - 16, { size: 11, color: css("--viewer-muted") });
    });

    if (!vertical) {
      line(ctx, positions[0].x + socketW, h / 2, positions[1].x, h / 2, css("--warning"), 2, true);
      label(ctx, "socket / NUMA boundary", w / 2, h / 2 - 13, { size: 10, color: css("--warning") });
    }
  });

  return () => { stop(); controls.removeEventListener("click", click); };
}
