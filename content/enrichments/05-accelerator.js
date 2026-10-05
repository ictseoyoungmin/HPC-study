const term=(term,en,definition,why)=>({term,en,definition,why});
const sec=(title,p1,p2,takeaway)=>({title,paragraphs:[p1,p2],takeaway});
const q=(question,answer)=>({question,answer});
const ex=(title,intro,steps,conclusion)=>({title,intro,steps,conclusion});

export const enhancements = Object.freeze({
  "gpu-basics": {
    learningObjectives:[
      "Grid, Block, Thread, Warp의 관계와 CUDA 실행 계층을 hardware 실행 관점까지 연결해 설명할 수 있다.",
      "occupancy를 성능 그 자체로 오해하지 않고 register/shared-memory/block 제한과 함께 해석할 수 있다.",
      "낮은 GPU utilization을 kernel 내부 문제와 host 공급·transfer·synchronization 문제로 나누어 진단할 수 있다."
    ],
    terms:[
      term("Kernel","GPU kernel","CPU가 GPU에 실행을 요청하는 병렬 함수다. 하나의 kernel launch는 많은 thread instance를 만든다.","GPU가 바쁘지 않을 때 먼저 kernel이 충분히 자주 제출되는지, kernel 자체가 오래 걸리는지 구분해야 한다."),
      term("Grid","Grid","하나의 kernel launch가 만드는 전체 block 집합이다.","문제 크기와 launch configuration을 연결하는 최상위 실행 단위다."),
      term("Block","Thread block","함께 스케줄되고 shared memory와 synchronization을 공유할 수 있는 thread 묶음이다.","block당 thread·register·shared-memory 사용량이 동시에 올라가면 한 SM에 resident할 수 있는 block 수가 제한될 수 있다."),
      term("Warp","Warp","GPU가 실제 명령을 발행하는 thread 실행 묶음이다. NVIDIA CUDA에서는 일반적으로 32 thread 단위로 다룬다.","같은 warp 안에서 분기 경로가 갈리면 각 경로를 순차적으로 처리해야 해 유효 병렬성이 줄 수 있다."),
      term("Occupancy","점유율","한 SM에서 활성 warp 수가 hardware가 지원하는 최대 활성 warp 수에 비해 어느 정도인지 나타내는 지표다.","latency를 숨길 여지를 보여 주지만 높은 occupancy가 자동으로 높은 throughput을 뜻하지는 않는다."),
      term("Coalescing","메모리 접근 결합","인접 thread들의 global-memory 접근이 효율적인 memory transaction으로 묶이는 access pattern이다.","같은 byte 수를 읽어도 access pattern에 따라 실제 memory transaction 수와 effective bandwidth가 크게 달라질 수 있다.")
    ],
    sections:[
      sec("CPU의 적은 강한 core와 GPU의 많은 execution lane은 다른 문제를 잘 푼다",
        "GPU는 많은 독립 작업을 동시에 진행해 높은 throughput을 얻도록 설계된 accelerator다. CPU가 복잡한 control flow와 낮은 latency를 잘 처리한다면 GPU는 같은 또는 비슷한 연산을 매우 많은 data element에 반복하는 workload에서 강점을 보이는 경우가 많다.",
        "그래서 GPU를 사용한다는 사실만으로 빨라지지는 않는다. 충분한 parallel work가 있어야 하고, kernel launch와 data movement 비용을 상쇄할 만큼 계산량이 커야 하며, memory access와 synchronization도 GPU execution model에 맞아야 한다.",
        "GPU 적합성은 device 존재 여부가 아니라 parallel work의 구조와 end-to-end 비용으로 판단한다."),
      sec("Grid→Block→Thread는 programmer model이고 Warp·SM은 실행 효율을 결정한다",
        "프로그램은 grid와 block으로 thread를 조직하지만 hardware는 block을 SM에 배치하고 thread를 warp 단위로 실행한다. 따라서 block 크기와 resource 사용량은 몇 개의 block과 warp가 동시에 resident할 수 있는지에 영향을 준다.",
        "warp 내부에서 thread가 서로 다른 branch를 선택하면 divergence가 생길 수 있고, block이 과도한 register나 shared memory를 사용하면 resident block 수가 줄 수 있다. 반대로 resource를 줄이기 위해 계산을 복잡하게 만드는 것도 항상 이득은 아니다.",
        "launch configuration은 occupancy 숫자를 최대화하는 문제가 아니라 useful work와 resource pressure를 균형 잡는 문제다."),
      sec("GPU memory capacity와 memory performance는 같은 질문이 아니다",
        "GPU memory가 80% 사용 중이라는 사실은 memory bandwidth가 80% 사용 중이라는 뜻이 아니다. capacity는 얼마나 많은 data가 resident하는지, throughput은 일정 시간 동안 얼마나 많은 byte가 이동하는지를 말한다.",
        "register, shared memory, cache, device memory는 접근 범위와 latency가 다르며, global-memory access는 coalescing과 locality에 민감하다. kernel이 느릴 때는 arithmetic work뿐 아니라 memory transaction 패턴과 data reuse를 함께 본다.",
        "GPU memory 문제는 capacity·bandwidth·latency·access pattern을 분리해 읽는다.")
    ],
    example:ex("GPU utilization이 낮은데 kernel을 최적화해야 할까?",
      "학습자는 GPU util 20%라는 숫자를 보면 kernel이 느리다고 생각하기 쉽다. 먼저 GPU에 일이 충분히 공급되는지부터 분리한다.",
      [
        {label:"가시성 확인",text:"CUDA_VISIBLE_DEVICES와 job allocation을 확인해 기대한 GPU가 실제 process에 노출되었는지 본다."},
        {label:"pipeline 분해",text:"CPU preprocessing, H2D, kernel, D2H, synchronization의 시간을 따로 기록한다."},
        {label:"launch pattern",text:"아주 짧은 kernel 사이에 큰 CPU gap이 있는지 timeline으로 확인한다."},
        {label:"kernel 내부",text:"GPU가 충분히 공급되고 hot kernel이 명확할 때 occupancy, memory throughput, branch 효율 같은 내부 metric으로 내려간다."}
      ],
      "낮은 utilization은 결과이지 원인이 아니다. 공급 부족과 kernel 병목을 먼저 분리해야 한다."),
    selfCheck:[
      q("Block과 Warp는 같은 개념인가?","아니다. Block은 programmer가 정의하는 thread 그룹이고 Warp는 hardware가 thread를 실행하는 단위다."),
      q("occupancy가 100%면 성능도 최대라고 볼 수 있는가?","아니다. memory bandwidth, instruction dependency, divergence, cache behavior, algorithmic work가 병목일 수 있다."),
      q("GPU memory 사용량과 memory bandwidth utilization을 왜 구분해야 하는가?","하나는 capacity, 다른 하나는 시간당 data movement이므로 같은 수치가 서로 다른 병목을 의미하기 때문이다.")
    ]
  },

  "gpu-memory": {
    learningObjectives:[
      "H2D/D2H transfer와 kernel 실행을 하나의 pipeline timeline으로 설명할 수 있다.",
      "pinned memory, stream, asynchronous copy가 overlap에 필요한 조건과 비용을 설명할 수 있다.",
      "Unified Memory의 편의성과 page fault·migration 비용을 동시에 설명할 수 있다."
    ],
    terms:[
      term("H2D / D2H","Host-to-Device / Device-to-Host","CPU memory와 GPU memory 사이의 data transfer 방향을 나타낸다.","kernel이 빨라도 transfer가 wall time의 큰 비중을 차지하면 end-to-end 성능은 개선되지 않는다."),
      term("Pinned memory","Page-locked host memory","OS가 paging 대상으로 옮기지 않도록 고정된 host memory 영역이다.","DMA와 asynchronous transfer에 유리할 수 있지만 과도한 pinning은 host memory 관리에 부담을 준다."),
      term("Stream","CUDA stream","GPU operation의 ordering을 표현하는 command sequence다. 서로 다른 stream의 독립 작업은 조건이 맞으면 overlap될 수 있다.","stream 수보다 dependency와 실제 copy/compute engine 사용이 중요하다."),
      term("Synchronization","동기화","CPU 또는 GPU 작업이 특정 operation 완료를 기다리도록 만드는 경계다.","불필요한 global synchronization은 가능한 overlap을 직렬화한다."),
      term("Unified Memory","통합 메모리","CPU와 GPU가 하나의 managed address space를 사용하도록 하는 메모리 모델이다.","주소 관리가 단순해져도 page placement와 migration 비용이 사라지는 것은 아니다."),
      term("NVLink / PCIe","Host·peer interconnect","GPU와 CPU 또는 GPU 사이 data가 이동하는 물리·논리 interconnect다.","같은 code라도 topology와 link에 따라 transfer bandwidth와 latency가 달라질 수 있다.")
    ],
    sections:[
      sec("Kernel 시간만 줄여서는 application wall time이 줄지 않을 수 있다",
        "GPU application의 한 iteration은 CPU 준비, H2D, kernel, D2H, synchronization을 포함할 수 있다. kernel이 10ms에서 5ms로 빨라져도 나머지 단계가 100ms라면 전체 개선은 작다.",
        "따라서 최적화 전에 각 phase를 timeline에 놓고 어떤 구간이 직렬인지, 무엇이 CPU를 기다리고 무엇이 GPU를 기다리는지 본다. 이때 wall time과 device time을 같은 의미로 사용하지 않는다.",
        "GPU data movement 최적화는 kernel보다 먼저 end-to-end critical path를 보는 작업이다."),
      sec("Overlap은 stream 개수가 아니라 dependency를 줄이는 설계다",
        "independent chunk가 있고 asynchronous transfer가 가능하며 hardware copy engine과 compute가 동시에 진행될 수 있다면 H2D와 kernel을 겹칠 수 있다. pinned memory는 이런 async transfer를 가능하게 하는 중요한 조건 중 하나다.",
        "그러나 매 chunk마다 synchronize를 호출하거나 한 stream의 결과가 다음 stream의 입력이라면 overlap 여지가 줄어든다. 작은 chunk를 지나치게 많이 만들면 launch와 bookkeeping overhead가 늘 수도 있다.",
        "Overlap 여부는 API 호출 수가 아니라 profiler timeline에서 실제 동시 실행을 확인한다."),
      sec("Unified Memory는 이동을 없애는 기술이 아니라 placement를 runtime과 함께 관리하는 모델이다",
        "Unified Memory를 사용하면 CPU와 GPU가 같은 pointer를 사용할 수 있어 programming model이 단순해진다. 하지만 page가 필요한 processor 쪽에 없으면 fault와 migration이 발생할 수 있다.",
        "access locality가 안정적이면 prefetch나 advice가 도움이 될 수 있지만 workload마다 최적 전략이 다르다. migration이 반복되면 편의성보다 data placement 비용이 커질 수 있으므로 timeline과 fault counter를 통해 확인한다.",
        "Unified Memory의 핵심 질문은 '복사 코드를 없앴는가'가 아니라 '실제 page가 언제 어디로 이동하는가'다.")
    ],
    example:ex("두 stream을 썼는데도 시간이 줄지 않는 경우",
      "코드에는 stream이 두 개 있지만 timeline에서는 H2D와 kernel이 계속 직렬로 보인다고 가정한다.",
      [
        {label:"Memory 종류",text:"host buffer가 pageable인지 pinned인지 확인한다."},
        {label:"Dependency",text:"각 stream 사이에 device-wide synchronize가 들어가 있는지 본다."},
        {label:"Chunk 크기",text:"copy와 kernel이 충분히 길어 overlap을 관찰할 수 있는지 확인한다."},
        {label:"Timeline",text:"동시 실행이 실제로 생겼는지 Nsight Systems 같은 timeline profiler로 검증한다."}
      ],
      "stream API를 사용했다는 사실과 실제 overlap이 발생했다는 사실은 다르다."),
    selfCheck:[
      q("pinned memory를 많이 사용할수록 항상 좋은가?","아니다. transfer에는 유리할 수 있지만 host memory를 과도하게 고정하면 시스템 전체 memory 관리에 부담을 줄 수 있다."),
      q("stream 수를 늘리면 자동으로 copy와 compute가 겹치는가?","아니다. dependency, synchronization, pinned memory, hardware capability와 workload granularity가 함께 맞아야 한다."),
      q("Unified Memory를 쓰면 data transfer 비용이 사라지는가?","아니다. page fault와 migration 형태로 data placement 비용이 나타날 수 있다.")
    ]
  },

  "multi-gpu": {
    learningObjectives:[
      "GPU↔GPU, GPU↔CPU, GPU↔NIC topology가 multi-GPU collective 성능에 미치는 영향을 설명할 수 있다.",
      "NCCL collective의 완료 시간이 slow rank 또는 slow link의 영향을 받는 이유를 설명할 수 있다.",
      "GPUDirect RDMA의 목적과 적용 조건을 host staging 경로와 비교해 설명할 수 있다."
    ],
    terms:[
      term("NCCL","NVIDIA Collective Communications Library","GPU 간 collective communication을 제공하는 library다.","distributed training이나 multi-GPU solver에서 반복되는 AllReduce 등의 비용을 직접 좌우할 수 있다."),
      term("AllReduce","Collective reduction","모든 rank의 값을 reduction한 뒤 결과를 모든 rank에 다시 제공하는 collective다.","하나의 느린 participant가 전체 step 완료 시간을 지연시킬 수 있다."),
      term("Topology","GPU fabric topology","GPU, PCIe switch, CPU socket, NIC, NVLink가 어떤 경로로 연결되어 있는지를 뜻한다.","같은 GPU 수라도 실제 data path가 다르면 collective 성능이 달라진다."),
      term("GPUDirect RDMA","GPU Direct RDMA","NIC가 GPU memory와 더 직접적으로 data를 교환해 host staging을 줄이는 data path다.","기능 이름보다 driver, RDMA stack, library, topology가 실제로 해당 경로를 선택하는지 확인해야 한다."),
      term("MIG","Multi-Instance GPU","하나의 지원 GPU를 여러 격리된 GPU instance로 분할하는 기능이다.","한 물리 GPU를 공유하더라도 memory와 compute partition 경계를 이해해야 resource request를 해석할 수 있다."),
      term("MPS","Multi-Process Service","여러 CUDA process의 실행을 한 GPU에서 더 효율적으로 공유하도록 돕는 service다.","MIG처럼 hardware partition과 동일한 격리를 제공하는 개념은 아니므로 구분해야 한다.")
    ],
    sections:[
      sec("Multi-GPU는 GPU 개수보다 path의 모양이 중요하다",
        "두 GPU가 NVLink로 직접 연결된 경우와 서로 다른 CPU socket을 거쳐 PCIe로 통신하는 경우는 같은 peer copy라도 비용이 다를 수 있다. multi-node에서는 여기에 NIC와 fabric 경로가 추가된다.",
        "그래서 rank→GPU mapping만 기록해서는 부족하다. local rank가 어느 GPU를 쓰는지, 그 GPU가 어떤 CPU/NUMA domain과 가까운지, NIC까지 어떤 경로로 연결되는지를 한 표 또는 topology map으로 함께 본다.",
        "Multi-GPU 성능 분석의 시작점은 logical rank 수가 아니라 physical data path다."),
      sec("Collective는 가장 느린 participant의 영향을 전체가 공유한다",
        "AllReduce 같은 collective는 모든 participant가 결과 완성에 관여한다. 한 rank의 GPU가 늦거나 특정 link에 congestion이 생기면 다른 rank도 다음 step으로 넘어가지 못하고 기다릴 수 있다.",
        "이 때문에 평균 GPU utilization만 보면 root cause를 놓칠 수 있다. rank별 timeline, collective duration, topology, NIC counter를 같은 시간축과 message size 조건에서 비교해야 slow rank가 compute인지 communication인지 구분할 수 있다.",
        "Collective 문제는 평균보다 tail rank와 slow path를 찾는 문제다."),
      sec("GPUDirect와 MIG/MPS는 서로 다른 층의 기능이다",
        "GPUDirect RDMA는 network data path를 줄이는 기술이고, MIG와 MPS는 한 GPU를 여러 workload가 사용하는 방식을 다룬다. 하나는 communication path, 다른 하나는 resource sharing 문제다.",
        "MIG instance에서는 보이는 GPU memory와 compute 자원이 물리 GPU 전체와 다르며, MPS는 process 간 실행 공유 방식을 바꾼다. 따라서 성능 비교에서는 allocation mode 자체를 baseline metadata에 기록해야 한다.",
        "GPU sharing mode와 network transport를 같은 기능으로 묶지 말고 각각의 경계를 확인한다.")
    ],
    example:ex("8 GPU Job에서 한 rank만 느린 경우",
      "전체 iteration이 느리지만 GPU 평균 utilization은 높다고 가정한다. collective가 끝날 때 특정 rank가 반복해서 늦게 도착하는지 확인한다.",
      [
        {label:"Rank별 시간",text:"compute와 AllReduce duration을 local/global rank별로 나눈다."},
        {label:"Topology",text:"slow rank가 사용하는 GPU와 NIC가 다른 socket 또는 긴 PCIe path를 거치는지 확인한다."},
        {label:"Transport",text:"NCCL log와 RDMA/NIC counter로 실제 network path를 확인한다."},
        {label:"교차 검증",text:"rank placement를 바꾸었을 때 느린 현상이 GPU를 따라가는지 node/path를 따라가는지 비교한다."}
      ],
      "Collective slowdown은 모든 GPU가 느린 문제가 아니라 하나의 느린 participant가 전체를 기다리게 하는 문제일 수 있다."),
    selfCheck:[
      q("같은 GPU 모델과 개수면 multi-GPU 성능도 같다고 볼 수 있는가?","아니다. NVLink/PCIe, CPU socket, NIC proximity와 rank placement가 다르면 data path 비용이 달라질 수 있다."),
      q("AllReduce에서 한 rank의 지연이 전체 iteration에 영향을 주는 이유는?","collective 완료에 모든 participant가 필요하므로 다른 rank도 느린 participant를 기다릴 수 있기 때문이다."),
      q("MIG와 MPS의 차이를 한 문장으로 설명하면?","MIG는 지원 GPU를 hardware partition으로 나누는 기능이고 MPS는 여러 CUDA process의 GPU 실행 공유를 돕는 service다.")
    ]
  },

  "gpu-profiling": {
    learningObjectives:[
      "Nsight Systems와 Nsight Compute가 답하는 질문의 범위를 구분할 수 있다.",
      "CPU launch gap, memcpy, kernel, synchronization을 timeline에서 읽고 critical path를 설명할 수 있다.",
      "system-level profiling으로 hot kernel을 찾은 뒤에만 kernel-level metric으로 내려가는 profile ladder를 적용할 수 있다."
    ],
    terms:[
      term("Timeline","시간선","CPU thread, CUDA API, memory copy, GPU kernel을 시간축에 배치한 실행 기록이다.","GPU idle gap과 host-side delay를 한 화면에서 연결할 수 있다."),
      term("Nsight Systems","System profiler","CPU와 GPU의 end-to-end 실행 흐름과 overlap을 관찰하는 profiler다.","kernel 내부 metric보다 먼저 pipeline의 critical path와 idle gap을 찾는 데 적합하다."),
      term("Nsight Compute","Kernel profiler","선택한 GPU kernel의 instruction, memory, occupancy 등 세부 metric을 분석하는 profiler다.","hot kernel이 아닌 모든 kernel에 상세 metric을 수집하면 overhead와 data volume만 커질 수 있다."),
      term("Critical path","임계 경로","전체 wall time을 결정하는 의존성 연결 경로다.","병렬로 겹치는 작업의 시간을 단순 합산하지 않고 실제 완료 시간을 결정하는 구간을 찾게 한다."),
      term("Launch gap","Kernel launch gap","GPU kernel 사이에 유용한 GPU 작업이 없는 빈 시간이다.","CPU preprocessing, Python overhead, synchronization, input starvation 등 host-side 원인을 의심하는 단서가 된다."),
      term("Profiler overhead","측정 오버헤드","profiling 도구가 instrumentation과 metric collection 때문에 추가하는 실행 비용이다.","프로파일 결과의 절대 runtime을 production runtime과 그대로 비교하면 안 되는 이유다.")
    ],
    sections:[
      sec("GPU profiling은 kernel부터 시작하지 않는다",
        "사용자가 'GPU가 느리다'고 말해도 실제로는 CPU가 다음 batch를 준비하지 못하거나 H2D transfer가 길거나 synchronization이 과도할 수 있다. 이런 문제는 kernel metric만으로 설명되지 않는다.",
        "먼저 wall time과 coarse utilization을 baseline으로 잡고 system timeline에서 CPU launch, memcpy, kernel, sync를 나눈다. 여기서 hot region과 idle gap이 확인된 뒤 kernel-level profiler로 좁힌다.",
        "Profiling의 순서는 넓은 원인 공간에서 좁은 원인 공간으로 내려간다."),
      sec("Timeline에서는 길이뿐 아니라 겹침과 기다림을 본다",
        "H2D가 20ms, kernel이 40ms, D2H가 10ms라고 해서 iteration이 반드시 70ms는 아니다. 서로 겹치면 wall time은 더 짧아질 수 있고, dependency 때문에 기다리면 빈 구간이 추가될 수 있다.",
        "따라서 각 bar의 duration뿐 아니라 어느 CPU thread가 launch를 지연했는지, copy와 kernel이 겹쳤는지, device-wide synchronization이 pipeline을 끊었는지를 본다.",
        "GPU timeline은 duration 목록이 아니라 dependency와 overlap을 읽는 도구다."),
      sec("Kernel metric은 질문을 세운 뒤 선택한다",
        "hot kernel이 memory-bound 후보라면 memory throughput, cache behavior, transaction efficiency를 보고, latency hiding이 의심되면 occupancy와 stall reason을 본다. 모든 metric을 수집한다고 분석 품질이 자동으로 좋아지지 않는다.",
        "또한 profiler 자체의 overhead와 replay가 kernel 실행을 바꿀 수 있다. 작은 입력과 대표 kernel로 범위를 줄이고 baseline과 profiling run의 목적을 분리해야 한다.",
        "Metric은 결론이 아니라 특정 병목 가설을 검증하기 위해 선택한다.")
    ],
    example:ex("GPU util은 낮지만 kernel 자체는 빠른 경우",
      "timeline에서 kernel bar는 짧고 그 사이에 긴 CPU gap이 반복되는 상황을 생각한다.",
      [
        {label:"System timeline",text:"CUDA API와 kernel launch 사이의 host-side gap을 확인한다."},
        {label:"CPU stack",text:"dataloader, preprocessing, interpreter, lock 등 gap을 만든 CPU 구간을 찾는다."},
        {label:"Transfer",text:"copy engine 구간이 kernel과 겹치지 않는지도 함께 본다."},
        {label:"Kernel profiling 보류",text:"kernel이 critical path가 아니라면 Nsight Compute보다 CPU/input pipeline을 먼저 개선한다."}
      ],
      "Profiler는 가장 상세한 도구부터 쓰는 것이 아니라 현재 질문에 맞는 가장 넓은 증거부터 좁혀 가는 방식으로 사용한다."),
    selfCheck:[
      q("Nsight Systems와 Nsight Compute의 가장 큰 역할 차이는?","Systems는 end-to-end CPU/GPU timeline, Compute는 선택한 GPU kernel 내부 metric 분석에 초점을 둔다."),
      q("GPU utilization이 낮고 kernel 사이 gap이 길다면 kernel 최적화를 먼저 해야 하는가?","아니다. CPU preprocessing, launch overhead, transfer, synchronization 등 GPU 공급 경로를 먼저 조사해야 한다."),
      q("profiling run의 절대 runtime을 production run과 그대로 비교하면 안 되는 이유는?","metric collection과 instrumentation 때문에 profiler 자체 overhead가 추가될 수 있기 때문이다.")
    ]
  },

  "ai-hpc": {
    learningObjectives:[
      "distributed training step을 data load, H2D, compute, collective, optimizer, checkpoint 단계로 분해할 수 있다.",
      "data parallel, tensor/model parallel, pipeline parallel이 만드는 communication pattern 차이를 설명할 수 있다.",
      "GPU idle의 원인을 dataloader, NCCL, checkpoint I/O, imbalance로 분리하는 RCA 흐름을 설명할 수 있다."
    ],
    terms:[
      term("Data parallel","데이터 병렬","각 rank/GPU가 서로 다른 mini-batch를 계산하고 gradient를 collective로 동기화하는 방식이다.","compute와 AllReduce가 반복 step의 주요 두 축이 된다."),
      term("Tensor / model parallel","모델 병렬","하나의 layer 또는 parameter를 여러 GPU에 나누어 계산하는 방식이다.","forward/backward 자체에 빈번한 inter-GPU communication이 들어갈 수 있다."),
      term("Pipeline parallel","파이프라인 병렬","model stage를 여러 GPU에 나누고 micro-batch를 pipeline으로 흘리는 방식이다.","stage imbalance와 pipeline bubble이 utilization을 떨어뜨릴 수 있다."),
      term("Dataloader","입력 공급 계층","storage에서 sample을 읽고 decode/augment/batch하여 accelerator에 공급하는 CPU-side pipeline이다.","GPU가 idle해도 원인이 storage나 CPU preprocessing일 수 있음을 보여 준다."),
      term("Step time","학습 step 시간","한 training iteration이 완료되는 end-to-end 시간이다.","throughput을 설명할 때 forward/backward만이 아니라 collective와 input, checkpoint 영향까지 포함해야 한다."),
      term("Checkpoint","학습 상태 저장","model/optimizer state를 persistent storage에 저장하는 작업이다.","큰 distributed job에서는 주기적인 burst I/O가 training jitter와 shared filesystem contention을 만들 수 있다.")
    ],
    sections:[
      sec("Distributed training은 GPU compute만으로 이루어지지 않는다",
        "한 step은 data load와 preprocessing, H2D, forward, backward, gradient collective, optimizer update로 이어지고 일정 주기마다 checkpoint까지 포함할 수 있다. 이 중 어느 하나라도 늦으면 GPU가 기다리거나 rank들이 서로 기다린다.",
        "따라서 GPU utilization만 보고 training efficiency를 판단하면 storage와 network 문제를 놓칠 수 있다. step time을 phase별로 나누고 CPU/GPU/network/storage 자원에 각각 연결해 보는 것이 기본이다.",
        "Distributed AI 문제는 accelerator 하나가 아니라 shared cluster data path 전체를 보는 HPC 문제다."),
      sec("Parallel strategy가 바뀌면 communication 위치도 바뀐다",
        "data parallel은 주로 gradient synchronization에서 큰 collective가 반복되고, tensor/model parallel은 layer 내부의 activation·parameter communication이 늘 수 있다. pipeline parallel은 stage 사이 activation 이동과 bubble이 핵심이 된다.",
        "같은 GPU 수를 사용해도 parallel strategy가 다르면 message size와 빈도, synchronization 지점이 달라진다. 그래서 NCCL time을 해석할 때 model architecture와 parallel strategy metadata를 함께 기록해야 한다.",
        "Communication cost는 GPU 수가 아니라 어떤 parallelism을 어떤 topology 위에 배치했는지로 해석한다."),
      sec("Slow step은 평균이 아니라 phase와 tail rank로 좁힌다",
        "step time이 간헐적으로 늘면 dataloader queue가 비는지, 특정 rank의 AllReduce가 늦는지, checkpoint가 겹치는지 시간축으로 확인한다. shared filesystem의 metadata 또는 bandwidth contention도 periodic spike를 만들 수 있다.",
        "rank별 phase time을 비교하면 compute imbalance인지 communication tail인지 구분할 수 있다. 또한 data pipeline과 checkpoint는 GPU profiler만으로 충분히 보이지 않을 수 있으므로 system metric과 storage observation을 함께 사용한다.",
        "Training RCA는 step을 phase로 나누고 가장 늦은 phase와 participant를 찾는 과정이다.")
    ],
    example:ex("매 100 step마다 training이 크게 느려지는 경우",
      "주기적인 slowdown이면 무작위 GPU 성능 변동보다 정기적으로 실행되는 작업과 먼저 연결한다.",
      [
        {label:"주기 확인",text:"slow step이 checkpoint 주기와 일치하는지 본다."},
        {label:"Storage",text:"checkpoint 시점의 filesystem bandwidth와 metadata latency를 확인한다."},
        {label:"Collective",text:"NCCL 시간이 함께 늘어나는지 분리해 network contention 여부를 본다."},
        {label:"정책",text:"staging, asynchronous checkpoint, checkpoint interval 변경이 가능한지 application과 운영 요구를 함께 검토한다."}
      ],
      "GPU가 idle한 순간이 보여도 root cause는 persistent storage 또는 CPU data pipeline일 수 있다."),
    selfCheck:[
      q("data parallel에서 반복적으로 큰 collective가 필요한 이유는?","각 rank가 계산한 gradient를 동기화해 일관된 model update를 만들기 위해서다."),
      q("GPU utilization이 낮을 때 dataloader를 확인해야 하는 이유는?","CPU·storage 입력 공급이 늦으면 GPU가 다음 batch를 기다리며 idle할 수 있기 때문이다."),
      q("checkpoint가 cluster 전체 성능에 영향을 줄 수 있는 이유는?","여러 rank가 큰 state를 동시에 저장하면 shared filesystem에 burst I/O와 metadata pressure를 만들 수 있기 때문이다.")
    ]
  },

  "containers": {
    learningObjectives:[
      "HPC container가 application user space를 묶지만 host kernel·driver·fabric까지 완전히 포함하지 않는 이유를 설명할 수 있다.",
      "Apptainer의 bind mount와 GPU passthrough, MPI integration에서 host/container 경계를 구분할 수 있다.",
      "container 기반 재현성 문제를 image provenance, bind, driver, MPI/transport 순서로 좁혀 진단할 수 있다."
    ],
    terms:[
      term("Container image","컨테이너 이미지","application과 user-space dependency를 묶은 filesystem artifact다.","image가 같아도 host kernel, driver, device, bind mount가 다르면 실행 결과가 달라질 수 있다."),
      term("Apptainer","HPC container runtime","multi-user HPC 환경에서 rootless 실행과 shared filesystem 사용을 고려한 container runtime이다.","일반적인 local Docker workflow와 host integration 경계가 다를 수 있다."),
      term("Bind mount","바인드 마운트","host filesystem 경로를 container namespace 안에 노출하는 방식이다.","같은 image라도 bind되는 data, home, scratch, library path가 달라지면 behavior가 달라질 수 있다."),
      term("GPU passthrough","GPU 장치·library 연동","host의 GPU device와 driver 관련 user-space library를 container workload가 사용할 수 있게 연결하는 과정이다.","container 안에 driver를 모두 넣는 것이 아니라 host driver compatibility가 핵심인 경우가 많다."),
      term("MPI integration","MPI 통합","container 내부 MPI와 host scheduler/PMIx/fabric stack이 함께 동작하도록 맞추는 구성이다.","ABI와 transport mismatch는 single-node에서는 안 보이다 multi-node에서 드러날 수 있다."),
      term("Provenance","실행 출처 정보","image digest, build recipe, module, driver, MPI, host 정보를 함께 기록한 재현성 metadata다.","image hash 하나만으로 cluster 실행 환경 전체를 재현했다고 볼 수 없기 때문이다.")
    ],
    sections:[
      sec("Container는 cluster 전체를 가상화하지 않는다",
        "HPC container는 application과 user-space dependency를 묶어 이동성을 높이지만 host kernel 위에서 실행된다. GPU와 high-speed network도 host device와 driver stack에 의존하는 경우가 많다.",
        "따라서 'container 안에서는 어디서나 동일하다'는 표현은 과도하다. image가 동일해도 host kernel, GPU driver, fabric library, bind mount, scheduler integration이 달라지면 결과와 성능이 달라질 수 있다.",
        "Container 재현성은 image와 host integration metadata를 함께 기록할 때 성립한다."),
      sec("GPU와 MPI는 host 경계를 의도적으로 통과한다",
        "GPU passthrough는 host의 device와 compatible driver stack을 container application에 연결한다. MPI도 site의 PMIx, UCX, libfabric 또는 vendor transport와 연동해야 최적 network path를 사용할 수 있다.",
        "이 경계가 맞지 않으면 GPU가 보이지 않거나 MPI가 TCP fallback을 사용하거나 launch 단계에서 실패할 수 있다. single-node 성공이 multi-node integration 성공을 보장하지 않는 이유다.",
        "HPC container troubleshooting에서는 device와 communication 경계를 별도 단계로 검증한다."),
      sec("Image provenance와 runtime provenance를 나누어 기록한다",
        "image digest와 recipe는 무엇을 만들었는지 설명하지만 실제 run에는 host node, driver version, loaded module, bind path, environment variable, scheduler allocation도 영향을 준다.",
        "운영 관점에서는 incident 재현을 위해 image provenance와 runtime provenance를 함께 보존해야 한다. 특히 mutable tag보다 digest 또는 image file hash를 기록하면 동일 artifact 확인이 쉬워진다.",
        "재현 가능한 container run은 image 식별자와 host-side 실행 조건의 조합이다.")
    ],
    example:ex("같은 SIF가 login node에서는 되는데 compute node GPU Job에서 실패하는 경우",
      "image 자체가 깨졌다고 단정하기 전에 login/compute node 사이의 host integration 차이를 순서대로 확인한다.",
      [
        {label:"Image",text:"같은 image hash와 동일 command를 사용했는지 확인한다."},
        {label:"Bind",text:"input, home, scratch, library path가 compute node에서도 같은 방식으로 bind되는지 본다."},
        {label:"GPU",text:"host driver와 device visibility, --nv 같은 passthrough option을 확인한다."},
        {label:"MPI/transport",text:"multi-node이면 host MPI/PMIx/fabric integration과 실제 transport 선택을 추가로 확인한다."}
      ],
      "Container 문제는 image 하나의 문제가 아니라 image→bind→device/driver→MPI/transport 경계를 따라 좁히는 문제다."),
    selfCheck:[
      q("container image가 같으면 GPU driver도 같다고 볼 수 있는가?","아니다. HPC GPU workload는 host driver와 device에 의존하는 경우가 많아 host-side 정보를 별도로 확인해야 한다."),
      q("single-node MPI container 성공이 multi-node 성공을 보장하지 않는 이유는?","multi-node에서는 PMIx, fabric, transport와 host MPI integration 같은 추가 경계가 나타나기 때문이다."),
      q("container provenance에 image hash 외에 무엇을 기록해야 하는가?","host/node 정보, driver, MPI/module, bind path, scheduler allocation과 주요 environment를 함께 기록해야 한다.")
    ]
  }
});
