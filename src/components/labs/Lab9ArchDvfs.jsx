import React, { useState, useMemo, useEffect } from 'react';
import {
  Cpu,
  Sliders,
  Flame,
  HardDrive,
  AlertOctagon,
  CheckCircle2,
  Sparkles,
  Thermometer,
} from 'lucide-react';

const STORAGE_MODES = [
  {
    id: '25d_hbm',
    label: '2.5D HBM3e',
    bwTBs: 3.35,
    moveEnergyPct: 58,
    thermalRisk: '中（散热片直触逻辑芯片）',
    summary: '生态最成熟、通用性强，但数据从 HBM 搬进核心仍吃掉过半能耗。',
  },
  {
    id: '3d_ic',
    label: '3D IC 垂直堆叠',
    bwTBs: 6.8,
    moveEnergyPct: 26,
    thermalRisk: '高（夹心层局部热点易蓄热）',
    summary: 'TSV 硅通孔缩短互连距离、能效飞跃，但必须警惕多层垂直堆叠的夹心层热点！',
  },
  {
    id: 'cim',
    label: '存算一体 CIM',
    bwTBs: 12.0,
    moveEnergyPct: 8,
    thermalRisk: '中（需联合建模噪声与精度）',
    summary: '在存储阵列内原地完成乘加，几乎消灭权重搬运能耗，需用 Co-Simulation 盯紧算法精度。',
  },
];

const COOLING_LEVELS = [
  { id: 'weak', label: '积灰弱风冷', rth: 0.165 },
  { id: 'air', label: '标准风冷', rth: 0.115 },
  { id: 'liquid', label: '冷板液冷', rth: 0.068 },
];

