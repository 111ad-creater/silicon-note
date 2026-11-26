// Catalog of all 7 Interactive Labs and lesson-to-lab mapping configurations

export const LAB_TABS = [
  {
    id: 'lab1',
    number: 'Lab 1',
    title: 'KV Cache 与显存带宽',
    shortTitle: 'KV 显存带宽',
    moduleTag: '模块 5 · 8',
    desc: '上下文、并发与 MHA/GQA/MLA 对 80GB HBM 容量墙和带宽墙的冲击',
    linkedLessons: ['5.1', '5.3', '8.1'],
  },
  {
    id: 'lab2',
    number: 'Lab 2',
    title: 'GPU Warp & TPU 脉动阵列',
    shortTitle: 'GPU/TPU 沙盒',
    moduleTag: '模块 1',
    desc: 'SIMT 分支发散罚站动画、2:4 稀疏加速与 TPU 脉动阵列泵血气泡',
    linkedLessons: ['1.2', '1.3', '1.4'],
  },
  {
    id: 'lab3',
    number: 'Lab 3',
    title: '低精度显微镜 & 离群值',
    shortTitle: '低精度/量化',
    moduleTag: '模块 3',
    desc: 'FP32/FP16/BF16/FP8 比特拆解、面积平方级缩放与 SmoothQuant 削平巨人',
    linkedLessons: ['3.1', '3.2', '3.3'],
  },
  {
    id: 'lab4',
    number: 'Lab 4',
    title: 'Roofline 屋顶线诊断仪',
    shortTitle: 'Roofline 图',
    moduleTag: '模块 2 · 3 · 5',
    desc: '双对数坐标心电图：看 Batch、精度与 Prefill/Decode 如何决定瓶颈归属',
    linkedLessons: ['2.1', '2.2', '3.4', '3.5', '5.1'],
  },
  {
    id: 'lab5',
    number: 'Lab 5',
    title: 'vLLM 便利贴分页模拟器',
    shortTitle: 'vLLM 分页',
    moduleTag: '模块 5',
    desc: '左右分屏对比连续分配外部碎片 OOM 与 PagedAttention 离散便利贴',
    linkedLessons: ['5.2'],
  },
  {
    id: 'lab6',
    number: 'Lab 6',
    title: '训练显存与 ZeRO/重计算',
    shortTitle: '训练显存/ZeRO',
    moduleTag: '模块 6',
    desc: '解剖 16P 静态账单，亲手用 ZeRO-1/2/3 与重计算把显存压进 80GB H100',
    linkedLessons: ['6.1', '6.3', '6.4'],
  },
  {
    id: 'lab7',
    number: 'Lab 7',
    title: 'Nsight 时间轴抓气泡排障',
    shortTitle: 'Nsight 抓气泡',
    moduleTag: '模块 7 · 8',
    desc: '四大真实大厂性能故障病例：一键修复同步锁、CUDA Graph、Overlap 与跨机 TP',
    linkedLessons: ['7.3', '7.4', '8.2', '8.3'],
  },
];

const LAB_ALIAS_MAP = {
  '1': 'lab1',
  lab1: 'lab1',
  kv: 'lab1',
  '2': 'lab2',
  lab2: 'lab2',
  gpu_tpu: 'lab2',
  '3': 'lab3',
  lab3: 'lab3',
  precision: 'lab3',
  '4': 'lab4',
  lab4: 'lab4',
  roofline: 'lab4',
  '5': 'lab5',
  lab5: 'lab5',
  vllm: 'lab5',
  '6': 'lab6',
  lab6: 'lab6',
  train: 'lab6',
  '7': 'lab7',
  lab7: 'lab7',
  nsight: 'lab7',
};

export function normalizeLabId(raw) {
  if (!raw) return 'lab1';
  const key = String(raw).trim().toLowerCase();
  return LAB_ALIAS_MAP[key] || 'lab1';
}

