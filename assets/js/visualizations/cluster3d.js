let THREE = null;

async function loadThree() {
  if (THREE) return THREE;
  THREE = await import("https://cdn.jsdelivr.net/npm/three@0.180.0/+esm");
  return THREE;
}

function setCopy(host, item) {
  host.querySelector("[data-title]").textContent = item.title;
  host.querySelector("[data-body]").textContent = item.body;
  host.querySelector("[data-relation]").textContent = item.relation;
  host.querySelector("[data-boundary]").textContent = item.boundary;
  host.querySelector("[data-perf]").textContent = item.performance;
  host.querySelector("[data-observe]").textContent = item.observe;
  host.querySelectorAll("[data-level]").forEach(button => button.classList.toggle("active", button.dataset.level === item.id));
  host.querySelectorAll("[data-path-step]").forEach(step => step.classList.toggle("active", step.dataset.pathStep === item.id));
}

export async function mountCluster3D(host) {
  const copy = {
    core: {
      id: "core",
      title: "Core: 실제 명령을 실행하는 계산 단위",
      body: "Core는 CPU 내부에서 instruction을 실행하는 물리 계산 자원이다. 여러 Core가 동시에 서로 다른 thread나 process를 실행할 수 있지만, 상위 cache와 memory path 일부는 공유한다.",
      relation: "여러 Core → 하나의 CPU/Socket",
      boundary: "같은 CPU 안에서는 일부 cache와 memory controller 경로를 공유한다.",
      performance: "프로그램에 충분한 병렬 작업이 없으면 Core 수를 늘려도 추가 Core가 유휴 상태가 된다.",
      observe: "밝게 표시된 작은 Core 하나와 그 Core가 속한 CPU, Node의 포함 관계를 본다."
    },
    cpu: {
      id: "cpu",
      title: "CPU / Socket: Core와 cache를 묶는 프로세서",
      body: "하나의 CPU package 또는 Socket에는 여러 Core, cache 계층, memory controller가 포함된다. 다중 Socket Node에서는 각 Socket과 가까운 memory 영역이 달라져 NUMA 구조가 생길 수 있다.",
      relation: "Core 여러 개 + cache + memory controller → CPU/Socket",
      boundary: "같은 Socket의 Core는 일부 cache와 memory path를 공유한다.",
      performance: "Socket 경계를 넘는 thread와 memory 배치는 NUMA locality와 bandwidth에 영향을 준다.",
      observe: "한 CPU 위의 Core 묶음과 CPU 바로 옆의 memory bank를 함께 본다."
    },
    node: {
      id: "node",
      title: "Node: CPU와 memory를 가진 독립 서버",
      body: "Node는 CPU, DRAM, NIC, OS를 가진 하나의 독립 컴퓨터다. OpenMP thread 같은 shared-memory 실행은 보통 이 Node의 주소 공간 안에서 이루어진다.",
      relation: "CPU/Socket + DRAM + NIC + OS → Compute Node",
      boundary: "Node 내부 memory는 직접 주소화할 수 있지만 다른 Node의 memory는 일반적인 load/store로 직접 공유하지 않는다.",
      performance: "Node 내부에서는 NUMA와 memory bandwidth, Node 밖으로 나가면 network communication 비용이 주요 변수다.",
      observe: "선택된 Node 안의 CPU, memory bank, NIC가 하나의 실행 단위를 이루는 것을 본다."
    },
    cluster: {
      id: "cluster",
      title: "Cluster: 여러 Node와 공용 서비스를 연결한 시스템",
      body: "HPC Cluster는 Compute Node들을 고속 interconnect로 연결하고 scheduler, login/service node, shared storage 같은 공용 서비스를 결합한 시스템이다. 계산은 Node에 분산되고 데이터는 network와 filesystem 경계를 이동한다.",
      relation: "Compute Nodes + interconnect + scheduler/service + shared storage → Cluster",
      boundary: "Node 사이에는 distributed-memory 경계가 있으므로 MPI 같은 message passing이 필요하다.",
      performance: "Node 수를 늘릴수록 계산 자원은 늘지만 communication, synchronization, shared I/O 비용도 함께 증가한다.",
      observe: "Node 간 녹색 interconnect와 움직이는 packet이 scale-out 시 추가되는 데이터 경로를 나타낸다."
    }
  };

  host.innerHTML = `
    <div class="viz-shell textbook-viz">
      <div class="viz-toolbar">
        <strong>클러스터 구조: Core → CPU → Node → Cluster</strong>
        <div class="viz-controls" data-levels>
          <button class="viz-btn active" data-level="core">Core</button>
          <button class="viz-btn" data-level="cpu">CPU</button>
          <button class="viz-btn" data-level="node">Node</button>
          <button class="viz-btn" data-level="cluster">Cluster</button>
        </div>
      </div>
      <div class="viz-layout">
        <div class="three-stage" data-stage>
          <div class="structure-path" aria-hidden="true">
            <span data-path-step="core">Core</span><i>→</i>
            <span data-path-step="cpu">CPU</span><i>→</i>
            <span data-path-step="node">Node</span><i>→</i>
            <span data-path-step="cluster">Cluster</span>
          </div>
          <div class="three-key" aria-hidden="true">
            <span><i class="key-core"></i>Core</span>
            <span><i class="key-cpu"></i>CPU</span>
            <span><i class="key-memory"></i>Memory</span>
            <span><i class="key-network"></i>Interconnect</span>
          </div>
        </div>
        <aside class="viz-explain" aria-live="polite">
          <h3 data-title></h3>
          <p data-body></p>
          <dl>
            <div><dt>포함 관계</dt><dd data-relation></dd></div>
            <div><dt>공유 / 통신 경계</dt><dd data-boundary></dd></div>
            <div><dt>성능 관점</dt><dd data-perf></dd></div>
          </dl>
          <div class="viz-note" data-observe></div>
        </aside>
      </div>
    </div>`;

  const stage = host.querySelector("[data-stage]");
  const controls = host.querySelector("[data-levels]");
  setCopy(host, copy.core);

  let three;
  try {
    three = await loadThree();
  } catch (error) {
    stage.insertAdjacentHTML("beforeend", `<div class="viz-fallback"><strong>3D 시각화를 불러오지 못했습니다.</strong><br><span>Three.js CDN 연결을 확인하면 이 영역에 모델이 표시됩니다.</span></div>`);
    return () => {};
  }

  const scene = new three.Scene();
  const camera = new three.PerspectiveCamera(42, 1, .1, 100);
  const renderer = new three.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.outputColorSpace = three.SRGBColorSpace;
  stage.prepend(renderer.domElement);

  const root = new three.Group();
  scene.add(root);
  scene.add(new three.AmbientLight(0xffffff, 1.55));
  const keyLight = new three.DirectionalLight(0xffffff, 2.25);
  keyLight.position.set(5, 9, 7);
  scene.add(keyLight);

  const colors = {
    node: 0x6b8792,
    cpu: 0x4f9faa,
    core: 0x77c9d1,
    memory: 0x5f9275,
    nic: 0xc09a58,
    network: 0x4f8b6d
  };

  const nodes = [];
  const cpus = [];
  const cores = [];
  const memories = [];
  const nics = [];
  const networkLines = [];
  const packets = [];
  const nodeGroups = [];

  const nodeGeo = new three.BoxGeometry(2.8, .72, 1.82);
  const cpuGeo = new three.BoxGeometry(.92, .17, .72);
  const coreGeo = new three.BoxGeometry(.15, .11, .15);
  const memoryGeo = new three.BoxGeometry(.36, .26, 1.15);
  const nicGeo = new three.BoxGeometry(.32, .22, .42);

  function material(color, opacity = 1) {
    return new three.MeshStandardMaterial({ color, roughness: .54, metalness: .10, transparent: opacity < 1, opacity });
  }

  for (let n = 0; n < 4; n++) {
    const col = n % 2, row = Math.floor(n / 2);
    const x = (col - .5) * 4.45;
    const y = (.5 - row) * 2.35;
    const group = new three.Group();
    group.position.set(x, y, 0);
    root.add(group);
    nodeGroups.push(group);

    const chassis = new three.Mesh(nodeGeo, material(colors.node));
    chassis.userData = { type: "node", index: n };
    group.add(chassis); nodes.push(chassis);

    for (let s = 0; s < 2; s++) {
      const cpu = new three.Mesh(cpuGeo, material(colors.cpu));
      cpu.position.set(s ? .63 : -.63, .47, -.15);
      cpu.userData = { type: "cpu", node: n, socket: s };
      group.add(cpu); cpus.push(cpu);

      for (let c = 0; c < 8; c++) {
        const core = new three.Mesh(coreGeo, material(colors.core));
        core.position.set(cpu.position.x - .34 + (c % 4) * .225, .62, -.36 + Math.floor(c / 4) * .39);
        core.userData = { type: "core", node: n, socket: s, core: c };
        group.add(core); cores.push(core);
      }

      const memory = new three.Mesh(memoryGeo, material(colors.memory));
      memory.position.set(s ? 1.08 : -1.08, .05, .13);
      memory.userData = { type: "memory", node: n, socket: s };
      group.add(memory); memories.push(memory);
    }

    const nic = new three.Mesh(nicGeo, material(colors.nic));
    nic.position.set(0, -.47, .48);
    nic.userData = { type: "nic", node: n };
    group.add(nic); nics.push(nic);
  }

  const networkMaterial = new three.LineBasicMaterial({ color: colors.network, transparent: true, opacity: .72 });
  const positions = nodeGroups.map(group => group.position.clone());
  const pairs = [[0,1],[0,2],[1,3],[2,3],[0,3],[1,2]];
  pairs.forEach(([a,b]) => {
    const geometry = new three.BufferGeometry().setFromPoints([positions[a], positions[b]]);
    const lineObject = new three.Line(geometry, networkMaterial.clone());
    root.add(lineObject); networkLines.push(lineObject);
  });

  for (let i = 0; i < 4; i++) {
    const packet = new three.Mesh(new three.SphereGeometry(.055, 12, 12), new three.MeshStandardMaterial({ color: 0x69d8a8, emissive: 0x234b3b, emissiveIntensity: .9 }));
    root.add(packet); packets.push(packet);
  }

  const grid = new three.GridHelper(17, 17, 0x9eaaa4, 0xc6cfca);
  grid.position.y = -2.35;
  scene.add(grid);

  let level = "core";
  let active = true;
  let raf = 0;
  let dragging = false;
  let lastX = 0, lastY = 0;
  let targetRotationY = -.28, targetRotationX = .08;
  const cameraTarget = new three.Vector3(0, 0, 0);
  const desiredCamera = new three.Vector3(7.4, 5.7, 9.6);
  const desiredTarget = new three.Vector3(0, 0, 0);

  function applyOpacity(objects, value) {
    objects.forEach(object => {
      object.material.transparent = value < 1;
      object.material.opacity = value;
      object.material.depthWrite = value > .35;
    });
  }

  function setLevel(next) {
    level = next;
    setCopy(host, copy[next]);
    const representativeNode = nodeGroups[0];
    const representativeCpu = cpus[0];
    const representativeCore = cores[0];

    if (next === "core") {
      applyOpacity(nodes, .16); applyOpacity(cpus, .28); applyOpacity(cores, .18); applyOpacity(memories, .18); applyOpacity(nics, .12);
      representativeNode.children.forEach(child => { if (child.material) { child.material.opacity = .22; child.material.transparent = true; } });
      representativeCpu.material.opacity = .72; representativeCpu.material.transparent = true;
      representativeCore.material.opacity = 1; representativeCore.material.transparent = false;
      networkLines.forEach(line => line.material.opacity = .08); packets.forEach(p => p.visible = false);
      desiredCamera.set(4.9, 3.7, 6.0); desiredTarget.set(-2.2, 1.2, 0);
    } else if (next === "cpu") {
      applyOpacity(nodes, .18); applyOpacity(cpus, .20); applyOpacity(cores, .17); applyOpacity(memories, .20); applyOpacity(nics, .12);
      representativeCpu.material.opacity = 1; representativeCpu.material.transparent = false;
      cores.filter(core => core.userData.node === 0 && core.userData.socket === 0).forEach(core => { core.material.opacity = 1; core.material.transparent = false; });
      memories[0].material.opacity = .85; memories[0].material.transparent = true;
      networkLines.forEach(line => line.material.opacity = .08); packets.forEach(p => p.visible = false);
      desiredCamera.set(5.5, 4.1, 6.9); desiredTarget.set(-2.2, 1.05, 0);
    } else if (next === "node") {
      applyOpacity(nodes, .22); applyOpacity(cpus, .24); applyOpacity(cores, .20); applyOpacity(memories, .24); applyOpacity(nics, .20);
      nodeGroups[0].children.forEach(child => { if (child.material) { child.material.opacity = 1; child.material.transparent = false; } });
      networkLines.forEach(line => line.material.opacity = .12); packets.forEach(p => p.visible = false);
      desiredCamera.set(6.0, 4.4, 7.4); desiredTarget.set(-2.1, 1.0, 0);
    } else {
      applyOpacity(nodes, 1); applyOpacity(cpus, 1); applyOpacity(cores, .9); applyOpacity(memories, 1); applyOpacity(nics, 1);
      networkLines.forEach(line => line.material.opacity = .72); packets.forEach(p => p.visible = true);
      desiredCamera.set(7.4, 5.7, 9.6); desiredTarget.set(0, 0, 0);
    }
  }

  function syncTheme() {
    const dark = document.documentElement.dataset.theme === "dark";
    const bg = dark ? 0x08131e : 0xf3f6f3;
    renderer.setClearColor(bg, 1);
    scene.fog = new three.Fog(bg, 9, 26);
    grid.material.color.setHex(dark ? 0x29465c : 0xb9c5c0);
  }
  syncTheme();
  const themeObserver = new MutationObserver(syncTheme);
  themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

  function resize() {
    const rect = stage.getBoundingClientRect();
    renderer.setSize(Math.max(1, rect.width), Math.max(1, rect.height), false);
    camera.aspect = rect.width / Math.max(1, rect.height);
    camera.updateProjectionMatrix();
  }
  const ro = new ResizeObserver(resize);
  ro.observe(stage);
  resize();

  const click = event => {
    const button = event.target.closest("[data-level]");
    if (button) setLevel(button.dataset.level);
  };
  controls.addEventListener("click", click);

  const down = event => {
    dragging = true;
    lastX = event.clientX; lastY = event.clientY;
    renderer.domElement.setPointerCapture?.(event.pointerId);
  };
  const up = () => { dragging = false; };
  const move = event => {
    if (!dragging) return;
    targetRotationY += (event.clientX - lastX) * .005;
    targetRotationX += (event.clientY - lastY) * .0035;
    targetRotationX = Math.max(-.38, Math.min(.42, targetRotationX));
    lastX = event.clientX; lastY = event.clientY;
  };
  renderer.domElement.addEventListener("pointerdown", down);
  renderer.domElement.addEventListener("pointerup", up);
  renderer.domElement.addEventListener("pointercancel", up);
  renderer.domElement.addEventListener("pointermove", move);

  function loop(time = 0) {
    if (!active) return;
    root.rotation.y += (targetRotationY - root.rotation.y) * .07;
    root.rotation.x += (targetRotationX - root.rotation.x) * .07;
    camera.position.lerp(desiredCamera, .06);
    cameraTarget.lerp(desiredTarget, .06);
    camera.lookAt(cameraTarget);

    if (level === "cluster") {
      const routes = [[0,1],[0,2],[3,1],[2,3]];
      packets.forEach((packet, i) => {
        const [a,b] = routes[i];
        const p = (time * .00018 + i * .23) % 1;
        packet.position.lerpVectors(positions[a], positions[b], p);
      });
    }

    renderer.render(scene, camera);
    raf = requestAnimationFrame(loop);
  }

  setLevel("core");
  camera.position.copy(desiredCamera);
  cameraTarget.copy(desiredTarget);
  loop();

  return () => {
    active = false;
    cancelAnimationFrame(raf);
    ro.disconnect();
    themeObserver.disconnect();
    controls.removeEventListener("click", click);
    renderer.domElement.removeEventListener("pointerdown", down);
    renderer.domElement.removeEventListener("pointerup", up);
    renderer.domElement.removeEventListener("pointercancel", up);
    renderer.domElement.removeEventListener("pointermove", move);
    renderer.dispose();
    host.innerHTML = "";
  };
}
