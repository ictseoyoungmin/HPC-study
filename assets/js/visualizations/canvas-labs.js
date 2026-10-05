function css(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function fitCanvas(canvas) {
  const ctx = canvas.getContext("2d");
  const rect = canvas.getBoundingClientRect();
  const dpr = Math.min(devicePixelRatio, 2);
  canvas.width = Math.max(1, Math.round(rect.width * dpr));
  canvas.height = Math.max(1, Math.round(rect.height * dpr));
  ctx.setTransform(dpr,0,0,dpr,0,0);
  return {ctx,w:rect.width,h:rect.height};
}

function box(ctx,x,y,w,h,label,accent=false) {
  ctx.fillStyle = accent ? css("--viz-accent-bg") : css("--viz-node");
  ctx.strokeStyle = accent ? css("--accent") : css("--viewer-line");
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.roundRect(x,y,w,h,7); ctx.fill(); ctx.stroke();
  ctx.fillStyle = css("--viewer-text");
  ctx.font = "600 13px system-ui";
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillText(label,x+w/2,y+h/2,w-12);
}

function createLoop(canvas, draw) {
  let raf=0, alive=true;
  const ro=new ResizeObserver(()=>{});
  ro.observe(canvas);
  function frame(t){
    if(!alive)return;
    const {ctx,w,h}=fitCanvas(canvas);
    draw(ctx,w,h,t/1000);
    raf=requestAnimationFrame(frame);
  }
  raf=requestAnimationFrame(frame);
  return ()=>{alive=false;cancelAnimationFrame(raf);ro.disconnect()};
}

function shell(host,title,buttons="") {
  host.innerHTML = `
    <div class="viz-shell">
      <div class="viz-toolbar">
        <strong>${title}</strong>
        <div class="viz-controls">${buttons}</div>
      </div>
      <div class="canvas-stage"><canvas></canvas></div>
    </div>`;
  return host.querySelector("canvas");
}

function mountCpu(host) {
  const canvas=shell(host,"CPU topology",
    `<button class="viz-btn active" data-view="socket">Socket</button>
     <button class="viz-btn" data-view="smt">SMT</button>`);
  let view="socket";
  const controls=host.querySelector(".viz-controls");
  const onClick=e=>{const b=e.target.closest("[data-view]");if(!b)return;view=b.dataset.view;controls.querySelectorAll("button").forEach(x=>x.classList.toggle("active",x===b))};
  controls.addEventListener("click",onClick);
  const stop=createLoop(canvas,(ctx,w,h)=>{
    ctx.clearRect(0,0,w,h);
    const mx=24, gap=22, sw=(w-mx*2-gap)/2, sy=58, sh=h-105;
    [0,1].forEach(s=>{
      const x=mx+s*(sw+gap);
      box(ctx,x,sy,sw,sh,`Socket ${s}`,false);
      const cols=4, rows=2, cw=Math.min(72,(sw-36)/cols), ch=52;
      for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){
        const cx=x+18+c*((sw-36)/cols), cy=sy+58+r*78;
        box(ctx,cx,cy,cw-8,ch,`Core ${r*4+c}`,true);
        if(view==="smt"){
          ctx.fillStyle=css("--viewer-muted");ctx.font="11px system-ui";ctx.textAlign="center";
          ctx.fillText(`CPU ${2*(r*4+c)} / ${2*(r*4+c)+1}`,cx+(cw-8)/2,cy+ch+17,cw);
        }
      }
    });
    ctx.fillStyle=css("--viewer-muted");ctx.font="12px system-ui";ctx.textAlign="center";
    ctx.fillText(view==="smt"?"Logical CPU는 물리 Core와 같은 개념이 아니다.": "Socket → Core → 실행 단위의 포함 관계",w/2,h-20,w-30);
  });
  return ()=>{stop();controls.removeEventListener("click",onClick)};
}

