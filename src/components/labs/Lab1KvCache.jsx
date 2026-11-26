import React, { useState, useMemo, useEffect } from 'react';
import {
  AlertOctagon,
  AlertTriangle,
  Cpu,
  HardDrive,
  Gauge,
  Sparkles,
  CheckCircle2,
  Sliders,
} from 'lucide-react';

const ATTENTION_MODES = [
  {
    id: 'mha',
    name: 'MHA（每人一本）',
    short: 'MHA',
    desc: '每个注意力头独享完整 Key/Value，每 Token 需存 0.50 MB（32层·32头）',
    bytesPerToken: 0.5 * 1024 * 1024,
    badge: '最占显存',
  },
  {
    id: 'gqa',
    name: 'GQA（分组拼桌）',
    short: 'GQA',
    desc: '每 4 个 Query 头共享 1 组 Key/Value，KV 显存与搬运量直接缩减为 1/4',
    bytesPerToken: 0.125 * 1024 * 1024,
    badge: '主流平衡',
  },
  {
    id: 'mla',
    name: 'DeepSeek MLA（浓缩密码本）',
    short: 'MLA',
    desc: '低秩联合压缩成 576 维潜向量缓存，单 Token 仅 ~0.035 MB（压缩 14.2 倍）',
    bytesPerToken: 0.03515625 * 1024 * 1024,
    badge: '极限省显存',
  },
];

const PRESETS = [
  { label: '日常对话 (4K · 8并发 · GQA)', ctx: 4, batch: 8, bw: 2000, attn: 'gqa' },
  { label: '短文本高并发 (2K · 64并发 · GQA)', ctx: 2, batch: 64, bw: 2400, attn: 'gqa' },
  { label: '64K 长文档 MHA 爆显存', ctx: 64, batch: 16, bw: 2000, attn: 'mha' },
  { label: 'DeepSeek MLA 极限瘦身 (64K · 32并发)', ctx: 64, batch: 32, bw: 2400, attn: 'mla' },
];

const HBM_CAPACITY_GB = 80;
const MODEL_WEIGHTS_GB = 16.0;
const CHIP_PEAK_TFLOPS = 312;

function parseCtxValue(raw) {
  if (typeof raw === 'number' && !Number.isNaN(raw)) return Math.min(128, Math.max(1, raw));
  if (typeof raw === 'string') {
    const cleaned = raw.trim().toUpperCase().replace(/K$/, '');
    const num = Number(cleaned);
    if (!Number.isNaN(num)) return Math.min(128, Math.max(1, num));
  }
  return null;
}

