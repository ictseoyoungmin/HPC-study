const sets = {
  fundamentals: {
    title: "GPU execution model",
    initial: "execution",
    views: {
      execution: {
        label: "Execution",
        title: "Grid → Block → Warp → Thread를 서로 다른 층으로 본다",
        intro: "Grid/Block/Thread는 programmer model이고 Warp/SM은 실제 실행 효율을 이해하는 데 필요한 hardware 관점이다.",
        items: [
          ["Grid", "한 kernel launch가 만드는 전체 block 집합", "문제 크기와 launch configuration의 경계"],
          ["Block", "함께 스케줄되고 shared memory를 공유할 수 있는 thread 묶음", "block resource 사용량이 residency를 제한할 수 있음"],
          ["Warp", "hardware가 명령을 발행하는 thread 실행 묶음", "분기 divergence와 latency hiding을 해석할 때 중요"],
          ["Thread", "개별 data element를 처리하는 논리 실행 단위", "모든 thread가 독립 Core를 의미하지는 않음"]
        ],
        note: "Occupancy는 동시 resident work의 여지를 보여 주지만 성능 그 자체는 아니다."
      },
      memory: {
        label: "Memory",
        title: "Capacity와 bandwidth를 분리해 memory hierarchy를 읽는다",
        intro: "가까운 memory일수록 보통 작고 제한적이며, 큰 device memory는 access pattern과 coalescing의 영향을 크게 받는다.",
        items: [
          ["Registers", "thread-private에 가까운 매우 작은 storage", "과도한 register 사용은 resident warp 수를 제한할 수 있음"],
          ["Shared memory / L1", "block 내 data reuse에 활용되는 on-chip 영역", "tile reuse와 synchronization 설계가 핵심"],
          ["L2 cache", "여러 SM이 공유하는 cache 계층", "reuse와 access pattern에 따라 global-memory traffic을 줄일 수 있음"],
          ["Device memory", "큰 capacity와 높은 peak bandwidth를 제공", "coalescing과 transaction efficiency가 effective bandwidth를 좌우"]
        ],
        note: "GPU memory 사용량 80%와 memory bandwidth utilization 80%는 전혀 다른 의미다."
      },
      pipeline: {
        label: "Pipeline",
        title: "GPU application은 kernel 하나가 아니라 end-to-end pipeline이다",
        intro: "낮은 GPU utilization을 볼 때 CPU 공급, transfer, kernel, synchronization을 먼저 분리한다.",
        items: [
          ["CPU prep", "input decode·preprocessing·launch 준비", "GPU가 기다리는 host-side gap을 만들 수 있음"],
          ["H2D", "host memory에서 device memory로 이동", "PCIe/NVLink path와 pinned memory가 영향을 줌"],
          ["Kernel", "GPU에서 실제 parallel compute 수행", "hot kernel일 때만 내부 metric으로 더 좁힘"],
          ["D2H / sync", "결과 회수와 dependency 완료 대기", "불필요한 global sync는 overlap을 끊을 수 있음"]
        ],
        note: "nvidia-smi의 순간 utilization보다 각 phase의 duration과 gap을 timeline에서 확인한다."
      }
    }
  },
  data: {
    title: "GPU data movement · Streams",
    initial: "serial",
    views: {
      serial: {
        label: "Serial",
        title: "순차 pipeline은 transfer 동안 compute가 쉬는 구간을 만든다",
        intro: "baseline에서는 H2D → Kernel → D2H가 어떤 순서와 길이로 실행되는지 먼저 기록한다.",
        items: [
          ["H2D", "입력 data를 GPU로 이동", "copy time"],
          ["Kernel", "GPU compute", "compute time"],
          ["D2H", "결과를 host로 회수", "copy + sync time"]
        ],
        note: "Overlap 개선을 주장하려면 먼저 순차 baseline과 동일한 correctness 조건을 가져야 한다."
      },
      overlap: {
        label: "Overlap",
        title: "Overlap은 stream 수보다 독립 chunk와 dependency가 결정한다",
        intro: "copy와 compute가 실제로 겹치려면 async-capable transfer, pinned memory, 독립 dependency, 충분한 granularity가 필요하다.",
        items: [
          ["Copy B", "다음 chunk의 H2D", "Kernel A와 겹칠 수 있는 후보"],
          ["Kernel A", "현재 chunk compute", "copy engine과 compute engine이 동시에 바쁜지 확인"],
          ["D2H A", "완료 chunk 회수", "불필요한 device-wide sync가 overlap을 막지 않는지 확인"]
        ],
        note: "API에 stream이 존재하는 것과 profiler timeline에서 동시 실행이 보이는 것은 별개의 사실이다."
      },
      unified: {
        label: "Unified",
        title: "Unified Memory는 주소 공간을 단순화하지만 page movement를 없애지 않는다",
        intro: "CPU와 GPU가 같은 managed address를 쓰더라도 실제 page placement와 migration은 workload access pattern에 따라 달라진다.",
        items: [
          ["Managed address", "CPU/GPU가 같은 pointer model을 사용", "programming convenience"],
          ["Page fault", "필요한 page가 현재 processor 쪽에 없을 때 fault 발생", "stall source"],
          ["Migration", "page가 host↔device 사이로 이동", "locality가 나쁘면 반복 이동 비용이 커질 수 있음"]
        ],
        note: "Unified Memory는 '복사가 없다'가 아니라 'placement와 이동을 runtime과 함께 관리한다'로 이해한다."
      }
    }
  },
  multi: {
    title: "Multi-GPU · NCCL · GPUDirect RDMA",
    initial: "topology",
    views: {
      topology: {
        label: "Topology",
        title: "같은 GPU 수라도 physical path가 다르면 communication cost가 달라진다",
        intro: "GPU↔GPU, GPU↔CPU socket, GPU↔NIC의 proximity를 rank placement와 함께 기록한다.",
        items: [
          ["GPU pair", "NVLink 또는 PCIe switch를 공유할 수 있음", "peer path"],
          ["CPU / NUMA", "GPU가 어느 socket/root complex에 가까운지 확인", "host staging과 affinity"],
          ["NIC / HCA", "multi-node traffic이 fabric으로 나가는 경계", "GPU↔NIC proximity"]
        ],
        note: "logical rank 수보다 rank→GPU→NIC의 실제 data path가 더 중요한 경우가 많다."
      },
      nccl: {
        label: "NCCL",
        title: "Collective는 slow rank와 slow link의 영향을 전체가 공유한다",
        intro: "AllReduce 같은 collective는 모든 participant의 진행이 완료되어야 다음 단계로 넘어갈 수 있다.",
        items: [
          ["Compute", "각 rank가 local 결과를 생성", "rank arrival time"],
          ["Collective", "ring/tree 등 topology-aware algorithm으로 data 교환", "message size와 transport"],
          ["Barrier effect", "늦은 participant를 다른 rank가 기다림", "tail rank가 step time을 결정할 수 있음"]
        ],
        note: "평균 utilization보다 rank별 collective duration과 tail participant를 먼저 본다."
      },
      gdr: {
        label: "GPUDirect RDMA",
        title: "GPUDirect RDMA는 host staging을 줄이는 network data path다",
        intro: "기능 존재 여부와 실제 runtime path 선택 여부를 구분한다.",
        items: [
          ["GPU memory", "network payload가 위치한 device memory", "source / destination"],
          ["NIC / HCA", "RDMA capable network device", "GPU와의 topology proximity가 중요"],
          ["Fabric", "remote node까지 data 전달", "driver·RDMA stack·library support가 함께 맞아야 함"]
        ],
        note: "GPUDirect는 MIG/MPS 같은 GPU sharing 기능과 다른 계층의 문제다."
      }
    }
  }
};

