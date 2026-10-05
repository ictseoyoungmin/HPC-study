import { css, label, box, line, arrow, particle, createLoop, viewerShell, setDetails, activateButton } from "./canvas-utils.js";

const details = {
  metadata: {
    title: "Metadata path와 data path를 분리한다",
    body: "파일 이름 lookup, open, stat, create는 namespace와 inode metadata를 다룬다. bulk read/write와 같은 data transfer와는 병목 위치가 다를 수 있다.",
    rows: [["Metadata", "create · open · stat · directory lookup"], ["Data", "large read/write · striped extents"], ["진단", "operation latency와 byte/s를 별도 symptom으로 기록"]],
    note: "small-file workload는 data bandwidth가 낮아도 metadata service를 포화시킬 수 있다."
  },
  stripe: {
    title: "Striping은 file extent를 여러 target에 배치한다",
    body: "큰 파일을 여러 storage target에 나누면 여러 server/device의 bandwidth를 함께 사용할 수 있다. stripe count와 size는 file size와 access pattern에 맞춰야 한다.",
    rows: [["장점", "large parallel I/O에서 aggregate bandwidth 확대 가능"], ["주의", "작은 file/request에 과도한 striping은 overhead"], ["관찰", "file layout과 target별 load를 함께 확인"]],
    note: "그림은 하나의 file을 4개 extent로 나눈 개념 모델이며 filesystem별 실제 layout은 다를 수 있다."
  },
  small: {
    title: "Small-file storm은 operation 수가 핵심이다",
    body: "많은 rank가 작은 파일을 동시에 create/stat/open하면 data byte/s보다 metadata queue와 directory contention이 지배적일 수 있다.",
    rows: [["압력", "file count · create/open/stat rate"], ["완화", "aggregation · HDF5/NetCDF · directory sharding"], ["관찰", "metadata latency와 inode/quota를 함께 확인"]],
    note: "1 TB file 1개와 1 KB file 10억 개는 같은 capacity여도 완전히 다른 metadata workload다."
  }
};

export function mountParallelFilesystem(host) {
  const { canvas, controls } = viewerShell(host, "Parallel filesystem: metadata · striping · small files",
    `<button class="viz-btn active" data-mode="metadata">Metadata</button>
     <button class="viz-btn" data-mode="stripe">Striped I/O</button>
     <button class="viz-btn" data-mode="small">Small files</button>`, details.metadata);
  let mode = "metadata";
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
    if (mode === "metadata") drawMetadata(ctx,w,h,t);
    else if (mode === "stripe") drawStripe(ctx,w,h,t);
    else drawSmall(ctx,w,h,t);
  });
  return () => { stop(); controls.removeEventListener("click", click); };
}

function drawMetadata(ctx,w,h,t){
  const narrow=w<560;
  const clientY=42, clientW=narrow?72:90, gap=narrow?8:18;
  const total=clientW*4+gap*3, x0=(w-total)/2;
  const clients=Array.from({length:4},(_,i)=>({x:x0+i*(clientW+gap),y:clientY}));
  clients.forEach((p,i)=>box(ctx,p.x,p.y,clientW,42,`Rank ${i}`,{size:10}));
  const busY=128;
  line(ctx,Math.max(20,x0),busY,Math.min(w-20,x0+total),busY,css("--viewer-line"),2);
  clients.forEach(p=>line(ctx,p.x+clientW/2,p.y+42,p.x+clientW/2,busY,css("--viewer-line"),1.5));
  const metaW=Math.min(230,w-70), metaX=w/2-metaW/2, metaY=170;
  box(ctx,metaX,metaY,metaW,58,"Metadata service",{accent:true,size:12});
  arrow(ctx,w/2,busY,w/2,metaY-3,css("--accent"),2.2);
  particle(ctx,{x:w/2,y:busY},{x:w/2,y:metaY-3},(t*.55)%1,css("--accent"));
  const dataY=Math.min(h-80,300), tw=Math.min(96,(w-70)/4-5), tg=(w-tw*4)/5;
  for(let i=0;i<4;i++) box(ctx,tg+i*(tw+tg),dataY,tw,48,`Data target ${i}`,{size:10});
  label(ctx,"metadata lookup과 bulk data path는 별도 병목",w/2,h-26,{size:11,color:css("--viewer-muted"),maxWidth:w-30});
}

