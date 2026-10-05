import { css, roundRect, label, box, line, arrow, particle, createLoop, viewerShell, setDetails, activateButton } from "./canvas-utils.js";

export function mountMpi(host) {
  const details = {
    p2p: {
      title: "Point-to-point: rank 간 메시지",
      body: "MPI rank는 독립 process이므로 서로의 address space를 직접 읽지 않는다. 데이터를 전달하려면 source, destination, tag와 communicator에 맞는 send/receive가 연결되어야 한다.",
      rows: [
        ["같은 Node", "rank 간 데이터도 process memory boundary를 넘지만 shared-memory 최적화 transport가 사용될 수 있다."],
        ["다른 Node", "메시지는 NIC와 interconnect를 거쳐 상대 Node의 rank로 전달된다."],
        ["진단", "hang이 나면 어느 rank가 send/recv 또는 collective에서 기다리는지 rank별 progress를 비교한다."]
      ],
      note: "rank 수와 Node 수는 다른 개념이다. 하나의 Node에 여러 rank가 배치될 수 있다."
    },
    bcast: {
      title: "Broadcast: 한 root에서 전체 rank로",
      body: "MPI_Bcast 같은 collective는 communicator의 모든 참여 rank가 같은 collective 순서를 따라야 한다. 구현체는 단순한 root→모두 연결이 아니라 topology-aware tree 등을 사용할 수 있다.",
      rows: [
        ["Root", "한 rank가 초기 데이터를 제공한다."],
        ["참여", "communicator 안의 모든 rank가 collective 호출에 참여해야 한다."],
        ["성능", "message size, rank placement, network topology에 따라 collective algorithm의 효율이 달라진다."]
      ],
      note: "그림의 연결은 개념 모델이며 실제 MPI 구현의 알고리즘을 고정적으로 뜻하지 않는다."
    },
    allreduce: {
      title: "Allreduce: 전체 기여 + 전체 결과",
      body: "모든 rank의 값을 reduction하고 그 결과를 다시 모든 rank가 받는다. 분산 학습의 gradient reduction이나 수치 해석의 global norm 같은 패턴에서 자주 나타난다.",
      rows: [
        ["통신량", "rank 수가 늘수록 collective 비용과 topology 영향이 중요해진다."],
        ["동기화", "느린 rank 하나가 collective 완료 시간을 늦추는 straggler가 될 수 있다."],
        ["관찰", "placement, message size, collective 종류, transport를 함께 기록해 scale-out 저하를 해석한다."]
      ],
      note: "nonblocking collective도 호출 즉시 통신이 끝났다는 뜻은 아니며 completion을 확인해야 한다."
    }
  };

  const { canvas, controls } = viewerShell(host, "MPI rank와 통신 경계",
    `<button class="viz-btn active" data-mode="p2p">P2P</button>
     <button class="viz-btn" data-mode="bcast">Broadcast</button>
     <button class="viz-btn" data-mode="allreduce">Allreduce</button>`, details.p2p);
  let mode = "p2p";
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
    const pad = 20;
    const gap = Math.max(28, Math.min(54, w * .07));
    const nodeW = (w - pad * 2 - gap) / 2;
    const nodeH = h - 60;
    const top = 28;
    const nodes = [
      { x: pad, y: top, w: nodeW, h: nodeH },
      { x: pad + nodeW + gap, y: top, w: nodeW, h: nodeH }
    ];
    const ranks = [];

    nodes.forEach((node, ni) => {
      roundRect(ctx, node.x, node.y, node.w, node.h, 10, css("--viewer-side"), css("--viewer-line"));
      label(ctx, `Compute Node ${ni}`, node.x + 14, node.y + 18, { align: "left", size: 12, color: css("--viewer-muted") });
      for (let r = 0; r < 4; r++) {
        const cols = 2;
        const row = Math.floor(r / cols);
        const col = r % cols;
        const rw = (node.w - 34) / 2;
        const rh = 78;
        const x = node.x + 12 + col * (rw + 10);
        const y = node.y + 50 + row * (rh + 18);
        const rank = ni * 4 + r;
        roundRect(ctx, x, y, rw, rh, 7, css("--viz-node"), css("--viewer-line"));
        label(ctx, `rank ${rank}`, x + rw / 2, y + 20, { size: 12 });
        box(ctx, x + 10, y + 38, rw - 20, 27, "private memory", { size: 9 });
        ranks.push({ x: x + rw / 2, y: y + rh / 2, boxX: x, boxY: y, w: rw, h: rh, node: ni });
      }
      box(ctx, node.x + 14, node.y + node.h - 58, node.w - 28, 36, "NIC / MPI transport", { size: 10 });
    });

    const networkY = h - 18;
    line(ctx, nodes[0].x + nodes[0].w / 2, nodes[0].y + nodes[0].h, nodes[0].x + nodes[0].w / 2, networkY, css("--warning"), 2);
    line(ctx, nodes[1].x + nodes[1].w / 2, nodes[1].y + nodes[1].h, nodes[1].x + nodes[1].w / 2, networkY, css("--warning"), 2);
    line(ctx, nodes[0].x + nodes[0].w / 2, networkY, nodes[1].x + nodes[1].w / 2, networkY, css("--warning"), 3);
    label(ctx, "interconnect", w / 2, networkY - 10, { size: 10, color: css("--warning") });

    let edges = [];
    if (mode === "p2p") edges = [[0, 5]];
    if (mode === "bcast") edges = [[0,1],[0,2],[0,3],[0,4],[0,5],[0,6],[0,7]];
    if (mode === "allreduce") edges = Array.from({ length: 8 }, (_, i) => [i, (i + 1) % 8]);

    edges.forEach(([a, b], index) => {
      const ra = ranks[a], rb = ranks[b];
      const crossNode = ra.node !== rb.node;
      const color = crossNode ? css("--warning") : css("--accent");
      ctx.save();
      ctx.strokeStyle = color;
      ctx.lineWidth = mode === "p2p" ? 3 : 1.7;
      ctx.globalAlpha = mode === "p2p" || index % 2 === 0 ? .9 : .55;
      ctx.beginPath();
      ctx.moveTo(ra.x, ra.y);
      if (crossNode) {
        ctx.bezierCurveTo(ra.x, networkY - 50, rb.x, networkY - 50, rb.x, rb.y);
      } else {
        ctx.lineTo(rb.x, rb.y);
      }
      ctx.stroke();
      ctx.restore();
    });

    if (edges.length) {
      const e = edges[Math.floor(t * 1.5) % edges.length];
      const a = ranks[e[0]], b = ranks[e[1]];
      particle(ctx, a, b, (t * .7) % 1, css("--accent-2"));
    }
  });
  return () => { stop(); controls.removeEventListener("click", click); };
}
