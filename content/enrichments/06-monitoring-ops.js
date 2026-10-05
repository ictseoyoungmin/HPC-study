const term=(term,en,definition,why)=>({term,en,definition,why});
const sec=(title,p1,p2,takeaway)=>({title,paragraphs:[p1,p2],takeaway});
const q=(question,answer)=>({question,answer});
const ex=(title,intro,steps,conclusion)=>({title,intro,steps,conclusion});

export const enhancements = Object.freeze({
  "monitoring": {
    learningObjectives:[
      "CPU, memory, storage, network, GPU 지표를 같은 시간축에 맞춰 병목 후보를 분류할 수 있다.",
      "load average, CPU utilization, I/O wait, queue depth, retransmit, GPU utilization을 서로 다른 의미의 지표로 해석할 수 있다.",
      "누적 counter와 instantaneous gauge를 구분하고 baseline/incident window의 delta를 비교할 수 있다."
    ],
    terms:[
      term("Gauge","순간 상태 지표","특정 시점의 utilization, queue length, memory usage처럼 현재 상태를 표현하는 값이다.","한 번의 snapshot은 짧은 spike나 idle interval에 크게 좌우될 수 있다."),
      term("Counter","누적 카운터","부팅 또는 측정 시작 이후 누적된 packet, error, context switch 같은 사건 수다.","절대값보다 일정 시간 구간의 delta/rate로 해석해야 한다."),
      term("Load average","실행 대기 부하","Linux에서 runnable task와 일부 uninterruptible task의 수를 시간 평균으로 나타낸 값이다.","CPU 사용률과 같은 값이 아니며 I/O block도 load를 높일 수 있다."),
      term("Correlation window","상관 분석 구간","증상이 발생한 전후 시간을 기준으로 서로 다른 metric/log를 정렬한 분석 구간이다.","CPU/GPU/I/O/network의 원인-결과 관계를 같은 시각으로 비교하는 기준이 된다."),
      term("Baseline","정상 기준선","동일하거나 충분히 유사한 workload의 정상 상태에서 수집한 지표 범위다.","절대 임계치보다 해당 workload의 평소 패턴과의 차이가 더 유용한 경우가 많다."),
      term("Saturation","포화","resource demand가 처리 능력에 가까워져 queue와 latency가 증가하는 상태다.","utilization이 높다는 사실과 실제 latency/queue 문제가 발생했다는 사실을 구분해 판단해야 한다.")
    ],
    sections:[
      sec("모니터링은 여러 숫자를 한 화면에 놓는 일이 아니라 같은 사건을 여러 계층에서 보는 일이다",
        "CPU가 낮고 disk utilization이 높다고 해서 바로 storage가 root cause라고 결론낼 수는 없다. 중요한 것은 user가 느려졌다고 한 시간에 process CPU, runnable/block state, memory pressure, disk queue, network error, GPU timeline이 어떻게 움직였는지 맞춰 보는 것이다.",
        "서로 다른 도구의 sampling interval과 timestamp를 맞추지 않으면 선후 관계를 잘못 읽기 쉽다. 1초 단위 metric과 5분 평균 metric을 같은 정밀도로 비교하지 않는다.",
        "증상 시각을 중심으로 동일한 correlation window를 만들고 계층별 지표를 정렬한다."),
      sec("높은 값과 병목은 같은 말이 아니다",
        "CPU utilization이 100%여도 계산 중심 workload라면 정상일 수 있고, disk utilization이 높아도 충분한 throughput을 내면서 queue latency가 안정적일 수 있다. 반대로 utilization이 낮아도 lock, sync, serial region 때문에 throughput이 낮을 수 있다.",
        "따라서 사용률 단일 지표보다 queue, latency, wait, throughput, error를 함께 본다. 예를 들어 CPU idle과 I/O wait, process read rate, block-device await가 동시에 증가하면 storage wait 가설이 강해진다.",
        "병목은 높은 숫자가 아니라 useful work를 제한하는 evidence의 조합으로 판단한다."),
      sec("counter는 delta로, snapshot은 반복 sample로 읽는다",
        "NIC error, retransmit, page fault, context switch처럼 누적되는 값은 incident 전후 delta를 계산해야 의미가 있다. 큰 절대값은 오래 켜진 node의 역사일 수 있다.",
        "top이나 nvidia-smi 한 번의 화면은 순간 sampling일 뿐이다. 반복 sample이나 profiler timeline을 사용해 증상과 같은 구간에서 패턴이 지속되는지 확인한다.",
        "숫자의 타입과 수집 주기를 이해하지 않으면 정상 시스템을 장애처럼 오판할 수 있다.")
    ],
    example:ex("GPU utilization이 주기적으로 0%로 떨어지는 training job",
      "GPU만 보면 device 문제처럼 보이지만 CPU, storage, network metric을 같은 시간축에 맞춘다.",
      [
        {label:"GPU",text:"utilization gap이 반복되는 정확한 구간을 표시한다."},
        {label:"CPU",text:"같은 구간에 dataloader process가 CPU saturated인지 idle인지 확인한다."},
        {label:"Storage",text:"read throughput와 await/queue가 동시에 증가하는지 본다."},
        {label:"Network",text:"multi-node라면 collective 또는 retransmit spike와 겹치는지 비교한다."}
      ],
      "GPU idle은 결과일 수 있다. 같은 시간에 먼저 변한 upstream metric을 찾아 dependency chain을 구성한다."),
    selfCheck:[
      q("load average가 높다는 사실만으로 CPU saturation을 결론낼 수 없는 이유는?","runnable task뿐 아니라 일부 uninterruptible wait도 포함되어 I/O block 등으로 높아질 수 있기 때문이다."),
      q("누적 NIC error counter를 어떻게 비교해야 하는가?","incident window 전후의 delta 또는 rate를 baseline과 비교해야 한다."),
      q("모니터링에서 timestamp 정렬이 중요한 이유는?","서로 다른 계층의 변화 중 무엇이 먼저 발생했고 어떤 변화가 결과인지 판단하려면 같은 시간축이 필요하기 때문이다.")
    ]
  },

  "node-health": {
    learningObjectives:[
      "node-specific failure와 workload-wide failure를 A/B 비교로 구분할 수 있다.",
      "DRAIN, DOWN, RESUME의 운영 의미와 안전한 node lifecycle을 설명할 수 있다.",
      "firmware, kernel, driver, mount, network, hardware event를 node health evidence로 정리할 수 있다."
    ],
    terms:[
      term("DRAIN","스케줄 제외 상태","새 job 배정을 막으면서 기존 상태를 보존해 조사할 수 있는 Slurm node state다.","문제 node를 격리하되 원인 증거를 유지하는 운영 조치로 사용된다."),
      term("DOWN","사용 불가 상태","controller가 node를 작업 수행 불가로 보는 상태다.","DRAIN과 달리 가용성 상실 또는 강한 장애 상태를 나타낼 수 있어 reason과 전환 시각을 함께 봐야 한다."),
      term("RESUME","운영 복귀","검증이 끝난 node를 scheduling 대상으로 되돌리는 조치다.","원인을 해소하지 않고 resume하면 같은 장애가 다른 job에 재발할 수 있다."),
      term("Configuration drift","구성 편차","동일 역할의 node 사이에서 OS, kernel, firmware, driver, config 등이 기준선과 달라진 상태다.","특정 node에서만 재현되는 성능/기능 문제의 중요한 원인 후보다."),
      term("A/B reproduction","비교 재현","같은 workload를 정상 node와 문제 node에서 동일 조건으로 실행해 차이를 확인하는 방법이다.","application 입력이나 코드보다 node 특성이 원인인지 분리하는 데 효과적이다."),
      term("Health validation","복귀 검증","maintenance 이후 microbenchmark, service state, hardware log 등을 기준선과 비교하는 절차다.","RESUME 전에 변경이 실제 문제를 해결했는지 검증한다.")
    ],
    sections:[
      sec("특정 node에서만 재현되는지는 가장 강한 분류 단서다",
        "같은 binary, input, resource request를 여러 node에서 실행했을 때 한 node 또는 한 hardware cohort에서만 실패한다면 application bug보다 infrastructure difference의 가능성이 커진다.",
        "반대로 모든 node에서 비슷하게 재현된다면 workload, library, global service 문제를 우선 볼 수 있다. node identity와 placement 기록 없이 평균 성능만 보면 이 구분이 사라진다.",
        "첫 분기는 workload-wide인가 node-specific인가이다."),
      sec("DRAIN은 원인 규명이 아니라 blast radius를 줄이는 운영 도구다",
        "문제 node를 DRAIN하면 새 job 유입을 막아 추가 피해와 증거 혼합을 줄일 수 있다. 하지만 DRAIN 자체가 원인을 설명하는 것은 아니므로 reason, 발생 시각, 영향을 받은 job을 함께 기록해야 한다.",
        "조사 중 kernel/driver/service restart를 수행하면 로그와 재현 조건이 달라질 수 있다. 변경 전 evidence snapshot을 남기고 어떤 조치가 어떤 결과를 만들었는지 maintenance timeline을 유지한다.",
        "격리와 원인 분석은 다른 단계이며 둘 다 기록되어야 한다."),
      sec("RESUME은 복구가 아니라 검증 완료의 결과다",
        "firmware update나 service restart 후 command가 성공했다는 사실만으로 node health가 회복됐다고 보기는 어렵다. 정상 node와 동일한 health check와 microbenchmark를 수행해 functional/performance baseline을 비교한다.",
        "검증이 통과한 뒤 resume하고, 이후 첫 몇 개 job에서 재발 여부를 관찰한다. 이렇게 해야 maintenance 조치와 서비스 복귀를 분리해 책임 있는 운영 기록을 남길 수 있다.",
        "복귀는 변경 성공이 아니라 기준선 재검증 이후에 수행한다.")
    ],
    example:ex("같은 MPI benchmark가 node17에서만 30% 느린 경우",
      "application을 수정하기 전에 정상 node와 문제 node의 환경 차이를 표준 순서로 비교한다.",
      [
        {label:"격리",text:"node17을 DRAIN하고 reason과 관련 job을 기록한다."},
        {label:"환경 비교",text:"kernel, CPU frequency state, firmware/driver, NUMA topology, NIC link를 정상 node와 비교한다."},
        {label:"재현",text:"같은 benchmark와 binding으로 A/B 측정을 반복한다."},
        {label:"검증",text:"조치 후 동일 benchmark가 baseline 범위로 돌아온 뒤 RESUME한다."}
      ],
      "node-specific regression은 '재부팅하니 나아졌다'가 아니라 어떤 차이가 사라져 baseline으로 복귀했는지를 기록해야 한다."),
    selfCheck:[
      q("DRAIN과 RESUME 사이에 반드시 필요한 단계는?","원인 조치 후 정상 node와 같은 기준으로 health/performance validation을 수행하는 단계다."),
      q("node-specific 문제를 분리하는 가장 직접적인 방법은?","동일 workload와 조건을 정상 node와 문제 node에서 A/B 재현하는 것이다."),
      q("재부팅 전에 evidence를 남겨야 하는 이유는?","재부팅이 kernel log, process state, temporary error condition 등 원인 단서를 없애거나 변경할 수 있기 때문이다.")
    ]
  },

  "cluster-ops": {
    learningObjectives:[
      "HA, provisioning, configuration management, telemetry의 역할을 cluster control-plane 관점에서 구분할 수 있다.",
      "fleet-wide 이상과 single-node drift를 서로 다른 evidence pattern으로 식별할 수 있다.",
      "AA가 직접 인프라를 변경하지 않아도 escalation에 필요한 최소 재현 정보와 영향 범위를 작성할 수 있다."
    ],
    terms:[
      term("High availability","고가용성","한 component failure가 전체 서비스 중단으로 이어지지 않도록 redundancy/failover를 설계하는 방식이다.","HA가 존재해도 failover delay, split-brain prevention, degraded state는 여전히 분석 대상이다."),
      term("Provisioning","프로비저닝","node에 OS/image/base configuration을 배치해 운영 가능한 상태를 만드는 과정이다.","초기 image 차이나 provisioning 실패는 fleet consistency 문제로 이어질 수 있다."),
      term("Configuration management","구성 관리","원하는 설정 상태를 정의하고 여러 node에 일관되게 적용·검증하는 체계다.","수동 변경으로 생긴 drift를 줄이고 재현 가능한 운영 상태를 만든다."),
      term("Telemetry","운영 관측 데이터","metric, log, event, trace 등 cluster 상태를 지속적으로 수집한 데이터다.","개별 ticket을 fleet-wide anomaly와 연결하는 근거가 된다."),
      term("Fleet","노드 집합","동일 역할/정책으로 관리되는 많은 node의 운영 단위다.","한 node의 값보다 cohort 분포와 outlier가 더 중요한 운영 판단 기준이 된다."),
      term("Blast radius","영향 범위","장애나 변경이 영향을 미치는 node, partition, service, user 범위다.","escalation 우선순위와 안전한 변경 계획을 결정한다.")
    ],
    sections:[
      sec("cluster 운영은 개별 node보다 원하는 상태와 실제 상태의 차이를 관리한다",
        "provisioning과 configuration management는 node마다 수동으로 설정하는 대신 fleet의 desired state를 유지하려는 체계다. AA는 이 내부 구현을 모두 운영하지 않더라도 어떤 설정이 일관되어야 하는지 알아야 drift를 의심할 수 있다.",
        "예를 들어 동일 partition의 일부 node만 kernel/driver 버전이 다르고 그 cohort에서만 성능 문제가 생긴다면 application ticket을 configuration drift evidence로 전환해 운영팀에 전달할 수 있다.",
        "운영 관점의 핵심은 한 node의 현재 값보다 fleet 기준선과의 차이다."),
      sec("HA는 장애가 사라지는 것이 아니라 failure mode가 바뀌는 것이다",
        "controller나 storage가 redundancy를 갖더라도 failover 동안 지연, stale state, degraded capacity가 나타날 수 있다. 따라서 'HA 구성'이라는 사실만으로 control-plane 문제를 배제하면 안 된다.",
        "AA는 사건 시각에 active/standby 전환, service restart, network partition 같은 event가 있었는지 telemetry와 운영 로그에서 확인해 user-visible symptom과 연결해야 한다.",
        "HA 환경에서는 component down 여부보다 failover event와 degraded behavior를 함께 본다."),
      sec("좋은 escalation은 재현 조건과 blast radius를 줄여 전달한다",
        "운영팀에 'cluster가 이상하다'고 전달하면 다시 탐색부터 시작해야 한다. 영향을 받은 partition/node cohort, 최초 시각, 정상 비교군, 반복 여부, 관련 configuration difference를 정리하면 조사 시간이 줄어든다.",
        "AA는 application evidence와 infrastructure evidence를 분리해 어떤 팀이 어떤 경계를 확인해야 하는지 제시한다. 이 과정 자체가 RCA 품질을 높인다.",
        "escalation은 추측을 넘기는 것이 아니라 이미 좁힌 evidence boundary를 넘기는 것이다.")
    ],
    example:ex("새 image rollout 뒤 특정 node cohort에서만 GPU job 실패",
      "fleet 전체가 아니라 rollout 대상 cohort에서만 오류가 집중되는지 확인한다.",
      [
        {label:"Scope",text:"실패 node가 동일 image/version cohort에 모이는지 확인한다."},
        {label:"Compare",text:"정상 cohort와 kernel/driver/runtime/module baseline을 비교한다."},
        {label:"Timeline",text:"rollout 시각과 최초 incident 시각을 맞춘다."},
        {label:"Escalate",text:"영향 범위, 재현 workload, 차이 목록을 config-management 담당에 전달한다."}
      ],
      "fleet anomaly는 개별 application log보다 cohort와 change timeline이 더 강한 원인 단서가 될 수 있다."),
    selfCheck:[
      q("HA가 있으면 장애 분석이 필요 없다는 말이 틀린 이유는?","failover와 degraded state 자체가 지연·오류를 만들 수 있고 redundancy component도 공통 원인에 영향을 받을 수 있기 때문이다."),
      q("configuration drift를 찾을 때 한 node만 보는 것이 부족한 이유는?","drift는 기준 cohort와 비교해야 차이인지 정상 값인지 판단할 수 있기 때문이다."),
      q("좋은 escalation에 포함해야 할 최소 정보는?","영향 범위, 최초 시각, 재현 조건, 정상 비교군, 확인된 차이와 이미 배제한 가설이다.")
    ]
  },

  "security": {
    learningObjectives:[
      "identity, permission, ACL, sudo, secret, quota/limit을 서로 다른 보안·운영 경계로 구분할 수 있다.",
      "chmod 777이나 root 실행으로 증상을 우회하지 않고 최소 권한 원칙으로 권한 문제를 진단할 수 있다.",
      "job script, environment, shared filesystem에서 secret과 credential exposure 위험을 설명할 수 있다."
    ],
    terms:[
      term("Least privilege","최소 권한","작업에 필요한 최소 권한만 부여하는 원칙이다.","shared HPC 환경에서 실수나 credential compromise의 영향 범위를 줄인다."),
      term("ACL","Access Control List","기본 owner/group/mode보다 세밀하게 사용자/그룹 권한을 지정하는 파일 접근 제어 방식이다.","팀 공유를 위해 777을 사용하지 않고 필요한 주체만 권한을 부여할 수 있다."),
      term("sudo","Privilege elevation","허용된 명령을 더 높은 권한으로 실행하게 하는 메커니즘이다.","진단을 root로 우회하면 실제 사용자 권한 문제를 가릴 수 있으므로 최소 범위로 사용해야 한다."),
      term("Secret","비밀 정보","API key, token, password, private key처럼 노출되면 인증 권한을 제공하는 정보다.","job script, stdout, Git repository, environment dump에 남지 않도록 관리해야 한다."),
      term("Quota","저장 한도","filesystem에서 사용자/그룹의 사용량 또는 inode 수를 제한하는 정책이다.","ENOSPC처럼 보여도 실제 device capacity가 아니라 quota/inode 제한일 수 있다."),
      term("umask","기본 권한 마스크","새 파일/디렉터리 생성 시 제거할 permission bit를 결정하는 process 설정이다.","협업 디렉터리의 기본 권한이 기대와 다를 때 ACL과 함께 확인해야 한다.")
    ],
    sections:[
      sec("권한 문제는 identity에서 시작해 path 전체를 따라간다",
        "파일 하나의 mode만 보는 것으로는 부족하다. 실제 uid/gid와 supplementary group, 부모 디렉터리 execute 권한, ACL, mount option, quota를 순서대로 확인해야 한다.",
        "sudo로 command를 성공시키면 원래 사용자의 identity와 permission path가 바뀌므로 문제를 해결한 것이 아니라 진단 조건을 바꾼 것일 수 있다.",
        "권한 진단은 identity → path traversal → ACL/mode → quota/policy 순으로 수행한다."),
      sec("shared data는 777 대신 ownership과 group policy를 설계한다",
        "팀 데이터는 owner/group, setgid directory, default ACL, umask를 조합해 새 파일도 협업 정책을 따르게 설계할 수 있다. 모든 사용자에게 write 권한을 여는 방식은 accidental deletion과 tampering 범위를 키운다.",
        "site policy가 정한 project group과 storage convention을 우선 사용하고 예외 권한은 문서화한다. 권한 구조는 운영 convenience보다 reproducibility와 accountability에도 영향을 준다.",
        "협업 권한은 넓게 여는 것이 아니라 지속 가능한 기본값을 만드는 문제다."),
      sec("secret은 실행에 필요하지만 기록에는 남지 않게 해야 한다",
        "token을 job script에 직접 쓰면 script archive, Git history, process environment dump, scheduler metadata를 통해 노출될 수 있다. credential manager나 site-supported secret mechanism을 사용하고 필요 범위를 최소화한다.",
        "진단 과정에서도 env 전체를 ticket에 붙이거나 private key 내용을 복사하지 않는다. 필요한 변수 이름과 존재 여부만 기록하고 값은 redaction한다.",
        "증거 수집은 재현 가능해야 하지만 credential을 복제하는 방식이어서는 안 된다.")
    ],
    example:ex("팀 디렉터리에 새 파일만 서로 수정할 수 없는 문제",
      "기존 파일 하나의 chmod가 아니라 directory의 group/ACL/umask inheritance를 확인한다.",
      [
        {label:"Identity",text:"id로 실제 group membership을 확인한다."},
        {label:"Path",text:"namei/getfacl로 부모 디렉터리와 대상 ACL을 확인한다."},
        {label:"Defaults",text:"directory setgid, default ACL, umask가 새 파일에 어떤 mode를 만드는지 본다."},
        {label:"Policy",text:"project group 기준으로 최소 권한 공유 설정을 정의한다."}
      ],
      "새 파일마다 chmod하는 것은 운영 우회다. 생성 시점부터 올바른 group/ACL이 적용되도록 기본 정책을 수정해야 한다."),
    selfCheck:[
      q("권한 문제에서 sudo로 실행해 성공한 것이 해결이 아닌 이유는?","사용자의 identity와 permission boundary를 바꿔 원래 실패 조건을 우회했기 때문이다."),
      q("shared directory에서 chmod 777 대신 고려할 수 있는 것은?","project group, setgid directory, default ACL, 적절한 umask 같은 group-based sharing 정책이다."),
      q("진단 자료에 environment 전체를 그대로 첨부하면 위험한 이유는?","token, credential, endpoint secret 같은 민감값이 포함될 수 있기 때문이다.")
    ]
  }
});
