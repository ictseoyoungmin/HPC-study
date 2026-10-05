const term=(term,en,definition,why)=>({term,en,definition,why});
const sec=(title,p1,p2,takeaway)=>({title,paragraphs:[p1,p2],takeaway});
const q=(question,answer)=>({question,answer});
const ex=(title,intro,steps,conclusion)=>({title,intro,steps,conclusion});

export const enhancements = Object.freeze({
  "slurm-admin": {
    learningObjectives:[
      "slurmctld, slurmd, slurmdbd, cgroup plugin, Prolog/Epilog의 역할과 장애 경계를 설명할 수 있다.",
      "job launch 실패가 scheduling, node daemon, hook, resource enforcement, accounting 중 어디에서 시작했는지 증거로 좁힐 수 있다.",
      "사용자-visible state와 controller/node/accounting state가 일시적으로 다를 수 있음을 이해하고 시간축으로 분석할 수 있다."
    ],
    terms:[
      term("slurmctld","Slurm controller daemon","queue, priority, allocation, node state를 관리하는 Slurm control-plane daemon이다.","PENDING reason이나 allocation 결정은 compute node의 application process보다 먼저 controller 영역에서 해석해야 한다."),
      term("slurmd","Node daemon","compute node에서 job step launch와 local resource 관리에 관여하는 daemon이다.","allocation은 성공했는데 process가 뜨지 않는 문제는 slurmd와 node-local plugin/hook 영역을 조사해야 할 수 있다."),
      term("slurmdbd","Accounting daemon","job/accounting 정보를 데이터베이스 계층과 연결하는 daemon이다.","accounting 지연은 실제 계산 실패와 다른 failure domain이므로 sacct 정보가 늦는다고 job 자체가 실패했다고 단정하면 안 된다."),
      term("Prolog / Epilog","Lifecycle hook","job 시작 전과 종료 후 site-specific 작업을 실행하는 hook이다.","mount, cleanup, health check 같은 hook 실패가 application 실행 전후의 장애로 전파될 수 있다."),
      term("cgroup enforcement","자원 제한 집행","CPU, memory, device 등 job에 허용된 resource boundary를 kernel cgroup으로 집행하는 메커니즘이다.","application이 보이는 자원과 scheduler가 할당한 자원이 다르면 binding/device/memory limit 문제를 의심할 근거가 된다."),
      term("Accounting lag","회계 정보 지연","job event가 accounting store에 반영되기까지 생기는 시간 차다.","실시간 controller state와 사후 accounting state를 같은 시점의 사실처럼 비교하면 잘못된 결론을 낼 수 있다.")
    ],
    sections:[
      sec("Slurm은 하나의 daemon이 아니라 control path의 연쇄다",
        "사용자가 sbatch를 제출하면 먼저 controller가 정책과 resource availability를 평가한다. allocation이 확정된 뒤 compute node의 slurmd가 job step을 시작하고, site hook과 task/cgroup plugin이 실제 process 환경을 구성한다.",
        "따라서 'Slurm이 실패했다'는 표현은 너무 넓다. queue에서 시작하지 못한 문제, allocation 후 launch 실패, node-local hook 실패, cgroup enforcement, accounting 반영 지연은 서로 다른 로그와 담당 영역을 가진다.",
        "RCA의 첫 질문은 어느 daemon과 어느 lifecycle 단계에서 정상 흐름이 끊겼는가이다."),
      sec("사용자 state와 내부 state는 시간축을 맞춰야 한다",
        "squeue, scontrol, sacct는 서로 다른 목적과 데이터 경로를 사용한다. 실행 중 state를 controller에서 볼 때와 종료 후 accounting record를 볼 때는 갱신 시점이 다를 수 있다.",
        "AA는 ticket의 시각, job start/end, node state change, controller log, slurmd log, accounting record를 같은 timeline에 놓아야 한다. 늦게 생성된 기록을 앞선 원인처럼 읽지 않는 것이 중요하다.",
        "state 차이는 모순이 아니라 관찰 지점과 시각의 차이일 수 있다."),
      sec("관리자 진단은 read-only evidence부터 시작한다",
        "DRAIN/RESUME, reconfigure, daemon restart 같은 조치는 cluster 상태를 바꾸므로 원인 조사 전에 실행하면 증거를 지울 수 있다. 먼저 scontrol show job/node, daemon log, hook 결과, cgroup path와 설정을 읽는다.",
        "변경이 필요하면 왜 필요한지, 영향 범위가 어느 node/partition인지, rollback은 무엇인지 기록한다. 운영 자동화나 runbook도 관찰 단계와 변경 단계를 명확히 분리해야 한다.",
        "운영 권한이 있을수록 먼저 상태를 보존하고 그 다음 변경한다.")
    ],
    example:ex("Allocation은 됐지만 application process가 시작되지 않은 job",
      "RUNNING으로 전환되었거나 node가 배정되었는데 stdout이 비어 있고 process가 뜨지 않는 상황을 lifecycle로 분해한다.",
      [
        {label:"Controller",text:"job allocation과 NodeList가 정상 확정되었는지 확인한다."},
        {label:"Node daemon",text:"해당 node의 slurmd가 step launch 요청을 받았는지 시간순으로 본다."},
        {label:"Hook / plugin",text:"Prolog, SPANK, task/cgroup plugin이 launch 전에 실패했는지 확인한다."},
        {label:"Accounting",text:"종료 후 sacct state는 마지막 결과로 사용하되 최초 실패 시점과 구분한다."}
      ],
      "allocation 성공과 process launch 성공은 다른 단계다. 최초 비정상 event가 어느 경계에 있는지 찾는 것이 핵심이다."),
    selfCheck:[
      q("sacct에 정보가 늦게 보인다는 사실만으로 application failure를 결론낼 수 없는 이유는?","sacct는 accounting 경로의 기록이며 controller/node 실행 경로와 반영 시점이 다를 수 있기 때문이다."),
      q("allocation 후 process가 뜨지 않을 때 controller 다음으로 볼 영역은?","compute node의 slurmd, lifecycle hook, task/cgroup plugin 등 node-local launch 경계다."),
      q("DRAIN/RESUME 같은 변경 명령 전에 해야 할 일은?","현재 state, reason, 관련 로그와 job/node evidence를 보존하고 변경의 영향 범위와 목적을 기록하는 것이다.")
    ]
  },

  "rca-failures": {
    learningObjectives:[
      "Segfault, OOM, hang, deadlock, rank failure를 증상과 증거의 차이로 구분할 수 있다.",
      "마지막 오류 메시지가 아니라 first causal event를 찾기 위한 RCA timeline을 구성할 수 있다.",
      "단일 rank/process의 실패가 launcher, scheduler, 다른 rank에 어떻게 전파되는지 설명할 수 있다."
    ],
    terms:[
      term("Failure mode","실패 유형","관찰된 실패를 segfault, OOM, hang, deadlock, transport failure 등 동작 특성으로 분류한 것이다.","유형마다 가장 먼저 확인할 evidence가 달라진다."),
      term("Symptom","증상","사용자나 monitoring이 직접 관찰한 결과다.","증상은 원인과 동일하지 않으며 'job failed'는 분석의 출발점일 뿐이다."),
      term("First causal event","최초 인과 사건","후속 오류를 발생시킨 가장 이른 증거 가능한 비정상 사건이다.","마지막 stderr 줄보다 root cause에 가까운 경우가 많다."),
      term("Propagation","전파","한 process/rank/node의 실패가 launcher, collective, scheduler cleanup에 영향을 주는 과정이다.","분산 job에서는 원인과 전체 job 종료 메시지가 다른 rank/node에 나타날 수 있다."),
      term("Exit code / signal","종료 코드와 시그널","process가 정상 return했는지 signal로 종료되었는지 표현하는 실행 결과다.","scheduler state와 함께 보면 application crash, timeout, cancel, OOM 같은 가설을 좁힐 수 있다."),
      term("Deadlock","교착 상태","서로가 필요로 하는 자원이나 progress를 기다려 아무도 진행하지 못하는 상태다.","단순한 slow I/O나 long compute도 hang처럼 보일 수 있으므로 stack/wait state로 구분해야 한다.")
    ],
    sections:[
      sec("RCA는 오류 이름 찾기가 아니라 사건 순서를 재구성하는 일이다",
        "사용자가 본 것은 보통 '종료됨', '멈춤', '느림'처럼 높은 수준의 증상이다. AA는 submit/start, first warning, first abnormal process/rank, scheduler reaction, cleanup 순서로 사건을 정렬한다.",
        "시간축을 만들면 원인과 결과를 분리할 수 있다. 예를 들어 rank 7 segfault 이후 다른 rank가 collective error를 내고 launcher가 전체 job을 종료했다면 collective error는 root cause가 아니라 propagation일 수 있다.",
        "가장 이른 설명 가능한 비정상 event와 그 전파 경로를 찾는다."),
      sec("failure mode마다 첫 증거가 다르다",
        "Segfault는 signal/stack/core dump, OOM은 memory limit과 kill evidence, hang은 process state와 stack/wait channel, deadlock은 여러 thread/rank의 상호 대기 관계를 본다.",
        "따라서 모든 장애에 같은 명령 세트를 기계적으로 적용하지 않는다. scheduler state와 exit code로 1차 분류한 뒤 필요한 계층으로 내려가는 evidence ladder가 효율적이다.",
        "증상 분류가 다음 명령과 로그 선택을 결정한다."),
      sec("분산 실패는 한 rank의 사건이 전체 job 메시지로 확대된다",
        "MPI나 launcher는 한 rank가 비정상 종료하면 나머지 rank를 정리할 수 있다. 이때 여러 node에서 비슷한 종료 메시지가 동시에 발생해도 최초 원인은 하나의 rank나 node일 수 있다.",
        "rank별 stderr, hostname, timestamp, exit code를 모으면 최초 실패 지점을 좁힐 수 있다. 모든 rank의 마지막 메시지를 같은 가치로 보는 대신 first-failure와 cleanup message를 구분한다.",
        "분산 RCA에서는 rank/node identity와 timestamp가 필수 evidence다.")
    ],
    example:ex("MPI job 전체가 abort됐지만 실제 원인은 rank 12의 segfault",
      "launcher stderr에는 여러 rank 종료 메시지가 보이지만 각 event의 시각과 rank를 정렬한다.",
      [
        {label:"T0",text:"job start와 NodeList를 확보한다."},
        {label:"T1",text:"rank 12에서 SIGSEGV/core evidence가 먼저 발생한 것을 확인한다."},
        {label:"T2",text:"collective 또는 transport error가 다른 rank에 이어 나타나는지 본다."},
        {label:"T3",text:"launcher와 Slurm cleanup message를 propagation으로 분류한다."}
      ],
      "여러 오류 중 시간상 가장 먼저 나타난 설명 가능한 사건이 root cause 후보이며, 나머지는 전파 결과일 수 있다."),
    selfCheck:[
      q("hang과 deadlock을 같은 말로 쓰면 안 되는 이유는?","hang은 progress가 보이지 않는 증상이고 deadlock은 상호 대기로 progress가 불가능한 특정 원인이기 때문이다."),
      q("분산 job에서 모든 rank의 종료 메시지가 root cause일 수 없는 이유는?","한 rank의 실패가 launcher/collective를 통해 다른 rank 종료로 전파될 수 있기 때문이다."),
      q("RCA timeline에서 가장 중요한 질문은?","최초 비정상 event가 무엇이고 이후 어떤 경로로 전체 장애로 전파되었는가이다.")
    ]
  }
});
