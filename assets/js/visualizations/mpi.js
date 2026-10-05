import { css, roundRect, label, box, line, arrow, particle, createLoop, viewerShell, setDetails, activateButton } from "./canvas-utils.js";

const details = {
  p2p: {
    title: "Point-to-point: process boundary를 넘는 한 메시지",
    body: "MPI rank는 독립 process다. 다른 rank의 memory를 일반 load/store로 읽는 대신 communicator, source/destination, tag가 맞는 send/receive로 데이터를 전달한다.",
    rows: [["같은 Node", "shared-memory transport가 사용될 수 있음"], ["다른 Node", "NIC와 fabric을 거쳐 remote rank로 이동"], ["진단", "각 rank가 어느 call에서 기다리는지 비교"]],
    note: "rank 번호는 물리 Node 위치가 아니다. placement를 별도로 확인한다."
  },
  bcast: {
    title: "Broadcast: 실제 구현은 tree처럼 전파할 수 있다",
    body: "MPI_Bcast는 root의 데이터를 communicator 전체에 전달한다. 개념적으로 root가 모든 rank에 직접 선을 뻗는 그림보다 tree 전파로 이해하면 collective가 topology와 algorithm의 영향을 받는다는 점을 보기 쉽다.",
    rows: [["참여", "communicator의 모든 rank가 같은 collective 순서에 참여"], ["알고리즘", "tree 등 구현 전략은 MPI/runtime과 message size에 따라 달라짐"], ["straggler", "늦게 도착한 rank가 collective 완료를 늦출 수 있음"]],
    note: "그림은 개념 모델이며 특정 MPI implementation의 실제 tree를 고정적으로 나타내지 않는다."
  },
  allreduce: {
    title: "Allreduce: 전체 기여와 전체 결과",
    body: "모든 rank의 값을 reduction한 뒤 그 결과를 모든 rank가 얻는다. 구현은 ring, tree, recursive algorithm 등 여러 방식을 사용할 수 있다.",
    rows: [["비용", "message size · rank 수 · topology 영향"], ["동기화", "느린 rank 하나가 전체 collective를 지연 가능"], ["관찰", "placement와 transport, message size를 함께 기록"]],
    note: "ring 그림은 data가 rank 사이를 순환하는 collective intuition을 위한 교육용 모델이다."
  }
};

export function mountMpi(host) {
  const { canvas, controls } = viewerShell(host, "MPI communication patterns",
    `<button class="viz-btn active" data-mode="p2p">P2P</button>
     <button class="viz-btn" data-mode="bcast">Broadcast</button>
     <button class="viz-btn" data-mode="allreduce">Allreduce</button>`, details.p2p);
  let mode = "p2p";
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
    if (mode === "p2p") drawP2P(ctx, w, h, t);
    else if (mode === "bcast") drawBroadcast(ctx, w, h, t);
    else drawAllreduce(ctx, w, h, t);
  });
  return () => { stop(); controls.removeEventListener("click", click); };
}

function drawP2P(ctx, w, h, t) {
  const narrow = w < 560;
  if (narrow) {
    const bw = Math.min(250, w - 56), x = (w - bw) / 2;
    const rows = [
      ["rank 0 · private memory", 42, true],
      ["NIC / MPI transport", 142, false],
      ["Fabric / switch", 242, true],
      ["NIC / MPI transport", 342, false],
      ["rank 5 · private memory", 442, true]
    ];
    rows.forEach(([name,y,accent])=>box(ctx,x,y,bw,48,name,{accent,size:11}));
    for(let i=0;i<rows.length-1;i++) arrow(ctx,w/2,rows[i][1]+48,w/2,rows[i+1][1]-3,css("--viewer-line"),2);
    particle(ctx,{x:w/2,y:rows[0][1]+50},{x:w/2,y:rows[4][1]-4},(t*.22)%1,css("--accent-2"));
    return;
  }
  const nodeW = Math.min(240, w*.31), nodeH = 220, top = 90;
  const left = {x:38,y:top,w:nodeW,h:nodeH}, right={x:w-38-nodeW,y:top,w:nodeW,h:nodeH};
  [left,right].forEach((n,i)=>{
    roundRect(ctx,n.x,n.y,n.w,n.h,10,css("--viewer-side"),css("--viewer-line"));
    label(ctx,`Compute Node ${i}`,n.x+14,n.y+18,{align:"left",size:12,color:css("--viewer-muted")});
    box(ctx,n.x+22,n.y+48,n.w-44,72,`rank ${i?5:0}\nprivate memory`,{accent:true,size:11});
    box(ctx,n.x+22,n.y+n.h-58,n.w-44,38,"NIC / MPI transport",{size:10});
    arrow(ctx,n.x+n.w/2,n.y+120,n.x+n.w/2,n.y+n.h-61,css("--viewer-line"),2);
  });
  const fw=Math.min(150,w-left.w-right.w-120), fy=top+nodeH-58;
  box(ctx,w/2-fw/2,fy,fw,38,"Fabric",{accent:true,size:11});
  arrow(ctx,left.x+left.w,fy+19,w/2-fw/2-3,fy+19,css("--accent"),2);
  arrow(ctx,w/2+fw/2+3,fy+19,right.x,fy+19,css("--accent"),2);
  particle(ctx,{x:left.x+left.w,y:fy+19},{x:right.x,y:fy+19},(t*.38)%1,css("--accent-2"));
}

