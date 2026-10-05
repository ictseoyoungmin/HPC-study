import { css, label, box, arrow, particle, createLoop, viewerShell, setDetails, activateButton } from "./canvas-utils.js";

const details = {
  tcp: {
    title: "Kernel TCP path",
    body: "일반 TCP 통신은 application buffer→socket→kernel TCP/IP→NIC→fabric→remote NIC/kernel/socket→application 순으로 이동한다. 각 계층의 queue와 counter가 서로 다른 문제를 보여준다.",
    rows: [["볼 것", "MTU · drops · retransmits · socket queue · route"], ["주의", "ping RTT 하나로 MPI/RDMA 성능을 대표하지 않음"]],
    note: "좁은 화면에서는 같은 end-to-end 경로를 세로로 재배치해 connector가 겹치지 않도록 표시한다."
  },
  rdma: {
    title: "RDMA data path",
    body: "RDMA는 registered memory와 HCA/NIC 사이의 direct data path를 사용해 CPU/kernel copy overhead를 줄일 수 있다. memory registration과 queue/completion state는 별도로 존재한다.",
    rows: [["경로", "registered memory ↔ HCA/NIC ↔ fabric ↔ remote registered memory"], ["확인", "port state · rate · error counter · device visibility"]],
    note: "RDMA는 kernel을 없애는 기술이 아니라 data movement path의 개입을 줄이는 기술로 이해한다."
  },
  ucx: {
    title: "MPI ↔ UCX/libfabric ↔ transport",
    body: "MPI 같은 상위 library는 UCX 또는 libfabric을 통해 shared memory, TCP, InfiniBand/RoCE 같은 transport를 선택할 수 있다.",
    rows: [["핵심", "MPI API와 실제 wire transport는 다른 계층"], ["진단", "build · runtime selection · device availability 분리 확인"]],
    note: "환경변수를 강제하기 전에 실제 선택된 transport와 site 권장 설정을 확인한다."
  }
};

export function mountNetworkRdma(host, initial = "tcp") {
  const { canvas, controls } = viewerShell(host, "Network path · RDMA · UCX/libfabric",
    `<button class="viz-btn ${initial === "tcp" ? "active" : ""}" data-mode="tcp">TCP</button>
     <button class="viz-btn ${initial === "rdma" ? "active" : ""}" data-mode="rdma">RDMA</button>
     <button class="viz-btn ${initial === "ucx" ? "active" : ""}" data-mode="ucx">UCX / libfabric</button>`, details[initial]);
  let mode = initial;
  const click = event => {
    const button = event.target.closest("[data-mode]");
    if (!button) return;
    mode = button.dataset.mode;
    activateButton(controls, "[data-mode]", mode);
    setDetails(host, details[mode]);
  };
  controls.addEventListener("click", click);

  const stop = createLoop(canvas, (ctx, w, h, t) => {
    ctx.clearRect(0, 0, w, h);
    if (mode === "ucx") drawLayers(ctx,w,h,t);
    else if (w < 620) drawVerticalPath(ctx,w,h,t,mode);
    else drawDesktopPath(ctx,w,h,t,mode);
  });
  return () => { stop(); controls.removeEventListener("click", click); };
}

function drawLayers(ctx,w,h,t){
  const rows=[["MPI application",.10],["MPI runtime",.27],["UCX / libfabric",.45],["SHM · TCP · RDMA",.64],["NIC / Fabric",.82]];
  const bw=Math.min(w-64,330);
  rows.forEach(([name,py],i)=>box(ctx,w/2-bw/2,h*py-22,bw,44,name,{accent:i===2||i===3,size:11}));
  rows.slice(0,-1).forEach((row,i)=>arrow(ctx,w/2,h*row[1]+22,w/2,h*rows[i+1][1]-25,css("--viewer-line"),2));
  particle(ctx,{x:w/2,y:h*.12},{x:w/2,y:h*.80},(t*.22)%1,css("--accent-2"));
  label(ctx,"API → runtime → transport → device",w/2,h-22,{size:11,color:css("--viewer-muted")});
}

function drawVerticalPath(ctx,w,h,t,mode){
  const names=mode==="tcp"
    ? ["Local application","Socket / TCP-IP kernel","Local NIC","Fabric / switch","Remote NIC","Remote socket / application"]
    : ["Local registered memory","Local HCA / NIC","Fabric / switch","Remote HCA / NIC","Remote registered memory"];
  const bw=Math.min(w-52,300), bh=44, top=30;
  const step=Math.min(82,(h-top-44)/(names.length-1));
  const points=[];
  names.forEach((name,i)=>{
    const y=top+i*step;
    box(ctx,w/2-bw/2,y,bw,bh,name,{accent:name.includes("Fabric")||name.includes("registered"),size:11});
    points.push({x:w/2,y:y+bh});
    if(i<names.length-1) arrow(ctx,w/2,y+bh,w/2,top+(i+1)*step-3,css("--viewer-line"),2);
  });
  const start={x:w/2,y:top+bh+2}, end={x:w/2,y:top+(names.length-1)*step-3};
  particle(ctx,start,end,(t*.20)%1,mode==="rdma"?css("--accent-2"):css("--warning"));
}

function drawDesktopPath(ctx,w,h,t,mode){
  const leftNames=mode==="tcp"?["App buffer","Socket","TCP/IP kernel","NIC"]:["Registered memory","RDMA queue","HCA / NIC"];
  const rightNames=[...leftNames].reverse();
  const bw=150,bh=42,step=61,left=32,right=w-32-bw,top=46;
  leftNames.forEach((name,i)=>box(ctx,left,top+i*step,bw,bh,name,{accent:mode==="rdma"&&i===0,size:10}));
  rightNames.forEach((name,i)=>box(ctx,right,top+i*step,bw,bh,name,{accent:mode==="rdma"&&i===rightNames.length-1,size:10}));
  for(let i=0;i<leftNames.length-1;i++) arrow(ctx,left+bw/2,top+i*step+bh,left+bw/2,top+(i+1)*step-3,css("--viewer-line"),1.8);
  for(let i=0;i<rightNames.length-1;i++) arrow(ctx,right+bw/2,top+i*step+bh,right+bw/2,top+(i+1)*step-3,css("--viewer-line"),1.8);
  const leftNic={x:left+bw,y:top+(leftNames.length-1)*step+bh/2};
  const rightNic={x:right,y:top+bh/2};
  const fw=Math.min(150,Math.max(96,rightNic.x-leftNic.x-40)), fy=(leftNic.y+rightNic.y)/2;
  box(ctx,w/2-fw/2,fy-24,fw,48,"Fabric / switch",{accent:true,size:11});
  arrow(ctx,leftNic.x,leftNic.y,w/2-fw/2-3,fy,css("--accent"),2);
  arrow(ctx,w/2+fw/2+3,fy,rightNic.x,rightNic.y,css("--accent"),2);
  particle(ctx,{x:leftNic.x,y:leftNic.y},{x:rightNic.x,y:rightNic.y},(t*.34)%1,mode==="rdma"?css("--accent-2"):css("--warning"));
}