export function parseInitialRouteFromUrl() {
  if (typeof window === 'undefined') {
    return { page: 'home', activeLab: 'lab1', preset: null, lessonId: null };
  }
  try {
    const params = new URLSearchParams(window.location.search);
    const pageParam = params.get('page');
    const rawLab = params.get('activeLab') || params.get('lab');
    const lessonId = params.get('lesson');

    const preset = {};
    for (const [k, v] of params.entries()) {
      if (k !== 'page' && k !== 'activeLab' && k !== 'lab' && k !== 'lesson') {
        if (v === 'true') preset[k] = true;
        else if (v === 'false') preset[k] = false;
        else if (v !== '' && !Number.isNaN(Number(v))) preset[k] = Number(v);
        else preset[k] = v;
      }
    }

    const hasPreset = Object.keys(preset).length > 0;
    const activeLab = rawLab ? normalizeLabId(rawLab) : 'lab1';
    const page =
      pageParam || (rawLab ? 'lab' : lessonId ? 'docs' : 'home');

    return {
      page,
      activeLab,
      preset: hasPreset ? preset : null,
      lessonId,
    };
  } catch {
    return { page: 'home', activeLab: 'lab1', preset: null, lessonId: null };
  }
}

export function syncLabUrl(page, activeLab, preset) {
  if (typeof window === 'undefined') return;
  try {
    if (page !== 'lab') {
      if (window.location.search) {
        window.history.replaceState(null, '', window.location.pathname);
      }
      return;
    }
    const params = new URLSearchParams();
    params.set('page', 'lab');
    params.set('activeLab', normalizeLabId(activeLab));
    if (preset && typeof preset === 'object') {
      Object.entries(preset).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') {
          params.set(k, String(v));
        }
      });
    }
    const nextSearch = `?${params.toString()}`;
    if (window.location.search !== nextSearch) {
      window.history.replaceState(null, '', `${window.location.pathname}${nextSearch}`);
    }
  } catch {
    // ignore history errors
  }
}

