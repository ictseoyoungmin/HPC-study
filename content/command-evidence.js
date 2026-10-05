const evidence=(title,command,output,read,branches,note="")=>({title,command,output,read,branches,note});
const point=(field,meaning)=>({field,meaning});
const branch=(when,next)=>({when,next});

export const commandEvidence = Object.freeze({
  "linux-files":[evidence(
    "권한 문자열을 사용자·그룹·기타 권한으로 나눠 읽기",
    "ls -ld project results.dat",
    "drwxr-x--- 2 user hpc 4096 Oct  5 10:20 project\n-rw-r----- 1 user hpc 8421 Oct  5 10:21 results.dat",
    [
      point("첫 글자","d면 디렉터리, -면 일반 파일이다."),
      point("rwx 3묶음","owner / group / other 순서다. project는 other 권한이 없어 외부 사용자는 접근하지 못한다."),
      point("owner·group","user:hpc가 실제 접근 주체와 맞는지 확인한다.")
    ],
    [
      branch("권한 비트는 충분한데 접근이 실패","getfacl로 ACL을 확인하고 상위 디렉터리의 execute 권한도 함께 본다."),
      branch("group이 예상과 다름","id와 newgrp/site account 정책을 확인한 뒤 소유권 변경이 필요한지 판단한다.")
    ],
    "대표 출력 예시다. 실제 소유자·group·timestamp는 시스템마다 다르다."
  )],

  "process-signals":[evidence(
    "STAT와 CPU 사용량으로 runnable·sleep·D-state를 구분하기",
    "ps -eo pid,ppid,stat,pcpu,pmem,comm --sort=-pcpu | head",
    "    PID    PPID STAT %CPU %MEM COMMAND\n  18421   18390 R    98.7  1.2 solver\n  18502   18390 D     0.4  0.3 writer\n  18390       1 Sl    0.1  0.1 launcher",
    [
      point("STAT=R","실행 중이거나 run queue에서 CPU를 기다리는 task다."),
      point("STAT=D","uninterruptible sleep이다. storage/NFS/device wait 가능성을 우선 의심한다."),
      point("%CPU","높은 값은 CPU 사용 증거이지 원인 자체는 아니다. thread 수와 CPU 개수도 함께 본다.")
    ],
    [
      branch("R task가 많고 load도 높음","mpstat/pidstat로 CPU 포화와 runnable queue를 확인한다."),
      branch("D task가 지속","iostat, mount, dmesg, filesystem 상태로 I/O wait 경로를 좁힌다.")
    ],
    "STAT 문자는 kernel/version과 process 상태에 따라 조합될 수 있다."
  )],

  "virtual-memory":[evidence(
    "free가 아니라 available과 swap 동작을 같이 읽기",
    "free -h",
    "               total        used        free      shared  buff/cache   available\nMem:           251Gi       182Gi       5.8Gi       1.1Gi        63Gi        61Gi\nSwap:           16Gi       1.2Gi        14Gi",
    [
      point("free","즉시 미사용 RAM만 보여 주므로 이것만으로 memory pressure를 판단하면 안 된다."),
      point("available","reclaim 가능한 cache 등을 고려한 추정치로 실제 여유 판단에 더 유용하다."),
      point("Swap used","사용량 자체보다 si/so가 계속 증가하는지와 latency 악화 여부를 함께 본다.")
    ],
    [
      branch("available이 충분하고 swap I/O도 없음","memory shortage보다 application working set 또는 다른 병목을 본다."),
      branch("available이 낮고 vmstat si/so가 지속","reclaim/swap pressure를 의심하고 cgroup/job memory limit도 확인한다.")
    ],
    "숫자는 예시이며 host memory 크기와 kernel 정책에 따라 크게 달라진다."
  )],

  "cpu-topology":[evidence(
    "CPU 번호를 socket·core·NUMA node와 연결하기",
    "lscpu -e=CPU,NODE,SOCKET,CORE,ONLINE | head -9",
    "CPU NODE SOCKET CORE ONLINE\n  0    0      0    0    yes\n  1    0      0    1    yes\n  2    0      0    2    yes\n  3    0      0    3    yes\n 64    1      1    0    yes\n 65    1      1    1    yes\n 66    1      1    2    yes\n 67    1      1    3    yes",
    [
      point("CPU","logical CPU 번호다. SMT가 켜져 있으면 한 CORE에 여러 CPU가 매핑될 수 있다."),
      point("SOCKET/CORE","thread binding이 physical core를 공유하는지 판단하는 핵심 열이다."),
      point("NODE","NUMA locality를 CPU placement와 memory placement에 연결할 때 사용한다.")
    ],
    [
      branch("서로 다른 thread가 같은 CORE를 공유","SMT 의도 여부를 확인하고 Slurm --threads-per-core/--cpu-bind를 점검한다."),
      branch("CPU는 node 0인데 memory는 node 1에 집중","numastat/numactl로 remote access 가능성을 검증한다.")
    ]
  )],

  "numa":[evidence(
    "NUMA node별 CPU와 memory 크기를 먼저 지도처럼 읽기",
    "numactl --hardware",
    "available: 2 nodes (0-1)\nnode 0 cpus: 0 1 2 3 4 5 6 7\nnode 0 size: 128000 MB\nnode 0 free: 22000 MB\nnode 1 cpus: 64 65 66 67 68 69 70 71\nnode 1 size: 128000 MB\nnode 1 free: 84000 MB\nnode distances:\nnode   0   1\n  0:  10  21\n  1:  21  10",
    [
      point("node cpus","각 NUMA node에 속한 logical CPU 범위다."),
      point("node free","불균형 자체가 문제는 아니지만 first-touch와 process placement를 함께 볼 단서다."),
      point("distance","local보다 remote node 접근 비용이 더 크다는 topology 정보를 나타낸다.")
    ],
    [
      branch("CPU는 한 node에 묶였는데 memory가 반대 node에 많음","numastat -p PID와 first-touch 초기화 위치를 확인한다."),
      branch("memory가 균형이지만 성능이 나쁨","remote traffic 외 cache/bandwidth/vectorization 가설로 확장한다.")
    ]
  )],

  "mpi-basics":[evidence(
    "rank 수와 실제 실행 위치가 allocation 의도와 맞는지 확인하기",
    "srun -N2 -n4 bash -lc 'printf \"rank=%s host=%s\\n\" \"$SLURM_PROCID\" \"$(hostname)\"' | sort",
    "rank=0 host=cn001\nrank=1 host=cn001\nrank=2 host=cn002\nrank=3 host=cn002",
    [
      point("rank 번호","SLURM_PROCID로 task identity를 확인한다."),
      point("hostname","rank placement가 2개 node에 2개씩 배치됐는지 검증한다."),
      point("정렬 결과","launch 자체가 성공했는지와 placement를 application 실행 전에 빠르게 확인하는 smoke test다.")
    ],
    [
      branch("모든 rank가 한 node에 몰림","allocation의 node/task 수와 --ntasks-per-node, site launch policy를 확인한다."),
      branch("rank 일부가 출력되지 않음","Slurm step 상태와 stderr, MPI bootstrap/PMI 경로를 먼저 본다.")
    ],
    "hostname과 rank 배치는 scheduler 정책 및 옵션에 따라 달라진다."
  )],

  "parallel-filesystems":[evidence(
    "용량 부족과 inode 부족을 분리해서 보기",
    "df -hT /shared; df -i /shared",
    "Filesystem     Type  Size  Used Avail Use% Mounted on\nfs01:/shared    lustre  2.0P  1.7P  310T  85% /shared\nFilesystem       Inodes   IUsed    IFree IUse% Mounted on\nfs01:/shared   900000000 890000000 10000000   99% /shared",
    [
      point("Use%","byte capacity 사용률이다."),
      point("IUse%","file/directory metadata object 수와 연결되는 inode 사용률이다."),
      point("99% inode","공간이 남아 있어도 새 파일 생성이 실패하거나 metadata 성능이 악화될 수 있다.")
    ],
    [
      branch("용량은 여유인데 inode가 거의 소진","small-file workload와 directory 구조를 확인하고 aggregation 전략을 검토한다."),
      branch("inode는 여유인데 throughput이 낮음","striping, request size, concurrency, backend load를 측정한다.")
    ],
    "parallel filesystem은 inode 표현 방식이 다를 수 있다. site 문서와 filesystem 전용 도구를 함께 확인한다."
  )],

  "slurm-basics":[evidence(
    "PENDING 이유를 job 상태보다 Reason 열에서 읽기",
    "squeue -j 481920 -o '%.18i %.2t %.10M %.20R'",
    "             JOBID ST       TIME       NODELIST(REASON)\n            481920 PD       0:00            (Resources)",
    [
      point("ST=PD","job이 아직 실행되지 않았다는 상태다."),
      point("Reason=Resources","요청 자원을 만족하는 node가 현재 즉시 가용하지 않다는 뜻이다."),
      point("TIME=0:00","실행 시간이 아니라 아직 step이 시작되지 않았음을 확인한다.")
    ],
    [
      branch("Reason=Resources","ReqTRES, node 상태, partition 가용성을 비교한다."),
      branch("Reason=Priority","sprio와 QoS/account/age 정책을 확인하고 단순 자원 부족과 구분한다."),
      branch("Reason=Dependency","dependency target job 상태부터 확인한다.")
    ]
  )],

  "slurm-resources":[evidence(
    "요청한 memory와 실제 peak RSS를 비교해 right-sizing 단서 찾기",
    "sacct -j 481920 --format=JobID,State,Elapsed,AllocCPUS,ReqMem,MaxRSS,ExitCode",
    "JobID           State    Elapsed  AllocCPUS     ReqMem     MaxRSS ExitCode\n481920      COMPLETED   01:12:44         32       64Gn                 0:0\n481920.batch COMPLETED   01:12:44          1                    11.8G      0:0",
    [
      point("ReqMem","job이 scheduler에 요청한 memory다. suffix와 per-node/per-cpu 의미는 site/version 설정을 확인한다."),
      point("MaxRSS","accounting이 수집한 peak resident memory다. step별로 표시될 수 있다."),
      point("AllocCPUS","성능뿐 아니라 queue fragmentation/right-sizing 판단에도 필요한 allocation 규모다.")
    ],
    [
      branch("ReqMem이 MaxRSS보다 반복적으로 매우 큼","안전 margin과 입력 변동성을 고려해 memory request 축소 가능성을 검토한다."),
      branch("OOM인데 MaxRSS가 요청량보다 작게 보임","step/cgroup accounting 범위, sampling, memory limit 단위를 확인한다.")
    ],
    "accounting plugin과 Slurm 버전에 따라 MaxRSS가 비어 있거나 집계 방식이 달라질 수 있다."
  )],

  "perf-method":[evidence(
    "벽시계 시간과 CPU utilization을 함께 읽어 baseline 만들기",
    "/usr/bin/time -v ./solver input.dat",
    "\tElapsed (wall clock) time (h:mm:ss or m:ss): 0:42.18\n\tUser time (seconds): 320.41\n\tSystem time (seconds): 8.62\n\tPercent of CPU this job got: 780%\n\tMaximum resident set size (kbytes): 18342120",
    [
      point("Elapsed","사용자가 체감하는 end-to-end wall time baseline이다."),
      point("User+System","여러 thread/process의 CPU time이 합산될 수 있어 elapsed보다 클 수 있다."),
      point("Percent CPU","약 780%면 평균적으로 약 7.8개 CPU를 사용한 셈이지만 thread placement와 phase 변화는 별도 확인이 필요하다."),
      point("Max RSS","입력과 실행 조건을 고정한 memory baseline으로 사용한다.")
    ],
    [
      branch("wall time만 악화되고 CPU%가 크게 하락","I/O, synchronization, scheduler interference, upstream wait 가설을 확인한다."),
      branch("CPU%는 유사한데 wall time이 악화","IPC/frequency/cache/NUMA 또는 code path 변화를 profile한다.")
    ],
    "GNU time 형식 예시다. locale과 구현에 따라 label이 달라질 수 있다."
  )],

  "perf-pmu":[evidence(
    "cycles·instructions로 IPC를 계산하고 branch/cache 단서를 함께 보기",
    "perf stat -e cycles,instructions,branches,branch-misses,cache-misses ./solver input.dat",
    "   98,400,000,000      cycles\n  142,680,000,000      instructions              # 1.45  insn per cycle\n   12,900,000,000      branches\n      116,100,000      branch-misses             # 0.90% of all branches\n    1,820,000,000      cache-misses\n\n      42.210384321 seconds time elapsed",
    [
      point("IPC","instructions / cycles의 거친 효율 지표다. workload phase와 CPU architecture를 고정해야 비교 의미가 생긴다."),
      point("branch-miss ratio","control-flow 병목 가능성의 단서지만 단독 root cause는 아니다."),
      point("cache-misses","어떤 cache level인지와 memory bandwidth를 함께 봐야 해석할 수 있다.")
    ],
    [
      branch("elapsed 악화와 IPC 하락이 재현","sampling으로 hot function과 stall 원인을 좁힌다."),
      branch("IPC는 동일하지만 elapsed 증가","frequency throttling, CPU placement, external wait를 확인한다.")
    ],
    "PMU event 지원과 권한은 CPU/kernel/perf_event_paranoid 설정에 따라 달라진다."
  )],

  "gpu-basics":[evidence(
    "GPU utilization·memory 사용량·power를 한 줄로 확인하기",
    "nvidia-smi --query-gpu=index,name,utilization.gpu,memory.used,memory.total,power.draw --format=csv,noheader,nounits",
    "0, NVIDIA H100 PCIe, 92, 62314, 81559, 315.42\n1, NVIDIA H100 PCIe, 7, 1208, 81559, 74.18",
    [
      point("utilization.gpu","sampling window 동안 GPU가 busy였던 비율이다. kernel 효율을 직접 의미하지는 않는다."),
      point("memory.used","capacity 사용량이다. memory bandwidth 사용률과는 다른 지표다."),
      point("power.draw","높은 compute activity나 clock state의 보조 단서로 사용한다.")
    ],
    [
      branch("한 GPU만 90%+, 다른 GPU는 idle","rank-to-GPU mapping과 CUDA_VISIBLE_DEVICES, process placement를 확인한다."),
      branch("모든 GPU util이 낮음","CPU preprocessing, H2D, synchronization, I/O, communication timeline을 먼저 확인한다.")
    ],
    "GPU 모델과 driver에 따라 지원 query field가 다를 수 있다."
  )],

  "runbook-pending":[evidence(
    "PENDING을 자원·우선순위·제약 조건으로 분류하기",
    "scontrol show job 481920 | grep -E 'JobState|Reason|Partition|ReqTRES|NumNodes|NumCPUs'",
    "   JobState=PENDING Reason=Resources Dependency=(null)\n   NumNodes=4 NumCPUs=256 Partition=compute\n   ReqTRES=cpu=256,mem=512G,node=4,billing=256",
    [
      point("Reason","첫 분기 기준이다. Resources, Priority, Dependency, QOS 등의 원인을 먼저 나눈다."),
      point("ReqTRES","요청 자원 크기와 type을 실제 가용 node와 비교한다."),
      point("NumNodes/NumCPUs","큰 job일수록 contiguous/동시 가용 자원 요구 때문에 대기 시간이 늘 수 있다.")
    ],
    [
      branch("Resources","sinfo와 node state, 요청 constraint/GPU/memory 조건을 비교한다."),
      branch("Priority","sprio/QoS/account policy를 확인한다."),
      branch("Dependency","선행 job과 dependency expression을 확인한다.")
    ]
  )],

  "runbook-oom":[evidence(
    "Slurm 종료 상태와 memory peak를 함께 읽어 OOM 여부 확인하기",
    "sacct -j 481921 --format=JobID,State,ExitCode,ReqMem,MaxRSS,Elapsed",
    "JobID              State ExitCode     ReqMem     MaxRSS    Elapsed\n481921       OUT_OF_MEMORY      0:125       32Gn              00:18:07\n481921.batch OUT_OF_MEMORY      0:125                 31.7G   00:18:07",
    [
      point("State=OUT_OF_MEMORY","scheduler/accounting 관점의 강한 OOM 증거다."),
      point("MaxRSS≈ReqMem","실제 resident set이 limit에 근접했을 가능성을 지지한다."),
      point("ExitCode","signal/step 종료 맥락을 추가로 확인하는 단서다.")
    ],
    [
      branch("MaxRSS가 limit에 근접","입력별 memory scaling과 per-rank/thread memory를 측정해 요청량 또는 algorithm을 조정한다."),
      branch("MaxRSS가 낮은데 OOM","cgroup scope, step별 memory, GPU memory, tmpfs/page cache 같은 다른 limit 경로를 확인한다.")
    ]
  )],

  "workloads":[evidence(
    "job accounting을 resource signature의 첫 행으로 만들기",
    "sacct -j 481930 --format=JobID,Elapsed,AllocCPUS,ReqTRES,MaxRSS,State",
    "JobID         Elapsed AllocCPUS                ReqTRES     MaxRSS      State\n481930       02:04:18       128 cpu=128,mem=256G,node=4             COMPLETED\n481930.batch 02:04:18         1                          18.4G      COMPLETED",
    [
      point("Elapsed","전체 runtime signature다. phase별 변화는 telemetry/profile로 추가 분해한다."),
      point("AllocCPUS/ReqTRES","workload가 어떤 자원을 얼마나 예약했는지 나타낸다."),
      point("MaxRSS","memory pressure 가설의 시작점이다. network/I/O/GPU signature는 별도 metric이 필요하다.")
    ],
    [
      branch("CPU allocation은 큰데 CPU utilization이 낮음","network/I/O/synchronization/upstream wait axis를 측정한다."),
      branch("MaxRSS가 request에 근접","memory-bound 또는 memory-capacity risk를 우선 검토한다.")
    ]
  )],

  "regression":[evidence(
    "성능 비교 전에 환경 fingerprint가 같은지 확인하기",
    "printf 'kernel='; uname -r; lscpu | grep 'Model name'; module list 2>&1 | tail -n +1",
    "kernel=6.8.0-57-generic\nModel name: AMD EPYC 9654 96-Core Processor\nCurrently Loaded Modules:\n  1) gcc/14.2.0   2) openmpi/5.0.5   3) hdf5/1.14.4",
    [
      point("kernel","scheduler, driver, PMU, I/O behavior 등 환경 변화 가능성을 추적한다."),
      point("CPU model","서로 다른 microarchitecture 결과를 직접 비교하는 실수를 막는다."),
      point("module set","compiler/MPI/library 변경이 regression의 독립 변수인지 확인한다.")
    ],
    [
      branch("fingerprint가 다름","성능 회귀 결론 전에 환경을 맞추거나 변경점을 독립 변수로 명시한다."),
      branch("fingerprint가 같고 반복 측정에서도 느림","profile/counter diff로 code path 또는 runtime behavior 변화를 좁힌다.")
    ],
    "출력 예시는 특정 배포판/CPU를 가정한 대표 형식이며 실제 환경 fingerprint는 사이트마다 다르다."
  )],

  "ticket-postmortem":[evidence(
    "ticket 첫 메시지에 시각·host·scheduler context를 남기기",
    "date -Is; hostname; env | grep -E '^(SLURM|OMP|CUDA)_' | sort",
    "2026-10-05T22:41:18+09:00\ncn042\nCUDA_VISIBLE_DEVICES=0\nOMP_NUM_THREADS=16\nSLURM_JOB_ID=481940\nSLURM_JOB_NUM_NODES=2\nSLURM_NTASKS=8",
    [
      point("timestamp","로그/monitoring/accounting을 같은 시간축에 맞추는 기준점이다."),
      point("hostname","node-specific failure인지 확인할 수 있게 한다."),
      point("scheduler/runtime env","job allocation과 thread/GPU visibility를 재현 정보로 남긴다.")
    ],
    [
      branch("재현 시 host가 바뀌면 증상이 사라짐","node-local hardware/configuration 차이를 조사한다."),
      branch("동일 allocation/env에서도 재현","application/input/library 경로를 다음 독립 변수로 좁힌다.")
    ],
    "민감한 token·secret·전체 환경 변수를 ticket에 그대로 첨부하지 않는다. 필요한 key만 선별한다."
  )]
});

export function commandEvidenceForChapter(chapterId){
  return commandEvidence[chapterId] || [];
}

export const commandEvidenceChapterIds = Object.freeze(Object.keys(commandEvidence));