function mountNuma(host) {
  const canvas=shell(host,"NUMA locality",
    `<button class="viz-btn active" data-mode="local">Local</button>
     <button class="viz-btn" data-mode="remote">Remote</button>`);
  let mode="local"; const controls=host.querySelector(".viz-controls");
  const click=e=>{const b=e.target.closest("[data-mode]");if(!b)return;mode=b.dataset.mode;controls.querySelectorAll("button").forEach(x=>x.classList.toggle("active",x===b))};
  controls.addEventListener("click",click);
  const stop=createLoop(canvas,(ctx,w,h,t)=>{
    ctx.clearRect(0,0,w,h);
    const gap=50, mw=(w-gap-48)/2, y=46, hh=h-92;
    box(ctx,24,y,mw,hh,"NUMA 0");
    box(ctx,24+mw+gap,y,mw,hh,"NUMA 1");
    const lcpu={x:24+mw/2,y:y+95}, lmem={x:24+mw/2,y:y+hh-70};
    const rcpu={x:24+mw+gap+mw/2,y:y+95}, rmem={x:24+mw+gap+mw/2,y:y+hh-70};
    box(ctx,lcpu.x-65,lcpu.y-24,130,48,"Threads",true);
    box(ctx,lmem.x-72,lmem.y-24,144,48,"Local DRAM",false);
    box(ctx,rcpu.x-65,rcpu.y-24,130,48,"Threads",false);
    box(ctx,rmem.x-72,rmem.y-24,144,48,"Remote DRAM",false);
    const end=mode==="local"?lmem:rmem;
    ctx.strokeStyle=mode==="local"?css("--accent-2"):css("--warning");ctx.lineWidth=3;
    ctx.beginPath();ctx.moveTo(lcpu.x,lcpu.y+26);ctx.lineTo(end.x,end.y-26);ctx.stroke();
    const p=(t*.5)%1;
    ctx.beginPath();ctx.fillStyle=ctx.strokeStyle;ctx.arc(lcpu.x+(end.x-lcpu.x)*p,lcpu.y+26+(end.y-26-(lcpu.y+26))*p,5,0,Math.PI*2);ctx.fill();
  });
  return ()=>{stop();controls.removeEventListener("click",click)};
}

