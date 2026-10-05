let THREE = null;

async function loadThree() {
  if (THREE) return THREE;
  THREE = await import("https://cdn.jsdelivr.net/npm/three@0.180.0/+esm");
  return THREE;
}

const copy = {
  core: {
    title: "Core · CPU 안에서 instruction을 실행하는 계산 단위",
    body: "Core는 thread나 process가 CPU 시간을 소비하는 물리 계산 단위다. 여러 core가 하나의 socket에 묶이고 일부 cache와 memory path를 공유한다.",
    rows: [["포함 관계", "Core → Socket → Node"], ["공유 경계", "상위 cache와 memory controller 일부"], ["다음 개념", "SMT · cache · CPU binding"]],
    note: "밝게 표시된 한 core가 socket과 node 안에 포함되는 관계를 본다."
  },
  cpu: {
    title: "Socket · 여러 Core와 cache, memory path를 묶는다",
    body: "하나의 CPU socket에는 여러 core가 있고, 다중 socket node에서는 socket마다 가까운 memory 영역이 달라질 수 있다. 이것이 이후 NUMA를 이해하는 출발점이다.",
    rows: [["포함 관계", "Cores + cache + memory controller → Socket"], ["성능 관점", "binding · cache sharing · NUMA locality"], ["관찰", "lscpu · numactl --hardware"]],
    note: "CPU 수를 늘리는 것과 core 수를 늘리는 것은 같은 표현이 아니다. 물리 socket과 logical CPU를 구분한다."
  },
  node: {
    title: "Node · CPU, Memory, NIC, OS를 가진 독립 서버",
    body: "Node는 하나의 독립 컴퓨터다. 같은 node 안에서는 shared-memory programming이 가능하지만, socket 간에는 NUMA 차이가 있을 수 있다.",
    rows: [["구성", "Socket(s) · DRAM · NIC · OS"], ["경계", "다른 node의 DRAM은 같은 주소 공간처럼 직접 공유하지 않음"], ["다음 개념", "NUMA · local/remote memory · NIC placement"]],
    note: "Node 경계는 shared-memory와 distributed-memory를 나누는 중요한 경계다."
  },
  cluster: {
    title: "Cluster · Node들을 Fabric과 공용 서비스로 묶는다",
    body: "Cluster에서는 node 간 통신이 중앙 fabric을 통과하고, scheduler와 shared storage 같은 공용 서비스가 전체 시스템을 지원한다. node 수를 늘리면 계산 자원과 함께 통신·동기화·공용 I/O 비용도 늘 수 있다.",
    rows: [["Compute", "여러 Compute Node"], ["Communication", "Node ↔ Fabric ↔ Node"], ["Control / I/O", "Scheduler · shared storage는 별도 공용 경로"]],
    note: "교육용 모델에서는 all-to-all 선을 그리지 않고 switch/fabric 중심의 실제적인 통신 경계를 보여 준다."
  }
};