function drawStripe(ctx,w,h,t){
  const fileW=Math.min(w-60,470), fileX=(w-fileW)/2, fileY=60, seg=fileW/4;
  box(ctx,fileX,fileY,fileW,62,"Large shared file",{accent:true,size:12});
  for(let i=1;i<4;i++) line(ctx,fileX+i*seg,fileY+7,fileX+i*seg,fileY+55,css("--viewer-line"),1,true);
  for(let i=0;i<4;i++) label(ctx,`extent ${i}`,fileX+seg*(i+.5),fileY+43,{size:9,color:css("--viewer-muted"),maxWidth:seg-8});
  const targetY=Math.min(h-130,250), tw=Math.min(105,(w-70)/4-6), tg=(w-tw*4)/5;
  const targets=Array.from({length:4},(_,i)=>({x:tg+i*(tw+tg),y:targetY}));
  targets.forEach((p,i)=>box(ctx,p.x,p.y,tw,58,`Target ${i}`,{size:10}));
  targets.forEach((p,i)=>{
    const sx=fileX+seg*(i+.5), tx=p.x+tw/2;
    arrow(ctx,sx,fileY+62,tx,p.y-3,css("--accent"),1.8);
    particle(ctx,{x:sx,y:fileY+64},{x:tx,y:p.y-4},(t*.32+i*.18)%1,css("--accent-2"));
  });
  label(ctx,"각 extent가 별도 target으로 내려가며 connector가 교차하지 않도록 1:1로 표시",w/2,h-26,{size:11,color:css("--viewer-muted"),maxWidth:w-30});
}

function drawSmall(ctx,w,h,t){
  const narrow=w<560;
  const fileW=narrow?52:64, fileH=32, gap=10, cols=narrow?4:6;
  const rows=2, totalW=fileW*cols+gap*(cols-1), x0=(w-totalW)/2, y0=42;
  const files=[];
  for(let r=0;r<rows;r++) for(let c=0;c<cols;c++){
    const x=x0+c*(fileW+gap), y=y0+r*(fileH+gap);
    box(ctx,x,y,fileW,fileH,`f${r*cols+c}`,{size:9});
    files.push({x:x+fileW/2,y:y+fileH});
  }
  const queueY=160, queueW=Math.min(360,w-64), queueX=(w-queueW)/2;
  box(ctx,queueX,queueY,queueW,48,"metadata request queue",{accent:true,size:11});
  const busY=queueY-24;
  line(ctx,queueX,busY,queueX+queueW,busY,css("--viewer-line"),2);
  files.forEach((p,i)=>{
    line(ctx,p.x,p.y,p.x,busY,css("--viewer-line"),1);
    if(i%3===0) particle(ctx,{x:p.x,y:p.y},{x:p.x,y:busY},(t*(.45+i*.01)+i*.1)%1,css("--warning"));
  });
  arrow(ctx,w/2,busY,w/2,queueY-3,css("--warning"),2.2);
  const mdsY=Math.min(h-110,270), mdsW=Math.min(230,w-70);
  box(ctx,w/2-mdsW/2,mdsY,mdsW,60,"Metadata service",{accent:true,size:12});
  arrow(ctx,w/2,queueY+48,w/2,mdsY-3,css("--warning"),2.5);
  label(ctx,"file 수가 늘면 metadata operation rate가 병목이 될 수 있다",w/2,h-26,{size:11,color:css("--viewer-muted"),maxWidth:w-30});
}