function render(host, set, viewId) {
  const view = set.views[viewId];
  host.querySelector("[data-gpu-title]").textContent = view.title;
  host.querySelector("[data-gpu-intro]").textContent = view.intro;
  host.querySelector("[data-gpu-flow]").innerHTML = view.items.map(([name, text, meta], index) => `
    <article class="gpu-flow-step">
      <span class="gpu-step-num">${String(index + 1).padStart(2,"0")}</span>
      <div><strong>${name}</strong><p>${text}</p><small>${meta}</small></div>
    </article>`).join("");
  host.querySelector("[data-gpu-note]").textContent = view.note;
  host.querySelectorAll("[data-gpu-view]").forEach(button => {
    button.classList.toggle("active", button.dataset.gpuView === viewId);
  });
}

export function mountGpuConcepts(host, kind = "fundamentals") {
  const set = sets[kind];
  host.innerHTML = `
    <div class="viz-shell textbook-viz gpu-concept-viz">
      <div class="viz-toolbar">
        <strong>${set.title}</strong>
        <div class="viz-controls">
          ${Object.entries(set.views).map(([id, view], index) => `<button class="viz-btn ${index === 0 ? "active" : ""}" type="button" data-gpu-view="${id}">${view.label}</button>`).join("")}
        </div>
      </div>
      <div class="gpu-concept-body">
        <header><h3 data-gpu-title></h3><p data-gpu-intro></p></header>
        <div class="gpu-flow" data-gpu-flow></div>
        <div class="gpu-concept-note"><b>해석 기준</b><span data-gpu-note></span></div>
      </div>
    </div>`;

  let viewId = set.initial;
  render(host, set, viewId);
  const click = event => {
    const button = event.target.closest("[data-gpu-view]");
    if (!button) return;
    viewId = button.dataset.gpuView;
    render(host, set, viewId);
  };
  host.addEventListener("click", click);
  return () => host.removeEventListener("click", click);
}