export default function Lab9ArchDvfs({ preset, presetNonce }) {
  const [mode, setMode] = useState('arch'); // 'arch' | 'os_dvfs'

  // Mode A: GPU Golden Model & 3D Storage PPA
  const [archPreset, setArchPreset] = useState('llama70b'); // 'llama70b' | 'storage3d'
  const [storageMode, setStorageMode] = useState('25d_hbm');
  const [tensorTflops, setTensorTflops] = useState(989);
  const [sramMb, setSramMb] = useState(64);
  const [memBwTBs, setMemBwTBs] = useState(3.35);

  // Mode B: OS Transfer & DVFS Thermal Throttling
  const [pinnedMem, setPinnedMem] = useState(false);
  const [numaBind, setNumaBind] = useState(false);
  const [voltageV, setVoltageV] = useState(1.0);
  const [freqGHz, setFreqGHz] = useState(1.8);
  const [coolingId, setCoolingId] = useState('air');

  useEffect(() => {
    if (!preset) return;
    if (preset.mode === 'arch' || preset.mode === 'os_dvfs') {
      setMode(preset.mode);
    }
    if (preset.subPreset === 'storage_3d_cim') {
      setMode('arch');
      setArchPreset('storage3d');
      setStorageMode('3d_ic');
      setMemBwTBs(6.8);
    } else if (preset.subPreset === 'gpu_golden_model') {
      setMode('arch');
      setArchPreset('llama70b');
    } else if (preset.subPreset === 'os_dma_numa') {
      setMode('os_dvfs');
      if (typeof preset.pinned === 'boolean') setPinnedMem(preset.pinned);
      if (typeof preset.numa === 'boolean') setNumaBind(preset.numa);
    } else if (preset.subPreset === 'dvfs_thermal') {
      setMode('os_dvfs');
      if (typeof preset.voltage === 'number') setVoltageV(preset.voltage);
      if (typeof preset.freq === 'number') setFreqGHz(preset.freq);
    }
  }, [preset, presetNonce]);

  const archSim = useMemo(() => {
    // Estimate PPA for Die Area (mm2) & TDP (W)
    const computeAreaMm2 = 180 + (tensorTflops / 2000) * 320;
    const sramAreaMm2 = (sramMb / 256) * 210;
    const ioAreaMm2 = 60 + (memBwTBs / 8.0) * 110;
    const totalAreaMm2 = computeAreaMm2 + sramAreaMm2 + ioAreaMm2;
    const estTdpW = 140 + (tensorTflops / 2000) * 420 + (memBwTBs / 8.0) * 180 + (sramMb / 256) * 60;

    // Hot Path Breakdown for Llama-70B Decode (Batch=16, 4K ctx)
    const gemmMs = (4200 / tensorTflops) * 1.4;
    const attnMs = (2400 / tensorTflops) * (128 / Math.max(32, sramMb));
    const elemMs = 1.6 * (3.35 / Math.max(1.0, memBwTBs));
    const hbmWaitMs = Math.max(0.8, (22.0 / memBwTBs) * (1 - Math.min(0.45, (sramMb - 16) / 480)));
    const totalMs = gemmMs + attnMs + elemMs + hbmWaitMs;

    const pctGemm = (gemmMs / totalMs) * 100;
    const pctAttn = (attnMs / totalMs) * 100;
    const pctElem = (elemMs / totalMs) * 100;
    const pctWait = (hbmWaitMs / totalMs) * 100;

    let advice = '';
    if (pctWait > 55 && tensorTflops > 800) {
      advice = `严重 Memory-Bound！HBM/DMA 搬运等待占了 ${pctWait.toFixed(0)}% 耗时，算力已严重过剩——再堆 Tensor Core 几乎零收益，应把硅片面积拿去增大片上 SRAM 或升级 HBM 带宽！`;
    } else if (sramMb < 48) {
      advice = '片上 SRAM 偏小导致 Attention 反复进出 HBM，建议将 SRAM 扩至 64MB+ 以吃下分块 Tiling 复用红利。';
    } else if (totalAreaMm2 > 780) {
      advice = `警告：估算总面积 ${totalAreaMm2.toFixed(0)} mm² 逼近单光罩极限（858 mm²），良率将急剧下滑，需考虑 Chiplet 拆芯粒方案！`;
    } else {
      advice = `PPA 架构配比均衡！算力、片上 SRAM 与显存带宽匹配良好，预估 Decode 吞吐可达 ${(1000 / totalMs * 16).toFixed(0)} tok/s（16 并发）。`;
    }

    const activeStorage = STORAGE_MODES.find((s) => s.id === storageMode) || STORAGE_MODES[0];

    return {
      totalAreaMm2,
      estTdpW,
      totalMs,
      pctGemm,
      pctAttn,
      pctElem,
      pctWait,
      advice,
      activeStorage,
    };
  }, [tensorTflops, sramMb, memBwTBs, storageMode]);

  const osDvfsSim = useMemo(() => {
    // OS Transfer
    const h2dBwGBs = 11 + (pinnedMem ? 21 : 0) + (numaBind ? 20 : 0); // 11 -> 32 -> 52 GB/s
    const bubblePct = 42 - (pinnedMem ? 18 : 0) - (numaBind ? 19 : 0); // 42% -> 5%

    // DVFS Power: P = alpha * C * V^2 * f + leakage
    const cooling = COOLING_LEVELS.find((c) => c.id === coolingId) || COOLING_LEVELS[1];
    const dynPowerW = 240 * (voltageV / 0.95) ** 2 * (freqGHz / 1.5);
    const staticLeakW = 35 * Math.exp((voltageV - 0.85) * 1.8);
    const rawPowerW = dynPowerW + staticLeakW;
    const junctionTempC = 32 + rawPowerW * cooling.rth;
    const isThrottling = junctionTempC > 85;
    const effectiveFreqGHz = isThrottling
      ? Math.max(0.85, freqGHz * (1 - Math.min(0.45, (junctionTempC - 85) * 0.025)))
      : freqGHz;
    const relThroughputPct = (effectiveFreqGHz / 1.8) * 100;

    return {
      h2dBwGBs,
      bubblePct,
      rawPowerW,
      junctionTempC,
      isThrottling,
      effectiveFreqGHz,
      relThroughputPct,
    };
  }, [pinnedMem, numaBind, voltageV, freqGHz, coolingId]);

  const applyStorageChoice = (s) => {
    setStorageMode(s.id);
    setMemBwTBs(Math.min(8.0, s.bwTBs));
  };

  return (
    <div className="space-y-6">
      {/* Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="inline-flex p-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100/80 dark:bg-slate-900/80">
          <button
            type="button"
            onClick={() => setMode('arch')}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
              mode === 'arch'
                ? 'bg-sky-500 text-slate-950 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Mode A · GPU 架构建模 (Golden Model & 3D 存储)
          </button>
          <button
            type="button"
            onClick={() => setMode('os_dvfs')}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
              mode === 'os_dvfs'
                ? 'bg-emerald-500 text-slate-950 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Mode B · OS 搬运与 DVFS 热节流排障台
          </button>
        </div>

        {mode === 'arch' && (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                setArchPreset('llama70b');
                setTensorTflops(989);
                setSramMb(64);
                setMemBwTBs(3.35);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                archPreset === 'llama70b'
                  ? 'border-sky-400 bg-sky-500/12 text-sky-700 dark:text-sky-300'
                  : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              预设：Llama-70B Decode
            </button>
            <button
              type="button"
              onClick={() => {
                setArchPreset('storage3d');
                setStorageMode('3d_ic');
                setMemBwTBs(6.8);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                archPreset === 'storage3d'
                  ? 'border-emerald-400 bg-emerald-500/12 text-emerald-700 dark:text-emerald-300'
                  : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              预设：2.5D HBM vs 3D 堆叠 vs 存算一体
            </button>
          </div>
        )}
      </div>

      {/* ==================== MODE A ==================== */}
      {mode === 'arch' && (
        <div className="space-y-6">
          {archPreset === 'storage3d' && (
            <div className="grid md:grid-cols-3 gap-4">
              {STORAGE_MODES.map((s) => {
                const active = storageMode === s.id;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => applyStorageChoice(s)}
                    className={`text-left rounded-2xl border p-4 space-y-2 transition-all ${
                      active
                        ? 'border-emerald-400 bg-emerald-500/10 shadow-sm'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120]/90 hover:border-sky-400/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-slate-900 dark:text-white">{s.label}</span>
                      <span className="font-mono text-xs font-bold text-sky-500">{s.bwTBs} TB/s</span>
                    </div>
                    <div className="text-xs font-mono text-amber-600 dark:text-amber-400">
                      搬运能耗占比：{s.moveEnergyPct}% · 热密度：{s.thermalRisk}
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{s.summary}</p>
                  </button>
                );
              })}
            </div>
          )}

          <div className="grid lg:grid-cols-12 gap-6 items-start">
            {/* Left Sliders */}
            <div className="lg:col-span-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120]/95 p-5 sm:p-6 space-y-5 shadow-sm">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-200 dark:border-slate-800">
                <Sliders className="w-4 h-4 text-sky-400" />
                <h2 className="font-bold text-base text-slate-900 dark:text-white">
                  Golden Model 架构参数滑块
                </h2>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs sm:text-sm">
                  <span className="font-medium text-slate-700 dark:text-slate-200">Tensor Core 峰值算力</span>
                  <span className="font-mono font-bold text-sky-500">{tensorTflops} TFLOPS</span>
                </div>
                <input
                  type="range"
                  min={100}
                  max={2000}
                  step={50}
                  value={tensorTflops}
                  onChange={(e) => setTensorTflops(Number(e.target.value))}
                  className="w-full silicon-slider bg-slate-200 dark:bg-slate-800"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs sm:text-sm">
                  <span className="font-medium text-slate-700 dark:text-slate-200">片上 SRAM 共享缓存容量</span>
                  <span className="font-mono font-bold text-emerald-500">{sramMb} MB</span>
                </div>
                <input
                  type="range"
                  min={16}
                  max={256}
                  step={8}
                  value={sramMb}
                  onChange={(e) => setSramMb(Number(e.target.value))}
                  className="w-full silicon-slider bg-slate-200 dark:bg-slate-800"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs sm:text-sm">
                  <span className="font-medium text-slate-700 dark:text-slate-200">显存总带宽 (HBM / 3D 存储)</span>
                  <span className="font-mono font-bold text-amber-500">{memBwTBs.toFixed(2)} TB/s</span>
                </div>
                <input
                  type="range"
                  min={1.0}
                  max={8.0}
                  step={0.15}
                  value={memBwTBs}
                  onChange={(e) => setMemBwTBs(Number(e.target.value))}
                  className="w-full silicon-slider bg-slate-200 dark:bg-slate-800"
                />
              </div>
            </div>

            {/* Right PPA + Hot Path */}
            <div className="lg:col-span-7 space-y-6">
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120]/95 p-5 sm:p-6 space-y-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Cpu className="w-5 h-5 text-sky-400" />
                    <h3 className="font-bold text-base text-slate-900 dark:text-white">
                      PPA 估算与算子热路径（Hot Path）拆解
                    </h3>
                  </div>
                  <span className="font-mono text-xs text-slate-500">
                    光罩面积红线 858 mm²
                  </span>
                </div>

                {/* PPA Metric Bars */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800 space-y-2">
                    <div className="flex justify-between text-xs font-mono">
                      <span>预估芯片面积 (Area)</span>
                      <strong className={archSim.totalAreaMm2 > 780 ? 'text-rose-500' : 'text-sky-500'}>
                        {archSim.totalAreaMm2.toFixed(0)} mm²
                      </strong>
                    </div>
                    <div className="h-3 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          archSim.totalAreaMm2 > 780 ? 'bg-rose-500' : 'bg-sky-500'
                        }`}
                        style={{ width: `${Math.min(100, (archSim.totalAreaMm2 / 858) * 100)}%` }}
                      />
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800 space-y-2">
                    <div className="flex justify-between text-xs font-mono">
                      <span>预估热设计功耗 (TDP)</span>
                      <strong className={archSim.estTdpW > 650 ? 'text-amber-500' : 'text-emerald-500'}>
                        {archSim.estTdpW.toFixed(0)} W
                      </strong>
                    </div>
                    <div className="h-3 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-400 to-amber-500 transition-all duration-300"
                        style={{ width: `${Math.min(100, (archSim.estTdpW / 800) * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Hot Path Stacked Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-mono text-slate-600 dark:text-slate-300">
                    <span>算子热路径耗时分布（单步 {archSim.totalMs.toFixed(2)} ms）</span>
                    <span>搬运等待 {archSim.pctWait.toFixed(0)}%</span>
                  </div>
                  <div className="h-8 rounded-xl overflow-hidden flex border border-slate-200 dark:border-slate-800 text-[10px] font-mono font-bold text-slate-950">
                    <div
                      className="bg-sky-400 flex items-center justify-center transition-all duration-300"
                      style={{ width: `${archSim.pctGemm}%` }}
                      title={`GEMM ${archSim.pctGemm.toFixed(1)}%`}
                    >
                      {archSim.pctGemm >= 12 ? `GEMM ${archSim.pctGemm.toFixed(0)}%` : ''}
                    </div>
                    <div
                      className="bg-emerald-400 flex items-center justify-center transition-all duration-300"
                      style={{ width: `${archSim.pctAttn}%` }}
                      title={`Attention ${archSim.pctAttn.toFixed(1)}%`}
                    >
                      {archSim.pctAttn >= 12 ? `Attn ${archSim.pctAttn.toFixed(0)}%` : ''}
                    </div>
                    <div
                      className="bg-indigo-400 flex items-center justify-center transition-all duration-300"
                      style={{ width: `${archSim.pctElem}%` }}
                      title={`RMSNorm/SiLU ${archSim.pctElem.toFixed(1)}%`}
                    >
                      {archSim.pctElem >= 10 ? `Norm` : ''}
                    </div>
                    <div
                      className="bg-amber-400 flex items-center justify-center transition-all duration-300"
                      style={{ width: `${archSim.pctWait}%` }}
                      title={`HBM/DMA 等待 ${archSim.pctWait.toFixed(1)}%`}
                    >
                      {archSim.pctWait >= 15 ? `HBM等待 ${archSim.pctWait.toFixed(0)}%` : ''}
                    </div>
                  </div>
                </div>

                <div className="rounded-xl bg-slate-100/80 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 p-4 flex items-start gap-3">
                  <Sparkles className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                  <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                    <strong className="text-slate-900 dark:text-white">架构师诊断建议：</strong>
                    {archSim.advice}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== MODE B ==================== */}
      {mode === 'os_dvfs' && (
        <div className="grid lg:grid-cols-12 gap-6 items-start">
          {/* Left: OS Transfer Panel */}
          <div className="lg:col-span-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120]/95 p-5 sm:p-6 space-y-5 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-sky-400" />
                <h2 className="font-bold text-base text-slate-900 dark:text-white">
                  OS 搬运通道与 NUMA 亲和性排障
                </h2>
              </div>
              <span className="font-mono text-xs font-bold text-sky-500">
                H2D 实测 {osDvfsSim.h2dBwGBs} GB/s
              </span>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPinnedMem((v) => !v)}
                className={`p-3.5 rounded-xl border text-left transition-all ${
                  pinnedMem
                    ? 'border-emerald-500/50 bg-emerald-500/10'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50'
                }`}
              >
                <div className="text-xs font-bold text-slate-900 dark:text-white">
                  {pinnedMem ? '✅ Pinned Memory 锁页内存' : '☐ 开启 Pinned Memory'}
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  跳过 OS 临时分页缓冲，PCIe DMA 直接搬运（pin_memory=True）
                </p>
              </button>

              <button
                type="button"
                onClick={() => setNumaBind((v) => !v)}
                className={`p-3.5 rounded-xl border text-left transition-all ${
                  numaBind
                    ? 'border-emerald-500/50 bg-emerald-500/10'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50'
                }`}
              >
                <div className="text-xs font-bold text-slate-900 dark:text-white">
                  {numaBind ? '✅ numactl 就近绑核' : '☐ 开启 NUMA 就近绑核'}
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  消除跨 CPU 插槽 UPI 绕路，数据直达直连 GPU
                </p>
              </button>
            </div>

            {/* Data Pipeline Visualization */}
            <div className="rounded-xl bg-slate-950 border border-slate-800 p-4 space-y-3">
              <div className="flex justify-between text-[11px] font-mono text-slate-400">
                <span>CPU Host → PCIe DMA → GPU HBM 数据管道</span>
                <span className={osDvfsSim.bubblePct <= 10 ? 'text-emerald-400' : 'text-rose-400'}>
                  GPU 饥饿气泡：{osDvfsSim.bubblePct}%
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs font-mono">
                <span className="px-2.5 py-1.5 rounded bg-slate-800 text-slate-200">
                  {numaBind ? 'CPU 0 (直连)' : 'CPU 1 (跨槽绕路!)'}
                </span>
                <div className="flex-1 h-2.5 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      pinnedMem && numaBind
                        ? 'bg-emerald-400'
                        : pinnedMem || numaBind
                          ? 'bg-amber-400'
                          : 'bg-rose-500'
                    }`}
                    style={{ width: `${(osDvfsSim.h2dBwGBs / 52) * 100}%` }}
                  />
                </div>
                <span className="px-2.5 py-1.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30">
                  GPU 0
                </span>
              </div>
            </div>
          </div>

          {/* Right: DVFS Thermal Throttling Panel */}
          <div
            className={`lg:col-span-6 rounded-2xl border p-5 sm:p-6 space-y-5 shadow-sm transition-all ${
              osDvfsSim.isThrottling
                ? 'border-rose-500 bg-rose-500/5 dark:bg-rose-950/20'
                : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120]/95'
            }`}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Thermometer
                  className={`w-4 h-4 ${osDvfsSim.isThrottling ? 'text-rose-500 animate-pulse' : 'text-emerald-400'}`}
                />
                <h2 className="font-bold text-base text-slate-900 dark:text-white">
                  硅后 DVFS 功耗与热节流（P = αCV²f）
                </h2>
              </div>
              <span
                className={`font-mono text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                  osDvfsSim.isThrottling
                    ? 'bg-rose-500 text-white border-rose-400'
                    : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30'
                }`}
              >
                结温 {osDvfsSim.junctionTempC.toFixed(1)}℃
              </span>
            </div>

            {osDvfsSim.isThrottling ? (
              <div className="rounded-xl border border-rose-500/50 bg-rose-500/15 p-3.5 flex items-start gap-2.5 text-xs text-rose-700 dark:text-rose-200">
                <AlertOctagon className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <div>
                  <div className="font-mono font-bold text-rose-600 dark:text-rose-300">
                    🚨 Thermal Throttling Active（结温突破 85℃ 红线！）
                  </div>
                  <p className="mt-1">
                    硬件强制降频保命！设定 {freqGHz.toFixed(2)} GHz 已跌落至{' '}
                    <strong className="font-mono">{osDvfsSim.effectiveFreqGHz.toFixed(2)} GHz</strong>
                    ，吐字吞吐同步暴跌！建议降低电压 V 或改善散热风道。
                  </p>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/5 p-3 flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-300">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>
                  温度健康！芯片稳定运行在目标频率 <strong className="font-mono">{osDvfsSim.effectiveFreqGHz.toFixed(2)} GHz</strong>（功耗 {osDvfsSim.rawPowerW.toFixed(0)} W）。
                </span>
              </div>
            )}

            <div className="space-y-4">
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span>供电电压 V（二次方影响功耗！）</span>
                  <span className="font-mono font-bold text-sky-500">{voltageV.toFixed(2)} V</span>
                </div>
                <input
                  type="range"
                  min={0.7}
                  max={1.15}
                  step={0.01}
                  value={voltageV}
                  onChange={(e) => setVoltageV(Number(e.target.value))}
                  className="w-full silicon-slider bg-slate-200 dark:bg-slate-800"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span>目标核心频率 f</span>
                  <span className="font-mono font-bold text-emerald-500">{freqGHz.toFixed(2)} GHz</span>
                </div>
                <input
                  type="range"
                  min={1.0}
                  max={2.2}
                  step={0.05}
                  value={freqGHz}
                  onChange={(e) => setFreqGHz(Number(e.target.value))}
                  className="w-full silicon-slider bg-slate-200 dark:bg-slate-800"
                />
              </div>

              <div className="space-y-1.5">
                <span className="text-xs block">散热风道 / 液冷条件</span>
                <div className="grid grid-cols-3 gap-2">
                  {COOLING_LEVELS.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setCoolingId(c.id)}
                      className={`py-2 rounded-lg text-xs font-medium border transition-colors ${
                        coolingId === c.id
                          ? 'bg-sky-500 text-slate-950 border-sky-400 font-bold'
                          : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 pt-1">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800">
                <div className="text-[11px] text-slate-500">总功耗 (含漏电)</div>
                <div className="text-base font-mono font-bold text-amber-500 mt-0.5">
                  {osDvfsSim.rawPowerW.toFixed(0)} W
                </div>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800">
                <div className="text-[11px] text-slate-500">实际核心频率</div>
                <div className={`text-base font-mono font-bold mt-0.5 ${osDvfsSim.isThrottling ? 'text-rose-500' : 'text-sky-500'}`}>
                  {osDvfsSim.effectiveFreqGHz.toFixed(2)} GHz
                </div>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800">
                <div className="text-[11px] text-slate-500">相对吞吐</div>
                <div className="text-base font-mono font-bold text-emerald-500 mt-0.5">
                  {osDvfsSim.relThroughputPct.toFixed(0)}%
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
