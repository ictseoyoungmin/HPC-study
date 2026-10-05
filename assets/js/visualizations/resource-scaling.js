import { css, roundRect, label, box, line, arrow, particle, createLoop, viewerShell, setDetails, activateButton } from "./canvas-utils.js";

export function mountResourceScaling(host) {
  const details = {
    up: {
      title: "Scale-up: 한 Node의 vertical capacity 확대",
      body: "한 서버 안의 CPU, RAM, GPU 같은 자원 용량을 키우는 방향이다. Node 간 통신을 늘리지 않고 더 큰 단일 작업을 담을 수 있지만 한 Node의 hardware 한계가 있다.",
      rows: [["변화", "Node 수는 그대로, Node당 CPU/RAM/GPU capacity가 증가한다."], ["적합", "memory capacity 부족이나 single-node workload의 resource ceiling을 해결할 때 후보가 된다."], ["주의", "parallel efficiency 문제가 원인이라면 더 큰 Node만으로 해결되지 않을 수 있다."]],
      note: "capacity 문제와 parallel efficiency 문제를 먼저 구분한다."
    },
    down: {
      title: "Scale-down: vertical capacity 또는 요청량 축소",
      body: "실제 사용량보다 과도한 자원 요청을 줄이거나 더 작은 Node type을 선택하는 방향이다. HPC batch Job은 실행 중 live resize보다 다음 제출에서 right-size하는 방식이 일반적이다.",
      rows: [["근거", "sacct의 AllocCPUS, MaxRSS, elapsed와 application 사용률을 비교한다."], ["효과", "queue fragmentation과 대기시간, 비용을 줄일 수 있다."], ["주의", "단 한 번의 Job이 아니라 반복 workload 분포를 보고 조정한다."]],
      note: "scale-down을 실행 중 CPU/RAM을 즉시 줄이는 것과 동일시하지 않는다."
    },
    out: {
      title: "Scale-out: Node 수 확대",
      body: "여러 Node로 작업을 분산해 총 계산 자원과 memory capacity를 늘린다. 대신 Node 경계를 넘는 communication과 synchronization 비용이 증가한다.",
      rows: [["변화", "Node 수가 늘고 interconnect를 지나는 데이터 교환이 증가한다."], ["병목", "MPI collective, halo exchange, distributed I/O가 성능 한계가 될 수 있다."], ["판단", "Node 수가 늘었을 때 runtime 감소와 efficiency를 함께 본다."]],
      note: "scale-out과 strong scaling은 같은 말이 아니다. scale-out은 자원 topology 변화, strong scaling은 실험 정의다."
    },
    in: {
      title: "Scale-in: Node 수 축소",
      body: "필요 이상으로 많은 Node를 쓰는 분산 작업의 규모를 줄인다. communication overhead가 큰 workload에서는 Node를 줄여 오히려 efficiency가 개선될 수도 있다.",
      rows: [["근거", "speedup이 거의 늘지 않는데 Node 수만 증가하는 구간을 찾는다."], ["효과", "communication과 scheduler resource footprint를 줄인다."], ["판단", "runtime뿐 아니라 node-hours와 queue wait도 함께 비교한다."]],
      note: "가장 빠른 설정과 가장 효율적인 설정은 다를 수 있다."
    }
  };

  const { canvas, controls } = viewerShell(host, "Vertical / Horizontal scaling",
    `<button class="viz-btn active" data-mode="up">Scale-up</button>
     <button class="viz-btn" data-mode="down">Scale-down</button>
     <button class="viz-btn" data-mode="out">Scale-out</button>
     <button class="viz-btn" data-mode="in">Scale-in</button>`, details.up);
  let mode = "up";
  const click = event => {
    const button = event.target.closest("[data-mode]"); if (!button) return;
    mode = button.dataset.mode; activateButton(controls, "[data-mode]", mode); setDetails(host, details[mode]);
  };
  controls.addEventListener("click", click);

  const stop = createLoop(canvas, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    const centerY = h * .53;
    const drawNode = (x, y, size, active, index) => {
      const width = size; const height = size * .68;
      roundRect(ctx, x - width / 2, y - height / 2, width, height, 9, active ? css("--viz-accent-bg") : css("--viz-node"), active ? css("--accent") : css("--viewer-line"));
      label(ctx, `Node ${index}`, x, y - height * .27, { size: 11, color: css("--viewer-muted") });
      const cpuCount = mode === "up" ? 8 : mode === "down" ? 3 : 5;
      const barW = width * .72;
      label(ctx, "CPU", x - barW / 2, y - 2, { align: "left", size: 9, color: css("--viewer-muted") });
      ctx.fillStyle = css("--viewer-line"); ctx.fillRect(x - barW / 2, y + 7, barW, 8);
      ctx.fillStyle = css("--accent"); ctx.fillRect(x - barW / 2, y + 7, barW * cpuCount / 8, 8);
      label(ctx, "RAM", x - barW / 2, y + 30, { align: "left", size: 9, color: css("--viewer-muted") });
      ctx.fillStyle = css("--viewer-line"); ctx.fillRect(x - barW / 2, y + 39, barW, 8);
      ctx.fillStyle = css("--accent-2"); ctx.fillRect(x - barW / 2, y + 39, barW * (mode === "up" ? .9 : mode === "down" ? .38 : .65), 8);
    };

    if (mode === "up" || mode === "down") {
      const before = mode === "up" ? 150 : 220;
      const after = mode === "up" ? 220 : 150;
      drawNode(w * .30, centerY, before, false, "A");
      arrow(ctx, w * .43, centerY, w * .57, centerY, css("--accent"), 2.5);
      drawNode(w * .70, centerY, after, true, "A");
      label(ctx, mode === "up" ? "capacity ↑" : "right-size ↓", w / 2, centerY - 24, { size: 11, color: css("--accent") });
    } else {
      const countBefore = mode === "out" ? 2 : 5;
      const countAfter = mode === "out" ? 5 : 2;
      const drawCluster = (cx, count, active, caption) => {
        const gap = 10; const nodeSize = Math.min(100, (w * .36 - gap * (count - 1)) / count);
        const start = cx - ((nodeSize * count + gap * (count - 1)) / 2) + nodeSize / 2;
        for (let i = 0; i < count; i++) drawNode(start + i * (nodeSize + gap), centerY, nodeSize, active, i);
        label(ctx, caption, cx, centerY + 105, { size: 11, color: css("--viewer-muted") });
      };
      drawCluster(w * .26, countBefore, false, `${countBefore} Nodes`);
      arrow(ctx, w * .44, centerY, w * .56, centerY, css("--accent"), 2.5);
      drawCluster(w * .74, countAfter, true, `${countAfter} Nodes`);
    }
  });
  return () => { stop(); controls.removeEventListener("click", click); };
}