export async function mountCluster3D(host) {
  host.innerHTML = `
    <div class="viz-shell textbook-viz">
      <div class="viz-toolbar">
        <strong>클러스터 계층 · Core → Socket → Node → Cluster</strong>
        <div class="viz-controls" data-controls>
          <button class="viz-btn active" data-level="core">Core</button>
          <button class="viz-btn" data-level="cpu">Socket</button>
          <button class="viz-btn" data-level="node">Node</button>
          <button class="viz-btn" data-level="cluster">Cluster</button>
        </div>
      </div>
      <div class="viz-layout">
        <div class="three-stage" data-stage>
          <div class="structure-path"><span>Core</span><i>→</i><span>Socket</span><i>→</i><span>Node</span><i>→</i><span>Cluster</span></div>
        </div>
        <aside class="viz-explain" aria-live="polite">
          <h3 data-title></h3>
          <p data-body></p>
          <dl data-rows></dl>
          <div class="viz-note" data-note></div>
        </aside>
      </div>
    </div>`;

  const stage = host.querySelector("[data-stage]");
  const controls = host.querySelector("[data-controls]");
  const title = host.querySelector("[data-title]");
  const body = host.querySelector("[data-body]");
  const rows = host.querySelector("[data-rows]");
  const note = host.querySelector("[data-note]");

  let three;
  try {
    three = await loadThree();
  } catch {
    stage.insertAdjacentHTML("beforeend", `<div class="viz-fallback"><strong>3D 시각화를 불러오지 못했습니다.</strong><br><span>Three.js CDN 연결을 확인하세요.</span></div>`);
    return () => {};
  }

  const scene = new three.Scene();
  const camera = new three.PerspectiveCamera(40, 1, .1, 100);
  const renderer = new three.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.outputColorSpace = three.SRGBColorSpace;
  stage.prepend(renderer.domElement);

  scene.add(new three.AmbientLight(0xffffff, 1.6));
  const light = new three.DirectionalLight(0xffffff, 2.2);
  light.position.set(5, 8, 7);
  scene.add(light);

  const root = new three.Group();
  scene.add(root);

  const colors = { chassis:0x6f858d, cpu:0x4f9faa, core:0x78c7cf, memory:0x5f9275, nic:0xb28a4b, fabric:0x4f8b6d };
  const mat = (color, opacity=1) => new three.MeshStandardMaterial({ color, roughness:.58, metalness:.08, transparent:opacity<1, opacity });
  const nodeGroups = [];
  const nodes = [], cpus = [], cores = [], memories = [], nics = [];

  const positions = [
    new three.Vector3(-3.1, 1.75, 0),
    new three.Vector3( 3.1, 1.75, 0),
    new three.Vector3(-3.1,-1.75, 0),
    new three.Vector3( 3.1,-1.75, 0)
  ];

  positions.forEach((position, nodeIndex) => {
    const group = new three.Group();
    group.position.copy(position);
    root.add(group);
    nodeGroups.push(group);

    const chassis = new three.Mesh(new three.BoxGeometry(2.6,.68,1.65), mat(colors.chassis));
    group.add(chassis); nodes.push(chassis);

    for (let socket = 0; socket < 2; socket++) {
      const x = socket ? .58 : -.58;
      const cpu = new three.Mesh(new three.BoxGeometry(.9,.17,.66), mat(colors.cpu));
      cpu.position.set(x,.44,-.13);
      group.add(cpu); cpus.push(cpu);

      for (let core = 0; core < 8; core++) {
        const c = new three.Mesh(new three.BoxGeometry(.14,.10,.14), mat(colors.core));
        c.position.set(x - .31 + (core % 4) * .205, .57, -.31 + Math.floor(core / 4) * .35);
        c.userData = { nodeIndex, socket, core };
        group.add(c); cores.push(c);
      }

      const memory = new three.Mesh(new three.BoxGeometry(.30,.24,1.04), mat(colors.memory));
      memory.position.set(socket ? 1.0 : -1.0,.02,.10);
      group.add(memory); memories.push(memory);
    }

    const nic = new three.Mesh(new three.BoxGeometry(.32,.20,.40), mat(colors.nic));
    nic.position.set(0,-.42,.42);
    group.add(nic); nics.push(nic);
  });

  const fabric = new three.Mesh(new three.BoxGeometry(1.45,.36,1.05), mat(colors.fabric));
  fabric.position.set(0,0,-.1);
  root.add(fabric);

  const lineObjects = [];
  const lineMaterial = new three.LineBasicMaterial({ color: colors.fabric, transparent:true, opacity:.72 });
  positions.forEach(position => {
    const start = position.clone();
    const end = new three.Vector3(0,0,-.1);
    const geometry = new three.BufferGeometry().setFromPoints([start,end]);
    const link = new three.Line(geometry,lineMaterial.clone());
    root.add(link); lineObjects.push(link);
  });

  const packetPaths = [[0,1],[2,3]];
  const packets = packetPaths.map(() => {
    const p = new three.Mesh(new three.SphereGeometry(.065,12,12), new three.MeshStandardMaterial({ color:0x69d8a8, emissive:0x214a39, emissiveIntensity:.8 }));
    root.add(p); return p;
  });

  camera.position.set(7.4,5.5,10.2);
  const targetCamera = new three.Vector3(7.4,5.5,10.2);
  const targetLook = new three.Vector3(0,0,0);
  const look = new three.Vector3(0,0,0);
  let level = "core";
  let raf = 0;
  let alive = true;

  function opacity(objects, value) {
    objects.forEach(object => {
      object.material.transparent = value < 1;
      object.material.opacity = value;
      object.material.depthWrite = value > .3;
    });
  }

  function setCopy(next) {
    const item = copy[next];
    title.textContent = item.title;
    body.textContent = item.body;
    rows.innerHTML = item.rows.map(([k,v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join("");
    note.textContent = item.note;
    controls.querySelectorAll("[data-level]").forEach(button => button.classList.toggle("active", button.dataset.level === next));
  }

  function setLevel(next) {
    level = next;
    setCopy(next);
    opacity(nodes,.14); opacity(cpus,.16); opacity(cores,.14); opacity(memories,.13); opacity(nics,.10);
    fabric.material.opacity = .10; fabric.material.transparent = true;
    lineObjects.forEach(line => line.material.opacity = .05);
    packets.forEach(packet => packet.visible = false);

    if (next === "core") {
      nodeGroups[0].children.forEach(child => { if (child.material) { child.material.opacity=.20; child.material.transparent=true; } });
      cpus[0].material.opacity=.62;
      cores.find(c => c.userData.nodeIndex===0 && c.userData.socket===0 && c.userData.core===0).material.opacity=1;
      targetCamera.set(4.8,3.5,6.3); targetLook.set(-3.0,2.0,0);
    } else if (next === "cpu") {
      cpus[0].material.opacity=1; cpus[0].material.transparent=false;
      cores.filter(c => c.userData.nodeIndex===0 && c.userData.socket===0).forEach(c => { c.material.opacity=1; c.material.transparent=false; });
      memories[0].material.opacity=.78;
      targetCamera.set(5.1,3.8,6.8); targetLook.set(-3.0,1.9,0);
    } else if (next === "node") {
      nodeGroups[0].children.forEach(child => { if (child.material) { child.material.opacity=1; child.material.transparent=false; } });
      targetCamera.set(5.7,4.2,7.6); targetLook.set(-2.8,1.5,0);
    } else {
      opacity(nodes,1); opacity(cpus,.95); opacity(cores,.86); opacity(memories,1); opacity(nics,1);
      fabric.material.opacity=1; fabric.material.transparent=false;
      lineObjects.forEach(line => line.material.opacity=.70);
      packets.forEach(packet => packet.visible=true);
      targetCamera.set(7.4,5.5,10.2); targetLook.set(0,0,0);
    }
  }

  function syncTheme() {
    const dark = document.documentElement.dataset.theme === "dark";
    renderer.setClearColor(dark ? 0x08131e : 0xf3f6f3,1);
  }
  const themeObserver = new MutationObserver(syncTheme);
  themeObserver.observe(document.documentElement,{attributes:true,attributeFilter:["data-theme"]});
  syncTheme();

  function resize() {
    const rect = stage.getBoundingClientRect();
    const width = Math.max(1,rect.width), height = Math.max(1,rect.height);
    renderer.setSize(width,height,false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }
  const ro = new ResizeObserver(resize); ro.observe(stage); resize();

  function movePacket(packet, from, to, t) {
    const a = positions[from], b = positions[to], hub = new three.Vector3(0,0,-.1);
    const p = (t % 1 + 1) % 1;
    if (p < .5) packet.position.lerpVectors(a,hub,p*2);
    else packet.position.lerpVectors(hub,b,(p-.5)*2);
  }

  function frame(ms) {
    if (!alive) return;
    const t = ms / 1000;
    camera.position.lerp(targetCamera,.055);
    look.lerp(targetLook,.07);
    camera.lookAt(look);
    root.rotation.y = Math.sin(t*.18) * .035;
    if (level === "cluster") {
      movePacket(packets[0],0,3,t*.22);
      movePacket(packets[1],2,1,t*.22+.5);
    }
    renderer.render(scene,camera);
    raf = requestAnimationFrame(frame);
  }

  const onClick = event => {
    const button = event.target.closest("[data-level]");
    if (button) setLevel(button.dataset.level);
  };
  controls.addEventListener("click",onClick);
  setLevel("core");
  raf = requestAnimationFrame(frame);

  return () => {
    alive = false;
    cancelAnimationFrame(raf);
    controls.removeEventListener("click",onClick);
    ro.disconnect();
    themeObserver.disconnect();
    renderer.dispose();
    stage.querySelector("canvas")?.remove();
  };
}
