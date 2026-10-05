const term=(term,en,definition,why)=>({term,en,definition,why});
const sec=(title,p1,p2,takeaway)=>({title,paragraphs:[p1,p2],takeaway});
const q=(question,answer)=>({question,answer});
const ex=(title,intro,steps,conclusion)=>({title,intro,steps,conclusion});

export const enhancements = Object.freeze({
  "workloads": {
    learningObjectives:[
      "application 이름만으로 병목을 단정하지 않고 compute·memory·network·storage·GPU 축의 resource signature로 workload를 설명할 수 있다.",
      "하나의 job 안에서도 phase마다 resource signature가 바뀐다는 사실을 이해하고 phase-aligned telemetry를 수집할 수 있다.",
      "archetype을 정답이 아니라 첫 가설로 사용하고 실제 counter·profile·timeline으로 가설을 수정할 수 있다."
    ],
    terms:[
      term("Resource signature","Resource signature","workload가 CPU, memory, network, storage, GPU를 어떤 비율과 시간 패턴으로 사용하는지 나타내는 관찰 가능한 특징이다.","application 이름보다 실제 병목 후보를 빠르게 좁히는 데 유용하다."),
      term("Phase","Execution phase","job 내부에서 지배적인 연산·통신·I/O 동작이 비교적 일정하게 유지되는 실행 구간이다.","전체 평균만 보면 startup, compute, checkpoint 같은 서로 다른 행동이 섞여 원인이 가려질 수 있다."),
      term("Arithmetic intensity","Arithmetic intensity","이동한 byte당 수행한 연산량을 나타내는 개념이다.","compute-bound와 memory-bandwidth-bound 가능성을 구분하는 출발점이 된다."),
      term("Communication ratio","Communication-to-compute ratio","유용한 계산 시간에 비해 rank 간 통신과 동기화가 차지하는 비율이다.","scale-out 효율과 topology 민감도를 예상하는 데 중요하다."),
      term("Working set","Working set","특정 phase가 반복적으로 접근하는 data의 유효 집합이다.","cache, NUMA, device memory capacity와 locality 문제를 판단하는 기준이 된다."),
      term("Imbalance","Load imbalance","rank·thread·GPU 사이에 완료 시간이 달라 일부 worker가 다른 worker를 기다리는 상태다.","평균 utilization이 높아도 전체 step time은 가장 느린 worker에 의해 결정될 수 있다.")
    ],
    sections:[
      sec("Workload archetype은 이름 분류가 아니라 가설 생성 장치다",
        "CFD, FEA, weather, chemistry, genomics, AI는 흔히 관찰되는 패턴이 다르지만 같은 도메인 안에서도 solver, mesh, input size, precision, checkpoint 주기, 병렬화 방식에 따라 resource behavior가 크게 달라진다. 따라서 'CFD니까 network-bound'처럼 도메인 이름을 곧바로 원인으로 바꾸면 위험하다.",
        "AA의 역할은 도메인 지식을 이용해 첫 관찰 위치를 정하되, 실제 job에서 CPU busy time, memory bandwidth, MPI wait, filesystem traffic, GPU timeline 같은 증거를 수집해 archetype을 확인하거나 폐기하는 것이다.",
        "Archetype은 진단의 시작점이지 결론이 아니다."),
      sec("하나의 job도 phase가 바뀌면 병목 자원이 바뀐다",
        "대부분의 실제 application은 input read, initialization, compute, communication, checkpoint, final write처럼 여러 phase를 가진다. 예를 들어 평균 CPU utilization은 높아도 checkpoint 순간에는 storage가 지배하고, distributed AI는 forward/backward에서 GPU가 바쁘다가 AllReduce에서 network에 민감해질 수 있다.",
        "그래서 wall time 하나나 전체-job 평균 counter만 보면 병목이 희석된다. timestamp가 맞는 application log와 telemetry를 함께 놓고 phase boundary를 먼저 찾은 뒤 각 phase에서 dominant resource를 분리해야 한다.",
        "성능 진단의 단위는 application 이름보다 실행 phase가 더 유용할 때가 많다."),
      sec("Signature는 다음 관찰을 선택하기 위한 좌표다",
        "CPU가 낮고 D-state가 많다면 storage 또는 blocking syscall을, CPU가 높지만 IPC가 낮고 memory bandwidth가 포화라면 memory path를, GPU idle gap 앞에서 CPU dataloader가 바쁘다면 host supply path를 우선 확인한다. 이처럼 signature는 특정 도구를 외우는 대신 다음 증거를 선택하게 해 준다.",
        "반대로 한 축만 높다고 원인이 확정되는 것은 아니다. network traffic이 높아도 useful communication일 수 있고, memory usage가 커도 capacity 문제가 아닐 수 있다. baseline과 정상 run, peer rank/node 비교가 함께 있어야 의미가 생긴다.",
        "좋은 workload 분류는 '무엇을 쓴다'보다 '다음에 무엇을 측정할 것인가'를 설명한다.")
    ],
    example:ex("이름은 AI인데 실제 병목은 어디인가?","8-GPU training job의 GPU utilization이 45%라는 신고가 들어왔다. GPU가 느리다고 가정하지 않고 phase signature부터 만든다.",[
      {label:"Phase 표시",text:"data load, H2D, forward/backward, AllReduce, optimizer, checkpoint 시간을 timeline에 표시한다."},
      {label:"동시 관찰",text:"CPU process, GPU timeline, network throughput, storage I/O를 같은 시간축에서 비교한다."},
      {label:"가설 수정",text:"GPU idle gap이 dataloader 직후 반복되면 kernel tuning보다 host preprocessing과 input pipeline을 먼저 검증한다."},
      {label:"재현",text:"동일 input과 allocation으로 baseline run을 만들어 변경 전후 phase time을 비교한다."}
    ],"도메인 이름은 첫 질문을 정하는 데만 사용하고, 최종 분류는 관찰된 resource signature와 phase evidence로 작성한다."),
    selfCheck:[
      q("CFD workload라고 들었을 때 바로 network-bound라고 결론 내리면 안 되는 이유는?","solver, decomposition, mesh, node count와 phase에 따라 behavior가 달라지므로 archetype은 가설일 뿐이며 실제 telemetry와 profile로 검증해야 한다."),
      q("전체 job 평균 GPU utilization이 낮을 때 가장 먼저 추가해야 할 정보는?","phase-aligned timeline이다. GPU idle이 dataloader, transfer, collective, checkpoint 중 어느 phase와 연결되는지 봐야 한다."),
      q("Resource signature의 목적은 workload를 예쁘게 분류하는 것인가?","아니다. 다음에 수집할 증거와 비교 대상을 선택해 진단 공간을 줄이는 것이 핵심이다.")
    ]
  },
  "capacity": {
    learningObjectives:[
      "utilization과 service quality를 동일시하지 않고 queue latency·throughput·fragmentation·headroom을 함께 설명할 수 있다.",
      "P50/P95 job size와 memory/GPU demand distribution을 이용해 partition과 node shape 의사결정을 설명할 수 있다.",
      "새 시스템 acceptance를 peak spec 하나가 아니라 microbenchmark·representative workload·stability·operations 기준으로 설계할 수 있다."
    ],
    terms:[
      term("Service objective","Service objective","사용자가 기대하는 queue wait, completion time, availability 같은 운영 품질 목표다.","capacity는 장비 utilization을 최대화하는 문제가 아니라 서비스 목표를 만족시키는 문제다."),
      term("Headroom","운영 여유 용량","burst, failure, maintenance, demand growth를 흡수하기 위해 즉시 사용하지 않고 남겨 두는 capacity다.","항상 100% utilization을 목표로 하면 작은 변동에도 queue와 recovery 시간이 급격히 악화될 수 있다."),
      term("Fragmentation","Resource fragmentation","남아 있는 자원이 여러 node나 resource dimension에 흩어져 특정 job이 사용할 수 없는 상태다.","총 free CPU가 충분해도 large-memory 또는 multi-GPU job이 오래 pending할 수 있다."),
      term("Right-sizing","Right-sizing","실제 workload 요구에 맞게 CPU, memory, GPU, walltime request를 조정하는 작업이다.","과도한 요청은 queue와 fragmentation을 악화시키고 과소 요청은 OOM·timeout을 만든다."),
      term("Demand distribution","수요 분포","job이 요구하는 node, CPU, memory, GPU, runtime의 빈도 분포다.","평균값만으로 설계하면 tail workload와 burst를 놓치므로 P50/P95 등 분포를 함께 봐야 한다."),
      term("Acceptance criteria","인수 기준","새 시스템이 의도한 기능·성능·안정성·운영성을 만족한다고 판정하기 위한 사전 정의 기준이다.","납품 후 임의 benchmark 숫자에 맞추는 것을 막고 재현 가능한 승인 절차를 만든다.")
    ],
    sections:[
      sec("Capacity planning은 peak spec보다 workload distribution 문제다",
        "CPU core 수나 GPU peak FLOPS만 비교하면 실제 사용자의 job mix를 설명할 수 없다. 작은 single-node job이 대부분인지, 큰 MPI job이 tail을 차지하는지, memory-heavy job이 특정 node shape를 독점하는지에 따라 같은 총 자원도 체감 서비스가 달라진다.",
        "따라서 accounting에서 CPU-hours/GPU-hours뿐 아니라 job size, elapsed time, requested memory, queue wait, failure와 cancellation 비율을 분포로 읽어야 한다. 평균값은 전형적 workload를, 상위 percentile은 tail service와 capacity risk를 보여 준다.",
        "Capacity 의사결정의 입력은 제품 spec이 아니라 관찰된 demand distribution이다."),
      sec("높은 utilization과 좋은 서비스는 서로 다른 목표다",
        "클러스터 utilization이 높다는 것은 자원이 바쁘다는 뜻이지 queue latency가 좋거나 throughput이 최적이라는 뜻은 아니다. 100%에 가까운 지속 utilization에서는 maintenance, node failure, burst demand를 흡수할 headroom이 줄어들고 큰 job이 필요한 연속 자원을 얻기 어려워질 수 있다.",
        "반대로 낮은 utilization이 무조건 과잉 투자라는 뜻도 아니다. 예약 capacity, failover, rare large job, training window 같은 서비스 요구가 있다면 의도된 headroom일 수 있다. utilization은 반드시 service objective와 같이 읽는다.",
        "좋은 capacity 정책은 utilization 숫자가 아니라 queue·throughput·recovery와의 trade-off를 명시한다."),
      sec("Acceptance는 성능 숫자가 아니라 검증 계약이다",
        "새 시스템 acceptance는 network latency/bandwidth, storage throughput, CPU/GPU microbenchmark처럼 부품 경계를 확인하는 시험과 실제 representative application의 end-to-end 시험을 함께 가져가야 한다. microbenchmark만 통과하고 실제 workload가 느린 경우도 있고 반대도 가능하다.",
        "또한 일정 시간의 stability run, node 간 variance, scheduler integration, monitoring, accounting, failure handling까지 포함해야 운영 준비 상태를 판단할 수 있다. 모든 기준은 hardware/software version, input, command, repetition, 허용 편차와 함께 사전에 기록한다.",
        "Acceptance benchmark는 최고 숫자 경쟁이 아니라 기대 서비스가 재현되는지 확인하는 절차다.")
    ],
    example:ex("GPU 증설안에서 100% utilization을 목표로 해야 할까?","최근 30일 GPU utilization이 92%이고 queue wait P95가 증가했다. 단순히 GPU 수를 늘리기 전에 수요의 모양을 확인한다.",[
      {label:"분포",text:"GPU 개수, memory, runtime, queue wait를 P50/P95와 시간대별로 나눈다."},
      {label:"Fragmentation",text:"free GPU 수와 실제 pending reason을 비교해 연속 resource 확보 문제가 있는지 본다."},
      {label:"Right-sizing",text:"과도한 GPU·walltime request가 queue를 악화시키는 workload가 있는지 찾는다."},
      {label:"증설안",text:"현재 demand와 성장률, maintenance headroom, target queue objective를 만족하는 node shape와 수량을 비교한다."}
    ],"증설 근거는 '92%라서'가 아니라 demand distribution과 service objective 사이의 gap으로 작성한다."),
    selfCheck:[
      q("클러스터 utilization 100%가 왜 항상 좋은 목표가 아닌가?","burst, failure, maintenance를 흡수할 headroom이 사라지고 queue latency와 fragmentation이 급격히 악화될 수 있기 때문이다."),
      q("Capacity planning에서 평균 job size만 보면 놓치는 것은?","큰 tail workload, rare memory/GPU-heavy job, burst와 P95 queue behavior를 놓칠 수 있다."),
      q("Acceptance benchmark에 representative application이 필요한 이유는?","microbenchmark는 개별 subsystem 경계를 확인하지만 실제 application의 communication, I/O, scheduler integration과 end-to-end behavior를 모두 대변하지 못하기 때문이다.")
    ]
  },
  "regression": {
    learningObjectives:[
      "성능 회귀를 단일 느린 실행과 구분하고 baseline·noise floor·effect size로 정의할 수 있다.",
      "hardware/software/input/affinity 환경 fingerprint를 고정해 비교 가능한 benchmark를 설계할 수 있다.",
      "변경점을 한 계층씩 좁히고 rollback·acceptance·known variance를 근거로 의사결정할 수 있다."
    ],
    terms:[
      term("Golden baseline","Golden baseline","비교 기준으로 승인된 hardware, software, input, affinity, measurement protocol과 결과 분포다.","회귀 여부를 판단하려면 '예전보다 느리다'가 아니라 재현 가능한 기준이 필요하다."),
      term("Noise floor","Noise floor","동일 조건 반복 측정에서 자연스럽게 발생하는 변동 폭이다.","threshold가 noise보다 작으면 정상 변동을 회귀로 잘못 탐지한다."),
      term("Effect size","Effect size","baseline과 새 결과 사이 차이의 크기다.","통계적 차이가 실제 운영 영향으로도 의미 있는지 판단하는 데 필요하다."),
      term("Environment fingerprint","Environment fingerprint","kernel, firmware, compiler, library, MPI, module, affinity, power setting 등 실행 환경을 식별하는 메타데이터다.","환경 drift를 코드 변경 효과로 오인하는 것을 막는다."),
      term("Change point","Change point","성능 분포가 이전 상태에서 의미 있게 바뀌기 시작한 시점 또는 release다.","변경 목록과 timeline을 겹쳐 원인 후보를 줄인다."),
      term("Bisect","Bisect","여러 변경 가운데 결과를 바꾼 변경점을 단계적으로 좁히는 비교 전략이다.","한 번에 여러 계층을 바꾸면 attribution이 어려워지므로 원인 격리에 중요하다.")
    ],
    sections:[
      sec("Regression은 한 번 느린 실행이 아니라 분포가 이동한 상태다",
        "공유 HPC 환경에서는 background noise, network contention, filesystem activity, turbo behavior 때문에 동일 workload도 실행마다 시간이 달라질 수 있다. 따라서 한 번의 slow run만으로 regression을 선언하면 false positive가 많다.",
        "먼저 동일 조건 반복 측정으로 baseline median, p95, variance를 만들고 새 결과의 분포가 noise floor를 넘어 지속적으로 이동했는지 확인한다. correctness도 함께 확인해야 빠르지만 틀린 결과를 개선으로 오판하지 않는다.",
        "회귀 판정은 단일 숫자가 아니라 baseline 분포와 허용 threshold의 비교다."),
      sec("환경 fingerprint가 없으면 비교 실험이 아니다",
        "compiler flag, linked library, MPI implementation, kernel, firmware, CPU governor, affinity, node type, input이 바뀌면 application code가 같아도 성능이 달라질 수 있다. 따라서 benchmark 결과에는 실행 명령만 아니라 environment fingerprint가 따라야 한다.",
        "변경 전후 비교에서는 가능한 한 한 계층만 다르게 유지한다. node와 software stack이 동시에 바뀌면 차이를 어느 쪽에 귀속할지 알 수 없기 때문이다. 필요한 경우 container image digest나 module list도 provenance에 포함한다.",
        "재현성은 결과 숫자보다 조건을 다시 만들 수 있는 능력에서 시작한다."),
      sec("Governance의 목적은 regression을 찾는 것보다 안전하게 결정하는 것이다",
        "회귀가 확인되면 profile과 counter를 통해 어느 phase와 subsystem이 바뀌었는지 좁히고, 변경 목록을 time-order로 정리해 bisect한다. 모든 성능 차이를 되돌릴 필요는 없다. security fix나 correctness 개선처럼 비용을 감수해야 하는 변경도 있기 때문이다.",
        "따라서 보고서는 effect size, affected workload, reproducibility, root cause confidence, rollback risk, workaround, acceptance threshold를 함께 제시해야 한다. 최종 결정은 기술적 원인과 서비스 영향의 조합이다.",
        "Benchmark governance는 숫자를 지키는 일이 아니라 변경 위험을 증거 기반으로 관리하는 일이다.")
    ],
    example:ex("MPI library 업그레이드 후 8% 느려졌다","대표 workload 1회가 8% 느려졌다는 보고가 들어왔다. 바로 rollback하지 않고 회귀인지 검증한다.",[
      {label:"Baseline",text:"기존 library에서 동일 node/input으로 반복 실행해 median과 variance를 확보한다."},
      {label:"Fingerprint",text:"module, MPI version, kernel, affinity와 environment를 두 조건에서 비교한다."},
      {label:"Phase",text:"전체 wall time이 아니라 communication phase, compute phase, I/O phase 중 어디가 이동했는지 측정한다."},
      {label:"Decision",text:"차이가 재현되고 noise를 넘으면 impact와 workaround, rollback risk를 함께 기록한다."}
    ],"'8% 느림'을 재현 가능한 regression evidence와 운영 결정을 연결한 문서로 바꾼다."),
    selfCheck:[
      q("한 번 10% 느린 결과만으로 regression이라고 할 수 없는 이유는?","공유 환경의 자연 변동이 있을 수 있으므로 반복 baseline의 noise floor와 분포 이동을 확인해야 한다."),
      q("Environment fingerprint에 module list가 필요한 이유는?","같은 executable 이름이라도 compiler, MPI, library 조합이 달라질 수 있어 변경 attribution에 필요하기 때문이다."),
      q("회귀가 확인되면 항상 rollback해야 하는가?","아니다. correctness, security, 서비스 영향, workaround와 rollback risk를 함께 고려해 acceptance 여부를 결정한다.")
    ]
  },
  "ticket-postmortem": {
    learningObjectives:[
      "ticket에서 symptom·impact·scope·timeline·evidence·hypothesis·action을 구분해 기록할 수 있다.",
      "확인된 사실과 가설, 아직 모르는 내용을 사용자에게 명확히 분리해 전달할 수 있다.",
      "postmortem에서 root cause뿐 아니라 detection gap·contributing factor·재발 방지 action item을 도출할 수 있다."
    ],
    terms:[
      term("Symptom","Symptom","사용자 또는 시스템이 관찰한 이상 현상이다.","증상과 원인을 구분해야 처음부터 잘못된 해결책에 고정되지 않는다."),
      term("Impact","Impact","얼마나 많은 사용자·job·데이터·시간이 영향을 받았는지 나타내는 결과다.","우선순위와 커뮤니케이션 강도를 결정하는 핵심 정보다."),
      term("Scope","Scope","영향이 특정 job, node, partition, application, 전체 cluster 중 어디까지 퍼졌는지의 범위다.","원인 후보와 escalation 대상을 좁힌다."),
      term("Hypothesis","가설","현재 증거를 설명할 수 있지만 아직 검증되지 않은 원인 후보다.","사실처럼 말하지 않고 다음 검증 행동과 연결해야 한다."),
      term("Contributing factor","기여 요인","incident를 가능하게 하거나 영향을 키웠지만 단독 root cause는 아닌 조건이다.","복합 시스템에서 단일 원인 서사를 피하고 개선 기회를 넓힌다."),
      term("Action item","개선 조치","재발 방지, detection 개선, 대응 시간 단축을 위해 owner와 완료 조건이 지정된 후속 작업이다.","postmortem을 설명 문서에서 운영 개선 도구로 바꾼다.")
    ],
    sections:[
      sec("좋은 ticket은 로그 저장소가 아니라 의사결정 기록이다",
        "stderr 전체를 붙이는 것만으로는 다른 사람이 상황을 재현하거나 다음 행동을 고르기 어렵다. ticket에는 언제, 어느 job/node에서, 어떤 기대와 실제가 달랐는지, 영향 범위가 무엇인지 먼저 써야 한다.",
        "그 다음 증거마다 무엇을 관찰했고 어떤 가설을 지지하거나 반박하는지 연결한다. 명령 출력은 필요한 line과 timestamp를 보존하되 해석을 함께 남긴다. 그래야 handoff가 발생해도 진단 방향이 유지된다.",
        "Ticket의 품질은 로그 양이 아니라 다음 사람이 같은 판단을 재현할 수 있는지로 평가한다."),
      sec("사용자 커뮤니케이션은 확실성 수준을 표현하는 기술이다",
        "incident 초기에 모든 원인을 알 수는 없다. 이때 '원인을 찾는 중'만 반복하기보다 확인된 사실, 현재 영향, 가장 가능성 높은 가설, 다음 검증, 다음 업데이트 조건을 분리해 전달하면 불확실성을 숨기지 않으면서도 신뢰를 유지할 수 있다.",
        "예상 복구 시간은 근거가 있을 때만 제시하고 변동 가능성을 명시한다. scheduler pending처럼 외부 job arrival에 따라 바뀌는 값은 확정 시간처럼 말하지 않는다. 기술 용어도 사용자의 결정에 필요한 수준으로 번역한다.",
        "좋은 업데이트는 모르는 것을 감추지 않고도 현재 상태와 다음 행동을 명확히 한다."),
      sec("Postmortem은 blame이 아니라 system 개선을 위한 feedback loop다",
        "incident가 종료되면 timeline에서 first causal event, propagation, detection, mitigation, recovery를 분리한다. 사람의 실수를 끝점으로 삼기보다 왜 그 실수가 system에서 가능했고 왜 더 빨리 감지되지 않았는지를 묻는다.",
        "Action item은 '주의한다'처럼 검증 불가능한 문장이 아니라 monitoring rule, validation step, automation, documentation, capacity guardrail처럼 owner와 완료 조건이 있는 변경이어야 한다. 효과를 나중에 확인할 measurement도 같이 정의한다.",
        "좋은 postmortem은 과거를 설명하면서 다음 incident의 발생 확률과 복구 시간을 줄인다.")
    ],
    example:ex("사용자에게 무엇을 알려야 하는가?","특정 partition에서 job launch failure가 증가했지만 아직 root cause는 확정되지 않았다.",[
      {label:"Fact",text:"22:10부터 partition A의 일부 node에서 launch failure가 관찰되고 있으며 기존 running job 영향은 아직 확인되지 않았다."},
      {label:"Impact",text:"현재 신규 job 일부가 재시도되고 있어 start delay가 발생할 수 있음을 알린다."},
      {label:"Hypothesis",text:"node-side launch path를 조사 중이라고 표현하되 daemon failure라고 확정하지 않는다."},
      {label:"Next",text:"문제 node와 정상 node의 slurmd/cgroup evidence를 비교한 뒤 영향 범위를 갱신하겠다고 약속한다."}
    ],"사실, 영향, 가설, 다음 행동을 분리하면 root cause 확정 전에도 유용한 사용자 업데이트를 제공할 수 있다."),
    selfCheck:[
      q("Ticket에 raw log만 붙이는 방식의 가장 큰 문제는?","관찰과 해석, 다음 행동의 연결이 없어 다른 사람이 같은 의사결정을 재현하기 어렵다는 점이다."),
      q("사용자 업데이트에서 가설을 사실과 분리해야 하는 이유는?","검증되지 않은 원인을 확정적으로 전달하면 잘못된 기대와 조치를 만들고 이후 신뢰를 떨어뜨릴 수 있기 때문이다."),
      q("좋은 postmortem action item의 조건은?","owner와 완료 조건이 있고 재발 방지·detection·mitigation을 실제로 바꾸며 효과를 확인할 수 있어야 한다.")
    ]
  },
  "roadmap": {
    learningObjectives:[
      "30/60/90일 학습 목표를 지식량이 아니라 독립적으로 처리 가능한 incident 범위로 정의할 수 있다.",
      "관찰 → 가설 → 검증 → 조치 → validation → 기록의 공통 workflow를 모든 ticket에 반복 적용할 수 있다.",
      "혼자 해결해야 할 문제와 escalation해야 할 문제를 권한·위험·증거 수준에 따라 구분할 수 있다."
    ],
    terms:[
      term("Competency","역량","특정 문제를 안전하고 재현 가능하게 처리할 수 있는 지식·기술·판단의 조합이다.","로드맵을 단순 챕터 완료율이 아니라 실제 업무 가능 범위로 평가하게 해 준다."),
      term("Evidence habit","증거 습관","조치 전에 baseline과 timestamp가 있는 증거를 남기는 반복 행동이다.","초기 증거가 사라지는 운영 환경에서 RCA 품질을 크게 좌우한다."),
      term("Supervised operation","감독 하 작업","고위험 조치를 경험자 확인 아래 수행하는 학습 단계다.","관리자 권한과 production 변경을 안전하게 배우는 경계가 된다."),
      term("Independent closure","독립 종결","ticket을 접수해 재현·진단·조치·validation·communication까지 스스로 완료할 수 있는 상태다.","신입 성장의 실질적 결과를 측정하는 지표다."),
      term("Escalation","에스컬레이션","권한, 위험, 전문성 또는 영향 범위 때문에 더 적절한 owner에게 문제를 넘기는 행동이다.","모든 문제를 혼자 해결하려는 행동보다 정확한 evidence와 handoff가 더 전문적일 수 있다."),
      term("Lab log","실습 기록","명령, 출력, 해석, 실패한 가설, 다음 행동을 남긴 개인 학습 기록이다.","명령 암기보다 반복 가능한 reasoning pattern을 만든다.")
    ],
    sections:[
      sec("30일의 목표는 cluster를 안전하게 관찰하는 것이다",
        "초기에는 Linux process/file/permission, cluster topology, Slurm lifecycle, job state와 기본 resource metric을 익힌다. 중요한 기준은 많은 관리자 명령을 아는 것이 아니라 production을 변경하지 않고 현재 상태를 정확히 설명할 수 있는가이다.",
        "모든 실습에서 command와 output만 저장하지 말고 '이 출력이 어떤 가설을 지지하는가'를 한 줄로 기록한다. 이 습관은 이후 성능과 RCA 단계에서도 동일하게 사용된다.",
        "첫 30일의 성공 기준은 안전한 관찰과 정확한 상태 설명이다."),
      sec("60일에는 단일 symptom을 여러 subsystem으로 분해한다",
        "MPI/OpenMP, NUMA, storage, network, performance baseline을 배우면 slow job이나 failed job을 CPU 문제 하나로 보지 않고 compute, memory, I/O, communication, allocation 경계로 나눌 수 있다. supervised ticket에서 첫 세 가지 증거와 분기 기준을 스스로 제안해 본다.",
        "정답 명령을 외우기보다 정상 baseline과 문제 run을 비교하는 습관을 만든다. site-specific policy나 privileged action이 필요한 순간에는 어떤 evidence까지 확보하고 누구에게 escalation할지도 함께 연습한다.",
        "60일의 목표는 증상을 subsystem hypothesis로 변환하고 안전한 next test를 선택하는 것이다."),
      sec("90일 이후에는 기술 판단과 운영 책임을 연결한다",
        "profiling, GPU/container, runbook, postmortem까지 익힌 뒤에는 제한된 범위의 ticket을 처음부터 끝까지 독립적으로 닫는 것을 목표로 한다. 여기에는 사용자 업데이트와 validation, 문서화가 포함된다.",
        "그 이후에는 capacity, scheduler policy, benchmark governance처럼 한 job보다 서비스 전체에 영향을 주는 의사결정을 다룬다. 이 단계에서는 개인의 command skill보다 trade-off 설명, change review, blast radius와 rollback 계획이 더 중요해진다.",
        "전문성의 확장은 더 위험한 명령을 아는 것이 아니라 더 넓은 영향 범위를 책임 있게 판단하는 방향이어야 한다.")
    ],
    example:ex("60일 차 AA가 low-CPU ticket을 받았다","직접 해결 여부보다 어떤 reasoning을 보여 주는지가 중요하다.",[
      {label:"재현",text:"job ID, allocation, baseline wall time과 현재 symptom을 확인한다."},
      {label:"분류",text:"CPU idle, D-state, I/O wait, MPI imbalance, memory pressure를 구분할 첫 관찰을 선택한다."},
      {label:"경계",text:"node admin 권한이나 service restart가 필요하면 evidence를 묶어 적절한 owner에게 escalation한다."},
      {label:"종결",text:"조치 후 동일 조건 validation과 사용자 업데이트, lab log를 남긴다."}
    ],"역량은 '혼자 다 했다'가 아니라 안전한 evidence workflow와 적절한 escalation을 포함해 평가한다."),
    selfCheck:[
      q("30일 차의 핵심 목표를 관리자 명령 습득으로 잡지 않는 이유는?","초기에는 production 변경보다 안전한 관찰과 정확한 상태 설명이 우선이며 이것이 이후 모든 RCA의 기반이기 때문이다."),
      q("Independent closure에 사용자 communication이 포함되는 이유는?","기술 조치가 끝나도 영향과 validation, 다음 행동이 전달되지 않으면 운영 ticket은 실제로 종료된 것이 아니기 때문이다."),
      q("Escalation은 실패인가?","아니다. 권한·위험·전문성 경계를 인식하고 충분한 evidence와 함께 적절한 owner에게 넘기는 것은 핵심 운영 역량이다.")
    ]
  },
  "selftest": {
    learningObjectives:[
      "정의 암기형 질문보다 symptom에서 next-best-test를 선택하는 실무형 self-test를 수행할 수 있다.",
      "관찰 결과에 따라 가설 우선순위를 갱신하고 다음 명령이 왜 필요한지 설명할 수 있다.",
      "불충분한 증거에서 조치를 멈추고 추가 확인 또는 escalation을 선택하는 stopping rule을 적용할 수 있다."
    ],
    terms:[
      term("Decision tree","Decision tree","관찰 결과에 따라 다음 질문과 행동이 달라지는 분기 구조다.","실제 incident는 정답 명령 하나보다 조건부 판단의 연속이기 때문이다."),
      term("Next-best-test","Next-best-test","현재 가설들을 가장 효율적으로 구분해 줄 다음 관찰이다.","명령을 많이 실행하는 것보다 정보 가치가 높은 검사를 선택하게 한다."),
      term("Evidence update","Evidence update","새 관찰에 따라 가설의 우선순위를 올리거나 낮추는 과정이다.","첫 인상에 고정되는 confirmation bias를 줄인다."),
      term("Stopping rule","Stopping rule","증거가 부족하거나 조치 위험이 높을 때 더 이상의 변경을 멈추는 기준이다.","진단 과정이 production damage로 이어지는 것을 막는다."),
      term("Confidence","Confidence","현재 결론이 증거로 얼마나 잘 지지되는지의 수준이다.","확정 사실, 높은 가능성, 미확인 가설을 communication에서 구분하게 한다."),
      term("Transfer","Transfer of learning","배운 개념을 처음 보는 symptom이나 다른 환경에 적용하는 능력이다.","실무 역량은 정의를 기억하는 것보다 새로운 사건에 reasoning pattern을 옮기는 능력으로 드러난다.")
    ],
    sections:[
      sec("좋은 Self-test는 '무엇인가?'보다 '다음에 무엇을 볼 것인가?'를 묻는다",
        "HPC 실무에서는 모든 명령 옵션을 기억할 필요가 없다. 중요한 것은 pending, OOM, low CPU, MPI hang, low GPU 같은 symptom을 받았을 때 첫 가설을 여러 개 만들고 가장 정보 가치가 높은 관찰을 선택하는 것이다.",
        "따라서 self-test는 정답 명령 하나가 아니라 '이 결과가 나오면 다음 분기는 무엇인가'까지 요구해야 한다. 동일한 command도 symptom context가 다르면 의미가 달라지므로 interpretation을 함께 말해야 한다.",
        "실무 시험의 최소 답안 구조는 symptom → hypothesis → test → interpretation → next action이다."),
      sec("새 증거는 기존 가설을 바꿔야 한다",
        "예를 들어 low CPU job에서 iostat가 정상이고 모든 rank가 barrier에서 기다린다면 storage 가설은 내려가고 imbalance 또는 communication 가설이 올라가야 한다. 반대로 D-state와 filesystem latency가 동시에 증가하면 I/O path를 더 깊게 본다.",
        "좋은 분석가는 처음 세운 가설을 지키려 하지 않는다. 각 관찰이 어떤 가설을 지지하고 반박하는지 말할 수 있어야 하며, 설명력이 떨어진 가설은 과감히 버린다.",
        "Self-test는 정답을 맞히는 시험이 아니라 evidence에 따라 사고를 수정하는 훈련이다."),
      sec("모른다는 판단과 escalation도 정답이 될 수 있다",
        "관리자 권한이 필요한 kernel log, destructive benchmark, service restart처럼 위험한 행동은 학습자의 권한과 incident severity에 따라 실행하면 안 될 수 있다. 이때 필요한 evidence를 정리하고 안전한 owner에게 escalation하는 것이 더 좋은 답이다.",
        "또한 상관관계만 있고 causal evidence가 부족하면 root cause를 확정하지 않는다. confidence 수준과 남은 uncertainty를 적고 다음 관찰 또는 monitoring 계획을 제시한다.",
        "전문적인 self-test 답안은 행동 능력뿐 아니라 멈춰야 할 경계도 보여 준다.")
    ],
    example:ex("MPI hang 15분 drill","일부 rank의 CPU가 0%이고 job은 종료되지 않는다. 첫 세 명령보다 중요한 것은 분기 기준이다.",[
      {label:"생존 확인",text:"rank/process가 모두 살아 있는지와 state 차이를 확인한다."},
      {label:"Wait 분류",text:"D-state·filesystem wait인지, MPI collective/barrier 대기인지, failed rank propagation인지 구분한다."},
      {label:"비교",text:"node/rank별 stack과 network/filesystem evidence를 같은 시각에 맞춘다."},
      {label:"정지 기준",text:"privileged tracing이나 service 변경이 필요하면 현재 evidence와 hypothesis를 묶어 escalation한다."}
    ],"좋은 답은 명령 목록이 아니라 관찰 결과에 따라 다음 행동이 달라지는 decision tree다."),
    selfCheck:[
      q("Next-best-test가 단순히 가장 익숙한 명령과 다른 점은?","현재 경쟁하는 가설들을 가장 잘 구분해 정보량을 크게 늘리는 관찰을 선택한다는 점이다."),
      q("새 evidence가 첫 가설과 충돌하면 어떻게 해야 하는가?","가설의 confidence를 낮추고 다른 가설의 우선순위를 갱신해야 하며, 기존 결론을 지키기 위해 evidence를 무시하면 안 된다."),
      q("Self-test에서 escalation이 정답이 될 수 있는 경우는?","권한·위험·영향 범위가 학습자 범위를 넘거나 root cause 확정에 필요한 조치가 destructive/privileged할 때다.")
    ]
  },
  "reference": {
    learningObjectives:[
      "upstream 공식 문서, local site policy, 설치된 버전의 --help/man을 서로 다른 authority로 구분할 수 있다.",
      "명령을 알파벳순으로 외우는 대신 symptom과 troubleshooting decision에 연결된 command index를 설계할 수 있다.",
      "버전·site configuration 차이가 큰 HPC 환경에서 provenance를 남기며 reference를 검증하는 습관을 만들 수 있다."
    ],
    terms:[
      term("Primary source","Primary source","프로젝트의 공식 specification, manual, upstream documentation처럼 기능과 의미를 직접 정의하는 자료다.","블로그보다 API semantics와 version behavior를 확인하는 기준점이 된다."),
      term("Local policy","Local policy","특정 HPC site가 정한 partition, QoS, module, filesystem, security, support 절차다.","upstream에서 가능한 기능이라도 site에서는 다르게 제한되거나 구성될 수 있다."),
      term("Version drift","Version drift","문서 예제와 실제 설치 버전 사이 기능·옵션·기본값이 달라지는 현상이다.","오래된 인터넷 명령을 그대로 적용하는 위험을 설명한다."),
      term("Provenance","Provenance","결과가 어떤 software/hardware/configuration과 reference를 기준으로 만들어졌는지 추적 가능한 정보다.","나중에 동일 분석을 재현하고 문서 변경 영향을 확인할 수 있다."),
      term("Command index","Command index","문제 유형과 관찰 목적에 따라 명령을 찾을 수 있게 정리한 색인이다.","도구 이름을 기억하지 못해도 symptom에서 필요한 관찰로 이동할 수 있다."),
      term("Authority boundary","Authority boundary","upstream specification, implementation documentation, local policy가 각각 결정하는 범위의 차이다.","서로 충돌해 보이는 문서가 있을 때 어느 자료가 실제 환경을 지배하는지 판단하게 한다.")
    ],
    sections:[
      sec("HPC Reference는 한 문서가 아니라 authority stack이다",
        "MPI semantics는 MPI standard가 기준이지만 실제 launcher 옵션과 transport behavior는 Open MPI나 MPICH 구현 문서를 봐야 한다. Slurm 기능은 upstream 문서가 설명하지만 어떤 partition과 QoS를 쓸 수 있는지는 local site policy가 결정한다. Linux command option도 설치된 버전의 man page가 가장 직접적일 수 있다.",
        "따라서 reference를 찾을 때는 질문이 specification인지 implementation인지 site configuration인지 먼저 구분한다. 검색 엔진 결과를 바로 실행하기보다 official source와 local --help/man, site documentation을 교차 확인한다.",
        "Reference skill은 문서를 많이 아는 것이 아니라 질문에 맞는 authority를 선택하는 능력이다."),
      sec("Command index는 도구 이름이 아니라 troubleshooting decision으로 조직한다",
        "lscpu, vmstat, pidstat, iostat를 알파벳순으로 모으면 실제 incident에서 무엇부터 써야 할지 결정하기 어렵다. 대신 CPU saturation, memory pressure, blocked I/O, network error, scheduler pending처럼 symptom별로 첫 관찰과 해석을 묶는 편이 유용하다.",
        "각 명령에는 privilege, overhead, destructive 여부, expected output과 다음 분기도 기록한다. 예를 들어 perf나 strace는 production overhead를 고려해야 하고, 관리자 명령은 read-only인지 state-changing인지 구분해야 한다.",
        "좋은 command index는 도구 사전이 아니라 안전한 decision support다."),
      sec("Reference도 provenance와 maintenance가 필요하다",
        "공식 문서 URL만 저장해도 버전이 바뀌면 설명이 달라질 수 있다. 중요 runbook이나 benchmark는 확인한 software version, 문서 version 또는 access date, local policy revision을 함께 남기는 것이 좋다.",
        "교재 자체도 같은 원칙을 따른다. 외부 문서는 사실 확인 reference로 사용하고, 설명과 도식은 직접 작성하며, source registry에서 어떤 chapter가 어떤 문서를 참고했는지 추적한다. 이 구조는 기술 신뢰성과 라이선스 관리 둘 다에 도움이 된다.",
        "Reference desk는 정적 링크 모음이 아니라 버전과 판단 근거를 추적하는 운영 자산이다.")
    ],
    example:ex("인터넷의 srun 예제가 site에서 동작하지 않는다","예제를 틀렸다고 단정하기 전에 authority boundary를 확인한다.",[
      {label:"Local help",text:"현재 설치된 srun --help와 Slurm version을 확인한다."},
      {label:"Upstream",text:"해당 version의 Slurm 공식 문서에서 option semantics를 확인한다."},
      {label:"Site policy",text:"partition, account, QoS, plugin 제한이 local documentation에 있는지 본다."},
      {label:"기록",text:"ticket이나 lab log에 version과 policy 차이를 남겨 다음 사용자가 재현할 수 있게 한다."}
    ],"Upstream에서 가능한 것과 현재 site에서 허용·구성된 것은 별개의 질문일 수 있다."),
    selfCheck:[
      q("MPI 표준과 Open MPI 문서는 어떤 차이가 있는가?","MPI 표준은 API semantics를 정의하고 Open MPI 문서는 특정 구현의 실행 방법과 behavior를 설명한다."),
      q("왜 local man page를 인터넷 예제보다 먼저 확인할 때가 있는가?","실제 설치 버전의 옵션과 기본값을 반영하므로 version drift를 줄일 수 있기 때문이다."),
      q("Command index에 privilege와 overhead를 기록해야 하는 이유는?","진단 명령 자체가 production에 영향을 주거나 권한 경계를 넘을 수 있으므로 안전한 선택을 위해 필요하다.")
    ]
  }
});
