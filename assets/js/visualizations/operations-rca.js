const configs = {
  "slurm-admin": {
    toolbar:"Slurm control path",
    title:"제출부터 accounting까지 어느 경계에서 흐름이 끊겼는지 본다",
    intro:"각 단계는 서로 다른 daemon·plugin·log를 가진다. 사용자-visible state를 하나의 Slurm 문제로 묶지 않고 lifecycle boundary로 분리한다.",
    steps:[
      ["Submit","sbatch 요청과 account/QoS/partition 조건을 controller가 받는다.","slurmctld"],
      ["Schedule","priority·policy·resource availability로 allocation을 결정한다.","slurmctld"],
      ["Launch","선택된 node에서 job step과 process를 시작한다.","slurmd"],
      ["Hooks / limits","Prolog·plugin·cgroup이 site 환경과 resource boundary를 적용한다.","node-local"],
      ["Run / cleanup","application 종료 후 epilog과 cleanup이 수행된다.","slurmd + hooks"],
      ["Accounting","job/step record가 accounting store에 반영된다.","slurmdbd"]
    ],
    note:["AA 질문","allocation 성공인가, launch 성공인가, accounting만 늦는가를 분리한다."]
  },
  "rca-failures": {
    toolbar:"RCA evidence timeline",
    title:"마지막 오류가 아니라 최초 인과 사건을 시간순으로 찾는다",
    intro:"분산 job은 한 rank의 실패가 launcher와 다른 rank 종료로 전파될 수 있다. timestamp와 rank/node identity를 붙여 원인과 결과를 분리한다.",
    steps:[
      ["T0 · Submit","요청 자원, binary/input, environment를 기준선으로 남긴다.","context"],
      ["T1 · Start","allocation과 rank→node placement를 확정한다.","scheduler"],
      ["T2 · First anomaly","첫 signal, OOM, blocked rank, hardware event를 찾는다.","causal candidate"],
      ["T3 · Propagation","collective error, peer abort, launcher message가 이어지는지 본다.","secondary effect"],
      ["T4 · Cleanup","scheduler state와 exit code가 최종 결과를 기록한다.","outcome"]
    ],
    note:["RCA 기준","first abnormal event → propagation → impact → corrective action 순서로 쓴다."]
  },
  "monitoring": {
    toolbar:"Cross-layer correlation",
    title:"CPU · Memory · Storage · Network · GPU를 같은 시간축에 맞춘다",
    intro:"높은 숫자 하나보다 증상 시각 전후에 어떤 계층이 먼저 변했는지를 본다. counter는 delta, snapshot은 반복 sample로 해석한다.",
    lanes:[
      ["Application","wall time · phase · rank progress","사용자 증상과 직접 연결"],
      ["CPU / Memory","util · run queue · faults · pressure","compute / stall / reclaim 분류"],
      ["Storage","throughput · await · queue · metadata","I/O wait와 burst 확인"],
      ["Network","throughput · error/drop · retransmit","node pair와 delta 확인"],
      ["GPU","kernel · copy · idle gap · collective","upstream dependency 추적"]
    ],
    note:["Correlation window","같은 incident window에서 먼저 변한 지표와 뒤따른 지표를 구분한다."]
  },
  "node-health": {
    toolbar:"Node lifecycle",
    title:"격리 → 증거 보존 → A/B 재현 → 조치 → 검증 → 복귀",
    intro:"DRAIN은 원인을 해결하지 않는다. 문제 node를 보호하면서 정상 node와 비교할 시간을 확보하는 운영 단계다.",
    steps:[
      ["Detect","특정 node/cohort에 실패·성능 저하가 집중되는지 확인한다.","scope"],
      ["DRAIN","새 job 유입을 막고 reason과 영향 job을 기록한다.","containment"],
      ["Capture","kernel/driver/firmware/network/service 상태를 변경 전에 보존한다.","evidence"],
      ["A/B","정상 node와 동일 workload·binding으로 차이를 재현한다.","isolation"],
      ["Fix + validate","조치 후 같은 health check와 benchmark로 기준선을 확인한다.","verification"],
      ["RESUME","검증을 통과한 뒤 scheduling 대상으로 복귀한다.","recovery"]
    ],
    note:["운영 원칙","restart가 성공했다가 아니라 baseline으로 돌아왔음을 확인한 뒤 복귀한다."]
  },
  "cluster-ops": {
    toolbar:"Fleet operations model",
    title:"개별 node보다 desired state와 fleet 분포를 본다",
    intro:"provisioning·configuration management·HA·telemetry는 cluster를 동일한 운영 상태로 유지하고 변화의 영향을 추적하기 위한 control-plane 기능이다.",
    lanes:[
      ["Desired state","OS image · kernel · driver · scheduler config","기준"],
      ["Provision / configure","image 배포 · config enforcement · rollout","변경"],
      ["Fleet","node cohort · partition · service role","적용 대상"],
      ["Telemetry","metric · log · event · change history","실제 상태"],
      ["Escalation","blast radius · reproduction · diff","운영팀 전달"]
    ],
    note:["AA 역할","정상 cohort와 문제 cohort의 차이를 좁혀 infrastructure boundary로 escalation한다."]
  },
  "security": {
    toolbar:"Multi-user trust boundary",
    title:"권한 문제를 root로 우회하지 않고 identity부터 추적한다",
    intro:"shared HPC에서는 identity, path permission, ACL, quota, credential이 서로 다른 경계다. 진단과 공유 정책 모두 least privilege를 기본으로 한다.",
    steps:[
      ["Identity","uid/gid, supplementary group, job user context를 확인한다.","who"],
      ["Path","부모 directory execute 권한까지 traversal을 확인한다.","where"],
      ["ACL / mode","owner/group/mode/default ACL과 umask를 확인한다.","permission"],
      ["Quota / limit","capacity가 아니라 user/group limit인지 구분한다.","policy"],
      ["Secret handling","token·private key가 script/log/ticket에 노출되지 않게 한다.","credential"]
    ],
    note:["금지 패턴","chmod 777 또는 sudo 성공을 root cause 해결로 취급하지 않는다."]
  },
  "runbook-pending": {
    toolbar:"Runbook · Pending",
    title:"Reason을 분류하고 사용자가 바꿀 수 있는 조건만 제안한다",
    intro:"PENDING은 실패가 아니다. 현재 Reason과 request/capability를 비교해 policy wait와 actionable request를 나눈다.",
    steps:[
      ["1 · Reason","Resources / Priority / Dependency / QoS / Reservation / Config를 분류한다.","classify"],
      ["2 · Request","ReqTRES, partition, constraint, memory, GPU, node 수를 확인한다.","request"],
      ["3 · Capability","partition/node가 요청 조합을 실제로 만족할 수 있는지 비교한다.","capacity"],
      ["4 · Policy","account/QoS/dependency/reservation 조건을 확인한다.","policy"],
      ["5 · Explain","조정 가능한 request와 기다려야 하는 정책 조건을 구분해 안내한다.","communicate"]
    ],
    note:["주의","예상 시작 시각은 scheduler snapshot이므로 확정적으로 약속하지 않는다."]
  },
  "runbook-slow": {
    toolbar:"Runbook · Slow job",
    title:"resource를 더 주기 전에 어떤 bound인지 분류한다",
    intro:"낮은 CPU 사용률은 CPU 부족이 아니라 다른 dependency를 기다리는 결과일 수 있다. 정상 baseline과 phase regression부터 비교한다.",
    lanes:[
      ["CPU compute","높은 CPU + useful compute","profile / scaling"],
      ["Memory stall","높은 memory traffic · 낮은 IPC","PMU / bandwidth"],
      ["Storage wait","D state · I/O wait · await 증가","pidstat / iostat"],
      ["MPI / Network","collective wait · slow rank · transport","rank timing / counters"],
      ["Serial / imbalance","일부 worker만 active","thread/rank phase 비교"]
    ],
    note:["Decision","bound를 분류한 뒤 한 번에 하나의 변경만 적용하고 같은 조건으로 재측정한다."]
  },
  "runbook-oom": {
    toolbar:"Runbook · OOM",
    title:"어느 memory boundary가 kill을 집행했는지 먼저 찾는다",
    intro:"application allocation failure, job cgroup OOM, system OOM은 영향 범위와 해결책이 다르다. ReqMem과 MaxRSS만으로 끝내지 않고 rank/input scaling을 본다.",
    steps:[
      ["1 · Boundary","scheduler state, cgroup/kernel evidence로 kill 경계를 확인한다.","where"],
      ["2 · Request","ReqMem의 단위와 job/node/rank layout을 확인한다.","limit"],
      ["3 · Growth","input·rank 수에 따라 RSS가 어떻게 증가하는지 model을 만든다.","shape"],
      ["4 · Cause","capacity, duplication, leak/unbounded growth를 구분한다.","cause"],
      ["5 · Action","right-size, rank layout, data sharing, code fix 중 맞는 조치를 선택한다.","fix"]
    ],
    note:["오해 금지","node에 free memory가 있어도 job cgroup limit을 넘으면 OOM이 날 수 있다."]
  },
  "runbook-io-mpi": {
    toolbar:"Runbook · I/O / MPI hang",
    title:"job 전체가 아니라 rank별 progress 차이를 본다",
    intro:"filesystem block, collective mismatch, rank failure, transport 문제는 모두 '멈춤'처럼 보일 수 있다. rank→node→PID→state를 먼저 표로 만든다.",
    lanes:[
      ["CPU-active rank","계산 중 / progress marker 변화","정상 또는 imbalance 후보"],
      ["D-state rank","filesystem/block wait 가능성","wchan + storage evidence"],
      ["MPI-wait rank","collective/peer progress 대기","stack + communicator path"],
      ["Failed rank","signal/OOM/exit가 먼저 발생","first causal event 후보"],
      ["Transport path","NIC/UCX/RDMA counter와 log","해당 node pair/time delta"]
    ],
    note:["핵심","다수가 collective에서 기다려도 collective 자체가 원인이 아니라 한 slow/failed rank의 결과일 수 있다."]
  },
  "runbook-gpu": {
    toolbar:"Runbook · Low GPU utilization",
    title:"idle gap 바로 앞의 dependency를 추적한다",
    intro:"GPU utilization은 증상이다. data load, CPU preprocess, H2D, kernel launch, sync, collective, checkpoint를 하나의 step timeline으로 연결한다.",
    steps:[
      ["Data load","storage read · decode · batching이 다음 work를 준비한다.","CPU + Storage"],
      ["H2D","host batch를 device memory로 이동한다.","PCIe/NVLink"],
      ["Kernel","GPU compute를 수행한다.","GPU"],
      ["Sync / Collective","stream/rank dependency가 완료되기를 기다린다.","GPU + Network"],
      ["Checkpoint","주기적 persistent I/O가 다음 step을 늦출 수 있다.","Storage"],
      ["Correlate","idle gap과 host/network/storage event를 같은 step/time으로 맞춘다.","RCA"]
    ],
    note:["Profiling ladder","timeline으로 idle gap을 찾은 뒤 필요한 hot kernel만 상세 profile한다."]
  }
};

function cards(items) {
  return items.map((item,index)=>`<article class="ops-card"><span>${String(index+1).padStart(2,"0")}</span><div><strong>${item[0]}</strong><p>${item[1]}</p><small>${item[2]}</small></div></article>`).join("");
}

function lanes(items) {
  return items.map(item=>`<article class="ops-lane"><strong>${item[0]}</strong><p>${item[1]}</p><small>${item[2]}</small></article>`).join("");
}

export function mountOperationsRca(host, kind) {
  const config=configs[kind];
  if(!config) return ()=>{};
  host.innerHTML=`
    <div class="viz-shell textbook-viz operations-viz">
      <div class="viz-toolbar"><strong>${config.toolbar}</strong></div>
      <div class="operations-body">
        <header><h3>${config.title}</h3><p>${config.intro}</p></header>
        ${config.steps?`<div class="ops-flow">${cards(config.steps)}</div>`:`<div class="ops-lanes">${lanes(config.lanes)}</div>`}
        <div class="ops-note"><b>${config.note[0]}</b><span>${config.note[1]}</span></div>
      </div>
    </div>`;
  return ()=>{};
}