function drawBroadcast(ctx, w, h, t) {
  const cx=w/2;
  const levels=[
    [{x:cx,y:52,label:"root · rank 0"}],
    [{x:w*.32,y:190,label:"rank 1"},{x:w*.68,y:190,label:"rank 4"}],
    [{x:w*.18,y:340,label:"rank 2"},{x:w*.40,y:340,label:"rank 3"},{x:w*.60,y:340,label:"rank 5"},{x:w*.82,y:340,label:"rank 6"}]
  ];
  const bw=Math.min(112,Math.max(72,w*.15)), bh=44;
  levels.flat().forEach((n,i)=>box(ctx,n.x-bw/2,n.y,bw,bh,n.label,{accent:i===0,size:10}));
  const edges=[];
  levels[1].forEach(c=>edges.push([levels[0][0],c]));
  edges.push([levels[1][0],levels[2][0]],[levels[1][0],levels[2][1]],[levels[1][1],levels[2][2]],[levels[1][1],levels[2][3]]);
  edges.forEach(([a,b])=>arrow(ctx,a.x,a.y+bh,b.x,b.y-3,css("--viewer-line"),1.8));
  const edge=edges[Math.floor(t*1.3)%edges.length];
  particle(ctx,{x:edge[0].x,y:edge[0].y+bh},{x:edge[1].x,y:edge[1].y-4},(t*.7)%1,css("--accent-2"));
  label(ctx,"collective tree · no all-to-all fan-out",cx,h-26,{size:11,color:css("--viewer-muted"),maxWidth:w-30});
}

function drawAllreduce(ctx, w, h, t) {
  const count = w < 560 ? 6 : 8;
  const cx=w/2, cy=h/2-10, radius=Math.min(w*.34,h*.34), nodeR=w<560?20:23;
  const nodes=Array.from({length:count},(_,i)=>{
    const a=-Math.PI/2+(Math.PI*2*i/count);
    return {x:cx+Math.cos(a)*radius,y:cy+Math.sin(a)*radius,a};
  });
  nodes.forEach((n,i)=>{
    ctx.beginPath();ctx.fillStyle=i===0?css("--viz-accent-bg"):css("--viz-node");ctx.strokeStyle=i===0?css("--accent"):css("--viewer-line");ctx.lineWidth=1.4;ctx.arc(n.x,n.y,nodeR,0,Math.PI*2);ctx.fill();ctx.stroke();
    label(ctx,`r${i}`,n.x,n.y,{size:10});
  });
  nodes.forEach((a,i)=>{
    const b=nodes[(i+1)%count];
    const vx=b.x-a.x, vy=b.y-a.y, len=Math.hypot(vx,vy)||1, ux=vx/len, uy=vy/len;
    arrow(ctx,a.x+ux*nodeR,a.y+uy*nodeR,b.x-ux*nodeR,b.y-uy*nodeR,css("--viewer-line"),1.6);
  });
  const i=Math.floor(t*.8)%count, a=nodes[i], b=nodes[(i+1)%count];
  particle(ctx,a,b,(t*.8)%1,css("--warning"));
  box(ctx,cx-90,cy-26,180,52,"reduce + distribute",{accent:true,size:11});
  label(ctx,"ring은 collective algorithm intuition용 모델",cx,h-24,{size:11,color:css("--viewer-muted"),maxWidth:w-30});
}
