export const chapters = [
  {
    id: "hpc-aa-role",
    stage: "Foundation",
    title: "HPC와 Application Analyst의 역할",
    en: "HPC & Application Analyst",
    level: "기초",
    minutes: 55,
    env: ["Local/VM"],
    why: "HPC는 단순히 빠른 컴퓨터를 뜻하지 않습니다. 여러 계산 자원, 네트워크, 스토리지, 스케줄러를 하나의 시스템으로 묶어 큰 문제를 더 빨리 풀거나 많은 작업을 더 많이 처리하는 방식입니다. Application Analyst(AA)는 이 복합 시스템에서 사용자의 증상을 자원·실행·통신·I/O·애플리케이션 문제로 나누고, 관찰 가능한 증거를 이용해 원인을 좁혀 가는 역할을 합니다.",
    learningObjectives: [
      "HPC가 해결하려는 time-to-solution과 throughput의 차이를 설명할 수 있다.",
      "Application, scheduler, compute node, interconnect, shared storage가 하나의 job 실행에서 어떻게 연결되는지 설명할 수 있다.",
      "AA가 증상을 계층별 가설과 증거로 분해하는 역할이라는 점을 이해한다.",
      "ticket을 조사하기 전에 확보해야 할 최소 증거를 정리할 수 있다."
    ],
    terms: [
      { term: "HPC", en: "High Performance Computing", definition: "많은 계산 자원을 함께 사용해 큰 계산을 더 빨리 끝내거나 같은 시간 동안 더 많은 계산을 수행하는 컴퓨팅 방식입니다.", why: "단일 CPU의 최고 속도보다 병렬성, 메모리, 네트워크, 스토리지의 균형이 중요합니다." },
      { term: "Job", en: "Job", definition: "사용자가 스케줄러에 제출한 실행 단위입니다. 실행 명령뿐 아니라 CPU, 메모리, GPU, 시간 제한 같은 자원 요청도 포함합니다.", why: "AA는 대부분의 문제를 job ID와 자원 요청, 실행 기록에서 시작해 추적합니다." },
      { term: "Node", en: "Compute Node", definition: "CPU, 메모리, 네트워크 장치, 운영체제를 가진 하나의 독립 서버입니다.", why: "노드 내부와 노드 사이에서는 메모리 공유 방식과 통신 비용이 달라집니다." },
      { term: "Scheduler", en: "Workload Scheduler", definition: "여러 job 요청을 받아 어떤 자원을 언제 누구에게 할당할지 결정하는 소프트웨어입니다.", why: "job이 시작되지 않는 이유와 실행 중 실제로 받은 자원을 이해하려면 scheduler 관점이 필요합니다." },
      { term: "Time-to-solution", en: "Time-to-solution", definition: "하나의 문제를 제출한 뒤 계산 결과를 얻기까지 걸리는 시간입니다.", why: "한 계산을 더 빨리 끝내고 싶을 때 중심이 되는 성능 목표입니다." },
      { term: "Throughput", en: "Throughput", definition: "일정 시간 동안 완료할 수 있는 job 또는 작업량입니다.", why: "독립적인 많은 작업을 동시에 처리하는 환경에서는 단일 job 속도보다 더 중요할 수 있습니다." },
      { term: "Baseline", en: "Baseline", definition: "문제 발생 전후를 비교하기 위한 정상 상태의 기준값과 환경 기록입니다.", why: "'느리다'를 객관적인 차이로 바꾸는 출발점입니다." }
    ],
    sections: [
      {
        title: "왜 HPC가 필요한가",
        paragraphs: [
          "어떤 계산은 한 대의 컴퓨터에서도 충분히 빠르게 끝납니다. 하지만 문제 크기가 커지면 계산량뿐 아니라 필요한 메모리와 데이터 이동량도 함께 증가합니다. 한 개의 CPU 코어가 모든 계산을 순서대로 처리하거나 한 대의 서버가 모든 데이터를 메모리에 올려야 한다면 어느 순간 실행 시간이 너무 길어지거나 메모리가 부족해집니다.",
          "HPC는 이 한계를 여러 자원으로 나눠 사용합니다. 하나의 큰 계산을 여러 코어·여러 노드가 나눠 처리하면 time-to-solution을 줄일 수 있고, 독립적인 계산을 여러 노드에서 동시에 실행하면 cluster 전체의 throughput을 높일 수 있습니다. 따라서 'HPC가 빠르다'는 말은 특정 부품 하나가 빠르다는 뜻보다 시스템 전체에서 병렬 작업과 데이터 이동을 얼마나 효율적으로 구성했는가에 가깝습니다."
        ],
        takeaway: "HPC의 핵심은 가장 빠른 부품 하나가 아니라 계산·메모리·통신·I/O 자원을 함께 사용해 전체 시간을 줄이는 데 있습니다."
      },
      {
        title: "하나의 job은 어떤 경로를 지나가는가",
        paragraphs: [
          "사용자는 보통 login node에서 소스 코드를 편집하거나 빌드하고 job script를 작성합니다. script를 scheduler에 제출하면 scheduler는 사용 가능한 compute node와 정책을 확인해 실행 시점과 자원을 결정합니다. 실제 계산은 할당된 compute node에서 수행되고, 노드 간 데이터 교환이 필요하면 interconnect를 사용합니다. 입력과 출력은 shared filesystem이나 parallel filesystem을 통해 여러 노드와 공유될 수 있습니다.",
          "여기서 control plane과 data plane을 구분하는 것이 중요합니다. Scheduler는 누가 언제 어떤 자원을 사용할지 제어하지만 사용자의 행렬 곱셈이나 MPI message를 직접 처리하지 않습니다. 실제 계산과 데이터 이동은 CPU/GPU, memory, network, storage에서 일어납니다."
        ],
        takeaway: "PENDING처럼 제어가 막힌 문제와 RUNNING 중 성능이 떨어지는 문제는 조사 출발점이 다릅니다."
      },
      {
        title: "AA는 무엇을 진단하는가",
        paragraphs: [
          "사용자는 보통 'job이 안 돌아요', '어제보다 느려요', 'GPU가 100%인데 성능이 안 나와요'처럼 현상으로 문제를 설명합니다. 같은 '느림'도 CPU oversubscription, NUMA remote access, MPI 통신 지연, storage metadata 병목, GPU data transfer, scheduler placement 등 전혀 다른 이유로 발생할 수 있습니다.",
          "AA의 일은 증상을 곧바로 하나의 원인으로 단정하는 것이 아니라 가능한 원인을 계층별 가설로 나누고, 각 가설을 확인하거나 기각할 수 있는 증거를 모으는 것입니다. 예를 들어 job이 느리다면 먼저 실행 시간의 어느 구간이 늘었는지 확인한 뒤 CPU·memory·network·I/O·GPU 지표를 같은 시간 축에서 비교합니다."
        ],
        takeaway: "좋은 진단은 명령어를 많이 실행하는 것이 아니라 가설과 증거 사이의 연결이 명확한 진단입니다."
      },
      {
        title: "진단은 재현 가능한 사건 기록에서 시작한다",
        paragraphs: [
          "조사를 위해서는 job ID, 발생 시각과 timezone, partition과 node, 제출 script, stdout/stderr, module과 container 환경처럼 '그때 실제로 무엇이 실행되었는지'를 남겨야 합니다. 이 정보가 없으면 이후의 로그와 모니터링 지표를 같은 사건에 연결하기 어렵습니다.",
          "정상 실행의 baseline도 중요합니다. 같은 애플리케이션이 정상일 때의 wall time, CPU 수, memory 사용량, node 수, input size를 알고 있어야 비정상 실행과 차이를 비교할 수 있습니다. 운영 환경에서는 절대값보다 같은 조건에서 무엇이 달라졌는가를 먼저 봅니다."
        ],
        takeaway: "장애 분석의 첫 단계는 원인 추측이 아니라 재현 가능한 사건 기록을 만드는 것입니다."
      }
    ],
    concepts: [
      "HPC 성능 목표는 한 계산의 완료 시간을 줄이는 time-to-solution과 일정 시간 동안 더 많은 계산을 처리하는 throughput으로 나눠 볼 수 있습니다.",
      "Job은 scheduler를 통해 compute resource를 할당받고 실제 계산은 compute node의 CPU/GPU와 memory에서 이루어집니다.",
      "Node 경계를 넘는 통신과 shared storage 접근은 추가 비용과 공유 병목을 만들 수 있습니다.",
      "AA는 증상 → 가설 → 증거 → 판단 → 조치 순서로 문제를 좁혀 갑니다."
    ],
    example: {
      title: "예시 · '어제보다 2배 느립니다'를 조사하는 방법",
      intro: "원인을 바로 CPU나 네트워크로 정하지 않고 질문을 점점 좁히는 방식으로 접근합니다.",
      steps: [
        { label: "증상 고정", text: "같은 input과 같은 executable인지 확인하고 정상 run과 문제 run의 wall time을 비교합니다." },
        { label: "구간 분리", text: "queue wait, startup, compute, communication, I/O 중 어느 구간이 증가했는지 확인합니다." },
        { label: "자원 확인", text: "실제로 할당된 CPU·memory·GPU·node 수와 binding/placement가 같은지 비교합니다." },
        { label: "계층별 증거", text: "CPU utilization, memory pressure, network counter, filesystem 지표를 문제 시간대와 맞춰 봅니다." },
        { label: "가설 축소", text: "차이가 관찰된 계층만 더 깊게 조사하고 차이가 없는 계층은 우선순위를 낮춥니다." }
      ],
      conclusion: "이 흐름은 이후 CPU, NUMA, MPI, Slurm, storage, GPU 챕터에서 반복해서 사용할 공통 진단 패턴입니다."
    },
    commands: [
      { cmd: "hostname; date -Is; uptime; id; nproc; free -h", purpose: "현재 조사 환경의 최소 baseline 기록", observe: "hostname과 시각, 사용 계정, 허용 CPU 수, load average, available memory를 한 번에 기록합니다.", caution: "load average는 CPU 사용률과 같은 값이 아닙니다." }
    ],
    lab: {
      title: "나만의 증거 수집 템플릿 만들기",
      steps: [
        "mkdir -p ~/hpc-study && cd ~/hpc-study",
        "{ echo '=== identity ==='; hostname; date -Is; id; echo '=== cpu/memory ==='; nproc; free -h; echo '=== storage ==='; df -h ~; } > baseline.txt 2>&1",
        "less baseline.txt",
        "각 출력이 CPU / memory / storage / identity 중 어느 계층을 설명하는지 메모한다."
      ],
      expect: "문제 해결 명령어를 외우기보다 각 출력이 어떤 가설을 확인하는 증거인지 설명할 수 있다."
    },
    mistakes: [
      "'느리다'라는 표현만 듣고 특정 원인을 바로 추측한다.",
      "load average 하나를 CPU utilization으로 해석한다.",
      "job ID·발생 시각·실행 환경을 확보하기 전에 로그를 뒤진다.",
      "정상 baseline 없이 절대 수치만 보고 비정상이라고 판단한다."
    ],
    troubleshoot: "첫 질문은 '무엇이 느린가?'보다 '정상 실행과 비교했을 때 어느 구간이 언제부터 얼마나 달라졌는가?'가 되어야 합니다.",
    selfCheck: [
      { question: "time-to-solution과 throughput은 어떻게 다른가?", answer: "time-to-solution은 하나의 문제를 끝내는 시간이고 throughput은 일정 시간 동안 완료하는 전체 작업량입니다." },
      { question: "scheduler가 애플리케이션의 계산을 직접 수행하는가?", answer: "아닙니다. scheduler는 자원과 실행 순서를 제어하고 실제 계산과 데이터 이동은 할당된 compute resource에서 이루어집니다." },
      { question: "AA가 ticket을 받을 때 가장 먼저 확보할 정보는 무엇인가?", answer: "job ID, 발생 시각과 timezone, 실행 node/partition, 제출 script, stdout/stderr, 사용한 software 환경처럼 사건을 재현하고 로그와 연결할 수 있는 정보입니다." },
      { question: "baseline이 필요한 이유는 무엇인가?", answer: "정상 조건과 비교해 실제로 달라진 계층과 지표를 찾기 위해 필요합니다." }
    ],
    keywords: ["HPC", "Application Analyst", "AA", "job", "scheduler", "time-to-solution", "throughput", "baseline"]
  },
  {
    id: "cluster-architecture",
    stage: "Foundation",
    title: "클러스터 구조와 서비스 경로",
    en: "Cluster Architecture",
    level: "기초",
    minutes: 65,
    env: ["Local/VM", "Single node"],
    why: "클러스터는 여러 서버를 단순히 한 줄로 연결한 장비가 아닙니다. 계산을 담당하는 compute node, 자원 배분을 담당하는 scheduler, 사용자가 접속하는 login node, 노드 사이의 interconnect, 여러 노드가 함께 쓰는 storage가 서로 다른 역할과 장애 경계를 가집니다. 이 구조를 이해하면 증상을 어느 계층에서 시작해 조사해야 하는지 결정할 수 있습니다.",
    learningObjectives: [
      "Core, CPU/Socket, Node, Cluster의 포함 관계를 설명할 수 있다.",
      "login node, compute node, scheduler/controller, interconnect, shared storage의 역할을 구분할 수 있다.",
      "control path, compute path, network path, I/O path가 서로 다른 경로라는 점을 설명할 수 있다.",
      "노드 내부와 노드 사이에서 메모리와 통신 방식이 어떻게 달라지는지 설명할 수 있다."
    ],
    terms: [
      { term: "Core", en: "CPU Core", definition: "instruction을 실행하는 CPU 내부의 물리 계산 단위입니다.", why: "thread/process가 CPU 시간을 소비하는 가장 기본적인 실행 단위입니다." },
      { term: "Socket", en: "CPU Socket", definition: "하나의 CPU package가 장착되는 물리 단위입니다. 한 socket에는 여러 core와 cache, memory controller가 포함될 수 있습니다.", why: "다중 socket node에서는 memory locality와 CPU binding에 영향을 줍니다." },
      { term: "Compute Node", en: "Compute Node", definition: "실제 batch job과 병렬 애플리케이션이 실행되는 서버입니다.", why: "CPU, memory, GPU, NIC 같은 계산 자원이 이 노드에 있습니다." },
      { term: "Login Node", en: "Login Node", definition: "사용자가 접속해 편집, 컴파일, job 제출 같은 가벼운 대화형 작업을 수행하는 진입점입니다.", why: "공용 자원이므로 장시간 계산은 보통 compute node에서 수행해야 합니다." },
      { term: "Interconnect", en: "Interconnect / Fabric", definition: "compute node 사이의 데이터 통신을 담당하는 네트워크입니다.", why: "MPI나 distributed training 성능은 latency, bandwidth, topology의 영향을 받습니다." },
      { term: "Shared Storage", en: "Shared / Parallel Storage", definition: "여러 node가 공통 경로로 접근할 수 있는 파일 저장 계층입니다.", why: "metadata와 bandwidth가 공유되므로 cluster-wide 병목이 될 수 있습니다." },
      { term: "Control plane", en: "Control Plane", definition: "job 제출, 자원 할당, 상태 관리처럼 시스템 동작을 제어하는 경로입니다.", why: "실제 계산 데이터가 흐르는 data plane과 장애 양상이 다릅니다." }
    ],
    sections: [
      { title: "Core → Socket → Node → Cluster: 포함 관계부터 잡기", paragraphs: ["Core는 CPU 내부에서 명령을 실행하는 계산 단위이고 여러 core가 하나의 CPU package 또는 socket에 묶입니다. 한 node는 하나 이상의 socket, DRAM, NIC, local storage, 운영체제를 가진 독립 서버입니다. Cluster는 이런 node 여러 대를 네트워크와 공용 서비스로 묶은 전체 시스템입니다.", "이 계층을 외우는 이유는 자원이 공유되는 경계가 달라지기 때문입니다. 같은 socket의 cache와 memory path, 같은 node의 DRAM, 다른 node 사이의 network는 각각 비용 모델이 다릅니다. 이후 CPU topology, NUMA, MPI를 이해할 때 이 경계가 기준이 됩니다."], takeaway: "포함 관계는 단순한 이름 목록이 아니라 무엇을 공유하고 어디서 통신 비용이 생기는지를 알려 주는 지도입니다." },
      { title: "Login, scheduler, compute는 역할이 다르다", paragraphs: ["사용자가 SSH로 접속하는 login node는 보통 소스 수정, 컴파일, 데이터 확인, job 제출을 위한 공용 진입점입니다. 실제 대규모 계산은 compute node에 배정됩니다.", "Scheduler controller는 job queue와 resource 상태를 관리하고 자원 배치를 결정합니다. 하지만 scheduler가 사용자의 계산을 대신 수행하는 것은 아닙니다. job이 RUNNING 상태가 된 뒤 CPU instruction, MPI message, file I/O는 compute node와 data plane에서 발생합니다."], takeaway: "PENDING 문제와 RUNNING 중 성능 문제는 출발점부터 다릅니다." },
      { title: "Node 내부와 Node 사이의 경계", paragraphs: ["한 node 안의 process들은 운영체제의 virtual memory를 통해 같은 physical memory를 공유할 수 있습니다. OpenMP 같은 shared-memory 모델이 이 특성을 사용합니다. 다만 다중 socket에서는 NUMA 때문에 같은 node 안에서도 memory access 비용이 균일하지 않을 수 있습니다.", "다른 node의 DRAM은 일반적인 load/store로 같은 주소 공간처럼 직접 공유할 수 없습니다. 두 node의 process가 데이터를 주고받으려면 network transport와 message passing이 필요합니다. MPI가 대표적인 모델입니다."], takeaway: "Node는 shared-memory와 distributed-memory를 나누는 가장 중요한 시스템 경계입니다." },
      { title: "Storage와 fabric은 공용 자원이다", paragraphs: ["Shared filesystem은 여러 node에서 같은 경로를 볼 수 있게 해 주지만 metadata server나 storage target의 처리량은 모두가 공유합니다. 한 job이 작은 파일을 대량 생성하거나 큰 sequential I/O를 집중하면 다른 job에도 영향을 줄 수 있습니다.", "Interconnect 역시 공용 fabric입니다. 특정 node pair의 link 문제, congestion, 잘못된 topology 배치는 여러 node를 사용하는 애플리케이션의 communication time을 늘릴 수 있습니다."], takeaway: "공용 자원 문제는 한 node의 CPU 지표만 봐서는 발견되지 않을 수 있습니다." }
    ],
    concepts: [
      "Core → Socket → Node → Cluster는 포함 관계이면서 자원 공유와 통신 경계를 나타냅니다.",
      "Scheduler는 control plane, CPU/GPU·network·storage는 실제 계산과 데이터 이동이 일어나는 data plane으로 구분할 수 있습니다.",
      "같은 node에서는 memory 공유가 가능하지만 node를 넘으면 network communication이 필요합니다.",
      "Interconnect와 shared storage는 여러 job이 공유하므로 cluster-wide 병목이 될 수 있습니다."
    ],
    example: {
      title: "예시 · job이 RUNNING인데 출력 파일이 멈춘 경우",
      intro: "RUNNING이라는 상태만으로 compute가 정상이라고 판단할 수 없습니다. 실행 경로를 계층별로 나눠 봅니다.",
      steps: [
        { label: "Scheduler", text: "job이 어떤 node에 어떤 resource로 배정되었는지 확인합니다." },
        { label: "Compute", text: "process가 CPU에서 실행 중인지, memory pressure나 OOM 징후가 있는지 확인합니다." },
        { label: "Network", text: "MPI job이면 rank 간 communication이 진행되는지와 fabric error를 확인합니다." },
        { label: "Storage", text: "출력 경로의 filesystem type, capacity, metadata/data throughput 문제를 확인합니다." }
      ],
      conclusion: "하나의 사용자 증상도 cluster 구조의 여러 경로를 통과하므로 역할별로 관찰 지점을 분리해야 합니다."
    },
    commands: [
      { cmd: "hostname; lscpu | sed -n '1,25p'; ip -br addr; findmnt -T \"$HOME\"", purpose: "현재 node에서 compute·network·storage 경계 확인", observe: "socket/core 수, network interface, home 경로의 filesystem type을 함께 기록합니다." }
    ],
    lab: {
      title: "내 환경의 cluster path 그리기",
      steps: ["현재 접속한 host가 login/compute 중 어떤 역할인지 확인한다.", "lscpu로 socket/core 구조를 기록한다.", "ip -br addr로 주요 NIC를 기록한다.", "findmnt -T \"$HOME\"로 home의 filesystem type을 기록한다.", "User → Login → Scheduler → Compute → Fabric/Storage 경로를 그리고 관찰 명령을 한 개씩 붙인다."],
      expect: "시스템 구성요소의 이름뿐 아니라 각 구성요소에서 어떤 증거를 수집할지 연결할 수 있다."
    },
    mistakes: ["모든 node를 같은 역할로 취급한다.", "PENDING job과 RUNNING job을 같은 관찰 순서로 조사한다.", "node 내부 memory access와 node 간 communication을 같은 비용으로 생각한다.", "shared filesystem 장애를 compute node CPU 문제로 오인한다."],
    troubleshoot: "증상을 받으면 먼저 어느 경로(control, compute, network, I/O)에서 멈췄는지 분류하고 그 경로의 앞뒤 계층을 함께 확인합니다.",
    selfCheck: [
      { question: "Node와 Cluster의 차이는 무엇인가?", answer: "Node는 CPU·memory·NIC·OS를 가진 하나의 독립 서버이고 Cluster는 여러 node와 scheduler, network, shared storage를 묶은 전체 시스템입니다." },
      { question: "Scheduler가 control plane이라고 부르는 이유는 무엇인가?", answer: "job의 실행 시점과 자원 배치를 결정하지만 애플리케이션의 실제 계산 데이터 경로를 직접 처리하지 않기 때문입니다." },
      { question: "Node 경계를 넘을 때 왜 MPI 같은 통신 모델이 필요한가?", answer: "다른 node의 DRAM을 같은 주소 공간처럼 직접 공유할 수 없어 network를 통한 데이터 전달이 필요하기 때문입니다." },
      { question: "Shared filesystem 문제가 cluster-wide 영향을 만들 수 있는 이유는?", answer: "여러 node와 job이 metadata service와 storage bandwidth를 공유하기 때문입니다." }
    ],
    keywords: ["cluster", "core", "socket", "node", "login node", "compute node", "scheduler", "fabric", "shared storage", "control plane"]
  },
  {
    id: "linux-files",
    stage: "Foundation",
    title: "Linux 파일·권한·ACL과 경로 해석",
    en: "Filesystem, Permissions & ACL",
    level: "기초",
    minutes: 70,
    env: ["Local/VM"],
    why: "HPC 환경에서 파일 접근 실패는 chmod 숫자 하나의 문제가 아닙니다. 파일 mode, 상위 directory의 execute 권한, 소유자와 group, ACL, quota, inode, mount 특성이 함께 작동합니다. 경로를 구성요소별로 읽을 수 있어야 Permission denied와 No space left on device를 안전하게 진단할 수 있습니다.",
    learningObjectives: ["파일과 directory에서 r/w/x의 의미 차이를 설명할 수 있다.", "경로 접근이 모든 상위 directory의 권한에 의해 결정된다는 점을 설명할 수 있다.", "POSIX mode, umask, ACL의 역할 차이를 설명할 수 있다.", "용량 부족과 inode/quota 부족을 구분할 수 있다."],
    terms: [
      { term: "Mode bits", en: "rwx permissions", definition: "owner, group, others에 대한 기본 POSIX read/write/execute 권한입니다.", why: "ls -l에서 보이는 권한 문자열을 해석하는 출발점입니다." },
      { term: "Directory execute", en: "Search permission", definition: "directory에서 x는 실행이 아니라 그 directory를 경로로 통과하고 내부 이름을 조회할 수 있는 권한입니다.", why: "파일 자체 권한이 충분해도 상위 directory에 x가 없으면 접근이 실패합니다." },
      { term: "umask", en: "umask", definition: "새 파일이나 directory의 기본 권한에서 제거할 비트를 지정합니다.", why: "계정이나 shell 환경에 따라 새 파일의 기본 mode가 달라지는 이유를 설명합니다." },
      { term: "ACL", en: "Access Control List", definition: "owner/group/others보다 세밀하게 특정 사용자나 group에 권한을 부여하는 방식입니다.", why: "공동 연구 directory에서 mode만 보고 실제 권한을 오판하는 일을 줄입니다." },
      { term: "inode", en: "inode", definition: "파일 metadata와 filesystem 객체를 나타내는 내부 구조입니다.", why: "파일 수가 많으면 byte capacity가 남아 있어도 inode가 부족할 수 있습니다." },
      { term: "quota", en: "Quota", definition: "사용자나 group이 사용할 수 있는 storage byte 또는 file count 제한입니다.", why: "filesystem 전체에 공간이 남아 있어도 개인 quota 때문에 쓰기가 실패할 수 있습니다." }
    ],
    sections: [
      { title: "파일과 directory의 rwx는 같은 뜻이 아니다", paragraphs: ["일반 파일에서 r은 내용을 읽기, w는 내용을 수정하기, x는 파일을 실행 대상으로 사용할 수 있음을 뜻합니다. Directory에서는 r은 entry 이름 목록 읽기, w는 entry 추가·삭제, x는 그 directory를 경로로 통과해 내부 이름에 접근할 수 있음을 뜻합니다.", "따라서 파일은 644인데 왜 읽지 못하나요라는 질문에 파일 mode만 보는 것은 부족합니다. /project/team/run/input.dat에 접근하려면 모든 상위 directory를 통과할 수 있어야 합니다. namei -l은 이 경로를 구성요소별로 보여 줍니다."], takeaway: "Permission denied는 목표 파일이 아니라 경로 전체를 조사해야 합니다." },
      { title: "mode, group, ACL이 실제 접근권한을 만든다", paragraphs: ["POSIX mode는 owner, group, others 세 범주를 사용합니다. 하지만 shared HPC project에서는 여러 사람이 한 directory를 함께 써야 하므로 group, setgid directory, ACL을 조합하는 경우가 많습니다.", "ACL에는 mask가 있어 named user/group의 effective permission을 제한할 수 있습니다. getfacl에서는 단순히 rwx가 보이는지뿐 아니라 effective 표시와 mask를 함께 읽어야 합니다."], takeaway: "권한은 chmod 숫자 하나가 아니라 identity, group, mode, ACL의 조합입니다." },
      { title: "No space left on device는 byte 공간만 뜻하지 않는다", paragraphs: ["파일 생성이 실패하면 df -h로 byte capacity를 확인하지만 small-file workload에서는 inode가 먼저 고갈될 수 있습니다. df -i는 남은 inode 수를 보여 줍니다. quota 환경에서는 user/group file-count quota도 별도로 존재할 수 있습니다.", "어떤 경로가 어떤 filesystem에 올라가 있는지도 먼저 확인해야 합니다. findmnt -T PATH 또는 df -T PATH로 실제 filesystem을 확인하고 그 filesystem에 맞는 도구를 사용합니다."], takeaway: "공간 문제는 capacity, inode, quota를 각각 분리해 확인합니다." },
      { title: "Shared filesystem에서는 조사 명령도 부하가 된다", paragraphs: ["로컬 filesystem에서 무심코 사용하는 find, du -a, ls -lR은 파일 수가 매우 많은 shared filesystem에서 막대한 metadata request를 만들 수 있습니다.", "AA는 특정 directory depth, 최근 파일, 특정 job output처럼 증상과 관련된 범위를 먼저 정하고 사이트가 제공하는 quota나 filesystem 전용 도구가 있으면 그것을 우선 사용합니다."], takeaway: "운영 환경에서는 정확한 명령뿐 아니라 안전한 조사 범위가 중요합니다." }
    ],
    concepts: ["파일과 directory에서 rwx의 의미가 다르며 directory x는 경로 통과에 필요합니다.", "실제 접근권한은 identity, group, POSIX mode, ACL과 mask의 조합으로 결정됩니다.", "쓰기 실패는 byte capacity뿐 아니라 inode 또는 quota 한계 때문에 발생할 수 있습니다.", "Shared filesystem에서는 대규모 recursive scan 자체가 metadata 부하가 될 수 있습니다."],
    example: { title: "예시 · 파일은 644인데 Permission denied", intro: "목표 파일 하나가 아니라 path walk 전체를 확인합니다.", steps: [{ label: "Identity", text: "id와 groups로 실제 uid/gid와 group membership을 확인합니다." }, { label: "Path walk", text: "namei -l로 모든 상위 directory의 x 권한을 확인합니다." }, { label: "Metadata", text: "stat로 owner, group, mode를 확인합니다." }, { label: "ACL", text: "getfacl로 named entry와 mask를 확인합니다." }], conclusion: "원인이 확인되기 전에 chmod 777로 덮지 않고 어느 경로 구성요소에서 접근이 끊기는지 찾는 것이 핵심입니다." },
    commands: [
      { cmd: "id; groups; namei -l PATH", purpose: "identity와 상위 경로 permission 확인", observe: "각 directory의 owner/group과 execute 권한을 현재 계정의 group membership과 비교합니다." },
      { cmd: "stat FILE; getfacl FILE 2>/dev/null || true", purpose: "파일 metadata와 ACL 확인", observe: "mode, ACL mask, named user/group의 effective permission을 확인합니다." },
      { cmd: "df -hT PATH; df -i PATH; quota -s 2>/dev/null || true", purpose: "filesystem type, capacity, inode, quota 확인", observe: "byte 공간이 남아도 inode 또는 quota가 제한에 도달했는지 구분합니다." }
    ],
    lab: { title: "상위 directory 권한 실패 재현", steps: ["mkdir -p /tmp/hpc-perm/a && printf 'data\\n' > /tmp/hpc-perm/a/x", "chmod 644 /tmp/hpc-perm/a/x", "chmod 600 /tmp/hpc-perm/a", "namei -l /tmp/hpc-perm/a/x", "chmod 700 /tmp/hpc-perm/a && cat /tmp/hpc-perm/a/x"], expect: "목표 파일 mode가 같아도 상위 directory의 execute 권한 때문에 접근 가능 여부가 달라지는 것을 설명할 수 있다." },
    mistakes: ["chmod 777로 원인을 확인하지 않고 문제를 덮는다.", "파일 자체 mode만 보고 상위 directory permission을 확인하지 않는다.", "df -h만 보고 inode와 quota를 생략한다.", "shared filesystem 전체에서 recursive find/du를 실행한다."],
    troubleshoot: "Permission denied는 identity → path walk → file mode/ownership → ACL 순서로, 공간 문제는 filesystem → capacity → inode → quota 순서로 좁힙니다.",
    selfCheck: [
      { question: "directory의 x 권한은 무엇을 의미하는가?", answer: "그 directory를 경로 구성요소로 통과하고 내부 이름을 lookup할 수 있는 search 권한입니다." },
      { question: "파일 mode가 644인데도 읽지 못할 수 있는 이유는?", answer: "상위 directory 중 하나에 execute/search 권한이 없거나 ACL/mask가 접근을 제한할 수 있기 때문입니다." },
      { question: "df -h에 공간이 남았는데 새 파일 생성이 실패할 수 있는 이유는?", answer: "inode 고갈이나 user/group quota 제한이 대표적입니다." },
      { question: "shared filesystem에서 무제한 find가 위험한 이유는?", answer: "대량 metadata lookup으로 filesystem과 다른 사용자의 workload에 부하를 줄 수 있기 때문입니다." }
    ],
    keywords: ["permissions", "ACL", "umask", "inode", "quota", "namei", "getfacl", "filesystem"]
  },
  {
    id: "shell-text",
    stage: "Foundation",
    title: "Shell·환경변수·텍스트 처리",
    en: "Shell & Text Processing",
    level: "기초",
    minutes: 75,
    env: ["Local/VM"],
    why: "AA에게 shell은 단순한 명령 입력창이 아니라 재현 가능한 조사 도구입니다. quoting, redirection, pipe, exit status를 이해하지 못하면 로그를 잘못 필터링하거나 명령 실패를 놓칠 수 있습니다. 반대로 작은 shell pipeline을 정확히 만들면 수천 줄 로그에서 반복 패턴과 첫 오류를 빠르게 추출할 수 있습니다.",
    learningObjectives: ["shell이 parse와 expansion을 거쳐 process를 실행하는 흐름을 설명할 수 있다.", "single/double quote와 variable/glob expansion의 차이를 설명할 수 있다.", "stdin/stdout/stderr와 redirection, pipe, exit status를 구분할 수 있다.", "grep, awk, sort, uniq를 조합해 원본을 변경하지 않고 로그를 요약할 수 있다."],
    terms: [
      { term: "Shell", en: "Command shell", definition: "사용자의 입력을 해석하고 expansion, redirection, pipeline을 구성해 process를 실행하는 프로그램입니다.", why: "bash syntax를 이해하는 것은 운영 조사의 재현성과 안전성에 직접 연결됩니다." },
      { term: "Quoting", en: "Quoting", definition: "공백, wildcard, 변수 기호 같은 문자를 shell이 특별하게 해석할지 문자 그대로 다룰지 결정하는 규칙입니다.", why: "경로와 변수가 예상치 않게 분리되거나 확장되는 일을 막습니다." },
      { term: "stdin/stdout/stderr", en: "Standard streams", definition: "process의 기본 입력(0), 정상 출력(1), 오류 출력(2) 스트림입니다.", why: "로그 저장과 오류 분리를 정확히 하려면 세 스트림을 구분해야 합니다." },
      { term: "Pipe", en: "Pipeline", definition: "앞 command의 stdout을 다음 command의 stdin으로 연결합니다.", why: "원본을 수정하지 않고 filtering과 aggregation 단계를 조합할 수 있습니다." },
      { term: "Exit status", en: "Exit status", definition: "command가 종료할 때 반환하는 성공/실패 값이며 보통 0은 성공, non-zero는 실패입니다.", why: "출력이 없어도 command 실패를 자동화에서 판별할 수 있습니다." },
      { term: "PATH", en: "PATH", definition: "command 이름만 입력했을 때 shell이 executable을 찾는 directory 목록입니다.", why: "module이나 virtual environment 때문에 다른 binary가 선택되는 문제를 추적할 때 중요합니다." }
    ],
    sections: [
      { title: "Shell은 입력 문자열을 그대로 실행하지 않는다", paragraphs: ["bash는 입력을 token으로 나누고 variable expansion, command substitution, glob expansion 같은 단계를 거친 뒤 실제 executable과 argument를 만듭니다. 따라서 화면에 입력한 문자열과 process가 실제로 받은 argument가 달라질 수 있습니다.", "운영 script에서는 변수를 \"${var}\"처럼 quote하고 실행 전 값과 경로를 검증하는 습관이 중요합니다."], takeaway: "Shell 문제는 무슨 명령을 썼는가보다 shell이 어떤 argument로 확장했는가를 봐야 합니다." },
      { title: "Quote는 데이터의 경계를 지킨다", paragraphs: ["Single quote는 대부분의 shell expansion을 막고 내부 문자열을 거의 그대로 유지합니다. Double quote는 변수와 command substitution은 허용하지만 일반적인 word splitting과 glob expansion을 억제합니다.", "정규식 문법과 shell glob 문법은 서로 다른 계층이므로 어떤 프로그램이 어떤 문자를 해석하는지 구분해야 합니다."], takeaway: "Quote는 스타일이 아니라 shell이 데이터 경계를 보존하도록 만드는 기능입니다." },
      { title: "stdout, stderr, exit status는 서로 다른 증거다", paragraphs: ["프로그램은 정상 결과를 stdout에, 오류 메시지를 stderr에 쓰는 경우가 많습니다. >는 stdout을, 2>는 stderr를 redirect합니다. 2>&1은 stderr를 현재 stdout과 같은 대상으로 연결합니다.", "출력 내용만으로 성공 여부를 판단하지 말고 exit status도 확인해야 합니다. 자동화에서는 출력 문자열과 종료 상태를 함께 증거로 취급합니다."], takeaway: "로그가 보인다는 것과 command가 성공했다는 것은 같은 말이 아닙니다." },
      { title: "Pipeline은 작은 검증 단계를 연결한다", paragraphs: ["좋은 분석 pipeline은 한 번에 복잡한 one-liner를 만드는 것이 아니라 각 단계의 입력과 출력을 확인하면서 좁혀 갑니다. grep으로 후보를 고르고 awk로 field를 추출한 뒤 sort와 uniq -c로 빈도를 세는 식입니다.", "결과가 이상하면 pipeline 중간 단계를 독립적으로 실행해 잘못된 filter가 어디서 생겼는지 확인합니다. 원본 로그는 읽기 전용으로 두고 요약 결과를 별도 파일에 저장하는 습관이 안전합니다."], takeaway: "짧은 one-liner보다 단계별로 검증 가능한 pipeline이 운영에서 더 신뢰할 수 있습니다." }
    ],
    concepts: ["Shell은 입력을 parse·expand한 뒤 executable과 argument를 구성하므로 quoting이 중요합니다.", "stdin/stdout/stderr는 서로 다른 stream이며 redirection과 pipe로 흐름을 제어합니다.", "Exit status는 출력과 별개의 성공/실패 신호입니다.", "로그 분석 pipeline은 후보 추출 → field extraction → aggregation 순으로 작은 단계를 연결하는 방식이 안전합니다."],
    example: { title: "예시 · 20만 줄 job log에서 반복 실패 패턴 찾기", intro: "전체 파일을 눈으로 읽기보다 질문을 단계별로 좁힙니다.", steps: [{ label: "후보 추출", text: "grep -nEi 'error|fail|oom'으로 오류 가능성이 있는 줄만 뽑습니다." }, { label: "맥락 확인", text: "처음과 마지막 오류를 비교해 root cause와 후속 오류를 구분합니다." }, { label: "필드 추출", text: "node 또는 rank field를 awk로 추출합니다." }, { label: "빈도 집계", text: "sort | uniq -c | sort -nr로 반복되는 node/rank를 찾습니다." }, { label: "원본 재확인", text: "집계 결과가 가리키는 line을 원본에서 다시 읽어 해석이 맞는지 확인합니다." }], conclusion: "Pipeline은 결론을 자동으로 만드는 도구가 아니라 큰 로그를 사람이 검토 가능한 증거로 축약하는 도구입니다." },
    commands: [
      { cmd: "grep -nEi 'error|fail|oom' job.out | head -40", purpose: "오류 후보를 line number와 함께 추출", observe: "첫 오류가 후속 cascade error보다 앞서는지 확인합니다." },
      { cmd: "awk '{print $1}' file | sort | uniq -c | sort -nr | head", purpose: "첫 field의 빈도 집계", observe: "특정 rank/node/error code가 반복되는지 확인합니다." },
      { cmd: "type -a python; command -v python; printf '%s\\n' \"$PATH\"", purpose: "어떤 executable이 선택되는지 확인", observe: "alias/function/module/PATH에 의해 예상과 다른 binary가 먼저 선택되는지 봅니다." },
      { cmd: "false; printf 'exit=%s\\n' \"$?\"", purpose: "exit status 확인", observe: "출력이 없어도 non-zero status로 실패를 표현할 수 있음을 확인합니다." }
    ],
    lab: { title: "안전한 로그 요약 pipeline 만들기", steps: ["printf 'node1 OK\\nnode2 FAIL\\nnode2 FAIL\\nnode3 OOM\\n' > /tmp/hpc-log", "grep -nE 'FAIL|OOM' /tmp/hpc-log", "awk '{print $1}' /tmp/hpc-log | sort | uniq -c | sort -nr", "grep -E 'FAIL|OOM' /tmp/hpc-log > /tmp/hpc-log.summary", "cat /tmp/hpc-log.summary"], expect: "원본을 변경하지 않고 오류 위치와 node 빈도를 요약하고 각 pipeline 단계의 역할을 설명할 수 있다." },
    mistakes: ["변수를 quote하지 않아 공백·glob이 예상과 다르게 확장된다.", "grep 결과 한 줄만 보고 root cause를 확정한다.", "stderr를 저장하지 않아 실제 오류 메시지를 잃는다.", "복잡한 one-liner를 중간 검증 없이 사용한다."],
    troubleshoot: "Shell pipeline이 이상하면 한 단계씩 분리해 실제 argument, 입력 stream, 출력, exit status를 순서대로 확인합니다.",
    selfCheck: [
      { question: "double quote 안에서 변수 expansion은 일어나는가?", answer: "예. 변수와 command substitution은 일어나지만 일반적인 word splitting과 glob expansion은 억제됩니다." },
      { question: "2>와 >의 차이는 무엇인가?", answer: ">는 stdout을, 2>는 stderr를 redirect합니다." },
      { question: "exit status가 필요한 이유는?", answer: "출력 문자열과 별개로 command의 성공/실패를 기계적으로 판별할 수 있기 때문입니다." },
      { question: "pipeline을 단계별로 실행해야 하는 이유는?", answer: "어느 filter나 field extraction에서 정보가 잘못 사라졌는지 검증할 수 있기 때문입니다." }
    ],
    keywords: ["bash", "shell", "quoting", "pipe", "stderr", "exit status", "grep", "awk", "PATH"]
  },
  {
    id: "ssh-transfer",
    stage: "Foundation",
    title: "SSH·SCP·rsync와 안전한 원격 접근",
    en: "Remote Access & Transfer",
    level: "기초",
    minutes: 65,
    env: ["Local/VM", "Single node"],
    why: "SSH는 HPC workflow의 입구입니다. 접속 실패는 network, host key, authentication, account, shell initialization 등 서로 다른 단계에서 발생할 수 있고 데이터 전송은 login node와 shared filesystem에 예상치 못한 부하를 줄 수 있습니다. 접속 경로와 전송 도구의 특성을 구분하면 문제를 더 빠르고 안전하게 조사할 수 있습니다.",
    learningObjectives: ["SSH 연결이 network reachability, host identity, authentication, session setup 단계를 거친다는 점을 설명할 수 있다.", "private key와 public key의 역할을 구분할 수 있다.", "scp와 rsync의 차이와 rsync의 증분 전송 장점을 설명할 수 있다.", "대규모 데이터 전송에서 login node와 shared filesystem 정책을 먼저 확인해야 하는 이유를 설명할 수 있다."],
    terms: [
      { term: "SSH", en: "Secure Shell", definition: "원격 host에 암호화된 channel로 접속하고 command를 실행하는 protocol과 도구 집합입니다.", why: "HPC 사용자는 대부분 login node에 SSH로 진입합니다." },
      { term: "Host key", en: "SSH host key", definition: "서버가 자신의 identity를 증명하기 위해 사용하는 key입니다.", why: "중간자 공격과 잘못된 host 접속을 탐지하는 데 중요합니다." },
      { term: "Private key", en: "Private key", definition: "사용자가 소유하고 외부에 공개하면 안 되는 인증 비밀값입니다.", why: "유출되면 계정 보안 사고로 이어질 수 있습니다." },
      { term: "Public key", en: "Public key", definition: "server에 등록해 private key 소유자를 확인하는 데 사용하는 공개 가능한 key입니다.", why: "private key를 server에 복사하지 않고도 key-based authentication을 구성할 수 있습니다." },
      { term: "rsync", en: "rsync", definition: "source와 destination 차이를 비교해 필요한 데이터만 동기화할 수 있는 file transfer 도구입니다.", why: "중단 후 재개와 반복 동기화에 유리하지만 파일 수가 매우 많으면 metadata 비용을 고려해야 합니다." },
      { term: "DTN", en: "Data Transfer Node", definition: "대규모 데이터 이동을 위해 별도로 구성된 전송 전용 node입니다.", why: "login node의 공용 interactive workload와 대규모 transfer를 분리할 수 있습니다." }
    ],
    sections: [
      { title: "SSH 실패를 한 덩어리로 보지 않는다", paragraphs: ["SSH client가 원격 shell을 얻기까지는 여러 단계가 있습니다. 먼저 hostname을 주소로 해석하고 network route와 TCP 연결이 가능해야 합니다. 그 다음 server host key를 확인하고 사용자가 password 또는 public-key 방식으로 인증합니다. 인증 후 account policy와 shell/profile을 거쳐 session이 시작됩니다.", "ssh -vvv는 이 단계별 진행을 보여 줍니다. connection timed out과 Permission denied (publickey)는 전혀 다른 계층의 실패입니다."], takeaway: "접속 실패 메시지는 SSH handshake의 어느 단계에서 멈췄는지를 알려 주는 증거입니다." },
      { title: "Public key 인증의 핵심은 private key를 보내지 않는 것이다", paragraphs: ["Public-key authentication에서 사용자는 private key를 로컬에 보관하고 대응되는 public key만 server 계정에 등록합니다. 서버는 challenge를 통해 client가 private key를 실제로 소유하는지 확인합니다.", "SSH 구현은 private key가 다른 사용자에게 읽힐 수 있는 지나치게 열린 permission을 가진 경우 이를 거부할 수 있습니다. ~/.ssh와 private key의 소유권·권한을 확인하는 이유가 여기에 있습니다."], takeaway: "Private key는 공유 파일이 아니라 개인 인증 비밀입니다." },
      { title: "scp와 rsync는 목적이 다르다", paragraphs: ["scp는 SSH channel을 이용해 파일을 비교적 단순하게 복사하는 데 적합합니다. rsync는 source와 destination을 비교해 차이가 있는 부분을 동기화하고 반복 실행과 부분 전송에 유리합니다.", "하지만 rsync가 항상 빠른 것은 아닙니다. 수백만 small file을 비교하면 metadata scan 자체가 큰 비용이 될 수 있습니다."], takeaway: "전송 도구 선택은 byte 크기뿐 아니라 file count, 반복성, 중단 복구, destination filesystem 특성을 함께 봅니다." },
      { title: "대용량 전송은 cluster 운영 경로의 일부다", paragraphs: ["Login node는 많은 사용자가 공유하는 interactive gateway이므로 CPU·memory뿐 아니라 network connection과 filesystem access도 공용 자원입니다. 수 TB 데이터를 login node 경유로 장시간 전송하면 다른 사용자의 service에 영향을 줄 수 있습니다.", "많은 HPC 사이트는 data transfer node, Globus, 별도 transfer service 같은 권장 경로를 제공합니다. 기술적으로 가능한 명령보다 사이트 정책을 우선 확인해야 합니다."], takeaway: "대용량 데이터 이동은 개인 파일 복사가 아니라 공유 인프라 workload입니다." }
    ],
    concepts: ["SSH 연결은 network → host identity → authentication → session setup 단계로 나눠 진단할 수 있습니다.", "Public-key authentication에서 private key는 client에 남고 public key만 server에 등록합니다.", "rsync는 반복·증분 전송에 유리하지만 많은 small file에서는 metadata scan 비용이 커질 수 있습니다.", "대규모 transfer는 login node보다 site가 제공하는 DTN/전용 서비스를 우선해야 할 수 있습니다."],
    example: { title: "예시 · ssh가 Permission denied (publickey)를 반환", intro: "오류가 발생한 handshake 단계에 우선순위를 둡니다.", steps: [{ label: "Reachability", text: "timeout이 아니라 authentication 단계까지 도달했는지 ssh -vvv에서 확인합니다." }, { label: "Identity", text: "접속 user 이름과 target host가 맞는지 확인합니다." }, { label: "Key selection", text: "client가 어떤 private key를 offering하는지 debug log를 확인합니다." }, { label: "Local permission", text: "~/.ssh와 private key 소유권·mode를 확인합니다." }, { label: "Server policy", text: "계정 잠금, authorized_keys, MFA/SSO 정책 등 사이트 측 조건을 확인합니다." }], conclusion: "같은 SSH 실패라도 timeout, host key mismatch, authentication failure는 조사 지점이 서로 다릅니다." },
    commands: [
      { cmd: "ssh -vvv user@host", purpose: "SSH handshake 단계별 디버깅", observe: "DNS/TCP 연결 이후 어떤 host key와 authentication method, key file을 시도하는지 봅니다.", caution: "debug log 공유 전에 username, host, key path 같은 환경 정보를 검토합니다." },
      { cmd: "ls -ld ~/.ssh; ls -l ~/.ssh", purpose: "SSH key directory와 file permission 확인", observe: "directory와 private key가 다른 사용자에게 불필요하게 노출되어 있지 않은지 확인합니다." },
      { cmd: "rsync -avh --info=progress2 SRC/ user@host:DST/", purpose: "증분 전송 예시", observe: "전송량, 진행률, 반복 실행 시 변경 파일 범위를 확인합니다.", caution: "공유 운영망과 filesystem에서 대규모 전송을 시작하기 전에 사이트 정책을 확인합니다." }
    ],
    lab: { title: "SSH key 파일의 권한 모델 점검", steps: ["ls -ld ~/.ssh", "ls -l ~/.ssh", "private key와 public key 파일을 구분한다.", "private key가 group/others readable인지 확인하고 필요하면 chmod 600 PRIVATE_KEY를 적용한다.", "public key가 왜 private key와 같은 비밀정보가 아닌지 설명을 적는다."], expect: "public/private key의 역할과 SSH가 local key permission을 중요하게 다루는 이유를 설명할 수 있다." },
    mistakes: ["private key 파일을 다른 사람이나 원격 서버에 전달한다.", "모든 SSH 실패를 network 문제로 취급한다.", "login node를 장시간 대용량 transfer hub로 사용한다.", "수백만 small file을 rsync하면서 metadata 비용을 고려하지 않는다."],
    troubleshoot: "SSH는 DNS/network → host key → authentication → account/session 순서로, transfer는 source → network → destination filesystem 순서로 경계를 나눠 조사합니다.",
    selfCheck: [
      { question: "Public-key authentication에서 server에 등록하는 것은 무엇인가?", answer: "Public key입니다. Private key는 사용자가 안전하게 보관해야 합니다." },
      { question: "ssh timeout과 Permission denied (publickey)는 어떤 차이를 시사하는가?", answer: "timeout은 주로 network reachability 문제를, publickey 오류는 authentication 단계까지 도달했지만 key 인증이 실패했음을 시사합니다." },
      { question: "rsync가 반복 전송에 유리한 이유는?", answer: "source와 destination의 차이를 비교해 필요한 데이터만 동기화할 수 있기 때문입니다." },
      { question: "대용량 전송에서 DTN을 사용하는 이유는?", answer: "login node와 분리된 전송 전용 경로를 사용해 공용 interactive service 부하를 줄이고 사이트가 최적화한 경로를 활용할 수 있기 때문입니다." }
    ],
    keywords: ["SSH", "public key", "private key", "host key", "rsync", "scp", "DTN", "transfer"]
  }
];
