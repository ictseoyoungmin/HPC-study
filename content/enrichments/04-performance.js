const term=(term,en,definition,why)=>({term,en,definition,why});
const sec=(title,p1,p2,takeaway)=>({title,paragraphs:[p1,p2],takeaway});
const q=(question,answer)=>({question,answer});
const ex=(title,intro,steps,conclusion)=>({title,intro,steps,conclusion});

export const enhancements = Object.freeze({
  "scaling": {
    learningObjectives:[
      "scale-up/down/out/in과 strong/weak scaling을 서로 다른 의사결정 축으로 구분할 수 있다.",
      "capacity 부족과 parallel efficiency 저하를 같은 문제로 취급하지 않고 필요한 증거를 분리할 수 있다.",
      "runtime, queue wait, resource utilization, memory footprint, communication cost를 함께 보며 right-sizing 결정을 설명할 수 있다."
    ],
    terms:[
      term("Scale-up","Vertical scaling","한 Node 또는 한 resource domain 안에서 CPU, memory, GPU 같은 자원 용량을 늘리는 선택이다.","문제가 단일 Node의 memory capacity나 accelerator capacity에 막힐 때 scale-out보다 먼저 고려될 수 있다."),
      term("Scale-down","Vertical right-sizing","요청하거나 사용하는 단일 Node 자원량을 줄이는 선택이다.","과도한 resource request는 queue wait와 utilization을 악화시킬 수 있으므로 실제 사용량과 요청량을 비교해야 한다."),
      term("Scale-out","Horizontal scaling","여러 Node 또는 여러 worker를 추가해 병렬 자원 수를 늘리는 선택이다.","계산 자원은 늘지만 communication, synchronization, distributed I/O도 함께 늘 수 있다."),
      term("Scale-in","Horizontal right-sizing","필요 이상의 Node/worker 수를 줄여 resource footprint와 coordination cost를 낮추는 선택이다.","더 많은 Node가 오히려 느려지는 지점에서는 scale-in이 성능과 효율을 동시에 개선할 수 있다."),
      term("Right-sizing","자원 적정화","workload가 실제로 필요로 하는 CPU, memory, GPU, Node 수에 resource request를 맞추는 과정이다.","성능만이 아니라 queue wait, fairness, cluster throughput까지 영향을 준다.")
    ],
    sections:[
      sec("Scaling이라는 말에는 서로 다른 두 질문이 섞이기 쉽다",
        "운영 관점의 scale-up/down/out/in은 어떤 형태의 자원을 얼마나 배치할지 묻는다. 반면 strong/weak scaling은 problem size와 processor 수를 어떻게 바꾸며 runtime이 어떻게 달라지는지 측정하는 실험 방법이다.",
        "예를 들어 memory capacity가 부족해 더 큰 memory Node를 선택하는 것은 scale-up이다. 같은 input을 2, 4, 8 Node로 실행해 speedup curve를 만드는 것은 strong scaling이다. 둘을 같은 말로 쓰면 원인 분석과 실험 설계가 섞인다.",
        "먼저 자원 배치 문제인지 성능 실험 문제인지 구분한 뒤 숫자를 해석한다."),
      sec("Capacity 부족과 efficiency 저하는 다른 증거를 요구한다",
        "OOM이나 GPU memory 부족처럼 capacity가 명확히 모자란 경우에는 peak usage, limit, allocation을 확인한다. 반면 Node 수를 늘릴수록 runtime이 잘 줄지 않는 문제는 communication, synchronization, imbalance, I/O 비중을 봐야 한다.",
        "자원 요청이 크다고 해서 항상 빠른 것도 아니다. 더 큰 partition이나 더 많은 Node를 요구하면 queue wait가 길어지고 topology가 넓어져 communication cost가 늘 수 있다. 따라서 end-to-end time을 볼 때 queue time과 run time을 분리해 기록해야 한다.",
        "자원 부족은 capacity 지표로, 확장성 문제는 efficiency와 overhead 지표로 판단한다."),
      sec("Right-sizing은 한 번의 MaxRSS 숫자로 끝나지 않는다",
        "CPU utilization, MaxRSS, GPU memory, elapsed time을 반복 run에서 함께 본다. input size와 thread/rank 배치가 달라지면 같은 request라도 의미가 달라질 수 있으므로 workload class별 baseline이 필요하다.",
        "scale-down/in 후보는 단순 절약이 아니라 queue wait 감소와 scheduling flexibility 개선으로 이어질 수 있다. 반대로 너무 공격적으로 줄이면 memory pressure, oversubscription, longer runtime이 생길 수 있으므로 변경 후 동일 protocol로 다시 측정한다.",
        "Right-sizing은 request와 실제 사용량, runtime, queue wait의 반복 비교 과정이다.")
    ],
    example:ex("32 Node보다 16 Node가 더 빨랐던 MPI Job",
      "Node 수를 줄였더니 runtime이 줄었다면 계산량이 부족해진 것이 아니라 추가 Node의 overhead가 유용한 병렬 작업보다 커졌을 가능성을 조사한다.",
      [
        {label:"Runtime curve",text:"8/16/32 Node의 median runtime과 speedup, efficiency를 비교한다."},
        {label:"통신 비중",text:"MPI profile 또는 phase timing으로 collective와 point-to-point 시간이 늘었는지 본다."},
        {label:"I/O와 imbalance",text:"rank별 종료 시각과 I/O 시간을 비교해 tail rank가 생기는지 확인한다."},
        {label:"운영 영향",text:"queue wait와 node-hour까지 포함해 16 Node가 실제로 더 나은 선택인지 판단한다."}
      ],
      "Scale-in이 성공한 사례는 '적은 자원이 항상 좋다'는 뜻이 아니라 해당 workload의 useful work와 overhead 균형이 16 Node에서 더 좋았다는 뜻이다."),
    selfCheck:[
      q("scale-out과 strong scaling은 왜 같은 말이 아닌가?","scale-out은 자원 배치 선택이고 strong scaling은 전체 problem size를 고정한 성능 실험이기 때문이다."),
      q("Node 수를 늘렸는데 runtime이 줄지 않을 때 가장 먼저 구분할 두 범주는?","capacity 부족인지, communication·synchronization·I/O·imbalance로 parallel efficiency가 떨어지는지 구분해야 한다."),
      q("right-sizing에서 MaxRSS만으로 memory request를 바로 줄이면 위험한 이유는?","input variation, peak timing, page cache, cgroup limit, 반복 run 변동을 반영하지 못할 수 있기 때문이다.")
    ]
  },

  "strong-weak": {
    learningObjectives:[
      "strong scaling과 weak scaling의 고정 변수와 변화 변수를 정확히 설명할 수 있다.",
      "speedup과 parallel efficiency를 계산하고 curve가 꺾이는 지점을 overhead 관점에서 해석할 수 있다.",
      "Amdahl과 Gustafson 모델의 질문이 서로 다르며 실제 communication/I/O 비용은 별도로 측정해야 함을 설명할 수 있다."
    ],
    terms:[
      term("Strong scaling","강한 확장성","전체 problem size를 고정한 채 worker 수를 늘려 runtime 감소를 측정하는 실험이다.","한 문제를 더 빨리 끝내는 능력을 평가할 때 사용한다."),
      term("Weak scaling","약한 확장성","worker당 problem size를 거의 일정하게 유지하면서 worker 수와 전체 problem size를 함께 늘리는 실험이다.","시스템 규모가 커질 때 같은 단위 작업을 얼마나 안정적으로 처리하는지 본다."),
      term("Speedup","가속비","일반적으로 strong scaling에서 S(N)=T(1)/T(N)으로 정의하는 성능 비율이다.","runtime 감소를 자원 증가량과 직접 비교할 수 있다."),
      term("Efficiency","병렬 효율","E(N)=S(N)/N으로 추가한 worker가 이상적 성능에 얼마나 가까이 기여했는지 나타낸다.","speedup이 계속 증가해도 efficiency는 빠르게 하락할 수 있다."),
      term("Serial fraction","직렬 비율","전체 수행 시간 중 병렬 worker 증가로 줄지 않는 부분을 모델링한 비율이다.","Amdahl 관점에서 worker 수를 계속 늘려도 남는 speedup 상한을 만든다."),
      term("Overhead","병렬 오버헤드","communication, synchronization, scheduling, imbalance, extra I/O처럼 병렬화로 새로 생기거나 증가하는 비용이다.","실제 curve가 이론 모델보다 일찍 꺾이는 원인을 설명할 때 핵심이다.")
    ],
    sections:[
      sec("Strong scaling은 같은 문제를 더 잘 나누는 실험이다",
        "입력 크기와 계산량을 고정하고 worker 수만 늘린다. 이상적이면 N배의 worker가 runtime을 1/N로 줄이지만 실제로는 serial section과 parallel overhead 때문에 감소 폭이 작아진다.",
        "실험에서는 T(N)만 나열하지 말고 speedup과 efficiency를 함께 계산한다. runtime이 조금 줄어도 efficiency가 크게 떨어진다면 더 많은 resource가 cluster 전체 관점에서는 비효율적일 수 있다.",
        "Strong scaling의 핵심은 input 고정과 efficiency curve다."),
      sec("Weak scaling은 문제도 함께 커지는 실험이다",
        "worker당 맡는 work를 비슷하게 유지하고 worker 수에 비례해 전체 problem size를 늘린다. 이상적이면 worker가 늘어도 runtime이 비슷하게 유지된다.",
        "실제로는 network diameter, collective cost, metadata pressure, global synchronization이 커지면서 runtime이 증가할 수 있다. 따라서 weak scaling 결과도 단일 숫자가 아니라 어떤 overhead가 scale에 따라 늘었는지 함께 기록해야 한다.",
        "Weak scaling은 worker당 work를 고정하고 시스템 규모 증가의 비용을 본다."),
      sec("Amdahl과 Gustafson은 서로 다른 질문을 한다",
        "Amdahl은 고정된 전체 문제에서 직렬 비율이 speedup의 상한을 만든다는 점을 강조한다. 그래서 strong scaling 한계를 생각할 때 유용하다.",
        "Gustafson은 processor 수가 늘면 전체 problem size도 키울 수 있다는 관점에서 병렬 부분의 가치가 커질 수 있음을 설명한다. 두 모델 모두 실제 network, memory, filesystem overhead를 자동으로 포함하지 않으므로 측정값과 모델을 구분해야 한다.",
        "수학 모델은 측정 결과를 설명하는 기준선이지 실제 cluster의 runtime 예측기가 아니다."),
      sec("Curve가 꺾이는 지점이 다음 측정의 출발점이다",
        "N=1,2,4,8,16에서 efficiency가 90%, 84%, 70%, 42%로 떨어진다면 8→16 구간에서 무엇이 달라졌는지 조사한다. rank placement, communication volume, collective time, memory bandwidth, I/O를 같은 실험 protocol로 비교한다.",
        "curve의 knee는 '16 Node는 나쁘다'는 결론이 아니라 추가 자원의 marginal benefit이 급격히 줄어드는 지점이다. workload와 input이 달라지면 knee도 달라질 수 있다.",
        "Scaling curve는 병목을 끝내는 결론이 아니라 더 깊은 profiling을 시작할 좌표다.")
    ],
    example:ex("8→16 rank에서 efficiency가 급락한 경우",
      "T1=160s, T8=24s, T16=18s라면 speedup은 증가하지만 8→16의 추가 자원 효율은 크게 낮다.",
      [
        {label:"계산",text:"S8=6.67, E8≈83%; S16=8.89, E16≈56%로 계산한다."},
        {label:"구간 비교",text:"compute/communication/I/O phase time을 8과 16 rank에서 비교한다."},
        {label:"placement",text:"rank가 다른 socket/node로 퍼지며 latency나 NUMA path가 바뀌었는지 확인한다."},
        {label:"결정",text:"runtime 6초 감소가 node-hour와 queue impact에 비해 가치가 있는지 평가한다."}
      ],
      "Scaling 판단은 '더 빨라졌다'보다 추가 자원이 얼마나 효율적으로 시간을 줄였는가를 묻는다."),
    selfCheck:[
      q("strong scaling에서 절대 바꾸면 안 되는 핵심 변수는?","전체 problem size 또는 동일 input 조건이다."),
      q("speedup이 증가하는데 efficiency가 감소할 수 있는가?","가능하다. speedup 증가율이 worker 수 증가율보다 느리면 efficiency는 감소한다."),
      q("Amdahl 식만으로 실제 MPI network overhead를 계산할 수 있는가?","아니다. Amdahl은 serial fraction에 따른 이상적 한계를 보는 모델이며 실제 communication과 I/O 비용은 별도 측정이 필요하다.")
    ]
  },

  "perf-method": {
    learningObjectives:[
      "성능 질문을 재현 가능한 가설과 측정 지표로 바꾸는 절차를 설명할 수 있다.",
      "warm-up, cache state, CPU frequency, placement, background load 같은 통제 변수를 기록할 수 있다.",
      "한 번의 best run보다 반복 측정의 median, spread, outlier를 이용해 변경 효과를 판단할 수 있다.",
      "correctness와 performance를 함께 검증해 빠르지만 잘못된 결과를 성능 개선으로 보고하지 않을 수 있다."
    ],
    terms:[
      term("Baseline","기준 측정","변경 전 정상 조건에서 얻은 비교 기준이다.","성능 숫자는 단독으로 의미가 약하고 동일 조건의 baseline과 비교해야 변화량을 해석할 수 있다."),
      term("Controlled variable","통제 변수","실험에서 의도적으로 고정하는 input, thread 수, placement, software version 같은 조건이다.","여러 변수가 동시에 바뀌면 어떤 변화가 결과를 만들었는지 설명하기 어렵다."),
      term("Warm-up","준비 반복","JIT, cache, filesystem cache, allocator 초기화처럼 첫 실행에만 큰 비용이 있을 수 있어 본 측정 전에 상태를 안정화하는 절차다.","첫 run과 steady-state run을 섞으면 noise를 개선 효과로 오해할 수 있다."),
      term("Wall time","경과 시간","사용자가 시작부터 종료까지 기다린 실제 시간이다.","CPU time과 달리 I/O wait, synchronization, scheduler wait 같은 시간을 포함한다."),
      term("Median","중앙값","정렬된 반복 측정의 가운데 값이다.","일시적인 system noise나 outlier가 있는 환경에서 평균보다 대표값으로 안정적일 수 있다."),
      term("Variance / spread","변동 폭","반복 run 사이의 흔들림 정도다.","개선 폭이 자연 변동보다 작다면 성능 향상이라고 결론 내리기 어렵다.")
    ],
    sections:[
      sec("성능 측정은 먼저 질문을 한 문장으로 만든다",
        "'코드가 느리다'는 측정 가능한 질문이 아니다. '동일 input과 동일 16 thread 조건에서 변경 B가 baseline A보다 median wall time을 10% 이상 줄이는가'처럼 조건, 지표, 비교 대상을 명시해야 한다.",
        "질문이 명확하면 어떤 변수를 고정하고 무엇을 바꿀지 결정할 수 있다. 반대로 profiler부터 실행하면 많은 숫자를 얻지만 원래 질문과 관계없는 정보를 해석하게 되기 쉽다.",
        "측정 도구보다 먼저 가설과 비교 조건을 적는다."),
      sec("환경을 기록하지 않으면 재현 가능한 benchmark가 아니다",
        "CPU affinity, governor/frequency, NUMA placement, compiler flags, library version, input data, filesystem cache 상태는 결과에 영향을 줄 수 있다. shared cluster에서는 같은 node라도 background activity와 thermal state가 다를 수 있다.",
        "모든 변수를 완벽히 통제할 수는 없지만 적어도 기록해야 한다. 반복 측정에서 특정 node나 시간대만 이상하게 느리다면 환경 metadata가 원인을 좁히는 단서가 된다.",
        "통제할 수 없는 변수도 기록하면 noise를 설명할 수 있다."),
      sec("반복 측정은 대표값과 변동을 함께 본다",
        "한 번의 best run은 cache hit나 일시적 idle 상태를 반영할 수 있다. 최소 여러 번 반복하고 median, min/max 또는 percentile을 함께 기록하면 변경 효과와 자연 변동을 분리하기 쉽다.",
        "두 버전 차이가 2%인데 run-to-run spread가 8%라면 개선이라고 주장하기 어렵다. 반대로 20% 개선이 반복 run에서 일관되면 더 강한 증거가 된다.",
        "효과 크기는 noise 크기보다 충분히 커야 한다."),
      sec("Correctness는 performance 실험의 일부다",
        "compiler optimization, parallel reduction 순서, algorithm 변경은 결과 정확도나 numerical tolerance를 바꿀 수 있다. 빠른 run이 잘못된 계산을 했으면 성능 개선이 아니다.",
        "benchmark harness에는 exit status, output checksum 또는 domain-specific validation을 포함해 측정 전후 correctness를 확인한다. 특히 실패한 run의 짧은 runtime이 통계에 들어가지 않도록 해야 한다.",
        "성능 비교의 첫 조건은 같은 일을 올바르게 했다는 증거다.")
    ],
    example:ex("최적화 후 7% 빨라졌다는 결과 검토",
      "baseline 5회와 변경 버전 5회를 비교했는데 각각의 run 변동이 크다면 7%라는 숫자를 바로 개선으로 보고하지 않는다.",
      [
        {label:"조건 고정",text:"input, binary, thread count, binding, node type이 동일한지 확인한다."},
        {label:"분포 확인",text:"median과 range를 계산하고 두 분포가 얼마나 겹치는지 본다."},
        {label:"이상치 조사",text:"유난히 느린 run의 node, load, I/O 상태를 확인한다."},
        {label:"재검증",text:"필요하면 반복 수를 늘리고 correctness check를 포함해 다시 측정한다."}
      ],
      "성능 개선은 한 번의 빠른 실행이 아니라 통제된 조건에서 반복적으로 나타나는 차이여야 한다."),
    selfCheck:[
      q("baseline 없이 새 버전 runtime 42초라는 숫자만으로 개선을 판단할 수 있는가?","없다. 같은 조건의 비교 기준과 변동 범위가 있어야 변화량을 해석할 수 있다."),
      q("왜 warm-up run과 측정 run을 구분하는가?","첫 실행에만 발생하는 cache, allocator, JIT, filesystem 상태 변화가 steady-state 성능을 왜곡할 수 있기 때문이다."),
      q("median 차이가 3%인데 run spread가 10%라면 어떤 결론이 적절한가?","현재 증거만으로 의미 있는 개선이라고 단정하기 어렵고 반복 수 확대와 noise 원인 통제가 필요하다.")
    ]
  },

  "perf-pmu": {
    learningObjectives:[
      "wall-time 확인에서 perf stat, sampling profile, source-level 분석으로 내려가는 profiling ladder를 설명할 수 있다.",
      "cycles, instructions, IPC, cache miss, branch miss 같은 counter를 단독 원인으로 해석하지 않고 비교 지표로 사용할 수 있다.",
      "sampling, symbol resolution, counter multiplexing, permission 제한이 profile 해석에 미치는 영향을 설명할 수 있다."
    ],
    terms:[
      term("PMU","Performance Monitoring Unit","CPU가 cycles, retired instructions, cache/branch event 같은 hardware event를 계수할 수 있도록 제공하는 하드웨어 기능이다.","perf stat의 많은 hardware counter가 PMU에서 오지만 CPU model별 event 의미와 지원 범위가 다르다."),
      term("IPC","Instructions Per Cycle","retired instructions를 cycles로 나눈 비율이다.","낮은 IPC는 stall 가능성을 시사하지만 workload 특성과 instruction mix를 함께 봐야 한다."),
      term("Sampling","샘플링","일정 event나 주기마다 현재 instruction pointer와 call stack을 표본으로 기록하는 방식이다.","전체 실행을 trace하지 않고도 시간이 많이 소비된 code path를 찾을 수 있다."),
      term("Call stack","호출 스택","현재 함수가 어떤 호출 경로를 통해 실행되었는지를 나타내는 stack frame 체인이다.","hot function이 어떤 상위 call path에서 발생했는지 이해하려면 stack 정보가 필요하다."),
      term("Multiplexing","카운터 다중화","동시에 측정 가능한 hardware counter 수보다 더 많은 event를 요청할 때 kernel이 시간을 나눠 counter를 측정하는 방식이다.","scaled count와 측정 비율을 확인하지 않으면 정밀한 비교를 과신할 수 있다."),
      term("Flame graph","스택 집계 시각화","sampling된 stack을 동일 call path별로 합쳐 폭으로 빈도를 나타내는 시각화다.","시간 순서가 아니라 누적 stack 분포를 보여 주므로 timeline trace와 다르게 읽어야 한다.")
    ],
    sections:[
      sec("Profiler는 wall-time 회귀를 확인한 뒤 사용한다",
        "먼저 동일 protocol에서 regression이 실제로 존재하는지 확인한다. noise 수준과 비슷한 차이에 복잡한 profile을 적용하면 도구 overhead와 측정 편차가 오히려 해석을 어렵게 한다.",
        "회귀가 재현되면 perf stat 같은 aggregate counter로 CPU-bound, branch-heavy, cache-sensitive 후보를 좁히고, 그 다음 perf record/report로 hot call path를 찾는다.",
        "측정→가설→더 구체적인 profile 순으로 해상도를 높인다."),
      sec("Counter 하나는 원인이 아니라 증거 조각이다",
        "낮은 IPC는 cache miss, branch misprediction, dependency chain, frontend starvation 등 여러 원인에서 나타날 수 있다. 높은 cache-miss 비율도 실제 latency hiding이나 bandwidth 상황에 따라 영향이 다르다.",
        "따라서 baseline과 변경 버전에서 관련 counter 묶음을 함께 비교하고 code path와 연결한다. CPU model이 다르면 event 정의와 counter 수가 달라질 수 있으므로 raw count의 단순 비교도 주의해야 한다.",
        "Counter는 상관관계를 보여 주는 관찰값이지 자동 root cause 판정기가 아니다."),
      sec("Sampling profile은 symbol과 stack 품질에 의존한다",
        "perf record -g는 sampled stack을 이용해 hot path를 보여 주지만 stripped binary, frame pointer omission, missing debug info 때문에 stack이 잘리거나 symbol이 주소로만 보일 수 있다.",
        "profile build를 별도로 만들거나 debug symbol을 보존하고, 최적화 수준이 production과 너무 다르면 code shape가 달라질 수 있다는 점도 기록한다. profile 결과는 실제 build configuration과 함께 보관해야 한다.",
        "좋은 profile은 도구 명령보다 symbol과 build metadata까지 포함한다."),
      sec("Flame graph는 넓이를 보고, 시간 순서로 읽지 않는다",
        "flame graph에서 폭은 sample 비중을 나타내고 세로 방향은 call depth를 나타낸다. 왼쪽에서 오른쪽이 시간 순서는 아니다.",
        "어떤 함수가 넓게 보여도 최적화 대상인지 판단하려면 self cost와 caller/callee 관계, algorithm 역할을 함께 봐야 한다. 짧지만 critical latency path인 함수는 sample 비중이 작아도 중요할 수 있다.",
        "Flame graph는 hot stack 분포를 보는 도구이며 timeline trace의 대체물이 아니다.")
    ],
    example:ex("새 버전에서 IPC가 30% 감소한 경우",
      "IPC 감소만으로 memory bottleneck이라고 결론 내리지 않고 counter와 profile을 단계적으로 연결한다.",
      [
        {label:"회귀 확인",text:"동일 input과 affinity에서 wall time 증가가 반복되는지 확인한다."},
        {label:"Counter 묶음",text:"cycles, instructions, cache/branch event를 baseline과 함께 비교한다."},
        {label:"Hot path",text:"perf record/report로 새 버전에서 sample이 늘어난 함수와 stack을 확인한다."},
        {label:"가설 검증",text:"source 변경과 memory/branch behavior를 연결한 뒤 수정 후 같은 protocol로 다시 측정한다."}
      ],
      "IPC는 방향을 알려주는 지표이고 root cause는 code path와 추가 증거를 연결해 확정한다."),
    selfCheck:[
      q("낮은 IPC가 곧 memory-bound라는 뜻인가?","아니다. cache miss, branch, dependency, frontend 문제 등 여러 원인이 가능하므로 다른 counter와 profile을 함께 봐야 한다."),
      q("perf stat과 perf record의 역할 차이는?","perf stat은 실행 전체의 counter 요약을 제공하고 perf record는 sampling을 통해 hot instruction/call stack 위치를 기록한다."),
      q("flame graph의 가로축을 시간으로 읽으면 왜 안 되는가?","가로 배치는 집계된 stack 폭을 표현할 뿐 실제 시간 순서를 나타내지 않기 때문이다.")
    ]
  },

  "roofline": {
    learningObjectives:[
      "arithmetic intensity와 compute roof, memory bandwidth roof의 관계를 설명할 수 있다.",
      "ridge point를 계산하고 workload가 memory-bound 후보인지 compute-bound 후보인지 1차 분류할 수 있다.",
      "Roofline이 실제 성능 예측식이 아니라 attainable performance의 상한 모델임을 설명할 수 있다."
    ],
    terms:[
      term("Arithmetic intensity","산술 집약도","memory에서 이동한 byte당 수행한 floating-point operation 수를 나타내는 비율이다.","같은 peak compute라도 data reuse가 낮으면 memory bandwidth roof에 먼저 제한될 수 있다."),
      term("Memory bandwidth roof","메모리 대역폭 상한","bandwidth×arithmetic intensity로 표현되는 memory-side 성능 상한이다.","낮은 arithmetic intensity 구간에서 attainable performance를 제한하는 기준선이다."),
      term("Compute roof","계산 상한","hardware의 peak 또는 측정된 최대 compute throughput을 나타내는 수평 상한이다.","arithmetic intensity가 높아도 compute capability 이상으로 성능이 올라갈 수 없음을 보여 준다."),
      term("Ridge point","경계점","memory roof와 compute roof가 만나는 arithmetic intensity 값으로 peak compute / memory bandwidth로 계산한다.","workload가 어느 자원 상한에 더 가까운지 분류하는 직관적 기준이다."),
      term("Attainable performance","도달 가능 상한","주어진 arithmetic intensity에서 두 roof 중 더 낮은 값으로 제한되는 모델상의 최대 성능이다.","실제 성능은 cache, instruction mix, latency, occupancy 등 추가 요인 때문에 이보다 낮을 수 있다."),
      term("Operational intensity","실측 집약도","실행 중 실제 memory traffic을 기준으로 계산한 intensity를 가리킬 때 자주 쓰는 표현이다.","source-level FLOP/Byte 추정과 실제 hardware traffic이 다를 수 있음을 구분하는 데 도움이 된다.")
    ],
    sections:[
      sec("Roofline은 최적화 방향을 먼저 분류하는 모델이다",
        "성능이 느리다는 사실만으로 vectorization을 할지 blocking을 할지 결정하기 어렵다. Roofline은 workload의 arithmetic intensity와 hardware의 compute/bandwidth 상한을 같은 그림에 놓아 어떤 자원이 먼저 제한하는지 분류한다.",
        "낮은 intensity에서는 byte를 옮기는 속도가 병목이 되기 쉽고, 높은 intensity에서는 compute throughput이 상한이 된다. 이 분류는 세부 최적화 전에 방향을 줄이는 데 유용하다.",
        "Roofline은 무엇을 먼저 의심할지 정하는 1차 모델이다."),
      sec("Ridge point는 두 자원 상한이 바뀌는 기준이다",
        "peak compute가 2000 GF/s이고 sustainable memory bandwidth가 200 GB/s라면 ridge point는 10 FLOP/Byte다. AI=2 workload는 bandwidth roof 아래에 있고 AI=20 workload는 compute roof에 가까운 영역이다.",
        "중요한 것은 vendor peak 숫자를 그대로 쓰는 것보다 해당 system과 datatype, instruction 조건에서 현실적인 compute/bandwidth baseline을 사용하는 것이다. STREAM 같은 measured bandwidth와 microbenchmark 결과를 사용하면 모델이 실제 환경에 더 가까워진다.",
        "Ridge point의 품질은 입력한 roof 값의 품질에 달려 있다."),
      sec("Arithmetic intensity 계산은 byte 정의를 명확히 해야 한다",
        "source code에서 array load/store 수를 세는 단순 계산은 cache reuse와 write-allocate, prefetch, hierarchy traffic을 충분히 반영하지 못할 수 있다. 어떤 memory level의 byte를 기준으로 하는지 명시해야 한다.",
        "CPU와 GPU에서도 counter/tool이 보고하는 traffic 범위가 다를 수 있다. 따라서 보고서에는 FLOP 계산 방법, byte 측정 방법, 포함한 memory level을 함께 기록한다.",
        "AI 숫자 하나보다 FLOP와 byte를 어떻게 계산했는지가 더 중요하다."),
      sec("Roof 아래에 멀리 떨어져 있으면 다른 병목이 남아 있을 수 있다",
        "memory-bound 영역에서도 실제 bandwidth가 roof에 한참 못 미치면 random access, latency, NUMA, insufficient concurrency 같은 요인이 있을 수 있다. compute-bound 영역에서도 vectorization failure, dependency, occupancy 문제로 peak에 못 미칠 수 있다.",
        "따라서 Roofline 분류 후에는 PMU, memory bandwidth, vectorization report, GPU profiler 같은 구체 도구로 다음 가설을 검증한다.",
        "Roofline은 root cause를 끝내는 그림이 아니라 다음 측정을 선택하는 지도다.")
    ],
    example:ex("AI=2인데 compute 최적화를 먼저 한 경우",
      "workload가 memory roof에 제한되는 영역이라면 FLOP throughput만 개선하는 변경은 전체 runtime에 거의 영향을 주지 않을 수 있다.",
      [
        {label:"Roof 계산",text:"실측 BW와 compute peak로 ridge point를 계산한다."},
        {label:"위치 분류",text:"AI=2가 ridge보다 낮은지 확인한다."},
        {label:"다음 가설",text:"cache reuse, blocking, data layout, NUMA, bandwidth utilization을 먼저 조사한다."},
        {label:"재측정",text:"변경 후 arithmetic intensity와 achieved bandwidth, runtime을 함께 비교한다."}
      ],
      "최적화 우선순위는 코드에서 눈에 띄는 연산보다 현재 roof에 무엇이 가까운지를 기준으로 잡는다."),
    selfCheck:[
      q("ridge point는 어떻게 계산하는가?","compute roof를 memory bandwidth roof로 나눈 값이며 단위는 FLOP/Byte가 된다."),
      q("AI가 ridge보다 낮으면 무조건 실제 성능이 memory bandwidth 한계에 도달했다는 뜻인가?","아니다. memory-bound 후보 영역이라는 뜻이며 latency, access pattern, NUMA 등으로 실제 bandwidth가 roof보다 훨씬 낮을 수 있다."),
      q("Roofline의 predicted roof보다 실제 성능이 낮은 이유는?","instruction mix, latency, cache behavior, insufficient parallelism, vectorization/occupancy 등 모델에 직접 포함되지 않은 비용이 있기 때문이다.")
    ]
  },

  "debug-tools": {
    learningObjectives:[
      "hang, syscall failure, segfault, memory corruption 증상에 따라 strace, gdb, core dump, Valgrind의 역할을 구분할 수 있다.",
      "production 전체 job을 무작정 tracing하지 않고 작은 재현과 debug build를 만드는 이유를 설명할 수 있다.",
      "signal, exit status, syscall errno, backtrace를 연결해 crash 원인을 단계적으로 좁힐 수 있다."
    ],
    terms:[
      term("System call","시스템 호출","user process가 file, network, process, memory 같은 kernel service를 요청하는 인터페이스다.","ENOENT, EACCES, blocking read처럼 application 증상이 kernel interface에서 드러나는 경우가 많다."),
      term("strace","syscall tracer","process가 호출한 system call과 argument, return value를 관찰하는 도구다.","파일 실패나 반복 polling, blocking syscall을 code 수정 없이 확인할 수 있다."),
      term("Backtrace","호출 스택 추적","현재 또는 crash 시점의 stack frame을 함수 호출 순서로 보여 주는 정보다.","segfault가 어디서 발생했고 어떤 call path로 도달했는지 확인하는 핵심 증거다."),
      term("Core dump","코어 덤프","process crash 시점의 memory와 register 상태를 저장한 snapshot이다.","현장에서 재현하기 어려운 crash를 나중에 gdb로 분석할 수 있다."),
      term("Debug symbol","디버그 심볼","machine address를 source function, file, line 정보와 연결하는 metadata다.","symbol이 없으면 backtrace가 주소 위주로 보여 원인 분석이 어려워진다."),
      term("Dynamic memory checker","동적 메모리 검사기","실행 중 invalid read/write, use-after-free, leak 같은 memory 오류를 감시하는 도구 범주다.","강력하지만 overhead가 크므로 작은 재현에 사용하는 것이 일반적이다.")
    ],
    sections:[
      sec("증상에 맞는 관찰 계층을 선택한다",
        "파일이 없다고 실패하거나 permission 문제가 의심되면 syscall과 errno가 직접적인 증거가 될 수 있다. 반면 SIGSEGV로 죽는 문제는 stack과 invalid memory access가 더 중요하다. 모든 문제에 같은 profiler를 적용하면 필요한 신호가 묻힌다.",
        "hang에서는 어떤 thread가 어디서 기다리는지, syscall blocking인지 user-space lock인지 구분한다. crash에서는 signal과 core/backtrace를 확보하고, memory corruption은 작은 입력에서 sanitizer나 Valgrind 같은 도구를 적용한다.",
        "도구 선택은 증상과 관찰하려는 계층에서 시작한다."),
      sec("strace는 syscall timeline을 보여 주지만 비용이 있다",
        "strace -f -tt는 child process를 포함한 syscall 시간선을 기록할 수 있어 반복 open 실패, poll loop, network timeout을 찾는 데 유용하다. return value의 errno를 함께 읽는 것이 중요하다.",
        "하지만 syscall 수가 많은 workload나 대규모 MPI job에서는 출력량과 overhead가 매우 커질 수 있다. 먼저 작은 재현이나 한 rank/process로 범위를 줄이고 output file을 분리한다.",
        "Tracing 범위와 시간은 최소화하고 질문에 필요한 syscall만 본다."),
      sec("gdb와 core dump는 crash 시점의 program state를 읽는다",
        "core file과 같은 executable, debug symbol이 있으면 gdb에서 backtrace, thread stack, register, local variable을 확인할 수 있다. production binary가 stripped되어 있으면 별도 debug symbol package가 필요할 수 있다.",
        "최적화된 build에서는 inlining과 variable optimization 때문에 source와 stack이 직관적으로 보이지 않을 수 있다. 따라서 debug reproduction build와 production crash evidence의 차이를 기록한다.",
        "Backtrace는 build metadata와 함께 해석해야 한다."),
      sec("Memory checker는 작은 재현에 집중한다",
        "Valgrind류 도구는 invalid memory access를 세밀하게 추적하지만 실행 시간이 크게 늘 수 있다. 대형 MPI/GPU workload 전체에 처음부터 적용하면 현실적으로 사용하기 어렵다.",
        "입력과 rank 수를 줄여 동일 crash를 재현하고, sanitizer 또는 memory checker로 잘못된 access를 찾은 뒤 production 조건에서 수정 효과를 다시 확인한다.",
        "큰 장애를 작은 재현으로 줄이는 능력이 debugging 효율을 결정한다.")
    ],
    example:ex("MPI job 한 rank가 SIGSEGV로 종료",
      "처음부터 전체 256-rank job을 gdb로 붙이지 않고 scheduler와 crash evidence에서 범위를 좁힌다.",
      [
        {label:"실패 rank 확인",text:"scheduler/stdout에서 signal과 실패 rank, node, timestamp를 확보한다."},
        {label:"재현 축소",text:"가능하면 같은 input subset으로 rank 수를 줄여 crash가 유지되는지 확인한다."},
        {label:"Stack 확보",text:"debug symbol이 있는 build와 core dump로 backtrace를 얻는다."},
        {label:"Memory 검사",text:"invalid access가 의심되면 작은 재현에 sanitizer/Valgrind를 적용한다."},
        {label:"Production 검증",text:"수정 후 원래 workload에서 correctness와 stability를 다시 확인한다."}
      ],
      "Debugging은 도구를 많이 쓰는 것이 아니라 증상을 가장 작은 재현과 가장 직접적인 evidence로 연결하는 과정이다."),
    selfCheck:[
      q("파일 open 실패 원인을 볼 때 gdb보다 strace가 먼저 유용할 수 있는 이유는?","open/openat syscall의 path와 return errno를 직접 볼 수 있기 때문이다."),
      q("core dump 분석에서 executable과 debug symbol이 중요한 이유는?","저장된 address와 stack을 함수·source line에 연결해야 의미 있는 backtrace를 얻을 수 있기 때문이다."),
      q("Valgrind를 전체 대규모 MPI job에 처음부터 적용하지 않는 이유는?","실행 overhead와 output 규모가 매우 커질 수 있어 작은 재현으로 범위를 줄이는 편이 효과적이기 때문이다.")
    ]
  }
});
