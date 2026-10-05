const term=(term,en,definition,why)=>({term,en,definition,why});
const sec=(title,p1,p2,takeaway)=>({title,paragraphs:[p1,p2],takeaway});
const q=(question,answer)=>({question,answer});
const ex=(title,intro,steps,conclusion)=>({title,intro,steps,conclusion});

export const enhancements = Object.freeze({
  "network-basics": {
    learningObjectives:[
      "application buffer에서 remote process까지 TCP data path의 주요 계층을 설명할 수 있다.",
      "latency, bandwidth, loss, retransmission, queue를 서로 다른 지표로 구분할 수 있다.",
      "interface→route→socket/TCP→application transport 순서로 network symptom을 좁힐 수 있다."
    ],
    terms:[
      term("Latency","지연 시간","한 요청이나 packet/message가 출발해 목적지에 도달하거나 왕복하는 데 걸리는 시간이다.","작은 message와 synchronization-heavy workload는 bandwidth보다 latency에 민감할 수 있다."),
      term("Bandwidth","대역폭","단위 시간에 전송할 수 있는 data 양이다.","큰 message나 streaming traffic에서는 link와 protocol overhead를 포함한 sustained throughput이 중요하다."),
      term("MTU","Maximum Transmission Unit","한 network frame/packet에 담을 수 있는 payload 크기를 제한하는 link-layer 설정이다.","경로 중 MTU가 불일치하면 fragmentation, drop, communication failure가 생길 수 있다."),
      term("Retransmission","재전송","TCP가 손실되었거나 확인되지 않은 segment를 다시 보내는 동작이다.","throughput 저하와 tail latency 증가의 직접 단서가 될 수 있다."),
      term("Socket queue","소켓 큐","application과 kernel network stack 사이에서 송수신 data가 대기하는 buffer/queue다.","application이 읽거나 쓰는 속도와 network progress가 맞지 않을 때 backlog와 pressure를 보여줄 수 있다.")
    ],
    sections:[
      sec("network 문제는 한 개의 '속도'가 아니라 여러 계층의 경로 문제다",
        "application이 send를 호출하면 data는 user buffer에서 socket API를 거쳐 kernel TCP/IP stack, NIC, switch/fabric, remote NIC와 kernel을 지나 상대 process로 전달된다. 각 계층은 서로 다른 queue와 counter를 가진다.",
        "따라서 'network가 느리다'는 표현만으로는 원인 범위가 너무 넓다. interface error인지, route/MTU 문제인지, TCP retransmission인지, application이 socket을 늦게 소비하는지 단계별로 나눠야 한다.",
        "network ticket은 data path의 어느 계층에서 증거가 바뀌는지 찾는 작업이다."),
      sec("latency와 bandwidth는 같은 지표가 아니다",
        "1 byte ping이 빠르더라도 큰 MPI message throughput이 낮을 수 있고, 반대로 link bandwidth가 높더라도 collective synchronization의 작은 message latency가 병목일 수 있다. message size와 communication pattern이 어느 지표를 중요하게 만드는지 먼저 본다.",
        "loss나 retransmission은 또 다른 축이다. 평균 bandwidth만 보면 짧은 burst의 packet loss와 tail latency를 놓칠 수 있으므로 workload 시간대의 counter delta와 socket 상태를 함께 비교해야 한다.",
        "한 숫자로 network를 대표하지 말고 workload가 민감한 축을 선택한다."),
      sec("누적 counter는 변화량으로 해석한다",
        "ip -s link 같은 NIC counter는 boot 이후 누적값인 경우가 많다. 과거 장애에서 쌓인 drop 100건이 지금 workload의 문제라는 뜻은 아니다.",
        "정상 구간 직전과 문제 구간 직후의 값을 저장해 delta를 계산하면 실제로 workload 동안 error가 증가했는지 확인할 수 있다. 같은 원칙을 TCP retransmission, switch port error, RDMA counter에도 적용한다.",
        "누적값의 절대 크기보다 문제 시간창에서 증가했는지가 중요하다.")
    ],
    example:ex("MPI Job만 간헐적으로 느린 경우",
      "application과 network를 바로 동일시하지 않고 재현 범위를 단계적으로 줄인다.",
      [
        {label:"Pair 고정",text:"같은 두 Node 조합에서 문제가 재현되는지 확인한다."},
        {label:"Interface",text:"RX/TX error/drop delta와 link state를 문제 전후로 비교한다."},
        {label:"TCP/socket",text:"ss -ti와 retransmission/queue 정보를 확인한다."},
        {label:"Application",text:"MPI transport와 message size가 microbenchmark에서도 같은 이상을 만드는지 비교한다."}
      ],
      "application slowdown과 network fault를 연결하려면 같은 Node pair와 같은 시간창에서 양쪽 증거가 함께 변해야 한다."),
    selfCheck:[
      q("ping RTT가 정상이어도 MPI bandwidth가 낮을 수 있는 이유는?","ping은 작은 ICMP packet의 RTT를 보는 반면 MPI는 다른 protocol/transport와 message size를 사용하며 bandwidth, queue, RDMA path 영향을 받을 수 있기 때문이다."),
      q("NIC error counter 1000이라는 숫자만으로 현재 장애를 판단하면 안 되는 이유는?","누적 counter일 수 있으므로 현재 workload 시간대에 실제로 증가했는지 delta를 확인해야 하기 때문이다."),
      q("network 진단에서 권장하는 계층 순서는?","interface/link 상태와 counter → route/MTU → TCP/socket → application/MPI transport 순으로 좁힌다.")
    ]
  },

  "rdma-interconnect": {
    learningObjectives:[
      "RDMA가 일반 TCP data path와 다른 핵심 지점을 registered memory와 NIC 관점에서 설명할 수 있다.",
      "InfiniBand, RoCE, UCX/libfabric, MPI의 역할을 같은 계층으로 혼동하지 않고 구분할 수 있다.",
      "port state, link error, transport selection, Node pair를 묶어 RDMA 문제를 진단할 수 있다."
    ],
    terms:[
      term("RDMA","Remote Direct Memory Access","remote process의 등록된 memory와 NIC/HCA가 낮은 CPU overhead로 data를 교환할 수 있게 하는 통신 기술 계열이다.","HPC scale-out에서 작은 latency와 높은 throughput을 위해 널리 사용되지만 별도의 memory registration과 transport 상태가 필요하다."),
      term("Registered memory","등록 메모리","RDMA device가 직접 접근할 수 있도록 pin/register된 application memory 영역이다.","주소와 접근 권한이 NIC에 알려져야 direct data path가 성립한다."),
      term("HCA","Host Channel Adapter","InfiniBand/RDMA fabric에 연결되는 host-side network adapter를 가리키는 용어다.","port state, rate, error counter가 실제 physical/data-link health를 보여준다."),
      term("RoCE","RDMA over Converged Ethernet","Ethernet 위에서 RDMA semantics를 제공하는 기술 계열이다.","InfiniBand와 동일한 운영 환경이라고 가정하면 congestion/flow-control 문제를 잘못 해석할 수 있다."),
      term("UCX/libfabric","통신 추상화 계층","MPI나 다른 communication library가 shared memory, TCP, RDMA device 등 다양한 transport를 선택하도록 돕는 portability layer다.","MPI API와 실제 wire transport를 분리해 진단하는 핵심 단서가 된다.")
    ],
    sections:[
      sec("RDMA는 kernel을 없애는 기술이 아니라 data path 개입을 줄이는 기술이다",
        "일반 TCP path에서는 application data가 socket과 kernel network stack을 거친다. RDMA에서는 등록된 memory와 HCA/NIC 사이에 더 직접적인 data movement 경로를 구성해 CPU copy와 kernel data-path overhead를 줄일 수 있다.",
        "하지만 control path, memory registration, connection/queue state, completion handling은 여전히 필요하다. 따라서 'RDMA니까 CPU가 전혀 관여하지 않는다'는 식의 설명은 정확하지 않다.",
        "RDMA의 핵심은 data movement의 overhead를 줄이는 것이다."),
      sec("InfiniBand와 RoCE는 RDMA 기능을 공유해도 fabric 운영은 다르다",
        "InfiniBand는 전용 link/network stack과 subnet 관리 체계를 사용하고, RoCE는 Ethernet fabric에서 RDMA를 제공한다. 둘 다 RDMA API에 연결될 수 있지만 congestion, loss handling, switch 구성, MTU 운영 방식이 다를 수 있다.",
        "AA는 사용자가 보는 MPI error만으로 transport를 단정하지 말고 실제 NIC port와 runtime이 선택한 transport를 확인해야 한다. 같은 application도 shared memory, TCP fallback, RDMA transport를 상황에 따라 다르게 사용할 수 있다.",
        "API 이름보다 실제 선택된 transport와 fabric 상태를 확인한다."),
      sec("UCX/libfabric은 계층을 연결하지만 문제 위치도 분리해 준다",
        "MPI implementation은 내부적으로 UCX나 libfabric 같은 framework를 통해 여러 network provider를 사용할 수 있다. 이 구조 덕분에 application API를 바꾸지 않고 hardware transport를 교체할 수 있다.",
        "반대로 문제를 진단할 때는 MPI build, runtime selection, provider/device visibility, physical port state를 각각 확인해야 한다. 환경변수 하나를 강제해 우연히 증상을 바꾸는 것보다 어떤 계층이 달라졌는지 증거로 남기는 것이 중요하다.",
        "MPI library와 transport selection, physical fabric을 세 계층으로 분리한다.")
    ],
    example:ex("특정 Node pair에서만 MPI latency가 증가",
      "pair-specific slowdown은 application 전체보다 fabric path와 device state를 먼저 의심할 근거가 된다.",
      [
        {label:"Pair matrix",text:"정상 Node와 문제 Node를 조합해 어느 endpoint 조합에서만 재현되는지 표로 만든다."},
        {label:"Port state",text:"ibstat/ibv_devinfo나 site 도구로 ACTIVE/rate와 error counter를 확인한다."},
        {label:"Transport",text:"UCX/libfabric/MPI runtime이 어떤 device/transport를 선택했는지 확인한다."},
        {label:"Fallback",text:"TCP나 다른 transport로 바뀌었는지 확인하되 임의 강제는 마지막에 한다."}
      ],
      "특정 pair에서만 재현되는 문제는 physical path, port, provider selection을 같은 표에서 비교하면 범위를 크게 줄일 수 있다."),
    selfCheck:[
      q("RDMA와 MPI는 같은 계층인가?","아니다. MPI는 programming/communication API이고 RDMA는 실제 data transport를 제공할 수 있는 하위 통신 기술이다."),
      q("UCX가 있다는 사실이 항상 RDMA를 사용한다는 뜻인가?","아니다. UCX는 여러 transport를 선택할 수 있으므로 runtime에서 실제 선택된 device/transport를 확인해야 한다."),
      q("InfiniBand와 RoCE를 운영 측면에서 동일하게 보면 안 되는 이유는?","둘 다 RDMA를 제공할 수 있지만 link layer, congestion/flow-control, switch 운영과 failure mode가 다를 수 있기 때문이다.")
    ]
  },

  "network-benchmark": {
    learningObjectives:[
      "message size에 따른 latency와 bandwidth curve의 모양을 읽을 수 있다.",
      "same-node, same-switch, cross-switch 같은 topology를 통제한 benchmark를 설계할 수 있다.",
      "median과 p95를 함께 사용해 중심 성능과 tail jitter를 구분할 수 있다."
    ],
    terms:[
      term("Microbenchmark","미세 벤치마크","application 전체가 아니라 latency, bandwidth, collective 같은 하나의 통신 특성을 단순한 패턴으로 측정하는 프로그램이다.","application 문제와 network/communication substrate 문제를 분리하는 baseline으로 쓸 수 있다."),
      term("Message size","메시지 크기","한 번의 communication operation에서 전송하는 data 양이다.","작은 message와 큰 message는 latency overhead와 bandwidth saturation의 영향을 다르게 받는다."),
      term("Saturation","대역폭 포화","message size나 outstanding work가 커져 link/transport가 더 이상 비례해 throughput을 높이지 못하는 영역이다.","plateau가 어디서 형성되는지 보면 setup overhead와 sustained bandwidth 영역을 구분할 수 있다."),
      term("Median","중앙값","반복 측정 결과를 정렬했을 때 가운데 값이다.","일부 outlier에 평균보다 덜 민감해 대표 성능을 보기 좋다."),
      term("p95","95th percentile","측정값의 95%가 이 값 이하에 위치하는 percentile 지표다.","평균이나 median이 숨기는 tail latency와 jitter를 보여준다.")
    ],
    sections:[
      sec("한 점이 아니라 message-size curve를 본다",
        "network latency와 bandwidth는 message size에 따라 다른 영역을 보인다. 작은 message에서는 fixed software/protocol overhead가 크게 보이고, 크기가 커지면 data transfer time이 지배해 bandwidth가 plateau에 접근한다.",
        "따라서 1 byte latency 한 점이나 1 MB bandwidth 한 점만 비교하면 문제의 특성을 놓칠 수 있다. 정상 baseline과 문제 상황의 curve 전체를 겹쳐 보면 knee가 이동했는지, 작은 message만 나빠졌는지, plateau 자체가 낮아졌는지 구분할 수 있다.",
        "benchmark는 single score보다 curve shape를 해석한다."),
      sec("topology를 기록하지 않으면 결과를 일반화할 수 없다",
        "same-node shared-memory transport, same-switch link, cross-switch path는 전혀 다른 경로를 사용한다. 두 Node의 benchmark가 정상이라고 해서 cluster 전체 fabric이 정상이라고 단정할 수 없다.",
        "Node pair, switch/rack 위치, NUMA/NIC affinity, process placement를 같은 조건으로 고정하고 반복해야 한다. 특히 특정 switch나 link 문제가 의심되면 topology별 matrix가 single pair보다 훨씬 강한 증거가 된다.",
        "측정값 옆에 physical/logical topology를 함께 기록한다."),
      sec("분포를 보면 간헐적인 문제를 발견할 수 있다",
        "network는 congestion, OS noise, 다른 traffic 때문에 변동할 수 있다. 5회 측정 평균만 기록하면 한두 번의 긴 tail이나 outlier가 평균에 섞여 원인을 숨길 수 있다.",
        "median은 중심 성능을, p95는 tail을 요약한다. 둘의 차이가 갑자기 커졌다면 지속적인 bandwidth 저하와는 다른 jitter/congestion 가설을 세울 수 있다.",
        "성능 숫자는 반복 분포와 함께 의미를 가진다.")
    ],
    example:ex("median은 정상인데 p95만 크게 증가",
      "평균 throughput만 보면 지나칠 수 있는 tail 문제를 해석한다.",
      [
        {label:"반복",text:"동일 message size와 Node pair에서 충분히 반복해 분포를 만든다."},
        {label:"중심값",text:"median이 baseline과 유사한지 확인한다."},
        {label:"Tail",text:"p95/p99가 증가했다면 간헐 congestion, retransmission, OS noise 후보를 본다."},
        {label:"Topology",text:"다른 Node pair에서도 같은 tail이 생기는지 비교한다."}
      ],
      "median과 tail을 분리하면 '항상 느림'과 '가끔 크게 지연됨'을 서로 다른 문제로 다룰 수 있다."),
    selfCheck:[
      q("작은 message에서 latency가 지배적인 이유는?","전송 data 자체보다 call, protocol, software stack의 fixed overhead가 전체 시간에서 큰 비중을 차지하기 때문이다."),
      q("한 Node pair의 OSU 결과를 cluster 전체에 일반화하면 안 되는 이유는?","pair마다 switch/link/topology 경로가 다를 수 있고 특정 port나 path 문제는 다른 pair에서 보이지 않을 수 있기 때문이다."),
      q("median과 p95의 차이가 커졌다는 것은 무엇을 시사할 수 있는가?","대표 성능은 유지되지만 일부 반복에서 큰 지연이 생기는 jitter, congestion, retransmission 같은 tail 문제가 있을 수 있음을 시사한다.")
    ]
  },

  "storage-stack": {
    learningObjectives:[
      "buffered I/O가 page cache, filesystem, block layer, device 또는 network filesystem을 거치는 경로를 설명할 수 있다.",
      "latency, IOPS, throughput, queue depth를 workload 특성과 연결해 해석할 수 있다.",
      "local storage와 shared/network filesystem 문제를 같은 증상으로 취급하지 않고 계층별로 분리할 수 있다."
    ],
    terms:[
      term("VFS","Virtual Filesystem Switch","Linux에서 여러 filesystem implementation에 공통 file API를 제공하는 kernel 계층이다.","application의 read/write가 어떤 filesystem과 mount로 연결되는지 이해하는 출발점이다."),
      term("Page cache","페이지 캐시","file data를 memory에 cache해 반복 read를 빠르게 하고 buffered write를 임시 저장하는 kernel cache다.","benchmark가 DRAM cache 성능을 storage 성능으로 오인하는 대표 원인이 된다."),
      term("IOPS","I/O Operations Per Second","초당 처리하는 I/O operation 수다.","작은 random I/O workload에서는 byte/s보다 operation rate가 더 중요한 지표가 될 수 있다."),
      term("Queue depth","큐 깊이","storage device 또는 stack에 동시에 대기/진행 중인 I/O request 수를 나타내는 개념이다.","동시성이 너무 낮으면 bandwidth를 못 쓰고 너무 높으면 latency가 늘 수 있다."),
      term("Network filesystem","네트워크 파일시스템","file data와 metadata request가 network를 통해 remote server/storage로 전달되는 filesystem이다.","local block device와 failure domain, caching, consistency, latency 원인이 다르다.")
    ],
    sections:[
      sec("read/write는 곧바로 device에 가는 것이 아니다",
        "일반 buffered read는 page cache에 data가 있으면 storage device까지 내려가지 않고 memory에서 완료될 수 있다. cache miss라면 filesystem이 block/network request를 만들고 backing storage에서 data를 가져온다.",
        "write도 page cache에 dirty page로 먼저 기록된 뒤 writeback 시점에 device로 내려갈 수 있다. 따라서 application이 write call에서 빨리 반환됐다는 사실과 persistent storage에 data가 기록됐다는 사실은 동일하지 않다.",
        "storage 진단은 application call과 cache, backing device를 분리한다."),
      sec("latency, IOPS, throughput은 workload 모양에 따라 중요도가 달라진다",
        "4 KB random read 수만 건은 IOPS와 latency가 중요하고, 수 GB의 sequential checkpoint는 sustained throughput이 더 중요할 수 있다. queue depth와 request size도 device가 보이는 성능을 크게 바꾼다.",
        "따라서 iostat의 await나 util 하나만으로 device가 병목이라고 단정하지 않는다. request size, queue, filesystem, application phase를 같은 시간축에서 봐야 한다.",
        "storage 성능 지표는 workload shape와 함께 읽는다."),
      sec("local NVMe와 shared filesystem은 문제 경계가 다르다",
        "local NVMe path는 주로 local filesystem과 block device, controller를 따라가지만 shared filesystem은 client cache, network, metadata/data server, backend storage까지 범위가 넓어진다.",
        "findmnt와 df -hT로 현재 경로의 filesystem type과 mount source를 먼저 확인하면 잘못된 도구를 쓰는 일을 줄일 수 있다. 같은 'I/O 느림'이라도 local device saturation과 remote server contention은 전혀 다른 RCA가 필요하다.",
        "첫 단계는 현재 path가 어디에 mount되어 있는지 확인하는 것이다.")
    ],
    example:ex("첫 실행은 느리고 두 번째 실행은 빠른 read benchmark",
      "page cache hit를 storage 개선으로 오인하지 않도록 경로를 분리한다.",
      [
        {label:"Filesystem",text:"findmnt로 test file이 어느 filesystem에 있는지 확인한다."},
        {label:"Cache 가설",text:"두 번째 실행이 page cache에서 읽힌 가능성을 고려한다."},
        {label:"Device",text:"iostat와 실제 backing device activity가 첫/두 번째 실행에서 다른지 본다."},
        {label:"조건 기록",text:"cold/warm cache 조건을 benchmark report에 명시한다."}
      ],
      "storage benchmark는 cache 상태를 통제하지 않으면 memory benchmark가 될 수 있다."),
    selfCheck:[
      q("buffered write가 반환되면 data가 persistent device에 이미 기록되었다고 볼 수 있는가?","항상 그렇지 않다. dirty page가 page cache에 남아 있다가 이후 writeback될 수 있다."),
      q("%util이 높으면 항상 storage가 병목인가?","아니다. device 종류와 I/O scheduler, parallel queue 특성에 따라 해석이 다르므로 await, queue, throughput, application phase와 함께 봐야 한다."),
      q("storage 문제에서 findmnt를 먼저 보는 이유는?","현재 path가 local filesystem인지 NFS나 parallel filesystem인지 알아야 올바른 failure domain과 관찰 도구를 선택할 수 있기 때문이다.")
    ]
  },

  "parallel-filesystems": {
    learningObjectives:[
      "parallel filesystem의 metadata path와 bulk data path를 분리해 설명할 수 있다.",
      "striping이 aggregate bandwidth에 미치는 효과와 작은 request에서의 trade-off를 설명할 수 있다.",
      "small-file storm을 capacity 문제가 아니라 metadata operation-rate 문제로 진단할 수 있다."
    ],
    terms:[
      term("Metadata","메타데이터","파일 이름, directory entry, inode, ownership, size 같은 file 구조 정보를 뜻한다.","create/stat/open이 많으면 data byte/s가 낮아도 metadata service가 병목이 될 수 있다."),
      term("Metadata server/target","메타데이터 서비스","namespace와 inode 관련 request를 처리하는 parallel filesystem의 control path 구성요소다.","bulk data target과 병목 위치가 다르므로 별도 지표로 관찰해야 한다."),
      term("Storage target","데이터 타깃","실제 file data extent를 저장하고 bulk I/O를 처리하는 backend target/server 영역이다.","여러 target을 병렬 사용하면 aggregate bandwidth를 높일 수 있다."),
      term("Striping","스트라이핑","한 파일의 data를 여러 target에 나누어 배치하는 정책이다.","large parallel I/O에는 유리할 수 있지만 작은 파일에 과도한 stripe count를 주면 overhead가 늘 수 있다."),
      term("Small-file storm","소파일 폭주","많은 client/rank가 대량의 작은 파일을 동시에 create/stat/open하는 workload 패턴이다.","용량보다 metadata operation rate와 directory contention이 먼저 한계에 도달할 수 있다.")
    ],
    sections:[
      sec("metadata와 data는 서로 다른 경로와 병목을 가진다",
        "파일을 open하거나 stat할 때는 file 내용 전체를 읽지 않아도 namespace와 inode metadata를 조회해야 한다. 반면 이미 열린 큰 파일을 읽고 쓰는 bulk I/O는 data target 쪽의 bandwidth를 주로 사용한다.",
        "따라서 'filesystem이 느리다'는 증상을 metadata latency와 data throughput으로 먼저 나누는 것이 중요하다. file create가 느린 문제와 100 GB checkpoint가 느린 문제는 같은 subsystem 이름 아래 있어도 RCA가 다르다.",
        "parallel filesystem 진단의 첫 분기는 metadata 대 data path다."),
      sec("striping은 여러 target을 사용하게 하지만 자동 최적화는 아니다",
        "큰 파일을 여러 target에 나누면 여러 server/device의 bandwidth를 동시에 사용할 수 있어 aggregate throughput을 높일 수 있다. 여러 MPI rank가 서로 다른 file extent를 병렬로 접근할 때 특히 유리할 수 있다.",
        "하지만 file이 작거나 request가 작으면 stripe 관리와 여러 target 접근 비용이 이득보다 클 수 있다. 최적 stripe count와 size는 filesystem, file size, access pattern, rank 수에 따라 달라진다.",
        "striping은 workload에 맞춘 data-layout tuning이다."),
      sec("small-file 문제는 바이트보다 operation 수를 계산한다",
        "1 TB 파일 하나와 1 KB 파일 10억 개는 총 capacity가 비슷할 수 있지만 후자는 create, lookup, inode allocation, directory update 같은 operation을 엄청나게 많이 만든다.",
        "파일 수를 줄이는 container format, HDF5/NetCDF, aggregation, directory sharding 같은 방법은 단순히 저장 공간을 줄이는 것이 아니라 metadata pressure를 줄이는 전략이다.",
        "small-file RCA에서는 bytes보다 files와 operations를 센다.")
    ],
    example:ex("checkpoint data량은 그대로인데 Job 수가 늘수록 느려짐",
      "rank-per-file 패턴이 metadata path를 압박하는지 확인한다.",
      [
        {label:"파일 수",text:"rank 수 × checkpoint 횟수로 생성되는 총 file 수를 계산한다."},
        {label:"Phase 분리",text:"create/open/close 시간과 실제 data write 시간을 나눠 측정한다."},
        {label:"Target",text:"metadata service와 data target 중 어느 지표가 먼저 상승하는지 확인한다."},
        {label:"대안",text:"shared/collective file 또는 aggregation으로 file count를 줄였을 때 비교한다."}
      ],
      "총 data량이 같아도 file count가 증가하면 metadata가 dominant cost가 될 수 있다."),
    selfCheck:[
      q("1 TB 파일 1개와 1 KB 파일 10억 개가 같은 storage workload가 아닌 이유는?","후자는 엄청난 수의 metadata create/open/stat/inode operation을 발생시켜 metadata service와 directory를 압박하기 때문이다."),
      q("stripe count를 무조건 크게 하면 안 되는 이유는?","작은 파일이나 작은 request에서는 여러 target을 관리하고 접근하는 overhead가 aggregate bandwidth 이득보다 커질 수 있기 때문이다."),
      q("metadata 병목과 data 병목을 구분하기 위한 첫 관찰은?","create/stat/open 같은 metadata operation latency와 bulk read/write throughput을 별도 phase와 지표로 나누어 본다.")
    ]
  },

  "scientific-io": {
    learningObjectives:[
      "rank-per-file, shared file, collective MPI-IO의 file/request 구조 차이를 설명할 수 있다.",
      "Parallel HDF5/NetCDF와 MPI-IO, parallel filesystem의 계층 관계를 설명할 수 있다.",
      "checkpoint slowdown을 data volume, file count, synchronization, staging 관점에서 분해할 수 있다."
    ],
    terms:[
      term("Rank-per-file","rank별 파일","각 MPI rank가 자신의 output/checkpoint 파일을 따로 만드는 I/O 패턴이다.","구현은 단순하지만 rank 수가 늘수록 file count와 metadata operation이 함께 증가한다."),
      term("MPI-IO","MPI I/O","MPI standard가 제공하는 parallel file I/O interface로 shared file access와 collective I/O 기능을 제공한다.","여러 rank의 request를 filesystem-friendly pattern으로 재구성할 기회를 제공한다."),
      term("Collective I/O","집단 I/O","여러 rank의 I/O request를 공동으로 분석하고 일부 aggregator가 큰 request로 묶어 수행하는 방식이다.","작고 비연속적인 I/O를 줄일 수 있지만 rank 간 communication과 synchronization 비용이 있다."),
      term("Parallel HDF5/NetCDF","병렬 과학 데이터 포맷","dataset/variable 같은 고수준 데이터 모델을 MPI-IO 기반 parallel I/O와 결합한 library 사용 방식이다.","library가 parallel-enabled로 build되었는지와 collective call semantics를 확인해야 한다."),
      term("Data staging","데이터 스테이징","compute와 persistent shared storage 사이에 local/burst buffer 같은 중간 storage tier를 두는 전략이다.","checkpoint latency를 compute critical path에서 분리할 수 있지만 stage-out과 durability를 별도로 관리해야 한다.")
    ],
    sections:[
      sec("file count와 I/O request shape를 함께 본다",
        "rank-per-file은 각 rank가 독립적으로 쓰므로 programming model이 단순하지만 rank 수가 수천으로 늘면 file create/open/close와 directory operation도 함께 늘어난다. shared file은 file count를 줄일 수 있지만 각 rank가 작은 offset에 독립 I/O를 하면 request fragmentation이 남을 수 있다.",
        "따라서 scientific I/O에서는 총 byte만 세지 않고 file count, request size, offset pattern, synchronization을 함께 기록해야 한다. 같은 1 TB checkpoint라도 storage에 보이는 workload 모양은 전혀 다를 수 있다.",
        "checkpoint 최적화는 bytes와 files, requests를 동시에 다룬다."),
      sec("collective MPI-IO는 storage에 보이는 요청을 재구성한다",
        "collective I/O에서 MPI-IO implementation은 여러 rank의 작은 비연속 request를 모아 일부 aggregator가 더 큰 연속 request로 수행하도록 최적화할 수 있다. 이 과정은 filesystem target과 striping을 더 효율적으로 사용할 가능성을 만든다.",
        "하지만 aggregator까지 data를 모으는 communication과 collective synchronization 비용이 새로 생긴다. access pattern이 이미 큰 연속 I/O라면 이득이 작을 수 있으므로 independent와 collective를 같은 조건에서 비교해야 한다.",
        "collective I/O는 storage request를 줄이는 대신 rank 간 coordination을 추가한다."),
      sec("HDF5/NetCDF는 계층을 감추지만 없애지 않는다",
        "application은 HDF5 dataset이나 NetCDF variable을 다루지만 실제 parallel I/O는 library build와 MPI-IO backend를 통해 filesystem으로 내려간다. serial build를 잘못 link하면 application code가 parallel API를 기대해도 원하는 I/O 경로가 나오지 않을 수 있다.",
        "ldd, build configuration, MPI implementation, file layout을 함께 확인해야 한다. 고수준 format은 사용성을 높이지만 underlying MPI-IO와 filesystem behavior까지 자동으로 최적화하는 마법 계층은 아니다.",
        "고수준 library 문제도 결국 backend와 filesystem 경로로 내려가 검증한다."),
      sec("staging은 I/O 시간을 없애는 것이 아니라 critical path에서 옮긴다",
        "node-local SSD나 burst buffer에 checkpoint를 먼저 기록하면 compute가 shared filesystem의 긴 latency를 직접 기다리는 시간을 줄일 수 있다. 이후 별도의 stage-out 단계에서 persistent storage로 data를 이동한다.",
        "그러나 중간 tier의 capacity, failure 시 data durability, stage-out 완료 여부가 새로운 운영 조건이 된다. staging 성능만 보고 Job 종료 후 data가 안전하게 보존됐는지를 놓치면 안 된다.",
        "staging의 성공 기준은 compute latency와 durability를 모두 포함한다.")
    ],
    example:ex("2048 rank checkpoint가 30초에서 8분으로 증가",
      "rank 수 증가가 어떤 I/O 비용을 확대했는지 분리한다.",
      [
        {label:"파일 모델",text:"rank-per-file인지 shared/collective file인지 확인하고 checkpoint당 file 수를 센다."},
        {label:"Phase",text:"create/open과 data write, close/sync 시간을 분리한다."},
        {label:"Aggregation",text:"collective MPI-IO나 aggregator가 실제 사용되는지 library/runtime 설정을 확인한다."},
        {label:"Staging",text:"shared filesystem을 critical path에서 분리할 수 있는 중간 tier가 있는지 검토한다."}
      ],
      "checkpoint slowdown은 data량 증가가 아니라 file count와 collective synchronization 증가에서 시작될 수도 있다."),
    selfCheck:[
      q("rank-per-file이 큰 scale에서 문제가 되기 쉬운 이유는?","rank 수에 비례해 file 수와 create/open/close 같은 metadata operation이 증가하기 때문이다."),
      q("collective MPI-IO가 항상 independent I/O보다 빠른가?","아니다. communication과 synchronization 비용이 추가되므로 access pattern, implementation, filesystem에 따라 결과가 달라진다."),
      q("Parallel HDF5를 쓴다고 해서 자동으로 parallel I/O가 되는가?","아니다. parallel-enabled build, MPI-IO backend, collective/independent call 방식과 runtime linking이 모두 맞아야 한다.")
    ]
  }
});
