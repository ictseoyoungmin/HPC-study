function esc(value) {
  return String(value ?? "").replace(/[&<>\"]/g, ch => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;" }[ch]));
}

function shell(host, title, buttons, render, initial) {
  host.innerHTML = `
    <div class="viz-shell textbook-viz dom-teaching-viz">
      <div class="viz-toolbar">
        <strong>${esc(title)}</strong>
        <div class="viz-controls">${buttons}</div>
      </div>
      <div class="viz-layout">
        <div class="system-os-stage" data-stage></div>
        <aside class="viz-explain" aria-live="polite">
          <h3 data-title></h3>
          <p data-body></p>
          <dl data-rows></dl>
          <div class="viz-note" data-note></div>
        </aside>
      </div>
    </div>`;

  let mode = initial;
  const controls = host.querySelector(".viz-controls");
  const stage = host.querySelector("[data-stage]");

  function setDetails(detail) {
    host.querySelector("[data-title]").textContent = detail.title;
    host.querySelector("[data-body]").textContent = detail.body;
    host.querySelector("[data-rows]").innerHTML = (detail.rows || []).map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join("");
    const note = host.querySelector("[data-note]");
    note.textContent = detail.note || "";
    note.hidden = !detail.note;
  }

  function activate(next) {
    mode = next;
    controls.querySelectorAll("[data-mode]").forEach(button => button.classList.toggle("active", button.dataset.mode === mode));
    const result = render(mode);
    stage.innerHTML = result.html;
    setDetails(result.detail);
  }

  const click = event => {
    const button = event.target.closest("[data-mode]");
    if (button) activate(button.dataset.mode);
  };
  controls.addEventListener("click", click);
  activate(initial);
  return () => controls.removeEventListener("click", click);
}

const processDetails = {
  tree: {
    title: "Process와 thread를 계층으로 읽는다",
    body: "job 안에서 process와 thread가 어떻게 중첩되는지 먼저 구분한다. MPI rank는 보통 별도 process이고, 각 rank 안에서 OpenMP thread가 추가될 수 있다.",
    rows: [["PID / PPID", "process와 parent-child 관계"], ["TID", "하나의 process 안의 thread 식별"], ["AA 질문", "몇 개의 rank와 몇 개의 thread가 실제로 생성됐는가?"]],
    note: "process 수, thread 수, Slurm task 수를 같은 말로 사용하지 않는다."
  },
  state: {
    title: "Task state는 '멈춤'을 구체적인 대기로 바꾼다",
    body: "CPU 사용률이 낮다는 사실만으로 idle을 의미하지 않는다. R/S/D/Z 같은 상태는 실행 가능, 일반 sleep, uninterruptible wait, 종료 후 미수거 상태를 구분한다.",
    rows: [["R", "running 또는 runnable"], ["S", "interruptible sleep"], ["D", "I/O·kernel path의 uninterruptible wait 후보"], ["Z", "종료되었지만 parent가 아직 wait하지 않은 zombie"]],
    note: "D state가 지속되면 storage·filesystem·device evidence와 같은 시간축으로 본다."
  },
  limits: {
    title: "FD와 resource limit은 규모가 커질 때 드러난다",
    body: "작은 테스트에서는 충분하던 open files나 process limit도 rank·socket·checkpoint 수가 늘면 먼저 포화될 수 있다.",
    rows: [["FD", "file, socket, pipe 같은 열린 kernel object handle"], ["nofile", "process가 열 수 있는 file descriptor 상한"], ["nproc / stack", "process/thread 규모와 stack 사용에 영향을 주는 대표 limit"]],
    note: "shell ulimit과 실제 job process의 /proc/PID/limits가 같은지 확인한다."
  }
};

export function mountProcessModel(host) {
  const buttons = `
    <button class="viz-btn active" data-mode="tree">Process tree</button>
    <button class="viz-btn" data-mode="state">Task state</button>
    <button class="viz-btn" data-mode="limits">Limits</button>`;

  return shell(host, "Linux process model", buttons, mode => {
    if (mode === "tree") return {
      detail: processDetails.tree,
      html: `
        <div class="process-tree-map">
          <div class="dom-node job-node"><small>Slurm Job</small><strong>allocation / step</strong></div>
          <div class="dom-down"></div>
          <div class="rank-row">
            ${[0,1].map(rank => `<div class="rank-card"><small>MPI Rank ${rank}</small><strong>Process · PID</strong><div class="thread-row"><span>Thread 0</span><span>Thread 1</span><span>Thread 2</span></div></div>`).join("")}
          </div>
          <div class="dom-caption">별도 process의 주소 공간 ↔ process 내부 thread의 공유 주소 공간</div>
        </div>`
    };
    if (mode === "state") return {
      detail: processDetails.state,
      html: `
        <div class="state-map">
          ${[
            ["R", "Runnable", "CPU를 사용 중이거나 run queue에서 대기"],
            ["S", "Sleep", "event·timer 등을 interruptible하게 대기"],
            ["D", "Uninterruptible wait", "I/O 또는 kernel path 대기 후보"],
            ["Z", "Zombie", "종료됐지만 parent가 아직 수거하지 않음"]
          ].map(([code, title, body]) => `<article class="state-card"><b>${code}</b><div><strong>${title}</strong><span>${body}</span></div></article>`).join("")}
        </div>`
    };
    return {
      detail: processDetails.limits,
      html: `
        <div class="limit-map">
          <div class="dom-node"><small>Application process</small><strong>PID 24831</strong></div>
          <div class="limit-bars">
            <div><span>Open FDs</span><i style="--p:42%"></i><b>420 / 1024</b></div>
            <div><span>Processes</span><i style="--p:18%"></i><b>36 / 200</b></div>
            <div><span>Stack</span><i style="--p:55%"></i><b>illustrative</b></div>
          </div>
          <div class="dom-caption">수치는 개념 예시다. 실제 값은 /proc/PID/limits와 현재 사용량을 확인한다.</div>
        </div>`
    };
  }, "tree");
}

