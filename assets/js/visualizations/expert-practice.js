const h = (tag, cls, html) => {
  const el = document.createElement(tag);
  if (cls) el.className = cls;
  if (html !== undefined) el.innerHTML = html;
  return el;
};

function shell(host, kicker, title, intro) {
  const root = h("div", "viz-shell textbook-viz expert-viz");
  root.innerHTML = `<div class="viz-toolbar"><strong>${kicker}</strong></div>`;
  const body = h("div", "expert-viz-body");
  body.append(h("header", "expert-viz-head", `<h3>${title}</h3><p>${intro}</p>`));
  root.append(body);
  host.replaceChildren(root);
  return body;
}

function note(body, label, text) {
  body.append(h("div", "expert-note", `<strong>${label}</strong><span>${text}</span>`));
}

function cards(body, items, cls = "expert-card-grid") {
  const grid = h("div", cls);
  for (const [index, item] of items.entries()) {
    grid.append(h("article", "expert-card", `<span>${String(index + 1).padStart(2,"0")}</span><div><strong>${item[0]}</strong><p>${item[1]}</p>${item[2] ? `<small>${item[2]}</small>` : ""}</div>`));
  }
  body.append(grid);
}

function mountWorkloads(host) {
  const body = shell(host, "Resource signature", "Application 이름 대신 자원 사용의 모양을 본다", "Archetype은 첫 가설을 만드는 도구다. 실제 판단은 phase-aligned telemetry에서 compute · memory · network · storage · GPU 축을 비교해 만든다.");
  const axes = [
    ["Compute", "CPU/GPU가 실제 연산으로 바쁜가?", "IPC · kernel time · FLOP/s"],
    ["Memory", "capacity가 아니라 bandwidth·locality가 제한하는가?", "RSS · bandwidth · NUMA · cache"],
    ["Network", "통신과 synchronization이 scale-out을 제한하는가?", "MPI wait · message size · tail rank"],
    ["Storage", "metadata·throughput·latency가 phase를 멈추는가?", "I/O wait · checkpoint · small files"],
    ["GPU", "device가 일을 받지 못하는가, kernel이 오래 걸리는가?", "timeline · occupancy · transfer"]
  ];
  cards(body, axes, "expert-axis-grid");
  const phases = h("div", "expert-phase-row");
  ["Input / Init","Compute","Communication","Checkpoint","Finalize"].forEach((p,i)=>phases.append(h("div","expert-phase",`<span>Phase ${i+1}</span><strong>${p}</strong>`)));
  body.append(phases);
  note(body, "읽는 법", "전체-job 평균보다 phase마다 어느 축이 dominant한지 먼저 표시하고, 정상 run과 문제 run의 signature가 어디서 갈라지는지 찾는다.");
  return () => {};
}

function mountCapacity(host) {
  const body = shell(host, "Capacity decision", "Utilization 숫자를 서비스 목표로 착각하지 않는다", "Capacity는 장비를 최대한 바쁘게 만드는 문제가 아니라 demand distribution, queue latency, fragmentation, headroom을 함께 맞추는 문제다.");
  cards(body, [
    ["Demand distribution", "P50/P95 node·CPU·memory·GPU·runtime 요구를 분포로 본다.", "평균값만 보지 않는다."],
    ["Service objective", "queue wait, throughput, completion time, availability 목표를 정의한다.", "사용자 체감 품질의 기준."],
    ["Fragmentation", "free resource가 있어도 shape가 맞지 않아 job이 시작하지 못하는지 확인한다.", "특히 large-memory / multi-GPU."],
    ["Headroom", "burst, failure, maintenance와 demand growth를 흡수할 여유를 남긴다.", "100% utilization ≠ 최적."],
    ["Acceptance", "microbenchmark + representative workload + stability + operations를 검증한다.", "사전 정의 기준으로 승인."],
    ["Decision", "right-sizing, policy, node shape, 증설 중 어떤 수단이 gap을 줄이는지 비교한다.", "비용과 blast radius 포함."]
  ]);
  note(body, "판단 기준", "'GPU 92% 사용' 같은 단일 수치보다 queue P95와 pending reason, job-size distribution이 서비스 목표에서 얼마나 벗어났는지를 증설 근거로 쓴다.");
  return () => {};
}

function mountRegression(host) {
  const body = shell(host, "Regression governance", "느려졌다는 느낌을 재현 가능한 change decision으로 바꾼다", "한 번의 slow run이 아니라 baseline distribution과 noise floor를 넘는 지속적인 이동인지 확인하고, 환경과 변경점을 한 계층씩 좁힌다.");
  const flow = h("div", "expert-flow");
  [
    ["Baseline", "동일 조건 반복 측정 · median/p95 · correctness"],
    ["Fingerprint", "kernel · compiler · MPI · library · affinity · input"],
    ["Detect", "noise floor를 넘는 effect size인지 확인"],
    ["Localize", "compute / communication / I/O phase 중 어디가 이동했는지 분리"],
    ["Bisect", "한 번에 한 계층만 바꿔 change point를 좁힘"],
    ["Decide", "rollback · accept · workaround를 impact와 risk로 결정"]
  ].forEach(([a,b],i)=>flow.append(h("article","expert-flow-step",`<span>${i+1}</span><strong>${a}</strong><p>${b}</p>`)));
  body.append(flow);
  note(body, "Governance", "성능 회귀가 확인되어도 security·correctness 개선의 비용일 수 있다. 원인 확인과 운영 결정은 분리해서 기록한다.");
  return () => {};
}

