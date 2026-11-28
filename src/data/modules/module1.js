export const module1 = {
  id: 'module-1',
  number: '01',
  title: '模块一：AI 芯片硬件架构全景',
  perspectiveTag: '芯片设计视角',
  shortDesc: '打破“只有英伟达”的盲区，看懂 GPU、TPU、NPU、LPU 的底层计算哲学与硬件差异。',
  accent: 'sky',
  lessons: [
    {
      id: '1.1',
      title: '1.1 计算范式演进（CPU vs GPU vs ASIC）',
      isCore: true,
      readTime: '6 分钟',
      tags: ['核心主线', 'CPU/GPU/ASIC', 'TPU', '架构哲学'],
      goal: '看懂硅片面积预算的本质取舍：为什么“1 位教授”干不赢“1 万名专算乘加的小学生”。',
      blocks: [
        { type: 'heading', text: '核心直觉' },
        {
          type: 'paragraph',
          text: '如果把计算比作解数学题：CPU 是 4 位全能数学博士，逻辑极强、能解复杂微积分并指挥全局，但人数太少；GPU 是 4000 名只会做加减乘除的小学生，单人解不了复杂逻辑，但同时发 100 万道口算题（矩阵乘法）一秒就能算完；ASIC/TPU 则是只干一道工序的定制印钞机，电路天生为矩阵乘法焊死，最快最省电，但干不了别的活。',
        },
        { type: 'heading', text: '底层机制拆解' },
        {
          type: 'list',
          ordered: true,
          items: [
            {
              lead: 'CPU 为“低延迟（Low Latency）”而生：',
              body: '把绝大部分晶体管面积花在控制单元（分支预测、乱序执行）和大容量缓存（Cache）上，真正做加减乘除的 ALU 占比很小，目标是让单个复杂任务尽快跑完。',
            },
            {
              lead: 'GPU 为“高吞吐（High Throughput）”而生：',
              body: '大幅砍掉复杂控制逻辑和超大缓存，把绝大部分芯片面积铺满密密麻麻的计算单元，追求单位时间内总共算完多少亿次乘法。',
            },
            {
              lead: 'ASIC 为“极致能效（PPA）”而生：',
              body: '去掉通用指令调度，将数据流路径固化在硬件里，省掉大量取指、译码开销，把每一瓦特电力都压榨到矩阵计算上。',
            },
          ],
        },
        {
          type: 'table',
          title: '核心对比表 · CPU vs GPU vs ASIC',
          headers: ['对比维度', 'CPU', 'GPU', 'ASIC（如 Google TPU）'],
          rows: [
            ['核心设计目标', '极致低延迟、复杂逻辑控制', '极致高吞吐、大规模并行', '极致能效比、特定算子加速'],
            ['擅长任务', '操作系统、数据库、分支跳转', '图形渲染、大模型训练与推理', '固定架构的深度学习矩阵计算'],
            ['编程灵活性', '极高（什么都能跑）', '高（CUDA 生态极其成熟）', '低（新模型算子可能不支持）'],
            ['能效比（算力/瓦）', '低', '中高', '极高'],
            ['典型代表', 'Intel Xeon / AMD EPYC', 'NVIDIA H100 / B200', 'Google TPU v5p / Groq LPU'],
          ],
        },
        {
          type: 'callout',
          variant: 'engineer',
          title: '性能工程师“算账”视角',
          content:
            '大模型推理并不是不需要 CPU。在真实集群里，CPU 负责接收请求、分词（Tokenization）和下发指令，GPU 负责暴力算矩阵；整卡还受制于 TDP（热设计功耗）预算，一旦散热受限触发 Thermal Throttling（热节流）降频，算力就会瞬间掉档。排障时常见一种假象：GPU 利用率上不去，不是 GPU 慢，而是 CPU 预处理和发任务太慢，导致几千名“小学生”干坐着等发卷子（CPU-Bound）。\n核心工程表达：芯片选型本质是 Silicon Area & TDP Budget（硅片面积与功耗预算）下 Control Logic 与 Compute Density（控制逻辑与计算密度）的权衡。',
        },
        {
          type: 'quiz',
          question:
            '思考题：既然 TPU 算矩阵乘法比 GPU 更省电、效率更高，为什么现在市面上大家抢的还是英伟达 GPU，而不是全换成 TPU？',
          answer:
            '核心在于通用性与软件生态（CUDA）。AI 算法迭代极快（从 CNN 到 Transformer 再到 MoE、Mamba），每次出现不规则新算子，GPU 靠灵活通用架构和成熟 CUDA 生态几天就能适配；而高度定制的 ASIC 一旦遇到硬件未预留的新算子，要么跑不动，要么退化到极慢的速度。',
        },
      ],
    },
    {
      id: '1.2',
      title: '1.2 解剖现代 GPU（SM / SIMT / Warp）',
      isCore: true,
      readTime: '6 分钟',
      tags: ['核心主线', 'SM', 'SIMT', 'Warp', 'Occupancy'],
      goal: '建立流式多处理器 SM 与 32 线程束 Warp 的硬件直觉，明白为什么分支分化会腰斩算力。',
      blocks: [
        { type: 'heading', text: '核心直觉' },
        {
          type: 'paragraph',
          text: 'GPU 内部像一座管理极严的超级工厂：SM（流多处理器）是上百个独立车间；每个车间里工人每 32 人编成一个军训方阵（Warp）；Warp Scheduler（线程束调度器）喊一声口令，32 个人必须同时执行完全相同的动作，只是手里拿的数据不同，这就是 SIMT 执行模型（单指令多线程）。如果代码里写了太多 if/else 让同方阵线程走不同路径，就会发生 Warp Divergence（分支发散），串行轮流执行直接腰斩有效吞吐。',
        },
        { type: 'heading', text: '底层机制拆解' },
        {
          type: 'list',
          ordered: true,
          items: [
            {
              lead: '零开销切换（Latency Hiding）：',
              body: '从显存（HBM）搬数据极慢，要等几百个时钟周期。GPU 的绝招是在每个 SM 车间里同时驻扎几十个备用方阵（Warp）。1 号方阵等显存卡住时，教官在 1 个时钟周期内直接切换去指挥 2 号方阵干活，只要方阵够多，计算机器就永不停歇。',
            },
            {
              lead: '寄存器“秒切”支撑：',
              body: '每个方阵的临时状态都直接揣在各自专属的寄存器（工人口袋）里，切换方阵完全不需要像 CPU 切换线程那样保存和恢复上下文。',
            },
            {
              lead: '分支发散（Warp Divergence）陷阱：',
              body: '因为 32 人共用一个教官，如果代码出现 if-else 导致 16 人走分支 A、16 人走分支 B，教官只能先让前 16 人做 A（后 16 人罚站），再让后 16 人做 B（前 16 人罚站），有效算力瞬间腰斩。',
            },
          ],
        },
        {
          type: 'table',
          title: '核心对比表 · GPU 硬件/执行层级解剖',
          headers: ['硬件/执行层级', '生活类比', '核心作用'],
          rows: [
            ['SM（流多处理器）', '独立生产车间', 'GPU 的基本算力模块，含计算核心、寄存器和共享内存'],
            ['CUDA Core', '单个工位', '负责基础标量（单个数字）加减乘除与特殊函数运算'],
            ['Warp（32 Threads）', '32 人军训方阵', 'GPU 调度与执行指令的最小基本单位'],
            ['Register（寄存器）', '工人口袋', '速度最快，保存每个方阵实时状态，实现 1 周期秒切'],
          ],
        },
        {
          type: 'callout',
          variant: 'engineer',
          title: '性能工程师“算账”视角',
          content:
            '在 Nsight 等性能剖析工具中，Occupancy（占用率）衡量每个 SM 车间里塞进了多少活跃 Warp。GPU 靠海量活跃 Warp 零开销切换实现 Latency Hiding（延迟隐藏）：当一个 Warp 等显存返回时，Warp Scheduler（线程束调度器）立刻切去执行下一个就绪 Warp。如果单线程占用寄存器太多导致占用率过低，备用方阵不足，GPU 就会暴露大量 Stall（停顿）。\n核心工程表达：GPU 依赖 SIMT 执行模型与高 Occupancy 实现 Latency Hiding（延迟隐藏），同时需警惕 Warp Divergence（分支发散）导致的流水线空转。',
        },
        {
          type: 'quiz',
          question: '思考题：为什么写 GPU 高性能算子时，工程师最讨厌在代码里写大量的 if-else 条件判断？',
          answer:
            '因为 GPU 按 32 线程（Warp）同步执行 SIMT 指令。同一 Warp 内线程走向不同分支会触发分支发散（Warp Divergence），并行执行被迫退化为串行，造成大量计算单元在等待中白白浪费。',
        },
      ],
    },
    {
      id: '1.3',
      title: '1.3 矩阵引擎核心（Tensor Core 与稀疏计算）',
      isCore: true,
      readTime: '6 分钟',
      tags: ['核心主线', 'Tensor Core', '2:4 稀疏', 'TMA'],
      goal: '理解 Tensor Core 如何单周期吞吐整块小矩阵，以及 2:4 结构化稀疏如何换取翻倍峰值算力。',
      blocks: [
        { type: 'heading', text: '核心直觉' },
        {
          type: 'paragraph',
          text: '普通 CUDA Core 像拿着笔一个格子一个格子填表，1 周期算 1 次乘加；而 Tensor Core 像拿着一块 4×4 甚至更大的活字印刷大印章，1 个时钟周期直接把整个小矩阵的乘法和累加（D = A × B + C）一次性盖章算完，吞吐量暴涨十几倍。',
        },
        { type: 'heading', text: '底层机制拆解' },
        {
          type: 'list',
          ordered: true,
          items: [
            {
              lead: '混合精度矩阵乘加（MMA）：',
              body: 'Tensor Core 天生为低精度 AI 计算而生。输入矩阵用 FP16/BF16/FP8 搬运（省带宽、省面积），内部相乘后用高精度（如 FP32）累加，兼顾速度与模型精度。',
            },
            {
              lead: '2:4 结构化稀疏（Structured Sparsity）：',
              body: '大模型权重里大量数值接近 0，乘以 0 等于白算。英伟达规定每连续 4 个数字里至少有 2 个为 0，硬件只需极小的 2-bit 索引即可跳过那一半零值，直接让矩阵乘法峰值算力凭空翻倍（2x）。',
            },
            {
              lead: '张量内存加速器（TMA）：',
              body: '新一代 GPU（如 Hopper/Blackwell）还为 Tensor Core 配了专属异步搬运工 TMA，让数据搬运和矩阵盖章完全并行。',
            },
          ],
        },
        {
          type: 'table',
          title: '核心对比表 · GPU 计算引擎对比',
          headers: ['计算引擎', '单周期处理对象', '硬件特点', '适用场景'],
          rows: [
            ['CUDA Core', '标量（1×1）', '极其灵活，支持各类复杂数学函数', '激活函数、Softmax、常规逻辑'],
            ['Tensor Core（稠密）', '矩阵块（如 16×8×16）', '专为矩阵乘加设计，算力暴涨', 'Linear 线性层、Attention 矩阵乘'],
            ['Tensor Core（2:4 稀疏）', '压缩后的稀疏矩阵块', '硬件跳过 50% 零值，算力再翻倍', '经 2:4 剪枝微调的推理大模型'],
          ],
        },
        {
          type: 'callout',
          variant: 'engineer',
          title: '性能工程师“算账”视角',
          content:
            'Tensor Core MMA（Matrix Multiply-Accumulate）指令极其挑食，要求输入矩阵的长宽维度最好是 8 或 16 的整数倍（FP8 下甚至要求 32 对齐）；配合 2:4 Structured Sparsity（结构化稀疏，每 4 个权重至少 2 个为零并压缩索引），峰值算力还能再翻倍。排障时若发现某个 Linear 层莫名其妙慢了几倍，先检查维度是不是 1023 这类非对齐“奇葩数字”——未对齐会导致硬件无法走满 Tensor Core MMA 甚至退回 CUDA Core。\n核心工程表达：Tensor Core MMA 通过粗粒度矩阵乘加与 2:4 Structured Sparsity（结构化稀疏）压榨单位面积计算密度，强依赖矩阵维度内存对齐。',
        },
        {
          type: 'quiz',
          question:
            '思考题：为什么硬件只支持“2:4 结构化稀疏”，而不直接支持“随机砍掉 50% 零值”的非结构化稀疏？',
          answer:
            '非结构化稀疏的 0 分布完全随机，硬件必须记录每个非零元素的坐标且访存极度不规则，索引与对齐开销会彻底抵消省下的计算量；而 2:4 稀疏将零值限制在极小的 4 选 2 组合内，硬件多路选择电路极其简单高效。',
        },
      ],
    },
    {
      id: '1.4',
      title: '1.4 解剖 Google TPU（脉动阵列 Systolic Array）',
      isCore: true,
      readTime: '6 分钟',
      tags: ['核心主线', 'TPU', '脉动阵列', 'XLA'],
      goal: '用“数据像心跳在网格里接力流动”的画面，看懂脉动阵列为何能省掉大量寄存器读写能耗。',
      blocks: [
        { type: 'heading', text: '核心直觉' },
        {
          type: 'paragraph',
          text: 'GPU 算矩阵像一群工人反复跑去仓库拿原料、算完再放回仓库；Google TPU 的脉动阵列（Systolic Array）则像心脏泵血：把权重提前固定在 128×128 或 256×256 的方格阵里，输入数据从左边一拍一拍流进去，每流过一个方格就乘加一次并直接传给右边邻居，全程几乎不碰外部显存！',
        },
        { type: 'heading', text: '底层机制拆解' },
        {
          type: 'list',
          ordered: true,
          items: [
            {
              lead: '数据复用到极致：',
              body: '脉动阵列把几万个乘加单元（MAC）直接手拉手连成二维网格。输入激活值横向流动，部分累加和纵向流动，一个数据从 SRAM 读出来一次，就能在阵列里被复用上百次，大幅砍掉访存能耗。',
            },
            {
              lead: '权重驻留（Weight Stationary）：',
              body: '先将模型权重加载到阵列格子中固定不动，然后让不同用户的输入批次（Batch）像水流一样连续冲刷过去，批量越大，阵列填得越满、效率越高。',
            },
            {
              lead: '去控制化设计：',
              body: 'TPU 几乎没有 GPU 那种复杂的 Warp 调度器和海量寄存器，省出来的芯片面积全拿去堆更大的矩阵乘法单元（MXU）和更大的片上 SRAM。',
            },
          ],
        },
        {
          type: 'table',
          title: '核心对比表 · GPU vs Google TPU',
          headers: ['对比维度', 'GPU（Tensor Core + SIMT）', 'Google TPU（脉动阵列 MXU）'],
          rows: [
            ['数据流动方式', '通过寄存器与共享内存反复读写', '数据在 MAC 网格间像脉搏一样相邻接力'],
            ['阵列规模', '分散在百余个 SM 中的小块 Tensor Core', '巨型集中式矩阵阵列（如 128×128 / 256×256）'],
            ['小 Batch / 不规则计算', '表现较好，调度灵活', '阵列填不满，利用率暴跌'],
            ['大 Batch 稠密矩阵能效', '高', '极高（省去大量片内访存功耗）'],
          ],
        },
        {
          type: 'callout',
          variant: 'engineer',
          title: '性能工程师“算账”视角',
          content:
            'Google TPU 的 Systolic Array（脉动阵列）核心精髓是精妙的 Dataflow（数据流复用，如 Weight-Stationary 权重驻留），让部分和与激活值在计算单元间直接接力，省掉反复读写寄存器和 SRAM 的功耗；但它也有天生的“填充/排空开销（Pipeline Fill/Drain）”。如果矩阵太小或者 Batch Size 只有 1，128×128 阵列大部分格子都在空转，因此 TPU 极度依赖 XLA 编译器把算子拼大、把 Batch 凑齐。\n核心工程表达：Systolic Array（脉动阵列）通过脉动 Dataflow（数据流复用）最大化片上数据重用，以编译器确定性调度换取极致能效比。',
        },
        {
          type: 'quiz',
          question: '思考题：为什么说 TPU 的脉动阵列天生害怕“小 Batch”和“动态不规则形状”的模型？',
          answer:
            '因为脉动阵列是一个固定尺寸的巨型二维硬件网格（如 128×128）。当 Batch 很小或矩阵维度远小于阵列边长时，大量乘加单元处于闲置状态，且数据流进和流出阵列的延迟无法被长流水线摊薄，导致实际算力利用率（MFU）大幅下降。',
        },
      ],
    },
    {
      id: '1.5',
      title: '1.5 多元算力生态全景（昇腾 / AMD / Groq LPU）',
      isCore: false,
      readTime: '6 分钟',
      tags: ['昇腾', 'AMD MI300X', 'Groq LPU', '多元算力'],
      goal: '横向对比华为昇腾达芬奇 Cube、AMD CDNA 与 Groq 确定性片上 SRAM 架构的设计取舍。',
      blocks: [
        { type: 'heading', text: '核心直觉' },
        {
          type: 'paragraph',
          text: 'AI 芯片江湖早已不是英伟达一家独大：AMD 是紧追不舍的“同路线挑战者”，华为昇腾是用 3D 魔方（Cube）拼算力的“国产主力军”，而 Groq LPU 则是彻底抛弃慢吞吞的 HBM、把整块芯片做成一块超大高速书桌（纯片上 SRAM）的“极速推理狂人”。',
        },
        { type: 'heading', text: '底层机制拆解' },
        {
          type: 'list',
          ordered: true,
          items: [
            {
              lead: '华为昇腾（达芬奇架构）：',
              body: '核心是 AI Core，内部明确拆分为 Cube（3D 矩阵计算单元，专攻 16×16×16 矩阵乘）、Vector（向量单元，处理激活/归一化）和 Scalar（标量控制），配合 CANN 软件栈驱动。',
            },
            {
              lead: 'AMD Instinct（CDNA 架构）：',
              body: '与英伟达路线最接近，用 Matrix Core 对标 Tensor Core，用 ROCm 生态对标 CUDA，主打超大 HBM 容量（如 MI300X 单卡 192GB HBM3）以吃下大显存推理场景。',
            },
            {
              lead: 'Groq LPU（语言处理单元）：',
              body: '另辟蹊径，芯片上根本不接外部 HBM 显存，全靠几百 MB 片上 SRAM（带宽高达 80 TB/s，是 H100 的 20 多倍）配合静态编译器精确排布每一个时钟周期，实现每秒数百 Token 的恐怖吐字速度；代价是单卡容量极小，跑大模型必须把几十上百张卡拼成大阵列。',
            },
          ],
        },
        {
          type: 'table',
          title: '核心对比表 · 主流 AI 芯片架构生态对比',
          headers: ['代表芯片', '核心架构特色', '最大杀手锏', '核心短板 / 代价'],
          rows: [
            ['NVIDIA H100/B200', 'SM + Tensor Core + NVLink', '全能、CUDA 软件生态壁垒极深', '价格昂贵、供应受限'],
            ['AMD MI300X/MI325X', 'CDNA + Chiplet + 超大 HBM', '单卡显存容量与带宽性价比高', 'ROCm 生态与算子成熟度略逊'],
            ['华为昇腾 910B/C', '达芬奇 3D Cube + Vector', '自主可控、集群与国产框架深度适配', 'CANN 迁移与异构调优门槛仍存'],
            ['Groq LPU', '纯片上 SRAM + 静态确定性调度', '极低延迟，Decode 吐字速度断层领先', '单卡容量极小，部署需海量芯片互连'],
          ],
        },
        {
          type: 'callout',
          variant: 'engineer',
          title: '性能工程师“算账”视角',
          content:
            '看懂多元算力的核心方法是问三个问题：它的矩阵引擎（Tensor Core / Cube / Systolic）长什么样？它的片上 SRAM 与显存带宽多大？它的软件栈（CUDA/ROCm/CANN）与编译器能不能让开源模型一键跑满？很多芯片纸面峰值算力（TFLOPS）不输主流方案，实际实测偏慢往往卡在算子融合与集合通信库上。\n核心工程表达：算力芯片竞争不只看峰值 TFLOPS，核心在矩阵微架构、片外带宽与编译器/通信库全栈软件生态。',
        },
        {
          type: 'quiz',
          question: '思考题：Groq LPU 靠纯片上 SRAM 跑出了惊人的推理速度，为什么不拿它来训练千亿参数大模型？',
          answer:
            '训练大模型需要海量显存来存放权重、梯度、优化器状态和中间激活值（动辄数百 GB 到数 TB）。片上 SRAM 单位容量极贵且占面积，单颗 LPU 仅有几百 MB，要凑齐训练所需容量需要数万颗芯片互连，硬件采购成本、功耗与机房占地完全不划算。',
        },
      ],
    },
    {
      id: '1.6',
      title: '1.6 端侧与边缘 AI 芯片（NPU 与功耗墙）',
      isCore: false,
      readTime: '5 分钟',
      tags: ['NPU', '统一内存', '功耗墙', 'LPDDR5X'],
      goal: '从手机 SoC 与车载芯片的 TDP 功耗墙出发，理解端侧 NPU 如何在几瓦电里挤出可用算力。',
      blocks: [
        { type: 'heading', text: '核心直觉' },
        {
          type: 'paragraph',
          text: '数据中心 GPU 像装在机房里的重型柴油发电机（一颗芯片烧掉 700W~1200W，需要液冷降温）；而手机 SoC（如苹果 A/M 系列、骁龙）和车载智驾芯片里的 NPU，像手表里的精密机械机芯——必须在 3W~30W 的严苛“功耗墙”下静音运行，不能把手机烧烫手。',
        },
        { type: 'heading', text: '底层机制拆解' },
        {
          type: 'list',
          ordered: true,
          items: [
            {
              lead: '统一内存架构（Unified Memory）：',
              body: '手机和 Mac 芯片通常没有独立显卡的 HBM，而是让 CPU、GPU、NPU 共享同一块低功耗内存（LPDDR5X）。省去了数据来回拷贝，但内存带宽只有数据中心 GPU 的几十分之一（约 50~400 GB/s）。',
            },
            {
              lead: '极致低精度量化（INT8 / INT4）：',
              body: '为了在窄带宽和低功耗下跑动端侧大模型，NPU 硬件原生深度优化了 INT8 甚至 INT4/W4A8 计算，把数据搬运量压到极限。',
            },
            {
              lead: '异构分工与动态调频（DVFS）：',
              body: '手机 NPU 专攻语音唤醒、拍照降噪和端侧 3B/7B 小模型；遇到长任务发烫时，芯片会触发热节流（Thermal Throttling）强制降频保命。',
            },
          ],
        },
        {
          type: 'table',
          title: '核心对比表 · 云端 AI 芯片 vs 端侧/边缘 NPU',
          headers: ['对比维度', '云端 AI 芯片（GPU/TPU）', '端侧/边缘 NPU（手机/智驾）'],
          rows: [
            ['功耗预算（TDP）', '300W ~ 1200W+（风冷/液冷）', '2W ~ 10W（手机）/ 30W ~ 250W（智驾）'],
            ['存储类型与带宽', 'HBM3e（3 ~ 8 TB/s）', 'LPDDR5X（50 ~ 400 GB/s）'],
            ['核心优化目标', '高并发总吞吐、最低单 Token 成本', '极低功耗、隐私离线、单用户可接受延迟'],
            ['主流数值精度', 'BF16 / FP8 / FP4', 'INT8 / INT4 / 混合低比特量化'],
          ],
        },
        {
          type: 'callout',
          variant: 'engineer',
          title: '性能工程师“算账”视角',
          content:
            '端侧设备受严格功耗包络（如手机整机几瓦级、智驾芯片数十瓦 TDP）限制，一旦持续高负载立刻触发 Thermal Throttling（热节流）强制降频；同时在端侧跑大模型几乎 100% 死在 LPDDR 内存带宽墙上。算一笔简单的账：手机 LPDDR5X 带宽约 60 GB/s，跑一个 4-bit 量化的 7B 模型（权重约 4GB），哪怕带宽跑满 100%，理论极限吐字速度也只有 60 / 4 = 15 tokens/s。\n核心工程表达：边缘与端侧 NPU 受制于 TDP / Thermal Throttling（热节流）与 LPDDR 带宽上限，推理速度由有效访存带宽与权重量化体积共同封顶。',
        },
        {
          type: 'quiz',
          question:
            '思考题：同样是跑 7B 模型，为什么苹果 M 系列芯片（如 M4 Max）在笔记本上跑得比同价位普通轻薄本快得多？',
          answer:
            '核心赢在“统一内存的超高带宽”和“大容量共享”。普通轻薄本内存带宽往往只有 50~100 GB/s，且独显显存小塞不下大模型；而 M4 Max 提供了高达 500+ GB/s 的统一内存带宽和上百 GB 容量，直接缓解了端侧推理最致命的带宽墙与容量墙。',
        },
      ],
    },
    {
      id: '1.7',
      title: '1.7 GPU 架构建模与黄金参考模型（Golden Model / SystemC / Timeloop）',
      isCore: true,
      readTime: '7 分钟',
      tags: ['核心主线', 'GPU 架构建模', 'Golden Model', 'SystemC', 'Timeloop'],
      goal: '理解流片前如何用 C++/SystemC/Timeloop 搭建“软件版假芯片”，定量评估微架构瓶颈与 PPA 权衡。',
      blocks: [
        { type: 'heading', text: '核心直觉' },
        {
          type: 'paragraph',
          text: '造一颗顶级 GPU 流片动辄花几千万、耗时一年半，绝不可能先画好电路流出来再看跑得快不快！芯片架构师在画第一根电路线之前，会先用 C++（SystemC）或 Python 在电脑里写一个“软件版假芯片”（Golden Model）。把 DeepSeek/Qwen 的算子灌进去跑一遍，就能提前算出哪里会堵车（Hot Path），从而拍板决定下一代芯片要配多大阵列、多大 SRAM 和多少 HBM 带宽。',
        },
        { type: 'heading', text: '底层机制拆解' },
        {
          type: 'list',
          ordered: true,
          items: [
            {
              lead: '三级建模精度阶梯：',
              body: '① 功能模型（Golden Model）：只管算出来的数字对不对，定义软硬件编程接口语义，作为验证和软件团队的唯一标准答案；② 事务级模型（TLM / SystemC）：把数据搬运当成一包包快递算粗略耗时，跑得极快，是工业界做架构探索的绝对主力；③ 周期精确模型（Cycle-Accurate，如 gem5 / GPGPU-Sim）：精确到每一个时钟周期的缓存冲突与总线排队。',
            },
            {
              lead: '负载画像（Workload Characterization）与热路径（Hot Path）：',
              body: '架构建模工程师的核心日常不是写 Verilog，而是分析目标大模型在不同 Batch 和序列长度下的算子占比、计算访存比和内存访问规律，揪出耗时最长的关键执行路径。',
            },
            {
              lead: '免写 Verilog 的架构神器：',
              body: 'C++ + SystemC（工业界搭性能模拟器标准）、MIT Timeloop / Accelergy（只需写 YAML 描述存储层次就能自动搜索 AI 加速器最优数据流与能耗 PPA）、ISS（指令集模拟器）。',
            },
          ],
        },
        {
          type: 'table',
          title: '核心对比表 · 芯片架构建模工具与层级对比',
          headers: ['建模工具 / 层级', '核心编程语言', '仿真速度', '核心用途（解决什么问题）'],
          rows: [
            ['功能模型 (Golden Model)', 'C++ / Python', '极快', '定义软硬件编程抽象接口，提供算子精度的唯一标准答案'],
            ['SystemC (TLM 事务级)', 'C++ (SystemC 库)', '较快', '工业界主流：快速探索缓存大小、总线宽度与模块间通信瓶颈'],
            ['Timeloop / Accelergy', 'YAML + Python', '快', '免写 Verilog 评估 AI 加速器不同阵列/数据流映射的延迟与能耗'],
            ['周期精确模型 (Cycle-Accurate)', 'C++ (gem5 / 自研)', '慢', '精确到单周期的微架构流水线、Cache 冲突与热路径定位'],
          ],
        },
        {
          type: 'callout',
          variant: 'engineer',
          title: 'AI 结对实战与性能算账视角',
          copyText:
            '请用 150 行 Python 帮我写一个极简的“片上 SRAM + Tensor Core 矩阵乘阵列”事务级耗时模拟器（Golden Model）：输入矩阵维度 (M, K, N)、片上 SRAM 容量(MB)、HBM 带宽(TB/s) 和峰值算力(TFLOPS)，自动按 Tiling 分块计算搬运耗时与计算耗时，输出瓶颈归属和加速建议。',
          content:
            '想入门「GPU 架构建模」，完全不需要先啃百万行 gem5 代码！直接让 AI 带着你用 150 行 Python 写一个极简的“SRAM + 矩阵乘阵列”耗时模拟器，输入模型维度、Dataflow（数据流复用）策略和带宽，就能亲手跑出你的第一个微缩版 Golden Model。\n核心工程表达：Golden Model（黄金参考模型）与 Timeloop 等事务级仿真可在 RTL 流片前完成 Dataflow、Tiling 与存储带宽瓶颈的量化 DSE（设计空间探索）。',
        },
        {
          type: 'quiz',
          question:
            '思考题：为什么 GPU 架构建模工程师不仅要懂硬件微架构，JD 里还强调「定义 GPU 编程模型抽象，主导软硬件接口设计」？',
          answer:
            '硬件设计得再强，如果编程抽象（如显存层级暴露、异步拷贝指令、张量核心调度语义）反人类，编译器和 PyTorch/vLLM 就根本发挥不出硬件性能。架构建模师站在软硬件正中间，必须确保新架构对上层软件友好。',
        },
      ],
    },
  ],
};
