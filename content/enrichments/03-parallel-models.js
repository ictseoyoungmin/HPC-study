const term=(term,en,definition,why)=>({term,en,definition,why});
const sec=(title,p1,p2,takeaway)=>({title,paragraphs:[p1,p2],takeaway});
const q=(question,answer)=>({question,answer});
const ex=(title,intro,steps,conclusion)=>({title,intro,steps,conclusion});

export const enhancements = Object.freeze({
  "pthreads-openmp": {
    learningObjectives:[
      "process와 thread의 memory 공유 경계를 설명하고 shared-memory parallelism이 한 Node 안에서 동작하는 이유를 설명할 수 있다.",
      "race condition, critical section, reduction, barrier가 각각 어떤 문제를 해결하고 어떤 비용을 만드는지 구분할 수 있다.",
      "OpenMP thread 수와 affinity를 Slurm allocation, Core/SMT/NUMA topology와 연결해 설정할 수 있다."
    ],
    terms:[
      term("Thread","실행 흐름","한 process의 address space를 공유하면서 독립적으로 스케줄되는 실행 흐름이다. 각 thread는 자신의 stack과 register 상태를 갖지만 heap과 전역 데이터는 보통 공유한다.","공유 데이터가 있다는 사실 때문에 병렬화가 쉬워지는 동시에 race condition도 생긴다."),
      term("Shared memory","공유 메모리","여러 thread가 같은 virtual address space의 데이터를 load/store로 직접 접근하는 실행 모델이다.","MPI처럼 명시적 message를 보내지 않아도 되지만 locality와 synchronization 비용을 함께 봐야 한다."),
      term("Race condition","경쟁 상태","실행 순서에 따라 결과가 달라지는 잘못된 공유 데이터 접근이다.","성능 문제가 아니라 correctness 문제이며 재현이 간헐적일 수 있다."),
      term("Reduction","축약 연산","각 thread가 만든 부분 결과를 합·최대·최소 같은 연산으로 하나의 값으로 결합하는 패턴이다.","공유 변수에 매 반복마다 lock을 거는 대신 thread-private 결과를 합칠 수 있다."),
      term("Affinity","CPU affinity","thread가 실행될 수 있는 logical CPU/Core 범위를 제한하거나 고정하는 정책이다.","thread 수가 같아도 placement에 따라 cache locality와 NUMA memory path가 달라진다.")
    ],
    sections:[
      sec("왜 thread는 빠를 수도 있고 위험할 수도 있는가",
        "한 process 안의 thread들은 코드와 heap, 전역 데이터를 공유하므로 큰 배열을 복사하거나 process 사이에 메시지를 보내지 않고도 같은 데이터를 계산할 수 있다. 이 특성은 single-node 병렬화의 가장 큰 장점이다.",
        "그러나 같은 주소를 여러 thread가 동시에 갱신하면 실행 순서가 프로그램 결과에 영향을 줄 수 있다. 따라서 shared-memory parallelism의 첫 질문은 thread를 몇 개 만들 것인가가 아니라 어떤 데이터가 공유되고 어떤 데이터가 thread-private인가이다.",
        "병렬화 전에 공유 상태와 ownership을 먼저 그릴 수 있어야 한다."),
      sec("동기화는 정답을 지키지만 공짜가 아니다",
        "critical, lock, atomic, barrier는 서로 다른 범위의 동기화를 제공한다. critical section은 한 번에 한 thread만 특정 구간을 실행하게 하고, barrier는 모든 thread가 특정 지점에 도착할 때까지 기다리게 한다.",
        "정답을 지키기 위해 필요한 동기화라도 빈도가 높거나 범위가 크면 serial bottleneck이 된다. reduction처럼 더 적합한 병렬 패턴으로 바꿀 수 있는지, barrier가 정말 필요한 시점인지 검토해야 한다.",
        "동기화 문제는 correctness와 scalability를 동시에 다루는 문제다."),
      sec("OpenMP thread 수는 hardware topology와 함께 결정한다",
        "OMP_NUM_THREADS=32는 단순히 숫자 32를 의미하지 않는다. 해당 Job에 허용된 CPU가 몇 개인지, physical Core가 몇 개인지, SMT가 켜져 있는지, thread들이 어느 Socket/NUMA domain에 배치되는지를 함께 봐야 한다.",
        "allocation보다 많은 thread를 만들면 oversubscription이 생길 수 있고, 모든 thread를 한 Socket에 몰면 memory bandwidth가 한쪽에 집중될 수 있다. 반대로 지나치게 spread하면 공유 cache locality가 나빠질 수 있다.",
        "thread count와 binding은 workload 특성에 맞춰 함께 측정해야 한다.")
    ],
    example:ex("CPU 50%인데 OpenMP가 느린 경우",
      "16 Core를 요청한 Job이 16 thread를 만들었는데도 CPU 사용률이 절반 수준이라면 thread 수만 다시 늘리는 것이 첫 조치는 아니다.",
      [
        {label:"Allocation 확인",text:"Slurm에서 실제 허용된 CPU 수와 cpuset을 확인한다."},
        {label:"Binding 확인",text:"OMP_DISPLAY_ENV와 taskset/affinity 정보를 통해 thread placement를 확인한다."},
        {label:"대기 구간 분리",text:"barrier, critical, I/O wait, serial region이 시간을 차지하는지 구간별로 본다."},
        {label:"다시 측정",text:"동일 input에서 thread 수와 binding만 바꾸어 반복 측정한다."}
      ],
      "낮은 CPU 사용률은 항상 thread 수 부족을 뜻하지 않는다. serial section, imbalance, synchronization, I/O wait도 같은 증상을 만든다."),
    selfCheck:[
      q("thread와 process의 가장 중요한 memory 관점 차이는 무엇인가?","같은 process의 thread들은 일반적으로 address space와 heap을 공유하지만 서로 다른 process는 독립 address space를 갖는다."),
      q("critical section을 reduction으로 바꾸면 왜 빨라질 수 있는가?","각 반복이 하나의 공유 변수를 lock으로 갱신하는 대신 thread별 부분 결과를 만든 뒤 마지막에 결합하므로 동기화 빈도를 줄일 수 있기 때문이다."),
      q("OMP_NUM_THREADS를 physical Core 수와 항상 같게 해야 하는가?","아니다. SMT, workload의 compute/memory 특성, allocation, affinity, NUMA 구조에 따라 최적 thread 수는 달라질 수 있어 반복 측정이 필요하다.")
    ]
  },

  "openmp-advanced": {
    learningObjectives:[
      "static, dynamic, guided schedule의 work distribution과 scheduling overhead 차이를 설명할 수 있다.",
      "OpenMP task가 loop worksharing과 다른 문제를 해결하는 모델임을 설명할 수 있다.",
      "thread imbalance와 affinity 문제를 runtime 설정과 timeline 관점에서 진단할 수 있다."
    ],
    terms:[
      term("Schedule","루프 분배 정책","OpenMP loop iteration을 thread에 어떤 단위와 시점으로 배분할지 정하는 정책이다.","같은 thread 수라도 work imbalance와 runtime overhead가 크게 달라질 수 있다."),
      term("Static schedule","정적 분배","iteration 범위를 실행 전에 thread에 고정적으로 나누는 방식이다.","반복당 비용이 비슷하면 overhead가 낮고 재현성이 좋다."),
      term("Dynamic schedule","동적 분배","thread가 일을 마칠 때마다 다음 chunk를 runtime에서 받아 가는 방식이다.","불균형을 줄일 수 있지만 scheduling 요청 자체의 overhead가 생긴다."),
      term("Task","작업 단위","loop index가 아니라 독립 작업과 dependency를 runtime에 표현하는 OpenMP 실행 단위다.","불규칙 graph나 recursive workload에 유용하지만 너무 작은 task는 overhead가 커진다."),
      term("Load imbalance","작업 불균형","일부 thread가 일을 끝낸 뒤 다른 thread를 기다리는 상태다.","CPU가 충분히 있는데도 barrier 전 대기 시간이 길어져 scaling을 제한한다.")
    ],
    sections:[
      sec("schedule은 iteration 비용의 분포를 다루는 도구다",
        "모든 iteration의 계산량이 비슷하면 static 분배가 단순하고 효율적이다. 반대로 특정 iteration만 오래 걸리면 static에서는 어떤 thread가 일찍 끝나고 barrier에서 기다리는 시간이 커질 수 있다.",
        "dynamic이나 guided는 남은 일을 runtime이 재분배해 imbalance를 줄일 수 있지만 chunk 관리와 synchronization 비용이 추가된다. 따라서 schedule 선택은 이름의 선호가 아니라 iteration cost 분포를 보고 결정해야 한다.",
        "schedule 선택의 핵심은 work balance와 scheduling overhead의 trade-off다."),
      sec("chunk size가 너무 작아도 너무 커도 문제다",
        "dynamic schedule에서 chunk가 너무 크면 다시 imbalance가 남고, 너무 작으면 work request와 bookkeeping 횟수가 늘어난다. guided는 큰 chunk에서 시작해 점차 작게 만들며 두 문제를 절충하려는 전략이다.",
        "benchmark에서는 schedule 종류만 기록하지 말고 chunk size도 함께 기록해야 한다. 특히 짧은 loop에서는 scheduling overhead가 실제 계산보다 커질 수 있다.",
        "schedule과 chunk size는 하나의 실험 변수 묶음으로 다룬다."),
      sec("task는 irregular parallelism을 표현하지만 granularity가 핵심이다",
        "task는 tree traversal, irregular dependency, producer-consumer처럼 iteration 수만으로 표현하기 어려운 작업을 runtime에 제출할 수 있다. dependency clause를 사용하면 어떤 task가 선행 결과를 기다려야 하는지도 표현할 수 있다.",
        "하지만 수 마이크로초짜리 작업을 수백만 개의 task로 만들면 생성·queue·steal 비용이 계산을 압도할 수 있다. task를 만드는 것 자체가 병렬화가 아니라 충분한 granularity와 dependency 구조를 설계하는 것이 병렬화다.",
        "task 수보다 task당 유용한 계산량과 dependency chain을 본다.")
    ],
    example:ex("static은 느리고 dynamic은 빠른 loop",
      "iteration마다 계산량이 크게 다른 loop를 예로 들어 schedule 선택을 단계적으로 해석한다.",
      [
        {label:"분포 확인",text:"iteration별 또는 thread별 수행 시간을 측정해 한두 thread에 긴 tail이 있는지 본다."},
        {label:"Static baseline",text:"static schedule에서 barrier 도착 시각 차이를 기록한다."},
        {label:"Dynamic 비교",text:"동일 input에서 dynamic과 여러 chunk size를 반복 측정한다."},
        {label:"총 비용 확인",text:"imbalance 감소분이 scheduling overhead 증가분보다 큰지 판단한다."}
      ],
      "dynamic이 빠른 이유를 '동적이라서'가 아니라 실제 imbalance를 줄였기 때문이라고 설명할 수 있어야 한다."),
    selfCheck:[
      q("static schedule이 유리한 대표 조건은 무엇인가?","iteration별 계산량이 비슷하고 scheduling overhead를 최소화하고 싶을 때다."),
      q("dynamic schedule의 chunk를 매우 작게 하면 왜 항상 좋아지지 않는가?","load balance는 세밀해질 수 있지만 runtime이 work를 분배하는 횟수와 synchronization/bookkeeping 비용이 늘기 때문이다."),
      q("OpenMP task와 loop schedule의 핵심 차이는 무엇인가?","loop schedule은 iteration 분배가 중심이고 task는 독립 작업과 dependency graph를 runtime에 표현하는 모델이다.")
    ]
  },

  "mpi-basics": {
    learningObjectives:[
      "MPI rank, process, communicator, message matching의 관계를 설명할 수 있다.",
      "point-to-point와 collective communication의 실행 조건과 대기 원인을 구분할 수 있다.",
      "rank 수와 Node 수, rank placement를 분리해 multi-node hang과 성능 저하를 진단할 수 있다."
    ],
    terms:[
      term("Rank","MPI rank","communicator 안에서 각 MPI process를 구분하는 정수 ID다.","rank 번호는 process의 논리적 ID이고 실제 Node 위치와 동일하지 않다."),
      term("Communicator","통신 도메인","서로 통신할 수 있는 process 집합과 rank numbering, communication context를 정의한다.","collective 참여 범위와 message matching 범위를 결정한다."),
      term("Point-to-point","P2P 통신","한 source rank와 한 destination rank 사이에 message를 보내고 받는 통신이다.","source, destination, tag, communicator 조건이 맞지 않으면 receive가 기다릴 수 있다."),
      term("Collective","집단 통신","broadcast, reduce, allreduce처럼 communicator의 여러 rank가 함께 참여하는 통신 연산이다.","일부 rank가 다른 collective를 호출하거나 늦게 도착하면 전체 progress가 멈춘 것처럼 보일 수 있다."),
      term("Placement","rank 배치","각 rank가 어느 Node/Socket/Core에 배치되는지를 뜻한다.","같은 rank 수라도 placement에 따라 network traffic, NUMA locality, collective 성능이 달라진다.")
    ],
    sections:[
      sec("MPI는 분산 메모리를 명시적으로 연결한다",
        "서로 다른 MPI rank는 기본적으로 독립 process이며 각각 자신의 virtual address space를 가진다. 한 Node 안에 함께 있어도 다른 rank의 변수 주소를 일반 load/store로 직접 읽는 모델이 아니다.",
        "따라서 데이터 의존성이 Node나 process 경계를 넘으면 message나 collective 같은 명시적 communication이 필요하다. 이 점이 shared-memory OpenMP와 MPI를 구분하는 가장 중요한 출발점이다.",
        "MPI를 이해할 때 먼저 memory boundary를 그린다."),
      sec("message matching이 맞아야 P2P가 진행된다",
        "send와 receive는 단순히 두 함수가 있다는 이유만으로 연결되지 않는다. communicator, source/destination, tag 조건이 서로 맞아야 하고, blocking call이라면 상대 통신이나 buffer 상태에 따라 기다릴 수 있다.",
        "hang 분석에서는 마지막 로그 한 줄보다 각 rank가 어떤 call에 들어가 있는지 비교하는 것이 중요하다. 한 rank의 조건 불일치나 분기 차이가 전체 Job의 정지처럼 보일 수 있다.",
        "MPI hang은 rank별 control flow를 나란히 비교해야 한다."),
      sec("collective는 전체 참여자의 시간에 영향을 받는다",
        "broadcast, reduce, allreduce 같은 collective는 communicator 단위의 협력 작업이다. 모든 rank가 같은 순서로 collective에 진입해야 하며, 구현체는 tree, ring, recursive doubling 같은 여러 알고리즘을 message size와 topology에 따라 선택할 수 있다.",
        "한 rank가 계산이나 I/O에서 늦어지면 다른 rank들이 collective에서 기다리는 시간이 길어질 수 있다. 따라서 collective 시간이 길다고 해서 항상 network만 문제인 것은 아니다.",
        "collective 성능은 communication cost와 straggler 도착 시간을 함께 포함한다."),
      sec("rank 수와 Node 수를 분리해서 기록한다",
        "-n 64는 rank 64개를 뜻할 뿐 Node 64개를 뜻하지 않는다. Node당 rank 수, Socket당 rank 수, rank의 CPU binding이 실제 placement를 결정한다.",
        "같은 64 rank라도 2 Node에 32개씩 배치하는 경우와 8 Node에 8개씩 배치하는 경우는 memory pressure와 network traffic이 전혀 다르다. benchmark와 ticket에는 rank→Node mapping을 남겨야 한다.",
        "MPI 규모는 rank count와 physical placement를 함께 기록한다.")
    ],
    example:ex("8 rank Job이 collective에서 멈춘 경우",
      "모든 rank의 stack이나 progress 정보를 비교해 collective mismatch와 straggler를 구분한다.",
      [
        {label:"Placement",text:"각 rank가 어느 Node에 있는지 확인해 특정 Node에 문제가 집중되는지 본다."},
        {label:"Call sequence",text:"각 rank가 같은 collective를 같은 순서로 호출했는지 비교한다."},
        {label:"Straggler",text:"한 rank만 I/O나 계산에서 늦어 collective에 늦게 도착하는지 확인한다."},
        {label:"Transport",text:"control flow가 정상일 때 message size와 network/transport 증거를 추가한다."}
      ],
      "collective wait는 network 장애, call mismatch, 계산 imbalance 모두가 만들 수 있으므로 rank별 진행 상태가 첫 증거다."),
    selfCheck:[
      q("MPI rank와 Node가 같은 개념이 아닌 이유는 무엇인가?","rank는 MPI process의 논리적 ID이고 하나의 Node에 여러 rank가 배치될 수 있기 때문이다."),
      q("collective 시간이 길면 network가 느리다고 바로 결론 내리면 안 되는 이유는?","한 rank가 계산이나 I/O에서 늦게 도착해도 나머지 rank가 collective에서 기다리므로 collective 시간에 straggler가 포함될 수 있기 때문이다."),
      q("P2P hang에서 먼저 비교할 네 가지 message matching 요소는?","communicator, source, destination, tag와 각 rank의 call sequence를 확인한다.")
    ]
  },

  "mpi-advanced": {
    learningObjectives:[
      "nonblocking communication의 시작과 completion을 구분하고 overlap이 자동으로 보장되지 않는 이유를 설명할 수 있다.",
      "RMA one-sided communication에서 memory window와 synchronization epoch의 역할을 설명할 수 있다.",
      "message size, communication topology, progress engine, placement를 scale-out 성능과 연결해 해석할 수 있다."
    ],
    terms:[
      term("Nonblocking","비동기 시작 API","MPI_Isend/Irecv처럼 operation을 시작하고 request handle을 반환하는 통신 방식이다.","함수 반환과 데이터 전송 완료는 다른 사건이므로 Wait/Test로 completion을 확인해야 한다."),
      term("Request","요청 객체","진행 중인 nonblocking operation의 상태를 추적하는 MPI handle이다.","buffer 재사용 시점과 completion correctness를 결정한다."),
      term("Overlap","통신-계산 중첩","communication progress와 독립 계산을 시간상 겹쳐 total runtime을 줄이는 전략이다.","nonblocking API를 썼다는 사실만으로 실제 overlap이 발생하는 것은 아니다."),
      term("RMA","Remote Memory Access","한 rank가 remote window의 memory에 put/get/accumulate 같은 one-sided operation을 수행하는 모델이다.","통신 상대의 명시적 send/recv 호출을 줄일 수 있지만 synchronization semantics가 더 중요해진다."),
      term("Progress","통신 진행","시작된 MPI operation이 실제로 network에서 진행되고 completion에 도달하는 과정이다.","implementation, progress thread, NIC offload, application call pattern에 따라 overlap 정도가 달라질 수 있다.")
    ],
    sections:[
      sec("nonblocking은 '시작'과 '완료'를 분리한다",
        "MPI_Irecv나 MPI_Isend는 통신을 시작하고 request를 돌려준다. 함수가 반환됐다고 해서 remote rank가 데이터를 이미 받았거나 send buffer를 즉시 안전하게 덮어써도 된다는 뜻은 아니다.",
        "프로그램은 MPI_Wait, MPI_Test 계열로 completion을 확인해야 한다. 이 구분을 놓치면 간헐적인 data corruption이나 잘못된 성능 측정이 생길 수 있다.",
        "nonblocking의 핵심은 call return이 아니라 operation lifetime이다."),
      sec("overlap은 독립 계산과 실제 progress가 있어야 생긴다",
        "대표 halo exchange는 Irecv를 먼저 게시하고 Isend를 시작한 뒤, remote data와 무관한 interior 계산을 수행하고 마지막에 Waitall로 completion을 확인하는 구조를 사용할 수 있다.",
        "하지만 MPI implementation이 application이 MPI call을 하지 않는 동안 충분히 progress하지 않거나, 계산이 memory bandwidth를 포화해 통신과 자원을 경쟁하면 기대한 overlap이 나타나지 않을 수 있다.",
        "overlap은 코드 구조와 runtime/NIC progress를 측정으로 확인한다."),
      sec("RMA와 topology는 synchronization 모델을 바꾼다",
        "RMA는 memory window를 노출하고 remote operation을 수행한다. 이때 어느 시점에 누가 접근할 수 있고 언제 결과가 visible한지를 synchronization epoch와 memory model에 따라 지켜야 한다.",
        "또한 Cartesian/graph communicator나 neighborhood collective를 사용하면 application의 통신 패턴을 runtime에 표현할 수 있다. 실제 이득은 implementation과 topology mapping에 따라 달라지므로 API 사용 자체를 성능 개선으로 간주하지 않는다.",
        "고급 MPI에서는 communication semantics와 physical topology를 함께 설계한다.")
    ],
    example:ex("nonblocking halo exchange가 빨라지지 않는 경우",
      "API를 바꾼 뒤에도 runtime이 그대로일 때 overlap이 실제 발생했는지 검증한다.",
      [
        {label:"Timeline",text:"Irecv/Isend, interior compute, Waitall의 시간을 tracing 또는 구간 측정으로 분리한다."},
        {label:"Independent work",text:"communication과 겹칠 수 있는 계산량이 충분한지 확인한다."},
        {label:"Progress",text:"MPI runtime의 progress 특성과 transport/NIC offload를 확인한다."},
        {label:"Contention",text:"계산과 통신이 같은 memory/NIC resource를 경쟁하는지 본다."}
      ],
      "nonblocking API의 목적은 기다림을 숨길 기회를 만드는 것이지 기다림을 자동으로 제거하는 것이 아니다."),
    selfCheck:[
      q("MPI_Isend가 반환된 직후 send buffer를 수정해도 되는가?","일반적으로 completion이 확인되기 전에는 해당 buffer를 안전하게 재사용할 수 없으며 MPI_Wait/Test 등으로 request 완료를 확인해야 한다."),
      q("nonblocking communication이 자동으로 overlap을 보장하지 않는 이유는?","독립 계산 구간, MPI progress 특성, NIC/runtime 구현, resource contention 같은 조건이 함께 만족되어야 실제 동시 진행이 가능하기 때문이다."),
      q("RMA에서 send/recv pair보다 더 중요해지는 개념은?","memory window에 대한 access/exposure epoch와 completion/visibility를 규정하는 synchronization semantics다.")
    ]
  },

  "hybrid": {
    learningObjectives:[
      "MPI rank와 OpenMP thread를 결합한 hybrid 실행 구조를 Node/Socket/NUMA topology에 매핑할 수 있다.",
      "rank 수와 threads/rank 조합이 memory footprint, communication volume, NUMA locality를 어떻게 바꾸는지 설명할 수 있다.",
      "oversubscription, binding, NUMA, MPI thread support를 순서대로 확인하는 진단 절차를 설계할 수 있다."
    ],
    terms:[
      term("Hybrid parallelism","혼합 병렬 모델","Node 간에는 MPI process, Node 내부에서는 OpenMP thread처럼 둘 이상의 병렬 모델을 결합하는 방식이다.","통신량과 shared-memory 활용을 동시에 조정할 수 있지만 placement가 더 복잡해진다."),
      term("Rank per NUMA domain","NUMA별 rank","하나의 NUMA locality domain에 하나 또는 소수의 MPI rank를 두고 그 안에서 thread를 사용하는 배치 전략이다.","rank memory와 thread memory access를 local DRAM에 가깝게 맞추는 데 도움이 될 수 있다."),
      term("Oversubscription","과다 실행","할당된 CPU 실행 자원보다 더 많은 runnable rank/thread를 만드는 상태다.","context switching과 cache disruption으로 성능이 급격히 나빠질 수 있다."),
      term("MPI thread level","MPI thread 지원 수준","MPI_Init_thread에서 SINGLE, FUNNELED, SERIALIZED, MULTIPLE 등 thread의 MPI 호출 허용 범위를 나타낸다.","OpenMP thread가 MPI를 호출하는 코드에서 correctness와 runtime 비용에 직접 영향을 준다."),
      term("Placement matrix","배치 조합","rank/node × threads/rank × Socket/NUMA binding을 표로 표현한 실험 변수다.","총 thread 수가 같아도 구조가 달라지면 communication과 memory locality가 달라진다.")
    ],
    sections:[
      sec("hybrid의 목적은 rank와 thread의 장점을 배치 문제에 맞추는 것이다",
        "MPI rank를 많이 두면 process memory가 늘고 rank 간 communication endpoint 수도 증가할 수 있다. 반대로 rank 수를 줄이고 thread를 늘리면 Node 내부 shared-memory를 더 활용할 수 있다.",
        "어느 쪽이 유리한지는 message pattern, memory footprint, NUMA domain 수, thread scaling에 따라 달라진다. hybrid는 단순히 MPI와 OpenMP를 동시에 켜는 옵션이 아니라 두 모델의 경계를 설계하는 문제다.",
        "rank 수와 thread 수는 독립된 tuning knob다."),
      sec("NUMA domain을 배치의 자연스러운 기준으로 사용할 수 있다",
        "예를 들어 2-Socket Node에서 각 Socket이 하나의 NUMA domain이라면 Node당 2 rank를 두고 각 rank의 thread를 한 NUMA domain 안에 묶는 구성이 좋은 baseline이 될 수 있다.",
        "하지만 memory bandwidth를 더 넓게 쓰거나 MPI communication을 줄여야 하는 workload에서는 다른 조합이 나을 수 있다. cpus-per-task, ntasks-per-node, OMP_PLACES, memory policy를 하나의 배치로 함께 해석해야 한다.",
        "CPU binding과 memory placement가 같은 설계 의도를 가져야 한다."),
      sec("성능 문제는 총 Core 수보다 계층별로 분해한다",
        "hybrid Job이 느리면 먼저 allocated CPU보다 rank×threads가 많은지 확인한다. 그 다음 rank와 thread의 binding, NUMA locality, MPI traffic 변화, thread imbalance를 순서대로 본다.",
        "같은 총 32 execution context를 1×32, 2×16, 4×8로 바꾸면 MPI endpoint 수, per-rank memory, collective 참가 수, thread locality가 모두 바뀐다. 따라서 결과를 하나의 숫자로만 비교하지 말고 원인 후보를 함께 기록해야 한다.",
        "hybrid tuning은 placement와 communication, memory를 동시에 보는 실험이다.")
    ],
    example:ex("2-Socket Node에서 1×32, 2×16, 4×8 비교",
      "총 thread 수는 같지만 실행 경계가 어떻게 달라지는지 비교한다.",
      [
        {label:"1 rank × 32",text:"MPI endpoint는 적지만 한 process가 두 NUMA domain을 모두 사용하므로 thread와 memory placement 관리가 중요하다."},
        {label:"2 ranks × 16",text:"각 rank를 Socket/NUMA domain에 맞추기 쉬워 locality baseline으로 유용하다."},
        {label:"4 ranks × 8",text:"rank당 working set은 줄지만 MPI message와 collective 참가 수가 늘 수 있다."},
        {label:"평가",text:"runtime뿐 아니라 MaxRSS, MPI time, memory bandwidth, affinity를 함께 기록한다."}
      ],
      "총 CPU 수가 같다는 사실은 실행 구조가 같다는 뜻이 아니다."),
    selfCheck:[
      q("2-Socket Node에서 Node당 2 MPI rank가 자주 baseline으로 쓰이는 이유는?","각 rank를 하나의 Socket/NUMA domain에 배치하고 그 안에서 thread를 사용해 CPU와 memory locality를 맞추기 쉽기 때문이다."),
      q("rank×threads가 allocation CPU 수를 넘으면 어떤 문제가 생길 수 있는가?","oversubscription으로 context switch와 cache disruption이 증가하고 예측하기 어려운 성능 저하가 생길 수 있다."),
      q("MPI_THREAD_MULTIPLE을 요청하면 항상 좋은가?","아니다. 필요한 concurrency를 제공하지만 구현에 따라 synchronization overhead가 있을 수 있으므로 실제 코드 요구와 runtime 특성에 맞춰 선택해야 한다.")
    ]
  }
});
