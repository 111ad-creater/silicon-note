import React, { useState, useEffect, useMemo } from 'react';
import { Activity, Sliders, Cpu, Sparkles } from 'lucide-react';

export const ROOFLINE_CHIPS = [
  {
    id: 'H100',
    label: 'NVIDIA H100 (989 TF / 3.35 TB/s)',
    short: 'H100 (HBM3)',
    peakTflops: 989,
    bwTBs: 3.35,
    memType: 'HBM3 80GB',
  },
  {
    id: 'B200',
    label: 'NVIDIA B200 (2250 TF / 8.0 TB/s)',
    short: 'B200 (HBM3e)',
    peakTflops: 2250,
    bwTBs: 8.0,
    memType: 'HBM3e 192GB',
  },
  {
    id: 'RTX4090',
    label: 'RTX 4090 (330 TF / 1.0 TB/s)',
    short: 'RTX 4090 (GDDR6X)',
    peakTflops: 330,
    bwTBs: 1.0,
    memType: 'GDDR6X 24GB',
  },
  {
    id: 'PHONE',
    label: '旗舰手机 LPDDR5X (15 TF / 0.075 TB/s)',
    short: '手机 NPU (LPDDR5X)',
    peakTflops: 15,
    bwTBs: 0.075,
    memType: 'LPDDR5X 16GB',
  },
];

const PRECISION_BYTES = {
  BF16: { id: 'BF16', label: 'BF16 (2 B)', bytes: 2 },
  FP8: { id: 'FP8', label: 'FP8 (1 B)', bytes: 1 },
  INT4: { id: 'INT4', label: 'INT4 (0.5 B)', bytes: 0.5 },
};

const MODEL_SCALES = [
  { id: '7B', label: '7B 模型', paramsB: 7 },
  { id: '70B', label: '70B 模型', paramsB: 70 },
];

// Log-log SVG mapping domain
const X_MIN_LOG = Math.log10(0.25);
const X_MAX_LOG = Math.log10(16384);
const Y_MIN_LOG = Math.log10(0.25);
const Y_MAX_LOG = Math.log10(4096);

const SVG_W = 640;
const SVG_H = 340;
const PAD = { left: 56, right: 24, top: 24, bottom: 44 };

function mapX(val) {
  const clamped = Math.max(0.25, Math.min(16384, val));
  const ratio = (Math.log10(clamped) - X_MIN_LOG) / (X_MAX_LOG - X_MIN_LOG);
  return PAD.left + ratio * (SVG_W - PAD.left - PAD.right);
}

function mapY(val) {
  const clamped = Math.max(0.25, Math.min(4096, val));
  const ratio = (Math.log10(clamped) - Y_MIN_LOG) / (Y_MAX_LOG - Y_MIN_LOG);
  return SVG_H - PAD.bottom - ratio * (SVG_H - PAD.top - PAD.bottom);
}

