import React, { useState } from 'react';
import {
  Activity,
  Terminal,
  BarChart3,
  Clock,
  Cpu,
  ArrowLeft,
  ArrowRight,
  Coins,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { BENCHMARK_POSTS } from '../data/benchmarks';

const METRIC_CONFIG = {
  ttft: {
    label: 'TTFT 首字延迟 (ms · 越低越快)',
    hfKey: 'hfTtft',
    vllmKey: 'vllmTtft',
    unit: 'ms',
    better: 'lower',
  },
  tpot: {
    label: 'TPOT 单字生成延迟 (ms · 越低越丝滑)',
    hfKey: 'hfTpot',
    vllmKey: 'vllmTpot',
    unit: 'ms',
    better: 'lower',
  },
  tps: {
    label: '系统总吞吐 (tokens/s · 越高越省钱)',
    hfKey: 'hfTps',
    vllmKey: 'vllmTps',
    unit: 'tok/s',
    better: 'higher',
  },
};

export default function BenchmarksPage() {
  const [selectedPostId, setSelectedPostId] = useState(null);
  const [smiMode, setSmiMode] = useState('vllm_burst');
  const [chartMetric, setChartMetric] = useState('tpot');

  const selectedPost = BENCHMARK_POSTS.find((p) => p.id === selectedPostId);

  // List View
  if (!selectedPost) {
    return (
      <div className="py-6 sm:py-8 space-y-8">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 text-xs font-mono text-sky-600 dark:text-sky-400">
            <Activity className="w-4 h-4" />
            <span>BENCHMARKS & FIELD NOTES · 实测与排障日记</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            实测与排障日记
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 max-w-2xl">
            真机跑出来的监控与延迟曲线才是最硬核的老师。点击下方实测记录卡片，查看交互式{' '}
            <code className="font-mono text-sky-500">nvidia-smi</code> 面板与 TTFT/TPOT 性能对比图表。
          </p>
        </div>

        <div className="grid gap-6">
          {BENCHMARK_POSTS.map((post) => (
            <button
              key={post.id}
              onClick={() => setSelectedPostId(post.id)}
              className="group text-left rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120]/90 hover:border-sky-400/60 p-6 sm:p-8 transition-all hover:-translate-y-0.5 hover:shadow-xl space-y-5"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2.5 text-xs font-mono">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25">
                    <Coins className="w-3.5 h-3.5" />
                    {post.cost}
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/25">
                    <Cpu className="w-3.5 h-3.5" />
                    {post.hardware}
                  </span>
                  <span className="inline-flex items-center gap-1 text-slate-500 dark:text-slate-400">
                    <Clock className="w-3.5 h-3.5" />
                    {post.date} · {post.readTime}
                  </span>
                </div>

                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-600 dark:text-sky-400 group-hover:translate-x-1 transition-transform">
                  <span>查看监控面板与对比图</span>
                  <ArrowRight className="w-4 h-4" />
                </span>
              </div>

              <div className="space-y-2">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                  {post.title}
                </h2>
                <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                  {post.subtitle}
                </p>
              </div>

              {/* Mini Preview Strip */}
              <div className="grid sm:grid-cols-3 gap-3 pt-2">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800">
                  <div className="text-[11px] font-mono text-slate-500">测试模型</div>
                  <div className="text-xs font-mono font-semibold text-slate-800 dark:text-slate-200 mt-1">
                    {post.modelTested}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800">
                  <div className="text-[11px] font-mono text-slate-500">32 并发 vLLM 吞吐</div>
                  <div className="text-xs font-mono font-semibold text-emerald-600 dark:text-emerald-400 mt-1">
                    842 tokens/s (原生仅 114)
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800">
                  <div className="text-[11px] font-mono text-slate-500">内置交互组件</div>
                  <div className="text-xs font-mono font-semibold text-sky-600 dark:text-sky-400 mt-1">
                    nvidia-smi 终端 + TTFT/TPOT 图表
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {post.tags.map((t) => (
                  <span
                    key={t}
                    className="px-2.5 py-0.5 rounded-full text-xs font-mono bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800"
                  >
                    #{t}
                  </span>
                ))}
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Detail View with interactive nvidia-smi and TTFT/TPOT Charts
  const smi = selectedPost.nvidiaSmiModes[smiMode];
  const metric = METRIC_CONFIG[chartMetric];
  const maxVal = Math.max(
    ...selectedPost.chartData.map((d) => Math.max(d[metric.hfKey], d[metric.vllmKey]))
  );

  return (
    <div className="py-6 sm:py-8 space-y-8">
      <button
        onClick={() => setSelectedPostId(null)}
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-sky-500 dark:hover:text-sky-400 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>返回实测日记列表</span>
      </button>

      {/* Article Hero Card */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120]/90 p-6 sm:p-8 space-y-4">
        <div className="flex flex-wrap items-center gap-2.5 text-xs font-mono">
          <span className="px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25">
            {selectedPost.cost}
          </span>
          <span className="px-2.5 py-1 rounded bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/25">
            {selectedPost.hardware}
          </span>
          <span className="text-slate-500 dark:text-slate-400">{selectedPost.modelTested}</span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white leading-tight">
          {selectedPost.title}
        </h1>
        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
          {selectedPost.summary}
        </p>
      </div>

      {/* Section 1: Simulated nvidia-smi Terminal Monitor */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120]/90 p-5 sm:p-6 space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Terminal className="w-5 h-5 text-emerald-400" />
            <div>
              <h2 className="font-bold text-base text-slate-900 dark:text-white">
                模拟 <code className="font-mono text-sky-500">nvidia-smi</code> 实时监控面板
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                点击切换三种压测阶段，观察显存占用、GPU 计算利用率与功耗的真实变化
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {Object.entries(selectedPost.nvidiaSmiModes).map(([key, cfg]) => (
              <button
                key={key}
                onClick={() => setSmiMode(key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                  smiMode === key
                    ? 'bg-sky-500 text-slate-950 border-sky-400 font-semibold'
                    : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-sky-400/50'
                }`}
              >
                {cfg.label}
              </button>
            ))}
          </div>
        </div>

        {/* Authentic Terminal Box */}
        <div className="rounded-xl bg-[#050811] border border-slate-800 p-4 sm:p-5 font-mono text-xs text-slate-200 overflow-x-auto space-y-4">
          <div className="text-emerald-400 flex items-center justify-between">
            <span>$ watch -n 0.5 nvidia-smi</span>
            <span className="text-slate-500">Every 0.5s: RTX 4090 Node</span>
          </div>

          <pre className="leading-relaxed text-[11px] sm:text-xs text-slate-300 whitespace-pre">
{[
  '+-----------------------------------------------------------------------------------------+',
  `| ${`NVIDIA-SMI ${smi.driver}       Driver Version: ${smi.driver}       CUDA Version: ${smi.cuda}`.padEnd(87, ' ')} |`,
  '|-----------------------------------------+------------------------+----------------------|',
  '| GPU  Name                  Persistence-M| Bus-Id          Disp.A | Volatile Uncorr. ECC |',
  '| Fan  Temp   Perf          Pwr:Usage/Cap |           Memory-Usage | GPU-Util  Compute M. |',
  '|=========================================+========================+======================|',
  `|   0  ${smi.gpuName.padEnd(26, ' ')} On | 00000000:01:00.0  Off |                  Off |`,
  `| ${smi.fan.padEnd(4)}  ${smi.temp.padEnd(5)}  ${smi.perf.padEnd(4)}         ${smi.power.padEnd(11)} |   ${smi.memUsed.padStart(8)} / ${smi.memTotal} |     ${smi.gpuUtil.padStart(4)}      Default |`,
  '+-----------------------------------------+------------------------+----------------------+',
  `| ${'Processes:'.padEnd(87, ' ')} |`,
  '|  GPU   GI   CI        PID   Type   Process name                              GPU Memory |',
  `|    0   N/A  N/A     41892      C   ${smi.processName.slice(0, 41).padEnd(41, ' ')} ${smi.memUsed.padStart(9)} |`,
  '+-----------------------------------------------------------------------------------------+',
].join('\n')}
          </pre>

          {/* Visual Gauges inside terminal */}
          <div className="grid sm:grid-cols-2 gap-4 pt-2 border-t border-slate-800">
            <div className="space-y-1.5">
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-400">VRAM 显存水位 ({smi.memUsed} / {smi.memTotal})</span>
                <span className={smi.memPct > 95 ? 'text-rose-400 font-bold' : 'text-sky-400'}>
                  {smi.memPct}%
                </span>
              </div>
              <div className="h-2.5 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    smi.memPct > 95 ? 'bg-rose-500' : 'bg-sky-400'
                  }`}
                  style={{ width: `${smi.memPct}%` }}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-400">GPU-Util 计算核心利用率</span>
                <span className={smi.utilNum >= 80 ? 'text-emerald-400 font-bold' : 'text-amber-400'}>
                  {smi.gpuUtil}
                </span>
              </div>
              <div className="h-2.5 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    smi.utilNum >= 80 ? 'bg-emerald-400' : 'bg-amber-400'
                  }`}
                  style={{ width: `${Math.max(2, smi.utilNum)}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Diagnosis Callout */}
        <div
          className={`rounded-xl border p-3.5 flex items-start gap-2.5 text-xs leading-relaxed ${
            smiMode === 'hf_naive'
              ? 'border-rose-500/35 bg-rose-500/10 text-rose-700 dark:text-rose-200'
              : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200'
          }`}
        >
          {smiMode === 'hf_naive' ? (
            <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
          )}
          <span>{smi.note}</span>
        </div>
      </div>

      {/* Section 2: TTFT / TPOT & Throughput Charts */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120]/90 p-5 sm:p-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-sky-400" />
            <div>
              <h2 className="font-bold text-base text-slate-900 dark:text-white">
                原生 PyTorch (HF) vs vLLM 实测性能对比图表
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {metric.label}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setChartMetric('ttft')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono border transition-all ${
                chartMetric === 'ttft'
                  ? 'bg-sky-500 text-slate-950 border-sky-400 font-bold'
                  : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800'
              }`}
            >
              TTFT 首字延迟
            </button>
            <button
              onClick={() => setChartMetric('tpot')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono border transition-all ${
                chartMetric === 'tpot'
                  ? 'bg-sky-500 text-slate-950 border-sky-400 font-bold'
                  : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800'
              }`}
            >
              TPOT 单字延迟
            </button>
            <button
              onClick={() => setChartMetric('tps')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono border transition-all ${
                chartMetric === 'tps'
                  ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-bold'
                  : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800'
              }`}
            >
              总吞吐 tok/s
            </button>
          </div>
        </div>

        {/* Grouped Bar Chart */}
        <div className="space-y-4">
          {selectedPost.chartData.map((row) => {
            const hfVal = row[metric.hfKey];
            const vllmVal = row[metric.vllmKey];
            const hfPct = (hfVal / maxVal) * 100;
            const vllmPct = (vllmVal / maxVal) * 100;

            return (
              <div
                key={row.concurrency}
                className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800 space-y-2.5"
              >
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {row.concurrency}
                  </span>
                  <span className="text-slate-500 dark:text-slate-400">
                    {metric.better === 'lower'
                      ? `vLLM 快 ${(hfVal / vllmVal).toFixed(1)}×`
                      : `vLLM 吞吐高 ${(vllmVal / hfVal).toFixed(1)}×`}
                  </span>
                </div>

                {/* HF Bar */}
                <div className="flex items-center gap-3">
                  <span className="w-24 shrink-0 text-[11px] font-mono text-slate-500 dark:text-slate-400">
                    原生 HF
                  </span>
                  <div className="flex-1 h-4 rounded bg-slate-200 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full rounded bg-amber-500/85 transition-all duration-300"
                      style={{ width: `${Math.max(4, hfPct)}%` }}
                    />
                  </div>
                  <span className="w-20 text-right font-mono text-xs font-semibold text-amber-600 dark:text-amber-400">
                    {hfVal} {metric.unit}
                  </span>
                </div>

                {/* vLLM Bar */}
                <div className="flex items-center gap-3">
                  <span className="w-24 shrink-0 text-[11px] font-mono text-sky-600 dark:text-sky-400 font-semibold">
                    vLLM 引擎
                  </span>
                  <div className="flex-1 h-4 rounded bg-slate-200 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full rounded bg-gradient-to-r from-sky-500 to-emerald-400 transition-all duration-300"
                      style={{ width: `${Math.max(4, vllmPct)}%` }}
                    />
                  </div>
                  <span className="w-20 text-right font-mono text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                    {vllmVal} {metric.unit}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Engineering Takeaways */}
        <div className="grid md:grid-cols-3 gap-4 pt-2">
          {selectedPost.takeaways.map((item) => (
            <div
              key={item.title}
              className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-[#060A13]/70 space-y-2"
            >
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">{item.title}</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                {item.detail}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
