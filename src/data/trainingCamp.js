// 工程实战与排障训练营数据：8 大阶梯实战（L0~L4）、大厂级评测报告模板、排障情景与 10 类工具墙

export const BENCHMARK_REPORT_TEMPLATE = `# [模型名] 在 [GPU 型号] 上的推理性能评测与排障分析报告

## 1. 实验环境快照（可复现性声明）
- **硬件配置**：1 × RTX 4090 (24GB GDDR6X, 1008 GB/s) / CPU 16 vCPU
- **软件栈版本**：CUDA 12.1 | PyTorch 2.4.0 | vLLM 0.6.x | Driver 550.xx
- **核心启动参数**：\`vllm serve Qwen/Qwen2.5-7B-Instruct-AWQ --quantization awq --enable-prefix-caching --max-model-len 8192\`

## 2. 纸面理论天花板算账（Roofline 锚点）
- 模型权重体积：4.2 GB (INT4) | 1K 上下文单请求 KV Cache：约 0.14 GB
- Batch=1 理论极限吐字速度：1008 GB/s ÷ 4.34 GB ≈ **232 tokens/s**

## 3. 实测性能数据（Warmup 5 轮，1024 输入 / 256 输出）
| 并发数 (Concurrency) | TTFT P50 (ms) | TTFT P99 (ms) | TPOT P50 (ms) | 系统总吞吐 (tok/s) | 备注 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | 42 | 55 | 7.2 (138 tok/s) | 138 | MBU ≈ 59.5% |
| 16 | 115 | 240 | 18.5 (54 tok/s) | 864 | 满足流畅 SLO |
| 64 | 680 | 1450 | 48.2 (20.7 tok/s) | 1325 | 逼近 50ms 红线 |

## 4. 排障日志与 Nsight 瓶颈定位
- **踩坑 1（启动 OOM）**：初始未限 \`--max-model-len\`，默认 32K 预分配 KV Cache 撑爆显存，调至 8K 后解决。
- **优化收益**：开启 \`--enable-prefix-caching\` 后，共享 3K System Prompt 场景下 TTFT P99 从 890ms 骤降至 112ms（降幅 87%）。

## 5. 结论与下一步优化方向
- 在满足 TPOT < 50ms 的 SLO 红线下，单卡 Goodput 有效吞吐甜点区位于并发 32~48；若需进一步压低高并发长尾 P99，建议开启 \`--enable-chunked-prefill\`。`;

