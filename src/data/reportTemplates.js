// 8 套 L0 ~ L6 专属实验报告 Markdown 模板 + 新增论文 JSON 模板

export const REPORT_TEMPLATES_BY_LAB = {
  L0: {
    labId: 'L0',
    title: 'L0 · 手写极简 GPT 自回归生成实验报告模板',
    filename: 'L0_nano_gpt_report.md',
    template: `# L0 实验报告：手写极简 GPT 与自回归算力浪费剖析

- **创建于**：YYYY-MM-DD HH:mm
- **修改于**：YYYY-MM-DD HH:mm
- **关联关卡**：L0 热身关 · 联动课程 5.1

## 1. 运行环境与训练 Loss 记录
- **运行设备**：[CPU / Colab T4 / Mac M 系列] | PyTorch 版本：\`2.x\`
- **模型规模**：\`n_layer=4, n_head=4, n_embd=128\`（约 xx M 参数）
- **最终 Loss 收敛**：Step 0 \`4.17\` → Step 2000 \`1.48\`

## 2. Step 1 vs Step T 张量 Shape 追踪
| 生成步数 | 输入 \`idx\` Shape | Q/K/V 矩阵形状 | 实际有效新增计算 | 冗余重算比例 |
| :--- | :--- | :--- | :--- | :--- |
| Step 1 | \`(1, 1)\` | \`(1, 4, 1, 32)\` | 1 Token | 0% |
| Step T=64 | \`(1, 64)\` | \`(1, 4, 64, 32)\` | 仅最后 1 行 | 98.4% 历史重算 |

## 3. 引入 KV Cache 省算力思考
- 若缓存历史 Key/Value 矩阵，每步前向传播时 $Q$ 仅需投影当前新 Token（\`(1, 1, H)\`），$W_K / W_V$ 对历史 Token 的矩阵乘全部省去，计算复杂度从 $O(T^2)$ 降至单步 $O(T)$。

## 4. 排障复盘
- [记录张量广播维度或 Causal Mask 对齐时踩过的小坑与修正方式]`,
  },
  L1: {
    labId: 'L1',
    title: 'L1 · 云端 GPU 与 vLLM 部署及 OOM 排障报告模板',
    filename: 'L1_vllm_deploy_report.md',
    template: `# L1 实验报告：云端 GPU 部署 vLLM 与显存/功耗体检

- **创建于**：YYYY-MM-DD HH:mm
- **修改于**：YYYY-MM-DD HH:mm
- **关联关卡**：L1 实战 1 · 联动课程 5.1 / 5.2 / 8.3

## 1. 硬件体检与驱动快照
- **显卡型号**：[如 RTX 4090 24GB / TDP 450W] | 驱动 \`550.xx\` | CUDA \`12.4\`
- **启动参数**：\`vllm serve Qwen/Qwen2.5-7B-Instruct --max-model-len 8192 --gpu-memory-utilization 0.88\`

## 2. 权重 vs KV Cache 显存拆解
- 模型权重常驻占用：\`14.2 GB\`（FP16/BF16）
- 预留可用 KV Cache 空间：\`~6.9 GB\`（在 0.88 利用率下）

## 3. 单请求 TTFT / TPOT 与 nvidia-smi dmon 观察
- 单请求实测：TTFT \`xx ms\` | TPOT \`xx ms\`（约 \`xx tok/s\`）
- **真假满载核验**：\`GPU-Util = 94%\`，同时 \`pwr = 398W / 450W\`（逼近 TDP，确认为真实高负载而非等数据空转）。

## 4. OOM 复现与排障记录
- **复现命令**：\`--max-model-len 131072\` 触发 \`CUDA Out of Memory\`（KV Cache 预留需求超出剩余 10GB）。
- **修复手段**：限制 \`--max-model-len 8192\` 后服务稳定拉起。`,
  },
  L2: {
    labId: 'L2',
    title: 'L2 · KV Cache 纸面算账与极限并发压测报告模板',
    filename: 'L2_kv_oom_sweep_report.md',
    template: `# L2 实验报告：KV Cache 纸面手算与并发扫频拐点剖析

- **创建于**：YYYY-MM-DD HH:mm
- **修改于**：YYYY-MM-DD HH:mm
- **关联关卡**：L2 实战 2 · 联动课程 3.4 / 3.5 / 8.1

## 1. 纸面手算 4K KV 体积 vs 实测并发
- 理论单请求 4K KV Cache 体积（GQA）：\`2 × L × Nkv × D × 4096 × 2B = xx MB\`
- 剩余显存可容纳理论并发上限：\`xx 路\`

## 2. 1 / 8 / 32 / 64 并发扫频对照表
| 并发数 | 总吞吐 (tok/s) | TTFT P50 (ms) | TPOT P99 (ms) | 是否达标 50ms SLO |
| :--- | :--- | :--- | :--- | :--- |
| 1 | | | | ✅ |
| 8 | | | | ✅ |
| 32 | | | | [✅/❌] |
| 64 | | | | ❌ |

## 3. 帕累托拐点与抢占复盘
- 系统 Goodput 甜点并发区位于 \`xx 并发\`；当并发拉高至 \`64\` 时出现 KV Cache 抢占（Preemption / Swapping），导致 TPOT P99 陡增突破 50ms 红线。`,
  },
  L3: {
    labId: 'L3',
    title: 'L3 · 量化精度（BF16 vs AWQ/FP8）A/B 对比报告模板',
    filename: 'L3_quant_ab_report.md',
    template: `# L3 实验报告：BF16 vs AWQ/FP8 量化硬件效率与质量 A/B 对照

- **创建于**：YYYY-MM-DD HH:mm
- **修改于**：YYYY-MM-DD HH:mm
- **关联关卡**：L3 实战 3 · 联动课程 3.3 / 5.2 / 8.4

## 1. BF16 vs AWQ/FP8 硬件效率对照表
| 精度方案 | 权重显存 | Batch=1 速度 | 16并发总吞吐 | 实测 MBU | 单百万 Token 成本降幅 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| BF16 基准 | 14.2 GB | xx tok/s | xx tok/s | xx% | 基准 (1.0x) |
| AWQ INT4 | 4.2 GB | xx tok/s | xx tok/s | xx% | 降本 xx% |

## 2. 10 道逻辑/代码题质量回归评估
- 抽测 10 道推理与代码生成题，AWQ INT4 与 BF16 一致率 / 通过率：\`10 / 10\`（无明显逻辑退化）。

## 3. 核心工程结论
- 在受限于 GDDR6X/HBM 带宽的 Decode 阶段，W4A16 直接将权重搬运体积砍掉约 70%，是单卡部署性价比最高的破局杠杆。`,
  },
  'L3.5': {
    labId: 'L3.5',
    title: 'L3.5 · 手改 Nano-vLLM & 前缀缓存成本复盘模板',
    filename: 'L35_nano_vllm_report.md',
    template: `# L3.5 实验报告：Nano-vLLM 调度源码改造与 Prefix Caching 复盘

- **创建于**：YYYY-MM-DD HH:mm
- **修改于**：YYYY-MM-DD HH:mm
- **关联关卡**：L3.5 进阶关 · 联动课程 5.2 / 5.7

## 1. Scheduler 与 Block Manager 核心拆解
- 请求生命周期：\`Waiting Queue → BlockAllocator.allocate() → Prefill/Decode Step → Free Blocks\`
- 页表映射机制：逻辑 \`block_table\` 映射到物理非连续显存块，支持按前缀哈希复用只读 Block。

## 2. 代码 Diff 改动点与正确性验证
- 改动文件与逻辑：[如修改调度优先策略 / Block 哈希命中逻辑]
- 正确性校验：固定随机种子对比改动前后输出 Token 序列 100% 一致。

## 3. 长文档关闭 vs 开启 Prefix Caching 对照
| 实验条件（4K 共享前缀 · 16 并发） | TTFT P50 | TTFT P99 | 系统吞吐 | 每百万 Token 成本 |
| :--- | :--- | :--- | :--- | :--- |
| 关闭 Prefix Caching | xx ms | xx ms | xx tok/s | $x.xx |
| 开启 Prefix Caching | xx ms | xx ms | xx tok/s | $x.xx (降幅 xx%) |

## 4. 多机 Storage I/O 墙延伸思考
- 单机前缀复用命中率 >90% 后几乎消灭 Prefill 计算，但若扩展至多机 Mooncake/LMCache 外部存储池，网卡/SSD 拉取历史 KV 的 I/O 带宽将成为 2026 年新瓶颈。`,
  },
  L4: {
    labId: 'L4',
    title: 'L4 · Nsight Systems 抓气泡与 Profiler 剖析报告模板',
    filename: 'L4_nsys_bubble_report.md',
    template: `# L4 实验报告：Nsight Systems 时间轴抓气泡与 Top 5 算子解剖

- **创建于**：YYYY-MM-DD HH:mm
- **修改于**：YYYY-MM-DD HH:mm
- **关联关卡**：L4 实战 4 · 联动课程 7.4 / 8.2 / 8.3

## 1. 抓包命令与采样配置
\`\`\`bash
nsys profile -o timeline_rep --trace=cuda,nvtx,osrt python bubble_demo.py
\`\`\`

## 2. 时间轴病症排查清单
- [x] 隐式同步空白（如 \`.item()\` / \`cudaDeviceSynchronize()\` 强行阻塞 CPU-GPU 流水线）
- [ ] 碎片发射气泡（大量小 Kernel 未开 CUDA Graph）
- [ ] CPU 预处理阻塞（分词/数据加载拖慢发射队列）

## 3. Top 5 耗时算子拆解
1. \`ampere_bf16_s16816gemm\` — 占比 xx%（Compute-Bound）
2. \`cudaStreamSynchronize\` — 占比 xx%（异常同步等待）
3. \`elementwise_kernel\` — 占比 xx%（Memory-Bound，待融合）

## 4. 优化动作与气泡占比降幅对比
- **修复前**：GPU 空闲气泡占比 \`45%\`，总耗时 \`xx ms\`
- **修复后**：移除隐式同步并开启异步流，气泡降至 \`< 5%\`，端到端提速 \`1.72x\`。`,
  },
  L5: {
    labId: 'L5',
    title: 'L5 · Triton / TileLang 融合算子与带宽压榨报告模板',
    filename: 'L5_triton_kernel_report.md',
    template: `# L5 实验报告：Triton Fused Softmax 融合算子与有效带宽评测

- **创建于**：YYYY-MM-DD HH:mm
- **修改于**：YYYY-MM-DD HH:mm
- **关联关卡**：L5 实战 5 · 联动课程 4.2 / 4.3 / 2.1

## 1. 理论 HBM 读写次数算账
- **原生拆开写**：Max + Exp + Sum + Div 共需多次 HBM 往返读写（约 \`6 × M × N × 4B\`）。
- **Triton 单核融合**：整行一次载入片上 SRAM/寄存器完成所有归约，仅需 \`1 读 + 1 写\`，理论访存量砍掉 \`66.7% ~ 75%\`。

## 2. 精度一致性验证
- 使用 \`torch.allclose(out_triton, out_torch, atol=1e-5, rtol=1e-5)\` 验证：**通过 ✅**。

## 3. 原生 PyTorch vs Triton 性能对比
| 实现方式 | 单次耗时 (torch.cuda.Event) | 实测有效带宽 (GB/s) | 相对硬件峰值 MBU |
| :--- | :--- | :--- | :--- |
| 原生拆开写 | xx ms | xx GB/s | xx% |
| Triton Fused Kernel | xx ms | xx GB/s (提速 xx×) | xx% |

## 4. BLOCK_SIZE 与 num_warps 调优笔记
- 当列宽 \`N=2048\` 时，\`BLOCK_SIZE=2048\` 配合 \`num_warps=8\` 可最大化隐藏片上归约延迟且不触发寄存器溢出。`,
  },
  L6: {
    labId: 'L6',
    title: 'L6 · 综合排障 / 架构建模终极项目报告模板',
    filename: 'L6_capstone_architecture_report.md',
    template: `# L6 综合大作业：多卡集群热节流排障 / GPU 架构建模 PPA 评估

- **创建于**：YYYY-MM-DD HH:mm
- **修改于**：YYYY-MM-DD HH:mm
- **关联关卡**：L6 实战 6 · 联动课程 1.7 / 8.4 / 8.5 / 8.6

## 1. 选题与核心假设（二选一）
- **方向**：[A. 多卡通信与 DVFS 热节流联合排障 / B. 基于 Golden Model 的 70B Decode 架构 PPA 寻优]
- **核心假设**：[如：Decode 阶段 85% 耗时受限于 HBM 带宽，扩充 SRAM 至 128MB 可显著降低搬运等待]

## 2. 关键监控或仿真定量对比
| 方案 / 状态 | 实测带宽 / 有效频率 | 吞吐 / 延迟指标 | 功耗 / 结温 / PPA 成本 |
| :--- | :--- | :--- | :--- |
| 基线状态 | | | |
| 优化方案 | | | |

## 3. 工程优化建议
- [给出 2~3 条可量化落地的系统或微架构改进策略]

## 4. 3 行精炼总结（面试电梯演讲口径）
1. **瓶颈定位**：...
2. **量化手段**：...
3. **商业收益**：...`,
  },
};

export const PAPER_NOTE_TEMPLATE = `{
  "id": "paper-custom-2026",
  "title_en": "Paper English Title",
  "title_zh": "论文中文精炼标题",
  "venue": "ISCA '26 / MLSys '26",
  "domain": "推理系统",
  "created_at": "2026-11-28 16:00",
  "updated_at": "2026-11-28 16:00",
  "paper_url": "https://arxiv.org/abs/xxxx.xxxxx",
  "core_bottleneck": "用 1 句话精准概括这篇论文解决的系统/硬件核心瓶颈。",
  "related_labs": ["L1", "L2"],
  "personal_understanding": {
    "intuition": "核心直觉：用大白话或类比说明它的核心思想。",
    "perf_math": "底层性能算账：量化它减少了多少访存/通信/显存或提升了多少吞吐。",
    "critique_and_thought": "局限性与延伸思考：它引入了什么新代价（如边界税/反量化开销/Kernel 复杂度）？",
    "lab_link_note": "结合训练营哪一关实验可以亲自复现验证该机制。"
  }
}`;
