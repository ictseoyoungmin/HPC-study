const term=(term,en,definition,why)=>({term,en,definition,why});
const sec=(title,p1,p2,takeaway)=>({title,paragraphs:[p1,p2],takeaway});
const q=(question,answer)=>({question,answer});
const ex=(title,intro,steps,conclusion)=>({title,intro,steps,conclusion});

export const enhancements = Object.freeze({
  "compiler-build": {
    learningObjectives:[
      "source→compiler→object→link→binary의 build pipeline을 설명할 수 있다.",
      "optimization flag와 ISA target이 성능, portability, numerical behavior에 미치는 영향을 설명할 수 있다.",
      "compiler/version/flags/source revision을 재현 가능한 build identity로 기록할 수 있다."
    ],
    terms:[
      term("Compiler","컴파일러","source code를 object code 또는 executable로 변환하는 도구 체인이다.","compiler와 version이 달라지면 optimization, ABI, runtime library 선택이 달라질 수 있다."),
      term("Optimization level","최적화 수준","-O0, -O2, -O3처럼 compiler가 적용할 optimization의 범위와 aggressiveness를 지정한다.","높은 level이 항상 빠르거나 같은 numerical behavior를 보장하는 것은 아니다."),
      term("ISA target","명령어 집합 대상","binary가 사용할 수 있는 CPU instruction set과 microarchitecture feature 범위를 정한다.","-march=native 같은 설정은 현재 Node에서는 빠를 수 있지만 다른 CPU에서 illegal instruction을 만들 수 있다."),
      term("Build system","빌드 시스템","Make/CMake처럼 dependency와 compile/link command를 재현 가능하게 생성하는 도구다.","사용자가 실제로 어떤 flags와 library를 사용했는지 추적하는 데 필요하다."),
      term("Build provenance","빌드 이력","source revision, compiler, flags, modules, linked libraries를 묶은 재현 정보다.","성능 회귀나 node별 failure를 같은 binary 조건에서 비교할 수 있게 한다.")
    ],
    sections:[
      sec("binary는 source만으로 결정되지 않는다",
        "같은 C/C++ source라도 compiler 종류와 version, optimization flag, target ISA, preprocessor macro, linked library에 따라 서로 다른 executable이 만들어진다. 따라서 '코드는 같다'는 말만으로 실행 조건이 같다고 볼 수 없다.",
        "AA 관점에서는 binary path와 checksum, compiler/version, build flag를 먼저 고정해야 node 차이와 code 차이를 분리할 수 있다. CMakeCache나 verbose build log도 중요한 증거가 된다.",
        "실행 재현성은 source가 아니라 build identity까지 포함한다."),
      sec("optimization은 계산을 바꾸는 허용 범위와 trade-off다",
        "-O2/-O3는 inlining, loop transformation, vectorization 같은 optimization을 더 적극적으로 적용할 수 있다. workload에 따라 빨라질 수 있지만 code size, compile time, numerical reordering, debug visibility가 달라질 수 있다.",
        "성능 비교에서는 정확성 output을 먼저 확인하고 동일 input을 반복해야 한다. 특정 flag가 빠르다는 결론은 한 compiler와 한 CPU, 한 input의 결과이지 보편 법칙이 아니다.",
        "optimization 비교는 correctness와 performance를 동시에 검증한다."),
      sec("CPU target을 높이면 portability 비용이 생긴다",
        "-march=native는 build Node의 CPU feature를 적극적으로 사용할 수 있지만, 그 binary를 더 오래된 CPU Node로 옮기면 지원하지 않는 instruction 때문에 실행이 실패할 수 있다.",
        "cluster가 여러 CPU generation을 섞어 운영한다면 portable baseline과 architecture-specific build를 구분하는 정책이 필요하다. illegal instruction ticket은 application bug보다 binary target을 먼저 확인할 가치가 있다.",
        "성능 최적화와 배포 범위는 같은 flag의 양면이다.")
    ],
    example:ex("한 Node에서만 Illegal instruction",
      "application source보다 먼저 binary target과 Node CPU feature 차이를 확인한다.",
      [
        {label:"Binary identity",text:"실행한 binary checksum과 build 경로를 확인한다."},
        {label:"CPU feature",text:"정상/실패 Node의 lscpu flags와 CPU model을 비교한다."},
        {label:"Build flag",text:"-march/-mtune 또는 vendor-specific target option을 확인한다."},
        {label:"재빌드",text:"portable target으로 재빌드해 동일 Node에서 재현 여부를 본다."}
      ],
      "Node별 failure는 hardware defect만이 아니라 binary가 요구하는 ISA와 Node가 제공하는 ISA의 차이일 수 있다."),
    selfCheck:[
      q("-O3가 항상 -O2보다 빠르다고 말할 수 없는 이유는?","optimization이 workload와 microarchitecture에 따라 code size, vectorization, memory behavior를 다르게 만들며 더 공격적인 transformation이 항상 이득인 것은 아니기 때문이다."),
      q("-march=native의 대표적인 운영 위험은?","build Node의 ISA feature를 사용한 binary가 다른 CPU generation Node에서 실행되지 않을 수 있다는 portability 위험이다."),
      q("재현 가능한 build identity에 최소한 무엇을 기록해야 하는가?","source revision, compiler와 version, compile/link flags, module/environment, 주요 linked library와 binary checksum을 기록한다.")
    ]
  },

  "libraries-linking": {
    learningObjectives:[
      "shared/static library와 dynamic loader의 역할을 설명할 수 있다.",
      "ABI, RPATH/RUNPATH, LD_LIBRARY_PATH가 runtime library 선택에 미치는 영향을 설명할 수 있다.",
      "MPI/BLAS/OpenMP runtime 중복과 threading 중첩을 library provenance로 진단할 수 있다."
    ],
    terms:[
      term("ABI","Application Binary Interface","compiled code가 function call, symbol, data layout, calling convention을 서로 맞추는 binary-level 규약이다.","API 이름이 같아도 ABI가 맞지 않으면 symbol error나 crash가 날 수 있다."),
      term("Shared library","공유 라이브러리","실행 시 dynamic loader가 .so 같은 library를 찾아 연결하는 방식이다.","runtime environment에 따라 실제 선택되는 library가 달라질 수 있다."),
      term("RPATH/RUNPATH","내장 library 검색 경로","executable이나 shared object에 기록된 runtime search path다.","module이나 LD_LIBRARY_PATH와 결합돼 예상하지 않은 library selection을 만들 수 있다."),
      term("LD_LIBRARY_PATH","동적 library 경로","dynamic loader의 library 검색에 영향을 주는 environment variable이다.","무조건 앞에 경로를 추가하면 다른 compiler/MPI stack의 library를 섞을 수 있다."),
      term("Threading runtime","thread runtime","OpenMP 또는 BLAS library 내부에서 thread를 만들고 관리하는 runtime이다.","application OpenMP와 threaded BLAS가 중첩되면 oversubscription이 생길 수 있다.")
    ],
    sections:[
      sec("실행 파일은 혼자 실행되지 않는다",
        "dynamic executable은 시작할 때 필요한 shared library를 loader가 찾는다. 어떤 MPI, BLAS, C++ runtime, OpenMP runtime이 선택되는지는 build-time link 정보와 runtime search path가 함께 결정한다.",
        "따라서 같은 binary라도 module 환경이나 LD_LIBRARY_PATH가 다르면 다른 .so를 잡을 수 있다. ldd와 readelf는 '무엇을 기대했는가'가 아니라 '무엇을 실제로 연결하는가'를 확인하는 기본 도구다.",
        "runtime library provenance는 binary provenance의 일부다."),
      sec("API 호환과 ABI 호환은 다른 문제다",
        "함수 이름과 header가 비슷해도 binary calling convention이나 symbol version이 맞지 않으면 link/runtime error가 날 수 있다. 특히 C++ runtime, MPI implementation, compiler family가 섞이면 ABI 문제가 복잡해질 수 있다.",
        "undefined symbol, version mismatch, segmentation fault가 environment 변경 후 나타났다면 source bug보다 loader가 다른 library를 선택했는지 먼저 확인한다.",
        "symbol 문제는 source보다 loader path를 먼저 확인할 가치가 있다."),
      sec("math library의 내부 thread도 전체 CPU 모델에 포함한다",
        "MKL, OpenBLAS, BLIS 같은 library는 자체 thread pool을 사용할 수 있다. application이 OpenMP 16 threads를 만들고 각 thread가 다시 BLAS 16 threads를 만들면 의도하지 않은 256-way runnable work가 생길 수 있다.",
        "OMP_NUM_THREADS뿐 아니라 MKL_NUM_THREADS, OPENBLAS_NUM_THREADS 등 library-specific 설정과 실제 CPU utilization을 함께 확인해야 한다. 최적값은 workload에 따라 달라진다.",
        "application thread와 library thread를 합쳐 실제 concurrency를 계산한다.")
    ],
    example:ex("module 변경 후 undefined symbol 발생",
      "코드 수정 없이 environment만 바뀌었으므로 dynamic linking 경로를 우선 조사한다.",
      [
        {label:"Module list",text:"정상 환경과 실패 환경의 loaded module을 비교한다."},
        {label:"ldd",text:"application과 주요 plugin/library가 실제 어떤 .so를 선택하는지 비교한다."},
        {label:"readelf",text:"NEEDED, RPATH, RUNPATH를 확인한다."},
        {label:"Clean env",text:"module purge 후 필요한 stack만 load해 재현 여부를 본다."}
      ],
      "environment-dependent symbol error는 library provenance를 고정하면 빠르게 범위를 줄일 수 있다."),
    selfCheck:[
      q("ldd를 ticket에 남기는 이유는?","실행 시 실제로 선택되는 shared library 경로를 기록해 MPI/BLAS/runtime mismatch를 재현할 수 있기 때문이다."),
      q("LD_LIBRARY_PATH를 무조건 앞에 추가하는 것이 위험한 이유는?","다른 compiler나 MPI stack의 ABI가 맞지 않는 library가 우선 선택될 수 있기 때문이다."),
      q("OpenMP 8 threads인데 CPU가 64개 runnable로 보일 수 있는 이유는?","각 OpenMP thread가 threaded BLAS 같은 library를 호출해 내부 thread가 중첩 생성될 수 있기 때문이다.")
    ]
  },

  "build-repro": {
    learningObjectives:[
      "debug, sanitizer, optimized, profile-guided build를 서로 다른 목적의 build profile로 구분할 수 있다.",
      "ASan/UBSan/TSan이 잡는 bug class와 성능 오버헤드의 의미를 설명할 수 있다.",
      "source revision부터 library/module까지 포함한 reproducible build manifest를 만들 수 있다."
    ],
    terms:[
      term("Sanitizer","런타임 검사 도구","compiler instrumentation으로 memory error, undefined behavior, data race 같은 bug를 실행 중 탐지하는 도구 계열이다.","production crash의 원인을 작은 재현에서 찾는 데 유용하지만 성능 benchmark용 build는 아니다."),
      term("ASan","AddressSanitizer","out-of-bounds, use-after-free 같은 memory access error를 탐지하는 sanitizer다.","간헐 crash와 heap corruption 원인을 찾는 데 유용하다."),
      term("TSan","ThreadSanitizer","data race와 일부 thread synchronization 문제를 탐지하는 sanitizer다.","shared-memory concurrency bug를 재현할 때 도움되지만 큰 overhead가 있다."),
      term("LTO","Link-Time Optimization","link 단계에서 여러 object/module 정보를 함께 사용해 optimization하는 기법이다.","cross-file optimization 기회를 늘리지만 build/toolchain coupling도 커질 수 있다."),
      term("PGO","Profile-Guided Optimization","대표 workload 실행 profile을 compiler optimization에 사용하는 기법이다.","profile이 실제 production input을 대표하지 않으면 최적화 효과가 제한되거나 왜곡될 수 있다.")
    ],
    sections:[
      sec("debug와 performance build는 목적이 다르다",
        "debug build는 symbol과 관찰 가능성을 높이고 optimization을 낮춰 source-level diagnosis를 쉽게 할 수 있다. sanitizer build는 bug class를 탐지하기 위해 instrumentation과 runtime check를 추가한다.",
        "production optimized build는 performance를 목표로 하므로 code layout과 timing이 다를 수 있다. 두 build의 runtime을 직접 비교해 'sanitizer가 느리다'고 평가하는 것은 목적이 다른 실험을 섞는 것이다.",
        "build profile마다 검증하려는 질문을 명확히 한다."),
      sec("sanitizer는 bug class에 맞춰 선택한다",
        "ASan은 memory access, UBSan은 undefined behavior, TSan은 data race 탐지에 초점을 둔다. 모든 sanitizer를 동시에 켜는 것이 항상 가능하거나 효율적인 것은 아니다.",
        "문제 재현 입력을 작게 만들고 해당 bug class에 맞는 build를 사용하면 production cluster에서 반복 crash를 추측하는 것보다 빠르게 원인을 좁힐 수 있다.",
        "증상에 맞는 instrumentation을 선택한다."),
      sec("재현성은 source revision보다 넓다",
        "같은 git commit도 compiler version, module stack, dependency version, generated config, CFLAGS/LDFLAGS가 다르면 다른 binary가 된다. 따라서 build manifest는 이 전체 환경을 함께 기록해야 한다.",
        "성능 회귀나 특정 Node failure를 비교할 때 binary checksum까지 남기면 '같은 실행 파일'인지 확인할 수 있다. CI artifact나 container도 이 정보를 고정하는 한 방법이다.",
        "reproducibility의 단위는 source가 아니라 complete build environment다.")
    ],
    example:ex("release build에서만 crash하는 경우",
      "optimization-sensitive bug를 build profile로 분리한다.",
      [
        {label:"Reproduce",text:"동일 input에서 debug와 optimized build의 재현 여부를 비교한다."},
        {label:"Sanitizer",text:"ASan/UBSan 등 증상에 맞는 instrumentation build를 만든다."},
        {label:"Identity",text:"compiler, flags, source revision, library를 manifest로 고정한다."},
        {label:"Minimize",text:"작은 input/단일 Node로 재현 범위를 줄인 뒤 원인을 찾는다."}
      ],
      "optimization에서만 드러나는 현상도 compiler bug보다 먼저 undefined behavior와 race 같은 latent bug를 의심할 수 있다."),
    selfCheck:[
      q("sanitizer build와 production build의 runtime을 직접 비교하면 안 되는 이유는?","sanitizer는 추가 instrumentation과 runtime check로 큰 overhead를 의도적으로 만들기 때문에 성능 목적의 build가 아니기 때문이다."),
      q("PGO가 대표 workload를 필요로 하는 이유는?","compiler가 profile에서 자주 실행되는 path와 branch를 근거로 optimization 결정을 내리므로 profile이 실제 workload를 대표해야 하기 때문이다."),
      q("reproducible build manifest에 binary checksum을 넣는 장점은?","이름이 같은 파일이라도 실제 byte-level binary가 같은지 확인할 수 있어 build provenance 비교가 확실해진다.")
    ]
  },

  "modules": {
    learningObjectives:[
      "Environment Modules/Lmod가 PATH와 library/compiler 환경을 어떻게 바꾸는지 설명할 수 있다.",
      "module load 순서와 family/dependency가 toolchain 충돌을 만드는 이유를 설명할 수 있다.",
      "clean environment에서 module list와 env diff를 이용해 환경 문제를 재현할 수 있다."
    ],
    terms:[
      term("Modulefile","모듈 정의 파일","특정 compiler, MPI, application을 사용하기 위해 environment variable을 어떻게 변경할지 정의한 파일이다.","module load가 실제로 무엇을 바꾸는지 추적하는 source다."),
      term("Lmod","Lmod","Lua 기반 Environment Modules implementation으로 dependency, hierarchy, spider 같은 기능을 제공한다.","대규모 HPC software stack에서 compiler/MPI 조합을 관리하는 데 널리 쓰인다."),
      term("PATH","실행 파일 검색 경로","shell이 command 이름으로 executable을 찾을 때 사용하는 directory 목록이다.","module load 후 which gcc/mpirun 결과가 바뀌는 직접 원인이다."),
      term("Module hierarchy","모듈 계층","compiler나 MPI 선택에 따라 보이는 application module을 제한하는 구조다.","호환되지 않는 stack 조합을 줄이고 dependency를 표현한다."),
      term("Clean environment","깨끗한 환경","불필요한 module과 custom PATH/LD_LIBRARY_PATH 영향을 제거한 재현 시작점이다.","환경 오염인지 application 자체 문제인지 분리하기 쉽다.")
    ],
    sections:[
      sec("module은 software를 설치하는 것이 아니라 환경을 전환한다",
        "module load는 보통 PATH, LD_LIBRARY_PATH, CPATH, MANPATH, compiler-specific variable 등을 수정해 이미 설치된 software stack을 선택하게 한다. 같은 command 이름이라도 module 전후에 실제 executable path가 바뀔 수 있다.",
        "따라서 ticket에는 'gcc 사용'이 아니라 module list와 which gcc, gcc --version처럼 실제 선택된 binary를 기록해야 한다. module show는 어떤 environment change가 적용되는지 확인하는 좋은 출발점이다.",
        "module 이름보다 실제 environment 변화가 중요하다."),
      sec("compiler와 MPI dependency는 module hierarchy로 표현될 수 있다",
        "MPI library는 특정 compiler와 build되며 application module도 특정 MPI/ABI에 의존할 수 있다. Lmod hierarchy는 compiler를 load해야 그 compiler에 맞는 MPI가 보이는 식으로 호환 stack을 유도할 수 있다.",
        "사용자가 여러 stack의 PATH와 LD_LIBRARY_PATH를 수동으로 섞으면 module hierarchy가 제공하던 안전장치를 우회하게 된다. symbol error나 잘못된 mpirun 선택이 이때 발생하기 쉽다.",
        "module stack을 하나의 dependency graph로 본다."),
      sec("환경 문제는 clean shell에서 재현 여부를 본다",
        "오래 사용한 login shell에는 과거 module과 custom export가 누적될 수 있다. module purge 또는 새 shell에서 필요한 module만 순서대로 load해 문제가 재현되는지 비교하면 환경 오염을 빠르게 찾을 수 있다.",
        "env | sort 결과를 load 전후로 diff하면 module이 실제로 어떤 변수를 바꿨는지 확인할 수 있다. 다만 site default module까지 제거될 수 있으므로 운영 정책을 확인한다.",
        "clean baseline과 env diff가 module 문제의 가장 단순한 실험이다.")
    ],
    example:ex("같은 application이 login shell마다 다르게 동작",
      "환경 누적을 application bug와 분리한다.",
      [
        {label:"기록",text:"두 shell의 module list, PATH, LD_LIBRARY_PATH를 저장한다."},
        {label:"Clean",text:"새 shell 또는 module purge 후 site 권장 stack만 load한다."},
        {label:"Diff",text:"env와 which/ldd 결과를 비교한다."},
        {label:"고정",text:"Job script 안에서 필요한 module을 명시해 batch 재현성을 높인다."}
      ],
      "interactive shell의 우연한 환경에 의존하지 않고 Job script가 software stack을 선언하도록 만드는 것이 운영상 안전하다."),
    selfCheck:[
      q("module load가 실제로 하는 일의 핵심은?","설치된 software를 선택하도록 PATH, library path 등 environment variable을 변경하는 것이다."),
      q("module list만으로 충분하지 않을 때 어떤 증거를 추가해야 하는가?","which executable, version, ldd, module show와 필요하면 env diff를 함께 기록해 실제 선택된 binary와 library를 확인한다."),
      q("clean environment가 진단에 유용한 이유는?","과거 shell에서 누적된 module과 custom environment 영향을 제거해 필요한 stack만으로 문제가 재현되는지 확인할 수 있기 때문이다.")
    ]
  },

  "slurm-basics": {
    learningObjectives:[
      "Job submission→PENDING→allocation→RUNNING→accounting의 Slurm lifecycle을 설명할 수 있다.",
      "sbatch, salloc, srun의 역할과 Job/Job step의 차이를 설명할 수 있다.",
      "Job ID를 기준으로 request, allocation, execution, result를 연결해 기본 RCA를 수행할 수 있다."
    ],
    terms:[
      term("Job","작업","사용자가 scheduler에 제출한 실행 요청과 자원 요구의 단위다.","Job ID가 request부터 accounting까지 모든 증거를 연결하는 기준 키가 된다."),
      term("Allocation","자원 할당","scheduler가 Job에 Node, CPU, memory, GPU 같은 실행 자원을 배정한 상태다.","요청값과 실제 할당값을 구분해야 성능과 OOM 문제를 해석할 수 있다."),
      term("Job step","잡 스텝","할당된 Job 내부에서 srun 등으로 실행되는 개별 task launch 단위다.","batch step과 application step의 상태/exit code를 분리해 볼 수 있다."),
      term("PENDING","대기 상태","Job이 아직 실행 조건을 만족하지 못해 queue에서 기다리는 상태다.","장애가 아니라 resource, priority, dependency, QoS 등 이유를 가진 정상 scheduling 상태일 수 있다."),
      term("Accounting","사용 기록","완료 Job의 state, elapsed, resource allocation/usage, exit code를 보존하는 기록이다.","사후 RCA와 right-sizing, 성능 baseline의 핵심 증거다.")
    ],
    sections:[
      sec("Slurm은 프로그램을 빠르게 만드는 도구가 아니라 자원 사용을 조정하는 scheduler다",
        "사용자는 sbatch나 salloc로 CPU, Node, memory, GPU, time limit 같은 요구를 제출한다. scheduler는 cluster 정책과 현재 가용 자원을 비교해 언제 어디서 Job을 실행할지 결정한다.",
        "따라서 Job이 PENDING이라고 해서 application 문제가 있는 것은 아니다. 반대로 RUNNING이라고 해서 application이 CPU/GPU를 효율적으로 사용한다는 뜻도 아니다. scheduling state와 application performance는 서로 다른 계층이다.",
        "Slurm state는 자원 수명주기를 설명하고 application 성능은 그 안에서 별도로 본다."),
      sec("sbatch, salloc, srun은 서로 다른 역할을 가진다",
        "sbatch는 batch script를 제출하고, salloc은 interactive allocation을 얻으며, srun은 allocation 안에서 task/job step을 시작하는 데 사용된다. site integration에 따라 MPI launcher 역할도 할 수 있다.",
        "이 차이를 모르고 srun과 mpirun을 임의로 중첩하거나 allocation 밖에서 command를 실행하면 resource accounting과 placement가 의도와 달라질 수 있다. site 문서의 launcher 권장 방식을 우선해야 한다.",
        "submission, allocation, task launch를 세 단계로 구분한다."),
      sec("Job ID로 request→allocation→result를 연결한다",
        "scontrol show job은 requested/allocated resource와 NodeList 같은 상태를 보여주고, squeue는 현재 state와 pending reason을, sacct는 종료 후 state/elapsed/MaxRSS/ExitCode를 제공한다.",
        "AA가 사용자의 '느렸다' 또는 '죽었다'는 설명을 분석 가능한 사건으로 바꾸려면 Job ID와 시간 범위가 먼저 필요하다. 그 다음 scheduler state와 stderr, Node log를 같은 timeline에 놓는다.",
        "Job ID가 없으면 scheduler RCA의 연결 고리가 사라진다.")
    ],
    example:ex("사용자가 'Job이 안 돈다'고 문의",
      "PENDING인지 RUNNING 실패인지부터 상태를 분리한다.",
      [
        {label:"Job ID",text:"대상 Job과 제출 시각을 확인한다."},
        {label:"현재 상태",text:"squeue에서 state와 REASON을 확인한다."},
        {label:"상세",text:"scontrol show job으로 요청 자원, dependency, partition/QoS를 본다."},
        {label:"종료 후",text:"sacct에서 State, ExitCode, Elapsed, MaxRSS를 확인한다."}
      ],
      "'안 돈다'는 표현을 PENDING, FAILED, OOM, TIMEOUT 같은 구체적 상태로 변환하는 것이 첫 단계다."),
    selfCheck:[
      q("PENDING은 곧 scheduler 장애인가?","아니다. resource 부족, priority, dependency, QoS, reservation 등 정상적인 대기 이유가 있을 수 있으므로 REASON을 확인해야 한다."),
      q("sbatch와 srun의 핵심 역할 차이는?","sbatch는 Job을 scheduler에 제출하고 srun은 allocation 안에서 task/job step을 launch하는 데 사용된다."),
      q("Slurm RCA에서 Job ID가 중요한 이유는?","request, allocation, state 변화, accounting, log를 동일한 작업 단위로 연결하는 기준 키이기 때문이다.")
    ]
  },

  "slurm-resources": {
    learningObjectives:[
      "nodes, ntasks, cpus-per-task를 MPI rank와 OpenMP thread 모델에 연결할 수 있다.",
      "memory, TRES, GRES/GPU request와 실제 allocation의 차이를 설명할 수 있다.",
      "resource request→allocation→cgroup/binding→application usage를 비교해 oversubscription/OOM/GPU idle을 진단할 수 있다."
    ],
    terms:[
      term("ntasks","task 수","Slurm이 launch할 병렬 task 수를 표현하는 resource/request 개념으로 MPI rank 수와 연결되는 경우가 많다.","threads-per-rank와 혼동하면 CPU request가 잘못될 수 있다."),
      term("cpus-per-task","task당 CPU","하나의 task에 할당할 CPU execution context 수를 지정하는 옵션이다.","OpenMP thread 수나 threaded library가 사용할 CPU 범위와 연결한다."),
      term("Memory request","메모리 요청","Job이나 CPU 기준으로 scheduler에 요청하는 memory limit/amount다.","과소 요청은 cgroup OOM을, 과다 요청은 queue wait와 자원 낭비를 만들 수 있다."),
      term("TRES","Trackable RESources","CPU, memory, GPU 등 accounting과 scheduling에서 추적 가능한 자원을 표현하는 Slurm 개념이다.","ReqTRES와 AllocTRES를 비교하면 요청과 실제 배정을 구조적으로 볼 수 있다."),
      term("GRES","Generic RESources","GPU처럼 일반 CPU/memory 외의 resource를 표현하는 Slurm mechanism이다.","site config에 따라 GPU request 문법과 binding behavior가 달라질 수 있다.")
    ],
    sections:[
      sec("resource request는 application parallel model에서 역산한다",
        "MPI 8 ranks가 있고 각 rank가 OpenMP 4 threads를 사용한다면 총 CPU execution context는 최소 32개가 필요하다. Node당 rank 수와 NUMA placement까지 고려해 ntasks, ntasks-per-node, cpus-per-task를 정한다.",
        "옵션을 외워서 조합하면 allocation과 application runtime이 어긋나기 쉽다. 먼저 rank/thread/GPU 관계를 표로 그린 뒤 Slurm option으로 변환하는 방식이 더 안전하다.",
        "Slurm option은 application execution model의 결과다."),
      sec("요청, 할당, 실제 사용은 서로 다른 값이다",
        "Job이 128 GB를 요청했다고 해서 application이 128 GB를 사용하는 것은 아니고, 4 GPU를 할당받았다고 모두 바쁘게 사용하는 것도 아니다. scheduler는 자원 경계를 제공할 뿐 utilization을 자동으로 보장하지 않는다.",
        "scontrol과 sacct로 request/allocation을 확인하고, cgroup/affinity와 application metric으로 실제 사용량을 비교해야 한다. 이 세 층을 섞으면 'Slurm이 CPU를 안 준다' 같은 잘못된 결론이 생긴다.",
        "request→allocation→usage를 세 열로 비교한다."),
      sec("memory와 GPU는 site policy와 topology 영향을 크게 받는다",
        "--mem과 --mem-per-cpu는 의미가 다르고, GPU request도 --gres 또는 --gpus 계열 option을 어떤 방식으로 지원하는지는 site와 Slurm version에 따라 다를 수 있다.",
        "GPU가 할당됐어도 CUDA_VISIBLE_DEVICES와 CPU/GPU locality, process당 GPU mapping이 맞지 않으면 일부 GPU가 idle할 수 있다. generic recipe보다 site documentation과 actual allocation을 우선한다.",
        "resource option은 cluster 설정과 topology에 의존한다.")
    ],
    example:ex("2 MPI ranks × 8 threads인데 CPU 50%만 사용",
      "resource request와 actual placement를 대조한다.",
      [
        {label:"모델",text:"필요 CPU=2 ranks×8 threads=16으로 계산한다."},
        {label:"Request",text:"ntasks와 cpus-per-task가 이 모델과 맞는지 확인한다."},
        {label:"Binding",text:"각 rank의 cpuset과 OpenMP thread affinity를 확인한다."},
        {label:"Usage",text:"CPU 사용률이 낮다면 serial/I/O/imbalance를 추가로 분리한다."}
      ],
      "allocation이 올바른지와 application이 allocation을 효율적으로 쓰는지는 별도 질문이다."),
    selfCheck:[
      q("4 MPI ranks × 8 OpenMP threads라면 cpus-per-task는 어떤 값이 baseline이 되는가?","각 rank가 8 threads를 사용한다면 task당 8 CPU가 자연스러운 baseline이며 ntasks는 4가 된다. 실제 값은 SMT/site policy에 따라 검증한다."),
      q("ReqTRES와 AllocTRES를 비교하는 이유는?","사용자가 요청한 자원과 scheduler가 실제 배정한 자원을 분리해 과다/과소 request와 policy 영향을 볼 수 있기 때문이다."),
      q("GPU가 할당됐지만 idle할 수 있는 이유 한 가지는?","rank-to-GPU mapping이나 visibility가 잘못되거나 application이 일부 GPU만 사용하거나 CPU/data pipeline이 병목일 수 있다.")
    ]
  },

  "slurm-policy": {
    learningObjectives:[
      "priority, fair-share, backfill, reservation, preemption이 queue order에 미치는 역할을 설명할 수 있다.",
      "PENDING reason을 policy/resource/dependency 범주로 나눠 사용자에게 설명할 수 있다.",
      "예상 시작 시간과 priority 숫자를 절대 보장값으로 오해하지 않고 site policy 문맥에서 해석할 수 있다."
    ],
    terms:[
      term("Priority","우선순위","scheduler가 여러 pending Job의 실행 순서를 결정할 때 사용하는 종합 점수 또는 ordering 요소다.","단순 제출 순서만으로 Job start를 설명할 수 없는 이유다."),
      term("Fair-share","공정 사용 정책","사용자/계정의 과거 자원 사용량 등을 반영해 장기적인 resource fairness를 조정하는 scheduling 요소다.","짧은 시간의 queue order만 보고 불공정하다고 판단하기 전에 account usage context를 봐야 한다."),
      term("Backfill","백필","높은 priority Job의 예상 시작을 늦추지 않는 범위에서 빈 자원에 다른 Job을 먼저 실행하는 scheduling 전략이다.","겉보기에는 뒤 Job이 먼저 실행돼도 priority를 무시한 것이 아닐 수 있다."),
      term("Reservation","예약","특정 시간/사용자/목적에 자원을 미리 확보하는 정책 기능이다.","free로 보이는 Node가 일반 Job에는 사용할 수 없는 이유가 될 수 있다."),
      term("Preemption","선점","정책에 따라 낮은 priority Job을 중단/재queue/축소하고 높은 priority Job을 실행할 수 있는 기능이다.","모든 site에서 활성화되는 것은 아니며 사용자가 예상하는 failure semantics에 영향을 준다.")
    ],
    sections:[
      sec("queue는 FIFO 한 줄이 아니다",
        "Slurm priority는 site 설정에 따라 age, fair-share, QoS, partition, job size 등 여러 요소를 조합할 수 있다. 먼저 제출한 Job이 항상 먼저 시작한다는 가정은 shared HPC scheduler에서 성립하지 않을 수 있다.",
        "또한 필요한 Node 수와 walltime이 다르면 scheduler가 만들 수 있는 packing/backfill 선택도 달라진다. 사용자는 queue position 숫자보다 PENDING reason과 estimated start, resource shape를 함께 봐야 한다.",
        "queue order는 policy와 resource shape의 결과다."),
      sec("backfill은 queue jump가 아니라 빈 시간 조각 사용이다",
        "큰 high-priority Job이 2시간 뒤 자원을 확보하도록 reservation되어 있을 때, 그 시작을 늦추지 않는 짧은 Job이 지금 남는 Node에서 먼저 실행될 수 있다. 이것이 backfill의 기본 아이디어다.",
        "따라서 낮은 priority Job이 먼저 RUNNING했다고 해서 scheduler가 priority를 무시했다는 뜻은 아니다. expected start와 requested time limit이 backfill 가능성에 영향을 준다.",
        "실행 순서와 priority order는 backfill 때문에 다르게 보일 수 있다."),
      sec("PENDING 설명은 reason을 구체적 정책으로 번역한다",
        "Resources는 필요한 resource가 아직 없다는 뜻이고 Priority는 다른 Job이 앞선다는 뜻이며 Dependency는 선행 조건이 아직 만족되지 않았다는 뜻이다. QOSMax* 계열은 site QoS limit에 걸렸음을 뜻할 수 있다.",
        "AA는 사용자에게 'scheduler가 바쁘다'보다 어떤 조건이 미충족인지 설명해야 한다. 예상 시작 시간은 future Job 변화에 따라 달라질 수 있으므로 보장 시각으로 표현하지 않는다.",
        "PENDING reason을 user-facing 원인 문장으로 번역하는 것이 운영 품질이다.")
    ],
    example:ex("나중에 제출한 Job이 먼저 실행됨",
      "priority 오류로 단정하지 않고 backfill과 resource shape를 확인한다.",
      [
        {label:"Reason",text:"두 Job의 PENDING reason과 priority를 비교한다."},
        {label:"Shape",text:"Node 수와 walltime request가 다른지 확인한다."},
        {label:"Start",text:"squeue --start와 reservation 정보를 참고한다."},
        {label:"설명",text:"높은 priority Job의 예상 시작을 지연하지 않는 범위의 backfill인지 정리한다."}
      ],
      "공정성 문의는 실행 순서 한 장면보다 priority와 resource reservation 문맥으로 설명해야 한다."),
    selfCheck:[
      q("낮은 priority Job이 먼저 실행될 수 있는 대표적인 이유는?","높은 priority Job의 예상 시작을 늦추지 않는 범위에서 작은/짧은 Job이 빈 자원을 사용하는 backfill 때문이다."),
      q("PENDING Reason=Resources와 Priority의 차이는?","Resources는 필요한 자원이 아직 가용하지 않음을, Priority는 다른 Job의 scheduling 우선순위가 앞섬을 나타내는 서로 다른 원인이다."),
      q("squeue --start의 시각을 보장 시작 시각으로 말하면 안 되는 이유는?","새 Job 제출, runtime 변화, reservation/policy 변화 등 future queue 상태에 따라 estimate가 바뀔 수 있기 때문이다.")
    ]
  },

  "slurm-advanced": {
    learningObjectives:[
      "Job array가 대량 parameter sweep을 표현하는 구조와 concurrency limit의 의미를 설명할 수 있다.",
      "dependency가 workflow ordering과 failure propagation을 scheduler에 표현하는 방식임을 설명할 수 있다.",
      "대량 Job workflow에서 output collision, scheduler pressure, retry semantics를 설계할 수 있다."
    ],
    terms:[
      term("Job array","잡 배열","하나의 batch script를 여러 array index로 반복 실행하는 Slurm 기능이다.","수백~수천 개의 유사 Job을 개별 script 제출보다 구조적으로 관리하기 쉽다."),
      term("Array task ID","배열 작업 ID","각 array element를 구분하는 index로 SLURM_ARRAY_TASK_ID 등에 노출된다.","입력 parameter와 output path를 task별로 분리하는 기준이 된다."),
      term("Concurrency limit","동시 실행 제한","array에서 %10처럼 동시에 RUNNING할 element 수를 제한하는 설정이다.","filesystem, license, external service 같은 shared resource 폭주를 줄일 수 있다."),
      term("Dependency","의존성","afterok, afterany 등 조건으로 한 Job의 시작을 다른 Job 결과에 연결하는 기능이다.","sleep/polling 대신 scheduler가 workflow ordering을 관리하게 한다."),
      term("Workflow","워크플로","전처리→계산→후처리처럼 여러 Job이 dependency와 data 관계로 연결된 실행 그래프다.","개별 Job 성공뿐 아니라 단계 간 failure/retry와 data completeness를 함께 관리해야 한다.")
    ],
    sections:[
      sec("Job array는 같은 형태의 많은 Job을 하나의 구조로 표현한다",
        "parameter sweep이나 여러 input file 처리처럼 실행 script는 같고 index만 다른 작업은 array로 표현할 수 있다. 각 element는 자신의 task ID를 사용해 입력과 출력 파일을 선택한다.",
        "이렇게 하면 제출 관리가 단순해지고 전체 workflow를 하나의 array ID 중심으로 관찰할 수 있다. 하지만 모든 task가 같은 output 파일을 쓰면 collision과 corruption이 생길 수 있으므로 path 설계가 필수다.",
        "array의 핵심은 반복 제출이 아니라 parameterized execution이다."),
      sec("동시성 제한은 scheduler뿐 아니라 downstream service를 보호한다",
        "10000개 array element를 한 번에 RUNNING할 필요가 없는 경우 %100처럼 concurrency cap을 둘 수 있다. 이는 cluster resource뿐 아니라 metadata service, license server, database 같은 외부 병목을 보호하는 수단이 된다.",
        "적절한 cap은 전체 완료 시간을 무조건 늘리는 것이 아니라 shared bottleneck을 피하면서 더 안정적인 throughput을 만들 수 있다. 최적 값은 workload와 site policy를 측정해 결정한다.",
        "array concurrency는 운영 안정성과 throughput의 tuning knob다."),
      sec("dependency는 workflow 상태를 scheduler에 전달한다",
        "afterok는 선행 Job이 성공해야 후속 Job을 시작하고, afterany는 성공 여부와 관계없이 종료 후 실행하는 식으로 failure semantics를 표현할 수 있다. 이를 사용하면 shell sleep/polling보다 명확하게 workflow ordering을 만들 수 있다.",
        "대규모 workflow에서는 upstream 실패 시 downstream이 영원히 pending되는지, retry가 새 Job ID를 만들 때 dependency를 어떻게 갱신할지까지 설계해야 한다. scheduler dependency는 data validity 자체를 확인해 주지는 않는다.",
        "workflow는 Job state와 data state를 함께 관리한다.")
    ],
    example:ex("전처리 100개 → 집계 1개 workflow",
      "array와 dependency를 조합해 polling 없는 workflow를 설계한다.",
      [
        {label:"Array",text:"전처리를 --array=0-99%20으로 제출하고 task별 output path를 분리한다."},
        {label:"Dependency",text:"모든 선행 작업 성공 후 집계 Job이 시작되도록 dependency를 설정한다."},
        {label:"Failure",text:"실패 element를 식별하고 재실행 시 aggregation 조건을 다시 확인한다."},
        {label:"Evidence",text:"array ID와 task ID, dependency chain을 ticket에 함께 남긴다."}
      ],
      "scheduler dependency는 workflow control을 표현하지만 output data의 내용 검증은 application 단계에서 별도로 해야 한다."),
    selfCheck:[
      q("array에서 %10의 의미는?","array element 중 동시에 실행될 수 있는 task 수를 10개로 제한한다는 뜻이다."),
      q("afterok와 afterany의 중요한 차이는?","afterok는 선행 Job이 성공해야 만족되고 afterany는 성공/실패와 관계없이 종료되면 만족되는 dependency다."),
      q("Job dependency만으로 data workflow가 완전히 안전하지 않은 이유는?","scheduler는 Job exit state를 알지만 output file이 application 관점에서 완전하고 올바른지까지 검증하지 않기 때문이다.")
    ]
  }
});