export const TRAINING_TASKS = [
  {
    id: 'lab-0-nano-gpt',
    labLevel: 'L0',
    stepNumber: 0,
    shortName: 'L0 热身',
    title: '手写极简 GPT，看透逐 Token 生成',
    tier: 'L0 入门热身',
    tierKey: 'l0',
    duration: '3 小时',
    budget: '¥0（本地 CPU / Colab 可跑）',
    prerequisites: ['5.1'],
    resumeOutput: '《手写极简 GPT 自回归算力笔记》',
    goal: '在动手部署庞大推理引擎前，先亲手跑通一个几百行的极简 GPT 代码，肉眼看清大模型到底是怎么一个 Token 一个 Token 生成答案的，彻底打通“为什么没有 KV Cache 会重复算历史 Attention”的底层直觉。',
    checklist: [
      {
        id: 't0-c1',
        text: "跟着 Andrej Karpathy《Let's build GPT from scratch》从零跑通一个极简 Transformer 代码",
      },
      {
        id: 't0-c2',
        text: '在自回归生成循环中打印每一步的输入张量 Shape，亲眼确认“每吐 1 个新字都要重算全部历史 Attention”的算力浪费',
      },
      {
        id: 't0-c3',
        text: '记录一句架构笔记：如果引入 KV Cache，前向计算里的哪些矩阵乘法可以被直接省掉？',
      },
    ],
    references: [
      {
        label: 'Andrej Karpathy 教程（YouTube）',
        url: 'https://www.youtube.com/watch?v=kCc8FmEb1nY',
      },
    ],
  },
  {
    id: 'lab-1-vllm-oom',
    labLevel: 'L1',
    stepNumber: 1,
    shortName: '实战 1',
    title: 'AutoDL 部署 vLLM 与 OOM 复现排障',
    tier: 'L1 入门',
    tierKey: 'l1',
    duration: '1 个周末',
    budget: '约 ¥5',
    prerequisites: ['5.1', '5.2', '8.3'],
    resumeOutput: '《云端 GPU 压测与 OOM 排障日记》',
    goal: '花几块钱打破对 Linux 服务器和云端显卡的陌生感。亲手部署 Qwen-7B 模型，故意触发一次 CUDA Out of Memory（OOM）爆显存报错，再通过调参将其修复，观察 nvidia-smi 显存与功耗的真实跳动。',
    checklist: [
      {
        id: 't1-c1',
        text: '在 AutoDL 租用 1 张 24GB 显存显卡（如 RTX 3090 / 4090，镜像选 PyTorch 2.3+ / CUDA 12.1）',
      },
      {
        id: 't1-c2',
        text: '开启终端，配置国内镜像源并安装 vLLM，拉取 Qwen2.5-7B-Instruct 模型',
      },
      {
        id: 't1-c3',
        text: '执行「故意 OOM 命令」，截图记录终端的显存溢出报错日志',
      },
      {
        id: 't1-c4',
        text: '执行「排障修复命令」，成功拉起 OpenAI 兼容 API 服务并用 curl 发送测试请求',
      },
      {
        id: 't1-c5',
        text: '新开终端运行 nvidia-smi dmon，观察发请求瞬间 SM 利用率、显存占用与功耗变化',
      },
    ],
    codeTitle: 'AutoDL Linux 终端实操命令（含故意 OOM 复现与修复）',
    codeFilename: 'vllm_oom_lab.sh',
    language: 'bash',
    code: `# 1. 安装 vLLM 并开启国内魔搭/HF 镜像加速（防下载超时）
pip install -U vllm
export HF_ENDPOINT=https://hf-mirror.com

# 2. 【故意触发 OOM 实验】24GB 显卡强行预留 128K 超长上下文，观察 KV Cache 撑爆显存
vllm serve Qwen/Qwen2.5-7B-Instruct --max-model-len 131072 --gpu-memory-utilization 0.95

# 3. 【工程师排障修复】合理限制上下文长度至 8K，稳健启动服务
vllm serve Qwen/Qwen2.5-7B-Instruct \\
    --max-model-len 8192 \\
    --gpu-memory-utilization 0.88 \\
    --dtype bfloat16 \\
    --port 8000

# 4. 新开终端：每秒刷新监控显存、功耗(pwr)与算力(sm)
nvidia-smi dmon -s pucm -d 1

# 5. 发送一条测试请求验证吐字
curl http://localhost:8000/v1/chat/completions \\
  -H "Content-Type: application/json" \\
  -d '{"model": "Qwen/Qwen2.5-7B-Instruct", "messages": [{"role": "user", "content": "用一句话解释什么是内存墙"}], "max_tokens": 128}'`,
  },
  {
    id: 'lab-2-roofline-mbu',
    labLevel: 'L2',
    stepNumber: 2,
    shortName: '实战 2',
    title: '手写大模型“纸面算账”与 MBU 校验脚本',
    tier: 'L1 入门',
    tierKey: 'l1',
    duration: '2 小时',
    budget: '¥0（本机运行）',
    prerequisites: ['3.4', '3.5', '8.1'],
    resumeOutput: '开源 Roofline & MBU 自动计算器',
    goal: '不租卡也能练出顶级性能工程师的“算账条件反射”：在自己电脑上运行这份 Python 脚本，输入任意显卡规格、模型参数量、精度和你在实战 1 测出的真实速度，自动算出 Roofline 拐点、理论天花板速度与真实带宽利用率（MBU）。',
    checklist: [
      {
        id: 't2-c1',
        text: '在本机新建 roofline_calc.py 并运行脚本，查看 RTX 4090 / H100 跑 7B 和 70B 的理论天花板',
      },
      {
        id: 't2-c2',
        text: '将实战 1 实测的真实吐字速度填入 measured_tps，算出你这次部署的真实 MBU（目标 > 65%）',
      },
      {
        id: 't2-c3',
        text: '尝试修改 precision_bytes 从 2 (BF16) 改为 0.5 (INT4)，观察理论极限速度翻 4 倍的规律',
      },
    ],
    codeTitle: '大模型纸面算账与 MBU 诊断脚本（零依赖，本机直接运行）',
    codeFilename: 'roofline_calc.py',
    language: 'python',
    code: `# roofline_calc.py —— 大模型纸面算账与 MBU 诊断脚本（零依赖，本机直接 python 运行）
def analyze_llm_decode(
    chip_name: str,
    peak_tflops: float,      # 芯片 FP16/BF16 峰值算力 (TFLOPS)
    mem_bw_gbs: float,       # 显存带宽 (GB/s)
    vram_gb: float,          # 单卡显存容量 (GB)
    params_b: float,         # 模型参数量 (B, 如 7 或 70)
    precision_bytes: float,  # 单参数字节数 (BF16=2, FP8=1, INT4=0.5)
    kv_cache_gb: float = 1.0,# 当前并发与长度下的 KV Cache 体积 (GB)
    measured_tps: float = 0  # 选填：实测 Batch=1 吐字速度 (tokens/s)
):
    ridge_point = (peak_tflops * 1000) / mem_bw_gbs  # FLOPs/Byte
    weight_gb = params_b * precision_bytes
    total_move_gb = weight_gb + kv_cache_gb
    max_tps = mem_bw_gbs / total_move_gb
    tpot_ms = 1000.0 / max_tps

    print(f"=== [{chip_name}] 跑 {params_b}B ({precision_bytes*8:.0f}-bit) 纸面算账 ===")
    print(f"• Roofline 硬件拐点 : {ridge_point:.1f} FLOPs/Byte")
    print(f"• 模型权重 + KV 占用: {weight_gb:.1f} GB + {kv_cache_gb:.1f} GB = {total_move_gb:.1f} GB / {vram_gb} GB")
    if total_move_gb > vram_gb:
        print("  ⚠️ 警告：单卡显存已 OOM！需开启量化或多卡张量并行 (TP)")
    print(f"• Batch=1 理论极限速度: {max_tps:.1f} tokens/s (极限 TPOT = {tpot_ms:.1f} ms)")
    if measured_tps > 0:
        mbu = (measured_tps / max_tps) * 100
        status = "顶级调优！" if mbu >= 70 else ("正常水平" if mbu >= 50 else "偏低，建议查 CUDA Graph/算子瓶颈")
        print(f"• 实测速度 {measured_tps} tok/s -> 真实显存带宽利用率 (MBU) = {mbu:.1f}% ({status})\\n")

if __name__ == "__main__":
    analyze_llm_decode("RTX 4090", 330, 1008, 24, params_b=7, precision_bytes=2, kv_cache_gb=1.2, measured_tps=52)
    analyze_llm_decode("NVIDIA H100", 989, 3350, 80, params_b=70, precision_bytes=1, kv_cache_gb=4.0, measured_tps=38)`,
  },
  {
    id: 'lab-3-awq-prefix',
    labLevel: 'L3',
    stepNumber: 3,
    shortName: '实战 3',
    title: '量化（AWQ/FP8）与前缀缓存 A/B 对照评测',
    tier: 'L2 进阶',
    tierKey: 'l2',
    duration: '1 个下午',
    budget: '约 ¥10',
    prerequisites: ['3.3', '5.2', '8.4'],
    resumeOutput: '《吞吐-延迟帕累托前沿实测报告》',
    goal: '严格按照 MLPerf 科学实验军规（Warmup 预热 + 控制变量 + 记录 P50/P95/P99 分位数），亲手测出 AWQ 4-bit 量化相对 BF16 的提速曲线，以及开启 Prefix Caching 后共享长 System Prompt 场景下 TTFT 首字延迟的断崖式暴跌。',
    checklist: [
      {
        id: 't3-c1',
        text: '对照组 A：启动 Qwen2.5-7B-Instruct (BF16)，跑 3 轮 Warmup 后用压测工具采集并发 1/8/32 的 TTFT 与 TPOT',
      },
      {
        id: 't3-c2',
        text: '实验组 B：换用 Qwen2.5-7B-Instruct-AWQ (W4A16)，保持相同输入输出长度，对比显存与吞吐变化',
      },
      {
        id: 't3-c3',
        text: '实验组 C：在 vLLM 启动参数中加入 --enable-prefix-caching，发送带 3000 字公共前缀的并发请求，记录 TTFT P99 降幅',
      },
      {
        id: 't3-c4',
        text: '将采集的数据画成「系统总吞吐 (Tokens/s) vs 单用户 TPOT (ms)」帕累托前沿曲线',
      },
    ],
    codeTitle: 'AWQ 量化 + Prefix Caching 启动与官方压测命令',
    codeFilename: 'bench_awq_prefix.sh',
    language: 'bash',
    code: `# 实验组 B：启动 AWQ 4-bit 量化 + 自动前缀缓存（Prefix Caching）
vllm serve Qwen/Qwen2.5-7B-Instruct-AWQ \\
    --quantization awq \\
    --enable-prefix-caching \\
    --max-model-len 8192 \\
    --port 8000

# 使用 vLLM 官方内置压测工具（自动统计 Mean/P50/P95/P99 的 TTFT 与 TPOT）
# 提示：先用 --num-prompts 5 跑一次 Warmup 预热，再跑下面正式 100 并发压测！
vllm bench serve \\
    --backend vllm \\
    --model Qwen/Qwen2.5-7B-Instruct-AWQ \\
    --dataset-name random \\
    --random-input-len 1024 \\
    --random-output-len 256 \\
    --num-prompts 100 \\
    --max-concurrency 16`,
  },
  {
    id: 'lab-4-nsys-bubble',
    labLevel: 'L4',
    stepNumber: 4,
    shortName: '实战 4',
    title: 'Nsight Systems (nsys) “抓气泡”破案演练',
    tier: 'L2 进阶',
    tierKey: 'l2',
    duration: '1 个周末',
    budget: '约 ¥15',
    prerequisites: ['7.4', '8.2', '8.3'],
    resumeOutput: '修复前后时间轴气泡对比截图',
    goal: '掌握面试 AI 芯片性能岗的核武器技能！先运行一段故意埋入“隐式 CPU-GPU 同步锁（.item()）”的生病脚本，用 nsys 抓出时间轴文件并在电脑端 Nsight Systems GUI 打开看到大片红色空白气泡；再注释掉这行 Bug 重新抓包，亲眼见证气泡彻底消失！',
    checklist: [
      {
        id: 't4-c1',
        text: '在自己电脑安装免费软件 NVIDIA Nsight Systems（仅用于打开 .nsys-rep 图形界面，本机无需 N 卡）',
      },
      {
        id: 't4-c2',
        text: '在云端 GPU 保存下方 bubble_demo.py，先以 BUG_MODE=True 运行 nsys profile 生成 bad.nsys-rep',
      },
      {
        id: 't4-c3',
        text: '改为 BUG_MODE=False 重新抓取 good.nsys-rep，把两个文件下载到自己电脑并用 Nsight GUI 打开',
      },
      {
        id: 't4-c4',
        text: '放大底部 CUDA HW 轨道，对比截屏「满屏空白气泡」vs「绿条严丝合缝」，写进你的个人网站实测日记',
      },
    ],
    codeTitle: '抓气泡最小复现脚本 + nsys 抓取命令',
    codeFilename: 'bubble_demo.py',
    language: 'python',
    code: `# bubble_demo.py —— 故意制造与修复 GPU 时间轴“气泡”的最小复现脚本
import torch, time

BUG_MODE = True  # 第一遍跑 True 抓气泡，第二遍改 False 看修复效果！
device = "cuda"
x = torch.randn(2048, 2048, device=device, dtype=torch.bfloat16)
w = torch.randn(2048, 2048, device=device, dtype=torch.bfloat16)

# 1. 严格 Warmup 预热 10 轮
for _ in range(10):
    _ = x @ w
torch.cuda.synchronize()

# 2. 正式压测 50 步（开启 NVTX 区间打标，方便在 Nsight 里一眼找到）
torch.cuda.nvtx.range_push("Main_Loop")
t0 = time.perf_counter()
for step in range(50):
    y = x @ w
    if BUG_MODE:
        # ⚠️ 经典性能杀手：每步把标量同步拷回 CPU，强迫 GPU 停机干等！
        val = y[0, 0].item()
        time.sleep(0.001)  # 模拟 CPU 顺手做了一点日志/分词预处理
torch.cuda.synchronize()
torch.cuda.nvtx.range_pop()
print(f"BUG_MODE={BUG_MODE} | 总耗时: {(time.perf_counter() - t0)*1000:.2f} ms")

# --- 云端终端抓取命令（生成 .nsys-rep 文件后下载到本地用 Nsight GUI 打开）---
# nsys profile -o bad_timeline --trace=cuda,nvtx,osrt python bubble_demo.py`,
  },
  {
    id: 'lab-5-triton-softmax',
    labLevel: 'L5',
    stepNumber: 5,
    shortName: '实战 5',
    title: '用 OpenAI Triton 写你的第一个融合算子',
    tier: 'L3 深入',
    tierKey: 'l3',
    duration: '寒暑假 3 天',
    budget: '约 ¥20',
    prerequisites: ['4.2', '4.3', '2.1'],
    resumeOutput: '自写 Triton 算子 vs PyTorch 带宽对比',
    goal: '不碰枯燥的 CUDA C++ 指针，用几十行类 Python 风格的 Triton 写出一个把「读数据 → 求最大值 → 指数 → 归一化 → 写回」捏成一个 Kernel 的 Fused Softmax，并用 torch.cuda.Event 精准测量它比原生拆开写快了多少倍、有效 HBM 带宽飙升到多少 GB/s。',
    checklist: [
      {
        id: 't5-c1',
        text: '在云端 GPU 运行下方 triton_fused_softmax.py，确认自写算子输出与 torch.softmax 误差 < 1e-5',
      },
      {
        id: 't5-c2',
        text: '对比「未融合拆开写」与「Triton 融合算子」的耗时（ms）与实测有效带宽（GB/s）',
      },
      {
        id: 't5-c3',
        text: '思考：为什么总计算量完全一样，Triton 融合后速度却能快 2~3 倍？（印证第 4.3 课算子融合直觉）',
      },
    ],
    codeTitle: 'Triton Fused Softmax 融合算子与 torch.cuda.Event 精准计时脚本',
    codeFilename: 'triton_fused_softmax.py',
    language: 'python',
    code: `# triton_fused_softmax.py —— 30 行感受算子融合与 HBM 带宽压榨
import torch, triton
import triton.language as tl

@triton.jit
def fused_softmax_kernel(out_ptr, in_ptr, row_stride, n_cols, BLOCK_SIZE: tl.constexpr):
    row_idx = tl.program_id(0)
    col_offsets = tl.arange(0, BLOCK_SIZE)
    mask = col_offsets < n_cols

    # 1. 只从 HBM 读入片上 SRAM 一次！
    row = tl.load(in_ptr + row_idx * row_stride + col_offsets, mask=mask, other=-float('inf'))

    # 2. 减最大值、求指数、求和、除法全部锁在高速寄存器/SRAM 里一气呵成
    row_minus_max = row - tl.max(row, axis=0)
    numerator = tl.exp(row_minus_max)
    softmax_out = numerator / tl.sum(numerator, axis=0)

    # 3. 只写回 HBM 一次！
    tl.store(out_ptr + row_idx * row_stride + col_offsets, softmax_out, mask=mask)

def bench_event(fn, iters=100):
    for _ in range(10):
        fn()  # Warmup
    start, end = torch.cuda.Event(enable_timing=True), torch.cuda.Event(enable_timing=True)
    start.record()
    for _ in range(iters):
        fn()
    end.record()
    torch.cuda.synchronize()
    return start.elapsed_time(end) / iters  # ms

x = torch.randn(4096, 2048, device='cuda', dtype=torch.float32)
out = torch.empty_like(x)
BLOCK = triton.next_power_of_2(x.shape[1])

t_naive = bench_event(
    lambda: torch.exp(x - x.max(dim=-1, keepdim=True)[0])
    / torch.exp(x - x.max(dim=-1, keepdim=True)[0]).sum(dim=-1, keepdim=True)
)
t_triton = bench_event(
    lambda: fused_softmax_kernel[(x.shape[0],)](out, x, x.stride(0), x.shape[1], BLOCK_SIZE=BLOCK)
)
bytes_rw = 2 * x.numel() * x.element_size() / 1e9  # 理论最小读写 GB
print(f"未融合拆开写: {t_naive:.3f} ms | Triton 融合算子: {t_triton:.3f} ms (提速 {t_naive/t_triton:.2f}x)")
print(f"Triton 实测有效带宽: {bytes_rw / (t_triton / 1000):.1f} GB/s")`,
  },
  {
    id: 'lab-35-nano-vllm',
    labLevel: 'L3.5',
    stepNumber: '3.5',
    shortName: 'L3.5 进阶',
    title: '手改 Nano-vLLM & 复现真实工程瓶颈',
    tier: 'L3.5 硬核进阶',
    tierKey: 'l35',
    duration: '1~2 个周末',
    budget: '约 ¥15（云端单卡）',
    prerequisites: ['5.2', '5.7'],
    resumeOutput: '《Nano-vLLM 源码改造与缓存成本复盘》',
    goal: '跳过百万行工业级源码的阅读门槛，拆解轻量级推理引擎 Nano-vLLM 并动手改一处调度/缓存逻辑；随后仿照一线工程博客（Modal × Sakana AI），用公开长文档复现“前缀缓存复用”对 TTFT、P99 长尾延迟与每百万 Token 成本的量化改善。',
    checklist: [
      {
        id: 't35-c1',
        text: 'Clone 并跑通 Nano-vLLM 轻量级推理引擎，通读其核心调度器与 KV Block 分配管理代码',
      },
      {
        id: 't35-c2',
        text: '动手修改一处缓存命中或批处理调度逻辑，用同一套测试集验证功能正常且输出质量无损',
      },
      {
        id: 't35-c3',
        text: '参考 Modal × Sakana AI 缓存路由复盘思路，用公开长文档构造重复前缀请求，对照测试「关闭 vs 开启 Prefix Caching」的 TTFT、P99 长尾延迟与吞吐变化',
      },
      {
        id: 't35-c4',
        text: '固定显卡与测试条件，使用 vLLM Benchmark CLI 跑出规范对照表，并换算出每百万 Token 推理成本降幅（例如吞吐提升 +30% 对应单百万 Token 成本降低约 23%）',
      },
    ],
    codeTitle: 'Nano-vLLM 仓库拉取与 vLLM 官方 Benchmark CLI 对照压测命令',
    codeFilename: 'nano_vllm_bench.sh',
    language: 'bash',
    code: `# 1. 拉取轻量级推理引擎学习调度与缓存内核
git clone https://github.com/GeeeekExplorer/nano-vllm.git

# 2. 使用 vLLM 官方 Benchmark CLI 跑标准化对照压测
vllm bench serve --model Qwen/Qwen2.5-7B-Instruct --num-prompts 100 --max-concurrency 16 --ignore-eos`,
    references: [
      {
        label: 'Nano-vLLM 仓库（GitHub）',
        url: 'https://github.com/GeeeekExplorer/nano-vllm',
      },
      {
        label: 'vLLM 官方快速上手文档',
        url: 'https://docs.vllm.ai/en/stable/getting_started/quickstart.html',
      },
      {
        label: 'vLLM Benchmark CLI 文档',
        url: 'https://docs.vllm.ai/en/stable/benchmarking/cli.html',
      },
      {
        label: 'Modal × Sakana AI 缓存路由复盘',
        url: 'https://modal.com/blog/sakana-cache-routing',
      },
    ],
  },
  {
    id: 'lab-6-benchmark-portfolio',
    labLevel: 'L6',
    stepNumber: 6,
    shortName: '实战 6',
    title: '打包大厂级“端到端性能评测”作品集与报告模板',
    tier: 'L4 闭环',
    tierKey: 'l4',
    duration: '复试前 / 研一',
    budget: '¥0',
    prerequisites: ['8.4', '8.5'],
    resumeOutput: 'GitHub 评测仓库 + 镇站专栏文章',
    goal: '把前 5 个实战的数据、截图和排障心得按工业界大厂标准沉淀为一份结构化评测报告，发布到你的 SiliconNote 网站与 GitHub 仓库——复试面试或投实习简历时直接甩出链接，含金量远超普通课程设计。',
    checklist: [
      {
        id: 't6-c1',
        text: '汇总实战 1~5 的硬件软件环境快照、Roofline 理论极限与实测 TTFT/TPOT P50/P99 数据',
      },
      {
        id: 't6-c2',
        text: '套用下方大厂级评测报告 Markdown 模板（同步挂载于 Tab 2），填入你的 OOM 排障日志与 Nsight 截图',
      },
      {
        id: 't6-c3',
        text: '将完整评测报告、测试脚本与对比图发布至 GitHub 仓库与个人专栏，作为大厂面试核心作品集',
      },
    ],
    codeTitle: '大厂级性能评测报告标准 Markdown 模板（同步挂载到网页 Tab 2 一键复制）',
    codeFilename: 'llm_benchmark_report_template.md',
    language: 'markdown',
    code: BENCHMARK_REPORT_TEMPLATE,
  },
];

