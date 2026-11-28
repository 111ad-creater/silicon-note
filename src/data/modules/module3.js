export const module3 = {
  id: 'module-3',
  number: '03',
  title: '模块三：数值表示与性能算账底座',
  perspectiveTag: '性能建模视角',
  shortDesc: '掌握性能工程师最值钱的“纸面算账能力”：看懂低精度量化与 Roofline 模型，5 分钟算出任意模型的物理极限。',
  accent: 'sky',
  lessons: [
    {
      id: '3.1',
      title: '3.1 计算机里的“小数”（IEEE 754 结构）',
      isCore: false,
      readTime: '5 分钟',
      tags: ['IEEE 754', 'FP32', '指数位', '尾数位'],
      goal: '拆解符号位、指数位（决定动态范围）与尾数位（决定精度），彻底告别浮点数黑盒。',
      blocks: [
        { type: 'heading', text: '核心直觉' },
        {
          type: 'paragraph',
          text: '计算机里没有真正连续的小数，工业界普遍采用 IEEE 754（Sign / Exponent / Mantissa）科学计数法标准存储浮点数，把一串比特切为三段：1 位符号位（Sign）决定正负方向，指数位（Exponent）决定数值上下限跨度（动态范围），尾数位（Mantissa）决定小数刻度精细度（分辨率）；若数值超出指数表征上限就会 Overflow（上溢成 Inf/NaN），小于最小非规格化下限则会 Underflow（下溢归零）。',
        },
        { type: 'heading', text: '底层机制拆解' },
        {
          type: 'list',
          ordered: true,
          items: [
            {
              lead: '标准单精度 FP32（32 bit）：',
              body: '1 位符号 + 8 位指数 + 23 位尾数。它就像一把又长（范围达 10^±38）刻度又极细（约 7 位有效数字）的游标卡尺，科学计算最爱用，但在 AI 芯片里太占面积、太吃带宽。',
            },
            {
              lead: '动态范围 vs 精度权衡：',
              body: '在总比特数固定（比如 16 bit）的情况下，分给指数的位数越多，能装下的最大/最小数越广，越不容易溢出（Overflow/Underflow）；分给尾数的位数越多，相邻两个数之间的台阶越细密。',
            },
            {
              lead: '硬件面积平方级收益：',
              body: '乘法器的硬件电路面积大致与尾数位宽的平方成正比！把尾数砍短一半，乘法器面积直接缩水成原来的四分之一，同一块芯片能塞进多得多的计算核心。',
            },
          ],
        },
        {
          type: 'table',
          title: '核心对比表 · 浮点数三大组成部分',
          headers: ['组成部分', '科学计数法对应', '核心决定什么', '位数不够会怎样'],
          rows: [
            ['符号位（S）', '正负号（+/-）', '数值的正负方向', '只能表示非负数'],
            ['指数位（E）', '10 的多少次方（2^E）', '动态范围（最大/最小极限）', '训练时极易梯度溢出（NaN）或下溢归零'],
            ['尾数位（M）', '小数点后的有效数字', '数值精细度（分辨率）', '四舍五入误差变大，模型出现精度损失'],
          ],
        },
        {
          type: 'callout',
          variant: 'engineer',
          title: '性能工程师“算账”视角',
          content:
            '理解 IEEE 754（Sign / Exponent / Mantissa）与 Dynamic Range vs Precision（动态范围与精度权衡）是看懂所有 AI 低精度格式的钥匙。神经网络天生对轻微的舍入噪声不敏感（尾数可以很短），但极其害怕 Overflow / Underflow（上下溢）导致梯度归零或变成 NaN（指数位不能太短）。\n核心工程表达：AI 数值格式设计的核心是平衡 Dynamic Range vs Precision（动态范围与精度），优先保证指数位宽度以规避训练/推理中的 Overflow / Underflow（上下溢）。',
        },
        {
          type: 'quiz',
          question:
            '思考题：为什么把数据从 FP32 降到 FP16，不仅显存占用减半，芯片的理论峰值算力往往能翻 4 倍甚至 8 倍？',
          answer:
            '显存减半是线性收益（32 bit -> 16 bit）；但硬件乘法器的逻辑门数量与尾数位宽呈近似平方关系（FP32 尾数 23 位，FP16 仅 10 位），电路面积和功耗暴跌，使芯片能在同等面积下堆叠多得多的低精度乘加单元。',
        },
      ],
    },
    {
      id: '3.2',
      title: '3.2 AI 专用低精度家族（FP16 / BF16 / FP8 / FP4）',
      isCore: false,
      readTime: '6 分钟',
      tags: ['BF16', 'FP8', 'MXFP4', '低精度计算'],
      goal: '明白为什么训练爱用 BF16、推理爱冲 FP8/FP4：在“不溢出”和“搬运减半”之间找最优解。',
      blocks: [
        { type: 'heading', text: '核心直觉' },
        {
          type: 'paragraph',
          text: 'AI 芯片进化史就是一部“给小数点瘦身”的历史：FP16 刻度细但量程窄，训练容易爆表；Google 发明的 BF16 干脆保留 FP32 的超大指数、猛砍尾数，成了大模型训练之王；如今 H100/B200 更是卷到了 8 比特的 FP8 甚至 4 比特的 FP4/MXFP4。',
        },
        { type: 'heading', text: '底层机制拆解' },
        {
          type: 'list',
          ordered: true,
          items: [
            {
              lead: 'BF16（Brain Float 16）：',
              body: '1 符号 + 8 指数 + 7 尾数。它和 FP32 拥有完全相同的动态范围，大模型训练时直接替代 FP16，几乎不再需要繁琐的 Loss Scaling（损失缩放）来防溢出。',
            },
            {
              lead: 'FP8 的双雄（E4M3 与 E5M2）：',
              body: '8 比特太捉襟见肘，所以干脆分成两种：前向传播和权重用 E4M3（4 位指数 3 位尾数，保精度）；反向传播求梯度用 E5M2（5 位指数 2 位尾数，保范围防溢出）。',
            },
            {
              lead: '微缩放格式（MXFP4 / NVFP4）：',
              body: '4 比特一共只有 16 种状态，直接用肯定崩。最新一代芯片（如 Blackwell）采用“分组共享缩放因子（Block Scaling）”——每 16 或 32 个 4-bit 小数共用一个高精度指数尺子，硬生生把 4 比特推向了可用边界。',
            },
          ],
        },
        {
          type: 'table',
          title: '核心对比表 · AI 数值精度家族',
          headers: ['精度格式', '位宽分配（S/E/M）', '核心优势', '主流应用场景'],
          rows: [
            ['FP32', '1 / 8 / 23', '高精度、大范围', '主权重备份、累加器、科学计算'],
            ['FP16', '1 / 5 / 10', '精度高于 BF16，范围窄', '推理加速、需 Loss Scaling 的训练'],
            ['BF16', '1 / 8 / 7', '与 FP32 同范围，不易溢出', '当前大模型训练与推理绝对主力'],
            ['FP8 (E4M3/E5M2)', '1/4/3 或 1/5/2', '带宽再减半，算力翻倍', 'H100/B200 高吞吐推理与前沿训练'],
            ['MXFP4 / NVFP4', '4-bit + 共享缩放因子', '极致压缩显存与带宽', '新一代芯片超大规模推理'],
          ],
        },
        {
          type: 'callout',
          variant: 'engineer',
          title: '性能工程师“算账”视角',
          content:
            '看到厂商宣传“单卡 10,000 TFLOPS”时，性能工程师的第一反应必须是追问：“这是 FP16、BF16 还是 FP8 (E4M3/E5M2) / MXFP4 精度下的？稠密还是 2:4 稀疏？”同样一块芯片，MXFP4 稀疏算力可以是 FP32 算力的几十倍，不标明精度、量化粒度（Block Scaling）与稀疏性谈算力纯属耍流氓。\n核心工程表达：硬件峰值算力评估必须显式绑定数值格式（BF16 / FP8 E4M3/E5M2 / MXFP4）及稀疏比，低比特演进通过压缩字节宽度同步实现算力翻倍与带宽减半。',
        },
        {
          type: 'quiz',
          question:
            '思考题：既然 FP16 的小数精度（10 位尾数）比 BF16（7 位尾数）更高，为什么现在大模型训练几乎一边倒地选 BF16？',
          answer:
            '大模型训练中梯度数值跨度极大。FP16 只有 5 位指数，最大数仅约 65504，极易溢出成 NaN 或下溢成 0，调参极痛苦；而神经网络对 7 位尾数的轻微噪声完全能容忍，BF16 凭借 8 位指数的超大范围让训练极其稳定。',
        },
      ],
    },
    {
      id: '3.3',
      title: '3.3 量化直觉与算法（SmoothQuant / AWQ / GPTQ）',
      isCore: false,
      readTime: '6 分钟',
      tags: ['量化', 'AWQ', 'GPTQ', 'SmoothQuant'],
      goal: '理解激活异常值（Outlier）为何会毁掉直接量化，以及 AWQ/SmoothQuant 如何保护关键权重通道。',
      blocks: [
        { type: 'heading', text: '核心直觉' },
        {
          type: 'paragraph',
          text: '量化就是把本来用高精度（BF16，16 位）存的数字，按比例映射到低精度整数或微浮点格子（如 W4A16、INT8 或 FP8）里。最大拦路虎叫 Activation Outliers（激活离群值）灾难：如果 99% 通道数值都在 1.6~1.8 区间，唯独几个通道混进 100 倍幅度的巨人，统一量化缩放因子会把正常数值全挤爆到 0 和 1 两个刻度里，瞬间毁掉模型精度。',
        },
        { type: 'heading', text: '底层机制拆解' },
        {
          type: 'list',
          ordered: true,
          items: [
            {
              lead: 'W4A16（仅权重量化，代表：GPTQ / AWQ）：',
              body: '权重（W）压成 4-bit 存显存，算的时候现场解压成 FP16 和激活值（A）相乘。专治带宽受限的 Decode 阶段，搬运量直接省 75%！其中 AWQ 发现只有 1% 的“显著权重通道”对智商最关键，通过保护这 1% 通道让 4-bit 模型几乎不掉点。',
            },
            {
              lead: 'W8A8（权重和激活都量化，代表：SmoothQuant）：',
              body: '激活值里的离群值最难搞，SmoothQuant 极其巧妙地做了一个等价数学变换——把激活值里“突出的大高个”除以一个系数削平，同时把对应的权重乘以同样系数拔高，把量化难度平滑转移到更好处理的权重上，从而顺利启用芯片的 INT8 Tensor Core。',
            },
            {
              lead: 'PTQ vs QAT：',
              body: '训练后量化（PTQ）拿现成模型用少量校准数据几分钟就能压完，最常用；量化感知训练（QAT）在训练时就模拟量化误差，精度最高但烧卡太贵。',
            },
          ],
        },
        {
          type: 'table',
          title: '核心对比表 · 主流量化方案对比',
          headers: ['量化方案', '权重/激活精度', '核心加速收益', '最适用场景'],
          rows: [
            ['GPTQ / AWQ', 'W4A16', '大幅减少权重显存与搬运（4x 省带宽）', '小 Batch / 端侧 Decode 推理'],
            ['SmoothQuant', 'W8A8', '带宽减半 + 激活 INT8 矩阵算力翻倍', '大 Batch 高并发服务与 Prefill'],
            ['FP8 量化', 'W8A8 (FP8)', '自带指数不怕离群值，几乎无损', 'H100/B200 等原生支持 FP8 的新卡'],
          ],
        },
        {
          type: 'callout',
          variant: 'engineer',
          title: '性能工程师“算账”视角',
          content:
            '量化不是“位数越低就一定越快”。在仅靠 W4A16 压榨权重的场景中，如果老卡缺乏原生 INT4 Tensor Core，现场反量化（Dequantize）成 FP16 会消耗额外指令周期：低并发 Decode（Memory-Bound）时它能靠减少 HBM 搬运大幅提速，但在大 Batch Prefill（Compute-Bound）时反而可能因为解压开销拖慢速度；新一代卡片上原生 FP8 (E4M3/E5M2) / MXFP4 则能兼顾 Activation Outliers（激活离群值）保护与硬件直算。\n核心工程表达：量化收益取决于硬件原生指令支持与瓶颈归属——W4A16 拯救 Memory-Bound 的低并发 Decode，而 FP8 / MXFP4 原生计算兼顾高吞吐 Prefill 与 Activation Outliers 稳定性。',
        },
        {
          type: 'quiz',
          question:
            '思考题：为什么 AWQ 这类 W4A16 量化方法，在单用户聊天时提速非常明显，但在同时处理几百个并发请求时提速幅度就变小了？',
          answer:
            '单用户聊天（Batch=1）是极度 Memory-Bound，速度完全取决于从 HBM 搬运权重有多快，W4 权重把搬运量砍掉 75%，速度立竿见影；而高并发大 Batch 时系统转向 Compute-Bound，瓶颈变成了 FP16 计算算力，W4A16 依然要用 FP16 算，甚至还多了反量化开销。',
        },
      ],
    },
    {
      id: '3.4',
      title: '3.4 算术强度与 Roofline 屋顶线模型',
      isCore: true,
      readTime: '6 分钟',
      tags: ['核心主线', 'Roofline', '算术强度', 'Ridge Point'],
      goal: '用“算术强度 = FLOPs ÷ Bytes”对比芯片脊点（Ridge Point），一秒判定算子撞算力墙还是内存墙。',
      blocks: [
        { type: 'heading', text: '核心直觉' },
        {
          type: 'paragraph',
          text: 'Roofline（屋顶线）模型是 AI 芯片性能分析的“心电图”。想象你在搬砖盖墙：你每搬 1 公斤砖头（Byte），能砌出多少次有效动作（FLOPs），这个比值叫“算术强度（Arithmetic Intensity）”。Roofline 图由两条线组成：一条斜坡代表“显存带宽上限”，一条平顶代表“芯片算力上限”。',
        },
        { type: 'heading', text: '底层机制拆解' },
        {
          type: 'list',
          ordered: true,
          items: [
            {
              lead: '算术强度公式：',
              body: 'AI = 总计算量（FLOPs） ÷ 总显存搬运量（Bytes），单位是 FLOPs/Byte。它完全由算法/算子本身决定，与芯片无关。',
            },
            {
              lead: '硬件拐点（Ridge Point）：',
              body: '芯片峰值算力 ÷ 芯片显存带宽。以 NVIDIA H100 为例，FP16 峰值算力约 989 TFLOPS，HBM3 带宽约 3.35 TB/s，拐点 = 989 / 3.35 ≈ 295 FLOPs/Byte。',
            },
            {
              lead: '一眼诊断瓶颈：',
              body: '把你的算子算术强度标在横轴上——如果小于 295（落在斜坡下），它是 Memory-Bound（内存墙受限，算力再强也白搭，必须减搬运或加 Batch）；如果大于 295（落在平顶下），它是 Compute-Bound（算力受限，芯片算力已吃满）。',
            },
          ],
        },
        {
          type: 'table',
          title: '核心对比表 · Roofline 屋顶线分区诊断',
          headers: ['Roofline 区域', '算术强度特征', '真实性能瓶颈', '典型大模型阶段', '正确优化方向'],
          rows: [
            ['斜坡区（左）', '低于硬件拐点（如 < 295）', '显存带宽（Memory-Bound）', 'Decode 逐字生成、Element-wise 算子', '增大 Batch、量化权重、算子融合、GQA/MLA'],
            ['平顶区（右）', '高于硬件拐点（如 > 295）', '计算算力（Compute-Bound）', 'Prefill 读题、大 Batch 训练 GEMM', '换低精度（FP8）、用 2:4 稀疏、换更强芯片'],
          ],
        },
        {
          type: 'callout',
          variant: 'engineer',
          title: '性能工程师“算账”视角',
          content:
            '注意一个残酷趋势：近十年 GPU 算力暴涨了几十倍，但 HBM 带宽只涨了几倍，导致芯片的 Ridge Point（硬件拐点 = 峰值算力 / 显存带宽）被拉得越来越高（从几十涨到几百 FLOPs/Byte）。这意味着绝大多数算子更容易掉进 Memory-Bound 斜坡区，必须靠升高 Arithmetic Intensity（算术强度，增大 Batch 或做算子融合）跨过 Ridge Point 进入 Compute-Bound 平顶区。\n核心工程表达：Roofline 分析的核心是将算子的 Arithmetic Intensity（算术强度）与芯片 Ridge Point（硬件拐点）比对，明确归属于 Compute-Bound vs Memory-Bound 再对症调优。',
        },
        {
          type: 'quiz',
          question:
            '思考题：在 H100（拐点约 295 FLOPs/Byte）上跑一个 FP16 的大模型 Decode（Batch Size = 1），每搬 2 字节权重只做 2 次乘加计算（算术强度 ≈ 1 FLOPs/Byte）。此时 H100 的算力利用率大约只有多少？',
          answer:
            '大约只有 1 / 295 ≈ 0.34%！也就是说，价值几十万的 H100 在单用户推理时，超过 99.6% 的顶级计算单元都在干坐着等数据搬运。这也是为什么工业界必须拼命做 Batching 来拉高算术强度。',
        },
      ],
    },
    {
      id: '3.5',
      title: '3.5 大模型“纸面算账”实战',
      isCore: true,
      readTime: '6 分钟',
      tags: ['核心主线', '纸面算账', '70B 估算', 'MBU'],
      goal: '仅凭模型参数量、显卡 TFLOPS 与 HBM 带宽，心算出 70B 模型显存占用与极限生成速度（tokens/s）。',
      blocks: [
        { type: 'heading', text: '核心直觉' },
        {
          type: 'paragraph',
          text: '顶级 AI 芯片架构师和性能工程师有一个“看家绝活”：不需要真的去租卡跑代码，拿一支笔一张草稿纸，5 分钟就能估算出一个大模型（比如 Llama-3 70B）在某块卡上到底塞不塞得下、最快一秒能吐多少字。',
        },
        { type: 'heading', text: '底层机制拆解' },
        {
          type: 'list',
          ordered: true,
          items: [
            {
              lead: '算权重显存：',
              body: '参数量 × 单参数字节数。70B 模型在 BF16（2 字节）下，光模型权重就要占 70 × 2 = 140 GB 显存（单张 80GB H100 根本装不下，至少要 2 张卡，或者用 INT4 压到 35GB）。',
            },
            {
              lead: '算单次推理计算量：',
              body: '大模型的全连接计算量有一个极其好记的黄金近似公式——每处理 1 个 Token，所需计算量 ≈ 2 × 参数量（FLOPs）。70B 模型每生成 1 个 Token，需约 140 GFLOPs 计算量。',
            },
            {
              lead: '算理论极限吐字速度（Decode）：',
              body: '在 Batch=1 时受限于带宽，极限速度 ≈ 显存带宽 ÷ (权重体积 + KV Cache 体积)。假设用 2 张 H100（总带宽 6.7 TB/s）跑 140GB 权重的 70B 模型（忽略短文本 KV），理论天花板 = 6700 / 140 ≈ 47.8 tokens/s。如果实测跑出 40 tokens/s，说明带宽利用率（MBU）高达 84%，已经非常优秀了！',
            },
          ],
        },
        {
          type: 'table',
          title: '核心对比表 · 大模型“纸面算账”黄金公式',
          headers: ['算账项目', '黄金估算公式（P 为参数量）', '以 Llama-3 70B（BF16）为例'],
          rows: [
            ['模型权重显存', 'P × 字节数（BF16=2B, FP8=1B, INT4=0.5B）', '70B × 2B = 140 GB'],
            ['单 Token 推理计算量', '≈ 2 × P（FLOPs）', '≈ 140 GFLOPs / Token'],
            ['单 Token 训练计算量', '≈ 6 × P（前向 2P + 反向 4P）', '≈ 420 GFLOPs / Token'],
            ['Batch=1 极限吐字速度', '总显存带宽 ÷ (权重体积 + KV Cache)', '2×H100 (6.7TB/s) ÷ 140GB ≈ 47.8 tok/s'],
          ],
        },
        {
          type: 'callout',
          variant: 'engineer',
          title: '性能工程师“算账”视角',
          content:
            '以后拿到任何一份性能测试报告，先用这四条黄金公式在心里花 30 秒算出 Compute-Bound vs Memory-Bound 边界与“物理理论天花板”。如果同事兴奋地汇报说“我们把 70B 模型在双卡 H100 上优化到了每秒 10 个字”，你一算带宽封顶天花板是 48 个字，立刻就能判断：这里面肯定还有巨大的优化空间或严重 Bug！\n核心工程表达：Back-of-the-Envelope Estimation（纸面算账）基于存储容量与算力/带宽 Roofline 上界，30 秒内量化定位实测性能与物理理论极限的差距。',
        },
        {
          type: 'quiz',
          question:
            '思考题：如果把上面 70B 模型量化到 INT4（权重 35GB），放到一张显存带宽 1 TB/s 的消费级显卡（如 RTX 4090，但假设显存够大）上跑 Batch=1 推理，理论最高吐字速度大概是多少？',
          answer:
            '约 1000 GB/s ÷ 35 GB ≈ 28.5 tokens/s（扣除 KV Cache 搬运和软件开销后，实际大约在 20~24 tokens/s 左右）。',
        },
      ],
    },
    {
      id: '3.6',
      title: '3.6 算子计算图拆解与计算访存分析实战（Netron / PyTorch Profiler）',
      isCore: true,
      readTime: '7 分钟',
      tags: ['核心主线', 'Netron', 'PyTorch Profiler', 'Perfetto', '算子拆解'],
      goal: '学会用 Netron 与 PyTorch Profiler 把大模型拆解为 GEMM/Attention/RMSNorm 等算子积木，定位高耗时低算术强度热点。',
      blocks: [
        { type: 'heading', text: '核心直觉' },
        {
          type: 'paragraph',
          text: '在老板眼里大模型是黑盒，但在性能工程师眼里大模型是一张由几十种基础算子拼成的“乐高图纸”。想让模型变快，第一步是用 Netron 看清 ONNX 计算图结构，把模型拆成 GEMM、Attention、RMSNorm、RoPE、SiLU 等积木块，算出各自的 FLOPs 与 Bytes，揪出那个“干活最少、占时间最多”的偷懒算子！',
        },
        { type: 'heading', text: '底层机制拆解' },
        {
          type: 'list',
          ordered: true,
          items: [
            {
              lead: 'Transformer 算子解剖：',
              body: '大模型 90% 以上的计算量（FLOPs）集中在 QKV/Output 投影和 MLP 的矩阵乘法（GEMM）上；但实际运行时间里，像 RMSNorm、SiLU、Softmax、RoPE 这些计算量不到 1% 的逐元素（Element-wise）和归约（Reduction）算子，常因反复读写 HBM 吃掉 20%~40% 的时间！',
            },
            {
              lead: '算子级算术强度铁律：',
              body: 'GEMM 在大 Batch 时数据复用率极高，属于 Compute-bound；而逐元素算子读一个数算完立刻写回，算术强度常 ≤ 1 FLOP/Byte，属于死硬的 Memory-bound。',
            },
            {
              lead: '零成本剖析组合拳：',
              body: '① Netron + ONNX（打开模型文件一秒可视化计算图节点与张量 Shape）；② PyTorch Profiler + Perfetto UI（3 行代码导出 `trace.json` 拖进 `ui.perfetto.dev` 缩放看 GPU 算子耗时）；③ Meta HTA（Holistic Trace Analysis，自动批量分析多卡 Trace 报告）。',
            },
          ],
        },
        {
          type: 'table',
          title: '核心对比表 · Transformer 典型算子计算访存画像',
          headers: ['Transformer 典型算子', '计算量占比 (FLOPs)', '算术强度特征', '优化核心手段'],
          rows: [
            ['Linear / GEMM (矩阵乘)', '极高（> 90%）', 'Prefill 偏算力瓶颈；Decode 偏访存瓶颈', 'Tensor Core、FP8/MXFP4 量化、增大 Batch'],
            ['Attention (Q·K^T·V)', '随上下文平方增长', '长上下文下中间矩阵极其吃显存带宽', 'FlashAttention 分块融合 / NSA 稀疏注意力'],
            ['RMSNorm / LayerNorm', '极低（< 1%）', '极低（死硬 Memory-bound，需扫两遍数据）', '与前后残差加法融合为单个 Kernel (Triton/TileLang)'],
            ['RoPE / SiLU / Add', '极低（< 1%）', '极低（纯搬运工，启动开销常大于计算）', '算子融合（Operator Fusion）+ CUDA Graph'],
          ],
        },
        {
          type: 'callout',
          variant: 'engineer',
          title: '3 行代码出专业算子耗时报告',
          copyText: `with torch.profiler.profile(activities=[ProfilerActivity.CPU, ProfilerActivity.CUDA]) as prof:\n    out = model(x)\nprof.export_chrome_trace('trace.json')`,
          content:
            '导出 `trace.json` 后直接拖进 `https://ui.perfetto.dev` 查看时间轴耗时（一眼分辨算子属于 Compute-Bound vs Memory-Bound）；静态 ONNX 模型结构直接拖进 `https://netron.app` 排查节点形状：\n`with torch.profiler.profile(activities=[ProfilerActivity.CPU, ProfilerActivity.CUDA]) as prof:`\n`    out = model(x)`\n`prof.export_chrome_trace(\'trace.json\')`\n核心工程表达：借助 PyTorch Profiler Trace 与 Netron 算子拓扑排查，在真实时间轴上定量区分 Tensor Core 算力瓶颈与 Elementwise 访存/发射气泡。',
        },
        {
          type: 'quiz',
          question:
            '思考题：既然矩阵乘法（GEMM）占了 90% 以上计算量，为什么芯片架构师和 AI Infra 工程师还要花大力气优化占比不到 1% 的 Softmax 和 RMSNorm？',
          answer:
            '根据阿姆达尔定律（Amdahl\'s Law），当 GEMM 被 Tensor Core 和 FP8/FP4 加速了 10 倍后，吃不到 Tensor Core 红利且卡在带宽上的 Softmax/RMSNorm 耗时占比会从 5% 暴涨到 30%~40%，反客为主成为拖慢全卡的新瓶颈。',
        },
      ],
    },
  ],
};