export default function Lab4Roofline({ preset, presetNonce }) {
  const [chipId, setChipId] = useState('H100');
  const [modelId, setModelId] = useState('7B');
  const [precisionId, setPrecisionId] = useState('BF16');
  const [stage, setStage] = useState('decode'); // 'decode' | 'prefill'
  const [batch, setBatch] = useState(1); // 1 ~ 256
  const [showCompareGddr, setShowCompareGddr] = useState(false);

  useEffect(() => {
    if (!preset) return;
    if (typeof preset.chip === 'string') {
      const upper = preset.chip.trim().toUpperCase();
      if (ROOFLINE_CHIPS.some((c) => c.id === upper)) setChipId(upper);
    }
    if (typeof preset.model === 'string') {
      const upper = preset.model.trim().toUpperCase();
      if (upper === '7B' || upper === '70B') setModelId(upper);
    }
    if (typeof preset.precision === 'string') {
      const upper = preset.precision.trim().toUpperCase();
      if (PRECISION_BYTES[upper]) setPrecisionId(upper);
    }
    if (preset.stage === 'decode' || preset.stage === 'prefill') {
      setStage(preset.stage);
    }
    if (typeof preset.batch === 'number' && !Number.isNaN(preset.batch)) {
      setBatch(Math.min(256, Math.max(1, preset.batch)));
    }
    if (typeof preset.compareGddr === 'boolean') {
      setShowCompareGddr(preset.compareGddr);
    }
  }, [preset, presetNonce]);

  const sim = useMemo(() => {
    const chip = ROOFLINE_CHIPS.find((c) => c.id === chipId) || ROOFLINE_CHIPS[0];
    const prec = PRECISION_BYTES[precisionId] || PRECISION_BYTES.BF16;
    const model = MODEL_SCALES.find((m) => m.id === modelId) || MODEL_SCALES[0];

    const ridgePoint = chip.peakTflops / chip.bwTBs;
    const ai =
      stage === 'decode'
        ? (2 * batch) / prec.bytes
        : (2 * 1024 * batch) / prec.bytes;

    const achievedTflops = Math.min(chip.peakTflops, ai * chip.bwTBs);
    const mfuPct = (achievedTflops / chip.peakTflops) * 100;
    const isComputeBound = ai >= ridgePoint;

    const weightsGB = model.paramsB * prec.bytes;
    const batch1LimitTps = (chip.bwTBs * 1000) / weightsGB;

    // Decode step total throughput estimate (weights moved once per batch)
    const stepMemMs = (weightsGB / (chip.bwTBs * 1000)) * 1000;
    const stepFlopsG = 2 * model.paramsB * batch;
    const stepCompMs = (stepFlopsG / (chip.peakTflops * 1000)) * 1000;
    const stepTimeMs = Math.max(stepMemMs, stepCompMs);
    const decodePerUserTps = 1000 / stepTimeMs;
    const decodeTotalTps = decodePerUserTps * batch;

    // SVG coordinates for selected chip
    const xStart = mapX(0.25);
    const yStart = mapY(0.25 * chip.bwTBs);
    const xRidge = mapX(ridgePoint);
    const yRidge = mapY(chip.peakTflops);
    const xEnd = mapX(16384);

    // Dot coords
    const dotX = mapX(ai);
    const dotY = mapY(achievedTflops);

    // Comparison GDDR (RTX 4090) line
    const gddrChip = ROOFLINE_CHIPS[2];
    const gddrRidge = gddrChip.peakTflops / gddrChip.bwTBs;
    const gddrPts = `${mapX(0.25)},${mapY(0.25 * gddrChip.bwTBs)} ${mapX(gddrRidge)},${mapY(
      gddrChip.peakTflops
    )} ${mapX(16384)},${mapY(gddrChip.peakTflops)}`;

    return {
      chip,
      prec,
      model,
      ridgePoint,
      ai,
      achievedTflops,
      mfuPct,
      isComputeBound,
      weightsGB,
      batch1LimitTps,
      decodePerUserTps,
      decodeTotalTps,
      xStart,
      yStart,
      xRidge,
      yRidge,
      xEnd,
      dotX,
      dotY,
      gddrPts,
    };
  }, [chipId, modelId, precisionId, stage, batch]);

  const xTicks = [0.25, 1, 4, 16, 64, 256, 1024, 4096, 16384];
  const yTicks = [0.25, 1, 4, 16, 64, 256, 1024, 4096];

  return (
    <div className="space-y-6">
      <div className="grid lg:grid-cols-12 gap-6 items-start">
        {/* Left Control Panel */}
        <div className="lg:col-span-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120]/95 p-5 sm:p-6 space-y-5 shadow-sm">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-200 dark:border-slate-800">
            <Sliders className="w-4 h-4 text-sky-400" />
            <h2 className="font-bold text-base text-slate-900 dark:text-white">
              硬件平台 & 推理负载控制台
            </h2>
          </div>

          {/* Chip Preset Dropdown */}
          <div className="space-y-2">
            <label className="text-xs font-mono font-semibold text-slate-500 dark:text-slate-400">
              目标芯片硬件预设
            </label>
            <select
              value={chipId}
              onChange={(e) => setChipId(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl text-sm font-medium border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:border-sky-400"
            >
              {ROOFLINE_CHIPS.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>

            <label className="inline-flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 pt-1 cursor-pointer">
              <input
                type="checkbox"
                checked={showCompareGddr}
                onChange={(e) => setShowCompareGddr(e.target.checked)}
                className="accent-amber-400 rounded"
              />
              <span>叠加参考虚线：GDDR6X (RTX 4090 · 1.0 TB/s) 对比斜坡抬升</span>
            </label>
          </div>

          {/* Model & Precision */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-mono font-semibold text-slate-500 dark:text-slate-400">
                模型规模
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {MODEL_SCALES.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setModelId(m.id)}
                    className={`py-2 rounded-lg text-xs font-mono font-bold border transition-colors ${
                      modelId === m.id
                        ? 'bg-sky-500 text-slate-950 border-sky-400'
                        : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {m.id}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-mono font-semibold text-slate-500 dark:text-slate-400">
                数值精度
              </label>
              <div className="grid grid-cols-3 gap-1">
                {Object.values(PRECISION_BYTES).map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setPrecisionId(p.id)}
                    className={`py-2 rounded-lg text-[11px] font-mono font-bold border transition-colors ${
                      precisionId === p.id
                        ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                        : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {p.id}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Stage Switch: Prefill vs Decode */}
          <div className="space-y-2">
            <label className="text-xs font-mono font-semibold text-slate-500 dark:text-slate-400">
              推理阶段切换（读题 vs 写字）
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setStage('decode')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  stage === 'decode'
                    ? 'border-amber-400 bg-amber-500/12'
                    : 'border-slate-200 dark:border-slate-800'
                }`}
              >
                <div className="text-xs font-bold text-slate-900 dark:text-white">
                  ✍️ Decode 逐字写字
                </div>
                <div className="text-[11px] font-mono text-slate-500 mt-0.5">
                  AI ≈ 2·Batch ÷ 字节数
                </div>
              </button>
              <button
                onClick={() => setStage('prefill')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  stage === 'prefill'
                    ? 'border-emerald-400 bg-emerald-500/12'
                    : 'border-slate-200 dark:border-slate-800'
                }`}
              >
                <div className="text-xs font-bold text-slate-900 dark:text-white">
                  📖 Prefill 读题 (L=1024)
                </div>
                <div className="text-[11px] font-mono text-slate-500 mt-0.5">
                  AI ≈ 2048·Batch ÷ 字节数
                </div>
              </button>
            </div>
          </div>

          {/* Batch Size Slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
                并发 Batch Size
              </label>
              <span className="font-mono text-sm font-bold text-sky-600 dark:text-sky-400 bg-sky-500/10 px-2.5 py-0.5 rounded-md border border-sky-500/20">
                Batch = {batch}
              </span>
            </div>
            <input
              type="range"
              min={1}
              max={256}
              step={1}
              value={batch}
              onChange={(e) => setBatch(Number(e.target.value))}
              className="w-full silicon-slider bg-slate-200 dark:bg-slate-800"
            />
            <div className="flex justify-between text-[11px] font-mono text-slate-400">
              <span>1</span>
              <span>32</span>
              <span>64</span>
              <span>128</span>
              <span>256</span>
            </div>
          </div>

          {/* Diagnostic Readout Card */}
          <div
            className={`rounded-xl border p-4 space-y-2 ${
              sim.isComputeBound
                ? 'border-emerald-500/40 bg-emerald-500/10'
                : 'border-amber-500/40 bg-amber-500/10'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-slate-900 dark:text-white">
                {sim.isComputeBound ? '🔥 Compute-Bound（算力吃满区）' : '🧱 Memory-Bound（撞上内存墙）'}
              </span>
              <span className="font-mono text-xs font-bold text-sky-600 dark:text-sky-300">
                MFU {sim.mfuPct.toFixed(1)}%
              </span>
            </div>
            <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-200">
              {sim.isComputeBound
                ? `当前算术强度 ${sim.ai.toFixed(1)} ≥ 硬件脊点 ${sim.ridgePoint.toFixed(1)} FLOPs/B，成功爬上屋顶平顶！此时再加 Batch 算力已不再增长，提速要靠换更低精度或更强芯片。`
                : `当前撞上内存墙！算力利用率仅 ${sim.mfuPct.toFixed(1)}%（斜坡下干等搬运），建议增大 Batch Size（当前 ${batch}）或开启 INT4/FP8 量化把点向右推！`}
            </p>
          </div>
        </div>

        {/* Right Log-Log Roofline Chart & Telemetry */}
        <div className="lg:col-span-7 space-y-5">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120]/95 p-5 sm:p-6 space-y-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-sky-400" />
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  双对数 Roofline 心电图（{sim.chip.short}）
                </h3>
              </div>
              <span className="font-mono text-xs text-slate-500 dark:text-slate-400">
                Ridge Point = {sim.ridgePoint.toFixed(1)} FLOPs/Byte
              </span>
            </div>

            {/* SVG Log-Log Plot */}
            <div className="rounded-xl bg-slate-950 border border-slate-800 p-3 overflow-x-auto">
              <svg
                viewBox={`0 0 ${SVG_W} ${SVG_H}`}
                className="w-full h-auto min-w-[480px] select-none"
              >
                {/* Grid lines */}
                {xTicks.map((t) => {
                  const x = mapX(t);
                  return (
                    <g key={`x-${t}`}>
                      <line
                        x1={x}
                        y1={PAD.top}
                        x2={x}
                        y2={SVG_H - PAD.bottom}
                        stroke="#1E293B"
                        strokeWidth="1"
                      />
                      <text
                        x={x}
                        y={SVG_H - PAD.bottom + 16}
                        textAnchor="middle"
                        fill="#64748B"
                        fontSize="10"
                        fontFamily="monospace"
                      >
                        {t}
                      </text>
                    </g>
                  );
                })}
                {yTicks.map((t) => {
                  const y = mapY(t);
                  return (
                    <g key={`y-${t}`}>
                      <line
                        x1={PAD.left}
                        y1={y}
                        x2={SVG_W - PAD.right}
                        y2={y}
                        stroke="#1E293B"
                        strokeWidth="1"
                      />
                      <text
                        x={PAD.left - 8}
                        y={y + 3}
                        textAnchor="end"
                        fill="#64748B"
                        fontSize="10"
                        fontFamily="monospace"
                      >
                        {t}
                      </text>
                    </g>
                  );
                })}

                {/* Axis Titles */}
                <text
                  x={(PAD.left + SVG_W - PAD.right) / 2}
                  y={SVG_H - 6}
                  textAnchor="middle"
                  fill="#94A3B8"
                  fontSize="11"
                  fontFamily="monospace"
                >
                  算术强度 Arithmetic Intensity (FLOPs / Byte · 对数坐标)
                </text>
                <text
                  x={14}
                  y={(PAD.top + SVG_H - PAD.bottom) / 2}
                  textAnchor="middle"
                  fill="#94A3B8"
                  fontSize="11"
                  fontFamily="monospace"
                  transform={`rotate(-90 14 ${(PAD.top + SVG_H - PAD.bottom) / 2})`}
                >
                  可达算力 TFLOPS
                </text>

                {/* Optional GDDR Comparison Line */}
                {showCompareGddr && (
                  <polyline
                    points={sim.gddrPts}
                    fill="none"
                    stroke="#64748B"
                    strokeWidth="2"
                    strokeDasharray="6 4"
                  />
                )}

                {/* Ridge Point Vertical Dashed Marker */}
                <line
                  x1={sim.xRidge}
                  y1={sim.yRidge}
                  x2={sim.xRidge}
                  y2={SVG_H - PAD.bottom}
                  stroke="#38BDF8"
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                />
                <text
                  x={sim.xRidge + 6}
                  y={PAD.top + 16}
                  fill="#38BDF8"
                  fontSize="10"
                  fontFamily="monospace"
                >
                  拐点 {sim.ridgePoint.toFixed(0)}
                </text>

                {/* Roofline Slope (Amber Memory-Bound) */}
                <line
                  x1={sim.xStart}
                  y1={sim.yStart}
                  x2={sim.xRidge}
                  y2={sim.yRidge}
                  stroke="#F59E0B"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                />

                {/* Roofline Flat Ceiling (Emerald Compute-Bound) */}
                <line
                  x1={sim.xRidge}
                  y1={sim.yRidge}
                  x2={sim.xEnd}
                  y2={sim.yRidge}
                  stroke="#10B981"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                />

                {/* Region Badges */}
                <text
                  x={sim.xStart + 18}
                  y={sim.yStart - 14}
                  fill="#FBBF24"
                  fontSize="10"
                  fontFamily="monospace"
                >
                  斜坡: Memory-Bound ({sim.chip.bwTBs} TB/s)
                </text>
                <text
                  x={Math.min(sim.xRidge + 12, SVG_W - 180)}
                  y={sim.yRidge - 8}
                  fill="#34D399"
                  fontSize="10"
                  fontFamily="monospace"
                >
                  平顶: {sim.chip.peakTflops} TFLOPS
                </text>

                {/* Guide Crosshairs to Dot */}
                <line
                  x1={sim.dotX}
                  y1={sim.dotY}
                  x2={sim.dotX}
                  y2={SVG_H - PAD.bottom}
                  stroke="#F43F5E"
                  strokeWidth="1"
                  strokeDasharray="3 3"
                  opacity="0.7"
                />
                <line
                  x1={PAD.left}
                  y1={sim.dotY}
                  x2={sim.dotX}
                  y2={sim.dotY}
                  stroke="#F43F5E"
                  strokeWidth="1"
                  strokeDasharray="3 3"
                  opacity="0.7"
                />

                {/* Pulsing Glowing Task Point */}
                <circle cx={sim.dotX} cy={sim.dotY} r="12" fill="#F43F5E" opacity="0.25">
                  <animate
                    attributeName="r"
                    values="9;16;9"
                    dur="1.8s"
                    repeatCount="indefinite"
                  />
                </circle>
                <circle
                  cx={sim.dotX}
                  cy={sim.dotY}
                  r="6"
                  fill="#F43F5E"
                  stroke="#FFFFFF"
                  strokeWidth="2"
                />
              </svg>
            </div>

            {/* 4 Telemetry Readout Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800">
                <div className="text-[11px] text-slate-500 dark:text-slate-400">当前算术强度 AI</div>
                <div className="text-base font-mono font-bold text-slate-900 dark:text-white mt-0.5">
                  {sim.ai.toFixed(1)}
                </div>
                <div className="text-[10px] font-mono text-slate-400">
                  脊点 {sim.ridgePoint.toFixed(1)} FLOP/B
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800">
                <div className="text-[11px] text-slate-500 dark:text-slate-400">实际可达算力</div>
                <div className="text-base font-mono font-bold text-sky-600 dark:text-sky-400 mt-0.5">
                  {sim.achievedTflops.toFixed(1)} TF
                </div>
                <div className="text-[10px] font-mono text-slate-400">
                  利用率 MFU {sim.mfuPct.toFixed(1)}%
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800">
                <div className="text-[11px] text-slate-500 dark:text-slate-400">权重搬运体积</div>
                <div className="text-base font-mono font-bold text-amber-600 dark:text-amber-400 mt-0.5">
                  {sim.weightsGB.toFixed(1)} GB
                </div>
                <div className="text-[10px] font-mono text-slate-400">
                  {modelId} · {precisionId}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800">
                <div className="text-[11px] text-slate-500 dark:text-slate-400">Batch=1 极限吐字</div>
                <div className="text-base font-mono font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                  {sim.batch1LimitTps.toFixed(1)} tok/s
                </div>
                <div className="text-[10px] font-mono text-slate-400">
                  带宽 ÷ 权重体积
                </div>
              </div>
            </div>

            <div className="rounded-xl bg-slate-100/80 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 p-4 flex items-start gap-3">
              <Sparkles className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
              <div className="text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                <Cpu className="w-3.5 h-3.5 inline mr-1 text-sky-400" />
                <strong className="text-slate-900 dark:text-white">纸面算账结论：</strong>
                在 <span className="font-mono font-bold">{sim.chip.short}</span>（{sim.chip.bwTBs} TB/s）上跑{' '}
                <span className="font-mono font-bold">{modelId} {precisionId}</span>（权重 {sim.weightsGB.toFixed(1)} GB），单人 Decode 物理天花板为{' '}
                <span className="font-mono font-bold text-emerald-500">{sim.batch1LimitTps.toFixed(1)} tok/s</span>；当前 Batch={batch} 时系统总吐字极限约为{' '}
                <span className="font-mono font-bold text-sky-500">{sim.decodeTotalTps.toFixed(0)} tok/s</span>（{stage === 'prefill' ? '当前处于 Prefill 大矩阵算力平顶' : 'Decode 随 Batch 增大线性摊薄搬运成本'}）。
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