export const CHEATSHEET_CARDS = [
  {
    id: 'gpu-health',
    index: '01',
    title: '1. 显卡体检监控',
    subtitle: '区分“真计算满载”还是“显存搬运空转”',
    tag: 'nvidia-smi',
    accent: 'sky',
    language: 'bash',
    code: `nvidia-smi dmon -s pucm -d 1
# 或高频刷新经典面板
watch -n 0.5 nvidia-smi`,
    tip: '别信 GPU-Util 100%！同时看 pwr(功耗) 接近满载 TDP 才说明 Tensor Core 真吃饱了。',
  },
  {
    id: 'vllm-oom',
    index: '02',
    title: '2. vLLM OOM 调参三板斧',
    subtitle: '启动即爆显存时的最快止血参数组合',
    tag: 'vLLM 参数',
    accent: 'rose',
    language: 'bash',
    code: `--max-model-len 8192 \\
--gpu-memory-utilization 0.88 \\
--quantization awq  # 或 fp8`,
    tip: '先查是不是 max-model-len 默认 128K 把 KV 撑爆了；其次降并发或换 AWQ/FP8。',
  },
  {
    id: 'cuda-event-timing',
    index: '03',
    title: '3. 精准计时铁律',
    subtitle: 'CUDA Kernel 异步发射下的唯一精确测时姿势',
    tag: 'PyTorch Profiling',
    accent: 'emerald',
    language: 'python',
    code: `s, e = torch.cuda.Event(True), torch.cuda.Event(True)
s.record(); fn(); e.record()
torch.cuda.synchronize(); s.elapsed_time(e)`,
    tip: '严禁用 Python time.time() 直接测异步 GPU 算子！测前必须先跑 3~5 轮 Warmup。',
  },
  {
    id: 'nsys-profile',
    index: '04',
    title: '4. Nsight 系统抓包',
    subtitle: '生成时间轴报告，5 分钟定位性能气泡',
    tag: 'Nsight Systems',
    accent: 'amber',
    language: 'bash',
    code: `nsys profile -o out --trace=cuda,nvtx,osrt python run.py`,
    tip: '90% 的性能大病（CPU 瓶颈、同步锁、未重叠）看 nsys 时间轴 5 分钟就能抓现行。',
  },
  {
    id: 'nccl-hang',
    index: '05',
    title: '5. 多卡 NCCL 死锁排障',
    subtitle: '多机多卡推理/训练卡死时的标准定位环境变量',
    tag: '分布式通信',
    accent: 'indigo',
    language: 'bash',
    code: `export NCCL_DEBUG=INFO
export TORCH_DISTRIBUTED_DEBUG=DETAIL`,
    tip: '多卡卡死（Hang）且 Util 100% 不动，开 INFO 日志看最后一行，排查 if 分支不对称。',
  },
];