function mountCommunication(host) {
  const body = shell(host, "Ticket → Postmortem", "사실과 가설을 분리하면 root cause 확정 전에도 좋은 운영 문서가 된다", "Ticket은 로그 저장소가 아니라 의사결정 기록이고, postmortem은 blame 문서가 아니라 detection과 prevention을 개선하는 feedback loop다.");
  const cols = h("div", "expert-three-col");
  const groups = [
    ["확인된 사실", ["Symptom", "Impact", "Scope", "Timestamp / Job / Node"]],
    ["현재 판단", ["Evidence", "Hypothesis", "Confidence", "다음 검증"]],
    ["종결과 학습", ["Corrective action", "Validation", "Detection gap", "Action item + owner"]]
  ];
  for (const [title, rows] of groups) cols.append(h("section","expert-column",`<h4>${title}</h4>${rows.map(x=>`<div>${x}</div>`).join("")}`));
  body.append(cols);
  note(body, "사용자 업데이트", "확인된 사실 → 현재 영향 → 가설 → 다음 확인 단계 → 다음 업데이트 조건의 순서로 쓰면 불확실성을 숨기지 않으면서도 행동 가능한 정보를 제공할 수 있다.");
  return () => {};
}

function mountRoadmap(host) {
  const body = shell(host, "30 / 60 / 90", "학습 목표를 '아는 챕터 수'가 아니라 '독립적으로 닫을 수 있는 incident 범위'로 정의한다", "각 단계는 더 위험한 명령을 배우는 방향이 아니라 더 넓은 영향 범위를 안전하게 판단하고 communication까지 책임지는 방향으로 확장된다.");
  const row = h("div", "expert-roadmap");
  [
    ["0–30일", "관찰", "Linux · cluster map · Slurm lifecycle", "상태를 안전하고 정확하게 설명"],
    ["31–60일", "분류", "MPI/OpenMP · NUMA · storage/network", "symptom을 subsystem hypothesis로 분해"],
    ["61–90일", "독립 종결", "profiling · GPU · runbook · RCA", "조치·validation·사용자 업데이트까지 완료"],
    ["90일 이후", "서비스 판단", "capacity · policy · regression governance", "trade-off · blast radius · rollback까지 설명"]
  ].forEach(([time,level,learn,outcome])=>row.append(h("article","expert-roadmap-card",`<span>${time}</span><strong>${level}</strong><p>${learn}</p><small>${outcome}</small>`)));
  body.append(row);
  note(body, "성장 기준", "필요한 순간에 escalation하는 것도 역량이다. 권한·위험·영향 범위를 넘어서는 문제를 충분한 evidence와 함께 넘기는 것이 안전한 운영이다.");
  return () => {};
}

function mountSelftest(host) {
  const body = shell(host, "Incident drill", "정답 명령 하나가 아니라 다음 분기를 설명한다", "실무형 self-test는 symptom에서 competing hypothesis를 만들고 next-best-test를 선택한 뒤 새 evidence에 따라 판단을 갱신하는 훈련이다.");
  const flow = h("div", "expert-decision");
  [
    ["1. Symptom", "무엇이 기대와 다른가?"],
    ["2. Hypotheses", "서로 다른 subsystem 원인 후보를 2~4개 만든다."],
    ["3. Next-best-test", "후보를 가장 잘 구분하는 안전한 관찰을 고른다."],
    ["4. Interpret", "결과가 어떤 가설을 지지·반박하는지 말한다."],
    ["5. Update", "confidence와 다음 test를 갱신한다."],
    ["6. Stop / Act", "증거가 충분하면 조치하고, 위험·권한 경계면 escalation한다."]
  ].forEach(([a,b])=>flow.append(h("article","expert-decision-step",`<strong>${a}</strong><p>${b}</p>`)));
  body.append(flow);
  note(body, "채점 기준", "좋은 답은 command 이름보다 '왜 이 test인지', '이 결과면 무엇이 바뀌는지', '어디서 멈추는지'를 설명한다.");
  return () => {};
}

function mountReference(host) {
  const body = shell(host, "Reference authority", "질문에 맞는 authority를 고른다", "HPC는 upstream specification, implementation documentation, local policy, 설치된 version의 help가 서로 다른 범위를 결정한다.");
  const stack = h("div", "expert-authority-stack");
  [
    ["Specification / Standard", "MPI semantics · OpenMP API", "무엇을 의미하는가"],
    ["Implementation docs", "Open MPI · MPICH · Slurm · CUDA/ROCm", "이 구현에서 어떻게 동작하는가"],
    ["Local site policy", "partition · QoS · module · filesystem · security", "이 사이트에서 무엇이 허용·구성되어 있는가"],
    ["Installed version", "--help · man · version output", "지금 이 시스템의 실제 option과 기본값은 무엇인가"]
  ].forEach(([a,b,c])=>stack.append(h("article","expert-authority",`<strong>${a}</strong><p>${b}</p><small>${c}</small>`)));
  body.append(stack);
  note(body, "Command index", "도구 이름순보다 symptom → 관찰 목적 → command → 위험도/권한 → 해석 → 다음 분기 순으로 정리하면 실제 troubleshooting에서 더 유용하다.");
  return () => {};
}

const mounts = {
  workloads: mountWorkloads,
  capacity: mountCapacity,
  regression: mountRegression,
  "ticket-postmortem": mountCommunication,
  roadmap: mountRoadmap,
  selftest: mountSelftest,
  reference: mountReference
};

export function mountExpertPractice(host, mode) {
  return (mounts[mode] || mountSelftest)(host);
}
