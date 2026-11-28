import React, { useState, useEffect } from 'react';
import {
  Briefcase,
  Cpu,
  Activity,
  FileText,
  FlaskConical,
  ArrowRight,
  ExternalLink,
  CheckCircle2,
} from 'lucide-react';
import LearningHeatmap from './LearningHeatmap';
import { fetchDynamicData } from '../utils/dataLoader';
import { BENCHMARK_POSTS } from '../data/benchmarks';

export default function PortfolioView({
  completedLessons = [],
  onOpenLab,
  onNavigate,
  onExitPortfolio,
}) {
  const [benchLogs, setBenchLogs] = useState(BENCHMARK_POSTS);
  const [readPapers, setReadPapers] = useState([]);

  useEffect(() => {
    fetchDynamicData('bench-logs.json', BENCHMARK_POSTS).then((d) => {
      if (Array.isArray(d)) setBenchLogs(d);
    });
    fetchDynamicData('read-papers.json', []).then((d) => {
      if (Array.isArray(d)) setReadPapers(d);
    });
  }, []);

  return (
    <div className="py-8 sm:py-10 space-y-8">
      {/* Top Executive Identity Banner */}
      <section className="rounded-2xl border border-sky-500/35 bg-gradient-to-br from-sky-500/10 via-white to-emerald-500/10 dark:from-[#0B1120] dark:via-[#0B1120] dark:to-emerald-950/25 p-6 sm:p-8 shadow-sm space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono border border-emerald-500/35 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
            <Briefcase className="w-3.5 h-3.5" />
            <span>PORTFOLIO MODE · 个人工程成果与研究总览屏</span>
          </div>
          <button
            type="button"
            onClick={onExitPortfolio}
            className="px-3.5 py-1.5 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:border-sky-400"
          >
            退出总览 · 恢复完整学习模式
          </button>
        </div>

        <div className="grid lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-8 space-y-3">
            <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              AI 芯片架构建模 × 大模型推理系统性能工程师
            </h1>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
              研究方向聚焦于 <strong className="text-slate-900 dark:text-white">GPU/NPU 算力建模（Golden Model / PPA）</strong>、
              <strong className="text-slate-900 dark:text-white">vLLM / Nano-vLLM 推理系统显存与前缀缓存优化</strong>、
              <strong className="text-slate-900 dark:text-white">Triton 融合算子与 Nsight / DCGM 全栈性能剖析</strong>。
            </p>
          </div>

          <div className="lg:col-span-4 grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 p-3.5 text-center">
              <div className="text-xl font-mono font-bold text-sky-500">{completedLessons.length}/48</div>
              <div className="text-[11px] text-slate-500">核心知识体系</div>
            </div>
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 p-3.5 text-center">
              <div className="text-xl font-mono font-bold text-emerald-500">{benchLogs.length} 篇</div>
              <div className="text-[11px] text-slate-500">真机实测与排障</div>
            </div>
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 p-3.5 text-center">
              <div className="text-xl font-mono font-bold text-indigo-400">{readPapers.length} 篇</div>
              <div className="text-[11px] text-slate-500">精读顶会论文</div>
            </div>
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 p-3.5 text-center">
              <div className="text-xl font-mono font-bold text-amber-400">10 合 1</div>
              <div className="text-[11px] text-slate-500">交互实验室 & 天梯</div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Benchmarks */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-sky-400" />
            <span>真机实测核心数据精选</span>
          </h2>
          <button
            type="button"
            onClick={() => onNavigate('benchmarks')}
            className="text-xs font-mono text-sky-500 hover:underline inline-flex items-center gap-1"
          >
            <span>进入训练营查看全部</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid md:grid-cols-2 gap-5">
          {benchLogs.slice(0, 4).map((post) => (
            <div
              key={post.id}
              className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120]/90 p-5 space-y-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono">
                <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30 font-bold">
                  {post.lab_id || 'L1'} 实测
                </span>
                <span className="text-slate-400">{post.hardware}</span>
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">{post.title}</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{post.subtitle}</p>
              <div className="flex items-center gap-2 text-xs font-mono text-emerald-500 pt-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{post.modelTested}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Read Papers */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-400" />
            <span>已精读论文与个人理解精选</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-2 gap-5">
          {readPapers.map((p) => (
            <div
              key={p.id}
              className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120]/90 p-5 space-y-3"
            >
              <div className="flex items-center justify-between gap-2 text-[11px] font-mono">
                <span className="px-2 py-0.5 rounded bg-sky-500/15 text-sky-600 dark:text-sky-300 border border-sky-500/30 font-bold">
                  {p.venue} · {p.domain}
                </span>
                <a
                  href={p.paper_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sky-500 hover:underline inline-flex items-center gap-1"
                >
                  <span>arXiv</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">{p.title_zh}</h3>
              <div className="border-l-4 border-l-emerald-400 pl-3 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                <strong>个人批判与延伸：</strong>
                {p.personal_understanding?.critique_and_thought}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Quick Sandbox Launchers */}
      <section className="grid sm:grid-cols-3 gap-4">
        <button
          type="button"
          onClick={() => onOpenLab('lab10')}
          className="text-left rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120] p-5 hover:border-sky-400 transition-all space-y-2"
        >
          <Cpu className="w-5 h-5 text-sky-400" />
          <div className="font-bold text-sm text-slate-900 dark:text-white">10 款 AI 芯片天梯 & 成本计算</div>
          <p className="text-xs text-slate-500">支持任意模型 config.json X 光解剖</p>
        </button>
        <button
          type="button"
          onClick={() => onOpenLab('lab8')}
          className="text-left rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120] p-5 hover:border-emerald-400 transition-all space-y-2"
        >
          <FlaskConical className="w-5 h-5 text-emerald-400" />
          <div className="font-bold text-sm text-slate-900 dark:text-white">自研 NPU 软件栈对标沙盒</div>
          <p className="text-xs text-slate-500">4 级调优追平并反超能效比</p>
        </button>
        <button
          type="button"
          onClick={() => onOpenLab('lab9')}
          className="text-left rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120] p-5 hover:border-amber-400 transition-all space-y-2"
        >
          <FlaskConical className="w-5 h-5 text-amber-400" />
          <div className="font-bold text-sm text-slate-900 dark:text-white">GPU 架构建模 PPA & DVFS 双模台</div>
          <p className="text-xs text-slate-500">Golden Model + 85℃ 热节流排障</p>
        </button>
      </section>

      <LearningHeatmap completedCount={completedLessons.length} />
    </div>
  );
}
