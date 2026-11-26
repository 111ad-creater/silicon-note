export const exercisesPart1 = {
  '1.1': [
    {
      index: 1,
      tag: '概念快测（单选）',
      kind: 'choice',
      question:
        '以下哪种芯片在芯片面积（Die Size）分配上，把最大比例的晶体管留给了控制逻辑（分支预测、乱序执行）和大容量 Cache？',
      options: [
        { key: 'A', text: 'CPU' },
        { key: 'B', text: 'GPU' },
        { key: 'C', text: 'Google TPU' },
        { key: 'D', text: 'Groq LPU' },
      ],
      correctKey: 'A',
      answer:
        '选 A（CPU）。CPU 为“低延迟处理复杂逻辑”而生，必须把大量面积花在控制单元和缓存上；而 GPU/TPU 把绝大部分面积铺满了计算单元以换取高吞吐。',
    },
    {
      index: 2,
      tag: '视野拓展（场景判断）',
      kind: 'open',
      question:
        '某大模型服务在推理时，监控发现 GPU 利用率只有 20%，但服务器 CPU 占用率飙到了 100%。请问此时花大价钱把 GPU 从 A100 升级到 H100，吞吐量会翻倍吗？',
      answer:
        '不会！这是典型的 CPU-Bound（CPU 瓶颈，如分词、图像预处理或请求调度太慢），导致 GPU 干等发卷子。此时应优先优化 CPU 多进程预处理或换更强的 CPU。',
    },
  ],
  '1.2': [
    {
      index: 1,
      tag: '概念快测（判断）',
      kind: 'boolean',
      question:
        '判断正误：在 NVIDIA GPU 中，同一个 Warp（32 个线程）里的线程可以各自独立执行完全不同的指令，互不干扰，因此 if-else 分支完全不影响性能。',
      options: [
        { key: 'T', text: '正确' },
        { key: 'F', text: '错误' },
      ],
      correctKey: 'F',
      answer:
        '错误！GPU 采用 SIMT 架构，同一 Warp 内 32 个线程共用指令调度器。如果走向不同分支，会触发分支发散（Warp Divergence），被迫串行执行，算力直接打折。',
    },
    {
      index: 2,
      tag: '纸面算账（基础计算）',
      kind: 'open',
      question:
        '假设某 GPU 的单个 SM 车间最多同时驻扎 64 个 Warp。请问这个 SM 最多可以同时活跃多少个线程（Thread）？',
      answer:
        '64 × 32 = 2,048 个线程。正是靠这上千个随时待命的线程，GPU 才能在某批线程等显存时 1 周期秒切，彻底隐藏访存延迟。',
    },
  ],
  '1.3': [
    {
      index: 1,
      tag: '概念快测（单选）',
      kind: 'choice',
      question: '在大模型推理中，哪类算子最依赖 GPU 里的 Tensor Core 来提速？',
      options: [
        { key: 'A', text: '标量 if-else 判断' },
        { key: 'B', text: '线性层矩阵乘法（GEMM）' },
        { key: 'C', text: '内存拷贝' },
        { key: 'D', text: '文本分词' },
      ],
      correctKey: 'B',
      answer:
        '选 B。Tensor Core 是专门为矩阵乘加（MMA）打造的硬件引擎，大模型中 90% 以上的计算量（Linear 层、Attention 矩阵乘）都靠它加速。',
    },
    {
      index: 2,
      tag: '纸面算账（工程直觉）',
      kind: 'open',
      question:
        '如果一个 4 元素的权重向量是 [0.5, 0, -0.3, 0]，它是否满足 NVIDIA Tensor Core 的“2:4 结构化稀疏”硬件加速条件？如果是 [0.5, 0.2, -0.3, 0] 呢？',
      answer:
        '前者满足（4 个数里恰好有 2 个 0），可触发硬件 2x 加速；后者只有 1 个 0，不满足每 4 个至少 2 个 0 的硬性规定，无法启用 2:4 稀疏加速。',
    },
  ],
  '1.4': [
    {
      index: 1,
      tag: '概念快测（单选）',
      kind: 'choice',
      question: 'Google TPU 的脉动阵列（Systolic Array）最核心的硬件优势是什么？',
      options: [
        { key: 'A', text: '支持极其复杂的分支跳转' },
        { key: 'B', text: '数据在相邻乘加单元间直接接力，大幅减少片内访存功耗' },
        { key: 'C', text: '拥有比 GPU 更多的寄存器' },
        { key: 'D', text: '原生支持 CUDA' },
      ],
      correctKey: 'B',
      answer:
        '选 B。脉动阵列通过让数据像心脏泵血一样在网格内流动并复用上百次，砍掉了大量重复读写缓存的能耗，能效比极高。',
    },
    {
      index: 2,
      tag: '纸面算账（直观估算）',
      kind: 'open',
      question:
        '一块 128×128 规模的 TPU 脉动阵列（MXU），内部一共包含多少个乘加单元（MAC）？假设每个时钟周期所有 MAC 都满载做 1 次乘加（2 FLOPs），在 1 GHz 频率下，单块 MXU 的峰值算力是多少 TFLOPS？',
      answer:
        'MAC 数量 = 128 × 128 = 16,384 个。1 GHz 下峰值算力 = 16,384 × 2 × 10^9 = 32.768 TFLOPS。',
    },
  ],
  '1.5': [
    {
      index: 1,
      tag: '概念快测（连线/单选）',
      kind: 'choice',
      question:
        '以下哪款 AI 芯片彻底抛弃了外部 HBM 显存，完全依靠片上 SRAM 实现超高带宽与极速 Decode 吐字？',
      options: [
        { key: 'A', text: 'NVIDIA H100' },
        { key: 'B', text: 'AMD MI300X' },
        { key: 'C', text: '华为昇腾 910B' },
        { key: 'D', text: 'Groq LPU' },
      ],
      correctKey: 'D',
      answer:
        '选 D（Groq LPU）。它把片上 SRAM 带宽推到 80 TB/s，但代价是单卡容量极小，部署大模型需要把海量芯片串联起来。',
    },
    {
      index: 2,
      tag: '视野拓展（生态对比）',
      kind: 'open',
      question: '请说出 NVIDIA、AMD、华为昇腾三家 AI 芯片分别对应的核心底层软件栈名称。',
      answer:
        'NVIDIA 对应 CUDA；AMD 对应 ROCm；华为昇腾对应 CANN。软件栈的成熟度往往决定了芯片的实际落地效率。',
    },
  ],
  '1.6': [
    {
      index: 1,
      tag: '概念快测（单选）',
      kind: 'choice',
      question: '在手机或笔记本端侧运行 7B 大模型，最先撞上的硬件瓶颈通常是？',
      options: [
        { key: 'A', text: 'CPU 核心数不够' },
        { key: 'B', text: 'LPDDR 内存带宽墙与功耗散热墙' },
        { key: 'C', text: '硬盘读取太慢' },
        { key: 'D', text: '网速太慢' },
      ],
      correctKey: 'B',
      answer:
        '选 B。端侧芯片功耗被锁死在几瓦到几十瓦，且 LPDDR 带宽远低于数据中心 HBM，极易撞上内存墙和热节流。',
    },
    {
      index: 2,
      tag: '纸面算账（端侧估算）',
      kind: 'open',
      question:
        '某旗舰手机的 LPDDR5X 内存带宽为 75 GB/s。如果要在手机本地离线跑一个 INT4 量化后的 3B 小模型（权重约占 1.5 GB），不考虑 KV Cache，理论上最高每秒能吐多少个字（Tokens/s）？',
      answer:
        '75 GB/s ÷ 1.5 GB = 50 tokens/s（实际扣除系统开销和带宽利用率后，大约在 30~40 tokens/s，已经非常流畅）。',
    },
  ],
  '2.1': [
    {
      index: 1,
      tag: '概念快测（排序）',
      kind: 'open',
      question:
        '请按访问速度从快到慢（延迟从低到高）给以下 4 种 GPU 存储排序：HBM 显存、L2 Cache、寄存器（Register）、Shared Memory（SRAM）。',
      answer:
        '寄存器（~1 周期） > Shared Memory（~20-30 周期） > L2 Cache（~200 周期） > HBM 显存（~400-800 周期）。',
    },
    {
      index: 2,
      tag: '视野拓展（机制理解）',
      kind: 'open',
      question:
        '在 GPU 的 Shared Memory 中，如果同一个 Warp 的 32 个线程同时访问了同一个 Bank（抽屉）里 32 个不同的地址，会发生什么现象？耗时大约变成无冲突时的几倍？',
      answer:
        '会发生最严重的 32-way Bank Conflict（存储体冲突），原本 1 次并发完成的访问被迫串行排队，耗时直接暴涨为原来的 32 倍！',
    },
  ],
  '2.2': [
    {
      index: 1,
      tag: '概念快测（单选）',
      kind: 'choice',
      question: 'HBM 显存之所以能在比 GDDR 更低的频率下实现数倍的超高带宽，核心靠的是？',
      options: [
        { key: 'A', text: '更高的电压' },
        { key: 'B', text: '极其宽广的位宽（1024-bit/2048-bit）与 3D TSV 堆叠' },
        { key: 'C', text: '更大的主板尺寸' },
        { key: 'D', text: '改用机械硬盘' },
      ],
      correctKey: 'B',
      answer:
        '选 B。带宽 = 位宽 × 频率，HBM 通过 3D 堆叠和硅通孔大幅拉宽位宽，在低频低功耗下实现 TB/s 级带宽。',
    },
    {
      index: 2,
      tag: '纸面算账（带宽计算）',
      kind: 'open',
      question:
        '某颗 HBM3 堆栈的位宽为 1024-bit（即 128 Bytes），如果单引脚数据速率为 6.4 Gbps，请问单颗 HBM3 堆栈的带宽是多少 GB/s？一块 GPU 配 5 颗这样的 HBM3，总带宽是多少 TB/s？',
      answer: '单颗带宽 = 128 Bytes × 6.4 G = 819.2 GB/s；5 颗总带宽 = 819.2 × 5 = 4,096 GB/s ≈ 4.1 TB/s。',
    },
  ],
  '2.3': [
    {
      index: 1,
      tag: '概念快测（判断）',
      kind: 'boolean',
      question:
        '判断正误：随着 2nm/3nm 先进制程的发展，光刻机已经可以无限放大单颗硅片面积，因此未来不再需要 Chiplet（芯粒）和 2.5D 封装。',
      options: [
        { key: 'T', text: '正确' },
        { key: 'F', text: '错误' },
      ],
      correctKey: 'F',
      answer:
        '错误！光刻机存在物理“光罩极限（Reticle Limit，约 858 mm²）”，且芯片越大良率越低、成本呈指数暴涨，因此 Chiplet + CoWoS 先进封装是后摩尔时代的必由之路。',
    },
    {
      index: 2,
      tag: '视野拓展（产业认知）',
      kind: 'open',
      question:
        '在台积电 CoWoS（Chip-on-Wafer-on-Substrate）2.5D 封装中，把计算芯片和 HBM 显存连接在一起的那块刻满超密走线的硅片叫什么？',
      answer:
        '叫硅中介层（Silicon Interposer）。它负责在极小空间内提供成千上万根高密度互连走线，也是目前先进封装产能最紧缺的核心环节之一。',
    },
  ],
  '2.4': [
    {
      index: 1,
      tag: '概念快测（单选）',
      kind: 'choice',
      question: '以下哪种前沿硬件技术旨在解决“万卡集群机柜间铜缆传输距离短、发热与功耗爆炸”的问题？',
      options: [
        { key: 'A', text: '存算一体（PIM）' },
        { key: 'B', text: '光电共封装（CPO）' },
        { key: 'C', text: '2:4 稀疏' },
        { key: 'D', text: '寄存器重命名' },
      ],
      correctKey: 'B',
      answer:
        '选 B（CPO）。CPO 将光引擎紧贴交换芯片或 GPU 封装，以光代铜大幅降低高速长距离互连的功耗。',
    },
    {
      index: 2,
      tag: '视野拓展（场景匹配）',
      kind: 'open',
      question:
        '如果一家云厂商想把全机房服务器上闲置的 DDR5 内存连成一个共享大池子，专门用来暂存大模型冷门的 KV Cache，最适合采用哪种互连标准？',
      answer:
        'CXL（Compute Express Link）内存池化技术。它能打破单机内存容量孤岛，提供高性价比的大容量扩展。',
    },
  ],
  '3.1': [
    {
      index: 1,
      tag: '概念快测（单选）',
      kind: 'choice',
      question: '在 IEEE 754 浮点数表示中，决定一个数“最大能有多大、最小能有多小（动态范围）”的是哪一部分？',
      options: [
        { key: 'A', text: '符号位（Sign）' },
        { key: 'B', text: '指数位（Exponent）' },
        { key: 'C', text: '尾数位（Mantissa）' },
        { key: 'D', text: '校验位' },
      ],
      correctKey: 'B',
      answer:
        '选 B（指数位）。指数位越长，动态范围越广，训练时越不容易出现梯度溢出（NaN）或下溢归零。',
    },
    {
      index: 2,
      tag: '纸面算账（硬件直觉）',
      kind: 'open',
      question:
        'FP32 的尾数是 23 位，BF16 的尾数是 7 位（约缩减为原来的 1/3）。已知硬件乘法器面积大致与尾数位宽的平方成正比，请问一个 BF16 乘法器的面积大约只有 FP32 乘法器的几分之一？',
      answer:
        '(7 / 23)² ≈ 1/10.8！也就是说，同样一块芯片面积，塞 BF16 乘法器的数量可以是 FP32 的近 10 倍，这就是低精度能带来恐怖算力暴涨的物理根源。',
    },
  ],
  '3.2': [
    {
      index: 1,
      tag: '概念快测（判断）',
      kind: 'boolean',
      question: '判断正误：BF16 和 FP16 都是 16 比特，所以它们的数值精度（小数点后有效位数）和动态范围完全一样。',
      options: [
        { key: 'T', text: '正确' },
        { key: 'F', text: '错误' },
      ],
      correctKey: 'F',
      answer:
        '错误！FP16 是 5 位指数+10 位尾数（精度高但范围窄）；BF16 是 8 位指数+7 位尾数（范围和 FP32 一样大，但尾数精度略低，极适合大模型训练）。',
    },
    {
      index: 2,
      tag: '视野拓展（格式辨析）',
      kind: 'open',
      question: '在 FP8 训练中，为什么通常前向传播权重用 E4M3，而反向传播梯度用 E5M2？',
      answer:
        '前向权重分布较集中，需要多 1 位尾数（M3）保精度；而反向梯度跨度极大，极易溢出，所以需要多 1 位指数（E5）来保动态范围。',
    },
  ],
  '3.3': [
    {
      index: 1,
      tag: '概念快测（单选）',
      kind: 'choice',
      question: 'AWQ / GPTQ 这类 W4A16 量化方案，在以下哪种场景下带来的加速比最明显？',
      options: [
        { key: 'A', text: '大 Batch 预训练' },
        { key: 'B', text: '单用户或小 Batch 的 Decode 推理' },
        { key: 'C', text: '长文本 Prefill' },
        { key: 'D', text: '图像渲染' },
      ],
      correctKey: 'B',
      answer:
        '选 B。W4A16 把权重体积砍掉 75%，直接大幅缓解小 Batch Decode 阶段的 HBM 显存带宽墙。',
    },
    {
      index: 2,
      tag: '视野拓展（核心痛点）',
      kind: 'open',
      question: '大模型量化中经常提到的“离群值（Outliers）”是指什么现象？SmoothQuant 是怎么巧妙化解它的？',
      answer:
        '离群值指激活值中极少数数值特别巨大的“高个子”，它们会撑爆量化刻度导致其余 99% 的正常值全被挤成 0。SmoothQuant 通过等价数学缩放，把激活值的高个子削平、同时把对应权重拔高，把量化难度平滑转移到更好处理的权重上。',
    },
  ],
  '3.4': [
    {
      index: 1,
      tag: '概念快测（单选）',
      kind: 'choice',
      question: '某 GPU 的峰值算力为 1000 TFLOPS，显存带宽为 2 TB/s。它的 Roofline 硬件拐点（Ridge Point）是多少 FLOPs/Byte？',
      options: [
        { key: 'A', text: '200' },
        { key: 'B', text: '500' },
        { key: 'C', text: '1000' },
        { key: 'D', text: '2000' },
      ],
      correctKey: 'B',
      answer: '选 B。拐点 = 峰值算力 ÷ 显存带宽 = 1000 T ÷ 2 T = 500 FLOPs/Byte。',
    },
    {
      index: 2,
      tag: '纸面算账（瓶颈诊断）',
      kind: 'open',
      question:
        '接上题（拐点 500 FLOPs/Byte）：如果你写了一个算子，总共搬运了 10 GB 数据，完成了 1 TFLOPs（1000 GFLOPs）计算。请算出它的算术强度，并判断它是 Compute-Bound 还是 Memory-Bound？',
      answer:
        '算术强度 = 1000 GFLOPs ÷ 10 GB = 100 FLOPs/Byte。因为 100 < 500（落在斜坡区），所以它是典型的 Memory-Bound（带宽受限），此时算力最多只能发挥 100/500 = 20%。',
    },
  ],
  '3.5': [
    {
      index: 1,
      tag: '纸面算账（权重显存）',
      kind: 'open',
      question:
        '一个 8B（80 亿参数）的大模型（如 Llama-3 8B），在 FP8（1 字节/参数）和 INT4（0.5 字节/参数）精度下，仅模型权重分别占用多少 GB 显存？',
      answer: 'FP8 占 8 GB；INT4 占 4 GB。消费级 16GB/24GB 显卡可以非常轻松地装下。',
    },
    {
      index: 2,
      tag: '纸面算账（极限吐字速度）',
      kind: 'open',
      question:
        '在单张 NVIDIA H100（HBM3 带宽 3.35 TB/s）上，以 FP8 精度（权重约 70 GB）运行 70B 模型的 Batch=1 推理（忽略短文本 KV Cache），理论极限吐字速度是多少 tokens/s？',
      answer:
        '3350 GB/s ÷ 70 GB ≈ 47.8 tokens/s。如果实际跑出 38~42 tokens/s，说明带宽利用率（MBU）已经超过 80%。',
    },
  ],
  '4.1': [
    {
      index: 1,
      tag: '概念快测（单选）',
      kind: 'choice',
      question: '在 NVIDIA AI 软件栈中，专门负责多张 GPU 之间高速集合通信（如 AllReduce）的底层库是？',
      options: [
        { key: 'A', text: 'cuBLAS' },
        { key: 'B', text: 'cuDNN' },
        { key: 'C', text: 'NCCL' },
        { key: 'D', text: 'TensorRT' },
      ],
      correctKey: 'C',
      answer:
        '选 C（NCCL）。cuBLAS 管矩阵乘法，cuDNN 管神经网络基础算子，TensorRT 管推理引擎优化，NCCL 专管多卡通信。',
    },
    {
      index: 2,
      tag: '视野拓展（层级理解）',
      kind: 'open',
      question: '请按从高层到底层的顺序排列以下 4 个概念：SASS 机器码、PyTorch Python 代码、PTX 虚拟汇编、TorchInductor 计算图。',
      answer: 'PyTorch Python 代码 → TorchInductor 计算图 → PTX 虚拟汇编 → SASS 机器码。',
    },
  ],
  '4.2': [
    {
      index: 1,
      tag: '概念快测（单选）',
      kind: 'choice',
      question: '在 CUDA 编程模型中，哪一个层级的线程可以共享同一个 SM 车间里的 Shared Memory（片上书桌）？',
      options: [
        { key: 'A', text: '不同 Grid 之间' },
        { key: 'B', text: '同一个 Block 内的所有线程' },
        { key: 'C', text: '跨两张 GPU 的线程' },
        { key: 'D', text: 'CPU 与 GPU 之间' },
      ],
      correctKey: 'B',
      answer:
        '选 B。一个 Block 会被调度到同一个 SM 上执行，因此 Block 内的线程可以通过高速 Shared Memory 协同工作。',
    },
    {
      index: 2,
      tag: '视野拓展（工具选型）',
      kind: 'open',
      question: '为什么说 OpenAI 的 Triton 特别适合 AI 系统工程师和算法工程师快速写自定义融合算子？',
      answer:
        '因为 Triton 用类 Python 语法，把编程视角从繁琐的“单线程（Thread）”抬升到了“数据块（Tile/Block）”，自动处理内存合并访问和 Shared Memory 管理，大幅降低了手写高性能算子的门槛。',
    },
  ],
  '4.3': [
    {
      index: 1,
      tag: '概念快测（判断）',
      kind: 'boolean',
      question: '判断正误：算子融合（Operator Fusion）能大幅加速大模型，是因为它减少了矩阵乘法的数学计算量（FLOPs）。',
      options: [
        { key: 'T', text: '正确' },
        { key: 'F', text: '错误' },
      ],
      correctKey: 'F',
      answer:
        '错误！算子融合几乎不减少数学计算量，它提速的核心原因是把中间结果留在高速寄存器/SRAM 里，大幅砍掉了往返慢速 HBM 显存的读写带宽，并减少了 CPU 发射 Kernel 的开销。',
    },
    {
      index: 2,
      tag: '纸面算账（访存节省）',
      kind: 'open',
      question:
        '对一个 100 MB 的张量连续执行 4 个逐元素操作（Add → Mul → SiLU → Dropout）。未融合时总共要读写 HBM 多少 MB？融合成 1 个 Kernel 后只需要读写多少 MB？',
      answer:
        '未融合：每步读 100MB + 写 100MB，4 步共 800 MB；融合后：只需初始读 100MB + 最终写 100MB = 200 MB，直接省掉 75% 的 HBM 带宽！',
    },
  ],
  '4.4': [
    {
      index: 1,
      tag: '概念快测（单选）',
      kind: 'choice',
      question: 'Google TPU 极度依赖哪一个静态图编译器来把模型算子排布到脉动阵列和片上 SRAM 中？',
      options: [
        { key: 'A', text: 'GCC' },
        { key: 'B', text: 'XLA' },
        { key: 'C', text: 'javac' },
        { key: 'D', text: 'vLLM' },
      ],
      correctKey: 'B',
      answer: '选 B（XLA）。TPU 硬件去控制化程度极高，必须靠 XLA 在编译期把数据流和内存复用规划得严丝合缝。',
    },
    {
      index: 2,
      tag: '视野拓展（工程避坑）',
      kind: 'open',
      question:
        '在 PyTorch 中给模型加上 `torch.compile(model)` 后，为什么第一次运行推理时特别慢（可能卡顿几十秒），但从第二次开始就飞快？',
      answer:
        '第一次运行触发了计算图抓取、算子融合分析以及底层 Triton/CUDA 内核的即时编译（JIT Compilation）。因此线上服务必须先做 Warmup（预热）再对外接流量。',
    },
  ],
  '4.5': [
    {
      index: 1,
      tag: '概念快测（判断）',
      kind: 'boolean',
      question:
        '判断正误：只要国产 AI 芯片把硬件峰值算力和 HBM 带宽做到和英伟达 H100 一模一样，跑开源大模型的效果就一定能立刻追平 H100。',
      options: [
        { key: 'T', text: '正确' },
        { key: 'F', text: '错误' },
      ],
      correctKey: 'F',
      answer:
        '错误！硬件只是肌肉，底层算子库（cuBLAS）、多卡通信库（NCCL）、编译器以及排障工具链（Nsight）共同构成了 CUDA 护城河，软件栈没调优好，硬件算力往往只能发挥出一小半。',
    },
    {
      index: 2,
      tag: '视野拓展（行业思考）',
      kind: 'open',
      question:
        '作为集成电路本科生，如果你想进入国产 AI 芯片公司做性能分析或底层系统，为什么现在反而是极好的机会？',
      answer:
        '因为国产芯片最缺的恰恰不是“纯画电路的人”，而是“既懂芯片硬件瓶颈、又懂 PyTorch/vLLM 推理系统、能拿着剖析工具把软硬件卡点揪出来优化”的跨界性能工程师。',
    },
  ],
};
