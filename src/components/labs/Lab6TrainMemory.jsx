import React, { useState, useEffect, useMemo } from 'react';
import { Flame, Sliders, AlertOctagon, CheckCircle2, Sparkles } from 'lucide-react';

const MODEL_SIZES = [
  { id: '7B', paramsB: 7, label: '7B' },
  { id: '13B', paramsB: 13, label: '13B' },
  { id: '32B', paramsB: 32, label: '32B' },
  { id: '70B', paramsB: 70, label: '70B' },
];

const GPU_COUNTS = [1, 2, 4, 8, 16, 64];

const ZERO_MODES = [
  {
    id: 'ddp',
    name: '传统 DDP（不切分）',
    desc: '每张卡都完整复制一份权重(2P)+梯度(2P)+优化器(12P)',
    commOverhead: '0%',
  },
  {
    id: 'zero1',
    name: 'ZeRO-1（切优化器）',
    desc: '仅把最肥的 12P 优化器状态均分给 N 张卡',
    commOverhead: '0% (同 DDP)',
  },
  {
    id: 'zero2',
    name: 'ZeRO-2（切优化器 + 梯度）',
    desc: '进一步把 2P 梯度也按卡数均分，单卡只保留 2P 权重 + (14P/N)',
    commOverhead: '0% (同 DDP)',
  },
  {
    id: 'zero3',
    name: 'ZeRO-3 / FSDP（全切分）',
    desc: '连 2P 权重也拆散分给 N 张卡，算一层才临时借一层，16P 全除以 N',
    commOverhead: '+50% (权重 AllGather)',
  },
];

const H100_LIMIT_GB = 80;

function normalizeZeroId(raw) {
  if (raw === 0 || raw === '0' || raw === 'ddp') return 'ddp';
  if (raw === 1 || raw === '1' || raw === 'zero1') return 'zero1';
  if (raw === 2 || raw === '2' || raw === 'zero2') return 'zero2';
  if (raw === 3 || raw === '3' || raw === 'zero3' || raw === 'fsdp') return 'zero3';
  return null;
}

