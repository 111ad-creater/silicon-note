export const module7 = {
  id: 'module-7',
  number: '07',
  title: '模块七：多卡互连与万卡集群',
  perspectiveTag: '分布式系统视角',
  shortDesc: '从单芯片迈向 AI 智算中心：看懂卡间高速公路、集合通信原语、5D 并行分工逻辑与万卡集群的容错难题。',
  accent: 'sky',
  lessons: [
    {
      id: '7.1',
      title: '7.1 芯片间的高速公路（PCIe / NVLink / IB / RoCE）',
      isCore: false,
      readTime: '6 分钟',
      tags: ['NVLink', 'InfiniBand', 'RoCE', 'PCIe'],
      goal: '对比板内、机内与跨机柜互连带宽的十倍级差，知道什么切分必须留在 NVLink 域内。',
      blocks: [
        { type: 'heading', text: '核心直觉' },
        {
          type: 'paragraph',
          text: '单张 GPU 再强也有上限，跑千亿大模型必须把几百上千张卡连起来干活。这时候瓶颈就从“芯片内部的走廊（HBM 带宽）”转移到了“芯片之间的高速公路”：机箱里普通主板插槽（PCIe）像乡间双车道，英伟达专属的 NVLink 像机内 16 车道高架桥，而跨机柜的 InfiniBand（IB）与 RoCE 以太网则是连接不同大楼的城际高速。',
        },
        { type: 'heading', text: '底层机制拆解' },
        {
          type: 'list',
          ordered: true,
          items: [
            {
              lead: 'PCIe（通用主板总线）：',
              body: 'PCIe 5.0 x16 双向带宽约 128 GB/s，速度远低于 HBM，且多卡之间往往还要绕道 CPU 内存控制器，延迟高，只适合数据加载或轻度通信。',
            },
            {
              lead: 'NVLink 与 NVSwitch（机内/机柜级超高速域）：',
              body: 'H100 单卡 NVLink 双向带宽高达 900 GB/s（Blackwell NVL72 更是达到单卡 1.8 TB/s，把 72 张 GPU 连成一整张巨型虚拟大卡！），机内 8 张卡通过 NVSwitch 芯片实现全互连、零阻塞通信。',
            },
            {
              lead: '跨机网络（InfiniBand vs RoCE v2）：',
              body: '走出机箱后，单卡配一张 400Gbps（50 GB/s）甚至 800Gbps 的网卡，采用 RDMA（远程直接内存访问）技术——数据不经过对方 CPU 和操作系统，直接从 A 卡显存飞进 B 卡显存。IB 极稳但贵且封闭，RoCE 基于开放以太网更便宜但需要极强的拥塞控制调优。',
            },
          ],
        },
        {
          type: 'table',
          title: '核心对比表 · 互连层级带宽规格',
          headers: ['互连层级', '代表技术', '典型单卡双向带宽', '生活类比与适用并行'],
          rows: [
            ['芯片内显存', 'HBM3 / HBM3e', '3,350 ~ 8,000 GB/s', '车间内部传送带（单卡极限）'],
            ['机内/机柜内', 'NVLink 4 / 5 + NVSwitch', '900 ~ 1,800 GB/s', '厂区 16 车道高架（最适合张量并行 TP）'],
            ['主板通用总线', 'PCIe Gen5 x16', '128 GB/s', '厂区普通双车道（CPU-GPU 数据搬运）'],
            ['跨机集群网络', 'InfiniBand / RoCE 400G~800G', '100 ~ 200 GB/s（单卡）', '城际高速（适合数据并行 DP / 流水线 PP）'],
          ],
        },
        {
          type: 'callout',
          variant: 'engineer',
          title: '性能工程师“算账”视角',
          content:
            '记住分布式 AI 系统的黄金铁律：**“把通信最频繁的切分（如张量并行 TP）死死锁在 NVLink 高速域内部；跨机慢速网络（IB/RoCE）只留给通信稀疏的并行（如流水线并行 PP 和数据并行 DP）！”** 一旦把 TP 跨过慢速网卡，性能直接雪崩。',
        },
        {
          type: 'quiz',
          question:
            '思考题：为什么英伟达 Blackwell GB200 NVL72 机柜哪怕把液冷和铜缆做到极致，也要硬把 72 张 GPU 全部用 NVLink 连在同一个域里？',
          answer:
            '为了打破传统“单机 8 卡 NVLink 上限”。对于 DeepSeek 或万亿参数级 MoE 模型，需要极大范围的专家并行（EP）和张量并行（TP），72 卡全 NVLink 互连让高频的 All-to-All 与 AllReduce 通信带宽飙升近 10 倍，推理吐字速度和吞吐瞬间实现跨代飞跃。',
        },
      ],
    },
    {
      id: '7.2',
      title: '7.2 集合通信直觉（AllReduce / AllToAll 等）',
      isCore: false,
      readTime: '6 分钟',
      tags: ['AllReduce', 'AllGather', 'ReduceScatter', 'All-to-All'],
      goal: '用“开会汇总答案”和“分组发快递”的动画思维，区分 AllReduce、AllGather、ReduceScatter 与 AllToAll。',
      blocks: [
        { type: 'heading', text: '核心直觉' },
        {
          type: 'paragraph',
          text: '多张 GPU 一起干活，总得定期碰头对账。在底层通信库（如 NCCL）里，大家对账不是乱七八糟一对一私聊，而是有 4 套标准化的“开会队形”，叫集合通信（Collective Communication）：比如所有人把成绩加总后每人发一份最终总分（AllReduce），或者 8 个专家互相交换手里分错诊的病人（All-to-All）。',
        },
        { type: 'heading', text: '底层机制拆解' },
        {
          type: 'list',
          ordered: true,
          items: [
            {
              lead: 'AllReduce（全规约）：',
              body: '每张卡手里都有一份局部梯度或部分矩阵乘结果，通过环形（Ring）或树形（Tree）接力把所有卡的数值求和，并让每张卡都拿到完全相同的最终总和。它是数据并行（DP）和张量并行（TP）的核心。',
            },
            {
              lead: 'ReduceScatter + AllGather（把 AllReduce 拆成两半）：',
              body: 'ZeRO 和 FSDP 的灵魂！ReduceScatter 先求和并把结果切成 N 份各拿一份（省显存）；需要完整权重时再用 AllGather 把大家手里的小碎片拼回完整版。',
            },
            {
              lead: 'All-to-All（全对全交换）：',
              body: 'MoE（混合专家）模型的核心痛点！每张卡上都有一些 Token 需要发给其他 7 张卡上的不同专家处理，所有人同时给所有人发不同的包裹，网络极易发生多对一拥塞（Incast）。',
            },
          ],
        },
        {
          type: 'table',
          title: '核心对比表 · 四大集合通信原语',
          headers: ['通信原语', '通俗画面', '典型使用场景', '网络压力特征'],
          rows: [
            ['AllReduce', '全班报数求和，每人记下总和', 'DDP 梯度同步、TP 每层结果合并', '通信量大且极其频繁（极吃带宽）'],
            ['AllGather', '每人拿一块拼图，最后人人都有全图', 'ZeRO-3 / FSDP 收集权重、序列并行', '单向广播聚合，易做异步预取'],
            ['ReduceScatter', '全班求和，但每人只领回自己的 1/N', 'ZeRO-2/3 梯度切分、序列并行', '与 AllGather 配对替代 AllReduce'],
            ['All-to-All', '所有人互相给所有人发专属快递', 'MoE 模型的专家并行（EP）路由', '点对点动态乱序，极易引发网络拥塞'],
          ],
        },
        {
          type: 'callout',
          variant: 'engineer',
          title: '性能工程师“算账”视角',
          content:
            '在 Ring-AllReduce 算法里有一个极其优美的数学结论：当卡数 N 很大时，每张卡的通信数据量收敛于大约 2 倍数据体积，**与总卡数 N 无关**！这意味着只要网卡带宽够宽、网络不拥塞，AllReduce 理论上可以扩展到上千张卡而不崩溃。',
        },
        {
          type: 'quiz',
          question:
            '思考题：为什么说 MoE 模型的 All-to-All 通信比普通稠密模型的 AllReduce 难优化得多？',
          answer:
            'AllReduce 的数据量是完全均匀、静态可预测的，硬件可以用极其成熟的环形/树形拓扑跑满带宽；而 All-to-All 的数据流向取决于每个 Token 动态路由到了哪个专家，如果大量 Token 同时涌向某一张卡的热门专家，会导致该卡网卡严重拥塞（Incast），拖慢整个集群。',
        },
      ],
    },
    {
      id: '7.3',
      title: '7.3 5D 并行策略全景图（DP / TP / PP / CP / EP）',
      isCore: false,
      readTime: '6 分钟',
      tags: ['5D 并行', 'DP/TP/PP', 'CP/EP', 'Megatron'],
      goal: '掌握数据、张量、流水线、上下文与专家五维并行的切分对象、显存收益与各自通信代价。',
      blocks: [
        { type: 'heading', text: '核心直觉' },
        {
          type: 'paragraph',
          text: '面对一个几千亿参数、上下文长达 10 万字的超级大模型，单卡根本装不下，必须把模型和数据像切蛋糕一样沿着 5 个维度切开分给几千张卡：按作业本份数切（DP）、把一道大题横竖掰开一起算（TP）、按楼层接力流水线传下去（PP）、把超长文章撕成几段一起读（CP）、把几百个专科专家分到不同诊室（EP）。',
        },
        { type: 'heading', text: '底层机制拆解' },
        {
          type: 'list',
          ordered: true,
          items: [
            {
              lead: 'DP（数据并行）：',
              body: '每张卡放同一个模型，各自看不同的训练数据，最后同步梯度。最简单，但单卡装不下大模型。',
            },
            {
              lead: 'TP（张量并行，Megatron 核心）：',
              body: '把单个巨大矩阵乘法横着/竖着劈成 8 份，8 张卡同时算同一层，算完每层立刻做 AllReduce 汇总。通信极其频繁，必须严格限制在单机 8 卡（或 NVL72）NVLink 内！',
            },
            {
              lead: 'PP（流水线并行）：',
              body: '把 80 层大模型切成 4 段（1~20 层在机 1，21~40 层在机 2……），像工厂流水线一样逐段传递激活值。通信量极小（适合跨机），但容易出现开头和结尾的“流水线气泡（Bubble，卡在干等）”，需要切分微批次（Micro-batch）来填平。',
            },
            {
              lead: 'CP（上下文并行）与 EP（专家并行）：',
              body: 'CP 专治 10 万字超长文本（如 Ring Attention，把长序列切到多卡分摊激活值显存）；EP 专治 MoE 模型（不同卡存放不同专家子网络，靠 All-to-All 路由）。',
            },
          ],
        },
        {
          type: 'table',
          title: '核心对比表 · 5D 分布式并行策略',
          headers: ['并行维度', '切分对象', '通信原语与频率', '最佳部署范围'],
          rows: [
            ['DP（数据并行）', '切分输入数据 Batch', 'AllReduce/RS+AG（每步 1 次）', '跨机大集群（最易扩展）'],
            ['TP（张量并行）', '切分单层权重矩阵', 'AllReduce（每层 2 次，极高频）', '严格锁死在机内 NVLink 高速域'],
            ['PP（流水线并行）', '按模型层数切段', '点对点 Send/Recv（极低频）', '跨机柜低带宽网络'],
            ['CP（上下文并行）', '切分超长 Token 序列', 'Ring P2P 传 KV 块', '长文本训练（32K~1M 上下文）'],
            ['EP（专家并行）', '切分 MoE 的多个专家', 'All-to-All（每 MoE 层 2 次）', '高带宽 NVLink 或顶级 RDMA 集群'],
          ],
        },
        {
          type: 'callout',
          variant: 'engineer',
          title: '性能工程师“算账”视角',
          content:
            '在大厂做万卡训练或大规模推理架构选型时，最值钱的本事就是“配比 5D 并行组合”（比如 TP=8, PP=4, DP=32, EP=16）。配得好 MFU 高达 50%+，配错了光通信和流水线气泡就能吃掉一半预算。',
        },
        {
          type: 'quiz',
          question:
            '思考题：为什么在单机 8 卡部署 70B 模型做在线低延迟推理时，大家通常首选“TP=8（张量并行）”而不是“PP=8（流水线并行）”？',
          answer:
            'TP=8 让 8 张卡同时发力一起算每一个 Token，直接聚合了 8 张卡的 HBM 带宽和算力，能大幅压低单请求的延迟（TTFT 和 TPOT）；而 PP=8 是 8 张卡串行接力，对于单个请求来说，同一时刻只有 1 张卡在干活，延迟不仅没降反而因为卡间传递变慢了！',
        },
      ],
    },
    {
      id: '7.4',
      title: '7.4 通信与计算重叠（Overlap）',
      isCore: false,
      readTime: '6 分钟',
      tags: ['Overlap', 'CUDA Stream', 'DualPipe', 'NCCL'],
      goal: '理解计算流与 NCCL 通信流如何双线并行，把跨卡同步时间隐藏在矩阵计算影子里。',
      blocks: [
        { type: 'heading', text: '核心直觉' },
        {
          type: 'paragraph',
          text: '想象你开了家奶茶店，只有 1 个摇奶茶的厨师（计算引擎）和 1 个跑腿外卖员（通信引擎）。最蠢的做法是：厨师摇完 100 杯奶茶，停手干坐着等外卖员送完回来，再摇下一批（串行）。聪明的做法叫“Overlap（重叠）”：厨师刚摇完第 1 杯，外卖员立刻拿去送，厨师马不停蹄接着摇第 2 杯——只要送外卖比摇奶茶快，送外卖的时间就彻底“消失”了！',
        },
        { type: 'heading', text: '底层机制拆解' },
        {
          type: 'list',
          ordered: true,
          items: [
            {
              lead: '多流异步执行（CUDA Streams）：',
              body: 'GPU 内部的计算引擎（Tensor Core）和通信引擎（DMA / NVLink Copy Engine）在硬件上是分开的。只要把计算任务和通信任务放进不同的 CUDA Stream，它们就能真正物理并行！',
            },
            {
              lead: '典型重叠案例 1（反向传播梯度同步）：',
              body: '不用等 80 层全部反向算完再统一做 AllReduce！刚算完第 80 层的梯度，立刻扔给后台通信流去同步，同时 Tensor Core 继续往前算第 79 层。',
            },
            {
              lead: '典型重叠案例 2（DeepSeek DualPipe / 双微批次重叠）：',
              body: '在 MoE 推理和训练中，把一个 Batch 劈成 A、B 两半——当 A 半在做漫长的跨机 All-to-All 通信时，GPU 正在全力算 B 半的 Attention 和共享专家，把原本占 30% 以上的通信延迟几乎压缩到零！',
            },
          ],
        },
        {
          type: 'table',
          title: '核心对比表 · 串行执行 vs 完全重叠',
          headers: ['执行模式', '总耗时公式', 'GPU 时间轴画面', '性能表现'],
          rows: [
            ['串行执行（无 Overlap）', '计算耗时 + 通信耗时', '算一块、停下来传一块，满屏绿色/蓝色交替', '通信越重，算力利用率掉得越惨'],
            ['完全重叠（Ideal Overlap）', 'max(计算耗时, 通信耗时)', '计算轨道与通信轨道上下严丝合缝并行铺满', '通信耗时被完全隐藏，逼近理论极限'],
          ],
        },
        {
          type: 'callout',
          variant: 'engineer',
          title: '性能工程师“算账”视角',
          content:
            '注意一个隐蔽的底层陷阱：NCCL 的通信 Kernel 默认也会占用几个 GPU 的 SM 车间来搬运数据！如果通信抢了太多 SM，虽然看起来“重叠”了，但计算引擎变慢了。因此现代框架（如 DeepSeek 定制通信内核）会精确限制通信只占极少数 SM，甚至用纯硬件 DMA 引擎来消除争抢。',
        },
        {
          type: 'quiz',
          question:
            '思考题：如果在 Nsight Systems 时间轴上看到“计算流”和“NCCL 通信流”明明分在了两条轨道上，却依然像接力赛一样一前一后排着队没有重叠，最可能的原因是什么？',
          answer:
            '最常见原因有三个：1）代码里不小心插入了全局同步锁（如 `torch.cuda.synchronize()` 或把张量 `.item()` 打印到 CPU）；2）后一个计算任务和通信任务存在数据依赖没拆开微批次；3）框架默认把它们提交到了同一个默认 CUDA Stream。',
        },
      ],
    },
    {
      id: '7.5',
      title: '7.5 万卡集群的真实噩梦（慢节点与容错）',
      isCore: false,
      readTime: '6 分钟',
      tags: ['万卡集群', 'Straggler', 'SDC', '异步 Checkpoint'],
      goal: '算懂万卡规模下硬件 MTBF 故障率、单节点降频拖垮全体的木桶效应与 Checkpoint 秒级恢复思路。',
      blocks: [
        { type: 'heading', text: '核心直觉' },
        {
          type: 'paragraph',
          text: '在自己电脑上跑 1 张卡，一年可能都不会坏一次；但把 10,000 张 700W 的 GPU、几万根光模块和几千台服务器绑在一起跑大模型训练，按照概率论，**平均每隔几个小时就会有某个零件出故障**！在万卡规模下，硬件故障不再是“意外”，而是每天都要面对的日常。',
        },
        { type: 'heading', text: '底层机制拆解' },
        {
          type: 'list',
          ordered: true,
          items: [
            {
              lead: '慢节点（Straggler）木桶效应：',
              body: '因为多卡训练每一步都要做全局 AllReduce 同步，只要 10,000 张卡里有一张卡因为散热膏干了触发降频（或者一根网线接触不良疯狂重传），剩下的 **9,999 张顶级 GPU 全部都要原地罚站等它**，几百万美金一天的算力瞬间打折！',
            },
            {
              lead: '静默数据损坏（Silent Data Corruption, SDC）：',
              body: '最恐怖的幽灵故障！芯片没有死机也没报错，但因为宇宙射线或晶体管老化，某个乘法算错了一位数字，导致训练到第 20 天时 Loss 莫名其妙发散崩盘，极其难以定位。',
            },
            {
              lead: '异步 Checkpoint 与秒级自愈：',
              body: '为了防止坏一张卡导致几天的训练白费，大厂必须把动辄 TB 级的权重异步存盘（先秒级拷贝到本机 CPU 内存，GPU 继续训，后台慢慢写进分布式存储）；一旦监控抓到坏卡，调度系统自动踢掉坏机、拉起热备节点，几分钟内恢复续训。',
            },
          ],
        },
        {
          type: 'table',
          title: '核心对比表 · 万卡集群典型故障与应对',
          headers: ['万卡集群典型噩梦', '核心现象', '工业界标准应对手段'],
          rows: [
            ['硬故障（掉卡 / 光模块挂）', 'NCCL 通信超时报错，整个训练任务崩溃', '热备节点自动替换 + 异步 Checkpoint 分钟级断点续训'],
            ['慢节点（Straggler）', '不报错，但每步耗时莫名变长、全员等 1 卡', '实时监控单卡温度/频率/通信延迟，自动隔离踢出降频卡'],
            ['静默出错（SDC）', '不死机，但 Loss 异常尖刺或梯度变 NaN', '定期运行轻量硬件自检算子 + 梯度异常自动回滚检查点'],
          ],
        },
        {
          type: 'callout',
          variant: 'engineer',
          title: '性能工程师“算账”视角',
          content:
            '衡量一座万卡智算中心真正实力的核心指标叫 **有效训练时间占比（Goodput / ETTR）**。哪怕单卡 MFU 调到了 55%，如果集群三天两头掉卡重启、每次存盘卡半小时，算下来的总有效产出依然惨不忍睹。',
        },
        {
          type: 'quiz',
          question:
            '思考题：为什么大厂在万卡训练存 Checkpoint（存盘）时，一定要采用“异步存盘（先存 CPU 内存再慢慢落盘）”，而不是直接让 GPU 写到硬盘里？',
          answer:
            '一个千亿模型的完整 Checkpoint（含优化器状态）动辄数 TB。直接写共享网络硬盘可能要耗时十几分钟，如果让 10,000 张昂贵的 GPU 全部停下来干等硬盘写入，算力浪费极其惊人；而 GPU 到本机 CPU 内存走 PCIe 只需几秒就能拷完，拷完 GPU 立刻继续训练。',
        },
      ],
    },
  ],
};