function mountMpi(host) {
  const canvas=shell(host,"MPI communication",
    `<button class="viz-btn active" data-mode="p2p">P2P</button>
     <button class="viz-btn" data-mode="bcast">Bcast</button>
     <button class="viz-btn" data-mode="allreduce">Allreduce</button>`);
  let mode="p2p"; const controls=host.querySelector(".viz-controls");
  const click=e=>{const b=e.target.closest("[data-mode]");if(!b)return;mode=b.dataset.mode;controls.querySelectorAll("button").forEach(x=>x.classList.toggle("active",x===b))};
  controls.addEventListener("click",click);
  const stop=createLoop(canvas,(ctx,w,h,t)=>{
    ctx.clearRect(0,0,w,h);
    const n=8,cx=w/2,cy=h/2,r=Math.min(w,h)*.31,pts=[];
    for(let i=0;i<n;i++){const a=i/n*Math.PI*2-Math.PI/2;pts.push({x:cx+r*Math.cos(a),y:cy+r*Math.sin(a)});}
    let edges=[];
    if(mode==="p2p") edges=[[0,1]];
    if(mode==="bcast") edges=Array.from({length:7},(_,i)=>[0,i+1]);
    if(mode==="allreduce") edges=Array.from({length:n},(_,i)=>[i,(i+1)%n]);
    ctx.strokeStyle=css("--accent");ctx.lineWidth=2;
    edges.forEach(([a,b])=>{ctx.beginPath();ctx.moveTo(pts[a].x,pts[a].y);ctx.lineTo(pts[b].x,pts[b].y);ctx.stroke()});
    pts.forEach((p,i)=>{ctx.beginPath();ctx.fillStyle=css("--viz-node");ctx.strokeStyle=css("--accent");ctx.arc(p.x,p.y,23,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.fillStyle=css("--viewer-text");ctx.font="600 12px system-ui";ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText(`r${i}`,p.x,p.y)});
    const e=edges[Math.floor(t*2)%edges.length], q=(t*1.1)%1, a=pts[e[0]],b=pts[e[1]];
    ctx.beginPath();ctx.fillStyle=css("--accent-2");ctx.arc(a.x+(b.x-a.x)*q,a.y+(b.y-a.y)*q,5,0,Math.PI*2);ctx.fill();
  });
  return ()=>{stop();controls.removeEventListener("click",click)};
}

function mountScheduler(host) {
  const canvas=shell(host,"Slurm job lifecycle",
    `<button class="viz-btn active" data-step="0">Submit</button>
     <button class="viz-btn" data-step="1">Queue</button>
     <button class="viz-btn" data-step="2">Allocate</button>
     <button class="viz-btn" data-step="3">Run</button>`);
  let step=0; const controls=host.querySelector(".viz-controls");
  const click=e=>{const b=e.target.closest("[data-step]");if(!b)return;step=+b.dataset.step;controls.querySelectorAll("button").forEach(x=>x.classList.toggle("active",x===b))};
  controls.addEventListener("click",click);
  const stop=createLoop(canvas,(ctx,w,h)=>{
    ctx.clearRect(0,0,w,h);
    const items=[["Job script",.08],["Queue",.31],["Scheduler",.55],["Compute nodes",.79]];
    items.forEach(([name,p],i)=>box(ctx,w*p-70,h/2-35,140,70,name,i<=step));
    ctx.strokeStyle=css("--viewer-line");ctx.lineWidth=2;
    for(let i=0;i<items.length-1;i++){const x1=w*items[i][1]+72,x2=w*items[i+1][1]-72;ctx.beginPath();ctx.moveTo(x1,h/2);ctx.lineTo(x2,h/2);ctx.stroke();}
    ctx.fillStyle=css("--viewer-muted");ctx.font="13px system-ui";ctx.textAlign="center";
    ctx.fillText(["자원 요구사항과 실행 명령을 제출한다.","Job이 자원을 기다린다.","정책과 가용 자원을 비교한다.","할당된 Node에서 실행한다."][step],w/2,h-34,w-36);
  });
  return ()=>{stop();controls.removeEventListener("click",click)};
}

function mountScaling(host) {
  host.innerHTML=`
    <div class="viz-shell">
      <div class="viz-toolbar"><strong>Amdahl / Strong scaling</strong></div>
      <div class="scaling-controls">
        <label>Serial fraction <output data-s>0.08</output><input data-serial type="range" min="0" max="0.5" step="0.01" value="0.08"></label>
        <label>Workers <output data-n>16</output><input data-workers type="range" min="1" max="128" value="16"></label>
      </div>
      <div class="metric-grid">
        <div><span>Speedup</span><strong data-speed></strong></div>
        <div><span>Efficiency</span><strong data-eff></strong></div>
        <div><span>Amdahl limit</span><strong data-limit></strong></div>
      </div>
      <div class="canvas-stage small"><canvas></canvas></div>
    </div>`;
  const s=host.querySelector("[data-serial]"), n=host.querySelector("[data-workers]");
  function update(){
    const sv=+s.value,N=+n.value,sp=1/(sv+(1-sv)/N);
    host.querySelector("[data-s]").value=sv.toFixed(2);
    host.querySelector("[data-n]").value=N;
    host.querySelector("[data-speed]").textContent=sp.toFixed(2)+"×";
    host.querySelector("[data-eff]").textContent=(sp/N*100).toFixed(1)+"%";
    host.querySelector("[data-limit]").textContent=sv===0?"∞":(1/sv).toFixed(1)+"×";
  }
  s.addEventListener("input",update);n.addEventListener("input",update);update();
  const canvas=host.querySelector("canvas");
  const stop=createLoop(canvas,(ctx,w,h)=>{
    ctx.clearRect(0,0,w,h);
    const sv=+s.value, maxY=Math.max(4,Math.min(sv===0?128:1/sv,40))*1.05;
    const pad={l:42,r:18,t:20,b:30};
    ctx.strokeStyle=css("--viewer-line");ctx.beginPath();ctx.moveTo(pad.l,pad.t);ctx.lineTo(pad.l,h-pad.b);ctx.lineTo(w-pad.r,h-pad.b);ctx.stroke();
    ctx.strokeStyle=css("--accent");ctx.lineWidth=2.5;ctx.beginPath();
    for(let N=1;N<=128;N++){const sp=1/(sv+(1-sv)/N),x=pad.l+(w-pad.l-pad.r)*(N-1)/127,y=pad.t+(h-pad.t-pad.b)*(1-sp/maxY);N===1?ctx.moveTo(x,y):ctx.lineTo(x,y)}ctx.stroke();
  });
  return ()=>{stop();s.removeEventListener("input",update);n.removeEventListener("input",update)};
}

function mountRoofline(host) {
  host.innerHTML=`
    <div class="viz-shell">
      <div class="viz-toolbar"><strong>Roofline model</strong></div>
      <div class="scaling-controls">
        <label>Arithmetic intensity <output data-ai>4</output><input data-air type="range" min=".25" max="32" step=".25" value="4"></label>
        <label>Memory BW (GB/s) <output data-bw>200</output><input data-bwr type="range" min="50" max="500" step="10" value="200"></label>
        <label>Peak (GF/s) <output data-pk>2000</output><input data-pkr type="range" min="500" max="5000" step="100" value="2000"></label>
      </div>
      <div class="metric-grid">
        <div><span>Bound</span><strong data-bound></strong></div>
        <div><span>Ceiling</span><strong data-ceil></strong></div>
        <div><span>Ridge point</span><strong data-ridge></strong></div>
      </div>
    </div>`;
  const ai=host.querySelector("[data-air]"),bw=host.querySelector("[data-bwr]"),pk=host.querySelector("[data-pkr]");
  function f(){const A=+ai.value,B=+bw.value,P=+pk.value,perf=Math.min(P,A*B);host.querySelector("[data-ai]").value=A;host.querySelector("[data-bw]").value=B;host.querySelector("[data-pk]").value=P;host.querySelector("[data-bound]").textContent=A*B<P?"Memory":"Compute";host.querySelector("[data-ceil]").textContent=perf.toFixed(0)+" GF/s";host.querySelector("[data-ridge]").textContent=(P/B).toFixed(2)+" FLOP/B"}
  [ai,bw,pk].forEach(x=>x.addEventListener("input",f));f();
  return ()=>[ai,bw,pk].forEach(x=>x.removeEventListener("input",f));
}

function mountGpu(host) {
  const canvas=shell(host,"GPU execution pipeline");
  const stop=createLoop(canvas,(ctx,w,h,t)=>{
    ctx.clearRect(0,0,w,h);
    const labels=["CPU prep","H2D","GPU kernel","D2H"], widths=[.20,.16,.48,.16];
    let x=30; const avail=w-60;
    labels.forEach((name,i)=>{const ww=avail*widths[i]-8;box(ctx,x,h/2-38,ww,76,name,i===2);x+=avail*widths[i]});
    const phase=(t*.25)%1, px=30+avail*phase;
    ctx.beginPath();ctx.fillStyle=css("--warning");ctx.arc(px,h/2+58,5,0,Math.PI*2);ctx.fill();
    ctx.fillStyle=css("--viewer-muted");ctx.font="13px system-ui";ctx.textAlign="center";ctx.fillText("GPU utilization은 전체 pipeline의 공급·전송·동기화와 함께 해석한다.",w/2,h-24,w-30);
  });
  return stop;
}

function mountMemory(host) {
  const canvas=shell(host,"메모리 계층과 데이터 이동",
    `<button class="viz-btn active" data-level="cache">Cache</button><button class="viz-btn" data-level="ram">RAM</button><button class="viz-btn" data-level="remote">Remote</button>`);
  let level="cache"; const controls=host.querySelector(".viz-controls");
  const click=e=>{const b=e.target.closest("[data-level]");if(!b)return;level=b.dataset.level;controls.querySelectorAll("button").forEach(x=>x.classList.toggle("active",x===b))};
  controls.addEventListener("click",click);
  const stop=createLoop(canvas,(ctx,w,h,t)=>{
    ctx.clearRect(0,0,w,h);
    const levels=[["Core",.15],["Cache",.34],["RAM",.57],["Interconnect",.77],["Remote RAM",.90]];
    levels.forEach(([name,p],i)=>box(ctx,w/2-100,h*p-22,200,44,name,(level==="cache"&&i<=1)||(level==="ram"&&i<=2)||(level==="remote")));
    const idx=level==="cache"?1:level==="ram"?2:4, end=levels[idx][1],p=(t*.35)%1;
    ctx.strokeStyle=level==="remote"?css("--warning"):css("--accent");ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(w/2,h*.15+24);ctx.lineTo(w/2,h*end-24);ctx.stroke();
    ctx.beginPath();ctx.fillStyle=ctx.strokeStyle;ctx.arc(w/2,h*.15+24+(h*end-24-(h*.15+24))*p,5,0,Math.PI*2);ctx.fill();
  });
  return ()=>{stop();controls.removeEventListener("click",click)};
}

const mounts = {
  "cpu-topology": mountCpu,
  "cache-coherence": mountMemory,
  "virtual-memory": mountMemory,
  "numa": mountNuma,
  "mpi-basics": mountMpi,
  "mpi-advanced": mountMpi,
  "slurm-basics": mountScheduler,
  "slurm-resources": mountScheduler,
  "scaling": mountScaling,
  "strong-weak": mountScaling,
  "roofline": mountRoofline,
  "gpu-basics": mountGpu,
  "gpu-memory": mountGpu,
  "multi-gpu": mountGpu
};

export function hasCanvasLab(id) {
  return Boolean(mounts[id]);
}

export function mountCanvasLab(id, host) {
  return mounts[id]?.(host) || (()=>{});
}
