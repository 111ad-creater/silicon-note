// 全球 10 款代表 AI 芯片基准参数 & 任意 HuggingFace config.json X 光解剖引擎

export const AI_CHIPS_LADDER = [
  {
    id: 'h100-sxm',
    name: 'NVIDIA H100 SXM',
    vendor: 'NVIDIA',
    vramGB: 80,
    memType: 'HBM3',
    bwGBs: 3350,
    bf16Tflops: 989,
    tdpW: 700,
    hourlyUsd: 2.8,
    positioning: '数据中心标杆基准线',
    supportsFp8: true,
    supportsFp4: false,
  },
  {
    id: 'h200-sxm',
    name: 'NVIDIA H200 SXM',
    vendor: 'NVIDIA',
    vramGB: 141,
    memType: 'HBM3e',
    bwGBs: 4800,
    bf16Tflops: 989,
    tdpW: 700,
    hourlyUsd: 3.5,
    positioning: '大显存高带宽推理神卡',
    supportsFp8: true,
    supportsFp4: false,
  },
  {
    id: 'b200',
    name: 'NVIDIA B200',
    vendor: 'NVIDIA',
    vramGB: 192,
    memType: 'HBM3e',
    bwGBs: 8000,
    bf16Tflops: 2250,
    tdpW: 1000,
    hourlyUsd: 6.0,
    positioning: '新一代 FP4 旗舰天花板',
    supportsFp8: true,
    supportsFp4: true,
  },
  {
    id: 'rtx-4090',
    name: 'RTX 4090',
    vendor: 'NVIDIA',
    vramGB: 24,
    memType: 'GDDR6X',
    bwGBs: 1008,
    bf16Tflops: 165,
    tdpW: 450,
    hourlyUsd: 0.35,
    positioning: '消费级量化性价比王者',
    supportsFp8: true,
    supportsFp4: false,
  },
  {
    id: 'rtx-5090',
    name: 'RTX 5090',
    vendor: 'NVIDIA',
    vramGB: 32,
    memType: 'GDDR7',
    bwGBs: 1792,
    bf16Tflops: 209,
    tdpW: 575,
    hourlyUsd: 0.55,
    positioning: '平民单卡算力平权代表',
    supportsFp8: true,
    supportsFp4: true,
  },
  {
    id: 'ascend-910b',
    name: '华为昇腾 910B',
    vendor: 'Huawei',
    vramGB: 64,
    memType: 'HBM2e',
    bwGBs: 1600,
    bf16Tflops: 320,
    tdpW: 400,
    hourlyUsd: 1.2,
    positioning: '国产主力 NPU 标杆',
    supportsFp8: false,
    supportsFp4: false,
  },
  {
    id: 'ascend-910c',
    name: '华为昇腾 910C',
    vendor: 'Huawei',
    vramGB: 128,
    memType: 'HBM',
    bwGBs: 3200,
    bf16Tflops: 800,
    tdpW: 650,
    hourlyUsd: 2.2,
    positioning: '国产新一代高算力 NPU',
    supportsFp8: true,
    supportsFp4: false,
  },
  {
    id: 'amd-mi300x',
    name: 'AMD MI300X',
    vendor: 'AMD',
    vramGB: 192,
    memType: 'HBM3',
    bwGBs: 5300,
    bf16Tflops: 1307,
    tdpW: 750,
    hourlyUsd: 2.6,
    positioning: '超大显存省卡数代表',
    supportsFp8: true,
    supportsFp4: false,
  },
  {
    id: 'tpu-v6e',
    name: 'Google TPU v6e',
    vendor: 'Google',
    vramGB: 32,
    memType: 'HBM',
    bwGBs: 1600,
    bf16Tflops: 918,
    tdpW: 250,
    hourlyUsd: 1.35,
    positioning: '脉动阵列极致能效代表',
    supportsFp8: true,
    supportsFp4: false,
  },
  {
    id: 'groq-lpu',
    name: 'Groq LPU',
    vendor: 'Groq',
    vramGB: 0.23, // 230 MB SRAM
    memType: 'SRAM (230MB)',
    bwGBs: 80000,
    bf16Tflops: 188,
    tdpW: 285,
    hourlyUsd: 1.5,
    positioning: '纯片上 SRAM 极致低延迟',
    supportsFp8: true,
    supportsFp4: false,
  },
];

