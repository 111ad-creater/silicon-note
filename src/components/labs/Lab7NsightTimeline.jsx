import React, { useState, useEffect, useMemo } from 'react';
import { Clock, Wrench, Sparkles, CheckCircle2, AlertTriangle } from 'lucide-react';

const CASES = [
  {
    id: 'sync_lock',
    badge: 'Case 1',
    title: '代码误留 `print(loss.item())` 隐式同步锁',
    symptom: '每次迭代 GPU 算完一小段就被强行刹车等 CPU 读数，时间轴布满 45% 空白气泡',
    fixLabel: '删除 `.item()` 隐式同步调用（改用异步日志）',
    unfixed: {
      totalMs: 100,
      gpuBusyPct: 55,
      bubblePct: 45,
      cpuBlocks: [
        { start: 0, dur: 12, label: 'Launch' },
        { start: 22, dur: 14, label: 'Sync等' },
        { start: 44, dur: 12, label: 'Launch' },
        { start: 66, dur: 14, label: 'Sync等' },
        { start: 86, dur: 8, label: 'Log' },
      ],
      gpuBlocks: [
        { start: 8, dur: 15, label: 'Fwd' },
        { start: 36, dur: 18, label: 'Bwd' },
        { start: 80, dur: 20, label: 'Opt' },
      ],
      bubbles: [
        { start: 23, dur: 13, label: 'Bubble 同步等待' },
        { start: 54, dur: 26, label: 'Bubble .item() 锁死' },
      ],
      commBlocks: [],
    },
    fixed: {
      totalMs: 58,
      gpuBusyPct: 95,
      bubblePct: 5,
      cpuBlocks: [
        { start: 0, dur: 10, label: 'Async Launch' },
        { start: 12, dur: 10, label: 'Prefetch' },
        { start: 24, dur: 10, label: 'Async Step' },
      ],
      gpuBlocks: [
        { start: 3, dur: 15, label: 'Fwd' },
        { start: 19, dur: 18, label: 'Bwd' },
        { start: 38, dur: 20, label: 'Opt' },
      ],
      bubbles: [],
      commBlocks: [],
    },
    diagnosis: '删除隐式同步锁后，CPU 提前把后续 Kernel 塞满队列，GPU 气泡占比从 45% 骤降至 5%，单步耗时缩短 42%（100ms → 58ms）！',
  },
  {
    id: 'cuda_graph',
    badge: 'Case 2',
    title: 'Decode 小 Batch 没开 CUDA Graph（碎针 + 缝隙）',
    symptom: '20 个微秒级小算子全靠 CPU Python 逐个发射，发射缝隙比计算本身还长',
    fixLabel: '开启 CUDA Graph 录制成宏指令图（单次发射）',
    unfixed: {
      totalMs: 12.0,
      gpuBusyPct: 18,
      bubblePct: 82,
      cpuLaunchMs: 10.2,
      // Generate 12 visible needle blocks across 0..12ms
      cpuBlocks: Array.from({ length: 12 }).map((_, i) => ({
        start: i * 0.95,
        dur: 0.65,
        label: i === 0 ? 'PyLaunch' : '',
      })),
      gpuBlocks: Array.from({ length: 12 }).map((_, i) => ({
        start: i * 0.95 + 0.55,
        dur: 0.22,
        label: '',
      })),
      bubbles: [
        { start: 1.5, dur: 9.8, label: '大量 Launch 缝隙气泡 (82%)' },
      ],
      commBlocks: [],
    },
    fixed: {
      totalMs: 3.2,
      gpuBusyPct: 92,
      bubblePct: 8,
      cpuLaunchMs: 1.5,
      cpuBlocks: [{ start: 0, dur: 0.9, label: '1次Graph发射' }],
      gpuBlocks: [{ start: 0.3, dur: 2.9, label: 'CUDA Graph 合并紧密连跑 (20 Kernels)' }],
      bubbles: [],
      commBlocks: [],
    },
    diagnosis: '开启 CUDA Graph 后，20 根带缝隙的小针合并成 1 根紧凑绿条，CPU 发射耗时暴降 85%，单步耗时从 12.0ms 压缩至 3.2ms（3.75x 提速）！',
  },
  {
    id: 'no_overlap',
    badge: 'Case 3',
    title: '多卡训练未做 Overlap（计算流与 NCCL 傻傻串行）',
    symptom: '100ms 计算全算完了才开始 40ms NCCL 通信，计算单元干等通信白白浪费 40ms',
    fixLabel: '开启通信与计算 Overlap 重叠（双 Stream 并行）',
    unfixed: {
      totalMs: 140,
      gpuBusyPct: 71.4,
      bubblePct: 28.6,
      cpuBlocks: [
        { start: 0, dur: 16, label: 'Bwd Launch' },
        { start: 96, dur: 12, label: 'NCCL Launch' },
      ],
      gpuBlocks: [
        { start: 0, dur: 100, label: 'GPU Compute (100 ms)' },
      ],
      bubbles: [
        { start: 100, dur: 40, label: 'Bubble 等通信 (40ms)' },
      ],
      commBlocks: [
        { start: 100, dur: 40, label: 'NCCL AllReduce (40 ms · 串行阻塞)' },
      ],
    },
    fixed: {
      totalMs: 100,
      gpuBusyPct: 100,
      bubblePct: 0,
      cpuBlocks: [
        { start: 0, dur: 16, label: 'Async Compute + Comm' },
      ],
      gpuBlocks: [
        { start: 0, dur: 100, label: 'GPU Compute (100 ms · 满载)' },
      ],
      bubbles: [],
      commBlocks: [
        { start: 25, dur: 40, label: 'NCCL AllReduce (40 ms · 藏入计算下方!)' },
      ],
    },
    diagnosis: '开启 Overlap 后，Track 3 的 40ms 通信条向左平移并入 Track 2 计算条正下方并行执行，总耗时从 140ms 骤降至 100ms（通信耗时 100% 隐藏）！',
  },
  {
    id: 'cross_node_tp',
    badge: 'Case 4',
    title: '张量并行 TP 跨过了慢速跨机网卡（通信膨胀 9 倍）',
    symptom: '每层都要做 AllReduce 的 TP 却走了 100 GB/s 跨机网卡，通信条把计算淹没',
    fixLabel: '将 TP 锁回单机内 NVLink (900 GB/s)',
    unfixed: {
      totalMs: 92,
      gpuBusyPct: 21.7,
      bubblePct: 78.3,
      cpuBlocks: [
        { start: 0, dur: 12, label: 'TP Launch' },
      ],
      gpuBlocks: [
        { start: 0, dur: 20, label: 'GEMM (20ms)' },
      ],
      bubbles: [
        { start: 20, dur: 72, label: 'Bubble 跨机网卡卡死 (72ms)' },
      ],
      commBlocks: [
        { start: 20, dur: 72, label: '跨机网卡 TP AllReduce (100 GB/s · 72 ms)' },
      ],
    },
    fixed: {
      totalMs: 28,
      gpuBusyPct: 71.4,
      bubblePct: 28.6,
      cpuBlocks: [
        { start: 0, dur: 8, label: 'TP Launch' },
      ],
      gpuBlocks: [
        { start: 0, dur: 20, label: 'GEMM (20ms)' },
      ],
      bubbles: [
        { start: 20, dur: 8, label: '8ms' },
      ],
      commBlocks: [
        { start: 20, dur: 8, label: 'NVLink (8ms)' },
      ],
    },
    diagnosis: '把 TP 锁回机内 NVLink 后，通信带宽从 100 GB/s 暴涨至 900 GB/s，通信条瞬间缩水至原来的 1/9（72ms → 8ms），整体加速 3.29x！',
  },
];

