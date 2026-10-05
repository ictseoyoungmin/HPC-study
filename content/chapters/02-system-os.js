export const chapters = [
  {
    id: "process-signals",
    stage: "System / OS",
    title: "Process·Thread·Signal·FD·ulimit",
    en: "Processes, Signals & Limits",
    level: "중급",
    minutes: 75,
    env: ["Local/VM"],
    why: "HPC 애플리케이션은 결국 Linux process와 thread로 실행된다. hang, D state, zombie, signal 종료, too many open files 같은 증상을 해석하려면 먼저 Linux가 실행 단위를 어떻게 표현하고 어떤 자원 한계를 적용하는지 알아야 한다.",
    learningObjectives: [
      "process, thread, PID/PPID, process group의 관계를 설명할 수 있다.",
      "R/S/D/Z 상태와 SIGTERM·SIGKILL의 차이를 장애 분석 관점에서 해석할 수 있다.",
      "file descriptor와 ulimit이 대규모 MPI·I/O workload에 어떤 한계를 만들 수 있는지 확인할 수 있다."
    ],
    terms: [
      { term: "Process", en: "process", definition: "실행 중인 프로그램의 인스턴스로, 독립된 virtual address space와 PID를 가진다.", why: "job 안에서 어떤 실행 단위가 CPU·memory·file descriptor를 사용하고 있는지 추적하는 기본 단위다." },
      { term: "Thread", en: "thread", definition: "하나의 process 안에서 주소 공간과 여러 자원을 공유하며 스케줄되는 실행 흐름이다.", why: "OpenMP와 많은 수치 라이브러리는 하나의 process 안에서 여러 thread를 사용하므로 process 수와 thread 수를 구분해야 한다." },
      { term: "Process state", en: "R / S / D / Z", definition: "Linux가 task의 현재 상태를 요약한 문자다. R은 실행 가능, S는 interruptible sleep, D는 uninterruptible sleep, Z는 종료되었지만 수거되지 않은 상태를 뜻한다.", why: "CPU가 0%라는 사실만으로 idle이라고 판단하지 않고 I/O 대기나 zombie 여부를 분리할 수 있다." },
      { term: "Signal", en: "signal", definition: "kernel이나 다른 process가 process에 전달하는 비동기 이벤트다.", why: "SIGTERM과 SIGKILL은 종료 방식과 증거 보존 가능성이 다르므로 운영 조치의 강도를 결정하는 기준이 된다." },
      { term: "File descriptor", en: "FD", definition: "process가 열린 파일, socket, pipe 같은 kernel object를 가리킬 때 사용하는 정수 handle이다.", why: "rank 수나 연결 수가 커지면 FD limit에 먼저 도달해 애플리케이션 오류처럼 보이는 실패가 생길 수 있다." },
      { term: "ulimit", en: "resource limit", definition: "shell/process에 적용되는 여러 자원 상한을 확인하거나 설정하는 인터페이스다.", why: "open files, processes, stack size 같은 제한이 workload 규모와 맞는지 확인해야 한다." }
    ],
    sections: [
      {
        title: "Process와 thread는 무엇을 공유하고 무엇을 나누는가",
        paragraphs: [
          "process는 실행 파일 자체가 아니라 그 프로그램이 실제로 실행되고 있는 한 인스턴스다. 일반적으로 process마다 virtual address space와 PID가 있고, parent process와의 관계는 PPID로 표현된다. 여러 process가 같은 프로그램을 실행하더라도 memory는 기본적으로 서로 분리되어 있다.",
          "thread는 같은 process 안에 속하기 때문에 code, heap, 열린 file descriptor 같은 자원을 공유하지만 각 thread는 독립적인 실행 문맥과 stack을 가진다. 따라서 OpenMP처럼 thread 기반 병렬화에서는 한 process 안의 공유 메모리 문제를 보고, MPI처럼 여러 process를 사용하는 경우에는 process 간 통신과 각 process의 자원 사용을 따로 봐야 한다."
        ],
        takeaway: "process 수와 thread 수는 다른 축이다. job의 병렬 구조를 볼 때 rank·process·thread를 먼저 구분한다."
      },
      {
        title: "상태 문자와 signal은 증상의 의미를 바꾼다",
        paragraphs: [
          "ps의 STAT에서 R은 실행 중이거나 run queue에서 CPU를 기다리는 상태다. S는 일반적인 sleep이고, D는 보통 block I/O나 일부 kernel 경로를 기다리는 uninterruptible sleep이다. D state가 오래 지속되면 CPU 성능보다 storage, network filesystem, device path를 먼저 의심해야 한다.",
          "SIGTERM은 애플리케이션이 handler를 두었다면 cleanup과 로그 기록 기회를 가질 수 있지만, SIGKILL은 process가 처리할 수 없는 강제 종료다. 따라서 kill -9는 장애 원인을 확인하기 전에 남아 있던 증거와 cleanup 기회를 없앨 수 있어 마지막 수단에 가깝다."
        ],
        takeaway: "process가 멈췄다는 표현 대신 상태와 signal 이력을 확인하면 문제 계층을 빠르게 좁힐 수 있다."
      },
      {
        title: "FD와 resource limit은 보이지 않는 규모 한계가 된다",
        paragraphs: [
          "process가 파일 하나를 열거나 socket 하나를 만들 때마다 FD를 소비할 수 있다. 작은 테스트에서는 문제가 없던 프로그램도 rank 수, node 수, checkpoint file 수가 증가하면 open files limit에 도달할 수 있다. 이 경우 오류는 MPI, filesystem, application 어느 쪽 메시지로도 나타날 수 있다.",
          "ulimit -a는 현재 shell에서 상속될 여러 resource limit의 출발점이다. 다만 scheduler나 cgroup이 별도의 제한을 적용할 수도 있으므로 shell의 값만 보고 실제 job limit이라고 단정하지 않는다."
        ],
        takeaway: "규모가 커질 때만 실패한다면 계산 알고리즘뿐 아니라 per-process resource limit도 함께 확인한다."
      }
    ],
    concepts: [
      "PID는 process를, thread는 같은 process 안의 실행 흐름을 구분한다.",
      "R/S/D/Z 상태는 CPU 사용률만으로는 보이지 않는 대기와 종료 상태를 설명한다.",
      "SIGTERM은 정상 종료 기회를 줄 수 있지만 SIGKILL은 즉시 종료하므로 원인 조사 전에 남용하지 않는다.",
      "FD와 ulimit은 workload가 커질수록 드러나는 운영 한계가 될 수 있다."
    ],
    example: {
      title: "예제 · CPU 0%인데 job이 끝나지 않는다",
      intro: "사용자는 '프로세스가 멈췄다'고 보고했다. 바로 kill -9를 하기보다 상태를 증거로 좁힌다.",
      steps: [
        { label: "상태 확인", text: "ps로 PID와 STAT를 확인한다. D가 오래 유지되면 단순 CPU starvation과 구분한다." },
        { label: "대기 경로 가설", text: "D state라면 filesystem·block device·network filesystem 이벤트와 같은 시간대를 비교한다." },
        { label: "종료 방식 결정", text: "먼저 정상 종료가 가능한지 SIGTERM을 고려하고, 증거 수집 후에만 더 강한 조치를 선택한다." }
      ],
      conclusion: "AA의 목적은 '멈췄다'를 process state와 대기 계층으로 번역하는 것이다."
    },
    commands: [
      { cmd: "ps -eo pid,ppid,stat,nlwp,psr,pcpu,pmem,cmd --sort=-pcpu | head -30", purpose: "process·thread 수와 상태, CPU placement 확인", observe: "STAT의 R/S/D/Z, NLWP의 thread 수, PSR의 최근 CPU를 함께 본다." },
      { cmd: "ls /proc/$PID/fd 2>/dev/null | wc -l; grep -E 'Max open files|Max processes|Max stack size' /proc/$PID/limits", purpose: "실제 process의 FD 수와 resource limit 확인", observe: "현재 사용량이 limit에 가까운지, shell ulimit과 process limit이 같은지 비교한다." },
      { cmd: "ps -L -p $PID -o pid,tid,psr,stat,pcpu,comm", purpose: "하나의 process 내부 thread 상태 확인", observe: "특정 thread만 CPU를 독점하거나 D state인지 확인한다." }
    ],
    lab: {
      title: "signal과 exit status 관찰",
      steps: ["sleep 300 & PID=$!; echo $PID", "ps -o pid,ppid,stat,cmd -p $PID", "kill -TERM $PID", "wait $PID; echo $?"] ,
      expect: "process 상태가 사라지는 과정과 signal 종료 시 shell이 보고하는 exit status의 의미를 설명할 수 있다."
    },
    mistakes: ["kill -9를 첫 조치로 사용", "thread를 별도 process와 동일시", "CPU 사용률이 낮으면 아무 일도 하지 않는다고 판단", "shell의 ulimit만 보고 scheduler/cgroup 제한을 무시"],
    troubleshoot: "hang은 먼저 PID/PPID와 STAT, thread 상태를 확인하고 D state면 storage·network filesystem·device 대기를 의심한다. 규모가 커질 때만 실패하면 FD와 process limit을 함께 본다.",
    selfCheck: [
      { question: "process와 thread의 가장 중요한 차이는 무엇인가?", answer: "process는 기본적으로 독립된 virtual address space를 가지지만 같은 process의 thread는 주소 공간과 많은 자원을 공유한다." },
      { question: "D state가 오래 지속되면 왜 CPU 문제만 보면 안 되는가?", answer: "D는 uninterruptible sleep으로 I/O나 kernel 대기를 나타낼 수 있어 storage·filesystem·device 경로를 함께 봐야 하기 때문이다." },
      { question: "kill -9를 원인 조사 전에 남용하면 왜 불리한가?", answer: "애플리케이션이 cleanup이나 추가 로그를 남길 기회를 없애고 종료 원인을 구분할 증거를 줄일 수 있기 때문이다." }
    ],
    keywords: ["process", "thread", "signal", "fd", "ulimit", "proc"]
  },
  {
    id: "os-control",
    stage: "System / OS",
    title: "Linux Scheduler·cgroups·namespaces·systemd",
    en: "OS Control Plane",
    level: "중급",
    minutes: 80,
    env: ["Local/VM", "Admin"],
    why: "Slurm이 CPU와 memory를 '할당'해도 실제 process가 어느 CPU에서 실행되고 얼마만큼의 자원을 쓸 수 있는지는 Linux kernel이 집행한다. scheduler allocation과 kernel control을 구분해야 '요청한 자원과 실제 보이는 자원이 다르다'는 문제를 설명할 수 있다.",
    learningObjectives: [
      "Linux CPU scheduling과 CPU affinity가 서로 다른 개념임을 설명할 수 있다.",
      "cgroup이 CPU·memory·device 제한과 accounting에 어떻게 사용되는지 확인할 수 있다.",
      "namespace와 systemd가 container·service 운영에서 맡는 역할을 구분할 수 있다."
    ],
    terms: [
      { term: "CPU scheduler", en: "kernel scheduler", definition: "실행 가능한 task 중 어떤 task를 어느 CPU에서 언제 실행할지 결정하는 kernel 기능이다.", why: "CPU가 할당되어 있어도 run queue 경쟁이나 scheduling 정책에 따라 실제 실행 시간은 달라질 수 있다." },
      { term: "Affinity", en: "CPU affinity", definition: "process/thread가 실행될 수 있는 CPU 집합을 제한하는 정책이다.", why: "scheduler가 CPU를 선택하는 범위를 줄여 locality와 재현성을 높일 수 있지만 잘못된 mask는 자원을 묶어버릴 수 있다." },
      { term: "cgroup", en: "control group", definition: "process 집합에 자원 제한, 우선순위, accounting을 적용하는 Linux kernel 메커니즘이다.", why: "Slurm job의 CPU·memory 경계가 실제로 kernel에 어떻게 집행되는지 확인하는 핵심 단서다." },
      { term: "Namespace", en: "namespace", definition: "PID, mount, network 등 특정 kernel resource view를 process 집합마다 다르게 보이게 하는 격리 기능이다.", why: "container 안에서 보이는 PID나 mount가 host와 다른 이유를 이해하는 기반이다." },
      { term: "systemd", en: "service manager", definition: "Linux의 service와 unit lifecycle, dependency, logging 연계를 관리하는 대표적인 init/service manager다.", why: "slurmd, sshd, filesystem service 같은 daemon 장애를 job 증상과 연결할 때 필요하다." }
    ],
    sections: [
      {
        title: "할당과 스케줄링은 같은 말이 아니다",
        paragraphs: [
          "Slurm은 cluster 자원을 어떤 job에 배정할지 결정하는 cluster scheduler다. 반면 Linux kernel scheduler는 한 node 안에서 실제 runnable task를 CPU에 올린다. 사용자가 8 CPUs를 할당받았다고 해서 그 8개가 항상 동시에 100% 실행된다는 뜻은 아니다.",
          "CPU affinity는 kernel scheduler가 선택할 수 있는 CPU의 범위를 제한한다. 따라서 성능을 재현하려면 Slurm allocation, cpuset/cgroup, process affinity를 한 체인으로 봐야 한다."
        ],
        takeaway: "cluster scheduler의 요청·할당과 kernel scheduler의 실제 실행을 분리해서 본다."
      },
      {
        title: "cgroup은 job의 실제 경계를 집행한다",
        paragraphs: [
          "cgroup은 CPU와 memory 같은 자원을 process 집합 단위로 제한하고 사용량을 집계한다. HPC 환경에서는 scheduler가 job step마다 cgroup을 만들고 cpuset이나 memory limit을 적용하는 구성이 흔하다.",
          "그래서 nproc, /proc/self/status, /sys/fs/cgroup의 값이 node 전체 하드웨어와 다를 수 있다. 사용자가 'node에 128 cores가 있는데 8개만 보인다'고 말할 때 이것이 정상적인 job 격리 결과일 수도 있다."
        ],
        takeaway: "보이는 자원 수가 적다는 사실만으로 node 장애라 판단하지 말고 cgroup과 affinity를 먼저 확인한다."
      },
      {
        title: "namespace와 systemd는 격리와 서비스 상태를 설명한다",
        paragraphs: [
          "namespace는 process가 보는 PID, mount, network 등의 관점을 분리한다. container는 이 기능을 다른 메커니즘과 조합해 host와 다른 실행 환경을 만든다. 따라서 container 안에서 보이는 PID 1이나 mount 목록이 host와 다를 수 있다.",
          "systemd는 node daemon과 service 상태를 관리한다. job 실패가 애플리케이션 원인처럼 보여도 slurmd, mount, network service의 재시작이나 실패와 같은 시간대라면 운영 계층 문제일 수 있으므로 journal의 시간축을 job과 맞춰야 한다."
        ],
        takeaway: "격리된 view와 host의 실제 상태를 구분하고, service event를 job 시간축과 맞춘다."
      }
    ],
    concepts: [
      "Slurm의 cluster 자원 할당과 Linux kernel의 CPU scheduling은 다른 계층이다.",
      "Affinity는 실행 가능한 CPU 집합을 제한하고 cgroup은 자원 제한·격리·accounting을 제공한다.",
      "namespace는 process가 보는 kernel resource view를 분리한다.",
      "systemd와 journal은 node service 장애를 job 증상과 연결하는 운영 증거다."
    ],
    example: {
      title: "예제 · 64-core node인데 nproc은 8",
      intro: "하드웨어 결함을 의심하기 전에 job이 어떤 cpuset 안에서 실행되는지 확인한다.",
      steps: [
        { label: "하드웨어 기준", text: "lscpu로 node 전체 topology를 확인한다." },
        { label: "허용 범위", text: "Cpus_allowed_list와 현재 cgroup을 확인해 process가 실제로 사용할 수 있는 CPU를 본다." },
        { label: "scheduler와 대조", text: "Slurm의 cpus-per-task, ntasks, binding 결과와 kernel 제한이 일치하는지 비교한다." }
      ],
      conclusion: "할당 정보와 kernel이 집행한 제한을 함께 봐야 resource mismatch를 설명할 수 있다."
    },
    commands: [
      { cmd: "grep -E 'Cpus_allowed_list|Mems_allowed_list' /proc/self/status; cat /proc/self/cgroup", purpose: "현재 process의 CPU·memory 허용 범위와 cgroup 확인", observe: "node 전체가 아니라 process가 실제 접근 가능한 CPU와 NUMA node를 본다." },
      { cmd: "systemctl --failed --no-pager; systemctl status slurmd --no-pager 2>/dev/null | head -40", purpose: "실패 service와 대표 HPC daemon 상태 확인", observe: "inactive/failed 시각과 job 실패 시각을 맞춘다.", caution: "service 이름과 조회 권한은 사이트마다 다를 수 있다." },
      { cmd: "journalctl -b -p warning..alert --no-pager | tail -80", purpose: "현재 boot의 warning 이상 system event 확인", observe: "memory, filesystem, device, service 메시지의 timestamp를 job event와 대조한다.", caution: "일부 journal은 관리자 권한이 필요하다." }
    ],
    lab: {
      title: "내 process의 실제 CPU 경계 확인",
      steps: ["nproc; nproc --all", "grep -E 'Cpus_allowed_list|Mems_allowed_list' /proc/self/status", "cat /proc/self/cgroup", "taskset -pc $$"],
      expect: "전체 CPU 수, 현재 process가 허용받은 CPU 수, affinity mask가 서로 다를 수 있는 이유를 설명한다."
    },
    mistakes: ["Slurm 요청값만 보고 kernel 제한을 확인하지 않음", "nproc 값을 node 전체 physical core 수로 해석", "container 내부 PID·mount를 host와 동일하다고 가정", "원인 없이 sysctl이나 service 설정을 변경"],
    troubleshoot: "resource mismatch는 scheduler request/allocation → cgroup/cpuset → process affinity 순서로 비교하고, service 이상은 journal timestamp를 job 시각과 맞춘다.",
    selfCheck: [
      { question: "Slurm이 CPU 8개를 할당한 것과 Linux scheduler가 task를 실행하는 것은 왜 다른가?", answer: "Slurm은 cluster 자원을 job에 배정하고 Linux kernel scheduler는 그 node 안에서 runnable task의 실제 CPU 실행을 결정하기 때문이다." },
      { question: "cgroup과 affinity는 어떤 점이 다른가?", answer: "cgroup은 process 집합에 자원 제한과 accounting을 적용하는 메커니즘이고 affinity는 process/thread가 실행될 수 있는 CPU 집합을 제한하는 정책이다." },
      { question: "container 안에서 PID 1이 보인다고 host의 PID 1과 같다고 볼 수 없는 이유는?", answer: "PID namespace가 process에게 별도의 PID view를 제공할 수 있기 때문이다." }
    ],
    keywords: ["scheduler", "affinity", "cgroup", "namespace", "systemd", "journalctl"]
  },
  {
    id: "virtual-memory",
    stage: "System / OS",
    title: "Virtual Memory·Page Fault·Swap·OOM·THP",
    en: "Virtual Memory",
    level: "중급",
    minutes: 90,
    env: ["Local/VM", "Single node"],
    why: "프로세스가 보는 주소 공간과 실제 DRAM 사용량은 같은 것이 아니다. RSS 증가, page fault, swap, OOM을 제대로 해석하려면 virtual page가 physical frame에 매핑되고 memory pressure에서 kernel이 reclaim을 수행하는 과정을 이해해야 한다.",
    learningObjectives: [
      "virtual address, physical frame, page table, RSS, VmSize의 관계를 설명할 수 있다.",
      "minor fault와 major fault를 storage I/O 관점에서 구분할 수 있다.",
      "memory pressure에서 page cache reclaim, swap, cgroup/system OOM을 하나의 흐름으로 해석할 수 있다."
    ],
    terms: [
      { term: "Virtual address", en: "virtual address", definition: "process가 자신의 주소 공간에서 사용하는 논리 주소다.", why: "process가 큰 주소 공간을 가진다고 해서 그만큼의 DRAM을 실제로 점유하는 것은 아니기 때문이다." },
      { term: "Page", en: "memory page", definition: "virtual memory를 관리하는 기본 고정 크기 단위이며 physical memory에서는 frame에 매핑된다.", why: "page fault, NUMA placement, THP, swap 모두 page 단위 동작과 연결된다." },
      { term: "Page table", en: "page table", definition: "virtual page를 physical frame과 access permission에 연결하는 translation 구조다.", why: "주소 translation과 fault가 왜 발생하는지 이해하는 핵심 구조다." },
      { term: "RSS", en: "resident set size", definition: "process가 현재 physical memory에 resident하게 보유한 memory 양을 나타내는 대표 지표다.", why: "VmSize와 구분해야 실제 DRAM pressure에 가까운 관찰을 할 수 있다." },
      { term: "Page fault", en: "minor / major fault", definition: "process가 접근한 virtual page에 필요한 mapping이나 resident data가 준비되지 않아 kernel이 개입하는 사건이다.", why: "fault의 종류에 따라 단순 mapping 비용인지 storage I/O 비용인지가 크게 달라진다." },
      { term: "OOM", en: "out of memory", definition: "memory allocation 요구를 만족할 수 없을 때 system 또는 cgroup 범위에서 강제 종료가 발생할 수 있는 상태다.", why: "job memory request와 실제 사용량, kernel/cgroup log를 연결해야 원인을 설명할 수 있다." }
    ],
    sections: [
      {
        title: "Virtual memory는 실제 DRAM의 사진이 아니다",
        paragraphs: [
          "각 process는 자신만의 virtual address space를 본다. 이 주소 공간은 연속적으로 보일 수 있지만 실제 physical frame은 DRAM의 여러 위치에 흩어져 있을 수 있으며 page table이 둘을 연결한다.",
          "VmSize는 예약되거나 매핑된 virtual address space를 포함하는 지표이고 RSS는 resident physical memory와 더 직접적으로 연결된다. 따라서 VmSize가 크다는 사실만으로 memory leak이나 OOM 위험을 판단하면 안 된다."
        ],
        takeaway: "Virtual address space와 resident physical memory를 분리해서 읽는다."
      },
      {
        title: "Minor와 major page fault의 비용은 다르다",
        paragraphs: [
          "page fault는 '오류'라기보다 kernel이 memory mapping을 준비해야 하는 사건이다. 필요한 data가 이미 memory에 있고 mapping만 준비하면 되는 경우는 일반적으로 minor fault로 처리될 수 있다.",
          "필요한 page를 backing storage에서 읽어와야 하면 major fault가 된다. 이때 storage latency가 개입하므로 반복적인 major fault는 application latency, I/O wait, storage activity와 함께 나타날 수 있다."
        ],
        takeaway: "fault 수만 보지 말고 major/minor 여부와 storage I/O가 실제로 개입했는지를 구분한다."
      },
      {
        title: "Memory pressure는 reclaim에서 OOM까지 이어지는 과정이다",
        paragraphs: [
          "available memory가 줄어들면 kernel은 회수 가능한 page cache를 reclaim하거나 설정에 따라 anonymous page를 swap으로 내보낼 수 있다. 그래서 free가 작아도 available이 충분하고 reclaim이 정상적으로 작동하면 즉시 장애는 아니다.",
          "reclaim과 swap으로도 allocation을 만족하지 못하거나 cgroup limit을 넘으면 OOM이 발생할 수 있다. HPC에서는 node 전체 OOM과 job cgroup OOM을 구분하고, scheduler의 memory request와 accounting MaxRSS, kernel/cgroup log를 같은 시간축에서 비교해야 한다."
        ],
        takeaway: "OOM은 단일 숫자가 아니라 limit, pressure, reclaim, 실제 사용량, log를 함께 읽는 사건이다."
      }
    ],
    concepts: [
      "VmSize와 RSS는 서로 다른 memory 관점을 나타낸다.",
      "Minor fault는 storage I/O 없이 해결될 수 있지만 major fault는 backing storage 접근이 필요할 수 있다.",
      "free보다 available, reclaim, swap in/out, fault, I/O를 함께 본다.",
      "OOM은 system 전체 또는 job/cgroup 범위에서 발생할 수 있다."
    ],
    example: {
      title: "예제 · memory가 남아 보이는데 job이 OOM 종료됨",
      intro: "free -h 한 줄만으로는 cgroup memory limit과 실제 peak usage를 설명할 수 없다.",
      steps: [
        { label: "범위 확인", text: "system OOM인지 job cgroup OOM인지 kernel·scheduler log를 확인한다." },
        { label: "요청과 사용량", text: "job memory request와 MaxRSS, process RSS를 같은 단위로 비교한다." },
        { label: "pressure 흔적", text: "vmstat의 si/so, wa와 major fault, storage activity가 함께 증가했는지 확인한다." }
      ],
      conclusion: "node의 free memory와 job의 cgroup limit은 서로 다른 경계일 수 있다."
    },
    commands: [
      { cmd: "free -h; vmstat 1 5", purpose: "system memory와 pressure 흐름 확인", observe: "available, si/so, r/b, wa를 함께 보고 한 번의 snapshot보다 추세를 본다." },
      { cmd: "grep -E 'VmRSS|VmSize|VmSwap|Threads' /proc/$PID/status", purpose: "process memory 관점 분리", observe: "VmSize, RSS, swap을 서로 다른 값으로 읽는다." },
      { cmd: "ps -o pid,rss,vsz,maj_flt,min_flt,cmd -p $PID", purpose: "RSS와 page fault 누적 관찰", observe: "major fault 증가를 I/O activity와 함께 비교한다." },
      { cmd: "dmesg -T | grep -iE 'oom|out of memory|killed process' | tail -30", purpose: "system OOM 흔적 확인", observe: "희생 process, memory 상태, cgroup 관련 단서를 본다.", caution: "dmesg 접근은 사이트 정책에 따라 제한될 수 있다." }
    ],
    lab: {
      title: "VmSize와 RSS가 다르게 움직이는 이유 관찰",
      steps: ["python3 - <<'PY'\nimport mmap,time,os\nm=mmap.mmap(-1,256*1024*1024)\nprint(os.getpid()); time.sleep(20)\nPY", "# 다른 shell에서 PID의 VmSize/VmRSS를 확인한다.", "grep -E 'VmSize|VmRSS' /proc/PID/status"],
      expect: "virtual mapping이 생겼다고 동일한 크기의 physical memory가 즉시 resident하는 것은 아님을 설명한다."
    },
    mistakes: ["free가 작으면 곧바로 memory 부족이라고 판단", "VmSize를 실제 DRAM 사용량으로 해석", "swap 사용량이 0이 아니면 즉시 장애로 판단", "OOM을 system 전체 memory 부족으로만 해석"],
    troubleshoot: "OOM은 scheduler memory request → cgroup/system limit → MaxRSS/RSS → reclaim·swap → kernel/cgroup log 순으로 맞춰보고, major fault가 많으면 storage I/O와 workload 접근 패턴을 함께 확인한다.",
    selfCheck: [
      { question: "VmSize와 RSS가 다른 이유는 무엇인가?", answer: "VmSize는 virtual address space의 크기와 관련되고 RSS는 그중 현재 physical memory에 resident한 양과 더 직접적으로 관련되기 때문이다." },
      { question: "minor fault와 major fault를 가장 실용적으로 구분하는 기준은?", answer: "필요한 page를 해결하는 과정에 backing storage I/O가 필요한지 여부가 핵심 차이다." },
      { question: "node에 available memory가 있어도 job이 OOM될 수 있는 이유는?", answer: "job cgroup에 더 작은 memory limit이 적용되어 그 범위에서 OOM이 발생할 수 있기 때문이다." }
    ],
    keywords: ["virtual memory", "page table", "RSS", "page fault", "swap", "OOM", "THP"]
  },
  {
    id: "cpu-topology",
    stage: "System / OS",
    title: "CPU Topology·SMT·Socket·Core",
    en: "CPU Topology",
    level: "기초",
    minutes: 75,
    env: ["Local/VM", "Single node"],
    why: "운영체제의 CPU 번호, physical core, socket, NUMA node는 서로 다른 계층이다. 이 관계를 모르면 Slurm CPU 요청, OpenMP thread 수, affinity를 실제 hardware 구조와 연결할 수 없고 성능 측정도 재현하기 어렵다.",
    learningObjectives: [
      "Socket→Core→hardware thread(logical CPU)의 포함 관계를 설명할 수 있다.",
      "SMT가 physical core 수 증가가 아니라는 점을 성능 관점에서 설명할 수 있다.",
      "lscpu와 affinity 정보를 이용해 thread placement를 topology에 매핑할 수 있다."
    ],
    terms: [
      { term: "Socket", en: "CPU socket", definition: "하나의 CPU package가 장착되는 물리·논리 단위로 여러 core와 cache, memory controller를 포함할 수 있다.", why: "socket 경계는 shared cache와 NUMA memory path가 달라지는 지점이 될 수 있다." },
      { term: "Core", en: "physical core", definition: "명령어를 실제로 실행하는 물리 계산 자원으로, 하나 이상의 hardware thread를 제공할 수 있다.", why: "logical CPU 수와 physical core 수를 구분해야 thread 수를 합리적으로 정할 수 있다." },
      { term: "Logical CPU", en: "hardware thread", definition: "Linux scheduler가 task를 배치할 수 있는 실행 문맥으로 CPU 번호로 노출된다.", why: "lscpu의 CPU(s)와 nproc이 세는 대상이 physical core와 다를 수 있다." },
      { term: "SMT", en: "simultaneous multithreading", definition: "한 physical core가 둘 이상의 hardware thread를 노출해 일부 execution resource를 공유하도록 하는 기술이다.", why: "SMT를 켠 logical CPU 두 개는 독립된 physical core 두 개와 같은 자원량을 제공하지 않는다." },
      { term: "Affinity", en: "CPU binding", definition: "thread/process가 실행될 CPU 집합을 고정하거나 제한하는 정책이다.", why: "cache locality, NUMA locality, benchmark 재현성에 직접 영향을 줄 수 있다." }
    ],
    sections: [
      {
        title: "CPU 번호는 물리 core 번호가 아니다",
        paragraphs: [
          "Linux는 scheduler가 사용할 수 있는 execution context를 logical CPU 번호로 노출한다. SMT가 켜져 있으면 하나의 physical core가 둘 이상의 CPU 번호를 가질 수 있으므로 CPU(s)=128이라는 출력만 보고 128 physical cores라고 해석하면 안 된다.",
          "lscpu -e의 CPU, CORE, SOCKET, NODE 열을 함께 보면 하나의 logical CPU가 어느 physical core, socket, NUMA node에 속하는지 연결할 수 있다. HPC에서 CPU topology를 읽는 첫 단계는 이 포함 관계를 익히는 것이다."
        ],
        takeaway: "logical CPU는 스케줄 단위이고 physical core는 하드웨어 계산 자원이다."
      },
      {
        title: "SMT는 idle execution resource를 활용하지만 자원을 복제하지 않는다",
        paragraphs: [
          "SMT sibling은 같은 core 안에서 여러 실행 자원을 공유한다. 한 thread가 pipeline의 일부를 충분히 활용하지 못할 때 다른 thread가 빈 slot을 활용해 throughput을 높일 수 있지만, 둘이 cache나 execution unit, memory bandwidth를 강하게 경쟁하면 이득이 작거나 성능이 떨어질 수 있다.",
          "따라서 SMT on/off 효과는 workload 의존적이다. benchmark에는 physical core 수, logical CPU 수, SMT 상태를 함께 기록해야 다른 node나 실행과 비교할 수 있다."
        ],
        takeaway: "SMT=2라고 해서 자동으로 2배 계산 자원이 생기는 것은 아니다."
      },
      {
        title: "Binding은 thread 수만큼 중요하다",
        paragraphs: [
          "같은 16 threads라도 한 socket에 몰아넣는지 두 socket에 분산하는지에 따라 shared cache와 memory bandwidth 사용이 달라진다. 특히 multi-socket node에서는 CPU placement가 NUMA memory placement와 함께 성능에 영향을 준다.",
          "OpenMP의 OMP_PROC_BIND/OMP_PLACES, taskset, Slurm --cpu-bind 같은 설정은 thread가 어디서 실행되는지를 통제한다. 성능 문제를 재현하려면 thread count뿐 아니라 실제 binding 결과를 기록해야 한다."
        ],
        takeaway: "thread count와 placement를 함께 기록해야 topology 변화와 성능 변화를 연결할 수 있다."
      }
    ],
    concepts: [
      "Socket→Core→hardware thread(logical CPU)의 포함 관계를 topology 출력과 연결한다.",
      "SMT는 physical core를 늘리지 않고 같은 core의 일부 execution resource를 공유한다.",
      "binding은 cache locality와 NUMA memory path, 재현성에 영향을 준다.",
      "benchmark에는 SMT 상태와 thread 수, CPU binding을 함께 기록한다."
    ],
    example: {
      title: "예제 · 32 threads를 사용했는데 16-core CPU보다 느리다",
      intro: "logical CPU 수만 보고 thread를 늘리면 SMT sibling 간 resource 경쟁이 생길 수 있다.",
      steps: [
        { label: "topology 확인", text: "lscpu로 socket, core/socket, thread/core를 확인해 physical core 수를 계산한다." },
        { label: "binding 확인", text: "실제 thread가 SMT sibling에 어떻게 배치되는지 affinity를 확인한다." },
        { label: "비교 실험", text: "physical core 수와 logical CPU 수에 맞춘 두 실행을 같은 input·binding 조건으로 비교한다." }
      ],
      conclusion: "thread 수를 늘리는 것과 physical compute resource를 늘리는 것은 같은 일이 아니다."
    },
    commands: [
      { cmd: "LC_ALL=C lscpu; lscpu -e=CPU,CORE,SOCKET,NODE,ONLINE | head -32", purpose: "logical CPU를 core/socket/NUMA node에 매핑", observe: "CPU 열의 개수와 CORE 조합 수를 구분하고 SMT sibling을 찾는다." },
      { cmd: "nproc; nproc --all; grep Cpus_allowed_list /proc/self/status", purpose: "허용 CPU와 전체 hardware CPU 비교", observe: "cgroup/affinity 제한이 있으면 nproc과 전체 CPU 수가 다를 수 있다." },
      { cmd: "for c in 0 1 2 3; do echo -n cpu$c' '; cat /sys/devices/system/cpu/cpu$c/topology/thread_siblings_list; done", purpose: "SMT sibling 예시 확인", observe: "같은 sibling list에 속한 logical CPU들이 하나의 physical core를 공유한다." }
    ],
    lab: {
      title: "내 node의 physical core 수 계산",
      steps: ["LC_ALL=C lscpu | grep -E 'CPU\(s\)|Thread|Core|Socket|NUMA'", "lscpu -e=CORE,SOCKET | tail -n +2 | sort -u | wc -l", "grep Cpus_allowed_list /proc/self/status"],
      expect: "logical CPU 수, physical core 수, 현재 process가 허용받은 CPU 수를 서로 구분한다."
    },
    mistakes: ["CPU(s)를 physical core로 해석", "SMT=2배 성능이라고 가정", "thread 수만 기록하고 binding을 생략", "node 전체 topology와 job cpuset을 동일시"],
    troubleshoot: "성능 이상은 topology → SMT 상태 → cpuset/affinity → thread binding → NUMA placement 순서로 확인한다.",
    selfCheck: [
      { question: "logical CPU 64개와 physical core 64개는 왜 같은 뜻이 아닐 수 있는가?", answer: "SMT가 켜지면 하나의 physical core가 둘 이상의 logical CPU를 제공할 수 있기 때문이다." },
      { question: "SMT가 workload에 따라 이득이 달라지는 이유는?", answer: "SMT sibling이 execution unit, cache, memory path 같은 일부 core 자원을 공유하므로 workload의 병목에 따라 경쟁 또는 유휴 자원 활용 효과가 달라지기 때문이다." },
      { question: "benchmark 재현성을 위해 thread 수 외에 무엇을 기록해야 하는가?", answer: "SMT 상태, CPU affinity/binding, socket/core 배치와 가능하면 NUMA placement를 함께 기록해야 한다." }
    ],
    keywords: ["CPU topology", "socket", "core", "logical CPU", "SMT", "affinity"]
  },
  {
    id: "microarchitecture",
    stage: "System / OS",
    title: "Pipeline·IPC/CPI·Branch·Vectorization",
    en: "CPU Microarchitecture",
    level: "고급",
    minutes: 90,
    env: ["Single node"],
    why: "CPU 사용률이 100%라고 해서 CPU가 효율적으로 일하고 있다는 뜻은 아니다. instructions, cycles, IPC/CPI, branch miss, vectorization을 함께 보면 계산 pipeline이 어디서 기다리는지 더 구체적인 가설을 세울 수 있다.",
    learningObjectives: [
      "IPC와 CPI가 무엇을 나타내고 왜 workload 의존적인지 설명할 수 있다.",
      "branch misprediction과 pipeline stall이 성능에 미치는 영향을 개념적으로 설명할 수 있다.",
      "SIMD vectorization의 이득이 memory bandwidth와 data layout에 의해 제한될 수 있음을 설명할 수 있다."
    ],
    terms: [
      { term: "Pipeline", en: "instruction pipeline", definition: "instruction 실행을 여러 단계로 나누고 여러 instruction을 겹쳐 처리하는 CPU 실행 구조다.", why: "branch miss나 dependency가 왜 여러 cycle의 손실로 이어지는지 이해하는 기반이다." },
      { term: "IPC", en: "instructions per cycle", definition: "평균적으로 한 CPU cycle에 완료된 instruction 수를 나타내는 지표다.", why: "CPU가 바쁘지만 유용한 instruction 처리량이 낮은 상황을 정량적으로 비교하는 단서가 된다." },
      { term: "CPI", en: "cycles per instruction", definition: "평균 instruction 하나를 완료하는 데 필요한 cycle 수로 IPC와 역수 관계로 볼 수 있다.", why: "같은 workload의 전후 비교에서 pipeline 효율 변화를 설명할 수 있다." },
      { term: "Branch misprediction", en: "branch miss", definition: "CPU가 예측한 분기 방향이 틀려 이미 진행한 speculative work를 버리고 올바른 경로로 다시 시작하는 사건이다.", why: "불규칙한 control flow에서 pipeline 효율을 낮출 수 있다." },
      { term: "SIMD", en: "vectorization", definition: "하나의 instruction으로 여러 data element를 병렬 처리하는 방식이다.", why: "계산 밀도가 높은 loop의 throughput을 높일 수 있지만 memory-bound loop에서는 이득이 제한될 수 있다." }
    ],
    sections: [
      {
        title: "CPU 100%와 높은 처리 효율은 다른 말이다",
        paragraphs: [
          "top에서 CPU가 100%라는 것은 task가 CPU 시간을 계속 사용하고 있다는 뜻이지 pipeline이 매 cycle 최대로 유용한 work를 처리한다는 뜻은 아니다. cache miss, dependency, branch miss가 많아도 task는 여전히 CPU를 사용 중으로 보일 수 있다.",
          "perf stat의 cycles와 instructions를 이용하면 IPC=instructions/cycles로 한 가지 관점을 얻을 수 있다. 다만 IPC는 CPU 세대, instruction mix, input에 따라 달라지므로 서로 다른 workload의 절대 점수로 쓰기보다 같은 조건의 baseline 비교에 적합하다."
        ],
        takeaway: "CPU utilization과 instruction throughput을 분리해서 본다."
      },
      {
        title: "Branch와 dependency는 pipeline의 연속성을 깨뜨린다",
        paragraphs: [
          "현대 CPU는 다음 instruction을 미리 가져오고 실행할 수 있지만 branch 방향이 자주 틀리면 잘못된 경로의 work를 버려야 한다. 이때 pipeline의 일부가 비고 다시 채워지는 비용이 생긴다.",
          "branch miss ratio만으로 원인을 확정할 수는 없다. cache miss, instruction dependency, frontend 공급, frequency 같은 다른 병목도 IPC를 낮출 수 있으므로 추가 counter와 source-level profile을 함께 본다."
        ],
        takeaway: "낮은 IPC는 원인이 아니라 증상이며 여러 stall 후보를 추가 evidence로 분리해야 한다."
      },
      {
        title: "Vectorization은 계산 폭을 넓히지만 memory를 무한히 빠르게 만들지 않는다",
        paragraphs: [
          "SIMD는 같은 연산을 여러 data element에 적용할 때 높은 throughput을 제공할 수 있다. compiler는 loop dependency, aliasing, alignment 등을 분석해 vectorization 가능성을 판단하고 report를 제공할 수 있다.",
          "그러나 loop가 이미 memory bandwidth에 묶여 있다면 vector instruction 폭을 넓혀도 DRAM에서 data를 가져오는 속도가 전체 성능을 제한할 수 있다. 그래서 vectorization 여부와 memory behavior를 함께 평가해야 한다."
        ],
        takeaway: "vectorization 성공 여부와 실제 speedup은 별개의 질문이다."
      }
    ],
    concepts: [
      "CPU 100%는 pipeline 효율이나 IPC가 높다는 뜻이 아니다.",
      "IPC/CPI는 workload와 microarchitecture 의존적인 비교 지표다.",
      "branch misprediction은 speculative pipeline work를 버리는 비용을 만든다.",
      "SIMD speedup은 memory bandwidth와 data layout에 의해 제한될 수 있다."
    ],
    example: {
      title: "예제 · CPU 100%인데 새 버전이 더 느리다",
      intro: "clock이나 utilization 대신 같은 input에서 counter와 profile을 비교한다.",
      steps: [
        { label: "기준 측정", text: "이전 버전과 새 버전을 동일 affinity·input에서 perf stat으로 비교한다." },
        { label: "가설 분리", text: "IPC 저하가 보이면 branch miss, cache miss, frequency 같은 후보를 추가 counter와 profile로 확인한다." },
        { label: "source 연결", text: "hot loop의 vectorization report와 flame graph를 함께 보고 코드 변경과 counter 변화를 연결한다." }
      ],
      conclusion: "counter는 단일 정답이 아니라 다음 질문을 선택하게 해주는 증거다."
    },
    commands: [
      { cmd: "perf stat -e cycles,instructions,branches,branch-misses ./app", purpose: "기본 PMU counter로 IPC와 branch behavior 관찰", observe: "instructions/cycles를 같은 workload baseline과 비교하고 branch-miss 비율 변화도 함께 본다.", caution: "perf_event_paranoid 등 사이트 정책으로 제한될 수 있다." },
      { cmd: "perf record -g -- ./app && perf report --stdio | head -80", purpose: "counter 변화가 집중되는 hot code 위치 확인", observe: "전체 평균 counter와 실제 hot function을 연결한다.", caution: "production workload에서는 sampling overhead와 데이터 민감도를 고려한다." },
      { cmd: "gcc -O3 -fopt-info-vec-optimized -fopt-info-vec-missed -c kernel.c 2>vec.txt || true; cat vec.txt", purpose: "compiler vectorization 판단 확인", observe: "vectorized loop와 missed reason을 구분한다." }
    ],
    lab: {
      title: "같은 loop의 optimization report 비교",
      steps: ["gcc -O2 -fopt-info-vec-all -c kernel.c 2>o2.txt || true", "gcc -O3 -fopt-info-vec-all -c kernel.c 2>o3.txt || true", "diff -u o2.txt o3.txt || true"],
      expect: "optimization level 변화가 vectorization decision에 어떤 차이를 만들었는지 report를 근거로 설명한다."
    },
    mistakes: ["IPC를 서로 다른 CPU·workload의 절대 성능 점수로 사용", "CPU 100%면 계산 자원이 충분히 활용됐다고 판단", "-O3가 항상 더 빠르다고 가정", "vectorized라는 report만 보고 memory bottleneck을 무시"],
    troubleshoot: "low IPC가 보이면 branch, cache, dependency, frontend, frequency 후보를 순서 없이 단정하지 말고 profile과 추가 counter로 좁힌다.",
    selfCheck: [
      { question: "CPU utilization 100%인데 IPC가 낮을 수 있는 이유는?", answer: "task는 CPU 시간을 계속 사용하지만 cache miss, branch miss, dependency 같은 stall 때문에 cycle당 완료 instruction 수가 낮을 수 있기 때문이다." },
      { question: "IPC를 다른 애플리케이션끼리 절대 점수로 비교하기 어려운 이유는?", answer: "instruction mix, CPU microarchitecture, input과 compiler가 모두 달라 IPC의 의미가 workload 의존적이기 때문이다." },
      { question: "vectorization이 성공했는데 speedup이 작을 수 있는 이유는?", answer: "loop가 memory bandwidth나 다른 병목에 제한되어 계산 폭 증가가 전체 runtime을 줄이지 못할 수 있기 때문이다." }
    ],
    keywords: ["pipeline", "IPC", "CPI", "branch", "SIMD", "vectorization", "perf"]
  },
  {
    id: "cache-coherence",
    stage: "System / OS",
    title: "Cache·Coherence·False Sharing",
    en: "Cache Behavior",
    level: "고급",
    minutes: 90,
    env: ["Single node"],
    why: "thread 수를 늘렸는데 성능이 오히려 떨어질 때 계산량보다 cache miss, shared cache 경쟁, cache-line ownership 이동이 병목일 수 있다. cache hierarchy와 coherence를 line 단위로 이해해야 locality 문제와 false sharing을 구분할 수 있다.",
    learningObjectives: [
      "L1/L2/LLC/DRAM의 계층과 공유 범위를 topology 관점에서 설명할 수 있다.",
      "cache coherence가 최신 값의 일관성을 유지하지만 write ownership 이동 비용을 만든다는 점을 설명할 수 있다.",
      "false sharing과 실제 data race를 구분하고 대표적인 개선 방향을 제시할 수 있다."
    ],
    terms: [
      { term: "Cache line", en: "cache line", definition: "cache가 memory와 데이터를 주고받고 coherence를 관리하는 대표적인 고정 크기 블록이다.", why: "서로 다른 변수라도 같은 line에 있으면 write ownership 경쟁이 생길 수 있다." },
      { term: "Working set", en: "working set", definition: "특정 시간 구간에 프로그램이 반복적으로 접근하는 data 집합이다.", why: "working set이 가까운 cache에 유지되는지가 memory latency와 bandwidth 요구량을 크게 바꾼다." },
      { term: "Coherence", en: "cache coherence", definition: "여러 core cache가 같은 memory location의 값을 일관되게 보도록 유지하는 메커니즘이다.", why: "공유 data 쓰기가 잦을 때 invalidation과 ownership 이동 비용을 이해할 수 있다." },
      { term: "False sharing", en: "false sharing", definition: "서로 다른 thread가 논리적으로 다른 변수를 수정하지만 그 변수들이 같은 cache line에 있어 line ownership이 반복 이동하는 현상이다.", why: "data race가 없어도 thread scaling이 무너질 수 있는 대표적 원인이다." },
      { term: "LLC", en: "last-level cache", definition: "DRAM에 가기 전 마지막 cache 계층으로 여러 core가 공유하는 경우가 많다.", why: "socket 내부 core 간 공유 범위와 capacity contention을 판단하는 중요한 topology 자원이다." }
    ],
    sections: [
      {
        title: "Cache는 단순히 빠른 memory가 아니라 locality 계층이다",
        paragraphs: [
          "CPU core는 DRAM보다 가까운 작은 cache 계층을 사용해 반복 data access의 latency를 줄인다. 일반적으로 L1은 core에 가장 가깝고 작으며, 더 바깥 계층은 크지만 접근 비용이 증가한다. 정확한 크기와 공유 범위는 CPU 세대마다 다르다.",
          "성능 관점에서는 miss ratio 자체뿐 아니라 어떤 thread가 같은 cache를 공유하는지, working set이 그 cache 용량 안에 들어오는지, access pattern이 reuse를 만들 수 있는지를 함께 본다."
        ],
        takeaway: "cache 분석은 size와 miss뿐 아니라 sharing topology와 data reuse를 함께 본다."
      },
      {
        title: "Coherence는 correctness를 돕지만 write가 공짜가 되는 것은 아니다",
        paragraphs: [
          "여러 core가 같은 cache line을 읽고 쓸 수 있기 때문에 hardware는 어느 cache의 copy가 최신인지 관리해야 한다. 한 core가 쓰기 권한을 얻으면 다른 core의 copy가 invalidation되거나 ownership이 이동할 수 있다.",
          "이 coherence traffic은 공유 data write가 많을수록 증가할 수 있다. 하지만 coherence가 있다고 해서 application의 data race가 자동으로 해결되는 것은 아니며 synchronization correctness는 별도의 문제다."
        ],
        takeaway: "coherence는 값의 일관성을 관리하지만 synchronization semantics를 대신하지 않는다."
      },
      {
        title: "False sharing은 변수보다 cache line을 봐야 보인다",
        paragraphs: [
          "Thread A가 변수 a만, Thread B가 변수 b만 수정하더라도 a와 b가 같은 cache line에 있으면 line 전체의 write ownership이 core 사이를 왕복할 수 있다. 소스 코드만 보면 독립 변수라서 문제를 놓치기 쉽다.",
          "padding, per-thread private buffer, data layout 변경으로 write-sharing line을 분리하는 것이 대표적인 개선 방향이다. 다만 cache line size와 data layout을 실제 platform에서 확인하고 benchmark로 효과를 검증해야 한다."
        ],
        takeaway: "false sharing은 논리적 공유가 아니라 물리적 cache-line 공유에서 발생한다."
      }
    ],
    concepts: [
      "Cache 계층은 latency, capacity, 공유 범위가 다르다.",
      "Coherence는 cache line의 최신 값과 write ownership을 관리하지만 ownership 이동 비용을 만든다.",
      "False sharing은 서로 다른 변수가 같은 cache line에 있을 때도 발생할 수 있다.",
      "Thread scaling 악화는 data layout, affinity, cache sharing topology를 함께 확인해야 한다."
    ],
    example: {
      title: "예제 · 8 threads 이후 성능이 급격히 악화",
      intro: "CPU utilization이 높아도 shared cache 또는 cache-line contention이 원인일 수 있다.",
      steps: [
        { label: "경계 찾기", text: "1,2,4,8,16 threads로 scaling curve를 만들어 성능이 꺾이는 지점을 찾는다." },
        { label: "topology 대조", text: "해당 thread 수가 shared LLC나 socket 경계와 맞물리는지 확인한다." },
        { label: "data layout 가설", text: "thread-private counter나 인접 struct field가 같은 cache line을 공유하는지 검토하고 padding 전후를 비교한다." }
      ],
      conclusion: "thread 수 증가가 계산 자원 증가만 의미하지 않고 shared cache와 coherence traffic 증가도 만든다는 점을 확인한다."
    },
    commands: [
      { cmd: "lscpu --caches; grep . /sys/devices/system/cpu/cpu0/cache/index*/{level,type,size,coherency_line_size,shared_cpu_list} 2>/dev/null", purpose: "cache size, line size, 공유 CPU 범위 확인", observe: "어느 cache가 private인지 shared인지, cache line size가 얼마인지 topology와 연결한다." },
      { cmd: "perf stat -e cache-references,cache-misses ./app", purpose: "cache behavior의 baseline counter 확인", observe: "miss ratio 하나로 결론내지 않고 input·thread 수·binding이 같은 실행끼리 비교한다.", caution: "generic cache event 의미는 CPU에 따라 제한적일 수 있다." }
    ],
    lab: {
      title: "Cache sharing topology 지도 만들기",
      steps: ["lscpu --caches", "getconf LEVEL1_DCACHE_LINESIZE 2>/dev/null || true", "grep . /sys/devices/system/cpu/cpu0/cache/index*/{level,type,size,shared_cpu_list} 2>/dev/null"],
      expect: "CPU0가 각 cache level을 어떤 CPU들과 공유하는지 설명하고 false sharing이 line 단위라는 점을 연결한다."
    },
    mistakes: ["cache miss 비율 하나만으로 원인 확정", "coherence가 data race를 해결한다고 생각", "false sharing을 단순 data race와 혼동", "cache 크기와 공유 범위를 모든 CPU에서 동일하다고 가정"],
    troubleshoot: "thread scaling이 특정 core/socket 경계에서 꺾이면 cache sharing topology, affinity, data layout, write-sharing 패턴을 함께 확인한다.",
    selfCheck: [
      { question: "false sharing은 왜 data race가 없어도 발생할 수 있는가?", answer: "서로 다른 변수를 각 thread가 독립적으로 쓰더라도 그 변수들이 같은 cache line에 있으면 line ownership이 core 사이를 이동할 수 있기 때문이다." },
      { question: "coherence와 synchronization은 왜 같은 개념이 아닌가?", answer: "coherence는 cache line의 값 일관성을 hardware가 유지하는 메커니즘이고 application의 접근 순서와 race-free semantics는 별도의 synchronization으로 보장해야 하기 때문이다." },
      { question: "cache miss가 증가했다는 사실만으로 원인을 확정하기 어려운 이유는?", answer: "working set, input, binding, sharing topology, hardware event 의미가 모두 영향을 주므로 비교 조건과 다른 evidence가 필요하기 때문이다." }
    ],
    keywords: ["cache", "cache line", "coherence", "false sharing", "locality", "LLC"]
  },
  {
    id: "numa",
    stage: "System / OS",
    title: "NUMA·Memory Bandwidth·Affinity",
    en: "NUMA & Affinity",
    level: "중급",
    minutes: 90,
    env: ["Single node"],
    why: "multi-socket node에서는 모든 CPU가 모든 DRAM에 같은 비용으로 접근하지 않는다. thread가 한 NUMA node에서 실행되는데 page가 다른 node의 memory에 있으면 remote path가 생기므로 CPU affinity와 memory placement를 함께 봐야 한다.",
    learningObjectives: [
      "NUMA node와 local/remote memory access의 관계를 설명할 수 있다.",
      "first-touch allocation이 병렬 초기화 방식과 memory placement에 어떤 영향을 줄 수 있는지 설명할 수 있다.",
      "CPU binding과 memory policy를 함께 관찰하고 locality 문제의 가설을 세울 수 있다."
    ],
    terms: [
      { term: "NUMA", en: "non-uniform memory access", definition: "CPU 위치에 따라 memory access latency와 bandwidth 특성이 달라질 수 있는 memory topology다.", why: "multi-socket node에서 thread placement와 page placement가 성능에 직접 영향을 줄 수 있다." },
      { term: "NUMA node", en: "NUMA node", definition: "가까운 CPU와 memory 영역을 하나의 locality domain으로 묶은 topology 단위다.", why: "CPU와 page가 어느 locality domain에 있는지 비교하는 기준이 된다." },
      { term: "Local access", en: "local memory", definition: "thread가 실행되는 NUMA node와 가까운 memory controller의 page를 접근하는 경로다.", why: "일반적으로 가장 짧은 memory path이며 locality 기준선이 된다." },
      { term: "Remote access", en: "remote memory", definition: "thread의 NUMA node와 다른 node의 DRAM을 inter-socket link를 거쳐 접근하는 경로다.", why: "추가 latency와 fabric bandwidth 사용으로 memory-bound workload가 느려질 수 있다." },
      { term: "First-touch", en: "first-touch allocation", definition: "page가 처음 실제로 쓰이는 CPU 위치가 physical page placement에 영향을 주는 일반적인 NUMA 배치 동작을 가리킨다.", why: "초기화 thread가 어디서 실행되는지가 이후 계산의 memory locality를 결정할 수 있다." },
      { term: "Memory policy", en: "membind / interleave", definition: "memory allocation을 특정 NUMA node에 고정하거나 여러 node에 분산하도록 지정하는 정책이다.", why: "CPU affinity만 조정하고 memory policy를 무시하면 remote access가 남을 수 있다." }
    ],
    sections: [
      {
        title: "한 node 안에서도 memory 거리는 균일하지 않을 수 있다",
        paragraphs: [
          "multi-socket server에서는 각 socket이 가까운 memory controller와 DRAM을 가진다. thread가 자신과 가까운 DRAM을 사용하면 local path를 타지만 다른 socket에 연결된 DRAM을 사용하면 inter-socket link를 거쳐야 할 수 있다.",
          "numactl --hardware의 node distance는 topology의 상대적 접근 비용을 이해하는 힌트다. 실제 latency와 bandwidth 차이는 CPU 세대와 platform에 따라 다르므로 고정된 배율로 일반화하지 않는다."
        ],
        takeaway: "같은 node 내부라고 해서 모든 memory access가 동일한 경로를 가지는 것은 아니다."
      },
      {
        title: "First-touch는 초기화 방식과 계산 위치를 연결한다",
        paragraphs: [
          "많은 Linux NUMA 환경에서 anonymous page는 처음 실제 write가 발생하는 시점의 CPU locality에 영향을 받아 배치될 수 있다. 한 thread가 전체 배열을 serial하게 초기화하면 page가 한 NUMA node에 몰릴 가능성이 있다.",
          "계산 thread들이 자신이 담당할 data 영역을 병렬로 먼저 touch하면 page와 계산 위치를 맞추기 쉬워질 수 있다. 다만 allocator, memory policy, cgroup, interleave 설정이 동작을 바꿀 수 있으므로 실제 policy를 확인한다."
        ],
        takeaway: "초기화는 단순 준비 단계가 아니라 memory placement를 만드는 단계일 수 있다."
      },
      {
        title: "CPU binding과 memory placement는 한 쌍이다",
        paragraphs: [
          "thread를 한 socket에 잘 고정해도 page가 다른 socket에 몰려 있으면 remote access는 계속된다. 반대로 page를 local하게 두어도 thread가 migration하면 locality가 깨질 수 있다.",
          "따라서 taskset이나 OpenMP binding, Slurm binding을 볼 때 numactl memory policy와 함께 확인한다. memory bandwidth를 넓게 쓰는 workload에서는 두 socket에 spread하는 정책이 유리할 수 있고, cache locality 중심 workload에서는 다른 선택이 나을 수 있으므로 반복 측정이 필요하다."
        ],
        takeaway: "NUMA 문제는 CPU 위치와 page 위치를 동시에 봐야 한다."
      }
    ],
    concepts: [
      "NUMA node는 가까운 CPU와 memory를 묶는 locality domain이다.",
      "remote memory access는 inter-socket path를 추가로 사용해 latency와 bandwidth 특성이 달라질 수 있다.",
      "first-touch 때문에 초기화 thread의 위치가 page placement에 영향을 줄 수 있다.",
      "CPU affinity와 memory policy는 함께 확인해야 한다."
    ],
    example: {
      title: "예제 · 2 sockets를 썼는데 1 socket보다 느리다",
      intro: "thread 수는 늘었지만 memory page가 한 NUMA node에 몰리면 remote traffic이 증가할 수 있다.",
      steps: [
        { label: "배치 확인", text: "thread가 어느 socket/NUMA node에서 실행되는지 binding을 확인한다." },
        { label: "memory policy", text: "numactl -s와 node distance를 확인해 membind/interleave 정책을 본다." },
        { label: "초기화 검토", text: "배열 초기화가 serial인지 parallel인지 확인하고 first-touch 영향을 가설로 세운다." },
        { label: "비교", text: "local bind, interleave, parallel first-touch 같은 조건을 동일 input으로 반복 측정한다." }
      ],
      conclusion: "socket 수 증가가 항상 memory locality 개선을 의미하지 않는다."
    },
    commands: [
      { cmd: "numactl --hardware", purpose: "NUMA node, CPU, memory, distance topology 확인", observe: "각 node의 CPU 목록과 memory 크기, distance matrix를 읽는다." },
      { cmd: "taskset -cp $PID; numactl -s", purpose: "CPU affinity와 memory policy 확인", observe: "허용 CPU와 preferred/membind/interleave 정책을 함께 본다." },
      { cmd: "grep -E 'Cpus_allowed_list|Mems_allowed_list' /proc/$PID/status", purpose: "kernel이 허용한 CPU·NUMA node 범위 확인", observe: "scheduler/cgroup 제한이 topology 전체보다 좁은지 확인한다." }
    ],
    lab: {
      title: "Local bind와 interleave 조건 비교 설계",
      steps: ["numactl --hardware", "numactl --cpunodebind=0 --membind=0 ./app 2>/dev/null || true", "numactl --cpunodebind=0 --interleave=all ./app 2>/dev/null || true", "# 같은 input을 여러 번 반복하고 runtime과 placement 조건을 기록한다."],
      expect: "어떤 policy가 항상 정답인 것이 아니라 workload와 topology에 따라 비교 측정해야 함을 설명한다."
    },
    mistakes: ["CPU binding만 하고 memory placement를 무시", "remote access 비용을 모든 시스템에서 동일한 배율로 가정", "VM의 NUMA topology를 물리 node와 동일시", "한 번의 runtime 차이로 policy를 확정"],
    troubleshoot: "한 socket만 바쁘거나 scaling이 socket 경계에서 악화되면 cpuset/affinity, OpenMP binding, memory policy, 초기화 방식, page placement를 같은 실험 조건에서 비교한다.",
    selfCheck: [
      { question: "NUMA에서 local과 remote access를 구분하는 기준은?", answer: "thread가 실행되는 NUMA locality와 page가 배치된 memory locality가 같은지, 다른 node의 memory controller와 inter-socket path를 거치는지 여부다." },
      { question: "serial initialization이 NUMA 성능에 영향을 줄 수 있는 이유는?", answer: "first-touch 정책에서 한 thread가 대부분의 page를 먼저 쓰면 page가 그 thread의 NUMA node에 몰릴 수 있기 때문이다." },
      { question: "CPU affinity만 고정해도 NUMA 문제가 해결된다고 할 수 없는 이유는?", answer: "memory page가 다른 NUMA node에 배치되어 있으면 CPU가 고정되어도 remote access가 계속될 수 있기 때문이다." }
    ],
    keywords: ["NUMA", "local memory", "remote memory", "first touch", "numactl", "affinity", "bandwidth"]
  },
  {
    id: "frequency-power",
    stage: "System / OS",
    title: "CPU Frequency·Turbo·Power State",
    en: "Frequency & Power",
    level: "고급",
    minutes: 65,
    env: ["Single node", "Admin"],
    why: "동일 binary와 input인데 node나 시간대에 따라 runtime이 달라질 수 있다. thermal, power budget, active core 수, frequency policy는 이런 성능 변동의 원인이 될 수 있으므로 AA는 설정을 성급히 바꾸기보다 먼저 관찰 가능한 evidence를 수집해야 한다.",
    learningObjectives: [
      "base frequency, turbo, governor/power policy가 서로 다른 개념임을 설명할 수 있다.",
      "active core 수와 thermal/power condition이 실제 frequency에 영향을 줄 수 있음을 설명할 수 있다.",
      "frequency 차이를 application regression으로 오판하지 않도록 비교 실험 조건을 설계할 수 있다."
    ],
    terms: [
      { term: "Base frequency", en: "base clock", definition: "processor가 보장·정의하는 기준 frequency 개념으로 실제 순간 동작 frequency와 같지 않을 수 있다.", why: "제품 spec 한 숫자와 runtime 중 실제 clock을 혼동하지 않게 한다." },
      { term: "Turbo", en: "boost frequency", definition: "power, temperature, active core 수 같은 조건이 허용할 때 기준보다 높은 frequency로 동작하는 기능이다.", why: "single-thread와 all-core workload의 frequency behavior가 다를 수 있다." },
      { term: "P-state", en: "performance state", definition: "processor performance/frequency 동작점을 관리하는 power-performance 상태 개념이다.", why: "OS/firmware policy가 frequency behavior에 영향을 주는 경로를 설명한다." },
      { term: "C-state", en: "idle state", definition: "CPU가 idle할 때 더 많은 회로를 쉬게 해 power를 줄이는 상태 계층이다.", why: "깊은 idle state 진입·복귀는 power와 latency 특성에 영향을 줄 수 있다." },
      { term: "Thermal throttling", en: "thermal limit", definition: "temperature 또는 power 제한을 지키기 위해 processor가 frequency나 성능을 낮추는 동작이다.", why: "특정 node나 장시간 load에서만 나타나는 성능 저하를 설명하는 후보가 된다." }
    ],
    sections: [
      {
        title: "CPU frequency는 하나의 고정 숫자가 아니다",
        paragraphs: [
          "현대 CPU는 workload와 power/thermal condition에 따라 동작 frequency를 동적으로 바꿀 수 있다. /proc/cpuinfo나 lscpu에서 보이는 순간값은 측정 시점의 한 snapshot일 뿐 전체 benchmark 동안의 평균 동작점을 대표하지 않는다.",
          "특히 active core 수가 늘어나면 socket power budget을 공유하기 때문에 single-core turbo와 all-core load의 frequency behavior가 다를 수 있다. 그래서 thread 수가 다른 benchmark를 clock 하나로 단순 비교하면 오해가 생긴다."
        ],
        takeaway: "frequency는 시간과 load에 따라 변하는 상태이므로 runtime과 같은 구간에서 관찰해야 한다."
      },
      {
        title: "Power management는 성능과 latency의 trade-off를 만든다",
        paragraphs: [
          "P-state와 governor/driver 정책은 performance와 energy 사이의 동작점을 조정한다. C-state는 idle 구간의 power를 낮추지만 깊은 state에서 깨어나는 latency가 workload에 영향을 줄 수 있다.",
          "HPC site는 운영 안정성과 전력 정책 때문에 특정 설정을 표준화할 수 있다. AA는 production node에서 임의로 governor나 BIOS 관련 설정을 바꾸기보다 현재 정책과 이상 node의 차이를 먼저 증거로 남기는 것이 우선이다."
        ],
        takeaway: "관찰과 설정 변경을 분리하고 site policy 안에서 비교한다."
      },
      {
        title: "성능 변동은 application과 platform evidence를 같이 봐야 한다",
        paragraphs: [
          "같은 application이 특정 node에서 반복적으로 느리다면 application input과 binary hash, CPU model, binding, frequency, thermal event를 함께 기록한다. 한 번의 느린 실행만으로 frequency 원인이라고 단정하지 않는다.",
          "반대로 여러 application이 같은 node와 시간대에서 동시에 느려지고 thermal/power 관련 system event가 겹친다면 platform 원인 가설이 강해진다. AA의 역할은 이런 상관관계를 재현 가능한 evidence set으로 만드는 것이다."
        ],
        takeaway: "application regression과 node power/frequency issue를 동일 조건 반복 측정으로 분리한다."
      }
    ],
    concepts: [
      "실제 CPU frequency는 workload, active core 수, power, temperature에 따라 달라질 수 있다.",
      "Turbo와 base frequency는 같은 개념이 아니며 순간 MHz는 benchmark 평균을 대신하지 않는다.",
      "P/C-state와 governor 정책은 performance·power·latency 특성에 영향을 줄 수 있다.",
      "운영 설정 변경보다 node 간 비교와 evidence 수집이 먼저다."
    ],
    example: {
      title: "예제 · 같은 binary가 한 node에서만 15% 느리다",
      intro: "application, placement, frequency를 같은 시간축에서 비교해 node-specific 문제인지 확인한다.",
      steps: [
        { label: "조건 고정", text: "같은 binary, input, thread 수, binding으로 정상 node와 의심 node를 반복 측정한다." },
        { label: "platform 기록", text: "CPU model, kernel, governor/driver 정보와 관찰 가능한 frequency를 함께 기록한다." },
        { label: "event 상관", text: "thermal/power 관련 system log와 느린 실행 시각이 겹치는지 확인한다." },
        { label: "범위 판단", text: "다른 workload도 같은 node에서 느린지 확인해 application-specific인지 node-wide인지 구분한다." }
      ],
      conclusion: "frequency는 원인 후보 중 하나이며 재현성과 범위 evidence가 필요하다."
    },
    commands: [
      { cmd: "LC_ALL=C lscpu | grep -Ei 'model name|mhz|max mhz|min mhz|socket|core|thread'", purpose: "CPU model과 관찰 가능한 frequency/topology 정보 기록", observe: "snapshot MHz를 절대 평균으로 해석하지 않고 node 간 metadata로 사용한다." },
      { cmd: "grep -H . /sys/devices/system/cpu/cpu0/cpufreq/{scaling_driver,scaling_governor,scaling_cur_freq,cpuinfo_max_freq,cpuinfo_min_freq} 2>/dev/null", purpose: "cpufreq driver와 policy 확인", observe: "지원되는 시스템에서 driver/governor/current frequency를 기록한다.", caution: "경로와 제공 항목은 CPU·kernel에 따라 다르다." },
      { cmd: "journalctl -k -b --no-pager | grep -iE 'thermal|thrott|power' | tail -50", purpose: "thermal/power 관련 kernel event 후보 확인", observe: "event timestamp를 benchmark runtime과 대조한다.", caution: "권한과 log 내용은 사이트마다 다르다." }
    ],
    lab: {
      title: "동일 workload의 node 간 비교 기록표 만들기",
      steps: ["hostname; uname -r; lscpu | grep -E 'Model name|Socket|Core|Thread'", "grep -H . /sys/devices/system/cpu/cpu0/cpufreq/{scaling_driver,scaling_governor} 2>/dev/null || true", "/usr/bin/time -p ./app 2>&1 | tee run.txt", "# 다른 node에서 동일 조건으로 반복하고 metadata와 runtime을 함께 비교한다."],
      expect: "runtime 차이를 application 조건과 platform 조건으로 분리해 기록할 수 있다."
    },
    mistakes: ["/proc/cpuinfo의 순간 MHz를 benchmark 평균 frequency로 해석", "turbo frequency를 모든 core에서 지속 가능한 고정 clock으로 가정", "production node의 governor를 근거 없이 변경", "한 번의 느린 실행으로 thermal 원인을 확정"],
    troubleshoot: "node 간 성능 차이는 binary/input/binding을 먼저 고정하고 CPU model, policy, frequency observation, thermal/power event를 동일 시간축으로 비교한다.",
    selfCheck: [
      { question: "왜 CPU의 순간 MHz 값을 benchmark 전체의 평균 frequency로 볼 수 없는가?", answer: "현대 CPU frequency가 workload, power, temperature, active core 수에 따라 시간적으로 변할 수 있기 때문이다." },
      { question: "single-thread turbo와 all-core workload의 frequency가 다를 수 있는 이유는?", answer: "여러 active core가 socket의 power와 thermal budget을 함께 사용하므로 허용 가능한 boost 범위가 달라질 수 있기 때문이다." },
      { question: "AA가 production node의 governor를 바로 바꾸기보다 먼저 해야 할 일은?", answer: "현재 policy와 node 간 차이, runtime과 겹치는 thermal/power evidence를 수집해 원인 범위를 먼저 좁혀야 한다." }
    ],
    keywords: ["frequency", "turbo", "P-state", "C-state", "thermal", "power", "governor"]
  }
];
