// 10 组系统架构深度问答演练舱（Deep-Dive Q&A）

export const DEEP_DIVE_QA = [
  {
    id: 'qa-1-fake-util',
    topic: '假 100% GPU-Util 诊断',
    question: 'nvidia-smi 显示 GPU-Util 99%，为什么系统吞吐却极慢，如何三步定界？',
    mechanism:
      'GPU-Util 仅统计采样窗口内“至少有 1 个 CUDA Kernel 处于活跃”的时间比例，哪怕 99% 的 SM/Tensor Core 在等 HBM 搬运或单 Warp 跑零散小算子，它依然显示 99%。真正判断满载需三合一：看实时功耗是否逼近 TDP、用 dcgmi dmon 看 Tensor Core / DRAM Bandwidth 真实利用率、用 nsys 抓时间轴空白气泡。',
    followUps: [
      {
        q: '追问 1：如果功耗只有 TDP 的 35%，但显存带宽利用率（DRAM Active）已经 85%，瓶颈在哪？',
        a: '死硬的 Memory-Bound（典型于 Batch=1 Decode）。计算核心喂不饱，应通过增大 Batch、W4A16 量化或 GQA/MLA 减少单步搬运字节数。',
      },
      {
        q: '追问 2：如果功耗低、DRAM Active 也只有 15%，但 GPU-Util 还是 95%，又是什么病？',
        a: '大概率是大量极小算子（Kernel Launch Overhead）或细粒度访存未合并导致发射碎片化。应开启 CUDA Graph（图下沉）并用 Triton 做算子融合。',
      },
    ],
  },
  {
    id: 'qa-2-paged-attn',
    topic: 'PagedAttention 访存代价',
    question: 'vLLM PagedAttention 把显存碎片压到 4% 以下，它在硬件访存层面引入了什么代价？',
    mechanism:
      '由于逻辑连续的 KV Cache 被切散存放在物理非连续的显存 Block 中，Attention Kernel 无法再做简单的首地址连续偏移，必须先查 Block Table（页表寻址），再按物理块离散读取（Indirect / Gather Memory Access），并需要手写定制 PagedAttention CUDA/Triton Kernel 保证块内 128B 合并访存。',
    followUps: [
      {
        q: '追问 1：Block Size 设得太小（如 1）或太大（如 256）各有什么坏处？',
        a: '太小会导致 Block Table 体积暴涨、页表间接寻址开销飙升且破坏 GPU 128B 缓存行合并访存；太大则会重新退化出严重的内部尾部碎片（Internal Fragmentation）。工业界通常折中选择 16 或 32 Token。',
      },
      {
        q: '追问 2：多轮 Agent 场景下 PagedAttention 还会怎么继续演进？',
        a: '演进为 RadixAttention（基数树前缀共享）+ FP8 KV 量化 + 分级卸载（Mooncake/LMCache），跨请求复用公共前缀 Block 并卸载冷数据。',
      },
    ],
  },
  {
    id: 'qa-3-pd-boundary',
    topic: 'Prefill-Decode 冲突与 PD 边界税',
    question: '为什么 Prefill 和 Decode 混布会互相卡死？拆成 PD 分离后又引入了什么“边界税”？',
    mechanism:
      'Prefill 是高算术强度的 Compute-Bound，一条长文本会占满整卡算力数百毫秒，直接阻塞同一张卡上所有正在流畅吐字的 Decode 用户导致 TPOT 毛刺飙升。而拆分成独立 P 池与 D 池后，P 节点算好的海量 KV Cache 必须通过 RDMA/NVLink 跨机快递到 D 节点，带来额外网络传输延迟、双份显存缓冲与流量波动时的“算力搁浅（Stranded Capacity）”——即 Boundary Tax。',
    followUps: [
      {
        q: '追问 1：如果集群没有 InfiniBand，只有普通千兆/万兆以太网，适合硬上 PD 分离吗？',
        a: '不适合！网络带宽不够会导致 KV 传输耗时远超 Prefill 本身，边界税彻底吃掉收益；此时应先用同卡 Chunked Prefill 切碎长请求插空调度。',
      },
      {
        q: '追问 2：如何缓解 PD 分离下流量波峰波谷引发的“算力搁浅”？',
        a: '靠软件层动态弹性切换节点角色（如 Dynamo / Mooncake 的弹性池调度），并配合 MLA / FP8 KV 压缩跨机传输体积。',
      },
    ],
  },
  {
    id: 'qa-4-w4a16',
    topic: 'W4A16 量化提速物理原理',
    question: 'W4A16 推理时还要把 INT4 权重反量化回 FP16 再送进 Tensor Core，为什么反而快了近 3 倍？',
    mechanism:
      '在大模型 Batch=1 Decode 阶段，算术强度约 1 FLOP/Byte，远低于 H100 约 295 的硬件拐点，GPU 99% 的时间在等 HBM 搬运权重，算力严重过剩。W4A16 将从 HBM 搬到片上的权重体积直接压缩 4 倍，在寄存器内顺手用过剩算力执行几条位运算指令解压（Dequantize），虽然多做了一点计算，但把最致命的 HBM 搬运时间砍掉了 75%！',
    followUps: [
      {
        q: '追问 1：在什么情况下 W4A16 反而可能比 FP8 甚至 BF16 更慢？',
        a: '在超大 Batch 或长文本 Prefill 阶段（Compute-Bound）！此时 HBM 带宽不再是瓶颈，W4A16 无法使用原生低比特 Tensor Core，额外的寄存器反量化指令开销（Dequantization Overhead）反而会拖慢计算。',
      },
      {
        q: '追问 2：2026 年 Blackwell 的 MXFP4 / NVFP4 如何解决反量化开销？',
        a: '通过硬件原生微缩放（Microscaling）Tensor Core 直接吞吐 FP4 矩阵乘，每 16/32 个数配硬件缩放因子，彻底消灭软件反量化指令膨胀。',
      },
    ],
  },
  {
    id: 'qa-5-flashattn',
    topic: 'FlashAttention IO 感知机制',
    question: 'FlashAttention 计算量不仅没少反而略微变多，为什么在长序列下能快 2~4 倍且显存从 O(N²) 降到 O(N)？',
    mechanism:
      '标准 Attention 会将 N×N 的 S 和 P 矩阵完整写回慢速 HBM 再读出做 Softmax（大量 IO 浪费在 HBM 上）。FlashAttention 采用 IO-Aware Tiling（分块计算），把 Q/K/V 小块载入极高速的片上 SRAM，利用 Online Softmax 增量更新最大值与归一化分母，全程不把 N×N 中间矩阵落盘 HBM。',
    followUps: [
      {
        q: '追问 1：为什么 FlashAttention 反向传播时往往要重算（Recompute）前向注意力矩阵？',
        a: '为了不在前向阶段保存 O(N²) 的巨大激活值撑爆 HBM；重算虽然多了点 FLOPs，但省去了海量慢速 HBM 读写，总体时间反而大幅缩短。',
      },
      {
        q: '追问 2：进入 1M 上下文时代，FlashAttention 依然算得太慢怎么办？',
        a: '结合 Context Parallelism（多卡环形/Ulysses 切分序列）或块级原生稀疏注意力（NSA）/ 混合 Mamba 线性注意力削减计算量。',
      },
    ],
  },
  {
    id: 'qa-6-moe-alltoall',
    topic: 'MoE All-to-All 与通信隐藏',
    question: 'DeepSeek-V3 等超大规模 MoE 推理为何极度吃 NVLink / 机柜级域，以及 DualPipe 如何藏住通信？',
    mechanism:
      'MoE 每一层都需要 Router 把不同 Token 动态路由到分散在不同 GPU 上的专家，触发全局重排通信（All-to-All）。如果跨慢速以太网通信，每次路由都会卡死算力。通过 NVL72 机柜级超节点将 EP 域锁死在高速域内，再用 DualPipe / 双微批次重叠（Micro-Batch Overlap），让 Batch A 在网卡做 All-to-All  dispatch 时，GPU 正同步计算 Batch B 的矩阵乘。',
    followUps: [
      {
        q: '追问 1：如果某个“网红专家”突然被 80% 的 Token 同时选中，会发生什么？',
        a: '触发专家负载不均（Load Imbalance）与木桶效应：所有其他卡上的专家算完后只能干等这张热点卡慢慢算完，导致整集群同步卡顿；需靠动态冗余专家副本与辅助均衡损失缓解。',
      },
      {
        q: '追问 2：为什么 MoE 模型单用户本地部署性价比不如云端高并发？',
        a: '本地单用户仍需装下全量 671B 权重显存，但每步只激活极少算力；云端大并发能让每个专家都凑齐大 Batch，充分摊薄显存成本。',
      },
    ],
  },
  {
    id: 'qa-7-rl-rollout',
    topic: '2026 RL 后训练 Rollout 长尾瓶颈',
    question: '为什么在 GRPO / RLVR 等强化学习后训练中，70% 时间耗在 Rollout 推理生成且 GPU 利用率越往后越跌？',
    mechanism:
      'RL 后训练每步需要模型对同一批 Prompt 采样生成多条长思维链（Long CoT）。不同题目的思维链长度极度不均（300 字 vs 2 万字）。在同步批处理下，早早生成完短回答的槽位只能空转干等那条最长的长尾轨迹（Straggler Tail）跑完，随后再集中做梯度反传和推理引擎权重重载，产生巨大气泡。',
    followUps: [
      {
        q: '追问 1：工业界如何破局 Rollout 长尾木桶效应？',
        a: '采用异步解耦 Rollout 架构（如 verl / 异步队列池）：推理节点持续流式生成轨迹，写满就先送去算 Reward/梯度，不被单条超长序列拖死整组。',
      },
      {
        q: '追问 2：训练引擎更新权重后，怎么以最低延迟把新权重喂给推理引擎？',
        a: '通过共享显存零拷贝或 NCCL 分片极速广播（Colocated / RDMA Weight Sync），避免走磁盘 Checkpoint 落盘再加载。',
      },
    ],
  },
  {
    id: 'qa-8-numa-rdma',
    topic: 'NUMA 亲和性与 GPUDirect RDMA',
    question: '8 卡服务器里为什么 4~7 号卡延迟明显抖动，且多机通信为什么必须依赖 GPUDirect RDMA？',
    mechanism:
      '双路 CPU 服务器中，GPU 0~3 挂载在 CPU 0 的 PCIe 根下，GPU 4~7 挂载在 CPU 1 下。若主进程跑在 CPU 0 内存上却去喂 GPU 4~7，数据必须跨越 CPU 间互连总线（UPI/Infinity Fabric）绕路触发高延迟；用 numactl 就近绑核即可消除。而在多机跨节点通信时，传统 TCP 需要将数据从 GPU 拷到 CPU 内核再给网卡，GPUDirect RDMA 实现 Zero-Copy & Kernel-Bypass，网卡直接跨机读写远端 GPU 显存。',
    followUps: [
      {
        q: '追问 1：用什么命令 10 秒查出某张 GPU 归属哪个 NUMA 节点？',
        a: '执行 `nvidia-smi topo -m`，查看最右侧 `CPU Affinity` 和 `NUMA Affinity` 列即可一目了然。',
      },
      {
        q: '追问 2：多机训练突然变慢，怎么 30 秒分清是 RDMA 网线故障还是代码写慢了？',
        a: '先跑 `nccl-tests`（`all_reduce_perf`）和 `ib_write_bw` 测硬件裸带宽；裸带宽达标再查业务代码。',
      },
    ],
  },
  {
    id: 'qa-9-npu-fallback',
    topic: '自研 NPU 软件栈排障与竞品对标',
    question: '将开源大模型迁移到自研 NPU 后，矩阵算力账面持平但实测只有 GPU 的 1/4，从哪三层入手排查？',
    mechanism:
      '第一查 Operator Fallback（算子回退）：用 msProf/PyTorch Profiler 看是否夹杂 1~2 个不支持的新算子悄悄退回 CPU 计算并触发 PCIe 往返拷贝；第二查 Kernel Launch Overhead：是否未开启图下沉（Graph Capture）导致小算子驱动发射气泡巨大；第三查片上 SRAM 双缓冲（Double Buffering）是否生效，隐藏 DMA 权重搬运耗时。',
    followUps: [
      {
        q: '追问 1：发现 1 个冷门归一化算子触发了 CPU 回退，最快怎么补齐？',
        a: '优先用 TileLang / Triton NPU 后端手写几十行融合算子注册进运行时插件，或通过 ONNX/MLIR 图改写拆解为 NPU 原生支持的基础算子组合。',
      },
      {
        q: '追问 2：如何用一套公平的指标向老板汇报 NPU 与竞品 GPU 的对标结果？',
        a: '对齐同精度、同输入输出长度、同 SLO 红线（TPOT ≤ 50ms），同时汇报 Goodput 吞吐、MBU（带宽利用率）以及能效比（Tokens/J）与 TCO 成本。',
      },
    ],
  },
  {
    id: 'qa-10-dvfs-thermal',
    topic: '硅后 Bring-up 与 DVFS 热节流',
    question: '压测前两分钟速度完美，第 3 分钟起吞吐暴跌 30%，背后的功耗物理机制与排障步骤是什么？',
    mechanism:
      '芯片动态功耗遵循 $P = \\alpha C V^2 f$，同时静态漏电随结温升高呈指数暴涨。连续满载压测时热量在散热器上累积，一旦芯片结温撞破保护红线（如 85℃），硬件会强制激活 DVFS 热节流（Thermal Throttling）同时拉低工作电压 $V$ 和频率 $f$ 保命，导致算力与吞吐断崖下跌。',
    followUps: [
      {
        q: '追问 1：用哪条命令可以一秒抓现行确认是否触发了热节流？',
        a: '运行 `nvidia-smi -q -d PERFORMANCE`，查看 `Clocks Throttle Reasons` 下 `SW Thermal Slowdown` 或 `HW Thermal Slowdown` 是否为 `Active`。',
      },
      {
        q: '追问 2：在数据中心散热上限固定时，为什么降压 10% + 降频 10% 能大幅改善长期持续性能？',
        a: '因为动态功耗与电压成平方关系：$0.9^2 \\times 0.9 = 0.729$，总功耗直接下降约 27%，使芯片温度稳稳停在 85℃ 红线以下不再触发断崖降频。',
      },
    ],
  },
];