export default function Lab6TrainMemory({ preset, presetNonce }) {
  const [modelId, setModelId] = useState('7B');
  const [gpuCount, setGpuCount] = useState(1);
  const [zeroId, setZeroId] = useState('ddp');
  const [ckptMode, setCkptMode] = useState('none'); // 'none' | 'selective' | 'full'

  useEffect(() => {
    if (!preset) return;
    if (typeof preset.model === 'string') {
      const up = preset.model.trim().toUpperCase();
      if (MODEL_SIZES.some((m) => m.id === up)) setModelId(up);
    }
    if (typeof preset.gpus === 'number' && !Number.isNaN(preset.gpus)) {
      const nearest = GPU_COUNTS.reduce((a, b) =>
        Math.abs(b - preset.gpus) < Math.abs(a - preset.gpus) ? b : a
      );
      setGpuCount(nearest);
    }
    const z = normalizeZeroId(preset.zero);
    if (z) setZeroId(z);
    if (preset.ckpt === 'none' || preset.ckpt === 'selective' || preset.ckpt === 'full') {
      setCkptMode(preset.ckpt);
    }
  }, [preset, presetNonce]);

  const sim = useMemo(() => {
    const model = MODEL_SIZES.find((m) => m.id === modelId) || MODEL_SIZES[0];
    const P = model.paramsB;
    const N = gpuCount;

    const baseWeights = 2 * P;
    const baseGrads = 2 * P;
    const baseOpt = 12 * P;
    const baseAct = 3.5 * P;
    const baselineTotal = baseWeights + baseGrads + baseOpt + baseAct;

    const weights = zeroId === 'zero3' ? baseWeights / N : baseWeights;
    const grads = zeroId === 'zero2' || zeroId === 'zero3' ? baseGrads / N : baseGrads;
    const opt = zeroId === 'ddp' ? baseOpt : baseOpt / N;

    const actFactor = ckptMode === 'full' ? 0.15 : ckptMode === 'selective' ? 0.4 : 1.0;
    const act = baseAct * actFactor;

    const currentTotal = weights + grads + opt + act;
    const isOOM = currentTotal > H100_LIMIT_GB;
    const saveMultiplier = baselineTotal / Math.max(0.1, currentTotal);

    const zeroObj = ZERO_MODES.find((z) => z.id === zeroId) || ZERO_MODES[0];
    const computeCost =
      ckptMode === 'full' ? '+30% (重算两遍前向)' : ckptMode === 'selective' ? '+5% (仅重算 Attention)' : '0%';

    // Smart chart scale so 80GB dashed line is always clearly visible
    const chartCeiling = Math.max(120, currentTotal * 1.2);

    return {
      P,
      N,
      baseWeights,
      baseGrads,
      baseOpt,
      baseAct,
      baselineTotal,
      weights,
      grads,
      opt,
      act,
      currentTotal,
      isOOM,
      saveMultiplier,
      commOverhead: zeroObj.commOverhead,
      computeCost,
      chartCeiling,
    };
  }, [modelId, gpuCount, zeroId, ckptMode]);

  const renderStackedColumn = (title, subtitle, segments, totalGB, chartCeiling) => {
    const cappedTotal = Math.min(totalGB, chartCeiling);
    const heightPct = (cappedTotal / chartCeiling) * 100;
    const isClipped = totalGB > chartCeiling;

    return (
      <div className="flex-1 flex flex-col items-center space-y-2 h-full justify-end">
        <div className="text-center">
          <div className="font-mono text-sm font-bold text-slate-900 dark:text-white">
            {totalGB.toFixed(1)} GB
          </div>
          {isClipped && (
            <div className="text-[10px] font-mono text-rose-500 font-semibold">
              (已封顶显示 · 严重爆仓)
            </div>
          )}
        </div>

        <div className="w-24 sm:w-28 h-64 rounded-xl bg-slate-100 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 relative flex flex-col justify-end overflow-hidden">
          <div
            className="w-full flex flex-col-reverse transition-all duration-500 ease-out"
            style={{ height: `${Math.max(4, heightPct)}%` }}
          >
            {segments.map((seg) => {
              const segPct = (seg.val / totalGB) * 100;
              return (
                <div
                  key={seg.label}
                  className={`${seg.color} w-full flex items-center justify-center text-[10px] font-mono font-bold text-slate-950 transition-all duration-500 overflow-hidden`}
                  style={{ height: `${Math.max(0, segPct)}%` }}
                  title={`${seg.label}: ${seg.val.toFixed(1)} GB`}
                >
                  {segPct >= 11 ? `${seg.short} ${seg.val.toFixed(0)}G` : ''}
                </div>
              );
            })}
          </div>
        </div>

        <div className="text-center">
          <div className="text-xs font-bold text-slate-800 dark:text-slate-200">{title}</div>
          <div className="text-[10px] font-mono text-slate-400">{subtitle}</div>
        </div>
      </div>
    );
  };

  const redLineBottomPct = (H100_LIMIT_GB / sim.chartCeiling) * 100;

  return (
    <div className="grid lg:grid-cols-12 gap-6 items-start">
      {/* Left Control Panel */}
      <div className="lg:col-span-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120]/95 p-5 sm:p-6 space-y-5 shadow-sm">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-200 dark:border-slate-800">
          <Sliders className="w-4 h-4 text-sky-400" />
          <h2 className="font-bold text-base text-slate-900 dark:text-white">
            训练配置 & 显存拯救开关
          </h2>
        </div>

        {/* Model Size */}
        <div className="space-y-2">
          <label className="text-xs font-mono font-semibold text-slate-500 dark:text-slate-400">
            训练模型规模 (参数量 P)
          </label>
          <div className="grid grid-cols-4 gap-2">
            {MODEL_SIZES.map((m) => (
              <button
                key={m.id}
                onClick={() => setModelId(m.id)}
                className={`py-2 rounded-xl text-xs font-mono font-bold border transition-all ${
                  modelId === m.id
                    ? 'bg-sky-500 text-slate-950 border-sky-400 shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* GPU Count N */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-mono font-semibold text-slate-500 dark:text-slate-400">
              并行 GPU 卡数 N (80GB H100)
            </label>
            <span className="font-mono text-xs font-bold text-emerald-500">
              {gpuCount} 张卡
            </span>
          </div>
          <div className="grid grid-cols-6 gap-1.5">
            {GPU_COUNTS.map((n) => (
              <button
                key={n}
                onClick={() => setGpuCount(n)}
                className={`py-2 rounded-lg text-xs font-mono font-bold border transition-all ${
                  gpuCount === n
                    ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                    : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        {/* ZeRO / FSDP Radio */}
        <div className="space-y-2">
          <label className="text-xs font-mono font-semibold text-slate-500 dark:text-slate-400">
            分布式切分策略 (DDP vs ZeRO / FSDP)
          </label>
          <div className="space-y-2">
            {ZERO_MODES.map((z) => {
              const selected = zeroId === z.id;
              return (
                <label
                  key={z.id}
                  className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                    selected
                      ? 'border-sky-400 bg-sky-500/10'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <input
                    type="radio"
                    name="zero-mode"
                    checked={selected}
                    onChange={() => setZeroId(z.id)}
                    className="mt-0.5 accent-sky-400"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        {z.name}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">
                        通信 {z.commOverhead}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      {z.desc}
                    </p>
                  </div>
                </label>
              );
            })}
          </div>
        </div>

        {/* Activation Checkpointing Checkboxes */}
        <div className="space-y-2 pt-1">
          <label className="text-xs font-mono font-semibold text-slate-500 dark:text-slate-400">
            激活值重计算 (Activation Checkpointing)
          </label>
          <div className="space-y-2">
            <label className="flex items-center justify-between gap-2 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 cursor-pointer">
              <span className="flex items-center gap-2.5 text-xs font-medium text-slate-800 dark:text-slate-200">
                <input
                  type="checkbox"
                  checked={ckptMode === 'selective'}
                  onChange={() =>
                    setCkptMode((m) => (m === 'selective' ? 'none' : 'selective'))
                  }
                  className="accent-emerald-400 rounded"
                />
                <span>开启选择性重计算（激活值 -60%）</span>
              </span>
              <span className="font-mono text-[10px] text-emerald-500">耗时 +5%</span>
            </label>

            <label className="flex items-center justify-between gap-2 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 cursor-pointer">
              <span className="flex items-center gap-2.5 text-xs font-medium text-slate-800 dark:text-slate-200">
                <input
                  type="checkbox"
                  checked={ckptMode === 'full'}
                  onChange={() => setCkptMode((m) => (m === 'full' ? 'none' : 'full'))}
                  className="accent-amber-400 rounded"
                />
                <span>开启全量重计算（激活值 -85%）</span>
              </span>
              <span className="font-mono text-[10px] text-amber-500">耗时 +30%</span>
            </label>
          </div>
        </div>
      </div>

      {/* Right Stacked Chart & Breakdown */}
      <div className="lg:col-span-7 space-y-5">
        <div
          className={`rounded-2xl border p-5 sm:p-6 space-y-5 transition-all ${
            sim.isOOM
              ? 'border-rose-500 bg-rose-500/5 shadow-glow-oom'
              : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120]/95 shadow-sm'
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Flame className={`w-5 h-5 ${sim.isOOM ? 'text-rose-500' : 'text-emerald-400'}`} />
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                单卡训练显存堆叠柱状图（vs 80GB H100 物理红线）
              </h3>
            </div>

            <span
              className={`px-3 py-1 rounded-lg font-mono text-xs font-bold border ${
                sim.isOOM
                  ? 'bg-rose-500 text-white border-rose-400'
                  : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/35'
              }`}
            >
              {sim.isOOM
                ? `💥 OOM 爆显存 (+${(sim.currentTotal - H100_LIMIT_GB).toFixed(1)} GB)`
                : `✅ 成功装进 80GB (余 ${(H100_LIMIT_GB - sim.currentTotal).toFixed(1)} GB)`}
            </span>
          </div>

          {sim.isOOM ? (
            <div className="rounded-xl border border-rose-500/50 bg-rose-500/15 px-4 py-3 flex items-center gap-2.5 text-xs text-rose-700 dark:text-rose-200">
              <AlertOctagon className="w-4 h-4 text-rose-500 shrink-0" />
              <span>
                当前单卡显存需求 <strong className="font-mono">{sim.currentTotal.toFixed(1)} GB</strong> 超出 80GB H100 上限！试着调大 GPU 卡数 N、升级到 ZeRO-2/ZeRO-3 或勾选激活值重计算。
              </span>
            </div>
          ) : (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 flex items-center gap-2.5 text-xs text-emerald-700 dark:text-emerald-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>
                太稳了！相比单卡无优化，当前方案把单卡显存压缩了{' '}
                <strong className="font-mono">{sim.saveMultiplier.toFixed(1)}x</strong>，顺利压入 80GB 警戒线以内！
              </span>
            </div>
          )}

          {/* Stacked Bar Plot with 80GB Dashed Line */}
          <div className="relative rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-[#060A13] px-4 sm:px-8 pt-6 pb-4">
            {/* 80GB Red Threshold Line mapped to the 256px (h-64) bar area */}
            <div className="relative flex items-end justify-around gap-6">
              {/* Red 80GB dashed line across the 64-unit bar zone */}
              <div
                className="pointer-events-none absolute left-0 right-0 border-t-2 border-dashed border-rose-500 z-10 flex justify-end"
                style={{ bottom: `calc(36px + ${(redLineBottomPct / 100) * 256}px)` }}
              >
                <span className="-mt-6 px-2 py-0.5 rounded bg-rose-500 text-white font-mono text-[10px] font-bold shadow">
                  80 GB H100 警戒线
                </span>
              </div>

              {renderStackedColumn(
                '单卡原始基准 (DDP)',
                `16P + 3.5P (${modelId})`,
                [
                  { label: '权重 2P', short: 'W', val: sim.baseWeights, color: 'bg-sky-400' },
                  { label: '梯度 2P', short: 'G', val: sim.baseGrads, color: 'bg-amber-400' },
                  { label: '优化器 12P', short: 'Opt', val: sim.baseOpt, color: 'bg-indigo-400' },
                  { label: '激活值', short: 'Act', val: sim.baseAct, color: 'bg-emerald-400' },
                ],
                sim.baselineTotal,
                sim.chartCeiling
              )}

              {renderStackedColumn(
                '当前方案单卡占用',
                `${zeroId.toUpperCase()} · ${gpuCount}卡`,
                [
                  { label: '权重 W', short: 'W', val: sim.weights, color: 'bg-sky-400' },
                  { label: '梯度 G', short: 'G', val: sim.grads, color: 'bg-amber-400' },
                  { label: '优化器 Opt', short: 'Opt', val: sim.opt, color: 'bg-indigo-400' },
                  { label: '激活值 Act', short: 'Act', val: sim.act, color: 'bg-emerald-400' },
                ],
                sim.currentTotal,
                sim.chartCeiling
              )}
            </div>

            {/* Color Legend */}
            <div className="mt-5 pt-3 border-t border-slate-200 dark:border-slate-800 flex flex-wrap justify-center gap-4 text-xs font-mono text-slate-600 dark:text-slate-300">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-sky-400 inline-block" />
                权重 ({sim.weights.toFixed(1)}G)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-amber-400 inline-block" />
                梯度 ({sim.grads.toFixed(1)}G)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-indigo-400 inline-block" />
                优化器 ({sim.opt.toFixed(1)}G)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-emerald-400 inline-block" />
                激活值 ({sim.act.toFixed(1)}G)
              </span>
            </div>
          </div>

          {/* Cost & Savings Assessment */}
          <div className="grid sm:grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800">
              <div className="text-[11px] text-slate-500 dark:text-slate-400">显存节省倍数</div>
              <div className="text-lg font-mono font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                {sim.saveMultiplier.toFixed(2)}x
              </div>
              <div className="text-[10px] font-mono text-slate-400">
                对比单卡 19.5P 基准
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800">
              <div className="text-[11px] text-slate-500 dark:text-slate-400">额外通信代价</div>
              <div className="text-lg font-mono font-bold text-sky-600 dark:text-sky-400 mt-0.5">
                {sim.commOverhead}
              </div>
              <div className="text-[10px] font-mono text-slate-400">
                ZeRO-1/2 几乎零额外通信
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800">
              <div className="text-[11px] text-slate-500 dark:text-slate-400">额外算力耗时代价</div>
              <div className="text-lg font-mono font-bold text-amber-600 dark:text-amber-400 mt-0.5">
                {sim.computeCost}
              </div>
              <div className="text-[10px] font-mono text-slate-400">
                重计算用时间换显存
              </div>
            </div>
          </div>

          <div className="rounded-xl bg-slate-100/80 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 p-4 flex items-start gap-3">
            <Sparkles className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
            <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-300">
              <strong className="text-slate-900 dark:text-white">大白话账本：</strong>
              一个 {modelId} 模型光是静态的权重+梯度+AdamW 优化器就要吃掉{' '}
              <span className="font-mono font-bold">{(16 * sim.P).toFixed(0)} GB</span>（其中优化器一家独吞 75%！）。所以训大模型时，工程上首选几乎零代价的{' '}
              <span className="font-mono text-sky-500">ZeRO-1/2 + 选择性重计算</span>，实在塞不下再请出全切分的 ZeRO-3 / FSDP。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
