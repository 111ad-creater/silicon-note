import React, { useState, useMemo, useEffect } from 'react';
import {
  Cpu,
  Sliders,
  Zap,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  RotateCcw,
} from 'lucide-react';

const COMPETITOR_GPU = {
  name: '竞品 GPU (旗舰推理卡参考)',
  tps: 112,
  tpotMs: 8.9,
  powerW: 280,
  eff: 112 / 280, // 0.40 Tokens/J
};

export default function Lab8NpuAdapter({ preset, presetNonce }) {
  const [fixFallback, setFixFallback] = useState(false);
  const [graphCapture, setGraphCapture] = useState(false);
  const [doubleBuffer, setDoubleBuffer] = useState(false);
  const [quantW4, setQuantW4] = useState(false);

  useEffect(() => {
    if (!preset) return;
    if (typeof preset.fixFallback === 'boolean') setFixFallback(preset.fixFallback);
    if (typeof preset.graphCapture === 'boolean') setGraphCapture(preset.graphCapture);
    if (typeof preset.doubleBuffer === 'boolean') setDoubleBuffer(preset.doubleBuffer);
    if (typeof preset.quantW4 === 'boolean') setQuantW4(preset.quantW4);
  }, [preset, presetNonce]);

  const sim = useMemo(() => {
    // Base unoptimized NPU running Qwen2.5-7B via vLLM/ONNX: 28 tok/s, 35.7ms TPOT, MBU 42%
    let tps = 28.0;
    let mbu = 42;
    let powerW = 180;

    if (fixFallback) {
      tps *= 2.1; // +110% throughput by moving RoPE/RMSNorm back to NPU
      mbu += 12;
    }
    if (graphCapture) {
      tps /= 0.65; // latency -35% => ~1.54x throughput
      mbu += 8;
    }
    if (doubleBuffer) {
      tps *= 1.48; // MBU jumps from ~62% to 78%
      mbu = 78;
    }
    if (quantW4) {
      tps *= 1.75; // W4A16/MXFP4 cuts weight movement by 75%, Decode climbs sharply
      powerW = 148;
      if (doubleBuffer) mbu = 84;
    }

    const tpotMs = 1000 / tps;
    const eff = tps / powerW;

    const stages = [
      {
        id: 'framework',
        name: '1. vLLM / ONNX 框架层',
        detail: quantW4 ? '已启用 W4A16 / MXFP4 权重打包' : 'BF16 权重 + PagedAttention 调度',
        ok: true,
        sharePct: 12,
      },
      {
        id: 'graph',
        name: '2. 图优化与算子调度',
        detail: fixFallback
          ? 'RoPE / RMSNorm 已融回 NPU，零 CPU 回退'
          : '⚠️ 警告：RMSNorm/RoPE 发生 CPU Fallback，PCIe 往返拷贝！',
        ok: fixFallback,
        sharePct: fixFallback ? 18 : 48,
      },
      {
        id: 'driver',
        name: '3. NPU 驱动与指令下发',
        detail: graphCapture
          ? '已开启 Graph Capture 图下沉，指令气泡清零'
          : '⚠️ 警告：小算子逐个发射，CPU 驱动下发气泡严重',
        ok: graphCapture,
        sharePct: graphCapture ? 10 : 24,
      },
      {
        id: 'sram',
        name: '4. 片上 SRAM & DMA 搬运',
        detail: doubleBuffer
          ? `双缓冲隐藏 DMA 搬运，MBU 达 ${mbu}%`
          : `⚠️ 警告：计算单元干等 DMA，MBU 仅 ${mbu}%`,
        ok: doubleBuffer,
        sharePct: doubleBuffer ? 60 : 16,
      },
    ];

    const tpsRatio = tps / COMPETITOR_GPU.tps;
    const effRatio = eff / COMPETITOR_GPU.eff;

    let verdict = '当前处于初始未调优状态：CPU 算子回退与下发碎针拖垮整条流水线，速度仅为竞品 GPU 的 1/4。';
    if (fixFallback && graphCapture && doubleBuffer && quantW4) {
      verdict = `全面通关！自研 NPU 吞吐达 ${tps.toFixed(0)} tok/s（竞品的 ${(tpsRatio * 100).toFixed(0)}%），能效比 ${eff.toFixed(2)} Tokens/J 更是反超竞品 ${effRatio.toFixed(2)}x！`;
    } else if (fixFallback && graphCapture && doubleBuffer) {
      verdict = `软件栈主瓶颈已打通（MBU ${mbu}%），吞吐接近竞品 GPU；开启 W4A16 / MXFP4 量化即可在能效比上彻底反超！`;
    } else if (fixFallback) {
      verdict = '已消除致命的 CPU 算子回退（吞吐瞬间翻倍+），下一步请开启「图下沉」与「SRAM 双缓冲」消灭下发与搬运气泡。';
    }

    return {
      tps,
      tpotMs,
      mbu,
      powerW,
      eff,
      stages,
      tpsRatio,
      effRatio,
      verdict,
    };
  }, [fixFallback, graphCapture, doubleBuffer, quantW4]);

  const applyAll = () => {
    setFixFallback(true);
    setGraphCapture(true);
    setDoubleBuffer(true);
    setQuantW4(true);
  };

  const resetAll = () => {
    setFixFallback(false);
    setGraphCapture(false);
    setDoubleBuffer(false);
    setQuantW4(false);
  };

  const maxTps = Math.max(sim.tps, COMPETITOR_GPU.tps, 120);
  const maxTpot = Math.max(sim.tpotMs, COMPETITOR_GPU.tpotMs, 40);
  const maxEff = Math.max(sim.eff, COMPETITOR_GPU.eff, 1.0);

  return (
    <div className="space-y-6">
      {/* Header strip */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
          实战场景：<span className="font-mono text-slate-800 dark:text-slate-200">将 Qwen2.5-7B 通过 vLLM / ONNX 移植到自研 NPU，逐步排查调优并横向对标竞品 GPU</span>
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={resetAll}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120] hover:border-rose-400/50 text-slate-700 dark:text-slate-300 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>重置初始未调优状态</span>
          </button>
          <button
            type="button"
            onClick={applyAll}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-colors"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>一键全开 NPU 四级调优</span>
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-6 items-start">
        {/* Left 4 Optimization Toggles */}
        <div className="lg:col-span-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120]/95 p-5 sm:p-6 space-y-4 shadow-sm">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-200 dark:border-slate-800">
            <Sliders className="w-4 h-4 text-sky-400" />
            <h2 className="font-bold text-base text-slate-900 dark:text-white">
              NPU 软件栈优化旋钮（逐项开关排障）
            </h2>
          </div>

          {[
            {
              key: 'fallback',
              checked: fixFallback,
              toggle: () => setFixFallback((v) => !v),
              step: '①',
              title: '消除 CPU 算子回退 (Operator Fallback)',
              badge: '吞吐 +110%',
              desc: '用 Triton / TileLang 将漏掉的 RoPE、RMSNorm 迁回 NPU 执行，砍掉 PCIe 来回拷贝。',
            },
            {
              key: 'graph',
              checked: graphCapture,
              toggle: () => setGraphCapture((v) => !v),
              step: '②',
              title: '开启驱动图下沉 (Graph Capture)',
              badge: '延迟 -35%',
              desc: '把几百个零碎小 Kernel 录成静态图一次性下发，彻底消灭驱动发射气泡。',
            },
            {
              key: 'double',
              checked: doubleBuffer,
              toggle: () => setDoubleBuffer((v) => !v),
              step: '③',
              title: '片上 SRAM 双缓冲 (Double Buffering)',
              badge: 'MBU 42% → 78%',
              desc: '乒乓缓存让计算阵列算 A 块的同时，DMA 后台预取 B 块权重，隐藏搬运等待。',
            },
            {
              key: 'quant',
              checked: quantW4,
              toggle: () => setQuantW4((v) => !v),
              step: '④',
              title: '开启 W4A16 / MXFP4 低比特量化',
              badge: '搬运 -75%',
              desc: '权重搬运体积骤降 4 倍，能效比 Tokens/J 彻底反超同级竞品 GPU。',
            },
          ].map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={item.toggle}
              aria-pressed={item.checked}
              className={`w-full text-left p-4 rounded-xl border transition-all space-y-1.5 ${
                item.checked
                  ? 'border-emerald-500/50 bg-emerald-500/10 shadow-sm'
                  : 'border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 hover:border-sky-400/50'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <span className="font-mono text-sky-500">{item.step}</span>
                  <span>{item.title}</span>
                </span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border shrink-0 ${
                    item.checked
                      ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                      : 'bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-700'
                  }`}
                >
                  {item.checked ? `已开启 · ${item.badge}` : item.badge}
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                {item.desc}
              </p>
            </button>
          ))}
        </div>

        {/* Right Visualization */}
        <div className="lg:col-span-7 space-y-6">
          {/* Upper: Software Stack Pipeline Animation */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120]/95 p-5 sm:p-6 space-y-4 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Cpu className="w-5 h-5 text-sky-400" />
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  NPU 全栈数据流与瓶颈节点指示灯
                </h3>
              </div>
              <span className="font-mono text-xs text-sky-600 dark:text-sky-400">
                实时 MBU ≈ {sim.mbu}%
              </span>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              {sim.stages.map((st, idx) => (
                <div
                  key={st.id}
                  className={`rounded-xl border p-3.5 space-y-2 transition-all ${
                    st.ok
                      ? 'border-emerald-500/40 bg-emerald-500/[0.06]'
                      : 'border-rose-500/45 bg-rose-500/[0.07]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-mono font-bold text-slate-900 dark:text-white">
                      {st.name}
                    </span>
                    <span className="flex items-center gap-1 text-[10px] font-mono">
                      <span
                        className={`w-2.5 h-2.5 rounded-full ${
                          st.ok ? 'bg-emerald-400' : 'bg-rose-500 animate-pulse'
                        }`}
                      />
                      <span className={st.ok ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'}>
                        {st.ok ? '畅通' : '阻塞'}
                      </span>
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {st.detail}
                  </p>
                  {idx < sim.stages.length - 1 && (
                    <div className="hidden sm:flex justify-end text-slate-400">
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Lower: Dual-Bar Benchmark vs Competitor GPU */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120]/95 p-5 sm:p-6 space-y-5 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  对齐条件竞品对标：自研 NPU vs 竞品 GPU
                </h3>
              </div>
              <span className="font-mono text-xs text-slate-500 dark:text-slate-400">
                Qwen2.5-7B · Batch=1
              </span>
            </div>

            <div className="space-y-4">
              {/* Metric 1: Throughput */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 space-y-2">
                <div className="flex justify-between text-xs font-mono">
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    吐字吞吐 (tokens/s · 越高越好)
                  </span>
                  <span className="text-sky-500 font-bold">
                    NPU = {(sim.tpsRatio * 100).toFixed(0)}% 竞品水平
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-20 text-[11px] font-mono text-sky-600 dark:text-sky-400 font-semibold">
                    自研 NPU
                  </span>
                  <div className="flex-1 h-4 rounded bg-slate-200 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full rounded bg-gradient-to-r from-sky-500 to-emerald-400 transition-all duration-300"
                      style={{ width: `${Math.min(100, (sim.tps / maxTps) * 100)}%` }}
                    />
                  </div>
                  <span className="w-24 text-right font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    {sim.tps.toFixed(1)} tok/s
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-20 text-[11px] font-mono text-slate-500">竞品 GPU</span>
                  <div className="flex-1 h-4 rounded bg-slate-200 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full rounded bg-amber-500/80 transition-all duration-300"
                      style={{ width: `${Math.min(100, (COMPETITOR_GPU.tps / maxTps) * 100)}%` }}
                    />
                  </div>
                  <span className="w-24 text-right font-mono text-xs font-semibold text-amber-600 dark:text-amber-400">
                    {COMPETITOR_GPU.tps.toFixed(1)} tok/s
                  </span>
                </div>
              </div>

              {/* Metric 2: TPOT Latency */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 space-y-2">
                <div className="flex justify-between text-xs font-mono">
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    单字延迟 TPOT (ms · 越低越跟手)
                  </span>
                  <span className={sim.tpotMs <= 12 ? 'text-emerald-500 font-bold' : 'text-amber-500'}>
                    {sim.tpotMs <= 50 ? '满足 50ms 红线' : '高于延迟红线'}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-20 text-[11px] font-mono text-sky-600 dark:text-sky-400 font-semibold">
                    自研 NPU
                  </span>
                  <div className="flex-1 h-4 rounded bg-slate-200 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full rounded bg-sky-500 transition-all duration-300"
                      style={{ width: `${Math.min(100, (sim.tpotMs / maxTpot) * 100)}%` }}
                    />
                  </div>
                  <span className="w-24 text-right font-mono text-xs font-bold text-sky-600 dark:text-sky-400">
                    {sim.tpotMs.toFixed(1)} ms
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-20 text-[11px] font-mono text-slate-500">竞品 GPU</span>
                  <div className="flex-1 h-4 rounded bg-slate-200 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full rounded bg-amber-500/80 transition-all duration-300"
                      style={{ width: `${Math.min(100, (COMPETITOR_GPU.tpotMs / maxTpot) * 100)}%` }}
                    />
                  </div>
                  <span className="w-24 text-right font-mono text-xs font-semibold text-amber-600 dark:text-amber-400">
                    {COMPETITOR_GPU.tpotMs.toFixed(1)} ms
                  </span>
                </div>
              </div>

              {/* Metric 3: Energy Efficiency */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 space-y-2">
                <div className="flex justify-between text-xs font-mono">
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    能效比 (Tokens / Joule · 越高越省电)
                  </span>
                  <span className={sim.eff >= COMPETITOR_GPU.eff ? 'text-emerald-500 font-bold' : 'text-slate-500'}>
                    {sim.eff >= COMPETITOR_GPU.eff
                      ? `反超竞品 ${sim.effRatio.toFixed(2)}x!`
                      : `当前为竞品的 ${(sim.effRatio * 100).toFixed(0)}%`}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-20 text-[11px] font-mono text-sky-600 dark:text-sky-400 font-semibold">
                    自研 NPU
                  </span>
                  <div className="flex-1 h-4 rounded bg-slate-200 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full rounded bg-emerald-400 transition-all duration-300"
                      style={{ width: `${Math.min(100, (sim.eff / maxEff) * 100)}%` }}
                    />
                  </div>
                  <span className="w-24 text-right font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    {sim.eff.toFixed(2)} T/J
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-20 text-[11px] font-mono text-slate-500">竞品 GPU</span>
                  <div className="flex-1 h-4 rounded bg-slate-200 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full rounded bg-amber-500/80 transition-all duration-300"
                      style={{ width: `${Math.min(100, (COMPETITOR_GPU.eff / maxEff) * 100)}%` }}
                    />
                  </div>
                  <span className="w-24 text-right font-mono text-xs font-semibold text-amber-600 dark:text-amber-400">
                    {COMPETITOR_GPU.eff.toFixed(2)} T/J
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom Verdict */}
            <div
              className={`rounded-xl border p-4 flex items-start gap-3 text-xs leading-relaxed ${
                fixFallback && graphCapture && doubleBuffer
                  ? 'border-emerald-500/35 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200'
                  : 'border-amber-500/35 bg-amber-500/10 text-amber-800 dark:text-amber-200'
              }`}
            >
              {fixFallback && graphCapture && doubleBuffer ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              )}
              <div>
                <span className="font-bold mr-1">竞品分析结论：</span>
                {sim.verdict}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
