import { css, roundRect, label, box, line, arrow, particle, createLoop, viewerShell, setDetails, activateButton } from "./canvas-utils.js";

export function mountScheduler(host) {
  const steps = [
    {
      title: "1. Job 제출",
      body: "사용자는 sbatch로 실행 명령과 자원 요구사항을 controller에 제출한다. 이 시점의 요청값이 이후 allocation과 accounting 해석의 기준이 된다.",
      rows: [["요청", "nodes, ntasks, cpus-per-task, memory, GPU, time limit 등"], ["확인", "sbatch 반환 job ID를 이후 모든 진단의 기준 키로 사용한다."], ["AA 관점", "script와 job ID 없이 원인부터 추측하지 않는다."]],
      note: "job script는 프로그램뿐 아니라 scheduler에 전달하는 자원 계약이다."
    },
    {
      title: "2. PENDING / Queue",
      body: "즉시 실행할 자원이 없거나 priority, dependency, QoS, reservation 조건을 만족하지 못하면 Job은 PENDING 상태에서 기다린다.",
      rows: [["첫 단서", "squeue의 REASON은 pending 원인을 좁히는 출발점이다."], ["주의", "PENDING은 곧 장애라는 뜻이 아니다."], ["확인", "scontrol show job으로 요청 자원, eligible time, dependency를 함께 확인한다."]],
      note: "Resources와 Priority는 서로 다른 대기 이유다."
    },
    {
      title: "3. Resource allocation",
      body: "slurmctld는 정책과 현재 가용 자원을 비교해 Job에 Node와 CPU/GPU/memory 범위를 할당한다. 이후 slurmd가 실제 실행을 준비한다.",
      rows: [["할당", "NodeList, NumCPUs, AllocTRES 등 실제 배정값을 확인한다."], ["경계", "scheduler 요청값과 Linux cgroup/affinity 제한이 실제 실행 경계를 만든다."], ["진단", "요청과 할당과 application 사용량을 같은 표에서 비교한다."]],
      note: "요청한 자원과 프로그램이 실제 사용하는 자원은 자동으로 같아지지 않는다."
    },
    {
      title: "4. RUNNING / Job step",
      body: "할당된 Compute Node에서 batch step과 srun job step이 실행된다. MPI/OpenMP/GPU binding과 환경 변수는 이 단계의 성능을 좌우한다.",
      rows: [["실행", "srun은 allocation 안에서 task/job step을 launch하는 데 사용된다."], ["관찰", "CPU affinity, rank placement, MaxRSS, GPU visibility를 확인한다."], ["실패", "한 rank 또는 한 Node의 실패가 전체 Job 실패로 전파될 수 있다."]],
      note: "RUNNING 상태만으로 자원이 효율적으로 사용되고 있다는 뜻은 아니다."
    },
    {
      title: "5. Accounting / 종료 분석",
      body: "종료 후에는 sacct로 state, elapsed, allocation, MaxRSS, exit code를 확인해 요청한 자원과 실제 사용량을 비교한다.",
      rows: [["정상", "COMPLETED와 ExitCode 0:0을 확인한다."], ["실패", "OOM, TIMEOUT, CANCELLED, FAILED 등 state를 stderr와 함께 시간순으로 본다."], ["개선", "반복 Job에서는 accounting 값을 right-sizing과 regression baseline으로 사용한다."]],
      note: "마지막 stderr 한 줄보다 scheduler state와 step별 accounting이 더 넓은 문맥을 준다."
    }
  ];
  const buttons = steps.map((_, i) => `<button class="viz-btn ${i === 0 ? "active" : ""}" data-step="${i}">${i + 1}</button>`).join("");
  const { canvas, controls } = viewerShell(host, "Slurm job lifecycle: request → allocation → execution", buttons, steps[0]);
  let step = 0;
  const click = event => {
    const button = event.target.closest("[data-step]");
    if (!button) return;
    step = Number(button.dataset.step);
    activateButton(controls, "[data-step]", step);
    setDetails(host, steps[step]);
  };
  controls.addEventListener("click", click);

  const stop = createLoop(canvas, (ctx, w, h, t) => {
    ctx.clearRect(0, 0, w, h);
    const pad = 22;
    const narrow = w < 610;
    const nodes = narrow
      ? [
          { x: pad, y: 24, w: w - pad * 2, h: 62, label: "Job script / sbatch" },
          { x: pad, y: 110, w: w - pad * 2, h: 74, label: "Queue · PENDING reason" },
          { x: pad, y: 208, w: w - pad * 2, h: 74, label: "slurmctld · scheduling" },
          { x: pad, y: 306, w: w - pad * 2, h: 78, label: "Compute Node · slurmd / cgroup" },
          { x: pad, y: 408, w: w - pad * 2, h: 56, label: "sacct · accounting" }
        ]
      : [
          { x: 24, y: 62, w: 142, h: 70, label: "Job script\nsbatch" },
          { x: w * .25 - 55, y: 192, w: 150, h: 86, label: "Queue\nPENDING reason" },
          { x: w * .49 - 68, y: 62, w: 162, h: 88, label: "slurmctld\nScheduler" },
          { x: w * .70 - 55, y: 192, w: 170, h: 92, label: "Compute Node\nslurmd + cgroup" },
          { x: w - 174, y: 62, w: 150, h: 70, label: "Accounting\nsacct" }
        ];

    const drawMulti = (n, active) => {
      roundRect(ctx, n.x, n.y, n.w, n.h, 8, active ? css("--viz-accent-bg") : css("--viz-node"), active ? css("--accent") : css("--viewer-line"));
      const parts = n.label.split("\n");
      parts.forEach((part, i) => label(ctx, part, n.x + n.w / 2, n.y + n.h / 2 + (i - (parts.length - 1) / 2) * 17, { size: i === 0 ? 12 : 10, color: i === 0 ? css("--viewer-text") : css("--viewer-muted"), maxWidth: n.w - 14 }));
    };
    nodes.forEach((n, i) => drawMulti(n, i <= step));

    for (let i = 0; i < nodes.length - 1; i++) {
      const a = nodes[i], b = nodes[i + 1];
      if (narrow) arrow(ctx, a.x + a.w / 2, a.y + a.h, b.x + b.w / 2, b.y - 5, i < step ? css("--accent") : css("--viewer-line"), 2);
      else arrow(ctx, a.x + a.w, a.y + a.h / 2, b.x, b.y + b.h / 2, i < step ? css("--accent") : css("--viewer-line"), 2);
    }

    if (!narrow) {
      label(ctx, "control plane", w * .46, 25, { size: 11, color: css("--viewer-muted") });
      label(ctx, "execution / data plane", w * .72, h - 30, { size: 11, color: css("--viewer-muted") });
    }

    if (step === 3) {
      const node = nodes[3];
      const pulse = .5 + .5 * Math.sin(t * 4);
      ctx.save(); ctx.globalAlpha = .35 + pulse * .55; ctx.strokeStyle = css("--accent-2"); ctx.lineWidth = 3;
      roundRect(ctx, node.x - 4, node.y - 4, node.w + 8, node.h + 8, 10, null, css("--accent-2")); ctx.restore();
    }
  });
  return () => { stop(); controls.removeEventListener("click", click); };
}