export const TROUBLESHOOTING_SCENARIOS = [
  {
    id: 'sc-1-fake-util',
    index: '01',
    title: '【情景 1】「假满载」迷案：GPU-Util 99%，但吞吐慢如蜗牛',
    symptom:
      '400W TDP 的 GPU 跑大模型推理，nvidia-smi 显示 GPU-Util=99%，但实时功耗仅 135W，吐字极慢。',
    options: [
      { key: 'A', text: '显卡已满载只能换更贵的卡' },
      {
        key: 'B',
        text: '假满载！大概率卡在 HBM 带宽或小算子碎片，立刻看功耗并用 DCGM / Nsight 定位真实瓶颈',
      },
      { key: 'C', text: '重启服务器解决' },
    ],
    correctKey: 'B',
    explanation:
      '选 B！GPU-Util 只代表采样窗口内有 Kernel 活跃的时间占比，不反映核心是否在干等数据；功耗远低于 TDP 是典型 Memory-bound 或未开 CUDA Graph 信号。',
    rescueCommand: `nvidia-smi dmon -s pucm\ndcgmi dmon -e 1001,1004,1005`,
    aiPrompt:
      '我的 400W GPU 跑大模型推理时 GPU-Util=99% 但功耗仅 135W，请结合 Batch=1 Decode 显存带宽墙和 CUDA Graph 未开启两个方向，给我一套 3 步排查清单。',
  },
  {
    id: 'sc-2-vllm-oom',
    index: '02',
    title: '【情景 2】「开机即爆」迷案：14GB 模型塞进 24GB 显卡报 OOM',
    symptom:
      '24GB 显卡用 vLLM 部署 Qwen2.5-7B（权重仅 14GB），启动瞬间直接报 CUDA Out of Memory 崩溃。',
    options: [
      { key: 'A', text: '显卡显存缩水了' },
      {
        key: 'B',
        text: '默认上下文上限（32K/128K）太大，vLLM 预分配的 KV Cache 撑爆了剩余 10GB 显存',
      },
      { key: 'C', text: 'CPU 内存不够' },
    ],
    correctKey: 'B',
    explanation:
      '选 B！调小 --max-model-len（如 8192）或改用 AWQ INT4 量化版瞬间解决。',
    rescueCommand: `vllm serve Qwen/Qwen2.5-7B-Instruct --max-model-len 8192 --gpu-memory-utilization 0.90`,
    aiPrompt:
      '我用 24GB 显卡跑 vLLM 部署 7B 模型报 CUDA OOM，以下是终端日志 [粘贴日志]。请帮我算出合理的 --max-model-len 和 --gpu-memory-utilization 参数。',
  },
  {
    id: 'sc-3-thermal-throttle',
    index: '03',
    title: '【情景 3】「3 分钟萎了」迷案：压测前快后慢，性能暴跌 30%',
    symptom:
      '连续压测前 2 分钟速度飞快，第 3 分钟起吐字速度突然断崖下降 30% 且一直维持低速。',
    options: [
      { key: 'A', text: '模型越写越累' },
      {
        key: 'B',
        text: '芯片结温撞上散热红线，触发硬件 DVFS 热节流降频（Thermal Throttling）',
      },
      { key: 'C', text: '硬盘满了' },
    ],
    correctKey: 'B',
    explanation:
      '选 B！用性能查询命令一秒即可看到 Thermal Slowdown: Active。',
    rescueCommand: `nvidia-smi -q -d PERFORMANCE | grep -A 10 'Clocks Throttle Reasons'`,
    aiPrompt:
      '我用 nvidia-smi 抓到压测 3 分钟后出现 SW Thermal Slowdown 且频率暴跌。请帮我写一段 Python 脚本每秒记录温度、频率与吞吐并画关联折线图。',
  },
  {
    id: 'sc-4-numa-imbalance',
    index: '04',
    title: '【情景 4】「偏心显卡」迷案：8 卡机器里 4~7 号卡延迟偏高',
    symptom:
      '双路 CPU 的 8 卡服务器上，GPU 0~3 表现完美，但 GPU 4~7 数据加载延迟明显偏高且抖动。',
    options: [
      { key: 'A', text: 'GPU 4~7 质量差' },
      {
        key: 'B',
        text: '跨 NUMA 节点远程访存！CPU 0 上的进程去喂挂在 CPU 1 下的 GPU 4~7',
      },
      { key: 'C', text: '网线松了' },
    ],
    correctKey: 'B',
    explanation:
      '选 B！用 nvidia-smi topo -m 确认亲和性，再用 numactl 就近绑核立竿见影。',
    rescueCommand: `nvidia-smi topo -m\nnumactl --cpunodebind=1 --membind=1 python run_gpu4.py`,
    aiPrompt:
      '这是我服务器的 `nvidia-smi topo -m` 和 `lscpu` 输出 [粘贴输出]。请告诉我每张 GPU 归属哪个 NUMA 节点，并生成对应的 `numactl` 启动命令。',
  },
  {
    id: 'sc-5-async-timer',
    index: '05',
    title: '【情景 5】「光速假象」迷案：PyTorch 矩阵乘测速只花 0.02ms',
    symptom:
      '用 t0 = time.time(); c = a @ b; t1 = time.time() 测大矩阵乘法只花 0.02ms，矩阵放大 10 倍时间也不变！',
    options: [
      { key: 'A', text: '硬件自动超频了' },
      {
        key: 'B',
        text: 'CUDA 执行是异步的，没加 torch.cuda.synchronize()，只测了 CPU 发指令的时间',
      },
      { key: 'C', text: 'Python 计时器坏了' },
    ],
    correctKey: 'B',
    explanation:
      '选 B！异步 GPU 计时必须强制同步或用 torch.cuda.Event，外加 3~5 轮 Warmup 预热。',
    rescueCommand: `start, end = torch.cuda.Event(True), torch.cuda.Event(True)\nstart.record(); c = a @ b; end.record(); torch.cuda.synchronize()`,
    aiPrompt:
      '请把这段 PyTorch 算子测试代码改写成大厂规范 Benchmark：含 5 轮 Warmup、用 torch.cuda.Event 测 50 轮、自动输出均值/P95/有效带宽(GB/s)。',
  },
  {
    id: 'sc-6-npu-fallback',
    index: '06',
    title: '【情景 6】「自研 NPU 龟速」迷案：模型跑通了，速度只有 GPU 的 1/4',
    symptom:
      '将开源大模型移植到自研 NPU 后精度全对，但速度只有同级 GPU 的 1/4，且主机 CPU 占用率飙升。',
    options: [
      { key: 'A', text: 'NPU 硬件彻底失败' },
      {
        key: 'B',
        text: '极可能存在不支持的新算子触发静默 CPU 回退（Operator Fallback），或小算子未融合/未开图下沉',
      },
      { key: 'C', text: 'Python 版本太低' },
    ],
    correctKey: 'B',
    explanation:
      '选 B！先用 PyTorch Profiler / msProf 抓包查算子设备分布，再查驱动气泡与片上存储双缓冲。',
    rescueCommand: `with torch.profiler.profile(activities=[ProfilerActivity.CPU, ProfilerActivity.CUDA]) as prof:\n    model(x)\nprof.export_chrome_trace('npu_trace.json')`,
    aiPrompt:
      '我将大模型适配到异构 NPU 后，Profiler 显示大量耗时在 CPU-Device 拷贝和细碎小 Kernel 间隙。请按优先级给我一套优化排查清单。',
  },
];

