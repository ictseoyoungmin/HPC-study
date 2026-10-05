let THREE = null;

async function loadThree() {
  if (THREE) return THREE;
  THREE = await import("https://unpkg.com/three@0.180.0/build/three.module.js");
  return THREE;
}

export async function mountCluster3D(host) {
  host.innerHTML = `
    <div class="viz-shell">
      <div class="viz-toolbar">
        <strong>클러스터 계층</strong>
        <div class="viz-controls" data-levels>
          <button class="viz-btn active" data-level="core">Core</button>
          <button class="viz-btn" data-level="cpu">CPU</button>
          <button class="viz-btn" data-level="node">Node</button>
          <button class="viz-btn" data-level="cluster">Cluster</button>
        </div>
      </div>
      <div class="viz-layout">
        <div class="three-stage" data-stage></div>
        <aside class="viz-explain">
          <h3 data-title>Core</h3>
          <p data-body>명령어를 실행하는 기본 계산 단위다. 여러 Core가 하나의 CPU 안에서 동시에 서로 다른 실행 흐름을 처리한다.</p>
          <dl>
            <div><dt>공유 범위</dt><dd data-share>CPU의 cache와 Node의 주 메모리 계층을 다른 Core와 공유한다.</dd></div>
            <div><dt>성능 관점</dt><dd data-perf>병렬 작업이 충분하지 않으면 추가 Core가 있어도 성능은 늘지 않는다.</dd></div>
          </dl>
        </aside>
      </div>
    </div>`;

  const stage = host.querySelector("[data-stage]");
  const title = host.querySelector("[data-title]");
  const body = host.querySelector("[data-body]");
  const share = host.querySelector("[data-share]");
  const perf = host.querySelector("[data-perf]");
  const controls = host.querySelector("[data-levels]");

  let three;
  try {
    three = await loadThree();
  } catch (error) {
    stage.innerHTML = `<div class="viz-fallback">Three.js를 불러오지 못했습니다.<br><span>네트워크 연결을 확인하면 3D 모델이 표시됩니다.</span></div>`;
    return () => {};
  }

  const copy = {
    core: ["Core","명령어를 실행하는 기본 계산 단위다. 여러 Core가 하나의 CPU 안에서 병렬로 작업한다.","CPU의 cache와 Node의 주 메모리 계층을 다른 Core와 공유한다.","프로그램의 병렬 구간이 작으면 Core 수를 늘려도 유휴 자원이 생긴다."],
    cpu: ["CPU / Socket","여러 Core와 cache, memory controller를 포함하는 프로세서 패키지다.","같은 Socket의 Core들은 일부 cache와 메모리 경로를 공유한다.","Socket 경계를 넘으면 NUMA와 memory locality가 중요해질 수 있다."],
    node: ["Node","CPU, 메모리, 네트워크 인터페이스와 OS를 가진 독립 서버다.","한 Node 안의 thread는 같은 주소 공간의 메모리를 공유할 수 있다.","Node 안에서는 메모리 bandwidth와 NUMA 배치가 주요 병목이 된다."],
    cluster: ["Cluster","여러 Node를 interconnect, shared storage, scheduler로 연결한 전체 시스템이다.","Node마다 메모리가 분리되어 있어 Node 간 데이터는 통신을 거쳐야 한다.","Node 수를 늘릴수록 통신·동기화·I/O 비용을 함께 고려해야 한다."]
  };

  const scene = new three.Scene();
  const camera = new three.PerspectiveCamera(44, 1, .1, 100);
  camera.position.set(7.2,5.6,9.2);
  camera.lookAt(0,0,0);

  const renderer = new three.WebGLRenderer({antialias:true});
  renderer.setPixelRatio(Math.min(devicePixelRatio,2));
  renderer.outputColorSpace = three.SRGBColorSpace;
  stage.appendChild(renderer.domElement);

  const group = new three.Group();
  scene.add(group);
  scene.add(new three.AmbientLight(0xffffff,1.7));
  const light = new three.DirectionalLight(0xffffff,2.1);
  light.position.set(4,8,7);
  scene.add(light);

  const nodes=[];
  const cpus=[];
  const cores=[];
  const nodeGeo=new three.BoxGeometry(2.6,.76,1.7);
  const cpuGeo=new three.BoxGeometry(.94,.16,.70);
  const coreGeo=new three.BoxGeometry(.16,.10,.16);

  for(let n=0;n<4;n++){
    const col=n%2,row=Math.floor(n/2);
    const x=(col-.5)*4.2, y=(.5-row)*2.25;
    const node=new three.Mesh(nodeGeo,new three.MeshStandardMaterial({color:0x6b8792,roughness:.58,metalness:.12}));
    node.position.set(x,y,0); group.add(node); nodes.push(node);
    for(let s=0;s<2;s++){
      const cpu=new three.Mesh(cpuGeo,new three.MeshStandardMaterial({color:0x4f9faa,roughness:.48}));
      cpu.position.set(x+(s? .63:-.63),y+.48,0); group.add(cpu); cpus.push(cpu);
      for(let c=0;c<8;c++){
        const core=new three.Mesh(coreGeo,new three.MeshStandardMaterial({color:0x77c9d1,emissive:0x173a3e,emissiveIntensity:.35}));
        core.position.set(cpu.position.x-.35+(c%4)*.23,y+.63,-.20+Math.floor(c/4)*.40);
        group.add(core); cores.push(core);
      }
    }
  }

  const lineMat = new three.LineBasicMaterial({color:0x4f8b6d,transparent:true,opacity:.65});
  for(let i=0;i<nodes.length;i++){
    for(let j=i+1;j<nodes.length;j++){
      const g=new three.BufferGeometry().setFromPoints([nodes[i].position.clone(),nodes[j].position.clone()]);
      group.add(new three.Line(g,lineMat));
    }
  }
  const grid=new three.GridHelper(16,16,0x9eaaa4,0xc6cfca);
  grid.position.y=-2.15; scene.add(grid);

  let targetY=-.28,targetX=.08,drag=false,lastX=0,lastY=0,raf=0,active=true;

  function syncTheme(){
    const dark=document.documentElement.dataset.theme==="dark";
    const bg=dark?0x08131e:0xf4f7f4;
    renderer.setClearColor(bg,1);
    scene.fog=new three.Fog(bg,9,25);
    grid.material.color.setHex(dark?0x29465c:0xb9c5c0);
  }
  syncTheme();
  const themeObserver=new MutationObserver(syncTheme);
  themeObserver.observe(document.documentElement,{attributes:true,attributeFilter:["data-theme"]});

  function setLevel(level){
    const [t,b,s,p]=copy[level];
    title.textContent=t; body.textContent=b; share.textContent=s; perf.textContent=p;
    controls.querySelectorAll("[data-level]").forEach(btn=>btn.classList.toggle("active",btn.dataset.level===level));
    nodes.forEach(m=>m.material.opacity=level==="node"||level==="cluster"?1:.26);
    cpus.forEach(m=>m.material.opacity=level==="cpu"||level==="node"?1:.28);
    cores.forEach(m=>m.material.opacity=level==="core"||level==="cpu"?1:.24);
    [...nodes,...cpus,...cores].forEach(m=>{m.material.transparent=m.material.opacity<1});
  }

  function resize(){
    const r=stage.getBoundingClientRect();
    renderer.setSize(Math.max(1,r.width),Math.max(1,r.height),false);
    camera.aspect=r.width/Math.max(1,r.height);
    camera.updateProjectionMatrix();
  }
  const ro=new ResizeObserver(resize); ro.observe(stage); resize();

  const down=e=>{drag=true;lastX=e.clientX;lastY=e.clientY;renderer.domElement.setPointerCapture(e.pointerId)};
  const up=()=>drag=false;
  const move=e=>{if(!drag)return;targetY+=(e.clientX-lastX)*.006;targetX+=(e.clientY-lastY)*.004;targetX=Math.max(-.45,Math.min(.45,targetX));lastX=e.clientX;lastY=e.clientY};
  renderer.domElement.addEventListener("pointerdown",down);
  renderer.domElement.addEventListener("pointerup",up);
  renderer.domElement.addEventListener("pointermove",move);

  const click=e=>{const b=e.target.closest("[data-level]");if(b)setLevel(b.dataset.level)};
  controls.addEventListener("click",click);

  function loop(){
    if(!active)return;
    group.rotation.y+=(targetY-group.rotation.y)*.08;
    group.rotation.x+=(targetX-group.rotation.x)*.08;
    renderer.render(scene,camera);
    raf=requestAnimationFrame(loop);
  }
  setLevel("core"); loop();

  return ()=>{
    active=false; cancelAnimationFrame(raf); ro.disconnect(); themeObserver.disconnect();
    controls.removeEventListener("click",click);
    renderer.domElement.removeEventListener("pointerdown",down);
    renderer.domElement.removeEventListener("pointerup",up);
    renderer.domElement.removeEventListener("pointermove",move);
    renderer.dispose(); host.innerHTML="";
  };
}
