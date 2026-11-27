export const exercisesPart2 = {
  '5.1': [
    {
      index: 1,
      tag: '概念快测（单选）',
      kind: 'choice',
      question:
        '大模型推理的两个阶段中，哪一个阶段决定了用户的“首字延迟（TTFT）”，且在 Roofline 模型中通常属于 Compute-Bound（算力受限）？',
      options: [
        { key: 'A', text: 'Prefill（预填充）' },
        { key: 'B', text: 'Decode（解码）' },
        { key: 'C', text: '分词（Tokenization）' },
        { key: 'D', text: '权重加载' },
      ],
      correctKey: 'A',
      answer:
        '选 A（Prefill）。Prefill 并行处理全部输入 Prompt，做大矩阵乘法（GEMM），算术强度极高，主要吃算力。',
    },
    {
      index: 2,
      tag: '视野拓展（场景判断）',
      kind: 'open',
      question:
        '某用户发了一段 10 个字的提问，要求模型生成一篇 3000 字的短篇小说。整个生成过程的总耗时，95% 以上会花在 Prefill 还是 Decode？瓶颈在算力还是带宽？',
      answer: '95% 以上花在 Decode（逐字生成 3000 次循环），瓶颈是 HBM 显存带宽（Memory-Bound）。',
    },
  ],
  '5.2': [
    {
      index: 1,
      tag: '概念快测（单选）',
      kind: 'choice',
      question: 'vLLM 的 PagedAttention（分页注意力）借鉴了操作系统的虚拟内存分页思想，它最核心解决的问题是？',
      options: [
        { key: 'A', text: '提高单次矩阵乘法的数学精度' },
        { key: 'B', text: '消除 KV Cache 物理连续分配导致的 60%~80% 显存碎片浪费' },
        { key: 'C', text: '替代 PyTorch 进行模型训练' },
        { key: 'D', text: '降低 CPU 温度' },
      ],
      correctKey: 'B',
      answer:
        '选 B。通过把大笔记本撕成按需分配、非连续存放的“便利贴（Block）”，把显存浪费率压到 4% 以下。',
    },
    {
      index: 2,
      tag: '视野拓展（调度理解）',
      kind: 'open',
      question:
        '如果 50 个用户同时接入你的 AI 客服，每个请求开头都带有一段完全相同的 2000 字“客服规章制度（System Prompt）”。开启 vLLM 的 Prefix Caching 或 SGLang 的 RadixAttention 后，显存里需要存几份这段规章制度的 KV Cache？',
      answer:
        '只需要存 1 份！50 个用户的 Block Table（小目录）前几页全部指向这同一批物理显存块，既省了 98% 的公共前缀显存，又直接跳过了重复的 Prefill 计算。',
    },
  ],
  '5.3': [
    {
      index: 1,
      tag: '概念快测（单选）',
      kind: 'choice',
      question: 'DeepSeek 提出的 MLA（多头潜在注意力）把 KV Cache 压缩了 90% 以上，它的核心设计哲学是？',
      options: [
        { key: 'A', text: '用更贵的 HBM 换算力' },
        { key: 'B', text: '利用 GPU 算力过剩、带宽不足的特点，存浓缩低秩向量并在片上用算力解压' },
        { key: 'C', text: '直接丢弃历史前文' },
        { key: 'D', text: '改用 CPU 计算 Attention' },
      ],
      correctKey: 'B',
      answer:
        '选 B。MLA 精准踩中了现代 GPU 的硬件痛点，用极其廉价的过剩算力换取了极其宝贵的显存容量与带宽。',
    },
    {
      index: 2,
      tag: '概念快测（判断）',
      kind: 'boolean',
      question: '判断正误：FlashAttention 是一种有损近似算法，它为了提速牺牲了一部分 Attention 的数学计算精度。',
      options: [
        { key: 'T', text: '正确' },
        { key: 'F', text: '错误' },
      ],
      correctKey: 'F',
      answer:
        '错误！FlashAttention 是 100% 数学精确等价的！它只靠分块计算（Tiling）和在线 Softmax 把中间矩阵锁死在片上 SRAM 里，不写回慢速 HBM，从而实现无损大提速。',
    },
  ],
  '5.4': [
    {
      index: 1,
      tag: '概念快测（判断）',
      kind: 'boolean',
      question:
        '判断正误：使用投机采样（Speculative Decoding，小模型打草稿 + 大模型并行批改）加速后，最终生成的文本质量会略微下降，变得像小模型一样笨。',
      options: [
        { key: 'T', text: '正确' },
        { key: 'F', text: '错误' },
      ],
      correctKey: 'F',
      answer:
        '错误！投机采样通过严格的数学拒绝采样机制，保证最终输出 Token 的概率分布与原大模型 100% 完全一致，属于无损加速。',
    },
    {
      index: 2,
      tag: '视野拓展（场景边界）',
      kind: 'open',
      question:
        '假设你的线上推理集群此刻处于极高并发状态（Batch Size = 256，GPU 算力已经 100% 打满）。此时强行开启投机采样，速度会变快还是变慢？',
      answer:
        '反而可能变慢！投机采样本质是“白嫖 Decode 阶段闲置的过剩算力”。高并发下算力已经被吃满，再多算草稿验证只会增加算力排队负担。',
    },
  ],
  '5.5': [
    {
      index: 1,
      tag: '概念快测（单选）',
      kind: 'choice',
      question:
        '工业界采用 PD 分离（Prefill-Decode Disaggregation）架构把“读题部”和“写字部”拆到不同 GPU 集群后，最核心的新增系统瓶颈是什么？',
      options: [
        { key: 'A', text: '硬盘读写速度' },
        { key: 'B', text: 'P 节点向 D 节点高速迁移 KV Cache 的网络带宽' },
        { key: 'C', text: '键盘输入速度' },
        { key: 'D', text: '模型权重下载' },
      ],
      correctKey: 'B',
      answer:
        '选 B。P 节点算完初始 KV Cache 后必须瞬间“快递”给 D 节点，因此极度依赖 NVLink 或 RDMA InfiniBand 高速网络，以及 GQA/MLA 对 KV Cache 的瘦身。',
    },
    {
      index: 2,
      tag: '视野拓展（异构选型）',
      kind: 'open',
      question:
        '在 PD 分离架构下，如果你手头有一批“算力极猛但显存一般”的卡，和一批“显存极大、带宽很高但算力略弱”的卡，应该分别分配给 P 节点还是 D 节点？',
      answer:
        '算力极猛的卡分给 P 节点（Prefill，Compute-Bound）；显存大、带宽高的卡分给 D 节点（Decode，Memory-Bound），实现异构硬件极致省钱。',
    },
  ],
  '5.6': [
    {
      index: 1,
      tag: '概念快测（单选）',
      kind: 'choice',
      question: '像 DeepSeek-V3（总参数 671B，激活参数 37B）这样的 MoE 模型，在推理部署时最突出的硬件资源特征是？',
      options: [
        { key: 'A', text: '显存占得极小，算力吃得极大' },
        { key: 'B', text: '显存占得极大（需装下全部 671B），单 Token 计算量却很小（只算 37B）' },
        { key: 'C', text: '只需要单张消费级显卡就能满血运行' },
        { key: 'D', text: '不需要任何通信' },
      ],
      correctKey: 'B',
      answer:
        '选 B。因为不知道下一个字会路由到哪个专家，所有专家权重必须常驻显存，但每次计算只需激活极少部分。',
    },
    {
      index: 2,
      tag: '视野拓展（瓶颈诊断）',
      kind: 'open',
      question:
        '在多卡部署 MoE 模型时，如果出现“某 1 个热门专家排了 100 个 Token，而其他 7 个专家只分到 2 个 Token”，这叫什么问题？对集群有什么危害？',
      answer:
        '叫专家负载不均（Load Imbalance）。因为同步等待机制，其他 7 张卡算完后必须干坐着等最忙的那张卡算完，导致整机吞吐暴跌。',
    },
  ],
  '6.1': [
    {
      index: 1,
      tag: '纸面算账（训练显存）',
      kind: 'open',
      question:
        '按照标准混合精度 AdamW 训练的“16P 静态显存公式”（BF16 权重 2P + BF16 梯度 2P + FP32 主权重/动量/方差 12P），训练一个 10B（100 亿参数）的大模型，仅静态模型状态（不含激活值）就需要多少 GB 显存？',
      answer: '10B × 16 Bytes = 160 GB 显存！单张 80GB H100 根本装不下，必须配合多卡切分（如 ZeRO/FSDP）。',
    },
    {
      index: 2,
      tag: '纸面算账（训练算力）',
      kind: 'open',
      question:
        '已知训练单个 Token 的计算量约为 6P（前向 2P + 反向 4P）。训练一个 10B 模型，每吃进 1 个 Token 需要做多少 GFLOPs 的计算？',
      answer: '6 × 10B = 60 GFLOPs / Token（是推理单 Token 20 GFLOPs 的 3 倍）。',
    },
  ],
  '6.2': [
    {
      index: 1,
      tag: '概念快测（单选）',
      kind: 'choice',
      question: '在 BF16 混合精度训练中，为什么优化器更新权重时必须维护一份额外的 FP32 主权重（Master Weights）？',
      options: [
        { key: 'A', text: '为了多占点显存' },
        { key: 'B', text: '防止极小的学习率更新量（如 1e-5 × 梯度）被 BF16 较短的 7 位尾数直接四舍五入吞没' },
        { key: 'C', text: 'GPU 硬件不支持 BF16 加法' },
        { key: 'D', text: '为了兼容 CPU' },
      ],
      correctKey: 'B',
      answer: '选 B。大数加极小数在低精度下会直接发生下溢丢失，导致模型权重无法微调、训练停滞。',
    },
    {
      index: 2,
      tag: '视野拓展（故障排查）',
      kind: 'open',
      question: '如果你在训练监控面板上看到 Loss 曲线突然变成 `NaN`（Not a Number），最常见的原因之一是什么？',
      answer:
        '数值溢出（Overflow，常见于 FP16 梯度爆表、学习率过大或脏数据导致除法除零）。改用 BF16、调小学习率或开启梯度裁剪（Gradient Clipping）通常能有效缓解。',
    },
  ],
  '6.3': [
    {
      index: 1,
      tag: '概念快测（单选）',
      kind: 'choice',
      question: '开启重计算（Activation Checkpointing）来拯救训练 OOM 爆显存，它的本质交易是？',
      options: [
        { key: 'A', text: '用显存换算力' },
        { key: 'B', text: '用多算约 33% 的算力换取大幅减少中间激活值显存' },
        { key: 'C', text: '用精度换显存' },
        { key: 'D', text: '用网速换显存' },
      ],
      correctKey: 'B',
      answer: '选 B。反向传播时从检查点重新前向算一遍激活值，用廉价的算力换取极其宝贵的 HBM 显存空间。',
    },
    {
      index: 2,
      tag: '视野拓展（方案选择）',
      kind: 'open',
      question: '为什么说“选择性重计算（Selective Checkpointing）”比“全量重计算”性价比高得多？',
      answer:
        '因为像 Dropout、LayerNorm、Softmax 这些算子计算量微不足道，却占用了极大比例的激活值显存；只重算它们几乎不增加总耗时（仅约 5%），却能省下 50%~70% 的激活显存。',
    },
  ],
  '6.4': [
    {
      index: 1,
      tag: '概念快测（单选）',
      kind: 'choice',
      question:
        '在 DeepSpeed ZeRO 的三个阶段中，哪两个阶段在显著省显存（4x~8x）的同时，几乎不增加任何额外的多卡通信量（堪称“免费午餐”）？',
      options: [
        { key: 'A', text: 'ZeRO-1 和 ZeRO-2' },
        { key: 'B', text: '只有 ZeRO-3' },
        { key: 'C', text: '全都不增加' },
        { key: 'D', text: '全都暴涨 3 倍' },
      ],
      correctKey: 'A',
      answer:
        '选 A（ZeRO-1 切优化器、ZeRO-2 切优化器+梯度）。只有 ZeRO-3（FSDP）因为连权重也切了，每层前向/反向需临时 AllGather 收集权重，才会增加约 50% 通信量。',
    },
    {
      index: 2,
      tag: '纸面算账（显存切分）',
      kind: 'open',
      question:
        '接 6.1 题：训练 10B 模型静态显存共 160 GB（权重 20G + 梯度 20G + 优化器 120G）。如果在 8 张 GPU 上开启 ZeRO-1（仅切分优化器状态），每张卡上的静态显存会从 160 GB 降到多少 GB？',
      answer:
        '每卡权重 20G + 梯度 20G + 优化器 (120G ÷ 8 = 15G) = 55 GB！原本单卡 80GB 爆显存，开个零额外通信代价的 ZeRO-1 就轻松塞进去了。',
    },
  ],
  '7.1': [
    {
      index: 1,
      tag: '概念快测（排序）',
      kind: 'open',
      question: '请按单卡双向带宽从高到低排序：InfiniBand 400G 网卡、PCIe 5.0 x16、HBM3 显存、NVLink 4（H100）。',
      answer: 'HBM3（~3,350 GB/s） > NVLink 4（900 GB/s） > PCIe 5.0 x16（128 GB/s） > InfiniBand 400G（100 GB/s 双向）。',
    },
    {
      index: 2,
      tag: '视野拓展（架构铁律）',
      kind: 'open',
      question: '如果一个工程师把 70B 模型的张量并行（TP=16）横跨了两台 8 卡服务器（跨过了慢速跨机网卡），性能会发生什么变化？为什么？',
      answer:
        '性能会断崖式雪崩！因为 TP 每一层都要做 2 次全量 AllReduce，通信极其频繁，必须死死锁在机内超高速 NVLink 域内；跨机通信只适合留给通信稀疏的 PP 或 DP。',
    },
  ],
  '7.2': [
    {
      index: 1,
      tag: '概念快测（单选）',
      kind: 'choice',
      question: '在多卡集合通信原语中，MoE（混合专家）模型的专家并行（EP）路由最核心依赖哪一个原语？',
      options: [
        { key: 'A', text: 'AllReduce' },
        { key: 'B', text: 'AllGather' },
        { key: 'C', text: 'ReduceScatter' },
        { key: 'D', text: 'All-to-All' },
      ],
      correctKey: 'D',
      answer:
        '选 D（All-to-All）。每张卡上的 Token 都要根据路由结果发往其他卡上对应的专家，算完再发回原卡，属于全对全动态交换。',
    },
    {
      index: 2,
      tag: '概念快测（判断）',
      kind: 'boolean',
      question: '判断正误：一次完整的 AllReduce 操作，在数学效果上等价于先做一次 ReduceScatter，再做一次 AllGather。',
      options: [
        { key: 'T', text: '正确' },
        { key: 'F', text: '错误' },
      ],
      correctKey: 'T',
      answer: '正确！这也是 ZeRO 和 FSDP 能把 AllReduce 拆开、在中间省下海量梯度与权重显存的数学基石。',
    },
  ],
  '7.3': [
    {
      index: 1,
      tag: '概念快测（连线/单选）',
      kind: 'choice',
      question: '以下哪种并行策略最容易在时间轴的开头和结尾产生大量 GPU 空等的“流水线气泡（Pipeline Bubble）”？',
      options: [
        { key: 'A', text: '数据并行（DP）' },
        { key: 'B', text: '张量并行（TP）' },
        { key: 'C', text: '流水线并行（PP）' },
        { key: 'D', text: '专家并行（EP）' },
      ],
      correctKey: 'C',
      answer:
        '选 C（PP）。把模型按层切段接力时，前面的机器算完前向要等后面的机器反向传回来，必须把 Batch 切分成多个 Micro-batch 来填平气泡。',
    },
    {
      index: 2,
      tag: '纸面算账（集群规模）',
      kind: 'open',
      question: '某千亿大模型训练配置了 3D 并行：TP = 8，PP = 4，DP = 16。请问这个训练任务一共动用了多少张 GPU？',
      answer: '总卡数 = TP × PP × DP = 8 × 4 × 16 = 512 张 GPU。',
    },
  ],
  '7.4': [
    {
      index: 1,
      tag: '纸面算账（重叠收益）',
      kind: 'open',
      question:
        '某一步训练中，GPU 计算耗时 100ms，多卡通信耗时 40ms。请问在“完全串行（无 Overlap）”和“理想完全重叠（Ideal Overlap）”下，总耗时分别是多少 ms？',
      answer: '完全串行 = 100 + 40 = 140ms；理想重叠 = max(100, 40) = 100ms，通信耗时被 100% 隐藏，速度直接提升 40%！',
    },
    {
      index: 2,
      tag: '视野拓展（代码避坑）',
      kind: 'open',
      question: '为什么在 PyTorch 训练循环里，千万不要每一步（Every Step）都在循环体里写 `print(loss.item())`？',
      answer:
        '因为 `.item()` 会强迫把 GPU 里的标量拷回 CPU 打印，触发隐式全局同步（`cudaDeviceSynchronize`），直接打断 GPU 的异步流水线和计算通信重叠，造成严重气泡。',
    },
  ],
  '7.5': [
    {
      index: 1,
      tag: '概念快测（单选）',
      kind: 'choice',
      question: '万卡集群训练时，10,000 张卡里只有 1 张卡因为散热故障触发降频变慢了一倍，但没有报错死机。这种现象在分布式系统里叫什么？',
      options: [
        { key: 'A', text: '内存泄漏' },
        { key: 'B', text: '慢节点（Straggler）木桶效应' },
        { key: 'C', text: '分支发散' },
        { key: 'D', text: '算子融合' },
      ],
      correctKey: 'B',
      answer:
        '选 B（Straggler）。因为每步都要做全局同步，1 张慢卡会拖着剩下 9,999 张顶级 GPU 全部陪它一起原地罚站。',
    },
    {
      index: 2,
      tag: '视野拓展（容错直觉）',
      kind: 'open',
      question: '什么是万卡集群里最难排查的“静默数据损坏（SDC）”？',
      answer:
        '芯片既不死机也不报硬件错误，但某个乘法器算错了一位数字，导致训练几天后 Loss 莫名其妙发散崩盘。大厂需要靠定期轻量算子自检和异常回滚机制来防范。',
    },
  ],
  '8.1': [
    {
      index: 1,
      tag: '概念快测（单选）',
      kind: 'choice',
      question:
        '某大模型 API 产品的商业目标是“在保证用户不卡顿（TTFT < 1s 且 TPOT < 40ms）的前提下，每张卡赚最多的钱”。它最应该盯紧的核心指标是？',
      options: [
        { key: 'A', text: '单用户极限速度' },
        { key: 'B', text: 'Goodput（达标有效吞吐）' },
        { key: 'C', text: '模型参数量' },
        { key: 'D', text: '显存总容量' },
      ],
      correctKey: 'B',
      answer: '选 B（Goodput）。无视延迟红线硬拉高总吞吐会把用户卡跑，只有在 SLO 红线内跑出的最高吞吐才是真金白银。',
    },
    {
      index: 2,
      tag: '纸面算账（指标换算）',
      kind: 'open',
      question: '如果压测报告显示某推理服务的 TPOT（单字生成耗时）为 25 ms，请问用户看到的吐字速度是多少 tokens/s？这个速度是否超过了人类正常阅读速度？',
      answer: '1000 ms ÷ 25 ms = 40 tokens/s。人类正常阅读速度约 5~10 字/秒，40 tokens/s 已经极其丝滑流畅。',
    },
  ],
  '8.2': [
    {
      index: 1,
      tag: '概念快测（判断）',
      kind: 'boolean',
      question:
        '判断正误：在终端运行 `nvidia-smi` 看到 `GPU-Util: 100%`，就说明这张 GPU 的 Tensor Core 算力已经跑满了 100%，没有任何优化空间了。',
      options: [
        { key: 'T', text: '正确' },
        { key: 'F', text: '错误' },
      ],
      correctKey: 'F',
      answer:
        '错误！`nvidia-smi` 的 Util 只是“有 Kernel 在运行的时间占比”，哪怕只动用了 1% 的核心在等显存搬运也会显示 100%。必须结合功耗（Power）和 Nsight Systems/Compute 才能看清真相。',
    },
    {
      index: 2,
      tag: '视野拓展（工具选择）',
      kind: 'open',
      question:
        '你想查清整个大模型推理服务里“是不是 CPU 分词拖慢了 GPU，导致 GPU 轨道出现大片空白气泡”，应该优先用 Nsight Systems（nsys）还是 Nsight Compute（ncu）？',
      answer:
        '优先用 Nsight Systems（nsys）！它是系统级时间轴“心电图”，一眼就能看清 CPU、GPU 和通信轨道的宏观气泡；ncu 是用来显微解剖单个慢算子内部的。',
    },
  ],
  '8.3': [
    {
      index: 1,
      tag: '概念快测（单选）',
      kind: 'choice',
      question: 'vLLM 启动时提前录制并启用了 CUDA Graph，它主要用来消除哪种性能瓶颈？',
      options: [
        { key: 'A', text: 'HBM 容量不足' },
        { key: 'B', text: 'Decode 阶段频繁发射微小算子导致的 CPU Kernel Launch 开销' },
        { key: 'C', text: '硬盘读取慢' },
        { key: 'D', text: '多卡网线断了' },
      ],
      correctKey: 'B',
      answer:
        '选 B。CUDA Graph 把几百个微小 Kernel 打包成一张静态执行图，CPU 发 1 次指令就能全部跑完，大幅压低小 Batch Decode 延迟。',
    },
    {
      index: 2,
      tag: '视野拓展（排障演练）',
      kind: 'open',
      question:
        '你在云端租了一张 24GB 显存的卡用 vLLM 部署 Qwen-7B（BF16 权重 14GB），启动时却直接报 `CUDA Out of Memory`。在不换卡的前提下，写出 2 个立竿见影的排查/修复参数。',
      answer:
        '1）调低 `--max-model-len`（默认可能是 32K 甚至 128K，预分配的 KV Cache 太大撑爆了剩余 10GB）；2）调高或合理设置 `--gpu-memory-utilization`（如 0.9），或改用 AWQ/FP8 量化版本把权重压到 4~7GB。',
    },
  ],
  '8.4': [
    {
      index: 1,
      tag: '概念快测（判断）',
      kind: 'boolean',
      question:
        '判断正误：在 Python 里测一个 GPU 矩阵乘法的耗时，只需要在代码前后各写一行 `time.time()` 相减，得到的就是准确的 GPU 实际计算时间。',
      options: [
        { key: 'T', text: '正确' },
        { key: 'F', text: '错误' },
      ],
      correctKey: 'F',
      answer:
        '错误！GPU 是异步执行的，CPU 把任务发射给 GPU 后立刻就会执行下一行 `time.time()`，测出来的只是几微秒的“发指令时间”。必须先调用 `torch.cuda.synchronize()` 或使用 `torch.cuda.Event` 计时。',
    },
    {
      index: 2,
      tag: '视野拓展（实验规范）',
      kind: 'open',
      question: '为什么所有的专业 GPU 性能基准测试（如 MLPerf）在正式计时前，都必须强制先跑几轮“预热（Warmup）”？',
      answer:
        '因为前几次运行包含了 CUDA 上下文初始化、显存池首次向操作系统申请分配、以及算子库/图编译的首次编译开销。不做 Warmup 会把这些一次性冷启动耗时混进成绩，导致数据严重失真。',
    },
  ],
  '8.5': [
    {
      index: 1,
      tag: '纸面算账（电费直觉）',
      kind: 'open',
      question:
        '一台 8 卡 H100 服务器满载整机功耗约 10 kW（千瓦）。按工业电价每度电（1 kWh）0.1 美元计算，这台机器一年 365 天 × 24 小时满载运行，光给它交电费（不含空调散热 PUE）就要花多少钱？',
      answer:
        '10 kW × 24 小时 × 365 天 = 87,600 度电；87,600 × $0.1 = $8,760/年（若算上机房散热 PUE=1.3，一年电费超 1.1 万美元，3 年电费就超 3.3 万美元！）。',
    },
    {
      index: 2,
      tag: '视野拓展（商业闭环）',
      kind: 'open',
      question:
        '回顾全部 40 节课，如果让你用一句话向非技术背景的老板解释：为什么公司花高薪养一支“AI 芯片性能分析与系统优化团队”是稳赚不赔的生意？',
      answer:
        '因为在智算中心硬件采购与电费极其高昂的背景下，性能团队只要通过软硬协同调优把单卡有效吞吐（Goodput）翻一倍，就等于凭空为公司省下了一半的显卡采购费和机房电费，直接转化为产品的毛利和价格护城河。',
    },
  ],
  '5.7': [
    {
      index: 1,
      tag: '概念快测（单选）',
      kind: 'choice',
      question:
        '某同学在 PyTorch 中测 GPU 算子耗时：`t0 = time.time(); out = layer(x); t1 = time.time()`，结果只有 0.01ms（快得离谱）。根本原因是？',
      options: [
        { key: 'A', text: '显卡超常发挥' },
        { key: 'B', text: 'CUDA 发射是异步的，未调用 `torch.cuda.synchronize()` 只测了 CPU 发指令的时间' },
        { key: 'C', text: 'PyTorch 跳过了计算' },
        { key: 'D', text: '显存频率翻倍' },
      ],
      correctKey: 'B',
      answer:
        '选 B。GPU 异步干活，CPU 把指令扔进队列就立刻执行下一行了。必须加同步或用 `torch.cuda.Event`。',
    },
    {
      index: 2,
      tag: '纸面算账（算子融合收益）',
      kind: 'open',
      question:
        '对 100 MB 张量连续做 3 个独立逐元素操作（Add → SiLU → Scale）。未融合时每步读写各 100MB；用 Triton 融合成 1 个 Kernel 后只需最初读 100MB、最终写 100MB。共省掉多少比例的 HBM 访存量？',
      answer:
        '未融合 = 3×200 = 600 MB；融合后 = 200 MB。直接省掉 66.7% 的 HBM 搬运量，理论加速近 3 倍！',
    },
  ],
  '5.8': [
    {
      index: 1,
      tag: '概念快测（单选）',
      kind: 'choice',
      question:
        '在多轮 Agent 场景下，大厂用 Mooncake / LMCache 将海量历史 KV Cache 卸载到主机内存或分布式 SSD 池，前缀缓存命中率高达 90%。此时系统最容易冒出的 2026 新型瓶颈是？',
      options: [
        { key: 'A', text: 'Tensor Core 算力严重不够' },
        { key: 'B', text: '存储 I/O 墙（网卡/总线从外部池拉取历史 KV 太慢，导致 GPU 功耗极低在干等数据）' },
        { key: 'C', text: '屏幕刷新率太低' },
        { key: 'D', text: '键盘延迟' },
      ],
      correctKey: 'B',
      answer:
        '选 B。前缀命中率极高反而让 Prefill 计算量暴跌，但疯狂从外部存储池把几十 GB 历史 KV 搬回显存的 I/O 带宽成了头号瓶颈。',
    },
    {
      index: 2,
      tag: '视野拓展（RL 后训练排障）',
      kind: 'open',
      question:
        '为什么在大模型 RL（如 GRPO / RLVR）后训练中，70% 以上的时间都耗在 Rollout（推理生成轨迹）阶段，且 GPU 利用率越到后面越低？',
      answer:
        '因为同一 Batch 里不同题目的思维链（CoT）生成长度极度不均——短的 300 Token 就结束了，最长的要思考 2 万 Token。在同步批处理下，算完的 GPU 槽位只能干等那条最长的长尾轨迹跑完，形成严重的木桶效应（Straggler Tail）。',
    },
  ],
  '8.6': [
    {
      index: 1,
      tag: '概念快测（单选）',
      kind: 'choice',
      question:
        '根据动态功耗公式 P = α·C·V²·f，若通过 DVFS 将电压 V 降 10%、频率 f 降 10%，动态功耗大约下降多少？',
      options: [
        { key: 'A', text: '约 10%' },
        { key: 'B', text: '约 19%' },
        { key: 'C', text: '约 27%' },
        { key: 'D', text: '约 50%' },
      ],
      correctKey: 'C',
      answer: '选 C（约 27%）。0.9² × 0.9 = 0.729，动态功耗下降约 27.1%！',
    },
    {
      index: 2,
      tag: '避坑实战（JD 扫雷）',
      kind: 'choice',
      question:
        '招聘软件里看到以下 4 个岗位，哪个最符合“不碰 Verilog/UVM、发挥 IC 背景、主攻性能与架构”的目标？',
      options: [
        { key: 'A', text: 'GPU IP 验证工程师（精通 SV/UVM、VCS/Verdi）' },
        { key: 'B', text: '硬件架构师（服务器整机、原理图与 PCB Layout 评审）' },
        { key: 'C', text: 'NPU 高性能计算（vLLM 适配自研 NPU、驱动优化与竞品分析，电子信息硕士优先）' },
        { key: 'D', text: 'AI 能耗优化（空调冰箱强化学习节能控制）' },
      ],
      correctKey: 'C',
      answer:
        '选 C！A 是硅前数字验证；B 是画电路板的服务器整机硬件；D 是家电算法；只有 C 精准踩中目标赛道。',
    },
  ],
};
