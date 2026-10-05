const term=(term,en,definition,why)=>({term,en,definition,why});
const sec=(title,p1,p2,takeaway)=>({title,paragraphs:[p1,p2],takeaway});
const q=(question,answer)=>({question,answer});
const ex=(title,intro,steps,conclusion)=>({title,intro,steps,conclusion});

export const enhancements = Object.freeze({
  "runbook-pending": {
    learningObjectives:[
      "PENDING을 오류가 아니라 scheduler decision의 결과로 설명하고 Reason별 next action을 선택할 수 있다.",
      "Resources, Priority, Dependency, QoS/Account, Reservation, Configuration 계열 원인을 구분할 수 있다.",
      "사용자가 바꿀 수 있는 요청과 운영 정책 때문에 기다려야 하는 조건을 분리해 안내할 수 있다."
    ],
    terms:[
      term("PENDING","대기 상태","job이 제출되었지만 아직 resource allocation과 실행을 시작하지 못한 scheduler state다.","실패와 다르므로 Reason을 읽지 않고 재제출하면 queue 상태만 더 복잡해질 수 있다."),
      term("Reason","대기 사유","scheduler가 현재 job을 시작하지 못하는 대표 이유를 표시한 값이다.","다음 진단 단계와 사용자에게 설명할 내용을 선택하는 출발점이다."),
      term("Eligible time","실행 자격 시각","dependency, begin time, policy 조건 등을 만족해 scheduling 경쟁에 참여할 수 있게 된 시각이다.","submit time과 실제 priority 경쟁 시작 시각을 구분하는 데 도움이 된다."),
      term("Priority","우선순위","scheduler가 실행 후보들 사이의 순서를 정할 때 사용하는 값 또는 정책 결과다.","대기 시간이 길다는 사실만으로 resource 부족인지 priority 문제인지 구분할 수 없다."),
      term("ReqTRES","요청 자원 집합","CPU, memory, GPU 등 job이 요구한 trackable resource의 집합이다.","partition에서 실제 제공 가능한 조합과 맞지 않으면 장기 pending의 원인이 될 수 있다."),
      term("Dependency","의존성","다른 job 상태나 조건이 충족되기 전까지 실행을 지연시키는 scheduler 관계다.","resource가 충분해도 dependency가 풀리지 않으면 시작하지 않는다.")
    ],
    sections:[
      sec("PENDING 진단은 Reason에서 시작하지만 Reason에서 끝나지 않는다",
        "squeue의 Reason은 현재 scheduler가 보여 주는 대표적인 대기 사유다. 먼저 Reason을 읽고 그 범주가 resource, policy, dependency, reservation인지 분류한다.",
        "Reason은 시간이 지나며 바뀔 수도 있다. 예를 들어 dependency가 해소된 뒤 Resources로 바뀔 수 있으므로 ticket 시각과 현재 상태를 구분해 기록한다.",
        "Reason은 next action을 고르는 index이며 전체 원인을 설명하는 유일한 기록은 아니다."),
      sec("Resource pending은 요청과 partition capability를 비교해야 한다",
        "CPU 수만 맞는다고 충분하지 않다. memory, GPU type/count, node feature, constraint, partition limit, contiguous requirement 등 요청 조합 전체가 실제 node 집합에서 만족 가능한지 본다.",
        "요청이 비현실적으로 크거나 특정 feature를 과도하게 제한하면 queue가 비어 보여도 시작하지 못할 수 있다. 사용자에게는 어떤 요청이 flexibility를 제한하는지 구체적으로 보여줘야 한다.",
        "ReqTRES와 constraint를 실제 partition/node capability와 비교한다."),
      sec("예상 시작 시각은 약속이 아니라 scheduler snapshot이다",
        "scheduler prediction은 다른 job 종료, 새 job 제출, reservation, backfill 정책에 따라 달라질 수 있다. 따라서 특정 시각에 반드시 시작된다고 안내하면 안 된다.",
        "AA는 정책상 기다려야 하는 경우와 사용자가 요청을 조정하면 개선될 수 있는 경우를 분리한다. resource request 축소, dependency 수정처럼 actionable한 항목만 제안한다.",
        "대기 설명은 확정 시간보다 Reason과 변경 가능한 조건을 중심으로 한다.")
    ],
    example:ex("GPU 4개 job이 계속 Resources로 pending인 경우",
      "partition에 GPU가 있어도 요청 조합이 실제 node topology와 맞는지 확인한다.",
      [
        {label:"Reason",text:"현재 Reason이 Resources인지 확인하고 과거 상태가 달랐는지 기록한다."},
        {label:"Request",text:"ReqTRES, partition, constraint, memory, node count를 확인한다."},
        {label:"Capability",text:"해당 partition에 요청을 동시에 만족하는 node가 존재하는지 비교한다."},
        {label:"Explain",text:"정책 대기인지 요청 수정으로 완화 가능한지 사용자에게 구분해 안내한다."}
      ],
      "'GPU가 남아 있다'와 '이 요청을 만족하는 GPU node 조합이 있다'는 같은 말이 아니다."),
    selfCheck:[
      q("PENDING을 실패 상태라고 부르면 안 되는 이유는?","scheduler가 아직 실행 조건을 만족시키지 못했을 뿐 job 자체가 실패한 것은 아니기 때문이다."),
      q("Reason=Resources일 때 CPU 수만 확인하면 부족한 이유는?","memory, GPU, feature, constraint, node topology 등 ReqTRES 전체 조합이 만족되어야 하기 때문이다."),
      q("예상 시작 시간을 확정적으로 약속하면 안 되는 이유는?","scheduler 상황과 다른 job, reservation, backfill 결정에 따라 prediction이 바뀔 수 있기 때문이다.")
    ]
  },

  "runbook-slow": {
    learningObjectives:[
      "slow job을 CPU compute, memory stall, storage wait, network/MPI wait, serial section, imbalance 범주로 분류할 수 있다.",
      "낮은 CPU utilization을 resource 부족이 아니라 wait/synchronization의 결과일 수 있다고 해석할 수 있다.",
      "정상 baseline과 동일 조건 비교를 통해 성능 저하의 첫 변화 계층을 찾을 수 있다."
    ],
    terms:[
      term("Wall time","경과 시간","job 시작부터 종료까지 실제로 흐른 시간이다.","사용자가 체감하는 성능의 기준이며 CPU time과 다를 수 있다."),
      term("CPU utilization","CPU 사용률","관찰 구간에서 CPU가 실행에 사용된 비율을 나타내는 지표다.","낮은 값은 CPU 부족이 아니라 I/O, lock, MPI wait, serial phase 때문일 수 있다."),
      term("I/O wait","I/O 대기","CPU가 runnable work를 수행하지 못하고 I/O completion을 기다리는 상태와 관련된 지표다.","storage path가 병목인지 분류할 때 다른 disk/process metric과 함께 본다."),
      term("Imbalance","부하 불균형","thread/rank 간 work 또는 progress 시간이 달라 일부 worker가 다른 worker를 기다리는 상태다.","평균 CPU 사용률이 낮아도 특정 rank가 tail을 만들 수 있다."),
      term("Serial section","직렬 구간","병렬 worker 수와 무관하게 한 worker 또는 제한된 worker만 진행하는 코드 구간이다.","core를 추가해도 wall time이 거의 줄지 않는 원인이 된다."),
      term("Baseline regression","기준선 대비 퇴행","동일하거나 유사한 정상 run에 비해 wall time이나 phase time이 악화된 상태다.","절대 사용률보다 실제 성능 저하가 언제 시작됐는지 찾는 기준이다.")
    ],
    sections:[
      sec("'느리다'는 먼저 baseline과 phase로 나눠야 한다",
        "사용자가 느리다고 느끼는 기준을 숫자로 고정한다. 동일 input과 resource에서 wall time이 얼마에서 얼마로 변했는지, 특정 phase만 느려졌는지 확인한다.",
        "baseline이 없으면 80% CPU가 정상인지 비정상인지 판단하기 어렵다. 정상 run과 문제 run의 CPU, memory, I/O, communication phase를 동일 시간축으로 비교한다.",
        "성능 RCA는 먼저 regression을 정량화하고 어떤 phase가 늘었는지 찾는다."),
      sec("낮은 CPU는 원인이 아니라 다른 곳을 기다린다는 신호일 수 있다",
        "CPU가 낮으면 process state와 I/O/network/MPI evidence를 본다. runnable worker가 적고 D state가 많다면 I/O block, 여러 rank가 collective에서 기다리면 imbalance나 slow rank를 의심할 수 있다.",
        "반대로 CPU가 높고 IPC가 낮거나 memory bandwidth가 포화라면 memory-bound일 수 있다. 따라서 CPU utilization만으로 core 수를 조정하지 않는다.",
        "CPU 사용률은 병목 분류의 한 축이며 wait state와 함께 해석한다."),
      sec("resource 추가 전 bound를 분류해야 한다",
        "CPU-bound라면 core/thread scaling을 검토할 수 있지만 storage-bound job에 core를 늘리면 shared I/O contention만 키울 수 있다. MPI wait가 크다면 rank 수보다 placement/network/imbalance가 핵심일 수 있다.",
        "AA는 먼저 bound를 분류하고, 그 다음 변경을 하나씩 적용해 같은 benchmark protocol로 재측정한다. 여러 설정을 동시에 바꾸면 무엇이 개선을 만들었는지 알기 어렵다.",
        "튜닝은 병목 가설 → 단일 변경 → 동일 조건 재측정의 반복이다.")
    ],
    example:ex("CPU utilization 25%인 MPI job이 이전보다 2배 느려진 경우",
      "core를 추가하기 전에 rank별 progress와 wait 원인을 분리한다.",
      [
        {label:"Baseline",text:"동일 input의 정상 wall time과 phase timing을 비교한다."},
        {label:"Process state",text:"rank별 CPU, state, imbalance를 확인한다."},
        {label:"Wait path",text:"I/O, MPI collective, network, filesystem wait가 늘었는지 확인한다."},
        {label:"Profile",text:"실제 useful compute가 줄었는지 profiler와 counter로 확인한다."}
      ],
      "낮은 CPU는 'CPU가 부족하다'가 아니라 'CPU가 할 일을 받지 못하거나 다른 조건을 기다린다'는 가설을 먼저 만든다."),
    selfCheck:[
      q("CPU utilization이 낮을 때 core를 바로 늘리면 안 되는 이유는?","I/O, lock, MPI wait, serial region 등 CPU 외 원인이면 core 추가가 병목을 해결하지 못하기 때문이다."),
      q("slow job 분석의 첫 수치는 무엇인가?","동일 조건 baseline 대비 wall time 또는 phase time의 regression 정도다."),
      q("평균 CPU 사용률이 낮아도 imbalance가 원인일 수 있는 이유는?","소수 slow rank/thread가 나머지를 기다리게 만들어 평균 사용률을 낮출 수 있기 때문이다.")
    ]
  },

  "runbook-oom": {
    learningObjectives:[
      "scheduler memory limit, cgroup OOM, system OOM, application allocation failure를 구분할 수 있다.",
      "ReqMem, MaxRSS, rank/thread 수, input size, per-rank duplication을 함께 사용해 memory model을 구성할 수 있다.",
      "memory 증설과 code/data-layout 수정 중 어떤 조치가 필요한지 evidence로 판단할 수 있다."
    ],
    terms:[
      term("ReqMem","요청 메모리","scheduler에 job이 필요하다고 선언한 memory resource다.","실제 limit 계산과 node 선택에 영향을 주므로 MaxRSS와 직접 비교할 때 단위와 per-node/per-cpu 의미를 확인해야 한다."),
      term("RSS","Resident Set Size","process가 현재 physical memory에 resident한 page 규모를 나타내는 지표다.","VmSize보다 실제 memory pressure와 더 가까운 관찰값이지만 shared page와 sampling 한계가 있다."),
      term("MaxRSS","최대 RSS 기록","job step accounting에서 관찰된 peak resident memory를 나타내는 값이다.","peak 시점과 accounting 범위를 이해해야 하며 모든 순간 memory를 완벽히 재구성하는 값은 아니다."),
      term("cgroup OOM","cgroup 메모리 한도 초과","job 또는 step의 cgroup memory limit 안에서 allocation pressure가 한도를 넘은 상태다.","node 전체 memory가 남아 있어도 job limit 때문에 kill될 수 있다."),
      term("System OOM","시스템 OOM","node 전체 memory pressure가 극단적으로 높아 kernel OOM 처리에 들어간 상태다.","한 job 문제가 다른 workload와 node service에 영향 줄 수 있어 cgroup OOM과 영향 범위가 다르다."),
      term("Per-rank duplication","rank별 중복 메모리","MPI rank마다 같은 dataset/buffer를 독립적으로 보유해 rank 수에 따라 memory가 증가하는 패턴이다.","rank 증가와 동시에 OOM이 발생할 때 중요한 scaling 원인이다.")
    ],
    sections:[
      sec("OOM이라는 결과 안에도 서로 다른 memory boundary가 있다",
        "application malloc 실패, cgroup limit 초과, scheduler-request mismatch, system-wide OOM은 모두 '메모리 부족'처럼 보일 수 있지만 영향 범위와 증거가 다르다.",
        "먼저 sacct/job state와 cgroup/kernel evidence를 통해 어떤 boundary가 memory pressure를 집행했는지 찾는다. node memory가 충분하다는 사실만으로 cgroup OOM을 배제할 수 없다.",
        "OOM 분석의 첫 단계는 어느 memory boundary에서 한계를 넘었는지 구분하는 것이다."),
      sec("ReqMem과 MaxRSS는 rank/thread 구조 없이 읽으면 부족하다",
        "동일 input에서도 MPI rank 수가 늘면 per-rank replicated buffer 때문에 total memory가 커질 수 있다. 반대로 shared-memory thread는 일부 data를 공유할 수 있어 scaling pattern이 다르다.",
        "AA는 input size, rank 수, thread 수, node 수에 따라 memory가 어떻게 증가할지 간단한 model을 만든다. 그 뒤 MaxRSS와 실제 OOM 시점 로그가 model과 일치하는지 확인한다.",
        "memory 문제는 한 번의 peak 숫자보다 workload 구조에 따른 증가식을 설명해야 한다."),
      sec("memory를 더 요청하는 것과 memory 문제를 해결하는 것은 다르다",
        "input이 합리적으로 커져 capacity가 부족한 경우에는 request 증가가 올바른 해결일 수 있다. 그러나 leak, unbounded cache, rank duplication이 원인이라면 request 증가는 실패 시점을 늦출 뿐이다.",
        "같은 workload를 input/rank 크기별로 반복해 peak memory curve를 만들면 capacity scaling과 비정상 growth를 구분하기 쉽다. code fix 이후 같은 curve를 재측정한다.",
        "증설은 capacity 문제에, code/data 구조 수정은 growth 문제에 대응한다.")
    ],
    example:ex("rank 수를 32에서 64로 늘리자 OOM이 발생한 경우",
      "노드 총 memory만 확인하지 않고 per-rank memory와 scheduler limit을 함께 계산한다.",
      [
        {label:"Boundary",text:"sacct와 cgroup/kernel evidence로 kill boundary를 확인한다."},
        {label:"Model",text:"rank당 resident memory × rank 수 + shared overhead의 근사치를 만든다."},
        {label:"Compare",text:"32/48/64 rank에서 MaxRSS와 input 크기 관계를 비교한다."},
        {label:"Decision",text:"rank layout 조정, data sharing, memory request 증가 중 원인에 맞는 조치를 선택한다."}
      ],
      "rank 수 증가에 따라 거의 선형으로 memory가 늘면 per-rank duplication이나 private buffer 구조를 먼저 의심할 수 있다."),
    selfCheck:[
      q("node에 free memory가 남아 있는데도 job이 OOM 날 수 있는 이유는?","job cgroup 또는 scheduler memory limit이 node 전체 memory보다 작게 설정되어 있을 수 있기 때문이다."),
      q("VmSize를 실제 사용 memory로 그대로 해석하면 안 되는 이유는?","virtual address reservation은 physical resident memory와 동일하지 않기 때문이다."),
      q("memory request 증가가 근본 해결이 아닌 경우의 예는?","memory leak, unbounded cache, per-rank duplication처럼 workload 자체의 growth pattern이 비정상인 경우다.")
    ]
  },

  "runbook-io-mpi": {
    learningObjectives:[
      "slow I/O, filesystem block, MPI collective mismatch, rank failure, transport 문제를 rank별 evidence로 구분할 수 있다.",
      "D state, syscall/wchan, stack, rank progress, NIC/filesystem counter를 같은 시간축에 배치할 수 있다.",
      "MPI hang을 곧바로 network failure나 deadlock으로 단정하지 않고 progress를 막는 최초 rank/자원을 찾을 수 있다."
    ],
    terms:[
      term("D state","Uninterruptible sleep","Linux task가 보통 kernel I/O 등 완료를 기다리며 interruptible하지 않은 sleep 상태에 있는 것을 나타낸다.","filesystem/block wait 후보를 찾는 단서지만 D state 하나만으로 storage root cause를 확정할 수 없다."),
      term("Wait channel","대기 함수 위치","task가 kernel에서 어떤 wait 지점에 머무는지 보여 주는 정보다.","여러 process가 같은 I/O path에서 block되는지 분류하는 단서가 된다."),
      term("Collective mismatch","collective 불일치","rank들이 서로 다른 collective 순서나 communicator 상태로 진입해 progress가 멈추는 오류 패턴이다.","network 정상이어도 MPI job이 hang처럼 보일 수 있다."),
      term("Slow rank","지연 rank","다른 rank보다 계산, I/O, communication progress가 늦어 전체 synchronization을 지연시키는 rank다.","collective 대기에서는 가장 느린 rank가 전체 wall time을 결정할 수 있다."),
      term("Transport","전송 계층","MPI/communication library가 실제 data movement에 사용하는 network path다.","TCP/RDMA/UCX 등 선택된 path와 NIC state를 확인해야 network 가설을 구체화할 수 있다."),
      term("Progress","진행 상태","rank/process가 시간에 따라 계산 단계나 communication state를 앞으로 이동하는 정도다.","hang 분석에서는 살아 있는지보다 시간이 지나도 state가 변하는지 확인하는 것이 중요하다.")
    ],
    sections:[
      sec("분산 hang에서는 모든 rank가 같은 상태라고 가정하지 않는다",
        "일부 rank는 CPU compute 중이고 일부는 filesystem syscall에 block되며 나머지는 collective에서 기다릴 수 있다. 평균 CPU나 launcher message만 보면 이 비대칭이 사라진다.",
        "rank별 hostname, PID, state, stack 또는 last progress marker를 표로 만들면 slow/failed rank와 기다리는 rank를 구분할 수 있다. 이 차이가 가장 강한 RCA 단서가 된다.",
        "hang 분석의 중심 단위는 job 전체가 아니라 rank별 progress 차이다."),
      sec("D state와 I/O evidence는 storage path 가설을 만들 뿐이다",
        "D state가 많고 wait channel이 filesystem/block path를 가리키면 I/O blocking 가능성이 높아진다. 같은 시각에 filesystem server, device latency, metadata event가 증가하는지 비교해야 한다.",
        "반대로 D state가 없고 rank들이 MPI call에서 멈춰 있다면 collective ordering, peer failure, transport 상태를 본다. 관찰된 wait point에 맞춰 다음 계층을 선택한다.",
        "process state가 다음 subsystem 조사 방향을 결정한다."),
      sec("network counter는 rank/flow 증거와 함께 읽는다",
        "NIC error/drop/retransmit이 증가해도 해당 job traffic과 시간적으로 연관되지 않으면 root cause라고 단정할 수 없다. incident node pair와 같은 interval의 delta를 비교한다.",
        "MPI log와 transport debug는 필요할 때 좁은 범위로 활성화한다. 과도한 debug는 timing을 바꾸고 로그를 폭증시킬 수 있으므로 재현 case에 맞춰 사용한다.",
        "network RCA는 counter 증가, affected path, rank progress가 함께 맞을 때 강해진다.")
    ],
    example:ex("128-rank job이 collective에서 멈춘 것처럼 보이는 경우",
      "모든 rank가 같은 collective에 있는지 확인하기 전에 rank별 상태를 수집한다.",
      [
        {label:"Inventory",text:"rank→node→PID mapping과 마지막 progress marker를 확보한다."},
        {label:"State",text:"D state, CPU-active, MPI-wait rank를 그룹화한다."},
        {label:"Path",text:"slow rank가 filesystem syscall인지 compute인지 transport wait인지 좁힌다."},
        {label:"Correlate",text:"해당 node/NIC/filesystem의 동일 시각 counter와 로그를 비교한다."}
      ],
      "다수 rank가 collective에서 기다린다는 사실은 collective 자체가 원인이라는 뜻이 아니라 다른 slow rank를 기다리는 결과일 수 있다."),
    selfCheck:[
      q("MPI hang을 바로 network 문제라고 결론내면 안 되는 이유는?","filesystem block, slow rank, collective mismatch, peer failure 등 여러 원인이 같은 증상을 만들 수 있기 때문이다."),
      q("D state는 무엇을 의미하는 강한 단서인가?","kernel I/O 등 uninterruptible wait 중일 가능성을 보여 주지만 storage root cause 자체를 확정하지는 않는다."),
      q("분산 hang에서 가장 먼저 만들면 좋은 표는?","rank→node→PID→state/last progress/stack을 정리한 rank별 progress 표다.")
    ]
  },

  "runbook-gpu": {
    learningObjectives:[
      "low GPU utilization을 dataloader, CPU preprocess, transfer, kernel launch gap, synchronization, collective, checkpoint로 단계별 분해할 수 있다.",
      "nvidia-smi snapshot과 profiler timeline의 역할 차이를 설명할 수 있다.",
      "GPU idle gap 직전에 어떤 dependency가 끝나지 않았는지 추적해 upstream bottleneck을 찾을 수 있다."
    ],
    terms:[
      term("GPU utilization","GPU 사용률","관찰 구간에서 GPU engine이 active했던 비율을 나타내는 sampled metric이다.","낮은 값은 GPU 자체가 느리다는 뜻이 아니라 공급 또는 synchronization 문제일 수 있다."),
      term("Idle gap","유휴 구간","timeline에서 GPU kernel이나 copy가 실행되지 않는 시간 구간이다.","바로 앞 dependency를 추적하면 dataloader, transfer, sync, collective 등 원인을 좁힐 수 있다."),
      term("Launch latency","kernel launch 지연","host가 GPU work를 제출하고 실행되기까지 발생하는 orchestration 비용이다.","작은 kernel이 매우 많으면 useful compute보다 launch overhead 비중이 커질 수 있다."),
      term("H2D transfer","Host-to-Device 전송","CPU memory에서 GPU memory로 데이터를 이동하는 단계다.","PCIe/NVLink bandwidth와 pinned memory, overlap 여부에 따라 GPU 공급 속도를 제한할 수 있다."),
      term("Synchronization","동기화","host, stream, GPU, rank가 특정 완료 조건을 기다리는 지점이다.","과도한 sync는 copy/compute overlap을 깨고 idle gap을 만든다."),
      term("Input pipeline","입력 파이프라인","storage read, decode, preprocess, batch 구성 등 GPU에 work를 공급하는 upstream 단계다.","GPU가 빨라도 input pipeline이 느리면 utilization은 낮아진다.")
    ],
    sections:[
      sec("low utilization은 GPU 문제라는 진단명이 아니다",
        "nvidia-smi에서 utilization이 낮다는 것은 sample 구간에 active work가 적었다는 뜻이다. 왜 work가 없었는지는 CPU, data loader, transfer, synchronization, communication을 봐야 알 수 있다.",
        "따라서 먼저 training/inference step을 Data load → H2D → Kernel → Collective → Checkpoint 같은 phase로 나눈다. 어느 phase가 wall time과 idle gap을 만드는지 timeline으로 확인한다.",
        "GPU 사용률은 증상이며 원인은 GPU 밖에 있을 수 있다."),
      sec("snapshot보다 timeline이 dependency를 보여 준다",
        "snapshot metric은 순간 상태를 보여 주지만 kernel과 memcpy, CPU thread, synchronization 사이의 순서를 설명하지 못한다. Nsight Systems 같은 timeline 도구는 idle gap 직전 어떤 작업이 끝나지 않았는지 보여 준다.",
        "timeline에서 반복되는 pattern을 찾고 대표 step을 좁힌 뒤 hot kernel이 확인될 때만 kernel-level metric으로 내려간다. 처음부터 모든 kernel을 상세 profile하면 overhead와 데이터 양이 커진다.",
        "system timeline으로 병목 위치를 찾고 필요한 경우에만 kernel 내부로 내려간다."),
      sec("GPU와 host/network/storage를 같은 step 기준으로 묶는다",
        "distributed training에서는 AllReduce가 늦으면 GPU가 collective completion을 기다릴 수 있고, checkpoint가 길면 다음 step 시작이 지연될 수 있다. 이때 GPU utilization만 보면 device idle만 보인다.",
        "step ID 또는 timestamp로 dataloader, GPU timeline, NCCL log, storage I/O를 정렬하면 upstream dependency가 선명해진다. 반복 step 중 특정 node/rank만 늦은지도 함께 본다.",
        "GPU RCA는 device metric을 다른 subsystem과 같은 step/time axis에 연결하는 작업이다.")
    ],
    example:ex("매 20 step마다 GPU가 3초씩 idle해지는 training job",
      "주기적 pattern은 checkpoint, validation, data refill 같은 host-side phase와 연결될 가능성이 있다.",
      [
        {label:"Pattern",text:"GPU timeline에서 20-step 주기의 idle gap을 표시한다."},
        {label:"Host",text:"같은 시각 CPU/dataloader activity와 synchronization을 본다."},
        {label:"Storage",text:"checkpoint write 또는 next-shard read가 겹치는지 확인한다."},
        {label:"Distributed",text:"NCCL collective가 gap 앞에서 길어지는 rank가 있는지 비교한다."}
      ],
      "주기적 GPU idle은 clock 조정 대상이 아니라 반복되는 upstream event를 찾는 문제다."),
    selfCheck:[
      q("nvidia-smi utilization이 낮다는 사실만으로 kernel 최적화를 시작하면 안 되는 이유는?","GPU에 work를 공급하지 못하는 CPU/I/O/transfer/synchronization 문제가 원인일 수 있기 때문이다."),
      q("idle gap을 봤을 때 가장 먼저 추적할 것은?","gap 직전에 완료되지 않은 dependency와 host/copy/collective phase다."),
      q("Nsight Systems와 kernel-level profiler의 역할 차이는?","Systems는 CPU/GPU 전체 timeline과 overlap/gap을 찾고, kernel-level profiler는 좁힌 hot kernel 내부 metric을 분석한다.")
    ]
  }
});
