export const module5 = {
  id: 'module-5',
  number: '05',
  title: '模块五：大模型推理系统深潜',
  perspectiveTag: '降本增效视角',
  shortDesc: '吃透软硬协同优化的精华：从 Prefill/Decode 冲突、vLLM 便利贴、FlashAttention 到 PD 分离与 MoE，把延迟和成本打到极致。',
  accent: 'sky',
  lessons: [
    {
      id: '5.1',
      title: '5.1 Transformer 推理的两副面孔（Prefill vs Decode）',
      isCore: true,
      readTime: '6 分钟',
      tags: ['核心主线', 'Prefill', 'Decode', 'TTFT/TPOT'],
      goal: '分清首字填充（算力密集 GEMM）与逐字生成（带宽密集 GEMV）这对冰火两重天的物理瓶颈。',
      blocks: [
        { type: 'heading', text: '核心直觉' },
        {
          type: 'paragraph',
          text: '大模型回答你一个问题，其实分成了性格截然相反的两个阶段：第一阶段叫 Prefill（预填充，就像“一次性读完一整张试卷”），可以把你输入的 1000 个字打包成大矩阵一口气并行算完，GPU 大脑烧得滚烫；第二阶段叫 Decode（解码，就像“提笔一个字一个字写作文”），每次只能算 1 个新字，大脑闲得发慌，全在等搬运工搬草稿纸。',
        },
        { type: 'heading', text: '底层机制拆解' },
        {
          type: 'list',
          ordered: true,
          items: [
            {
              lead: 'Prefill 阶段（决定首字延迟 TTFT）：',
              body: '处理用户输入的全部 Prompt Token。因为所有输入词已知，可组成大矩阵做 GEMM，算术强度极高，属于典型的 **Compute-Bound（算力受限）**，此阶段同时生成初始的 KV Cache。',
            },
            {
              lead: 'Decode 阶段（决定吐字速度 TPOT）：',
              body: '自回归逐字生成。每次只输入刚生成的 1 个 Token，矩阵乘法退化为“向量 × 矩阵（GEMV）”，每算 1 个字却要把全部权重和所有历史 KV Cache 从 HBM 搬一遍，属于极端的 **Memory-Bound（带宽受限）**。',
            },
            {
              lead: '两阶段的剧烈冲突：',
              body: '把一个长文本用户的 Prefill 和十几个正在流畅吐字的 Decode 用户混在同一张卡上跑，巨大的 Prefill 会瞬间霸占 GPU 几百毫秒，导致那十几个正在吐字的用户突然卡顿停住（出现毛刺延迟）。',
            },
          ],
        },
        {
          type: 'table',
          title: '核心对比表 · Prefill vs Decode 两阶段对比',
          headers: ['对比维度', 'Prefill（预填充 / 读题）', 'Decode（解码 / 写字）'],
          rows: [
            ['计算模式', '并行处理所有输入 Token（大矩阵乘 GEMM）', '串行逐个生成 Token（向量乘矩阵 GEMV）'],
            ['核心性能指标', 'TTFT（首字延迟，Time To First Token）', 'TPOT（单字生成耗时，Time Per Output Token）'],
            ['硬件瓶颈（Roofline）', 'Compute-Bound（卡算力）', 'Memory-Bound（卡显存带宽与容量）'],
            ['算力利用率（MFU）', '极高（轻松打满 Tensor Core）', '极低（小 Batch 时大量算力空转）'],
          ],
        },
        {
          type: 'callout',
          variant: 'engineer',
          title: '性能工程师“算账”视角',
          content:
            '理解 Prefill vs Decode 的本质割裂——一个是算力密集 GEMM，一个是基于 Autoregressive Decoding（自回归解码）的带宽密集 GEMV——是看懂现代所有大模型推理优化（Chunked Prefill、Continuous Batching、PD 分离）的总开关。任何优化方案，你都要先问一句：“它优化的是 Prefill 的算力，还是 Decode 的带宽？”\n核心工程表达：大模型推理呈 Prefill vs Decode 双相异构特征，前者受限于 GEMM 算力（主导 TTFT），后者受限于 Autoregressive Decoding（自回归解码）下的显存搬运带宽（主导 TPOT）。',
        },
        {
          type: 'quiz',
          question:
            '思考题：如果用户给你发了一篇 5 万字的长论文，只让你总结成 10 个字；另一个用户只问了一句“你好”，让你写一篇 5000 字的小说。这两个请求分别主要消耗哪种硬件资源？',
          answer:
            '第一个请求（长输入、短输出）耗时绝大部分花在 Prefill 阶段，极度消耗 GPU 计算算力（Compute-Bound）；第二个请求（短输入、长输出）耗时绝大部分花在 5000 次 Decode 循环上，极度消耗显存带宽（Memory-Bound）。',
        },
      ],
    },
    {
      id: '5.2',
      title: '5.2 显存管理与调度体系（KV Cache / vLLM / SGLang）',
      isCore: true,
      readTime: '8 分钟',
      tags: ['核心主线', 'KV Cache', 'PagedAttention', 'SGLang', 'vLLM'],
      goal: '用“大脑、书桌、大书柜”和“便利贴”4 个通关比喻，彻底打通 KV Cache 爆炸与 vLLM 分页调度全链路。',
      blocks: [
        { type: 'heading', text: '核心直觉' },
        {
          type: 'paragraph',
          text: '4 关秒懂大模型推理核心：第 1 关，大模型是“文字接龙”，每吐新字都要重看前文；第 2 关，为了不重复算前文的“读书笔记（K/V）”，把它们抄在草稿纸（KV Cache）上用空间换时间；第 3 关，草稿纸太厚会撑爆 GPU 的大书柜（HBM）并堵死走廊（带宽）；第 4 关，vLLM 把必须整本预留的大笔记本撕成按需分配的“便利贴（PagedAttention）”，彻底根治显存浪费！',
        },
        { type: 'heading', text: '底层机制拆解' },
        {
          type: 'list',
          ordered: true,
          items: [
            {
              lead: '传统框架的 80% 显存浪费：',
              body: '推理前不知道模型最终会答 5 个字还是 2000 字，传统框架强迫单个请求的 KV Cache 物理连续，只能按最大长度提前占住一整排书柜，导致高达 60%~80% 的内部与外部显存碎片。',
            },
            {
              lead: 'vLLM 的 PagedAttention（便利贴魔法）：',
              body: '借鉴操作系统虚拟内存分页机制，将 KV Cache 切分为固定大小的 Block（如每块存 16 个 Token）。用一张拿一张、物理上可东一张西一张随便贴，通过极小的 Block Table（小目录）映射回逻辑连续序列，把显存浪费压到 4% 以下。',
            },
            {
              lead: 'Continuous Batching（连续批处理）：',
              body: '以前必须等一个 Batch 里最慢的长作文写完，整批人才能一起下车换下一批；连续批处理改成“按单个 Token 步长调度”，谁答完了立刻下车、空出的显存马上塞进新用户，吞吐量翻倍。',
            },
            {
              lead: 'SGLang 的 RadixAttention（前缀树共享）：',
              body: '如果 100 个用户共用同一段 2000 字的系统提示词，或者在多轮对话里反复追问，SGLang 用基数树（Radix Tree）自动缓存并复用公共前缀的 KV Cache，连 Prefill 都省了，首字延迟瞬间归零。',
            },
          ],
        },
        {
          type: 'table',
          title: '核心对比表 · 推理显存管理与调度体系',
          headers: ['核心推理技术', '生活类比', '解决的核心痛点', '带来的量化收益'],
          rows: [
            ['KV Cache', '随手抄下的读书笔记草稿纸', '避免自回归每步重复计算历史 Token', '推理速度提升几十倍（空间换时间）'],
            ['PagedAttention (vLLM)', '撕开按需贴的便利贴 + 小目录', '物理连续分配导致的 60%~80% 碎片浪费', '显存浪费降至 <4%，并发容量翻倍'],
            ['Continuous Batching', '地铁到站随时上下客，不等全车', '长短请求混跑导致的 GPU 空等气泡', '系统有效吞吐量提升数倍'],
            ['RadixAttention (SGLang)', '公共题干草稿纸全班共享复印', '多轮对话/相同 System Prompt 重复 Prefill', '缓存命中时 TTFT 大幅骤降'],
          ],
        },
        {
          type: 'callout',
          variant: 'engineer',
          title: '性能工程师“算账”视角',
          content:
            '作为集成电路专业视角，vLLM 是极其经典的“软硬件协同”范例——通过 Non-contiguous Physical Allocation（非连续物理显存分配）与页表级 Block Table / Fragmentation（内外碎片）治理，硬生生在不改 HBM 容量的前提下释放并发；再叠加 Continuous Batching（连续批处理）与 Prefix Caching / RadixAttention 前缀复用，云端实测时调好 `gpu_memory_utilization` 和 `max_num_seqs` 参数就能直接看到吞吐飙升。\n核心工程表达：现代推理调度通过 Paged KV Cache（Non-contiguous Physical Allocation + Block Table）消除 Fragmentation（内外碎片），并以 Continuous Batching 与 Prefix Caching / RadixAttention 榨干并发与命中率。',
        },
        {
          type: 'quiz',
          question:
            '思考题：为什么说开启了 Prefix Caching / RadixAttention 后，多轮对话和 Agent（智能体）场景的推理成本会大幅下降？',
          answer:
            '多轮对话和 Agent 每次调用都会把前面十几轮的历史对话、系统指令和工具定义原封不动再发一遍。开启前缀缓存后，前面几万字的 KV Cache 直接复用，GPU 只需计算最新追问的那十几个字，省掉了绝大部分 Prefill 算力消耗。',
        },
      ],
    },
    {
      id: '5.3',
      title: '5.3 注意力机制软硬协同瘦身（GQA / MLA / FlashAttention）',
      isCore: true,
      readTime: '6 分钟',
      tags: ['核心主线', 'GQA', 'MLA', 'FlashAttention'],
      goal: '看懂 GQA 拼桌、DeepSeek MLA 低秩压缩与 FlashAttention 分块不回写如何联手驯服注意力瓶颈。',
      blocks: [
        { type: 'heading', text: '核心直觉' },
        {
          type: 'paragraph',
          text: '面对“草稿纸太厚、走廊太窄”的死结，算法和系统联手打出了两套神仙组合拳：一套给草稿纸极限瘦身——从 MHA（8 个学霸每人一本笔记）进化到 GQA（分组拼桌合用一本），再到 DeepSeek 的 MLA（把笔记压成极薄密码本过走廊，到书桌后用闲置大脑现场解压）；另一套是 FlashAttention——绝不把庞大的中间成绩单写回楼下大书柜（HBM），直接切块锁在书桌（SRAM）里算完！',
        },
        { type: 'heading', text: '底层机制拆解' },
        {
          type: 'list',
          ordered: true,
          items: [
            {
              lead: 'GQA（分组查询注意力，Llama-3/Qwen 标配）：',
              body: '把多头分成若干组，每组共享同一套 K 和 V 笔记，直接把 KV Cache 显存占用和搬运量砍掉 4~8 倍，几乎不掉模型智商。',
            },
            {
              lead: 'DeepSeek MLA（多头潜在注意力）：',
              body: '精准利用 GPU“算力严重过剩、带宽严重不足”的硬件特性！写入 HBM 前先用低秩投影把 K/V 压缩成一个极小的潜在向量（瘦身 90%+），搬到片上后再利用矩阵乘法结合律吸收/解压还原，以极低算力代价换取极致省显存与高智商。',
            },
            {
              lead: 'FlashAttention（IO 感知的精确计算）：',
              body: '标准 Attention 需要先算出一张巨大的 N×N 注意力分数矩阵，写回 HBM，做 Softmax 再读回来，HBM 读写量随长度平方爆炸。FlashAttention 用分块计算（Tiling）+ 在线 Softmax（Online Softmax）技巧，把 Q、K、V 切成小块搬进片上 SRAM，在书桌里一气呵成算完局部结果并动态修正，全程不把 N×N 巨矩阵写回 HBM，数学结果 100% 精确等价，速度却快了 2~4 倍且显存占用从 O(N²) 降到 O(N)！',
            },
          ],
        },
        {
          type: 'table',
          title: '核心对比表 · 注意力机制软硬协同优化',
          headers: ['优化技术', '草稿纸/书桌比喻', '优化层级', '核心硬件收益'],
          rows: [
            ['GQA', '学霸分组拼桌共用草稿纸', '模型架构层', 'KV Cache 体积与带宽需求直降 4~8x'],
            ['DeepSeek MLA', '存浓缩密码本，到书桌现场解压', '模型架构层', 'KV Cache 瘦身 90%+，用过剩算力换带宽'],
            ['FlashAttention (1/2/3)', '切块锁在书桌（SRAM）一气呵成', '底层算子层', '消除 N×N 矩阵 HBM 读写，提速且省显存'],
          ],
        },
        {
          type: 'callout',
          variant: 'engineer',
          title: '性能工程师“算账”视角',
          content:
            'GQA / MLA（多头潜在注意力）负责从模型结构源头压缩 KV Cache 体积，而 FlashAttention 则是 AI 芯片领域基于 IO-Aware Tiling / Online Softmax（访存感知分块与在线归约）的封神之作。它甚至在反向传播时故意“扔掉中间矩阵、需要时重新算一遍”——宁可多花廉价的 Tensor Core 算力（FLOPs），也绝不多走一趟昂贵的 HBM 走廊！\n核心工程表达：注意力软硬协同围绕两条主轴展开——结构侧用 GQA / MLA（多头潜在注意力）压缩 KV 体积，算子侧靠 IO-Aware Tiling / Online Softmax 将 O(N²) HBM 读写锁进片上 SRAM。',
        },
        {
          type: 'quiz',
          question:
            '思考题：FlashAttention 的计算量（FLOPs）其实比传统标准 Attention 还要稍微多一点（因为反向重算），为什么它反而跑得快好几倍？',
          answer:
            '因为标准 Attention 严重卡在 HBM 显存带宽上（Memory-Bound），大量时间浪费在把庞大的 N×N 中间矩阵反复搬进搬出 HBM。FlashAttention 虽然多花了一点点算力，但把昂贵的 HBM 访存量砍掉了数量级，总耗时反而大幅缩减。',
        },
      ],
    },
    {
      id: '5.4',
      title: '5.4 突破逐字生成魔咒（投机采样与 MTP）',
      isCore: false,
      readTime: '6 分钟',
      tags: ['投机采样', 'MTP', 'EAGLE', 'Medusa'],
      goal: '理解“小模型快草稿 + 大模型一次性批改”如何把内存带宽浪费转化成一次验证多个 Token 的免费午餐。',
      blocks: [
        { type: 'heading', text: '核心直觉' },
        {
          type: 'paragraph',
          text: 'Decode 阶段最让人抓狂的是“大专家（70B 大模型）每写一个字都要翻一遍整座书库”，大脑 99% 在闲着。投机采样（Speculative Decoding）的绝招是给大专家配一个手脚麻利的实习生（1B 小模型）：让实习生一口气先盲猜写出 5 个字，然后大专家一次性把这 5 个字打包成矩阵并行批改！批改 5 个字和自己写 1 个字搬运的数据量几乎一样，只要实习生猜对 3~4 个，速度直接翻几倍，而且数学上保证最终输出分布和原大模型 100% 一致！',
        },
        { type: 'heading', text: '底层机制拆解' },
        {
          type: 'list',
          ordered: true,
          items: [
            {
              lead: '化串行为并行：',
              body: '大专家验证 5 个草稿 Token 只需做 1 次前向传播（类似一个迷你 Prefill），由于大模型权重只需从 HBM 搬运 1 次，原本闲置的 Tensor Core 算力被白嫖起来做并行批改。',
            },
            {
              lead: '无损拒绝采样：',
              body: '大专家逐个核对实习生猜的字，前面猜对的全部直接录用，遇到第一个猜错的字，大专家当场用自己的正确分布纠正并扔掉后面的草稿，进入下一轮。零精度损失！',
            },
            {
              lead: 'MTP（多 Token 预测，如 DeepSeek-V3 / Medusa / Eagle）：',
              body: '不再另外养一个独立小模型，而是直接在原大模型屁股后面挂几个轻量的预测头，训练时就让它学会“一次往后多猜几个字”，推理时无缝接上投机采样，部署更简单、命中率更高。',
            },
          ],
        },
        {
          type: 'table',
          title: '核心对比表 · 投机采样技术路线',
          headers: ['技术路线', '草稿来源', '加速原理', '最适用场景'],
          rows: [
            ['经典投机采样', '独立的小尺寸同族模型（Draft Model）', '小模型连猜 K 字，大模型 1 次并行验证', '低并发/代码生成/格式化文本（极易猜中）'],
            ['EAGLE / Medusa', '外挂在主模型隐藏层上的轻量预测头', '免去维护独立小模型，利用深层特征猜字', '单卡/多卡通用低延迟推理'],
            ['MTP（DeepSeek-V3）', '原生融入预训练的多 Token 预测模块', '既提升训练质量，推理自带投机加速能力', '前沿大模型原生态推理加速'],
          ],
        },
        {
          type: 'callout',
          variant: 'engineer',
          title: '性能工程师“算账”视角',
          content:
            '注意 Speculative Decoding / MTP（投机采样与多词元预测）的“并发天花板”：它在低并发（Batch 很小，GPU 算力严重过剩）时能通过一次矩阵验证多个草稿 Token 轻松提速 2~3 倍；但在极高并发（大 Batch 下 GPU 算力已经被打满）时，强行并行批改多个草稿反而会争抢计算单元导致延迟恶化！\n核心工程表达：Speculative Decoding / MTP 用低并发场景下的富余 Compute Budget 换取 Decode 访存复用率，其收益边界受算术强度拐点与 Draft Acceptance Rate（接受率）双重约束。',
        },
        {
          type: 'quiz',
          question:
            '思考题：为什么投机采样在“写代码、做摘要、翻译”等任务上加速比极高，但在“天马行空写创意小说”时加速效果会变差？',
          answer:
            '代码语法、固定模板和摘要的上下文确定性很强，小模型实习生猜中率（Acceptance Rate）极高，一次能过 4~5 个字；而天马行空的创意写作不确定性大，小模型经常第一个字就猜错被大专家打回，白费了起草和验证功夫。',
        },
      ],
    },
    {
      id: '5.5',
      title: '5.5 PD 分离（Prefill-Decode Disaggregation）架构',
      isCore: false,
      readTime: '6 分钟',
      tags: ['PD 分离', 'DistServe', 'Mooncake', 'RDMA'],
      goal: '明白为什么长上下文 Prefill 会干扰在线打字体验，以及如何拆池子与跨机传输 KV Cache。',
      blocks: [
        { type: 'heading', text: '核心直觉' },
        {
          type: 'paragraph',
          text: '前面说过，Prefill（读题，重算力）和 Decode（写字，重带宽）性格完全水火不容，硬塞在同一张卡上就像让“重型货车”和“快递电驴”共用一条窄巷，互相堵死。工业界最新架构（如 DistServe、Mooncake、DeepSeek 推理集群）干脆彻底分家：专门划一批算力猛的 GPU 集群当“读题部（P 节点）”，专门划一批显存大/带宽高的 GPU 集群当“写字部（D 节点）”！',
        },
        { type: 'heading', text: '底层机制拆解' },
        {
          type: 'list',
          ordered: true,
          items: [
            {
              lead: '消除干扰（Zero Interference）：',
              body: 'P 节点专注把长输入极速算完，压低 TTFT；D 节点不再被突然闯入的长文本 Prefill 打断，可以极其丝滑稳定地维持极低的 TPOT 吐字延迟，并安心把 Batch 凑得极大以吃满带宽。',
            },
            {
              lead: '异构硬件精准省钱：',
              body: 'P 节点配高算力芯片（如 H100/B200）且用较小并行度；D 节点可以配大显存、高带宽但算力稍弱（或更便宜）的芯片，把每一分硬件采购成本花在刀刃上。',
            },
            {
              lead: '核心挑战——KV Cache 高速迁移：',
              body: 'P 节点算完初始 KV Cache 后，必须通过超高速网络（NVLink / RDMA InfiniBand）瞬间把这份草稿纸“快递”到 D 节点的显存里。这要求极高的网络带宽和精细的逐层流式传输（算完第 1 层立刻传第 1 层，不等全算完）。',
            },
          ],
        },
        {
          type: 'table',
          title: '核心对比表 · 推理部署架构演进',
          headers: ['部署架构', 'Prefill 与 Decode 关系', '优点', '核心瓶颈与要求'],
          rows: [
            ['混布架构（传统）', '共用同一批 GPU，交替执行', '部署简单、无需跨节点传 KV Cache', '长 Prefill 严重阻塞 Decode 吐字延迟'],
            ['Chunked Prefill（折中）', '同卡混布，把长 Prefill 切碎插空跑', '缓解卡顿，无需额外网络传输', '仍共享同一种硬件配比，无法各自最优'],
            ['PD 分离架构（前沿）', '物理拆分到独立 P 集群和 D 集群', 'TTFT 与 TPOT 独立达标，支持异构降本', '极度依赖 RDMA/NVLink 高速传输 KV Cache'],
          ],
        },
        {
          type: 'callout',
          variant: 'engineer',
          title: '性能工程师“算账”视角',
          content:
            'PD Disaggregation（PD 分离，即 Prefill 与 Decode 节点解耦）能跑得比混布更划算，有一个关键前提——KV Cache 跨节点传输体积不能太大！如果用传统 MHA，跨机传一份 10 万字的 KV Cache 要十几 GB，RDMA 链路直接堵爆；正是因为 GQA 和 DeepSeek MLA 把草稿纸压薄了 90%，PD Disaggregation 才真正迎来了大规模工业爆发。\n核心工程表达：PD Disaggregation（PD 分离）消除了长 Prefill 对在线 Decode 的尾部延迟干扰，其经济性高度依赖 MLA/GQA 压缩与高速 RDMA KV 迁移吞吐。',
        },
        {
          type: 'quiz',
          question:
            '思考题：在 PD 分离集群中，如果线上突然涌入大量“输入极长（长文档分析）、输出极短”的请求，运维系统应该怎么动态调整？',
          answer:
            '应该动态调大 P 节点（Prefill 集群）与 D 节点（Decode 集群）的机器数量比例（例如从 1:3 调整为 2:2），把更多算力资源倾斜给读题部，防止长输入在 P 节点排长队导致首字延迟雪崩。',
        },
      ],
    },
    {
      id: '5.6',
      title: '5.6 MoE（混合专家）模型的推理挑战',
      isCore: false,
      readTime: '6 分钟',
      tags: ['MoE', 'DeepSeek-V3', 'All-to-All', '专家并行'],
      goal: '算清 MoE“激活参数少但总权重全要驻留显存”的账，以及低 Batch 下路由稀疏导致的带宽压力。',
      blocks: [
        { type: 'heading', text: '核心直觉' },
        {
          type: 'paragraph',
          text: '以前的稠密模型（Dense，如 Llama-70B）像一个“全科医生”，不管你问感冒还是骨折，每次看病都得动用全部 700 亿参数；而 MoE（混合专家，如 DeepSeek-V3 671B、Mixtral）像一家“大型综合医院”，总共有 256 个专科专家，但每次挂号先由“导诊台（Router）”挑出最对口的 8 个专家会诊——总参数高达 671B，每次实际只激活 37B！',
        },
        { type: 'heading', text: '底层机制拆解' },
        {
          type: 'list',
          ordered: true,
          items: [
            {
              lead: '显存占得多、算力吃得少：',
              body: '虽然每次只用 37B 参数计算（极省算力），但因为你不知道下一个字会点到哪个专家，医院里全部 671B 参数的专家必须全天候坐在显存里待命！单卡根本装不下，必须多卡甚至跨机部署。',
            },
            {
              lead: '低并发下的带宽灾难：',
              body: '如果只有 1 个用户提问，每次点 8 个专家，每个专家只算 1 个 Token，算术强度极低；必须把全系统的并发 Batch 做得极大（例如同时处理几百个请求），让每个专家手里都能分到几十个 Token，才能喂饱 Tensor Core。',
            },
            {
              lead: '专家负载不均（Load Imbalance）与 All-to-All 通信：',
              body: '如果某几个热门专家（比如处理常见中文词汇的专家）排起长队，而其他冷门专家闲着嗑瓜子，整张集群的进度就会被最忙的那个专家拖死；同时 Token 需要在不同显卡的专家之间满场乱飞（All-to-All 通信），网络压力极大。',
            },
          ],
        },
        {
          type: 'table',
          title: '核心对比表 · 稠密模型 vs 混合专家模型（MoE）',
          headers: ['对比维度', '稠密模型（Dense，如 70B）', '混合专家模型（MoE，如 671B 激活 37B）'],
          rows: [
            ['单 Token 计算量', '与总参数量成正比（高）', '仅与激活参数量成正比（极低，省算力）'],
            ['显存容量需求', '中等（仅存 70B）', '极大（必须把所有 671B 专家全装进显存）'],
            ['多卡通信特征', '规则的 AllReduce（张量并行）', '复杂的动态 All-to-All（专家并行 EP）'],
            ['推理优化核心', '量化 + Batching', '超大 Batch 聚合 + 专家负载均衡 + 通信计算重叠'],
          ],
        },
        {
          type: 'callout',
          variant: 'engineer',
          title: '性能工程师“算账”视角',
          content:
            'MoE 是“算力平权”的大杀器：它用 37B 的激活算力代价换出超越数百 B 稠密模型的智商，但在工程落地时最头疼 MoE Routing / Load Imbalance（专家负载不均，热门专家排队而冷门专家闲置导致木桶效应）以及跨机 All-to-All 通信。必须靠专家并行（EP）+ 辅助均衡调度与双微批次重叠（Dual-Batch Overlap）把沉重通信彻底藏起来。\n核心工程表达：MoE 架构落地的关键在于抑制 MoE Routing / Load Imbalance（专家负载不均）引发的通信热点与尾部掉队，并以 EP + Dual-Batch Overlap 掩盖 All-to-All 开销。',
        },
        {
          type: 'quiz',
          question:
            '思考题：为什么说 MoE 模型在“单用户本地电脑跑”时性价比不一定比小稠密模型高，但在“云端高并发 API 服务”中却能把每百万 Token 价格打成白菜价？',
          answer:
            '本地单用户跑 MoE，你要买得起超大显存去装下全部几百 B 参数，但每次只激活一小部分，硬件显存严重浪费；而在云端高并发下，海量用户的请求被拼成大 Batch，每个专家都被喂饱，显存成本被无数并发摊薄，极低的单 Token 计算量直接转化为断层领先的商业低价。',
        },
      ],
    },
    {
      id: '5.7',
      title: '5.7 科学压测军规、推理引擎横评与 Triton / TileLang 算子初体验',
      isCore: true,
      readTime: '7 分钟',
      tags: ['核心主线', '科学压测', 'vLLM / SGLang', 'Triton', 'TileLang', 'CUTLASS'],
      goal: '守住工业界科学压测四大铁律，看懂 vLLM/SGLang/TRT-LLM 选型逻辑，掌握 Triton 与 TileLang 算子融合入门路径。',
      blocks: [
        { type: 'heading', text: '核心直觉' },
        {
          type: 'paragraph',
          text: '外行测出来的“大模型测速报告”发到群里一秒就被资深工程师挑出 3 个硬伤：没预热、没同步异步计时、只报平均延迟掩盖 P99 灾难。掌握科学压测军规，再用几十行类 Python 语法的 OpenAI Triton（或新一代跨平台算子语言 TileLang）亲手体验算子融合提速，你就真正拿到了推理系统的硬核入场券！',
        },
        { type: 'heading', text: '底层机制拆解' },
        {
          type: 'list',
          ordered: true,
          items: [
            {
              lead: '科学压测四大铁律：',
              body: '① 强制 Warmup（预热 3~5 轮剔除冷启动与 JIT 编译）；② 异步精准计时（必须用 `torch.cuda.synchronize()` 或 `torch.cuda.Event`，直接 `time.time()` 测出的是假时间）；③ 锁死输出长度（`--ignore-eos` 防止提前吐结束符虚高速度）；④ 死盯 P95/P99 长尾延迟与 SLO 红线下的有效吞吐（Goodput）。',
            },
            {
              lead: '三大推理引擎与压测套件：',
              body: 'vLLM（通用霸主，内置 `vllm bench`）、SGLang（RadixAttention 基数树极致前缀复用，多轮对话/Agent 极猛）、TensorRT-LLM（英伟达官方性能标杆）；搭配阿里 `EvalScope` 或英伟达 `GenAI-Perf` 一键输出标准化 P50/P99 报表。',
            },
            {
              lead: '算子融合进阶阶梯：',
              body: '入门用 **OpenAI Triton**（30 行类 Python 代码按数据块写 Fused RMSNorm/Softmax，砍掉 60%~75% HBM 读写）；进阶了解 **TileLang**（新兴异构块级算子语言，同时支持 GPU 与国产 NPU）与 **CUTLASS / CuTe**（英伟达官方开源矩阵乘模板库，理解 Tensor Core 硬件分块圣经）。',
            },
          ],
        },
        {
          type: 'table',
          title: '核心对比表 · 新手踩坑 vs 大厂科学实战标准',
          headers: ['实战维度', '新手常见踩坑做法', '大厂级科学实战标准'],
          rows: [
            ['GPU 计时方式', '直接用 Python `time.time()` 包裹推理', '`torch.cuda.Event(enable_timing=True)` + `synchronize()`'],
            ['冷启动干扰', '把第 1 次请求耗时算进平均成绩', '先空跑 3~5 次 Warmup 预热，正式压测再采样'],
            ['延迟汇报口径', '只报单一平均延迟（Mean）', '必报 TTFT/TPOT 的 P50/P95/P99 + 帕累托曲线与 Goodput'],
            ['算子融合实战', '死磕上千行 CUDA C++ 共享内存冲突', '用 Triton / TileLang 写融合算子，进阶读 CUTLASS 模板'],
          ],
        },
        {
          type: 'callout',
          variant: 'engineer',
          title: '高频压测与简历项目配方',
          copyText: `vllm serve Qwen/Qwen2.5-7B-Instruct --max-model-len 8192\nvllm bench serve --model Qwen/Qwen2.5-7B-Instruct --num-prompts 100 --max-concurrency 16`,
          content:
            '1. 启动服务：`vllm serve Qwen/Qwen2.5-7B-Instruct --max-model-len 8192`\n2. 并发压测：`vllm bench serve --model Qwen/Qwen2.5-7B-Instruct --num-prompts 100 --max-concurrency 16`\n3. 镇站文章：同卡对比 vLLM vs SGLang 多轮对话（Prefix Caching / RadixAttention 命中场景）P99 延迟，再用 AI 带着写 30 行 Triton Fused Softmax 测有效带宽提升！\n核心工程表达：工程化推理简历项目的黄金验证闭环是在可控 SLO 下对照 vLLM / SGLang 的 Prefix Caching 命中率、TTFT/TPOT 帕累托曲线与自定义融合算子收益。',
        },
        {
          type: 'quiz',
          question:
            '思考题：为什么在对比 vLLM 和 SGLang 时，换成“多轮长对话或 Agent 工具调用”场景，前缀缓存（Prefix Caching / RadixAttention）的威力会瞬间爆发？',
          answer:
            '多轮对话和 Agent 每次请求都带着极长的公共 System Prompt 与历史对话前缀。RadixAttention 用基数树自动复用已算好的历史 KV Cache，砍掉了绝大部分重复 Prefill 计算，让 TTFT 断崖式下降。',
        },
      ],
    },
    {
      id: '5.8',
      title: '5.8 2026 最前沿论题与新卡点全景（Agentic KV I/O 墙 / AFD / RL Rollout / MXFP4 / NSA）',
      isCore: true,
      readTime: '8 分钟',
      tags: ['核心主线', '2026 前沿', 'Agentic KV', 'AFD', 'RL Rollout', 'MXFP4', 'NSA'],
      goal: '建立 2025–2026 工业界一线真实系统瓶颈视野，面试时从入门级 KV/PD 一跃升级到 Agentic I/O 墙与 Rollout 长尾攻坚。',
      blocks: [
        { type: 'heading', text: '核心直觉' },
        {
          type: 'paragraph',
          text: '基础的“单机防 OOM”和“Prefill vs Decode”已经是 2024 年的入门常识。到了 2026 年的真实大厂一线，随着多轮 Agent、深度思考（Test-Time Compute）、超大规模 MoE 和百万上下文全面落地，系统卡点已经从单卡显存转移到了「外部存储 I/O 墙」「分离架构边界税」「RL 采样长尾」与「4 比特反量化开销」六大新战场！',
        },
        { type: 'heading', text: '底层机制拆解' },
        {
          type: 'list',
          ordered: true,
          items: [
            {
              lead: '① KV Cache 全链路演进与「Agentic 存储 I/O 墙」：',
              body: 'KV 优化已走过 PagedAttention → GQA → MLA → RadixAttention → FP8 KV 量化（默认标配）→ 分布式分级卸载（用 Mooncake / LMCache / NVIDIA NIXL 把冷 KV 卸到 DRAM/SSD 池）。新卡点：多轮 Agent 前缀命中率超 90% 后，从外部 SSD/DRAM 池疯狂往 GPU 拉取历史 KV 的网卡/存储 I/O 带宽成了新瓶颈，顶级 GPU 功耗只吃到 25% 就在干等数据！',
            },
            {
              lead: '② 分离式推理深化（PD 分离 & AFD）的「边界税」：',
              body: '将算力密集的 FFN/专家与显存密集的 Attention 进一步拆开（AFD）。新卡点：跨机搬运激活值/KV 的边界税（Boundary Tax）加重，且流量剧烈波动时死板硬件配比会导致“P 池挤爆、D 池昂贵显卡闲置吃灰”的算力搁浅（Stranded Capacity）。',
            },
            {
              lead: '③ 推理时扩展与 RL 后训练的「Rollout 长尾卡点」：',
              body: '在 RLVR / GRPO 等后训练中，70% 以上时间花在 Rollout（模型并发生成海量长思维链）。新卡点：回答长度极度不均（300 字 vs 2 万字）引发严重长尾木桶效应，加上推理引擎与训练引擎频繁倒腾权重气泡，是目前 AI Infra 最值钱的攻坚区。',
            },
            {
              lead: '④ 超大规模 MoE 与机柜级扩展（Scale-Up）：',
              body: 'NVL72 等机柜级超节点把 72 张卡连成共享内存域跑大规模 EP，并配合 DualPipe 双向流水线重叠。新卡点：All-to-All 通信墙、热门专家负载不均与单卡超 1000W 液冷供电极限。',
            },
            {
              lead: '⑤ 硬件原生 4 比特（MXFP4 / NVFP4）与百万上下文稀疏突围（NSA / 混合架构）：',
              body: '每 16/32 个数配独立微缩放因子压制离群值，并用原生稀疏注意力（NSA）与线性注意力混合架构突破 O(N²) 魔咒。新卡点：未融合时的反量化指令开销（Dequantization Overhead）与稀疏不规则跳读导致的硬件利用率暴跌（必须靠块级稀疏 Block-Sparse 配合 Triton/TileLang 定制算子）。',
            },
          ],
        },
        {
          type: 'table',
          title: '核心对比表 · 2026 前沿论题与一线真实新卡点',
          headers: ['2026 前沿论题', '代表技术 / 开源组件', '2026 一线真实新卡点', '破局优化方向'],
          rows: [
            ['Agentic KV 池化', 'FP8 KV、Mooncake、LMCache、NIXL', '外部存储 I/O 墙（GPU 干等拉取历史 KV）', '分层异步预取、高带宽 RDMA 存储直连'],
            ['PD 分离 / AFD', 'Mooncake、Dynamo、分离式推理', '跨机边界税 & 流量波动引发算力搁浅', '软件动态切换节点角色，按需弹性重配'],
            ['Test-Time & RL 后训练', 'RLVR、GRPO、Long CoT、verl', 'Rollout 70% 耗时 + 长尾木桶 + 权重同步', '异步解耦 Rollout、分片权重极速广播'],
            ['大规模 MoE 机柜扩展', 'Large-Scale EP、NVL72、DualPipe', 'All-to-All 通信墙 + 专家热点 + 液冷墙', '机柜内 Scale-Up 锁域 + 动态冗余专家副本'],
            ['超低比特 & 百万上下文', 'MXFP4/NVFP4、NSA、Mamba 混合', '反量化指令开销 + 稀疏不规则访存掉速', '硬件原生 FP4 融合 + 块级硬件感知稀疏算子'],
          ],
        },
        {
          type: 'callout',
          variant: 'engineer',
          title: '面试降维打击话术',
          content:
            '当面试官问“你平时怎么看 KV Cache 或大模型推理瓶颈？”时，先答基础的「PagedAttention + Prefill/Decode 冲突」，再顺手补一句：“而在 2026 年多轮 Agent 和 RL 后训练场景下，瓶颈已经进一步漂移到了外部 KV 池化的 Storage I/O 墙，以及 RL Rollout 的长尾木桶效应”——瞬间展现远超本科生的工业界一线视野！\n核心工程表达：面向长程 Agent 与 RL Rollout 的前沿系统演进核心在于解决 KVCache Offloading（HBM -> Host/NVMe）的 Storage I/O 吞吐瓶颈与异构长尾步长同步。',
        },
        {
          type: 'quiz',
          question:
            '思考题：为什么原生稀疏注意力（NSA）虽然在数学上砍掉了 80% 的计算量，但如果直接按“细粒度随机稀疏”写代码，在 GPU 上反而可能比稠密矩阵跑得更慢？',
          answer:
            'GPU 的 SIMT 线程束和 Tensor Core 矩阵阵列极度依赖“连续整齐的内存合并访问（Coalesced Memory Access）”。细粒度随机稀疏会导致严重的跳跃不规则访存（Irregular Memory Access）和分支发散，Cache 疯狂 Miss；必须设计成硬件友好的块级稀疏（Block-Sparse，比如以 64×64 为最小跳过单位）并配合 Triton/TileLang 定制算子，才能把理论加速变成真实加速。',
        },
      ],
    },
  ],
};