export default function Lab7NsightTimeline({ preset, presetNonce }) {
  const [caseId, setCaseId] = useState('no_overlap');
  const [isFixed, setIsFixed] = useState(false);

  useEffect(() => {
    if (!preset) return;
    if (typeof preset.scene === 'string') {
      const found = CASES.find((c) => c.id === preset.scene);
      if (found) {
        setCaseId(found.id);
        setIsFixed(false);
      }
    }
    if (typeof preset.fixed === 'boolean') {
      setIsFixed(preset.fixed);
    }
  }, [preset, presetNonce]);

  const activeCase = useMemo(
    () => CASES.find((c) => c.id === caseId) || CASES[0],
    [caseId]
  );

  const view = isFixed ? activeCase.fixed : activeCase.unfixed;
  const maxAxisMs = activeCase.unfixed.totalMs;
  const speedup = activeCase.unfixed.totalMs / view.totalMs;

  const pctLeft = (ms) => `${(ms / maxAxisMs) * 100}%`;
  const pctWidth = (ms) => `${Math.max(1.2, (ms / maxAxisMs) * 100)}%`;

  const rulerTicks = [0, 0.25, 0.5, 0.75, 1.0].map((r) => ({
    ratio: r * 100,
    label: `${(maxAxisMs * r).toFixed(maxAxisMs < 20 ? 1 : 0)} ms`,
  }));

  return (
    <div className="space-y-6">
      {/* 4 Case Selector Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {CASES.map((c) => {
          const selected = c.id === caseId;
          return (
            <button
              key={c.id}
              onClick={() => {
                setCaseId(c.id);
                setIsFixed(false);
              }}
              className={`text-left p-4 rounded-2xl border transition-all ${
                selected
                  ? 'border-sky-400 bg-sky-500/10 shadow-sm'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120]/90 hover:border-sky-400/40'
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-sky-600 dark:text-sky-300">
                  {c.badge}
                </span>
                <span className="text-[11px] font-mono text-rose-500 font-semibold">
                  气泡 {c.unfixed.bubblePct}%
                </span>
              </div>
              <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white leading-snug">
                {c.title}
              </div>
            </button>
          );
        })}
      </div>

      {/* Main Nsight Systems Dark Timeline Frame */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120]/95 p-5 sm:p-6 space-y-5 shadow-sm">
        {/* Top Header + Fix Switch */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-mono text-sky-500">
              <Clock className="w-4 h-4" />
              <span>NSIGHT SYSTEMS TRACE · {activeCase.badge.toUpperCase()}</span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {activeCase.title}
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              病症：{activeCase.symptom}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsFixed((f) => !f)}
            className={`shrink-0 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold border transition-all ${
              isFixed
                ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-glow-chip'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white border-indigo-500 shadow-sm'
            }`}
          >
            <Wrench className="w-4 h-4" />
            <span>{isFixed ? '✅ 已应用修复方案（点击还原对比）' : `🔧 ${activeCase.fixLabel}`}</span>
          </button>
        </div>

        {/* Big KPI Telemetry Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800">
            <div className="text-[11px] text-slate-500 dark:text-slate-400">GPU 有效忙碌率</div>
            <div
              className={`text-xl font-mono font-bold mt-0.5 ${
                view.gpuBusyPct >= 70 ? 'text-emerald-500' : 'text-rose-500'
              }`}
            >
              {view.gpuBusyPct.toFixed(1)}%
            </div>
            <div className="text-[10px] font-mono text-slate-400">
              修复前 {activeCase.unfixed.gpuBusyPct}%
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800">
            <div className="text-[11px] text-slate-500 dark:text-slate-400">空转气泡占比</div>
            <div
              className={`text-xl font-mono font-bold mt-0.5 ${
                view.bubblePct <= 15 ? 'text-emerald-500' : 'text-amber-500'
              }`}
            >
              {view.bubblePct.toFixed(1)}%
            </div>
            <div className="text-[10px] font-mono text-slate-400">
              红虚线空转浪费
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800">
            <div className="text-[11px] text-slate-500 dark:text-slate-400">单 Step 总耗时</div>
            <div className="text-xl font-mono font-bold text-sky-500 mt-0.5">
              {view.totalMs.toFixed(maxAxisMs < 20 ? 1 : 0)} ms
            </div>
            <div className="text-[10px] font-mono text-slate-400">
              基准 {maxAxisMs} ms
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800">
            <div className="text-[11px] text-slate-500 dark:text-slate-400">优化加速比</div>
            <div
              className={`text-xl font-mono font-bold mt-0.5 ${
                isFixed ? 'text-emerald-400' : 'text-slate-500'
              }`}
            >
              {speedup.toFixed(2)}x
            </div>
            <div className="text-[10px] font-mono text-slate-400">
              {isFixed ? '气泡已消除!' : '等待修复'}
            </div>
          </div>
        </div>

        {/* Nsight Dark Timeline Viewer */}
        <div className="rounded-xl bg-[#050811] border border-slate-800 p-4 sm:p-5 space-y-4 overflow-x-auto">
          <div className="min-w-[540px] space-y-3">
            {/* Time Ruler */}
            <div className="grid grid-cols-12 items-center gap-3 pb-2 border-b border-slate-800/90">
              <div className="col-span-3 text-[11px] font-mono text-slate-400">
                时间轴刻度 (Time)
              </div>
              <div className="col-span-9 relative h-5">
                {rulerTicks.map((t) => (
                  <div
                    key={t.label}
                    className="absolute top-0 -translate-x-1/2 text-[10px] font-mono text-slate-500"
                    style={{ left: `${t.ratio}%` }}
                  >
                    {t.label}
                  </div>
                ))}
              </div>
            </div>

            {/* Track 1: CPU Scheduling */}
            <div className="grid grid-cols-12 items-center gap-3">
              <div className="col-span-3 text-xs font-mono text-violet-300">
                Track 1 · CPU 调度
              </div>
              <div className="col-span-9 relative h-10 rounded-lg bg-slate-900/80 border border-slate-800/80 overflow-hidden">
                {view.cpuBlocks.map((b, i) => (
                  <div
                    key={i}
                    style={{ left: pctLeft(b.start), width: pctWidth(b.dur) }}
                    className="absolute top-1.5 bottom-1.5 rounded bg-violet-500/85 border border-violet-300/60 flex items-center justify-center px-1 text-[10px] font-mono font-semibold text-white whitespace-nowrap overflow-hidden transition-all duration-700 ease-out"
                  >
                    {b.label}
                  </div>
                ))}
              </div>
            </div>

            {/* Track 2: GPU Compute + Bubble Highlight */}
            <div className="grid grid-cols-12 items-center gap-3">
              <div className="col-span-3 text-xs font-mono text-emerald-300">
                Track 2 · GPU 计算
              </div>
              <div className="col-span-9 relative h-12 rounded-lg bg-slate-900/80 border border-slate-800/80 overflow-hidden">
                {/* Saved time zone when fixed */}
                {isFixed && view.totalMs < maxAxisMs && (
                  <div
                    style={{
                      left: pctLeft(view.totalMs),
                      width: `${((maxAxisMs - view.totalMs) / maxAxisMs) * 100}%`,
                    }}
                    className="absolute top-0 bottom-0 bg-emerald-500/5 border-l border-dashed border-emerald-400/50 flex items-center justify-center text-[10px] font-mono text-emerald-400/80 transition-all duration-700"
                  >
                    省下 {(maxAxisMs - view.totalMs).toFixed(maxAxisMs < 20 ? 1 : 0)} ms!
                  </div>
                )}

                {/* Bubbles */}
                {view.bubbles.map((b, i) => (
                  <div
                    key={`bub-${i}`}
                    style={{ left: pctLeft(b.start), width: pctWidth(b.dur) }}
                    className="absolute top-1.5 bottom-1.5 rounded border-2 border-dashed border-rose-500/80 bg-rose-500/10 flex items-center justify-center px-1 text-[10px] font-mono font-semibold text-rose-300 whitespace-nowrap overflow-hidden transition-all duration-700 ease-out"
                  >
                    {b.label}
                  </div>
                ))}

                {/* Compute Bars */}
                {view.gpuBlocks.map((b, i) => (
                  <div
                    key={`gpu-${i}`}
                    style={{ left: pctLeft(b.start), width: pctWidth(b.dur) }}
                    className="absolute top-1.5 bottom-1.5 rounded bg-emerald-500/90 border border-emerald-300 flex items-center justify-center px-1.5 text-[10px] font-mono font-bold text-slate-950 whitespace-nowrap overflow-hidden transition-all duration-700 ease-out shadow-[0_0_12px_rgba(16,185,129,0.3)]"
                  >
                    {b.label}
                  </div>
                ))}
              </div>
            </div>

            {/* Track 3: NCCL Multi-GPU Comm */}
            <div className="grid grid-cols-12 items-center gap-3">
              <div className="col-span-3 text-xs font-mono text-sky-300">
                Track 3 · NCCL 通信
              </div>
              <div className="col-span-9 relative h-10 rounded-lg bg-slate-900/80 border border-slate-800/80 overflow-hidden">
                {view.commBlocks.length === 0 ? (
                  <div className="h-full flex items-center px-3 text-[11px] font-mono text-slate-600">
                    （本单卡故障场景无跨卡 NCCL 阻塞）
                  </div>
                ) : (
                  view.commBlocks.map((b, i) => (
                    <div
                      key={i}
                      style={{ left: pctLeft(b.start), width: pctWidth(b.dur) }}
                      className="absolute top-1.5 bottom-1.5 rounded bg-sky-500/90 border border-sky-300 flex items-center justify-center px-1.5 text-[10px] font-mono font-bold text-slate-950 whitespace-nowrap overflow-hidden transition-all duration-700 ease-out shadow-[0_0_12px_rgba(56,189,248,0.3)]"
                    >
                      {b.label}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Legend */}
            <div className="pt-2 flex flex-wrap gap-4 text-[11px] font-mono text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-violet-500 inline-block" />
                CPU 调度
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-emerald-500 inline-block" />
                GPU Tensor Core 计算
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-sky-500 inline-block" />
                NCCL 集合通信
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded border border-dashed border-rose-500 bg-rose-500/20 inline-block" />
                Bubble 空转气泡
              </span>
            </div>
          </div>
        </div>

        {/* Diagnosis Strip */}
        <div
          className={`rounded-xl border p-4 flex items-start gap-3 ${
            isFixed
              ? 'border-emerald-500/35 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200'
              : 'border-amber-500/35 bg-amber-500/10 text-amber-800 dark:text-amber-200'
          }`}
        >
          {isFixed ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          )}
          <div className="text-xs leading-relaxed">
            <Sparkles className="w-3.5 h-3.5 inline mr-1" />
            <strong className="font-semibold">
              {isFixed ? '排障完成：' : '点击右上角按钮修复此故障：'}
            </strong>
            {isFixed ? activeCase.diagnosis : `当前红色虚线框内即为宝贵显卡算力白白浪费的气泡（Bubble）。点击上方「🔧 ${activeCase.fixLabel}」观看时间轴自动重排闭合！`}
          </div>
        </div>
      </div>
    </div>
  );
}
