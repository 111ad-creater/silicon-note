// 15 大 AI Infra 高频报错极速诊断台（Error Decoder）

export const INFRA_ERRORS = [
  {
    id: 'err-cuda-oom',
    keyword: 'CUDA out of memory / OutOfMemoryError',
    category: '显存容量',
    rootCause:
      '模型权重 + KV Cache 预分配空间 + 临时激活值总需求突破 GPU 物理显存上限；最常见于 vLLM 默认把 --max-model-len 拉满 32K/128K 撑爆 24GB 显卡。',
    commands: [
      'vllm serve MODEL --max-model-len 8192 --gpu-memory-utilization 0.88',
      'nvidia-smi --query-gpu=memory.used,memory.total --format=csv',
      'vllm serve MODEL-AWQ --quantization awq',
    ],
    lessonId: '5.2',
  },
  {
    id: 'err-linux-oom-killer',
    keyword: 'Linux OOM Killer (Killed / dmesg Out of memory)',
    category: '主机内存',
    rootCause:
      '并非显存爆了，而是主机系统 RAM（CPU 内存）被多进程加载权重、CPU Offload 或分词缓存吃光，Linux 内核触发 OOM Killer 强杀 Python 主进程。',
    commands: [
      'dmesg -T | grep -i -E "oom|killed process"',
      'free -h && watch -n 1 free -m',
      'export OMP_NUM_THREADS=4  # 限制多进程内存膨胀',
    ],
    lessonId: '4.7',
  },
  {
    id: 'err-nccl-timeout',
    keyword: 'NCCL Watchdog timeout / ProcessGroupNCCL timed out',
    category: '多卡通信',
    rootCause:
      '多卡集合通信出现分支不对称（某张卡没进 AllReduce 导致死锁）、个别慢节点 Straggler 卡死，或跨机 RDMA/防火墙端口被拦截。',
    commands: [
      'export NCCL_DEBUG=INFO && export TORCH_DISTRIBUTED_DEBUG=DETAIL',
      './build/all_reduce_perf -b 8 -e 1G -f 2 -g 8',
      'ib_write_bw -d mlx5_0',
    ],
    lessonId: '8.6',
  },
  {
    id: 'err-illegal-memory',
    keyword: 'CUDA error: an illegal memory access was encountered',
    category: '算子/内核',
    rootCause:
      '自定义 CUDA/Triton Kernel 数组越界、Mask 边界未拦截或索引溢出；由于 CUDA 异步发射，报错行号往往滞后于真正越界的算子。',
    commands: [
      'CUDA_LAUNCH_BLOCKING=1 python run.py  # 同步抓出真实出错行',
      'compute-sanitizer --tool memcheck python run.py',
      'TORCH_USE_CUDA_DSA=1 python run.py',
    ],
    lessonId: '8.3',
  },
  {
    id: 'err-thermal-slowdown',
    keyword: 'SW Thermal Slowdown Active (压测几分钟后速度掉 30%)',
    category: '硬件散热/DVFS',
    rootCause:
      '满载持续压测下芯片结温突破 85℃ 红线，硬件自动激活 DVFS 热节流降压降频保命，导致算力与带宽同步暴跌。',
    commands: [
      'nvidia-smi -q -d PERFORMANCE | grep -A 10 "Clocks Throttle Reasons"',
      'nvidia-smi dmon -s ptc -d 1  # 实时监控功耗/温度/频率',
      'nvidia-smi -pl 350  # 适度限制功耗上限避免撞温度墙',
    ],
    lessonId: '8.6',
  },
  {
    id: 'err-fake-util',
    keyword: '假 99% GPU-Util（Util 满但功耗仅 TDP 三分之一、吞吐极低）',
    category: '性能假象',
    rootCause:
      'GPU-Util 只统计窗口内有 Kernel 活跃的时长，不代表核心满载。通常处于严重 Memory-Bound（Batch=1 Decode）或大量碎算子空等。',
    commands: [
      'nvidia-smi dmon -s pucm -d 1',
      'dcgmi dmon -e 1001,1004,1005  # 看真实 Tensor Core 与 DRAM 占比',
      'nsys profile -o trace --trace=cuda,nvtx python run.py',
    ],
    lessonId: '8.6',
  },
  {
    id: 'err-cpu-bottleneck',
    keyword: 'CPU 100% 满载而 GPU 空转 (GPU-Util < 20%)',
    category: 'CPU 拖后腿',
    rootCause:
      '主线程 Python 调度、分词器（Tokenizer）、JSON 序列化或图像预处理阻塞，导致 GPU 吃不到数据在空闲气泡里发呆。',
    commands: [
      'py-spy top --pid <PID>',
      'py-spy record -o flame.svg --pid <PID>',
      'htop  # 观察单核是否打满',
    ],
    lessonId: '4.7',
  },
  {
    id: 'err-pcie-numa',
    keyword: 'PCIe 跨 NUMA 延迟抖动 (8 卡机器 4~7 号卡明显偏慢)',
    category: '系统拓扑',
    rootCause:
      'CPU 0 上的进程去喂挂在 CPU 1 下的 GPU 4~7，数据被迫跨越双路 CPU 互连总线绕路且未开启锁页内存 Pinned Memory。',
    commands: [
      'nvidia-smi topo -m',
      'numactl --cpunodebind=1 --membind=1 python run_gpu4.py',
      'lscpu | grep -i numa',
    ],
    lessonId: '4.7',
  },
  {
    id: 'err-npu-fallback',
    keyword: 'NPU Operator Fallback (自研 NPU 速度仅 GPU 1/4，CPU 飙高)',
    category: '异构 NPU',
    rootCause:
      '模型中夹杂未适配的新算子（如特殊 RoPE/RMSNorm），运行时悄悄回退到 CPU 计算并触发海量 PCIe 往返拷贝，或未开图下沉。',
    commands: [
      '# 用 PyTorch Profiler / msProf 查看 CPU-Device 算子设备分布',
      'python -c "import torch; print(prof.key_averages().table(sort_by=\'cpu_time_total\'))"',
      '# 使用 Netron 检查 ONNX 图节点并用 Triton/TileLang 补齐算子',
    ],
    lessonId: '4.6',
  },
  {
    id: 'err-loss-nan',
    keyword: '训练 Loss 突然变成 NaN / Inf (FP16 梯度溢出)',
    category: '数值精度',
    rootCause:
      'FP16 指数仅 5 位（最大 65504），未开启动态 Loss Scaling 或未做梯度裁剪，微小梯度下溢归零或激活值冲破 65504 上溢成 NaN。',
    commands: [
      '# 优先切换 BF16（8 位指数保动态范围）或开启 GradScaler',
      'torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)',
      'torch.autograd.set_detect_anomaly(True)  # 定位首个 NaN 算子',
    ],
    lessonId: '3.1',
  },
  {
    id: 'err-kv-preemption',
    keyword: 'vLLM KV Cache Preemption / Swapping Warning (并发吞吐骤降)',
    category: '推理调度',
    rootCause:
      '并发请求生成长度超预期导致物理 KV Block 耗尽，vLLM 被迫把部分进行中请求的 KV 抢占驱逐（Recompute 或 Swap 到 CPU）。',
    commands: [
      '# 日志出现 "Sequence group ... is preempted by PreemptionMode"',
      'vllm serve MODEL --max-num-seqs 32 --max-model-len 8192',
      'vllm serve MODEL --kv-cache-dtype fp8  # 开启 FP8 KV 直接扩容 2 倍',
    ],
    lessonId: '5.2',
  },
  {
    id: 'err-async-timer',
    keyword: 'PyTorch 矩阵乘测速仅 0.01ms 假象（放大矩阵耗时不变）',
    category: '评测造假',
    rootCause:
      'CUDA Kernel 发射是异步的，未调用 torch.cuda.synchronize() 就直接用 time.time() 相减，只测到了 CPU 把指令扔进队列的微秒级耗时。',
    commands: [
      's, e = torch.cuda.Event(enable_timing=True), torch.cuda.Event(enable_timing=True)',
      's.record(); out = fn(); e.record(); torch.cuda.synchronize()',
      'print(s.elapsed_time(e))  # 单位 ms，前需跑 5 轮 Warmup',
    ],
    lessonId: '5.7',
  },
  {
    id: 'err-triton-smem',
    keyword: 'triton.runtime.OutOfResources: shared memory / registers exceeded',
    category: '算子编译',
    rootCause:
      'Triton Kernel 设定的 BLOCK_SIZE 或 num_stages 过大，单 Block 申请的片上 Shared Memory 超出当前 SM 硬件上限（如 164KB/228KB）。',
    commands: [
      '# 减小 BLOCK_SIZE（如 4096 -> 2048）或降低 num_stages=2',
      'ncu --metrics launch__shared_mem_per_block_allocated python kernel.py',
      '@triton.autotune(configs=[...], key=["N"])  # 自动搜索合法分块',
    ],
    lessonId: '5.7',
  },
  {
    id: 'err-tc-unaligned',
    keyword: 'Tensor Core 未触发 / 算力利用率极低（维度未 8/16 对齐）',
    category: '算子对齐',
    rootCause:
      '矩阵维度 M/N/K 不是 8 或 16（FP8 需 16/32）的整数倍，导致 cuBLAS/CUTLASS 无法走 Tensor Core MMA 硬件指令，退化为慢速 CUDA Core 标量计算。',
    commands: [
      'ncu --metrics sm__pipe_tensor_cycles_active.avg.pct_of_peak_sustained_active python run.py',
      '# 将词表大小 vocab_size 或隐层维度 Pad 对齐到 64 / 128 的倍数',
      'torch.backends.cuda.matmul.allow_tf32 = True',
    ],
    lessonId: '1.3',
  },
  {
    id: 'err-agentic-io',
    keyword: 'Agentic Storage I/O 墙（前缀命中 90%+ 但 GPU 功耗极低在干等）',
    category: '2026 前沿卡点',
    rootCause:
      '多轮 Agent 将 100K+ 历史 KV 卸载到外部 DRAM/SSD 池后，网卡或 PCIe 从外部池疯狂拉取几十 GB 历史 KV 的 I/O 带宽成了新瓶颈。',
    commands: [
      '# 开启 FP8 KV Cache 量化直接把外部 I/O 搬运量砍半',
      '# 启用异步分层预取流水线（如 Mooncake / LMCache + NVIDIA NIXL）',
      'nvidia-smi dmon -s pmu  # 观察 pwr 掉至 25% TDP 而带宽跑满',
    ],
    lessonId: '5.8',
  },
];