export default function Lab1KvCache({ preset, presetNonce }) {
  const [contextK, setContextK] = useState(8);
  const [concurrency, setConcurrency] = useState(16);
  const [bandwidthGBs, setBandwidthGBs] = useState(2000);
  const [attentionId, setAttentionId] = useState('gqa');

  useEffect(() => {
    if (!preset) return;
    const parsedCtx = parseCtxValue(preset.ctx);
    if (parsedCtx !== null) setContextK(parsedCtx);
    if (typeof preset.batch === 'number' && !Number.isNaN(preset.batch)) {
      setConcurrency(Math.min(64, Math.max(1, preset.batch)));
    }
    if (typeof preset.bw === 'number' && !Number.isNaN(preset.bw)) {
      setBandwidthGBs(Math.min(3000, Math.max(500, preset.bw)));
    }
    if (typeof preset.attn === 'string') {
      const lower = preset.attn.trim().toLowerCase();
      if (['mha', 'gqa', 'mla'].includes(lower)) {
        setAttentionId(lower);
      }
    }
  }, [preset, presetNonce]);

  const sim = useMemo(() => {
    const mode = ATTENTION_MODES.find((m) => m.id === attentionId) || ATTENTION_MODES[1];
    const totalTokens = contextK * 1024 * concurrency;

    const kvBytesTotal = totalTokens * mode.bytesPerToken;
    const kvCacheGB = kvBytesTotal / 1024 ** 3;
    const totalMemGB = MODEL_WEIGHTS_GB + kvCacheGB;
    const isOOM = totalMemGB > HBM_CAPACITY_GB;
    const weightsPct = (MODEL_WEIGHTS_GB / HBM_CAPACITY_GB) * 100;
    const kvPctRaw = (kvCacheGB / HBM_CAPACITY_GB) * 100;
    const totalPct = (totalMemGB / HBM_CAPACITY_GB) * 100;

    const movedGB = MODEL_WEIGHTS_GB + kvCacheGB;
    const movedBytes = movedGB * 1e9;
    const memTimeMs = (movedGB / bandwidthGBs) * 1000;

    const denseFlops = 2 * 8e9 * concurrency;
    const attnFlops = 4 * 32 * 4096 * (contextK * 1024) * concurrency;
    const totalFlops = denseFlops + attnFlops;
    const compTimeMs = (totalFlops / (CHIP_PEAK_TFLOPS * 1e12)) * 1000;

    const stepTimeMs = Math.max(memTimeMs, compTimeMs);
    const arithmeticIntensity = totalFlops / movedBytes;
    const ridgePoint = (CHIP_PEAK_TFLOPS * 1e12) / (bandwidthGBs * 1e9);
    const achievedTflops = totalFlops / (stepTimeMs / 1000) / 1e12;

    const perUserTps = 1000 / stepTimeMs;
    const totalThroughputTps = perUserTps * concurrency;
    const isSloBreach = !isOOM && stepTimeMs > 50;

    let bottleneckStatus = 'memory';
    if (arithmeticIntensity >= ridgePoint * 0.95) {
      bottleneckStatus = 'compute';
    } else if (arithmeticIntensity >= ridgePoint * 0.5) {
      bottleneckStatus = 'balanced';
    }

    const maxBarMs = Math.max(memTimeMs, compTimeMs, 1);

    return {
      mode,
      kvCacheGB,
      totalMemGB,
      isOOM,
      isSloBreach,
      weightsPct,
      kvPctRaw,
      totalPct,
      movedGB,
      memTimeMs,
      compTimeMs,
      stepTimeMs,
      arithmeticIntensity,
      ridgePoint,
      achievedTflops,
      perUserTps,
      totalThroughputTps,
      bottleneckStatus,
      memBarPct: (memTimeMs / maxBarMs) * 100,
      compBarPct: (compTimeMs / maxBarMs) * 100,
    };
  }, [contextK, concurrency, bandwidthGBs, attentionId]);

  const applyPreset = (p) => {
    setContextK(p.ctx);
    setConcurrency(p.batch);
    setBandwidthGBs(p.bw);
    setAttentionId(p.attn);
  };

  return (
    <div className="space-y-6">
      {/* Sub-header & Quick Presets */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
          基准环境：<span className="font-mono text-slate-800 dark:text-slate-200">80GB HBM 显卡 · 312 TFLOPS 算力 · 8B FP16 模型（权重常驻 16.0 GB）</span>
        </p>

        <div className="flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.label}
              onClick={() => applyPreset(p)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120] hover:border-sky-400/60 text-slate-700 dark:text-slate-300 transition-colors"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Split Workspace */}
      <div className="grid lg:grid-cols-12 gap-6 items-start">
        {/* Left Control Panel */}
        <div className="lg:col-span-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120]/95 p-5 sm:p-6 space-y-6 shadow-sm">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-200 dark:border-slate-800">
            <Sliders className="w-4 h-4 text-sky-400" />
            <h2 className="font-bold text-base text-slate-900 dark:text-white">
              控制面板 · 调节系统负载与硬件参数
            </h2>
          </div>

          {/* Slider 1: Context Length */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
                上下文长度 (Context Length)
              </label>
              <span className="font-mono text-sm font-bold text-sky-600 dark:text-sky-400 bg-sky-500/10 px-2.5 py-0.5 rounded-md border border-sky-500/20">
                {contextK}K Tokens
              </span>
            </div>
            <input
              type="range"
              min={1}
              max={128}
              step={1}
              value={contextK}
              onChange={(e) => setContextK(Number(e.target.value))}
              className="w-full silicon-slider bg-slate-200 dark:bg-slate-800"
            />
            <div className="flex justify-between text-[11px] font-mono text-slate-400">
              <span>1K</span>
              <span>32K</span>
              <span>64K</span>
              <span>96K</span>
              <span>128K</span>
            </div>
          </div>

          {/* Slider 2: Concurrency */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
                并发用户数 (Batch Size)
              </label>
              <span className="font-mono text-sm font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-md border border-emerald-500/20">
                {concurrency} 路并发
              </span>
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
            <div className="flex justify-between text-[11px] font-mono text-slate-400">
              <span>1</span>
              <span>16</span>
              <span>32</span>
              <span>48</span>
              <span>64</span>
            </div>
          </div>

          {/* Slider 3: Memory Bandwidth */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
                显存带宽 (HBM Bandwidth)
              </label>
              <span className="font-mono text-sm font-bold text-sky-600 dark:text-sky-400 bg-sky-500/10 px-2.5 py-0.5 rounded-md border border-sky-500/20">
                {bandwidthGBs} GB/s
              </span>
            </div>
            <input
              type="range"
              min={500}
              max={3000}
              step={50}
              value={bandwidthGBs}
              onChange={(e) => setBandwidthGBs(Number(e.target.value))}
              className="w-full silicon-slider bg-slate-200 dark:bg-slate-800"
            />
            <div className="flex justify-between text-[11px] font-mono text-slate-400">
              <span>500 (消费卡)</span>
              <span>1500 (A100低配)</span>
              <span>3000 GB/s (H100级)</span>
            </div>
          </div>

          {/* Radio Group: Attention Mechanism */}
          <div className="space-y-2.5 pt-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-200 block">
              注意力压缩机制 (Attention Architecture)
            </label>
            <div className="space-y-2.5">
              {ATTENTION_MODES.map((mode) => {
                const selected = attentionId === mode.id;
                return (
                  <label
                    key={mode.id}
                    className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                      selected
                        ? 'border-sky-400 bg-sky-500/10 dark:bg-sky-500/10 shadow-sm'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="attention-mode"
                      value={mode.id}
                      checked={selected}
                      onChange={() => setAttentionId(mode.id)}
                      className="mt-1 accent-sky-400"
                    />
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-sm text-slate-900 dark:text-white">
                          {mode.name}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800">
                          {mode.badge}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                        {mode.desc}
                      </p>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Live Visualization */}
        <div className="lg:col-span-7 space-y-6">
          {/* Card 1: 80GB HBM Memory Usage & OOM Warning */}
          <div
            className={`rounded-2xl border p-5 sm:p-6 transition-all space-y-4 ${
              sim.isOOM
                ? 'border-rose-500 bg-rose-500/5 dark:bg-rose-950/20 shadow-glow-oom'
                : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120]/95 shadow-sm'
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <HardDrive
                  className={`w-5 h-5 ${
                    sim.isOOM ? 'text-rose-500 animate-bounce' : 'text-sky-400'
                  }`}
                />
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  80GB HBM 显存占用情况（大书柜容量监控）
                </h3>
              </div>

              <div
                className={`font-mono text-sm font-bold px-3 py-1 rounded-lg border ${
                  sim.isOOM
                    ? 'bg-rose-500 text-white border-rose-400'
                    : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                }`}
              >
                {sim.totalMemGB.toFixed(1)} GB / 80.0 GB ({sim.totalPct.toFixed(1)}%)
              </div>
            </div>

            {sim.isOOM ? (
              <div className="rounded-xl border border-rose-500/50 bg-rose-500/15 p-3.5 flex items-start gap-3 text-rose-700 dark:text-rose-200">
                <AlertOctagon className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                <div className="text-xs leading-relaxed space-y-1">
                  <div className="font-bold text-sm text-rose-600 dark:text-rose-300 font-mono">
                    🚨 CUDA error: out of memory (OOM 爆显存！超出 {(sim.totalMemGB - 80).toFixed(1)} GB)
                  </div>
                  <p>
                    当前「备忘录 (KV Cache)」需要{' '}
                    <span className="font-mono font-bold">{sim.kvCacheGB.toFixed(1)} GB</span>
                    ，加上模型权重 16.0 GB 已彻底撑爆 80GB 大书柜！建议：切换{' '}
                    <span className="font-semibold">GQA / DeepSeek MLA</span>，或调低并发用户数与上下文长度。
                  </p>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/5 px-3.5 py-2.5 flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-300">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>
                  显存健康！剩余可用空间{' '}
                  <span className="font-mono font-bold">
                    {(80 - sim.totalMemGB).toFixed(1)} GB
                  </span>
                  ，可安全容纳当前 {concurrency} 路并发请求。
                </span>
              </div>
            )}

            {(() => {
              const weightsWidth = sim.isOOM
                ? (MODEL_WEIGHTS_GB / sim.totalMemGB) * 100
                : sim.weightsPct;
              const kvWidth = sim.isOOM
                ? Math.max(0, 100 - weightsWidth)
                : Math.min(100 - sim.weightsPct, sim.kvPctRaw);
              return (
                <div className="space-y-2">
                  <div className="relative h-8 w-full rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden flex">
                    <div
                      className="h-full bg-sky-500 flex items-center justify-center text-[11px] font-mono font-bold text-slate-950 transition-all duration-300 overflow-hidden whitespace-nowrap"
                      style={{ width: `${weightsWidth}%` }}
                      title={`模型权重: ${MODEL_WEIGHTS_GB} GB`}
                    >
                      {weightsWidth >= 10 ? '权重 16G' : ''}
                    </div>
                    <div
                      className={`h-full flex items-center justify-center text-[11px] font-mono font-bold transition-all duration-300 overflow-hidden whitespace-nowrap px-1 ${
                        sim.isOOM
                          ? 'bg-gradient-to-r from-amber-500 to-rose-600 text-white'
                          : 'bg-emerald-400 text-slate-950'
                      }`}
                      style={{ width: `${kvWidth}%` }}
                      title={`KV Cache: ${sim.kvCacheGB.toFixed(2)} GB`}
                    >
                      {kvWidth >= 12 ? `KV ${sim.kvCacheGB.toFixed(1)}G` : ''}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex flex-wrap items-center gap-4">
                      <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                        <span className="w-3 h-3 rounded bg-sky-500 inline-block" />
                        模型权重：<span className="font-mono font-semibold">16.0 GB</span>
                      </span>
                      <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                        <span
                          className={`w-3 h-3 rounded inline-block ${
                            sim.isOOM ? 'bg-rose-500' : 'bg-emerald-400'
                          }`}
                        />
                        KV Cache 备忘录：
                        <span className="font-mono font-semibold">{sim.kvCacheGB.toFixed(2)} GB</span>
                      </span>
                    </div>
                    <span className="font-mono text-slate-400">物理上限：80.0 GB HBM</span>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Card 2: Compute Time vs Memory Transfer Time */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120]/95 p-5 sm:p-6 space-y-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Gauge className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  单步 Decode 耗时拆解：算力耗时 vs 搬运耗时
                </h3>
              </div>

              {sim.bottleneckStatus === 'memory' && (
                <span className="px-3 py-1 rounded-full text-xs font-mono font-semibold bg-rose-500/15 text-rose-600 dark:text-rose-300 border border-rose-500/30">
                  🧱 撞上内存墙 (Memory-Bound)
                </span>
              )}
              {sim.bottleneckStatus === 'balanced' && (
                <span className="px-3 py-1 rounded-full text-xs font-mono font-semibold bg-amber-500/15 text-amber-600 dark:text-amber-300 border border-amber-500/30">
                  ⚖️ 趋近 Roofline 平衡点
                </span>
              )}
              {sim.bottleneckStatus === 'compute' && (
                <span className="px-3 py-1 rounded-full text-xs font-mono font-semibold bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30">
                  🔥 算力吃满 (Compute-Bound)
                </span>
              )}
            </div>

            {sim.isSloBreach && (
              <div className="rounded-xl border border-amber-500/45 bg-amber-500/10 px-3.5 py-2.5 flex items-center gap-2.5 text-xs text-amber-800 dark:text-amber-200">
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                <span>
                  <strong className="font-semibold">跌破流畅阅读 SLO 红线：</strong>
                  当前单字生成耗时 TPOT ≈ <span className="font-mono font-bold">{sim.stepTimeMs.toFixed(1)} ms</span>（超过 50ms 红线，仅{' '}
                  <span className="font-mono font-bold">{sim.perUserTps.toFixed(1)} tok/s</span>），用户体感开始明显卡顿，建议开启 MLA/量化或调低并发！
                </span>
              </div>
            )}

            <div className="space-y-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                    <span>🚚 搬运耗时 (从 HBM 搬 {sim.movedGB.toFixed(1)} GB 到书桌)</span>
                  </span>
                  <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                    {sim.memTimeMs.toFixed(2)} ms
                  </span>
                </div>
                <div className="h-5 w-full rounded-lg bg-slate-100 dark:bg-slate-900 overflow-hidden p-0.5 border border-slate-200 dark:border-slate-800">
                  <div
                    className="h-full rounded-md bg-gradient-to-r from-amber-500 to-rose-500 transition-all duration-300"
                    style={{ width: `${Math.max(3, sim.memBarPct)}%` }}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                    <Cpu className="w-3.5 h-3.5 text-sky-400" />
                    <span>🧠 算力耗时 (Tensor Core 312 TFLOPS 计算)</span>
                  </span>
                  <span className="font-mono font-bold text-sky-600 dark:text-sky-400">
                    {sim.compTimeMs.toFixed(2)} ms
                  </span>
                </div>
                <div className="h-5 w-full rounded-lg bg-slate-100 dark:bg-slate-900 overflow-hidden p-0.5 border border-slate-200 dark:border-slate-800">
                  <div
                    className="h-full rounded-md bg-gradient-to-r from-sky-500 to-cyan-400 transition-all duration-300"
                    style={{ width: `${Math.max(2, sim.compBarPct)}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800">
                <div className="text-[11px] text-slate-500 dark:text-slate-400">算术强度</div>
                <div className="text-base font-mono font-bold text-slate-900 dark:text-white mt-0.5">
                  {sim.arithmeticIntensity.toFixed(1)}
                </div>
                <div className="text-[10px] font-mono text-slate-400">
                  脊点 {sim.ridgePoint.toFixed(0)} FLOP/B
                </div>
              </div>

              <div
                className={`p-3 rounded-xl border transition-colors ${
                  sim.isSloBreach
                    ? 'bg-amber-500/15 border-amber-500/50'
                    : 'bg-slate-50 dark:bg-slate-900/80 border-slate-200/80 dark:border-slate-800'
                }`}
              >
                <div className="text-[11px] text-slate-500 dark:text-slate-400">单用户吐字速度</div>
                <div
                  className={`text-base font-mono font-bold mt-0.5 ${
                    sim.isSloBreach
                      ? 'text-amber-600 dark:text-amber-300'
                      : 'text-sky-600 dark:text-sky-400'
                  }`}
                >
                  {sim.isOOM ? 'OOM' : `${sim.perUserTps.toFixed(1)} tok/s`}
                </div>
                <div
                  className={`text-[10px] font-mono ${
                    sim.isSloBreach
                      ? 'text-amber-600 dark:text-amber-400 font-semibold'
                      : 'text-slate-400'
                  }`}
                >
                  TPOT ≈ {sim.stepTimeMs.toFixed(1)} ms {sim.isSloBreach ? '(>50ms)' : ''}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800">
                <div className="text-[11px] text-slate-500 dark:text-slate-400">系统总吞吐</div>
                <div className="text-base font-mono font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                  {sim.isOOM ? '中断' : `${sim.totalThroughputTps.toFixed(0)} tok/s`}
                </div>
                <div className="text-[10px] font-mono text-slate-400">
                  {concurrency} 路并发合计
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800">
                <div className="text-[11px] text-slate-500 dark:text-slate-400">等效发挥算力</div>
                <div className="text-base font-mono font-bold text-amber-600 dark:text-amber-400 mt-0.5">
                  {sim.achievedTflops.toFixed(1)} TFLOPS
                </div>
                <div className="text-[10px] font-mono text-slate-400">
                  利用率 {((sim.achievedTflops / CHIP_PEAK_TFLOPS) * 100).toFixed(1)}%
                </div>
              </div>
            </div>

            <div className="rounded-xl bg-slate-100/80 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 p-4 flex items-start gap-3">
              <Sparkles className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
              <div className="text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                <span className="font-semibold text-slate-900 dark:text-white">实时物理直觉解读：</span>
                {sim.memTimeMs > sim.compTimeMs ? (
                  <>
                    每生成一个字，大脑（Tensor Core）只需要{' '}
                    <span className="font-mono font-bold text-sky-500">{sim.compTimeMs.toFixed(2)} ms</span>{' '}
                    就算完了，但搬运工要花{' '}
                    <span className="font-mono font-bold text-amber-500">{sim.memTimeMs.toFixed(2)} ms</span>{' '}
                    才能把 16GB 权重和 KV Cache 从大书柜抱上书桌——
                    <span className="font-semibold">
                      大脑 {(100 - (sim.compTimeMs / sim.memTimeMs) * 100).toFixed(1)}% 的时间都在干等！
                    </span>
                    试着拉高「显存带宽」或增加「并发用户数」把算术强度往上推。
                  </>
                ) : (
                  <>
                    在当前高并发与大上下文下，搬运一次数据被 {concurrency} 个用户充分复用，算力耗时已追平并超过搬运耗时，芯片成功跨越脊点，进入了{' '}
                    <span className="font-semibold text-emerald-500">Compute-Bound 算力吃满区</span>！
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
