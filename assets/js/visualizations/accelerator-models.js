function mountCardFlow(host, config) {
  host.innerHTML = `
    <div class="viz-shell textbook-viz accelerator-model-viz">
      <div class="viz-toolbar"><strong>${config.toolbar}</strong></div>
      <div class="accelerator-model-body">
        <header><h3>${config.title}</h3><p>${config.intro}</p></header>
        <div class="accelerator-model-grid">
          ${config.items.map((item, index) => `
            <article class="accelerator-model-card">
              <span>${String(index + 1).padStart(2,"0")}</span>
              <div><strong>${item[0]}</strong><p>${item[1]}</p><small>${item[2]}</small></div>
            </article>`).join("")}
        </div>
        <div class="gpu-concept-note"><b>${config.noteLabel}</b><span>${config.note}</span></div>
      </div>
    </div>`;
  return () => {};
}

export function mountDistributedTraining(host) {
  return mountCardFlow(host, {
    toolbar: "Distributed training step",
    title: "GPU만 보지 않고 CPU · Network · Storage까지 한 step으로 묶어 본다",
    intro: "각 phase가 어느 resource를 주로 사용하고 다음 phase를 무엇이 기다리게 하는지 연결하면 low GPU utilization과 step jitter를 더 정확히 해석할 수 있다.",
    items: [
      ["Data load", "storage에서 sample을 읽고 decode·augment·batch한다.", "CPU + Storage"],
      ["H2D", "prepared batch를 GPU memory로 이동한다.", "CPU memory + PCIe/NVLink"],
      ["Forward", "model의 forward compute를 수행한다.", "GPU compute + memory"],
      ["Backward", "gradient를 계산한다.", "GPU compute + memory"],
      ["AllReduce", "data-parallel rank의 gradient를 동기화한다.", "GPU + NCCL + Network"],
      ["Optimizer", "parameter update를 수행한다.", "GPU/CPU depending on stack"],
      ["Checkpoint", "model과 optimizer state를 persistent storage에 기록한다.", "Storage burst I/O"]
    ],
    noteLabel: "RCA 기준",
    note: "slow step은 평균 GPU utilization보다 가장 늦어진 phase와 tail rank, 그리고 그 시점의 network/storage 상태를 함께 본다."
  });
}

export function mountContainerBoundary(host) {
  return mountCardFlow(host, {
    toolbar: "HPC container boundary",
    title: "Image가 포함하는 것과 Host가 제공하는 것을 분리한다",
    intro: "Container는 application user space를 묶지만 host kernel, GPU device/driver, fabric과 scheduler integration까지 완전히 대체하지는 않는다.",
    items: [
      ["Image user space", "application, runtime library, package와 설정을 image에 포함한다.", "Container-owned"],
      ["Bind mounts", "home, project, scratch, data 같은 host path가 container 안에 노출된다.", "Host ↔ Container boundary"],
      ["Kernel", "container process는 host kernel 위에서 실행된다.", "Host-provided"],
      ["GPU device / driver", "device visibility와 driver compatibility는 host 환경에 의존한다.", "Host-provided + passthrough"],
      ["MPI / PMIx / Fabric", "multi-node에서는 scheduler와 high-speed transport integration이 추가된다.", "Site integration"],
      ["Provenance", "image digest와 host driver/module/allocation을 함께 기록한다.", "Reproducibility metadata"]
    ],
    noteLabel: "진단 순서",
    note: "image → bind → device/driver → MPI/transport 순서로 경계를 하나씩 확인하면 'container라서 안 된다'는 모호한 결론을 피할 수 있다."
  });
}
