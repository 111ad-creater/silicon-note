import React, { useState, useEffect, useMemo } from 'react';
import { Microscope, Sparkles, Sliders, ShieldAlert, CheckCircle2 } from 'lucide-react';

export const PRECISION_FORMATS = [
  {
    id: 'FP32',
    label: 'FP32',
    bits: 32,
    s: 1,
    e: 8,
    m: 23,
    rangeDesc: '±3.4 × 10³⁸',
    precisionDesc: '~7 位有效数字',
    usage: '科学计算、训练主权重备份',
  },
  {
    id: 'FP16',
    label: 'FP16',
    bits: 16,
    s: 1,
    e: 5,
    m: 10,
    rangeDesc: '±65,504（易溢出）',
    precisionDesc: '~3.3 位有效数字',
    usage: '推理加速、需 Loss Scaling 训练',
  },
  {
    id: 'BF16',
    label: 'BF16',
    bits: 16,
    s: 1,
    e: 8,
    m: 7,
    rangeDesc: '±3.4 × 10³⁸（同 FP32）',
    precisionDesc: '~2.4 位有效数字',
    usage: '大模型预训练 & 推理主力格式',
  },
  {
    id: 'FP8_E4M3',
    label: 'FP8 (E4M3)',
    bits: 8,
    s: 1,
    e: 4,
    m: 3,
    rangeDesc: '±448',
    precisionDesc: '~1.2 位有效数字',
    usage: 'H100/B200 权重与前向高吞吐推理',
  },
  {
    id: 'FP8_E5M2',
    label: 'FP8 (E5M2)',
    bits: 8,
    s: 1,
    e: 5,
    m: 2,
    rangeDesc: '±57,344',
    precisionDesc: '~0.9 位有效数字',
    usage: 'FP8 训练反向传播梯度计算',
  },
  {
    id: 'INT4',
    label: 'INT4',
    bits: 4,
    s: 1,
    e: 0,
    m: 3,
    isInt: true,
    rangeDesc: '-8 ~ +7（依赖分组缩放）',
    precisionDesc: '仅 16 个离散整数格',
    usage: 'AWQ/GPTQ W4A16 极致省带宽推理',
  },
];

// Deterministic 20 normal activations inside [-0.95, 0.95]
const NORMAL_ACTIVATIONS = [
  0.42, -0.68, 0.25, 0.81, -0.34, 0.56, -0.91, 0.14, -0.47, 0.63,
  -0.22, 0.77, -0.58, 0.31, -0.84, 0.49, -0.19, 0.66, -0.73, 0.38,
];

function getAreaRatio(fmt) {
  if (fmt.isInt) return ((3 / 23) ** 2) * 100; // ~1.7% integer multiplier area
  return ((fmt.m / 23) ** 2) * 100;
}

function normalizeFormatId(raw) {
  if (!raw) return null;
  const s = String(raw).trim().toUpperCase();
  if (s === 'FP8' || s === 'E4M3' || s === 'FP8_E4M3' || s === 'FP8 (E4M3)') return 'FP8_E4M3';
  if (s === 'E5M2' || s === 'FP8_E5M2' || s === 'FP8 (E5M2)') return 'FP8_E5M2';
  const found = PRECISION_FORMATS.find((f) => f.id === s || f.label.toUpperCase() === s);
  return found ? found.id : null;
}

function BitStrip({ fmt }) {
  const cells = [];
  if (fmt.isInt) {
    cells.push({ type: 'S', key: 's0', label: 'S' });
    for (let i = 0; i < 3; i += 1) {
      cells.push({ type: 'INT', key: `int${i}`, label: 'B' });
    }
  } else {
    for (let i = 0; i < fmt.s; i += 1) cells.push({ type: 'S', key: `s${i}`, label: 'S' });
    for (let i = 0; i < fmt.e; i += 1) cells.push({ type: 'E', key: `e${i}`, label: 'E' });
    for (let i = 0; i < fmt.m; i += 1) cells.push({ type: 'M', key: `m${i}`, label: 'M' });
  }

  return (
    <div className="flex flex-wrap gap-1">
      {cells.map((c) => (
        <span
          key={c.key}
          title={
            c.type === 'S'
              ? '符号位 (Sign)'
              : c.type === 'E'
                ? '指数位 (Exponent · 管范围)'
                : c.type === 'M'
                  ? '尾数位 (Mantissa · 管精度)'
                  : '整数数值位'
          }
          className={`w-5 h-6 rounded text-[10px] font-mono font-bold flex items-center justify-center border ${
            c.type === 'S'
              ? 'bg-rose-500/20 border-rose-500/50 text-rose-500 dark:text-rose-300'
              : c.type === 'E'
                ? 'bg-sky-500/20 border-sky-500/50 text-sky-600 dark:text-sky-300'
                : c.type === 'M'
                  ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-600 dark:text-emerald-300'
                  : 'bg-amber-500/20 border-amber-500/50 text-amber-600 dark:text-amber-300'
          }`}
        >
          {c.label}
        </span>
      ))}
    </div>
  );
}

