import React, { useState, useMemo, useEffect } from 'react';
import {
  Cpu,
  Trophy,
  FileCode2,
  X,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';
import {
  AI_CHIPS_LADDER,
  PRESET_MODELS_LADDER,
  parseModelConfigJson,
} from '../../data/chipLadder';

const PRECISION_OPTS = [
  { id: 'BF16', label: 'BF16 (2B)', bytes: 2 },
  { id: 'FP8', label: 'FP8 (1B)', bytes: 1 },
  { id: 'INT4', label: 'INT4 / AWQ (0.5B)', bytes: 0.5 },
];

const SAMPLE_CONFIG_JSON = `{
  "architectures": ["Qwen2ForCausalLM"],
  "num_hidden_layers": 64,
  "hidden_size": 5120,
  "intermediate_size": 27648,
  "num_attention_heads": 40,
  "num_key_value_heads": 8,
  "vocab_size": 152064,
  "max_position_embeddings": 131072
}`;

export default function Lab10ChipLadder({ preset, presetNonce }) {
  const [selectedModel, setSelectedModel] = useState(PRESET_MODELS_LADDER[1]); // default 70B
  const [precisionId, setPrecisionId] = useState('INT4');
  const [contextK, setContextK] = useState(8);
  const [concurrency, setConcurrency] = useState(16);
  const [sortBy, setSortBy] = useState('cost'); // 'cost' | 'speed' | 'efficiency'

  const [configModalOpen, setConfigModalOpen] = useState(false);
  const [configInput, setConfigInput] = useState(SAMPLE_CONFIG_JSON);
  const [configName, setConfigName] = useState('Qwen2.5-32B-Custom');
  const [configError, setConfigError] = useState('');

  // Receive raw_config passed from AI Radar ("送入芯片天梯算成本")
  useEffect(() => {
    if (!preset) return;
    if (preset.raw_config && typeof preset.raw_config === 'object') {
      try {
        const parsed = parseModelConfigJson(
          preset.raw_config,
          preset.hf_repo || preset.name || 'AI 雷达导入模型'
        );
        setSelectedModel(parsed);
        setConfigError('');
      } catch {
        // ignore malformed external config
      }
    }
  }, [preset, presetNonce]);

  const handleParseConfig = () => {
    try {
      const parsed = parseModelConfigJson(configInput, configName.trim() || '自定义模型');
      setSelectedModel(parsed);
      setConfigError('');
      setConfigModalOpen(false);
    } catch (err) {
      setConfigError(err?.message || 'JSON 解析失败，请检查格式');
    }
  };

  const rows = useMemo(() => {
    const prec = PRECISION_OPTS.find((p) => p.id === precisionId) || PRECISION_OPTS[2];
    const totalWeightsGB = selectedModel.totalParamsB * prec.bytes;
    const activeWeightsGB = selectedModel.activeParamsB * prec.bytes;

    // Estimate KV Cache per token (BF16 = 2 * L * Nkv * headDim * 2 bytes, halved for MLA/FP8)
    const headDim = Math.floor(selectedModel.hiddenSize / Math.max(selectedModel.numHeads, 1));
    let kvBytesPerToken =
      2 * selectedModel.numLayers * selectedModel.numKvHeads * headDim * 2;
    if (selectedModel.isMla) {
      kvBytesPerToken = kvBytesPerToken / 14;
    }
    const kvCacheTotalGB = (kvBytesPerToken * contextK * 1024 * concurrency) / 1e9;
    const totalVramNeededGB = totalWeightsGB * 1.1 + kvCacheTotalGB; // +10% runtime overhead

    const calculated = AI_CHIPS_LADDER.map((chip) => {
      const minCards = Math.max(1, Math.ceil(totalVramNeededGB / chip.vramGB));
      // If chip is Groq LPU (230MB SRAM), cluster needs huge chip count
      const totalClusterBwGBs = chip.bwGBs * minCards * 0.72; // 72% realistic MBU across cluster

      // Decode weight read: Dense reads totalWeightsGB; MoE batch=1 reads activeWeightsGB + small router
      const singleUserMoveGB =
        (selectedModel.isMoe ? activeWeightsGB : totalWeightsGB) +
        kvCacheTotalGB / Math.max(1, concurrency);
      const singleUserLimitTps = (chip.bwGBs * minCards * 0.78) / Math.max(0.2, singleUserMoveGB);

      // Multi-user serving throughput estimate (Goodput under concurrency)
      const batchMoveGB =
        (selectedModel.isMoe
          ? Math.min(totalWeightsGB, activeWeightsGB * Math.min(concurrency, 6))
          : totalWeightsGB) + kvCacheTotalGB;
      const stepTimeSec = Math.max(
        batchMoveGB / totalClusterBwGBs,
        (2 * selectedModel.activeParamsB * concurrency) / (chip.bf16Tflops * minCards * 1000 * 0.45)
      );
      const totalTps = Math.max(1, concurrency / stepTimeSec);
      const hourlyClusterUsd = chip.hourlyUsd * minCards;
      const costPer1MTokens = hourlyClusterUsd / ((totalTps * 3600) / 1e6);
      const tokensPerJoule = totalTps / (chip.tdpW * minCards);

      return {
        chip,
        minCards,
        singleUserLimitTps,
        totalTps,
        costPer1MTokens,
        tokensPerJoule,
        hourlyClusterUsd,
      };
    });

    const sorted = [...calculated].sort((a, b) => {
      if (sortBy === 'speed') return b.singleUserLimitTps - a.singleUserLimitTps;
      if (sortBy === 'efficiency') return b.tokensPerJoule - a.tokensPerJoule;
      return a.costPer1MTokens - b.costPer1MTokens;
    });

    const bestCostId = [...calculated].sort(
      (a, b) => a.costPer1MTokens - b.costPer1MTokens
    )[0]?.chip.id;

    return {
      list: sorted,
      bestCostId,
      totalWeightsGB,
      activeWeightsGB,
      kvCacheTotalGB,
      totalVramNeededGB,
    };
  }, [selectedModel, precisionId, contextK, concurrency, sortBy]);

  return (
    <div className="space-y-6">
      {/* Top Controls */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120]/95 p-5 sm:p-6 space-y-5 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-mono text-emerald-600 dark:text-emerald-400">
              <Cpu className="w-4 h-4" />
              <span>10-CHIP COST & PERFORMANCE LADDER · 算力平权成本天梯</span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mt-1">
              当前解剖模型：{selectedModel.name}{' '}
              <span className="text-xs font-mono font-normal text-sky-500 ml-1">
                ({selectedModel.isMoe ? `总 ${selectedModel.totalParamsB}B / 激活 ${selectedModel.activeParamsB}B` : `${selectedModel.totalParamsB}B Dense`} · {selectedModel.kvNote})
              </span>
            </h2>
          </div>

          <button
            type="button"
            onClick={() => setConfigModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-sky-500 hover:bg-sky-400 text-slate-950 transition-colors shrink-0"
          >
            <FileCode2 className="w-4 h-4" />
            <span>粘贴任意模型 config.json X 光解剖</span>
          </button>
        </div>

        {/* Model Presets + Precision + Workload */}
        <div className="grid md:grid-cols-4 gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="space-y-1.5">
            <span className="text-[11px] font-mono text-slate-500">1. 选择代表模型</span>
            <div className="flex flex-col gap-1.5">
              {PRESET_MODELS_LADDER.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setSelectedModel(m)}
                  className={`text-left px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                    selectedModel.id === m.id
                      ? 'bg-sky-500/15 border-sky-400 text-sky-700 dark:text-sky-300 font-semibold'
                      : 'bg-slate-50 dark:bg-slate-900/70 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {m.name}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <span className="text-[11px] font-mono text-slate-500">2. 权重精度量化</span>
            <div className="flex flex-col gap-1.5">
              {PRECISION_OPTS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPrecisionId(p.id)}
                  className={`text-left px-3 py-1.5 rounded-lg text-xs font-mono border transition-colors ${
                    precisionId === p.id
                      ? 'bg-emerald-500/15 border-emerald-400 text-emerald-700 dark:text-emerald-300 font-semibold'
                      : 'bg-slate-50 dark:bg-slate-900/70 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-mono">
                <span>上下文长度</span>
                <strong className="text-sky-500">{contextK}K</strong>
              </div>
              <input
                type="range"
                min={2}
                max={64}
                step={2}
                value={contextK}
                onChange={(e) => setContextK(Number(e.target.value))}
                className="w-full silicon-slider bg-slate-200 dark:bg-slate-800"
              />
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-mono">
                <span>目标并发数</span>
                <strong className="text-emerald-500">{concurrency} 路</strong>
              </div>
              <input
                type="range"
                min={1}
                max={64}
                step={1}
                value={concurrency}
                onChange={(e) => setConcurrency(Number(e.target.value))}
                className="w-full silicon-slider bg-slate-200 dark:bg-slate-800"
              />
            </div>
          </div>

          <div className="rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 p-3.5 space-y-1.5 font-mono text-xs">
            <div className="text-[11px] text-slate-400">总显存需求拆解</div>
            <div>权重：{rows.totalWeightsGB.toFixed(1)} GB</div>
            <div>KV Cache：{rows.kvCacheTotalGB.toFixed(1)} GB</div>
            <div className="pt-1 border-t border-slate-200 dark:border-slate-800 font-bold text-sky-500">
              含开销合计：{rows.totalVramNeededGB.toFixed(1)} GB
            </div>
          </div>
        </div>
      </div>

      {/* Sort & Ladder Table */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120]/95 p-5 sm:p-6 space-y-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              全球 10 款 AI 芯片实时算账天梯排行榜
            </h3>
          </div>
          <div className="flex flex-wrap gap-1.5 text-xs font-mono">
            {[
              { id: 'cost', label: '按 $/1M Tokens 成本最低' },
              { id: 'speed', label: '按单人吐字最快' },
              { id: 'efficiency', label: '按能效比 Tokens/J 最高' },
            ].map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setSortBy(s.id)}
                className={`px-3 py-1.5 rounded-lg border transition-colors ${
                  sortBy === s.id
                    ? 'bg-sky-500 text-slate-950 border-sky-400 font-bold'
                    : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="bg-sky-500/10 dark:bg-sky-500/15 border-b border-sky-500/30 font-mono text-xs">
                <th className="py-3 px-3">芯片型号</th>
                <th className="py-3 px-3">显存 / 带宽</th>
                <th className="py-3 px-3">最少卡数</th>
                <th className="py-3 px-3">单人吐字上限</th>
                <th className="py-3 px-3">每百万 Token 成本</th>
                <th className="py-3 px-3">能效比</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/80 dark:divide-slate-800/80">
              {rows.list.map((r) => {
                const isBest = r.chip.id === rows.bestCostId;
                return (
                  <tr
                    key={r.chip.id}
                    className={`transition-colors ${
                      isBest
                        ? 'bg-emerald-500/[0.08] dark:bg-emerald-500/10'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-900/50'
                    }`}
                  >
                    <td className="py-3 px-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-slate-900 dark:text-white">
                          {r.chip.name}
                        </span>
                        {isBest && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500 text-slate-950">
                            性价比最优
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500">{r.chip.positioning}</div>
                    </td>
                    <td className="py-3 px-3 font-mono text-xs text-slate-600 dark:text-slate-300">
                      <div>
                        {r.chip.vramGB < 1 ? `${Math.round(r.chip.vramGB * 1000)}MB` : `${r.chip.vramGB}GB`} {r.chip.memType}
                      </div>
                      <div className="text-sky-600 dark:text-sky-400">
                        {r.chip.bwGBs.toLocaleString()} GB/s
                      </div>
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-slate-900 dark:text-white">
                      {r.minCards} 卡
                      <span className="block text-[10px] font-normal text-slate-400">
                        ${r.hourlyClusterUsd.toFixed(2)}/h
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono font-semibold text-sky-600 dark:text-sky-400">
                      {r.singleUserLimitTps.toFixed(1)} tok/s
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      ${r.costPer1MTokens.toFixed(3)}
                    </td>
                    <td className="py-3 px-3 font-mono text-xs text-amber-600 dark:text-amber-400">
                      {r.tokensPerJoule.toFixed(2)} T/J
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="rounded-xl bg-slate-100/80 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 p-3.5 flex items-start gap-2.5 text-xs text-slate-600 dark:text-slate-300">
          <Sparkles className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
          <span>
            说明：Dense 模型 Decode 单步搬运全部权重，MoE 模型仅搬运激活专家参数；消费级多卡需注意 NVLink 缺失带来的跨卡 TP AllReduce 通信惩罚。
          </span>
        </div>
      </div>

      {/* config.json X-Ray Modal */}
      {configModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm"
          onClick={() => setConfigModalOpen(false)}
        >
          <div
            className="w-full max-w-2xl rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0B1120] shadow-2xl p-5 sm:p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileCode2 className="w-4 h-4 text-sky-500" />
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  粘贴任意 HuggingFace 模型 config.json X 光解剖
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setConfigModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-mono text-slate-500">自定义模型名称</label>
              <input
                type="text"
                value={configName}
                onChange={(e) => setConfigName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs font-mono border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-mono text-slate-500">
                粘贴 config.json 内容（支持 num_hidden_layers / hidden_size / num_key_value_heads / num_local_experts 等字段）
              </label>
              <textarea
                rows={9}
                value={configInput}
                onChange={(e) => setConfigInput(e.target.value)}
                className="w-full p-3 rounded-xl text-xs font-mono border border-slate-200 dark:border-slate-800 bg-slate-950 text-emerald-300 focus:outline-none focus:border-sky-400"
              />
            </div>

            {configError && (
              <div className="flex items-center gap-2 text-xs text-rose-500 font-mono">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{configError}</span>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfigModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleParseConfig}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-sky-500 hover:bg-sky-400 text-slate-950"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>立即解剖并算成本</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
