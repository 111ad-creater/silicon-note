export const module8 = {
  id: 'module-8',
  number: '08',
  title: '模块八：性能剖析、排障实战与算力经济学',
  perspectiveTag: '工程师实战视角',
  shortDesc: '落地你的核心职业目标：看懂性能体检报告、熟练用剖析工具揪出气泡与故障、算清每百万 Token 的真实商业账单。',
  accent: 'emerald',
  lessons: [
    {
      id: '8.1',
      title: '8.1 性能“体检指标”全解（TTFT / TPOT / MFU / MBU）',
      isCore: true,
      readTime: '6 分钟',
      tags: ['核心主线', 'TTFT', 'TPOT', 'Goodput', 'MFU/MBU'],
      goal: '分清用户体验指标（TTFT/TPOT）与硬件榨干率指标（MFU 算力利用率 / MBU 带宽利用率）的诊断价值。',
      blocks: [
        { type: 'heading', text: '核心直觉' },
        {
          type: 'paragraph',
          text: '给大模型做性能分析，就像医生看体检报告，不能凭感觉说“感觉有点卡”，必须盯紧 5 个硬核指标：用户刚发完问题要等多久才蹦出第 1 个字（TTFT）？蹦出来之后每秒能吐几个字（TPOT）？整台机器一秒总共能吐多少字（Throughput）？以及芯片的大脑（MFU）和走廊（MBU）到底跑满了几成？',
        },
        { type: 'heading', text: '底层机制拆解' },
        {
          type: 'list',
          ordered: true,
          items: [
            {
              lead: '延迟指标（决定单个用户的体感）：',
              body: 'TTFT（首字延迟，通常要求 < 1~2 秒，对应 Prefill）；TPOT / ITL（单字生成间隔，通常要求 < 50ms，即每秒吐 20 字以上，超过人眼阅读速度，对应 Decode）。',
            },
            {
              lead: '吞吐与有效吞吐（Throughput vs Goodput）：',
              body: '总吞吐（Tokens/s）越高单价越便宜，但盲目把 Batch 塞爆会导致延迟超标、用户流失。**Goodput（有效吞吐）**才是黄金商业指标——指“在同时满足 TTFT 和 TPOT 达标红线（SLO）的前提下，单卡每秒能产出的最大 Token 数”。',
            },
            {
              lead: '硬件压榨效率（MFU 与 MBU）：',
              body: 'MFU（模型算力利用率）= 实际有效 FLOPs ÷ 芯片理论峰值算力（训练和 Prefill 盯着看，40%~60% 已算顶级）；MBU（显存带宽利用率）= 实际有效搬运字节 ÷ 芯片理论 HBM 带宽（Decode 盯着看，70%~85% 算顶级）。',
            },
          ],
        },
        {
          type: 'table',
          title: '核心对比表 · 大模型性能体检五大指标',
          headers: ['体检指标', '英文全称', '关注视角', '大厂常见优秀参考线'],
          rows: [
            ['TTFT', 'Time To First Token', '用户体验（Prefill 速度）', '短文本 < 200ms~500ms，长文本 < 2s'],
            ['TPOT / ITL', 'Time Per Output Token', '用户体验（Decode 流畅度）', '< 30ms~50ms（约 20~33 tok/s）'],
            ['Goodput', 'SLO-compliant Throughput', '商业盈利核心（达标下的吞吐）', '越高越好（决定每百万 Token 成本）'],
            ['MFU', 'Model FLOPs Utilization', '算力压榨率（训练 / Prefill）', '40% ~ 60%+（受限于通信与非矩阵算子）'],
            ['MBU', 'Memory Bandwidth Utilization', '带宽压榨率（Decode 推理）', '70% ~ 85%+（逼近 HBM 物理极限）'],
          ],
        },
        {
          type: 'callout',
          variant: 'engineer',
          title: '性能工程师“算账”视角',
          content:
            '记住延迟（Latency）和吞吐（Throughput）是一对天生的“跷跷板”：想拉高总吞吐，就要拼命加大 Batch，但 Batch 越大单用户延迟就越慢。性能工程师最经典的工作，就是画出 **“吞吐-延迟帕累托前沿曲线（Pareto Curve）”**，在满足用户不卡顿的红线下，把吞吐推到最高点。',
        },
        {
          type: 'quiz',
          question:
            '思考题：如果老板问你：“我们上线了一个推理服务，单用户测试每秒能吐 60 个字，但压测时把并发开到 100 人，每人只剩每秒 5 个字了，怎么用指标解释并优化？”',
          answer:
            '这说明并发从 1 升到 100 时，单用户 TPOT 从 16ms 恶化到了 200ms（虽然系统总吞吐从 60 涨到了 500 tok/s），已经跌破了人类流畅阅读的 SLO 红线，导致 Goodput 归零！优化思路是：先用量化（FP8/AWQ）或 MLA 减少单步搬运量，或通过 PD 分离消除长 Prefill 阻塞，把并发上限控制在 TPOT ≤ 50ms 的最佳甜点区。',
        },
      ],
    },
    {
      id: '8.2',
      title: '8.2 剖析工具链实战（nvidia-smi 到 Nsight Systems）',
      isCore: false,
      readTime: '6 分钟',
      tags: ['nvidia-smi', 'Nsight Systems', 'Nsight Compute', 'Profiler'],
      goal: '学会从宏观 `nvidia-smi` 到 Nsight 火焰图定位 CPU Launch 缝隙、通信堵点与慢 Kernel。',
      blocks: [
        { type: 'heading', text: '核心直觉' },
        {
          type: 'paragraph',
          text: '给 AI 芯片排障，工具分三层：第一层 `nvidia-smi` / `nvtop` 像“体温计”，1 秒看个大概（显存占了多少、温度高不高、卡在不在干活）；第二层 PyTorch Profiler 和 **NVIDIA Nsight Systems（nsys）** 像“心电图时间轴”，能把 CPU、GPU 和网卡每一微秒在干嘛画成彩色条，一眼揪出大片空白“气泡”；第三层 **Nsight Compute（ncu）** 则是“电子显微镜”，专门解剖单个慢算子的内部缓存命中率。',
        },
        { type: 'heading', text: '底层机制拆解' },
        {
          type: 'list',
          ordered: true,
          items: [
            {
              lead: '破除 `nvidia-smi` 的最大骗局：',
              body: '你在终端里看到 `GPU-Util: 100%`，千万别以为芯片已经跑满算力了！`nvidia-smi` 的利用率仅仅代表“过去一秒内，GPU 至少有一个算子在运行的**时间占比**”。哪怕你只动用了 1% 的计算单元在慢吞吞搬数据，它照样显示 100%！真正靠谱的是看功耗（Power 接近 TDP 才说明真在使劲算）和 Nsight 指标。',
            },
            {
              lead: 'Nsight Systems（系统级抓气泡）：',
              body: '导出 `.nsys-rep` 文件打开后，核心盯三条轨道——顶部 CPU Python 轨道、中间 CUDA Runtime 轨道、底部 GPU Kernel 执行轨道。如果 GPU 轨道上出现大段空白间隙（Bubble），往正上方看：如果 CPU 正在狂跑，说明是 CPU 瓶颈；如果 NCCL 通信条特别长，说明卡在通信。',
            },
            {
              lead: 'Nsight Compute（算子级看 Roofline）：',
              body: '如果确认是某一个矩阵乘或自定义算子太慢，用 `ncu` 抓取它，工具会自动帮你画出一张真实的 Roofline 图，直接告诉你这个算子卡在计算、L2 缓存还是 HBM 带宽。',
            },
          ],
        },
        {
          type: 'table',
          title: '核心对比表 · GPU 性能剖析工具链三层架构',
          headers: ['剖析工具', '医疗类比', '核心观测粒度', '最擅长抓什么病'],
          rows: [
            ['`nvidia-smi` / `nvtop`', '体温计与血压计', '秒级宏观概览', '显存是否逼近 OOM、功率是否跑满、是否过热降频'],
            ['PyTorch Profiler', '常规验血单', '算子级耗时榜单', '找出耗时 Top 5 算子、查看显存分配峰值变化'],
            ['Nsight Systems (`nsys`)', '动态心电图时间轴', '微秒级软硬全景', '抓 GPU 空转气泡、CPU 瓶颈、通信计算是否重叠'],
            ['Nsight Compute (`ncu`)', '细胞级电子显微镜', '单 Kernel 时钟周期', '分析单个算子的 Roofline、Occupancy、Bank Conflict'],
          ],
        },
        {
          type: 'callout',
          variant: 'engineer',
          title: '性能工程师“算账”视角',
          content:
            '千万记住“先宏观、后微观”的排障铁律：90% 的真实大模型性能问题（比如 DataLoader 拖后腿、忘开算子融合、无意中触发 CPU-GPU 同步、通信没重叠），在 **Nsight Systems 时间轴** 里看 5 分钟就能抓现行，绝不要一上来就盲目钻进汇编里死磕单个算子！',
        },
        {
          type: 'quiz',
          question:
            '思考题：你在云端 GPU 上跑大模型压测，看到 `nvidia-smi` 显示 GPU-Util 高达 99%，但功耗（Power）只有 150W（这张卡满载功耗是 400W）。这通常说明了什么？',
          answer:
            '说明 GPU 虽然一直在执行 Kernel 没闲着，但几乎全在“等显存数据搬运（严重 Memory-Bound）”或者跑着大量利用率极低的小算子，核心的 Tensor Core 矩阵计算单元根本没吃饱，远没有达到满血算力输出。',
        },
      ],
    },
    {
      id: '8.3',
      title: '8.3 典型性能故障排障手册（OOM / 气泡 / 死锁）',
      isCore: false,
      readTime: '6 分钟',
      tags: ['OOM', 'CUDA Graph', 'NCCL Hang', '排障手册'],
      goal: '建立 OOM 显存溢出、流水线气泡与 NCCL 通信挂起（Hang）的标准化排查树。',
      blocks: [
        { type: 'heading', text: '核心直觉' },
        {
          type: 'paragraph',
          text: '这一节就是你最擅长的“侦探破案手册”。AI 系统上线和压测时，报错和变慢千奇百怪，但剥开表象，80% 的故障都逃不出下面这 5 大经典“罪犯”。记住它们的作案特征和排查顺序，你就能在团队里迅速建立极强的排障口碑。',
        },
        { type: 'heading', text: '底层机制拆解' },
        {
          type: 'list',
          ordered: true,
          items: [
            {
              lead: '罪犯 1：CUDA Out of Memory（OOM 爆显存）—— ',
              body: '先分清是“模型权重就装不下”还是“跑着跑着被 KV Cache / 激活值撑爆”，或是“显存碎片化”。推理侧查 `max_model_len`、`gpu_memory_utilization` 和是否漏开量化；训练侧查 Batch Size、是否漏开重计算/ZeRO，以及代码里是否不小心把带梯度图的 Tensor 存进了全局列表导致内存泄漏。',
            },
            {
              lead: '罪犯 2：CPU 瓶颈（DataLoader / Tokenizer 拖死 GPU）—— ',
              body: '现象是 GPU 时间轴大片空白、功耗跳水。排查方向：增加数据加载进程数（`num_workers`）、开启锁页内存（`pin_memory=True`）、把耗时的文本分词和预处理放到异步进程池。',
            },
            {
              lead: '罪犯 3：隐式同步与 Kernel Launch 开销 —— ',
              body: '代码里无意写了一句 `print(loss.item())` 或 `if tensor > 0:`，强迫 GPU 立刻停下所有流水线等 CPU 读完这个数再继续！解决方法：减少频繁向 CPU 回传标量，小 Batch 推理开启 **CUDA Graph**（把几百个小 Kernel 录成一整段宏指令一次性发射，彻底干掉 CPU 发射延迟）。',
            },
            {
              lead: '罪犯 4：多卡 NCCL 通信死锁 / 超时（Hang）—— ',
              body: '现象是 GPU 利用率死锁在 100% 但日志几十分钟不动。通常是某张卡走了不同的 `if` 分支导致少发了一次 AllReduce（大家互相死等），或是防火墙/网卡配置错误。打开 `NCCL_DEBUG=INFO` 日志定位卡死在哪一步。',
            },
          ],
        },
        {
          type: 'table',
          title: '核心对比表 · 四大常见故障排查矩阵',
          headers: ['典型故障现象', '头号嫌疑犯', '第一步验证手段', '立竿见影的修复动作'],
          rows: [
            ['启动/运行中报 OOM', 'KV Cache 溢出 / 激活值过大 / 碎片', '看显存峰值曲线与模型静态估算', '降 max_len、开 AWQ/FP8、开重计算或 ZeRO'],
            ['GPU 轨道大片空白气泡', 'CPU 预处理慢 / 隐式同步锁', '抓 Nsight Systems 看 CPU 与 GPU 轨道', '删 `.item()` 同步、加 workers、开 CUDA Graph'],
            ['多卡跑着跑着彻底卡死', 'NCCL 集合通信不对称死锁 / 网卡故障', '开 `NCCL_DEBUG=INFO` 查最后一行', '检查分支是否对齐、排查 IB/RoCE 网络连通性'],
            ['压测吞吐远低于理论值', 'Batch 太小 / 未对齐 Tensor Core', '纸面算账对比 MBU/MFU 与理论天花板', '增大并发、开 Continuous Batching、对齐维度'],
          ],
        },
        {
          type: 'callout',
          variant: 'engineer',
          title: '性能工程师“算账”视角',
          content:
            '遇到任何奇葩报错或性能暴跌，保持“控制变量二分法”：先用最小模型/最小长度/单卡跑通基准线，然后每次只打开一个优化开关（如先开 FP8、再开 Prefix Caching、再开多卡 TP），记录每一步的指标变化。这是把一团乱麻理成清晰破案报告的终极心法。',
        },
        {
          type: 'quiz',
          question:
            '思考题：为什么在 vLLM 推理服务刚启动时，往往会先停顿十几秒显示“Capturing CUDA Graphs”？这个步骤在解决什么性能痛点？',
          answer:
            'Decode 阶段每个小算子在 GPU 上只需运行几微秒，如果每次都靠 CPU 逐个发射，CPU 发射指令的速度甚至赶不上 GPU 算完的速度（Kernel Launch Bound）。CUDA Graph 提前把一整套前向计算的所有小 Kernel 录制成静态指令图，推理时 CPU 只需发 1 次总指令，彻底消除发射延迟。',
        },
      ],
    },
    {
      id: '8.4',
      title: '8.4 硅后评测与基准测试（MLPerf 与对照实验）',
      isCore: false,
      readTime: '6 分钟',
      tags: ['MLPerf', 'Warmup', 'P99 延迟', '对照实验'],
      goal: '避开跑分注水陷阱，看懂 MLPerf 离线/服务态规则与严谨对照压测的实验设计。',
      blocks: [
        { type: 'heading', text: '核心直觉' },
        {
          type: 'paragraph',
          text: '为什么两家芯片公司测同一个大模型，各自发布的 PPT 上都能把自己吹成“遥遥领先”？因为基准测试（Benchmarking）里藏着无数猫腻！真正专业的大厂性能评测工程师，必须懂得行业统一裁判标准（如 MLPerf），并能设计出滴水不漏、别人挑不出毛病的科学对照实验。',
        },
        { type: 'heading', text: '底层机制拆解' },
        {
          type: 'list',
          ordered: true,
          items: [
            {
              lead: '认识 MLPerf（AI 芯片界的奥林匹克）：',
              body: '由全球芯片和云厂商共同制定的权威评测体系（分训练和推理两大榜单）。它严格规定了测试模型、精度达标红线（不能为了提速把模型量化成智障）、输入长度分布以及 4 大场景（单流、多流、服务器离线高吞吐、在线带延迟红线 Server 场景）。',
            },
            {
              lead: '做实验必须守住的 4 条军规：',
              body: '1）**必须预热（Warmup）**（前几次运行包含显存分配、CUDA 初始化和编译开销，必须扔掉不计入成绩）；2）**精准计时**（GPU 是异步执行的，直接用 Python `time.time()` 测出来的是假时间，必须配合 `torch.cuda.synchronize()` 或 CUDA Event）；3）**消除热节流抖动**（连续跑久了风扇压不住降频会导致成绩前后不一）；4）**看分位数（P99 / P95）而不是只看平均值**（平均延迟 200ms 但 1% 用户卡 5 秒，线上体验依然灾难）。',
            },
            {
              lead: '写出大厂级性能分析报告的结构：',
              body: '实验环境（硬件型号、驱动/CUDA/框架版本、精确启动参数）→ 理论天花板算账 → 实测核心指标曲线（TTFT/TPOT vs 并发数）→ Nsight 瓶颈定位截图 → 下一步可落地的优化建议。',
            },
          ],
        },
        {
          type: 'table',
          title: '核心对比表 · 基准测试踩坑 vs 专业规范',
          headers: ['新手测试常见造假/踩坑', '真实后果', '专业工程师的正确做法'],
          rows: [
            ['不做 Warmup 直接测第 1 次', '把编译和加载耗时算进去，延迟偏高十倍', '先空跑 3~5 轮预热，再正式采集多轮数据'],
            ['用普通 `time.time()` 测 GPU', '测的只是 CPU 发任务的时间，结果虚高', '使用 `torch.cuda.Event` 或同步后再打点'],
            ['只汇报平均延迟（Mean）', '掩盖了长尾卡顿（Prefill 阻塞毛刺）', '同时汇报 Mean、P50、P95 和 P99 分位数'],
            ['不锁温度/频率、不控输入分布', '每次跑分结果飘忽不定，无法复现对比', '固定随机种子、真实业务长度分布、记录完整版本'],
          ],
        },
        {
          type: 'callout',
          variant: 'engineer',
          title: '性能工程师“算账”视角',
          content:
            '当你花 5 块钱去 AutoDL 租一张云端显卡跑 vLLM 压测实验时，严格按照上面这 4 条军规来做，并输出一份带“环境配置 + 理论天花板对比 + 实测 P99 曲线 + 排障日记”的报告贴在个人网站上——这份简历作品集的含金量，能直接秒杀绝大多数只会调包跑 Demo 的竞争对手。',
        },
        {
          type: 'quiz',
          question:
            '思考题：为什么在在线大模型推理服务评测中，工程师往往比平均值（Mean）更紧张 P99 延迟（最慢的 1% 请求的耗时）？',
          answer:
            '一个完整对话或复杂 Agent 任务往往包含几十次甚至上百次大模型调用或流式吐字。哪怕平均延迟极快，只要 P99 存在几秒的毛刺卡顿，用户在一次完整交互中几乎必然会撞上卡顿，严重摧毁产品体验，而 P99 恰恰是暴露 Prefill 阻塞、显存换出（Swapping）或垃圾回收（GC）停顿的最佳探针。',
        },
      ],
    },
    {
      id: '8.5',
      title: '8.5 算力经济学与“算力平权”（TCO 与百万 Token 成本）',
      isCore: false,
      readTime: '6 分钟',
      tags: ['TCO', '百万 Token 成本', '算力平权', '商业闭环'],
      goal: '把显卡采购、机柜电费、折旧率与有效吞吐换算成每百万 Token 的真实商业成本。',
      blocks: [
        { type: 'heading', text: '核心直觉' },
        {
          type: 'paragraph',
          text: '所有的芯片架构创新、量化算法和推理引擎优化，最终都要接受商业世界最残酷的一道终极拷问：**“每生成 100 万个 Token，到底要花多少钱（$/1M Tokens）？”** 算清这笔账，你就能看懂为什么顶尖 AI 芯片的性能优化，本质上是在推动全人类的“算力平权”。',
        },
        { type: 'heading', text: '底层机制拆解' },
        {
          type: 'list',
          ordered: true,
          items: [
            {
              lead: '智算中心的 TCO（总拥有成本）：',
              body: '买显卡只是开始！一座 AI 数据中心的真实成本 = 硬件采购折旧（GPU 服务器、昂贵的 IB 交换机和光模块，按 3~5 年折旧） + 机房基建与散热（液冷改造成本） + 惊人的电费（一台 8 卡 10kW 满载机柜，3 年电费就可能逼近服务器本身成本的 20%~30%）。',
            },
            {
              lead: '单 Token 推理成本的终极公式：',
              body: '每百万 Token 成本 = 机器每小时综合 TCO 租金 ÷ (单机每小时有效产出 Goodput Tokens ÷ 10^6)。这个公式清晰地指明了降本的唯二路径：要么把分子（硬件采购与能耗成本）打下来，要么把分母（单卡有效吞吐 Goodput）翻倍拉上去！',
            },
            {
              lead: '算力平权的工程奇迹：',
              body: '过去两三年，同等级智商的大模型 API 价格暴跌了超过 100 倍！这绝不是靠摩尔定律自然降价，而是**开源模型架构革新（MoE + MLA）× 低精度硬件演进（BF16 -> FP8 -> FP4）× 推理系统极限压榨（vLLM / SGLang / PD 分离）**三股力量相乘的奇迹——让原本只有巨头烧得起的顶级智能，变成了全世界普通人都能零门槛用上的水电煤。',
            },
          ],
        },
        {
          type: 'table',
          title: '核心对比表 · 算力降本三大杠杆',
          headers: ['降本杠杆', '核心技术抓手', '对 $/1M Tokens 成本的乘数效应'],
          rows: [
            ['算法与架构杠杆', 'MoE 稀疏激活 + GQA/MLA + 蒸馏小模型', '直接砍掉 5x ~ 10x 计算量与 KV 显存'],
            ['硬件与精度杠杆', 'FP8/FP4 低精度 + 高能效芯片 + 多元国产算力', '打破单一硬件溢价，单位瓦特算力提升 2x ~ 4x'],
            ['系统与排障杠杆', 'vLLM 分页 + PD 分离 + 投机采样 + 压榨 MFU/MBU', '把同一块卡的 Goodput 吞吐拉高 3x ~ 8x'],
          ],
        },
        {
          type: 'callout',
          variant: 'engineer',
          title: '性能工程师“算账”视角',
          content:
            '当你用性能剖析工具把线上集群的 MBU 从 40% 优化到 75%、把显存碎片清零让并发翻倍时，你省下的不仅仅是几行代码的耗时——在万卡规模下，你亲手帮公司省下了上亿元的电费与显卡采购费，更让成千上万普通人能以极低甚至免费的代价用上最强大的 AI。这就是 AI 芯片性能工程师最硬核、也最酷的价值所在。',
        },
        {
          type: 'quiz',
          question:
            '思考题：假设一台 8 卡 GPU 服务器的综合成本（含折旧、机柜和电费）折合每小时 20 美元。在满足延迟红线的前提下，经过你的系统调优，整机有效输出吞吐从每秒 1,000 Tokens 提升到了每秒 4,000 Tokens。每百万 Output Token 的推理硬件成本从多少降到了多少？',
          answer:
            '优化前：每小时产出 1,000 × 3,600 = 3.6M Tokens，成本 = $20 ÷ 3.6 ≈ $5.56 / 1M Tokens；优化后：每小时产出 4,000 × 3,600 = 14.4M Tokens，成本骤降至 $20 ÷ 14.4 ≈ $1.39 / 1M Tokens（成本直降 75%！）。',
        },
      ],
    },
    {
      id: '8.6',
      title: '8.6 多卡真听诊器（DCGM / nccl-tests / RDMA）、硅后 DVFS 与招聘避坑雷达',
      isCore: true,
      readTime: '8 分钟',
      tags: ['核心主线', 'DCGM', 'nccl-tests', 'DVFS 热节流', '硅后验证', 'JD 避坑'],
      goal: '用 DCGM 揭穿假 100% Util 骗局，用 nccl-tests 定界多卡硬件裸带宽，算清 DVFS 功耗与热节流，并练就 10 秒识别 JD 陷阱的雷达。',
      blocks: [
        { type: 'heading', text: '核心直觉' },
        {
          type: 'paragraph',
          text: '新手只看 `nvidia-smi` 的 `GPU-Util: 100%` 就以为显卡吃满了，其实那是业内最大视觉骗局！真正的高手会用 DCGM 看穿假满载、用 `nccl-tests` / `ib_write_bw` 测出多卡裸带宽、用 DVFS 公式一秒破案热节流降频；同时还能在招聘软件里 10 秒识破“硅前 SV/UVM”“服务器画主板”“家电节能”等文字游戏陷阱！',
        },
        { type: 'heading', text: '底层机制拆解' },
        {
          type: 'list',
          ordered: true,
          items: [
            {
              lead: '揭穿假 100% Util 骗局：',
              body: '`GPU-Util` 只代表采样窗口内至少有 1 个 Kernel 活跃的时间占比，哪怕 99% 核心都在摸鱼等显存也会显示 100%！必须结合实时功耗（是否顶到 TDP）与 `dcgmi dmon`（看真实 SM 活跃度、Tensor Core 占比和 HBM 带宽利用率）。',
            },
            {
              lead: '多卡高速互连与裸带宽测速（RDMA + `nccl-tests`）：',
              body: 'GPUDirect RDMA 绕过 OS 内核与 CPU 内存拷贝（Zero-Copy & Kernel-Bypass），网卡直接读写远端 GPU 显存。排查集群慢时，先跑 `nccl-tests`（如 `all_reduce_perf` / `alltoall_perf`）和 `ib_write_bw` 测硬件裸带宽，一秒分清是“网线/网卡有问题”还是“业务代码写慢了”！',
            },
            {
              lead: '硅后 Bring-up 与 DVFS 热节流：',
              body: '芯片动态功耗 P = α·C·V²·f（降压 10% + 降频 10% 可省电约 27%）+ 随温度指数暴涨的静态漏电。温度破红线（如 85℃）触发 Thermal Throttling 降频时，用 `nvidia-smi -q -d PERFORMANCE` 一秒破案；同时掌握「硅前 DV（SV/UVM 避坑）vs 硅后 Bring-up / GPU 架构建模 / NPU 高性能计算 / AI Infra（目标冲刺）」的招聘扫雷法则。',
            },
          ],
        },
        {
          type: 'table',
          title: '核心对比表 · 高级排障命令与选岗扫雷清单',
          headers: ['高级排障 / 选岗维度', '核心命令 / 红旗避坑词', '一眼破案结论'],
          rows: [
            ['假满载与降频破案', '`nvidia-smi dmon -s pucm` | `nvidia-smi -q -d PERFORMANCE`', 'Util=99% 但功耗远低 TDP = 假满载；Thermal Slowdown Active = 热节流降频'],
            ['多卡裸带宽与真监控', '`nccl-tests (all_reduce_perf)` | `ib_write_bw` | `dcgmi dmon`', '先测硬件裸带宽定界“网慢还是代码慢”；DCGM 直出真实 Tensor Core 占比'],
            ['梦中情岗精准搜索词', 'GPU架构建模 / NPU高性能计算 / AI Infra / AI芯片性能分析 / 硅后验证', '0 Verilog/模拟电路，吃满 IC 背景 + 排障直觉，直击算力平权'],
            ['招聘文字陷阱黑名单', 'SV+UVM+VCS/Verdi；硬件架构师(PCB Layout)；物流BRD；空调冰箱节能', '遇到这 4 类红旗词直接划走，绝不踩硅前验证或非芯片岗的坑'],
          ],
        },
        {
          type: 'jd_radar',
          title: 'JD 关键词避坑雷达（6 题互动判别小测验）',
          subtitle: '遇到下面 6 条真实招聘 JD 关键词描述，判断该「冲 ✅」还是「逃 ❌」（点击即时判分）',
          items: [
            {
              id: 'jd-1',
              role: 'GPU 架构师 / 架构建模工程师',
              snippet: '熟悉 C++/SystemC/Python，负责 AI 负载建模（Workload Characterization）、性能瓶颈定位与软硬件接口抽象设计，无需编写 RTL。',
              verdict: 'go',
              reason: '冲 ✅！纯正 GPU 架构建模与系统性能方向，完美发挥 IC 背景 + AI 系统直觉，不碰 Verilog。',
            },
            {
              id: 'jd-2',
              role: 'AI 芯片数字验证工程师（Pre-Silicon DV）',
              snippet: '精通 SystemVerilog 与 UVM 验证方法学，熟练使用 VCS、Verdi 进行 RTL 波形调试与覆盖率收敛。',
              verdict: 'run',
              reason: '逃 ❌！这是典型的“硅前数字验证（Pre-Silicon DV）”岗位，天天写 SV/UVM 看 RTL 波形，偏离 AI 系统与性能分析主线。',
            },
            {
              id: 'jd-3',
              role: 'NPU 高性能计算 / 推理系统优化工程师',
              snippet: '负责将 vLLM / SGLang / ONNX 大模型适配至自研 NPU，使用 Profiler 排查算子回退、驱动下发瓶颈并做竞品对标。',
              verdict: 'go',
              reason: '冲 ✅！国产 NPU 软件栈与大模型推理优化的核心岗位，4.6/5.7 课技能直接对口。',
            },
            {
              id: 'jd-4',
              role: '资深硬件系统架构师（Server Hardware）',
              snippet: '负责 AI 服务器整机供电方案、原理图设计与高速 PCB Layout 评审，熟悉电源芯片选型与信号完整性。',
              verdict: 'run',
              reason: '逃 ❌！名字叫“硬件架构师”，实际是服务器主板/PCB 画板子岗位，不是芯片架构或算力系统。',
            },
            {
              id: 'jd-5',
              role: 'AI Infra / 集群性能分析工程师',
              snippet: '精通 Nsight Systems / DCGM / nccl-tests 集群性能剖析，优化大规模 MoE 推理吞吐、Goodput 与 P99 长尾延迟。',
              verdict: 'go',
              reason: '冲 ✅！AI Infra 黄金赛道，直接用 Roofline、Nsight、nccl-tests 与算力经济学撬动业务降本。',
            },
            {
              id: 'jd-6',
              role: 'AI 能耗算法工程师（某传统家电大厂）',
              snippet: '基于强化学习优化商用空调压缩机与冷库冰箱的群控节能调度，熟悉 BRD 需求文档撰写与家电嵌入式固件联调。',
              verdict: 'run',
              reason: '逃 ❌！挂着“AI 能耗优化”名头，实际是空调冰箱控温或传统业务 BRD，与 AI 芯片/算力系统毫无关系。',
            },
          ],
        },
        {
          type: 'callout',
          variant: 'engineer',
          title: '面试必杀问答储备',
          copyText: `nvidia-smi dmon -s pucm\nnvidia-smi -q -d PERFORMANCE | grep -A 10 "Clocks Throttle Reasons"`,
          content:
            '问：「`nvidia-smi` 显示 GPU 利用率 99%，是不是显卡已经跑满了？」\n答：「不是！那只是时间窗口内有 Kernel 活跃的占比。判断真满载必须看三合一：实时功耗是否接近 TDP、用 DCGM 看 Tensor Core / DRAM 真实占比，以及用 Nsight Systems (`nsys`) 看时间轴里有没有空白气泡。」',
        },
        {
          type: 'quiz',
          question:
            '思考题：为什么排查多机多卡训练变慢时，资深 AI Infra 工程师的第一反应不是去翻几万行 PyTorch 业务代码，而是先跑一遍 `nccl-tests` 和 `ib_write_bw`？',
          answer:
            '这是经典的“二分法定界排障思维”：花 30 秒跑一次官方标准通信基准 `nccl-tests`，如果裸机 AllReduce 带宽都只有理论值的 20%，说明是机房交换机、RDMA 驱动或网口降速的底层硬件/网络故障，翻一天业务代码也白搭；如果裸带宽满血达标，就立刻把嫌疑锁定在业务代码或并行切分策略上。',
        },
      ],
    },
  ],
};