export default function Lab3PrecisionQuant({ preset, presetNonce }) {
  const [focusTab, setFocusTab] = useState('all'); // 'all' | 'bits' | 'outlier'
  const [formatA, setFormatA] = useState('BF16');
  const [formatB, setFormatB] = useState('FP16');
  const [outlierK, setOutlierK] = useState(10); // 1 .. 20
  const [smoothQuant, setSmoothQuant] = useState(false);

  useEffect(() => {
    if (!preset) return;
    if (preset.tab === 'outlier') {
      setFocusTab('outlier');
    } else if (preset.format || preset.compare) {
      setFocusTab('all');
    }
    const fa = normalizeFormatId(preset.format);
    if (fa) setFormatA(fa);
    const fb = normalizeFormatId(preset.compare);
    if (fb) setFormatB(fb);
    if (typeof preset.outlierK === 'number' && !Number.isNaN(preset.outlierK)) {
      setOutlierK(Math.min(20, Math.max(1, preset.outlierK)));
    }
    if (typeof preset.smoothquant === 'boolean') {
      setSmoothQuant(preset.smoothquant);
    }
  }, [preset, presetNonce]);

  const fmtAObj = useMemo(
    () => PRECISION_FORMATS.find((f) => f.id === formatA) || PRECISION_FORMATS[2],
    [formatA]
  );
  const fmtBObj = useMemo(
    () => PRECISION_FORMATS.find((f) => f.id === formatB) || PRECISION_FORMATS[1],
    [formatB]
  );

  // Quantization simulation math (INT4 symmetric [-7, 7])
  const quantSim = useMemo(() => {
    const rawValues = [...NORMAL_ACTIVATIONS, outlierK];
    const sqrtK = Math.sqrt(outlierK);

    const calcPass = (useSmooth) => {
      const transformed = rawValues.map((v, idx) =>
        useSmooth && idx === rawValues.length - 1 ? v / sqrtK : v
      );
      const maxAbs = Math.max(...transformed.map((x) => Math.abs(x)), 1e-6);
      const scale = maxAbs / 7;
      const quantized = transformed.map((x) => {
        const q = Math.max(-7, Math.min(7, Math.round(x / scale)));
        const deq = q * scale;
        return { orig: x, q, deq, errSq: (x - deq) ** 2 };
      });
      const normalOnly = quantized.slice(0, NORMAL_ACTIVATIONS.length);
      const normalMse =
        normalOnly.reduce((acc, item) => acc + item.errSq, 0) / normalOnly.length;
      const allMse =
        quantized.reduce((acc, item) => acc + item.errSq, 0) / quantized.length;
      const zeroSquashedCount = normalOnly.filter((item) => item.q === 0).length;

      return {
        transformed,
        maxAbs,
        scale,
        quantized,
        normalMse,
        allMse,
        zeroSquashedCount,
      };
    };

    const basePass = calcPass(false);
    const activePass = calcPass(smoothQuant);
    const smoothPass = calcPass(true);
    const mseReductionPct =
      basePass.allMse > 0
        ? Math.max(0, ((basePass.allMse - smoothPass.allMse) / basePass.allMse) * 100)
        : 0;

    return {
      sqrtK,
      basePass,
      activePass,
      smoothPass,
      mseReductionPct,
      weightAfterSmooth: 0.5 * sqrtK,
    };
  }, [outlierK, smoothQuant]);

  const showBits = focusTab === 'all' || focusTab === 'bits';
  const showOutlier = focusTab === 'all' || focusTab === 'outlier';

  return (
    <div className="space-y-6">
      {/* Sub-view switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex p-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100/80 dark:bg-slate-900/80">
          {[
            { id: 'all', label: '全景同屏 (上下两区)' },
            { id: 'bits', label: '🔬 仅看比特显微镜' },
            { id: 'outlier', label: '🦖 仅看离群值与 SmoothQuant' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setFocusTab(t.id)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                focusTab === t.id
                  ? 'bg-white dark:bg-[#0B1120] text-sky-600 dark:text-sky-400 shadow-sm border border-slate-200/80 dark:border-slate-700'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 text-[11px] font-mono">
          <span className="flex items-center gap-1 text-rose-500">
            <span className="w-2.5 h-2.5 rounded bg-rose-500/40 border border-rose-500 inline-block" />
            S 符号位
          </span>
          <span className="flex items-center gap-1 text-sky-500">
            <span className="w-2.5 h-2.5 rounded bg-sky-500/40 border border-sky-500 inline-block" />
            E 指数位(范围)
          </span>
          <span className="flex items-center gap-1 text-emerald-500">
            <span className="w-2.5 h-2.5 rounded bg-emerald-500/40 border border-emerald-500 inline-block" />
            M 尾数位(精度)
          </span>
        </div>
      </div>

      {/* UPPER SECTION: BIT MICROSCOPE */}
      {showBits && (
        <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120]/95 p-5 sm:p-6 space-y-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Microscope className="w-5 h-5 text-sky-400" />
              <h2 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white">
                上半区 · 低精度比特显微镜 & 乘法器硅片面积对比
              </h2>
            </div>
            <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
              硬件面积公式：乘法器相对面积 ≈ (M ÷ 23)²
            </span>
          </div>

          {/* Two Format Columns */}
          <div className="grid md:grid-cols-2 gap-5">
            {[
              { title: '主观察格式 A', value: formatA, setter: setFormatA, obj: fmtAObj, color: 'sky' },
              { title: '对照格式 B', value: formatB, setter: setFormatB, obj: fmtBObj, color: 'emerald' },
            ].map((slot) => {
              const areaPct = getAreaRatio(slot.obj);
              const squarePx = Math.max(18, Math.round(Math.sqrt(areaPct / 100) * 88));
              return (
                <div
                  key={slot.title}
                  className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 p-4 space-y-4"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-mono font-semibold text-slate-500 dark:text-slate-400">
                      {slot.title}
                    </span>
                    <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-200/70 dark:bg-slate-800 text-slate-700 dark:text-slate-200">
                      {slot.obj.bits}-bit · {slot.obj.s}/{slot.obj.e}/{slot.obj.m}
                    </span>
                  </div>

                  {/* Format selector pills */}
                  <div className="flex flex-wrap gap-1.5">
                    {PRECISION_FORMATS.map((f) => (
                      <button
                        key={f.id}
                        onClick={() => slot.setter(f.id)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-mono border transition-all ${
                          slot.value === f.id
                            ? slot.color === 'sky'
                              ? 'bg-sky-500 text-slate-950 border-sky-400 font-bold'
                              : 'bg-emerald-500 text-slate-950 border-emerald-400 font-bold'
                            : 'bg-white dark:bg-[#0B1120] border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-sky-400/50'
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>

                  {/* Bit Cells */}
                  <div className="p-3 rounded-xl bg-white dark:bg-[#060A13] border border-slate-200/80 dark:border-slate-800 space-y-2">
                    <div className="text-[11px] font-mono text-slate-400">
                      真实比特排列（共 {slot.obj.bits} 位）
                    </div>
                    <BitStrip fmt={slot.obj} />
                  </div>

                  {/* Silicon Die Area Visual */}
                  <div className="flex items-center gap-4 p-3 rounded-xl bg-white dark:bg-[#060A13] border border-slate-200/80 dark:border-slate-800">
                    <div className="w-24 h-24 rounded-lg border border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center relative shrink-0 bg-slate-50 dark:bg-slate-900/50">
                      <span className="absolute top-1 left-1.5 text-[9px] font-mono text-slate-400">
                        FP32 框
                      </span>
                      <div
                        className={`rounded transition-all duration-300 flex items-center justify-center font-mono text-[10px] font-bold ${
                          slot.color === 'sky'
                            ? 'bg-sky-500/30 border-2 border-sky-400 text-sky-600 dark:text-sky-200'
                            : 'bg-emerald-500/30 border-2 border-emerald-400 text-emerald-700 dark:text-emerald-200'
                        }`}
                        style={{ width: `${squarePx}px`, height: `${squarePx}px` }}
                      >
                        {areaPct >= 8 ? `${areaPct.toFixed(1)}%` : ''}
                      </div>
                    </div>

                    <div className="space-y-1 text-xs flex-1">
                      <div className="font-semibold text-slate-900 dark:text-white">
                        乘法器硅片面积：
                        <span className="font-mono text-base ml-1 text-sky-600 dark:text-sky-400">
                          {areaPct.toFixed(1)}%
                        </span>
                        <span className="text-[11px] text-slate-400 ml-1">(相对 FP32)</span>
                      </div>
                      <div className="text-slate-600 dark:text-slate-400">
                        量程：<span className="font-mono text-slate-800 dark:text-slate-200">{slot.obj.rangeDesc}</span>
                      </div>
                      <div className="text-slate-600 dark:text-slate-400">
                        用途：{slot.obj.usage}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* LOWER SECTION: OUTLIER DESTRUCTION & SMOOTHQUANT */}
      {showOutlier && (
        <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120]/95 p-5 sm:p-6 space-y-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Sliders className="w-5 h-5 text-amber-400" />
              <h2 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white">
                下半区 · INT4 量化“离群值巨人”灾难 & SmoothQuant 削平实验
              </h2>
            </div>

            <button
              type="button"
              onClick={() => setSmoothQuant((v) => !v)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                smoothQuant
                  ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-glow-chip'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white border-indigo-500'
              }`}
            >
              <span>{smoothQuant ? '✅ SmoothQuant 平滑迁移已开启' : '🪄 点击开启 SmoothQuant 平滑迁移'}</span>
            </button>
          </div>

          <div className="grid lg:grid-cols-12 gap-6 items-start">
            {/* Controls & MSE Comparison */}
            <div className="lg:col-span-5 space-y-4">
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
                    离群值“巨人”倍数 K
                  </label>
                  <span className="font-mono text-sm font-bold text-rose-500 bg-rose-500/10 px-2.5 py-0.5 rounded-md border border-rose-500/20">
                    K = {outlierK}.0x
                  </span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={20}
                  step={1}
                  value={outlierK}
                  onChange={(e) => setOutlierK(Number(e.target.value))}
                  className="w-full silicon-slider bg-slate-200 dark:bg-slate-800"
                />
                <div className="flex justify-between text-[11px] font-mono text-slate-400">
                  <span>1x (无巨人)</span>
                  <span>10x (10米巨人)</span>
                  <span>20x (极端离群)</span>
                </div>
              </div>

              {/* Equivalent Math Transform Box */}
              <div className="rounded-xl bg-slate-900 dark:bg-[#050811] border border-slate-800 p-4 font-mono text-xs text-slate-300 space-y-2">
                <div className="text-sky-400 font-semibold">// SmoothQuant 等价迁移公式</div>
                <div>
                  原始巨人激活 X<sub>out</sub> = <span className="text-rose-400 font-bold">{outlierK.toFixed(1)}</span>
                  ，权重 W<sub>out</sub> = <span className="text-slate-200">0.50</span>
                </div>
                <div>
                  迁移系数 s = √K = <span className="text-emerald-400 font-bold">{quantSim.sqrtK.toFixed(2)}</span>
                </div>
                <div className="pt-1 border-t border-slate-800">
                  {smoothQuant ? (
                    <span className="text-emerald-300">
                      ✅ X ÷ √K = <strong>{(outlierK / quantSim.sqrtK).toFixed(2)}</strong>（被削平!）
                      · W × √K = <strong>{quantSim.weightAfterSmooth.toFixed(2)}</strong>（数学乘积恒等）
                    </span>
                  ) : (
                    <span className="text-amber-300">
                      ⚠️ 未开启迁移：INT4 尺子步长被迫拉大到 {quantSim.basePass.scale.toFixed(2)}，正常同学全挤成 0！
                    </span>
                  )}
                </div>
              </div>

              {/* KPI Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800">
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">当前量化误差 MSE</div>
                  <div
                    className={`text-lg font-mono font-bold mt-0.5 ${
                      smoothQuant ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'
                    }`}
                  >
                    {quantSim.activePass.allMse.toFixed(4)}
                  </div>
                  <div className="text-[10px] font-mono text-slate-400">
                    {smoothQuant
                      ? `比未开启暴降 ${quantSim.mseReductionPct.toFixed(1)}%`
                      : `开启后可降至 ${quantSim.smoothPass.allMse.toFixed(4)}`}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800">
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">被压扁成 0 的正常值</div>
                  <div
                    className={`text-lg font-mono font-bold mt-0.5 ${
                      quantSim.activePass.zeroSquashedCount > 6
                        ? 'text-rose-500'
                        : 'text-emerald-600 dark:text-emerald-400'
                    }`}
                  >
                    {quantSim.activePass.zeroSquashedCount} / 20 个
                  </div>
                  <div className="text-[10px] font-mono text-slate-400">
                    占正常通道 {((quantSim.activePass.zeroSquashedCount / 20) * 100).toFixed(0)}%
                  </div>
                </div>
              </div>
            </div>

            {/* Bar Chart Comparison */}
            <div className="lg:col-span-7 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-950 p-4 sm:p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="font-semibold text-white">
                  20 个正常激活通道 + 1 个离群值巨人（蓝色=原值，琥珀/绿=INT4 量化还原值）
                </span>
                {smoothQuant ? (
                  <span className="inline-flex items-center gap-1 text-emerald-400 font-mono">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    误差暴降 {quantSim.mseReductionPct.toFixed(0)}%
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-rose-400 font-mono">
                    <ShieldAlert className="w-3.5 h-3.5" />
                    {quantSim.activePass.zeroSquashedCount} 个正常值丢失成 0
                  </span>
                )}
              </div>

              {/* Chart Plot */}
              <div className="h-56 flex items-end gap-1.5 pt-6 pb-2 border-b border-slate-800 relative">
                {quantSim.activePass.quantized.map((item, idx) => {
                  const isOutlier = idx === quantSim.activePass.quantized.length - 1;
                  const scaleMax = Math.max(outlierK, 2);
                  const origHeightPct = Math.min(100, (Math.abs(item.orig) / scaleMax) * 100);
                  const deqHeightPct = Math.min(100, (Math.abs(item.deq) / scaleMax) * 100);
                  const squashedToZero = !isOutlier && item.q === 0;

                  return (
                    <div
                      key={idx}
                      className="flex-1 h-full flex flex-col justify-end items-center group relative"
                      title={
                        isOutlier
                          ? `巨人通道: 原值=${item.orig.toFixed(2)}, INT4还原=${item.deq.toFixed(2)}`
                          : `通道${idx + 1}: 原值=${item.orig.toFixed(2)}, INT4整数=${item.q}, 还原=${item.deq.toFixed(2)}`
                      }
                    >
                      {isOutlier && (
                        <span className="absolute -top-5 text-[10px] font-mono font-bold text-rose-400 whitespace-nowrap">
                          巨人 {item.orig.toFixed(1)}
                        </span>
                      )}
                      <div className="w-full flex items-end justify-center gap-0.5 h-full">
                        {/* Original bar */}
                        <div
                          className={`w-1/2 rounded-t transition-all duration-300 ${
                            isOutlier ? 'bg-rose-500' : 'bg-sky-500/80'
                          }`}
                          style={{ height: `${Math.max(2, origHeightPct)}%` }}
                        />
                        {/* Dequantized bar */}
                        <div
                          className={`w-1/2 rounded-t transition-all duration-300 ${
                            squashedToZero
                              ? 'bg-rose-500/40'
                              : smoothQuant
                                ? 'bg-emerald-400'
                                : 'bg-amber-400'
                          }`}
                          style={{ height: `${squashedToZero ? 2 : Math.max(3, deqHeightPct)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-slate-400">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm bg-sky-500 inline-block" />
                    原始正常激活 (|x| ≤ 1)
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm bg-rose-500 inline-block" />
                    离群巨人通道
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span
                      className={`w-2.5 h-2.5 rounded-sm inline-block ${
                        smoothQuant ? 'bg-emerald-400' : 'bg-amber-400'
                      }`}
                    />
                    INT4 量化后还原值
                  </span>
                </div>
                <span>第 21 根为离群巨人通道</span>
              </div>

              <div className="rounded-lg bg-slate-900 border border-slate-800 p-3 text-xs text-slate-300 flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  {smoothQuant ? (
                    <>
                      开启 SmoothQuant 后，10 米巨人被除以 <span className="font-mono text-emerald-300">√{outlierK} = {quantSim.sqrtK.toFixed(2)}</span> 削平，INT4 尺子步长瞬间变密，原本被压成 0 的正常激活值重新恢复了清晰刻度！
                    </>
                  ) : (
                    <>
                      当 K={outlierK} 时，INT4 的 16 个整数刻度必须硬撑到 ±{outlierK}，导致 20 个正常激活值里有{' '}
                      <span className="font-mono font-bold text-rose-400">{quantSim.activePass.zeroSquashedCount} 个</span>直接四舍五入变成 0！点击上方「开启 SmoothQuant」立刻抢救。
                    </>
                  )}
                </span>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
