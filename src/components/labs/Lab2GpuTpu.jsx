import React, { useState, useEffect, useMemo } from 'react';
import {
  Cpu,
  Play,
  Pause,
  StepForward,
  RotateCcw,
  Zap,
  Sparkles,
  Grid,
} from 'lucide-react';

const WARP_TOTAL = 32;
const TPU_N = 4;

export default function Lab2GpuTpu({ preset, presetNonce }) {
  const [mode, setMode] = useState('gpu_warp'); // 'gpu_warp' | 'tpu_systolic'

  // Mode A: GPU SIMT Warp state
  const [branchAPct, setBranchAPct] = useState(50);
  const [sparsityEnabled, setSparsityEnabled] = useState(false);
  const [warpStep, setWarpStep] = useState(1); // 0 = ready, 1 = round 1 (Branch A), 2 = round 2 (Branch B)
  const [warpPlaying, setWarpPlaying] = useState(true);

  // Mode B: TPU 4x4 Systolic Array state
  const [tpuBatch, setTpuBatch] = useState(1); // 1 | 2 | 4 | 8
  const [tpuTick, setTpuTick] = useState(1); // 0 .. totalCycles
  const [tpuPlaying, setTpuPlaying] = useState(true);

  useEffect(() => {
    if (!preset) return;
    if (preset.mode === 'tpu_systolic' || preset.mode === 'gpu_warp') {
      setMode(preset.mode);
    }
    if (typeof preset.divergence === 'number' && !Number.isNaN(preset.divergence)) {
      setBranchAPct(Math.min(100, Math.max(0, Math.round(preset.divergence))));
      setWarpStep(1);
    }
    if (typeof preset.sparsity === 'boolean') {
      setSparsityEnabled(preset.sparsity);
    }
    if (typeof preset.batch === 'number' && !Number.isNaN(preset.batch)) {
      const nearest = [1, 2, 4, 8].reduce((prev, curr) =>
        Math.abs(curr - preset.batch) < Math.abs(prev - preset.batch) ? curr : prev
      );
      setTpuBatch(nearest);
      setTpuTick(1);
    }
  }, [preset, presetNonce]);

  // Warp calculations
  const warpStats = useMemo(() => {
    const branchACount = Math.round((branchAPct / 100) * WARP_TOTAL);
    const branchBCount = WARP_TOTAL - branchACount;
    const isDiverged = branchACount > 0 && branchBCount > 0;
    const rounds = isDiverged ? 2 : 1;
    const warpUtilPct = isDiverged ? 50 : 100;
    const sparseMultiplier = sparsityEnabled ? 2 : 1;
    const effectiveSpeedup = (warpUtilPct / 100) * sparseMultiplier;

    return {
      branchACount,
      branchBCount,
      isDiverged,
      rounds,
      warpUtilPct,
      sparseMultiplier,
      effectiveSpeedup,
    };
  }, [branchAPct, sparsityEnabled]);

  // Mode A animation timer
  useEffect(() => {
    if (mode !== 'gpu_warp' || !warpPlaying) return undefined;
    const maxStep = warpStats.rounds;
    const id = setInterval(() => {
      setWarpStep((prev) => {
        if (maxStep === 1) return prev === 1 ? 0 : 1;
        return (prev + 1) % 3;
      });
    }, 1100);
    return () => clearInterval(id);
  }, [mode, warpPlaying, warpStats.rounds]);

  // Keep warpStep in valid range if divergence turns 0/100
  useEffect(() => {
    if (!warpStats.isDiverged && warpStep === 2) {
      setWarpStep(1);
    }
  }, [warpStats.isDiverged, warpStep]);

  // TPU calculations
  const tpuStats = useMemo(() => {
    const totalCycles = 2 * TPU_N + tpuBatch - 2;
    const avgUtilPct = ((TPU_N * tpuBatch) / (TPU_N * totalCycles)) * 100;
    return { totalCycles, avgUtilPct };
  }, [tpuBatch]);

  // Mode B animation timer
  useEffect(() => {
    if (mode !== 'tpu_systolic' || !tpuPlaying) return undefined;
    const id = setInterval(() => {
      setTpuTick((prev) => (prev >= tpuStats.totalCycles ? 1 : prev + 1));
    }, 850);
    return () => clearInterval(id);
  }, [mode, tpuPlaying, tpuStats.totalCycles]);

  const handleWarpStep = () => {
    setWarpPlaying(false);
    setWarpStep((prev) => {
      if (warpStats.rounds === 1) return prev === 1 ? 0 : 1;
      return (prev + 1) % 3;
    });
  };

  const handleTpuStep = () => {
    setTpuPlaying(false);
    setTpuTick((prev) => (prev >= tpuStats.totalCycles ? 1 : prev + 1));
  };

  // Count active PEs at current tpuTick
  const activePeCount = useMemo(() => {
    if (tpuTick <= 0) return 0;
    let count = 0;
    for (let r = 0; r < TPU_N; r += 1) {
      for (let c = 0; c < TPU_N; c += 1) {
        const b = tpuTick - 1 - r - c;
        if (b >= 0 && b < tpuBatch) count += 1;
      }
    }
    return count;
  }, [tpuTick, tpuBatch]);

  return (
    <div className="space-y-6">
      {/* Mode Switcher Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex p-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100/80 dark:bg-slate-900/80">
          <button
            onClick={() => setMode('gpu_warp')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
              mode === 'gpu_warp'
                ? 'bg-white dark:bg-[#0B1120] text-sky-600 dark:text-sky-400 shadow-sm border border-slate-200/80 dark:border-slate-700'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Cpu className="w-4 h-4" />
            <span>模式 A：GPU SIMT 方阵（32 线程 Warp）</span>
          </button>
          <button
            onClick={() => setMode('tpu_systolic')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
              mode === 'tpu_systolic'
                ? 'bg-white dark:bg-[#0B1120] text-emerald-600 dark:text-emerald-400 shadow-sm border border-slate-200/80 dark:border-slate-700'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Grid className="w-4 h-4" />
            <span>模式 B：TPU 脉动阵列（4×4 矩阵网格）</span>
          </button>
        </div>

        <div className="text-xs font-mono text-slate-500 dark:text-slate-400">
          {mode === 'gpu_warp'
            ? '观察重点：同一 Warp 内一旦走不同分支，只能串行两拍并罚站'
            : '观察重点：小 Batch 时脉动波前填不满格子，大 Batch 摊薄起跑气泡'}
        </div>
      </div>

      {/* MODE A: GPU SIMT WARP */}
      {mode === 'gpu_warp' && (
        <div className="grid lg:grid-cols-12 gap-6 items-start">
          {/* Controls */}
          <div className="lg:col-span-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120]/95 p-5 sm:p-6 space-y-6 shadow-sm">
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
                  if-else 分支 A 线程比例
                </label>
                <span className="font-mono text-sm font-bold text-sky-600 dark:text-sky-400 bg-sky-500/10 px-2.5 py-0.5 rounded-md border border-sky-500/20">
                  {branchAPct}% 走 if · {100 - branchAPct}% 走 else
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={branchAPct}
                onChange={(e) => {
                  setBranchAPct(Number(e.target.value));
                  setWarpStep(1);
                }}
                className="w-full silicon-slider bg-slate-200 dark:bg-slate-800"
              />
              <div className="flex flex-wrap gap-2 pt-1">
                {[
                  { label: '0% (全走 else)', val: 0 },
                  { label: '25% 分叉', val: 25 },
                  { label: '50% 对半发散', val: 50 },
                  { label: '100% (全走 if)', val: 100 },
                ].map((q) => (
                  <button
                    key={q.val}
                    onClick={() => {
                      setBranchAPct(q.val);
                      setWarpStep(1);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-mono border transition-colors ${
                      branchAPct === q.val
                        ? 'border-sky-400 bg-sky-500/15 text-sky-600 dark:text-sky-300 font-semibold'
                        : 'border-slate-200 dark:border-slate-800 text-slate-500 hover:border-sky-400/40'
                    }`}
                  >
                    {q.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Playback Buttons */}
            <div className="space-y-2">
              <div className="text-xs font-mono text-slate-500 dark:text-slate-400">
                时钟节拍控制（SIMT 广播指令）
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setWarpPlaying((p) => !p)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-sky-500 hover:bg-sky-400 text-slate-950 transition-colors"
                >
                  {warpPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  <span>{warpPlaying ? '暂停动画' : '自动播放'}</span>
                </button>
                <button
                  onClick={handleWarpStep}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium border border-slate-200 dark:border-slate-700 hover:border-sky-400/50 text-slate-700 dark:text-slate-200 transition-colors"
                >
                  <StepForward className="w-3.5 h-3.5" />
                  <span>单步执行</span>
                </button>
                <button
                  onClick={() => {
                    setWarpPlaying(false);
                    setWarpStep(1);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-400 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>重置</span>
                </button>
              </div>
            </div>

            {/* 2:4 Sparsity Toggle */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 p-4 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5 text-sm font-bold text-slate-900 dark:text-white">
                    <Zap className="w-4 h-4 text-amber-400" />
                    <span>开启 2:4 结构化稀疏 Tensor Core</span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    每 4 个权重必须有 2 个 0，硬件跳过零值乘加，理论算力直接翻倍 (2.0x)
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSparsityEnabled((v) => !v)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                    sparsityEnabled ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
                      sparsityEnabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Mini 2:4 weight visual */}
              <div className="grid grid-cols-4 gap-1.5 pt-1 text-center font-mono text-[11px]">
                {[
                  { label: 'W0 = 0.82', active: true },
                  { label: sparsityEnabled ? '0 (跳过)' : 'W1 = 0.00', active: !sparsityEnabled },
                  { label: 'W2 = -0.41', active: true },
                  { label: sparsityEnabled ? '0 (跳过)' : 'W3 = 0.00', active: !sparsityEnabled },
                ].map((cell, i) => (
                  <div
                    key={i}
                    className={`py-1.5 px-1 rounded-lg border transition-all ${
                      cell.active
                        ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-700 dark:text-emerald-300 font-semibold'
                        : 'bg-slate-200/70 dark:bg-slate-800/50 border-dashed border-slate-300 dark:border-slate-700 text-slate-400 line-through'
                    }`}
                  >
                    {cell.label}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 4x8 Warp Thread Matrix & Live Telemetry */}
          <div className="lg:col-span-7 space-y-5">
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120]/95 p-5 sm:p-6 space-y-5 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">
                    32 线程 Warp 执行现场（4×8 方阵 · 军训齐步走）
                  </h3>
                  <p className="text-xs font-mono text-slate-500 dark:text-slate-400 mt-0.5">
                    {warpStep === 0 && '准备就绪：等待 Warp Scheduler 下发统一指令'}
                    {warpStep === 1 &&
                      (warpStats.branchACount > 0
                        ? `第 1 拍：执行 if 分支 (A 组 ${warpStats.branchACount} 线程亮绿灯，B 组 ${warpStats.branchBCount} 线程灰灯罚站)`
                        : `第 1 拍：全员无分叉，全部走 else 分支 (32/32 满载齐步走！)`)}
                    {warpStep === 2 &&
                      `第 2 拍：被迫补跑 else 分支 (B 组 ${warpStats.branchBCount} 线程亮绿灯，A 组 ${warpStats.branchACount} 线程灰灯罚站)`}
                  </p>
                </div>

                <span
                  className={`px-3 py-1 rounded-full text-xs font-mono font-bold border ${
                    warpStats.isDiverged
                      ? 'bg-amber-500/15 text-amber-600 dark:text-amber-300 border-amber-500/35'
                      : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border-emerald-500/35'
                  }`}
                >
                  {warpStats.isDiverged ? '⚠️ 分支发散 (串行 2 轮)' : '✅ 齐步同步 (仅需 1 轮)'}
                </span>
              </div>

              {/* 4x8 Thread Grid */}
              <div className="grid grid-cols-8 gap-2 p-4 rounded-xl bg-slate-950 border border-slate-800">
                {Array.from({ length: WARP_TOTAL }).map((_, idx) => {
                  const isBranchA = idx < warpStats.branchACount;
                  let state = 'ready';
                  if (warpStep === 1) {
                    if (warpStats.branchACount === 0) state = 'activeB';
                    else state = isBranchA ? 'activeA' : 'stall';
                  } else if (warpStep === 2) {
                    state = !isBranchA ? 'activeB' : 'stall';
                  }

                  return (
                    <div
                      key={idx}
                      className={`h-11 rounded-lg border flex flex-col items-center justify-center font-mono transition-all duration-300 ${
                        state === 'activeA' || state === 'activeB'
                          ? 'bg-emerald-500/25 border-emerald-400 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.35)] scale-[1.03]'
                          : state === 'stall'
                            ? 'bg-slate-900 border-slate-800 text-slate-600 opacity-60'
                            : 'bg-sky-500/10 border-sky-500/30 text-sky-300'
                      }`}
                    >
                      <span className="text-[10px] font-bold">
                        T{String(idx).padStart(2, '0')}
                      </span>
                      <span className="text-[9px]">
                        {state === 'stall'
                          ? '罚站'
                          : isBranchA
                            ? 'if'
                            : 'else'}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800">
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">所需执行轮次</div>
                  <div className="text-lg font-mono font-bold text-slate-900 dark:text-white mt-0.5">
                    {warpStats.rounds} 轮
                  </div>
                  <div className="text-[10px] font-mono text-slate-400">
                    {warpStats.isDiverged ? '被迫串行跑两趟' : '一趟直接收工'}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800">
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">Warp 算力利用率</div>
                  <div
                    className={`text-lg font-mono font-bold mt-0.5 ${
                      warpStats.warpUtilPct === 100
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-amber-600 dark:text-amber-400'
                    }`}
                  >
                    {warpStats.warpUtilPct}%
                  </div>
                  <div className="text-[10px] font-mono text-slate-400">
                    {warpStats.isDiverged ? '半数时间在空等' : '全员满载无浪费'}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800">
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">等效吞吐倍率</div>
                  <div className="text-lg font-mono font-bold text-sky-600 dark:text-sky-400 mt-0.5">
                    {warpStats.effectiveSpeedup.toFixed(1)}x
                  </div>
                  <div className="text-[10px] font-mono text-slate-400">
                    {sparsityEnabled ? '含 2:4 稀疏 2x 加成' : '稠密基准 1.0x'}
                  </div>
                </div>
              </div>

              <div className="rounded-xl bg-slate-100/80 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 p-4 flex items-start gap-3">
                <Sparkles className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                  <strong className="text-slate-900 dark:text-white">大白话解读：</strong>
                  一个 Warp 的 32 个线程共用同一套取指译码器（教官只喊一个口令）。即使只有 1 个线程走{' '}
                  <code className="font-mono text-sky-500">else</code>、另外 31 个走{' '}
                  <code className="font-mono text-sky-500">if</code>，全队也得先等那 31 个人走完、再让 31 个人原地罚站等那 1 个人走完——整体耗时立刻翻倍、算力腰斩到{' '}
                  <span className="font-mono font-bold">50%</span>！
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODE B: TPU SYSTOLIC ARRAY */}
      {mode === 'tpu_systolic' && (
        <div className="grid lg:grid-cols-12 gap-6 items-start">
          {/* Controls */}
          <div className="lg:col-span-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120]/95 p-5 sm:p-6 space-y-6 shadow-sm">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
                  输入队列 Batch Size (向量数 B)
                </label>
                <span className="font-mono text-sm font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-md border border-emerald-500/20">
                  B = {tpuBatch}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                {[
                  { b: 1, label: 'Batch = 1 (单人解码)', sub: '14.3% 极多气泡' },
                  { b: 2, label: 'Batch = 2 (双请求)', sub: '25.0% 利用率' },
                  { b: 4, label: 'Batch = 4 (满载流水)', sub: '40.0% 填满波前' },
                  { b: 8, label: 'Batch = 8 (持续泵血)', sub: '57.1% 连续高吞吐' },
                ].map((opt) => (
                  <button
                    key={opt.b}
                    onClick={() => {
                      setTpuBatch(opt.b);
                      setTpuTick(1);
                    }}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      tpuBatch === opt.b
                        ? 'border-emerald-400 bg-emerald-500/12 shadow-sm'
                        : 'border-slate-200 dark:border-slate-800 hover:border-emerald-400/40'
                    }`}
                  >
                    <div className="font-mono text-xs font-bold text-slate-900 dark:text-white">
                      {opt.label}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      {opt.sub}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-xs font-mono text-slate-500 dark:text-slate-400">
                心跳泵血时钟 (Clock Cycle: t = {tpuTick} / {tpuStats.totalCycles})
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setTpuPlaying((p) => !p)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-colors"
                >
                  {tpuPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  <span>{tpuPlaying ? '暂停泵血' : '泵血播放'}</span>
                </button>
                <button
                  onClick={handleTpuStep}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium border border-slate-200 dark:border-slate-700 hover:border-emerald-400/50 text-slate-700 dark:text-slate-200 transition-colors"
                >
                  <StepForward className="w-3.5 h-3.5" />
                  <span>单拍推进 (+1 CLK)</span>
                </button>
                <button
                  onClick={() => {
                    setTpuPlaying(false);
                    setTpuTick(1);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>重置</span>
                </button>
              </div>
            </div>

            {/* Formula Box */}
            <div className="rounded-xl bg-slate-900 dark:bg-[#050811] border border-slate-800 p-4 font-mono text-xs text-slate-300 space-y-1.5">
              <div className="text-emerald-400 font-semibold">// 4×4 脉动阵列公式 (N = 4)</div>
              <div>总时钟拍数 = 2N + B - 2 = 2×4 + {tpuBatch} - 2 = {tpuStats.totalCycles} 拍</div>
              <div>
                平均利用率 = (N × B) ÷ (N × (2N + B - 2)) = {tpuBatch}/{tpuStats.totalCycles} ={' '}
                <span className="text-sky-400 font-bold">{tpuStats.avgUtilPct.toFixed(1)}%</span>
              </div>
            </div>
          </div>

          {/* 4x4 Systolic Array Visualization */}
          <div className="lg:col-span-7 space-y-5">
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120]/95 p-5 sm:p-6 space-y-5 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">
                    4×4 权重驻留脉动阵列（Weight-Stationary · 接力泵血）
                  </h3>
                  <p className="text-xs font-mono text-slate-500 dark:text-slate-400 mt-0.5">
                    当前第 t = {tpuTick} 拍 · 活跃计算单元 {activePeCount} / 16 个 (
                    {((activePeCount / 16) * 100).toFixed(0)}%)
                  </p>
                </div>

                <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border border-emerald-500/35">
                  平均利用率 {tpuStats.avgUtilPct.toFixed(1)}%
                </span>
              </div>

              {/* Systolic Grid Canvas */}
              <div className="rounded-xl bg-slate-950 border border-slate-800 p-4 sm:p-5 space-y-3 overflow-x-auto">
                <div className="text-[11px] font-mono text-slate-400 flex items-center justify-between">
                  <span>→ 左侧输入向量错位流入 (Skewed Inputs)</span>
                  <span>↓ 纵向累加部分和 (Partial Sums)</span>
                </div>

                <div className="min-w-[360px] space-y-2">
                  {Array.from({ length: TPU_N }).map((_, r) => {
                    // Input arriving at row r left edge has index b = tpuTick - 1 - r
                    const leftInputIdx = tpuTick - 1 - r;
                    const hasPendingInput = leftInputIdx >= 0 && leftInputIdx < tpuBatch;
                    return (
                      <div key={r} className="grid grid-cols-5 gap-2 items-center">
                        {/* Left Input Skew Queue */}
                        <div
                          className={`h-14 rounded-lg border flex flex-col items-center justify-center font-mono text-[10px] transition-all ${
                            hasPendingInput
                              ? 'bg-sky-500/20 border-sky-400 text-sky-300 shadow-[0_0_10px_rgba(56,189,248,0.25)]'
                              : 'bg-slate-900/60 border-slate-800/80 text-slate-600'
                          }`}
                        >
                          <span>行{r} 入口</span>
                          <span className="font-bold">
                            {hasPendingInput ? `X[b=${leftInputIdx}]→` : '待机'}
                          </span>
                        </div>

                        {/* 4 PE cells */}
                        {Array.from({ length: TPU_N }).map((__, c) => {
                          const b = tpuTick - 1 - r - c;
                          const isActive = b >= 0 && b < tpuBatch;
                          const alreadyPassed = b >= tpuBatch;
                          return (
                            <div
                              key={c}
                              className={`h-14 rounded-xl border flex flex-col items-center justify-center font-mono transition-all duration-300 ${
                                isActive
                                  ? 'bg-emerald-500/25 border-emerald-400 text-emerald-200 shadow-[0_0_16px_rgba(16,185,129,0.4)] scale-[1.03]'
                                  : alreadyPassed
                                    ? 'bg-slate-900/80 border-slate-700/70 text-slate-500'
                                    : 'bg-slate-900/40 border-slate-800 text-slate-600'
                              }`}
                            >
                              <span className="text-[10px] opacity-80">
                                W[{r},{c}]
                              </span>
                              <span className="text-[11px] font-bold">
                                {isActive ? `⚡算 b${b}` : alreadyPassed ? '已传出' : '空等气泡'}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}

                  {/* Bottom Partial Sum Accumulators */}
                  <div className="grid grid-cols-5 gap-2 pt-1">
                    <div className="text-[10px] font-mono text-slate-500 flex items-center justify-center">
                      输出汇总 ↓
                    </div>
                    {Array.from({ length: TPU_N }).map((_, c) => {
                      const finishedCount = Math.max(
                        0,
                        Math.min(tpuBatch, tpuTick - (TPU_N - 1 + c))
                      );
                      return (
                        <div
                          key={c}
                          className={`py-2 rounded-lg border text-center font-mono text-[10px] transition-all ${
                            finishedCount > 0
                              ? 'bg-amber-500/15 border-amber-400/50 text-amber-300'
                              : 'bg-slate-900/50 border-slate-800 text-slate-600'
                          }`}
                        >
                          Y[:,{c}] ({finishedCount}/{tpuBatch})
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* KPI Strip */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800">
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">总时钟拍数</div>
                  <div className="text-lg font-mono font-bold text-slate-900 dark:text-white mt-0.5">
                    {tpuStats.totalCycles} 拍
                  </div>
                  <div className="text-[10px] font-mono text-slate-400">2N + B - 2</div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800">
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">阵列平均利用率</div>
                  <div
                    className={`text-lg font-mono font-bold mt-0.5 ${
                      tpuStats.avgUtilPct >= 40
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-rose-500'
                    }`}
                  >
                    {tpuStats.avgUtilPct.toFixed(1)}%
                  </div>
                  <div className="text-[10px] font-mono text-slate-400">
                    {tpuBatch === 1 ? '大量格子空转！' : '流水线开始起飞'}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800">
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">当前活跃算子格</div>
                  <div className="text-lg font-mono font-bold text-sky-600 dark:text-sky-400 mt-0.5">
                    {activePeCount} / 16
                  </div>
                  <div className="text-[10px] font-mono text-slate-400">第 {tpuTick} 拍实时快照</div>
                </div>
              </div>

              <div className="rounded-xl bg-slate-100/80 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 p-4 flex items-start gap-3">
                <Sparkles className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                  <strong className="text-slate-900 dark:text-white">脉动直觉：</strong>
                  TPU 的每个格子算完一次后直接把数“递”给右边邻居、把部分和“递”给下面邻居，全程不用回 SRAM 仓库搬水！但正因如此，数据像波浪一样斜着扫过矩阵——当{' '}
                  <code className="font-mono text-emerald-500">Batch=1</code> 时整张 4×4 网格每一拍最多只亮 4 个格，平均利用率只有{' '}
                  <span className="font-mono font-bold">14.3%</span>；把 Batch 拉大后，前后请求首尾相接，利用率直线逼近 100%！
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