const controlDetails = {
  allocation: {
    title: "Cluster allocation과 kernel execution은 다른 계층이다",
    body: "Slurm은 어떤 job에 자원을 배정할지 결정한다. 실제 node 안에서는 Linux kernel scheduler가 허용된 CPU 집합 안에서 task를 실행한다.",
    rows: [["Slurm", "request → allocation → job step"], ["Kernel", "runnable task를 실제 CPU에 배치"], ["Affinity", "kernel scheduler가 선택할 수 있는 CPU 범위를 제한"]],
    note: "'8 CPUs 할당'과 '8 physical cores가 항상 100% 동시 실행'을 같은 뜻으로 보지 않는다."
  },
  cgroup: {
    title: "cgroup이 job의 실제 CPU·memory 경계를 집행할 수 있다",
    body: "scheduler plugin은 job process를 cgroup에 넣고 cpuset이나 memory limit을 적용할 수 있다. 그래서 node 전체 자원과 process가 보거나 사용할 수 있는 자원이 다를 수 있다.",
    rows: [["cpuset", "허용 CPU·NUMA node 범위"], ["memory", "job/process group memory limit과 accounting"], ["확인", "/proc/self/cgroup, Cpus_allowed_list, Mems_allowed_list"]],
    note: "resource mismatch는 scheduler allocation과 kernel cgroup을 한 체인으로 비교한다."
  },
  isolation: {
    title: "Namespace는 view를, systemd는 service lifecycle을 관리한다",
    body: "container 내부 process는 PID·mount·network namespace 때문에 host와 다른 view를 볼 수 있다. 반면 systemd와 journal은 node daemon과 service 상태를 운영 시간축에 연결한다.",
    rows: [["Namespace", "PID / mount / network 등 kernel resource view 격리"], ["systemd", "service start/stop/failure와 dependency 관리"], ["journal", "service·kernel event timestamp를 job과 대조"]],
    note: "container 내부 관찰과 host 관찰을 구분하고, service event는 job 실패 시각과 맞춘다."
  }
};

export function mountOsControl(host) {
  const buttons = `
    <button class="viz-btn active" data-mode="allocation">Allocation</button>
    <button class="viz-btn" data-mode="cgroup">cgroup</button>
    <button class="viz-btn" data-mode="isolation">Namespace / service</button>`;

  return shell(host, "Linux OS control path", buttons, mode => {
    if (mode === "allocation") return {
      detail: controlDetails.allocation,
      html: `<div class="control-flow">
        <div class="dom-node"><small>User request</small><strong>sbatch / srun</strong></div><div class="dom-right"></div>
        <div class="dom-node accent"><small>Slurm</small><strong>Allocation</strong></div><div class="dom-right"></div>
        <div class="dom-node"><small>Linux kernel</small><strong>Scheduler + affinity</strong></div><div class="dom-right"></div>
        <div class="dom-node"><small>Hardware</small><strong>CPU cores</strong></div>
      </div>`
    };
    if (mode === "cgroup") return {
      detail: controlDetails.cgroup,
      html: `<div class="cgroup-map">
        <div class="dom-node accent"><small>Job cgroup</small><strong>resource boundary</strong></div>
        <div class="cgroup-grid">
          <article><strong>cpuset</strong><span>CPU 16–23<br>NUMA node 1</span></article>
          <article><strong>memory</strong><span>limit + accounting</span></article>
          <article><strong>devices / I/O</strong><span>site policy에 따라 적용</span></article>
        </div>
        <div class="dom-down"></div>
        <div class="process-pills"><span>rank 0</span><span>rank 1</span><span>rank 2</span><span>rank 3</span></div>
      </div>`
    };
    return {
      detail: controlDetails.isolation,
      html: `<div class="isolation-map">
        <div class="host-frame">
          <small>Host</small>
          <div class="isolation-cols">
            <div class="namespace-box"><strong>Container view</strong><span>PID namespace</span><span>Mount namespace</span><span>Network namespace</span></div>
            <div class="service-box"><strong>systemd / journal</strong><span>slurmd.service</span><span>mount service</span><span>kernel events</span></div>
          </div>
        </div>
        <div class="dom-caption">격리된 process view와 host service 상태는 서로 다른 관찰면이다.</div>
      </div>`
    };
  }, "allocation");
}