export const PRESET_MODELS_LADDER = [
  {
    id: 'qwen25-7b',
    name: 'Qwen2.5-7B-Instruct',
    isMoe: false,
    totalParamsB: 7.6,
    activeParamsB: 7.6,
    numLayers: 28,
    hiddenSize: 3584,
    numHeads: 28,
    numKvHeads: 4,
    maxContext: 131072,
    kvNote: 'GQA 7:1',
  },
  {
    id: 'llama3-70b',
    name: 'Llama-3-70B-Instruct',
    isMoe: false,
    totalParamsB: 70.6,
    activeParamsB: 70.6,
    numLayers: 80,
    hiddenSize: 8192,
    numHeads: 64,
    numKvHeads: 8,
    maxContext: 131072,
    kvNote: 'GQA 8:1',
  },
  {
    id: 'deepseek-v3-671b',
    name: 'DeepSeek-V3 (671B MoE)',
    isMoe: true,
    totalParamsB: 671,
    activeParamsB: 37,
    numLayers: 61,
    hiddenSize: 7168,
    numHeads: 128,
    numKvHeads: 128,
    maxContext: 131072,
    kvNote: 'MLA 低秩压缩 (~1/14)',
    isMla: true,
  },
];

/**
 * Parse arbitrary HuggingFace config.json into physical model metrics
 */
export function parseModelConfigJson(rawTextOrObj, customName = '自定义解析模型') {
  const cfg =
    typeof rawTextOrObj === 'string' ? JSON.parse(rawTextOrObj) : rawTextOrObj;
  if (!cfg || typeof cfg !== 'object') {
    throw new Error('config.json 必须是一个合法的 JSON 对象');
  }

  const L = Number(cfg.num_hidden_layers || cfg.n_layer || 32);
  const H = Number(cfg.hidden_size || cfg.n_embd || 4096);
  const I = Number(cfg.intermediate_size || H * 4);
  const Nq = Number(cfg.num_attention_heads || cfg.n_head || 32);
  const Nkv = Number(cfg.num_key_value_heads || Nq);
  const vocab = Number(cfg.vocab_size || 32000);
  const experts = Number(cfg.num_local_experts || cfg.n_routed_experts || 1);
  const activeExperts = Number(cfg.num_experts_per_tok || 1);
  const maxCtx = Number(cfg.max_position_embeddings || 32768);
  const headDim = Number(cfg.head_dim || Math.floor(H / Math.max(Nq, 1)));

  // Estimate transformer total & active params (in Billions)
  const attnPerLayer = 2 * H * H + 2 * H * (Nkv * headDim);
  const ffnSingleExpert = 3 * H * I; // SwiGLU 3 matrices
  const totalFfnPerLayer = experts > 1 ? experts * ffnSingleExpert : ffnSingleExpert;
  const activeFfnPerLayer = experts > 1 ? activeExperts * ffnSingleExpert : ffnSingleExpert;

  const embedParams = 2 * vocab * H;
  const totalParamsB = (embedParams + L * (attnPerLayer + totalFfnPerLayer)) / 1e9;
  const activeParamsB = (embedParams + L * (attnPerLayer + activeFfnPerLayer)) / 1e9;

  const isMoe = experts > 1;
  const gqaRatio = (Nq / Math.max(Nkv, 1)).toFixed(1);

  return {
    id: `custom-${Date.now()}`,
    name: customName,
    isMoe,
    totalParamsB: Number(totalParamsB.toFixed(1)),
    activeParamsB: Number(activeParamsB.toFixed(1)),
    numLayers: L,
    hiddenSize: H,
    numHeads: Nq,
    numKvHeads: Nkv,
    maxContext: maxCtx,
    kvNote: isMoe ? `MoE ${experts}选${activeExperts} · GQA ${gqaRatio}:1` : `GQA ${gqaRatio}:1`,
    rawConfig: cfg,
  };
}