export const SOFTWARE_TOOL_CATEGORIES = [
  {
    id: 'tool-linux',
    index: '01',
    category: '1. Linux 与远程开发基建',
    shortCat: 'Linux 基建',
    tools: 'Ubuntu Bash / VS Code Remote-SSH / Cursor / tmux / Git / Conda & Docker',
    purpose: '远程直连云端显卡、后台防断网挂起、隔离 CUDA 环境、AI 结对排障',
    command: `tmux new -s test\n# Ctrl+B 再按 D 后台挂起 | tmux attach 恢复\ndf -h && free -h && tail -f log.txt`,
    language: 'bash',
  },
  {
    id: 'tool-netron-onnx',
    index: '02',
    category: '2. 模型结构与异构部署(NPU 岗刚需)',
    shortCat: 'Netron / ONNX',
    tools: 'Netron / ONNX & ONNX Runtime / llama.cpp (GGUF)',
    purpose: '一秒可视化大模型计算图查算子与张量 Shape；异构芯片模型导出与端侧部署（Ollama 底层）',
    command: `# 打开 https://netron.app 拖入 .onnx 文件看计算图\nllama-cli -m model.gguf -p "Hello"`,
    language: 'bash',
  },
  {
    id: 'tool-smi-dcgm',
    index: '03',
    category: '3. 显卡与系统听诊器',
    shortCat: 'DCGM / smi',
    tools: 'nvidia-smi / nvtop / gpustat / htop / perf / numactl / NVIDIA DCGM',
    purpose: '识破假 100% Util、抓热节流降频、查 CPU 负载与多卡拓扑亲和性',
    command: `nvidia-smi dmon -s pucm\nnvidia-smi topo -m\ndcgmi dmon -e 1001,1004,1005`,
    language: 'bash',
  },
  {
    id: 'tool-pyspy',
    index: '04',
    category: '4. Python/CPU 火焰图(抓 CPU 拖后腿)',
    shortCat: 'py-spy 火焰图',
    tools: 'py-spy / cProfile',
    purpose: 'GPU 空转而 CPU 满载时，无侵入实时生成 Python 火焰图，精准揪出慢分词或调度代码行',
    command: `py-spy top --pid <PID>\npy-spy record -o flame.svg --pid <PID>`,
    language: 'bash',
  },
  {
    id: 'tool-profilers',
    index: '05',
    category: '5. 性能剖析核武器(含国产/AMD 等价)',
    shortCat: 'nsys / msProf',
    tools: 'NVIDIA Nsight Systems (nsys) / Nsight Compute (ncu) / PyTorch Profiler + Perfetto / Meta HTA / 昇腾 msProf / AMD ROCprof',
    purpose: '宏观抓时间轴空白气泡（nsys）、微观画算子 Roofline（ncu）、多卡自动归因（HTA）及国产 NPU 剖析',
    command: `nsys profile -o rep --trace=cuda,nvtx,osrt python run.py\nncu --set full -o k_rep python run.py`,
    language: 'bash',
  },
  {
    id: 'tool-nccl',
    index: '06',
    category: '6. 多卡与集群通信测速(AI Infra 必会)',
    shortCat: 'nccl-tests / RDMA',
    tools: 'nccl-tests / perftest (ib_write_bw)',
    purpose: '直接测 NVLink / RDMA 真实裸带宽，30 秒定界“是网线/机房慢，还是业务代码慢”',
    command: `./build/all_reduce_perf -b 8 -e 1G -f 2 -g 8\nib_write_bw -d mlx5_0`,
    language: 'bash',
  },
  {
    id: 'tool-serving-kv',
    index: '07',
    category: '7. 推理引擎、压测与 KV 池化',
    shortCat: 'vLLM / Mooncake',
    tools: 'vLLM (vllm bench) / SGLang / Ollama / TensorRT-LLM / EvalScope / GenAI-Perf / Mooncake / LMCache / NVIDIA NIXL',
    purpose: '大模型部署、高并发 P99 与 Goodput 压测，以及 2026 前沿分布式 KV Cache 分级卸载与 PD 分离传输',
    command: `vllm serve Qwen/Qwen2.5-7B-Instruct\nvllm bench serve --num-prompts 100 --max-concurrency 16`,
    language: 'bash',
  },
  {
    id: 'tool-kernels-cpp',
    index: '08',
    category: '8. 算子优化与 C++ 底座',
    shortCat: 'Triton / TileLang',
    tools: 'OpenAI Triton / TileLang / CUTLASS (CuTe) / CMake + GDB',
    purpose: '类 Python 写融合算子（Triton/TileLang 跨 GPU/NPU）；读矩阵乘圣经（CUTLASS）；编译与查段错误',
    command: `# @triton.jit 写 Fused RMSNorm/Softmax\ncmake -B build && cmake --build build && gdb ./sim`,
    language: 'bash',
  },
  {
    id: 'tool-arch-sim',
    index: '09',
    category: '9. 架构建模与硬件仿真',
    shortCat: 'SystemC / Timeloop',
    tools: 'C++ & SystemC / MIT Timeloop & Accelergy / gem5 / GPGPU-Sim',
    purpose: '免写 Verilog 搭 Golden Model 与事务级/周期级模拟器，定量评估 PPA 与数据流映射',
    command: `# Timeloop YAML 描述存储层次一键跑映射能耗\n# SystemC SC_MODULE 搭建 TLM 性能模拟器`,
    language: 'bash',
  },
  {
    id: 'tool-viz-docs',
    index: '10',
    category: '10. 数据可视化与作品沉淀',
    shortCat: 'Matplotlib / 作品集',
    tools: 'Python (Pandas + Matplotlib / Plotly) / Markdown + VitePress (SiliconNote)',
    purpose: '自动清洗压测日志画出版级帕累托曲线与对比图，把排障报告沉淀成个人公开名片',
    command: `# 把压测 CSV 喂给 AI 一键生成高清双轴对比图脚本，推送 GitHub 自动上线 Vercel`,
    language: 'bash',
  },
];
