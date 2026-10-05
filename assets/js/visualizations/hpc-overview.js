const copy = {
  system: {
    title: "Job의 실행 경로를 계층으로 본다",
    body: "사용자의 application은 scheduler를 통해 compute resource를 할당받고, 실제 계산은 compute node에서 수행된다. 노드 사이 통신과 shared storage I/O는 별도의 공용 경로다.",
    rows: [
      ["Control", "User / login → scheduler → allocation"],
      ["Compute", "CPU · Memory · GPU on compute node"],
      ["Communication", "Interconnect / fabric between nodes"],
      ["I/O", "Shared / parallel storage"]
    ],
    note: "같은 '느림'이라도 queue, compute, communication, I/O 중 어느 구간이 늘었는지 먼저 나누면 조사 범위가 크게 줄어든다."
  },
  aa: {
    title: "AA는 증상에서 계층별 증거로 내려간다",
    body: "AA의 핵심은 특정 원인을 빨리 찍는 것이 아니라 증상을 재현 가능한 사건으로 고정하고, 각 계층의 가설을 증거로 확인하거나 기각하는 것이다.",
    rows: [
      ["1 · Symptom", "언제부터 무엇이 얼마나 달라졌는가"],
      ["2 · Evidence", "job ID · time · node · script · stdout/stderr"],
      ["3 · Compare", "정상 baseline과 문제 run의 차이"],
      ["4 · Narrow", "차이가 있는 계층만 더 깊게 조사"]
    ],
    note: "모든 도구를 한 번씩 실행하는 것이 아니라 현재 가설을 판별하는 데 필요한 관찰만 선택한다."
  }
};

export function mountHpcOverview(host) {
  host.innerHTML = `
    <div class="viz-shell textbook-viz">
      <div class="viz-toolbar">
        <strong>HPC system map · job은 어디를 지나가는가</strong>
        <div class="viz-controls">
          <button class="viz-btn active" data-mode="system">System path</button>
          <button class="viz-btn" data-mode="aa">AA diagnostic</button>
        </div>
      </div>
      <div class="viz-layout">
        <div class="system-map-stage">
          <div class="system-map" data-map>
            <div class="system-map-node map-user active" data-part="user">
              <strong>User / Application</strong>
              <span>input · executable · job script</span>
            </div>
            <div class="map-arrow a" aria-hidden="true"></div>
            <div class="system-map-node map-scheduler active" data-part="scheduler">
              <strong>Scheduler</strong>
              <span>queue · policy · resource allocation</span>
            </div>
            <div class="map-arrow b" aria-hidden="true"></div>
            <div class="system-map-node map-compute active" data-part="compute">
              <strong>Compute Node(s)</strong>
              <span>actual execution</span>
              <div class="compute-stack">
                <div class="compute-chip">CPU / Cache</div>
                <div class="compute-chip">Memory / NUMA</div>
                <div class="compute-chip">GPU</div>
                <div class="compute-chip">Local I/O</div>
              </div>
            </div>
            <div class="map-services">
              <div class="map-service" data-part="network">
                <i>NET</i>
                <div><strong>Interconnect / Fabric</strong><span>MPI · RDMA · distributed communication</span></div>
              </div>
              <div class="map-service" data-part="storage">
                <i>I/O</i>
                <div><strong>Shared / Parallel Storage</strong><span>input · checkpoint · result · metadata</span></div>
              </div>
            </div>
          </div>
        </div>
        <aside class="viz-explain" aria-live="polite">
          <h3 data-title></h3>
          <p data-body></p>
          <dl data-rows></dl>
          <div class="viz-note" data-note></div>
        </aside>
      </div>
    </div>`;

  const controls = host.querySelector(".viz-controls");
  const title = host.querySelector("[data-title]");
  const body = host.querySelector("[data-body]");
  const rows = host.querySelector("[data-rows]");
  const note = host.querySelector("[data-note]");
  const mapNodes = [...host.querySelectorAll("[data-part]")];

  function setMode(mode) {
    controls.querySelectorAll("[data-mode]").forEach(button => button.classList.toggle("active", button.dataset.mode === mode));
    const item = copy[mode];
    title.textContent = item.title;
    body.textContent = item.body;
    rows.innerHTML = item.rows.map(([key, value]) => `<div><dt>${key}</dt><dd>${value}</dd></div>`).join("");
    note.textContent = item.note;
    mapNodes.forEach(node => node.classList.toggle("active", mode === "system" ? true : ["user","scheduler","compute"].includes(node.dataset.part)));
  }

  const onClick = event => {
    const button = event.target.closest("[data-mode]");
    if (button) setMode(button.dataset.mode);
  };

  controls.addEventListener("click", onClick);
  setMode("system");
  return () => controls.removeEventListener("click", onClick);
}