// 18 mapping entries covering the mapped curriculum lessons (including 2.1/2.2, 3.1/3.2, 8.2/8.3 pairs)
export const LESSON_LAB_WIDGETS = {
  '1.2': {
    lessonId: '1.2',
    labId: 'lab2',
    labLabel: 'Lab 2 · GPU/TPU 沙盒',
    title: '体验 SIMT 分支发散“一半线程罚站”',
    desc: '一键切换 Warp 内 32 个线程的 if-else 分支比例，观察为什么分支一分叉，有效算力利用率瞬间腰斩至 50%。',
    widgetType: 'gpu_divergence',
    defaultPreset: { mode: 'gpu_warp', divergence: 50 },
  },
  '1.3': {
    lessonId: '1.3',
    labId: 'lab2',
    labLabel: 'Lab 2 · GPU/TPU 沙盒',
    title: '触发 2:4 结构化稀疏跳过 50% 零值',
    desc: '亲手点开 Tensor Core 的 2:4 稀疏硬件引擎，看矩阵块如何丢掉一半零值，让等效算力瞬间翻倍到 2.0x。',
    widgetType: 'gpu_sparsity',
    defaultPreset: { mode: 'gpu_warp', sparsity: true },
  },
  '1.4': {
    lessonId: '1.4',
    labId: 'lab2',
    labLabel: 'Lab 2 · GPU/TPU 沙盒',
    title: '切换 Batch=1 vs Batch=8 看脉动网格填满率',
    desc: '直观对比 TPU 4×4 脉动阵列在单兵（Batch=1）与满载流水线（Batch=8）下的时钟拍数与平均利用率差异。',
    widgetType: 'tpu_batch',
    defaultPreset: { mode: 'tpu_systolic', batch: 1 },
  },
  '2.1': {
    lessonId: '2.1',
    labId: 'lab4',
    labLabel: 'Lab 4 · Roofline 诊断仪',
    title: '对比 GDDR vs HBM3e 对 Roofline 斜坡的抬升',
    desc: '片外带宽越宽，Roofline 屋顶线左侧斜坡抬得越高！切换显存规格，看搬运墙对单字生成速度的决定性影响。',
    widgetType: 'mem_roofline',
    defaultPreset: { chip: 'H100', stage: 'decode' },
  },
  '2.2': {
    lessonId: '2.2',
    labId: 'lab4',
    labLabel: 'Lab 4 · Roofline 诊断仪',
    title: '切换 GDDR vs HBM3e 对比斜坡抬升幅度',
    desc: '直观对比消费级 GDDR6X (1.0 TB/s)、H100 HBM3 (3.35 TB/s) 与 B200 HBM3e (8.0 TB/s) 的带宽斜坡抬升与吐字极限。',
    widgetType: 'mem_roofline',
    defaultPreset: { chip: 'H100', stage: 'decode' },
  },
  '3.1': {
    lessonId: '3.1',
    labId: 'lab3',
    labLabel: 'Lab 3 · 低精度显微镜',
    title: '拆解 FP32 / FP16 / BF16 / FP8 比特条与芯片面积',
    desc: '点击切换不同浮点格式，观察尾数位宽如何按平方规律把乘法器硅片面积从 100% 缩小到 9.3%。',
    widgetType: 'bit_microscope',
    defaultPreset: { format: 'BF16', compare: 'FP16' },
  },
  '3.2': {
    lessonId: '3.2',
    labId: 'lab3',
    labLabel: 'Lab 3 · 低精度显微镜',
    title: '一键对比 FP32 / FP16 / BF16 / FP8 比特条与乘法器面积',
    desc: '亲眼对比 BF16（8位指数保范围）与 FP16（10位尾数保精度），理解低精度算力暴涨的物理电路根源。',
    widgetType: 'bit_microscope',
    defaultPreset: { format: 'BF16', compare: 'FP16' },
  },
  '3.3': {
    lessonId: '3.3',
    labId: 'lab3',
    labLabel: 'Lab 3 · 低精度显微镜',
    title: '点击「开启 SmoothQuant」削平 10 米巨人离群值',
    desc: '看看 1 个 10x 的离群值如何把正常激活值全挤成 0，再一键开启 ÷√K 平滑迁移拯救量化误差。',
    widgetType: 'smoothquant',
    defaultPreset: { tab: 'outlier', smoothquant: true },
  },
  '3.4': {
    lessonId: '3.4',
    labId: 'lab4',
    labLabel: 'Lab 4 · Roofline 诊断仪',
    title: '拖动 Batch 滑块看红点从斜坡爬上屋顶',
    desc: '以 H100（脊点 295 FLOPs/B）为例，拖动 Batch Size 感受任务如何从 Memory-Bound 一步步爬过拐点。',
    widgetType: 'roofline_batch',
    defaultPreset: { chip: 'H100', batch: 1, stage: 'decode' },
  },
  '3.5': {
    lessonId: '3.5',
    labId: 'lab4',
    labLabel: 'Lab 4 · Roofline 诊断仪',
    title: '一键载入 Llama-3 70B (BF16 / INT4) 算极限吐字',
    desc: '用 H100 3.35 TB/s 带宽做纸面算账：直观对比 70B 模型在 BF16 (140GB) 与 INT4 (35GB) 下的 Batch=1 理论极限。',
    widgetType: 'paper_math_70b',
    defaultPreset: { model: '70B', precision: 'INT4', chip: 'H100', stage: 'decode', batch: 1 },
  },
  '5.1': {
    lessonId: '5.1',
    labId: 'lab4',
    labLabel: 'Lab 4 · Roofline 诊断仪',
    title: '一键切换「读题 Prefill」vs「写字 Decode」看红点跳跃',
    desc: '亲眼看同一个模型在 Prefill（稳居算力平顶）与 Decode（跌落带宽斜坡）之间跨越数千倍算术强度的剧烈跳跃。',
    widgetType: 'prefill_decode',
    defaultPreset: { chip: 'H100', stage: 'prefill', batch: 1 },
  },
  '5.2': {
    lessonId: '5.2',
    labId: 'lab5',
    labLabel: 'Lab 5 · vLLM 分页动画',
    title: '体验「+新请求」：传统碎片 OOM vs vLLM 便利贴',
    desc: '模拟高并发请求进出显存池，看左侧连续分配如何因外部碎片拒接请求，而右侧便利贴严丝合缝。',
    widgetType: 'vllm_mini',
    defaultPreset: { mode: 'compare', autoDemo: true },
  },
  '5.3': {
    lessonId: '5.3',
    labId: 'lab1',
    labLabel: 'Lab 1 · KV 显存带宽模拟',
    title: '一键对比 MHA → GQA → MLA 在 64K 长度下的显存骤降',
    desc: '同样 64K 超长上下文，看看 DeepSeek MLA 如何把狂吃数百 GB 的 KV Cache 压缩 14 倍塞进单卡。',
    widgetType: 'kv_attn_64k',
    defaultPreset: { ctx: 64, attn: 'mla' },
  },
  '6.1': {
    lessonId: '6.1',
    labId: 'lab6',
    labLabel: 'Lab 6 · 训练显存沙盒',
    title: '切换 7B / 70B 看优化器如何吃掉 75% 静态显存',
    desc: '直观拆解 AdamW 混合精度训练的 16P 公式：权重 2P、梯度 2P、优化器状态独占 12P！',
    widgetType: 'train_16p',
    defaultPreset: { model: '7B', gpus: 1, zero: 'ddp' },
  },
  '6.3': {
    lessonId: '6.3',
    labId: 'lab6',
    labLabel: 'Lab 6 · 训练显存沙盒',
    title: '一键勾选「选择性重计算」看激活值柱子暴降 60%',
    desc: '用仅 5% 的额外计算时间换取 60% 的激活值显存空间，亲手验证时间换空间的超高性价比。',
    widgetType: 'train_recompute',
    defaultPreset: { model: '7B', ckpt: 'selective', gpus: 1, zero: 'ddp' },
  },
  '6.4': {
    lessonId: '6.4',
    labId: 'lab6',
    labLabel: 'Lab 6 · 训练显存沙盒',
    title: '依次点击 ZeRO-1 → 2 → 3 看单卡显存从 OOM 变绿',
    desc: '以 13B 模型在 8 张 80GB H100 上训练为例，逐级开启切分魔法，观察单卡显存一步步跌破 80GB 红线。',
    widgetType: 'train_zero',
    defaultPreset: { model: '13B', gpus: 8, zero: 'zero2' },
  },
  '7.3': {
    lessonId: '7.3',
    labId: 'lab7',
    labLabel: 'Lab 7 · Nsight 抓气泡',
    title: '切换「跨机 TP」vs「机内 NVLink TP」看通信条暴涨',
    desc: '把需要高频 AllReduce 的张量并行误放到跨机网卡（100 GB/s）上，通信条瞬间膨胀 9 倍拖垮整张卡！',
    widgetType: 'nsight_tp',
    defaultPreset: { scene: 'cross_node_tp' },
  },
  '7.4': {
    lessonId: '7.4',
    labId: 'lab7',
    labLabel: 'Lab 7 · Nsight 抓气泡',
    title: '一键开启「Overlap 重叠」看通信时间彻底消失',
    desc: '把 Track 3 的 40ms NCCL 通信条并行塞进 Track 2 的 100ms 计算条下方，让单步耗时从 140ms 骤降至 100ms。',
    widgetType: 'nsight_overlap',
    defaultPreset: { scene: 'no_overlap' },
  },
  '8.1': {
    lessonId: '8.1',
    labId: 'lab1',
    labLabel: 'Lab 1 · KV 显存带宽模拟',
    title: '拖动并发数观察 TPOT 突破 50ms 流畅阅读红线',
    desc: '体验延迟与吞吐的跷跷板：Batch 拉大时系统总吞吐飙升，但单字生成耗时一旦超过 50ms，用户就会感到明显卡顿。',
    widgetType: 'slo_tpot',
    defaultPreset: { batch: 32, ctx: 8 },
  },
  '8.2': {
    lessonId: '8.2',
    labId: 'lab7',
    labLabel: 'Lab 7 · Nsight 抓气泡',
    title: '一键修复「隐式同步锁 / 未开 CUDA Graph」消除气泡',
    desc: '把排查逻辑搬进 Nsight 时间轴：看看删掉 `.item()` 同步锁或开启 CUDA Graph 后，GPU 气泡如何瞬间闭合。',
    widgetType: 'nsight_debug',
    defaultPreset: { scene: 'cuda_graph' },
  },
  '8.3': {
    lessonId: '8.3',
    labId: 'lab7',
    labLabel: 'Lab 7 · Nsight 抓气泡',
    title: '一键修复「隐式同步锁 / 未开 CUDA Graph」消除气泡',
    desc: '实战抓犯人：开启 CUDA Graph 将 20 根零碎小 Kernel 合并为紧凑长条，CPU 发射耗时直接暴降 85%。',
    widgetType: 'nsight_debug',
    defaultPreset: { scene: 'cuda_graph' },
  },
};
