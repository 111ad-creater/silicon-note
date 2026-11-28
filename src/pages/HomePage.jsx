import React, { useState } from 'react';
import {
  ArrowRight,
  FlaskConical,
  BookOpen,
  Cpu,
  HardDrive,
  Calculator,
  Code2,
  Layers,
  Flame,
  Network,
  Activity,
  CheckCircle2,
  Sparkles,
  BookMarked,
  Star,
} from 'lucide-react';
import { CURRICULUM_STAGES } from '../data/curriculum';
import LearningHeatmap from '../components/LearningHeatmap';

const MODULE_ICONS = [
  Cpu,
  HardDrive,
  Calculator,
  Code2,
  Layers,
  Flame,
  Network,
  Activity,
];

export default function HomePage({
  completedLessons,
  onStartLessonOne,
  onOpenStage,
  onOpenLesson,
  onNavigate,
}) {
  const [roadmapFilter, setRoadmapFilter] = useState('all'); // 'all' | 'core'

  const totalLessons = CURRICULUM_STAGES.reduce((acc, s) => acc + s.lessons.length, 0);
  const coreLessonsTotal = CURRICULUM_STAGES.reduce(
    (acc, s) => acc + s.lessons.filter((l) => l.isCore).length,
    0
  );
  const completedCount = completedLessons.length;
  const isCoreMode = roadmapFilter === 'core';

  return (
    <div className="space-y-16 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-10 sm:pt-16 pb-8">
        {/* Subtle ambient glows */}
        <div className="pointer-events-none absolute -top-24 left-1/4 w-96 h-96 bg-sky-500/15 dark:bg-sky-400/10 rounded-full blur-3xl" />
        <div className="pointer-events-none absolute top-12 right-1/4 w-80 h-80 bg-emerald-500/15 dark:bg-emerald-400/10 rounded-full blur-3xl" />

        <div className="relative grid lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono border border-sky-500/30 bg-sky-500/10 text-sky-600 dark:text-sky-300">
              <Sparkles className="w-3.5 h-3.5" />
              <span>面向集成电路本科生 & AI 系统初学者</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.15]">
              SiliconNote：
              <span className="block mt-1.5 bg-gradient-to-r from-sky-500 via-cyan-400 to-emerald-400 bg-clip-text text-transparent">
                AI 芯片与系统直觉图鉴
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed">
              抛开枯燥公式与 Verilog，用大白话、算账直觉与交互动画，看懂 GPU/TPU 架构与大模型推理瓶颈
            </p>

            <div className="flex flex-wrap items-center gap-3.5 pt-2">
              <button
                onClick={onStartLessonOne}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm bg-sky-500 hover:bg-sky-400 text-slate-950 shadow-glow-cyber transition-all active:scale-[0.99]"
              >
                <BookOpen className="w-4 h-4" />
                <span>开始第 1 课</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => onNavigate('lab')}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm border border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 shadow-sm hover:shadow-glow-chip transition-all active:scale-[0.99]"
              >
                <FlaskConical className="w-4 h-4" />
                <span>进入交互实验室</span>
              </button>
            </div>

            {/* Quick Stats Strip */}
            <div className="pt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-mono text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                {CURRICULUM_STAGES.length} 大模块 · {totalLessons} 节系统直觉课
              </span>
              <span>已掌握进度：{completedCount}/{totalLessons} 节</span>
              <span>核心主线：{coreLessonsTotal} 课优先掌握</span>
            </div>
          </div>

          {/* Right Geek Hardware Telemetry Card */}
          <div className="lg:col-span-5">
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-[#0B1120]/90 backdrop-blur-md p-5 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                  <span className="ml-2 text-xs font-mono text-slate-500 dark:text-slate-400">
                    roofline_intuition.sys
                  </span>
                </div>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
                  H100 SXM 参考账本
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800">
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">大脑 (Tensor Core)</div>
                  <div className="text-lg font-mono font-bold text-sky-600 dark:text-sky-400 mt-0.5">
                    989 TFLOPS
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">FP16 算得极快</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800">
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">大书柜 (HBM3 带宽)</div>
                  <div className="text-lg font-mono font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                    3.35 TB/s
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">搬运工跑断腿</div>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900 dark:bg-[#050811] border border-slate-800 text-slate-200 font-mono text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">// 芯片脊点 Ridge Point</span>
                  <span className="text-sky-400">989 ÷ 3.35 ≈ 295 FLOPs/B</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">// 单用户 Decode 强度</span>
                  <span className="text-rose-400">~1.0 FLOPs/B (撞上内存墙!)</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden mt-1">
                  <div className="bg-gradient-to-r from-rose-500 via-amber-400 to-emerald-400 h-full w-[12%]" />
                </div>
                <p className="text-[11px] text-slate-400 font-sans pt-1">
                  大脑 99% 的时间在等搬运工？点下方路线或进入实验室亲手调参验证。
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 8-Module Panoramic Learning Roadmap */}
      <section className="space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
          <div>
            <div className="text-xs font-mono uppercase tracking-wider text-sky-600 dark:text-sky-400 mb-1">
              LEARNING ROADMAP · 8 MODULES / {totalLessons} LESSONS
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
              8 大模块全景路线图
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              由硅片微架构一路打通到集群压测与算力经济学，点击任意模块卡片即可直达对应课程
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 self-start lg:self-auto">
            {/* Lightweight Filter Toggle */}
            <div
              role="group"
              aria-label="课程视图筛选"
              className="inline-flex items-center p-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100/80 dark:bg-slate-900/80"
            >
              <button
                onClick={() => setRoadmapFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  roadmapFilter === 'all'
                    ? 'bg-white dark:bg-[#0B1120] text-slate-900 dark:text-white shadow-sm border border-slate-200/80 dark:border-slate-700'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                全部 {totalLessons} 课
              </button>
              <button
                onClick={() => setRoadmapFilter('core')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  roadmapFilter === 'core'
                    ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/35 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Star className="w-3.5 h-3.5" />
                <span>核心主线 {coreLessonsTotal} 课（优先掌握）</span>
              </button>
            </div>

            <button
              onClick={() => onOpenLesson('5.2')}
              className="text-xs sm:text-sm font-medium text-sky-600 dark:text-sky-400 hover:underline inline-flex items-center gap-1"
            >
              <span>精选精读：5.2 推理调度</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 4 cols x 2 rows on desktop, 2 cols on sm, 1 col on mobile */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {CURRICULUM_STAGES.map((stage, idx) => {
            const Icon = MODULE_ICONS[idx % MODULE_ICONS.length];
            const coreLessons = stage.lessons.filter((l) => l.isCore);
            const hasCore = coreLessons.length > 0;
            const stageCompleted = stage.lessons.filter((l) =>
              completedLessons.includes(l.id)
            ).length;
            const stageTotal = stage.lessons.length;
            const progressPct = Math.round((stageCompleted / stageTotal) * 100);
            const isSky = stage.accent === 'sky';
            const cleanTitle = stage.title.replace(/^模块[一二三四五六七八]：/, '');
            const dimmedInCoreMode = isCoreMode && !hasCore;
            const highlightedInCoreMode = isCoreMode && hasCore;

            const targetLesson =
              isCoreMode && hasCore ? coreLessons[0] : stage.lessons[0];

            return (
              <button
                key={stage.id}
                onClick={() => onOpenStage(stage, targetLesson?.id)}
                className={`group text-left rounded-2xl border p-4 sm:p-5 transition-all flex flex-col justify-between gap-4 ${
                  highlightedInCoreMode
                    ? 'border-amber-500/50 dark:border-amber-400/50 bg-amber-500/[0.03] dark:bg-[#0B1120]/95 shadow-md hover:-translate-y-0.5 hover:border-amber-400'
                    : dimmedInCoreMode
                      ? 'border-slate-200/70 dark:border-slate-800/60 bg-white/50 dark:bg-[#0B1120]/40 opacity-55 hover:opacity-90'
                      : 'border-slate-200 dark:border-slate-800/90 bg-white dark:bg-[#0B1120]/80 hover:border-sky-400/60 dark:hover:border-sky-400/50 hover:-translate-y-0.5 hover:shadow-lg'
                }`}
              >
                <div className="space-y-3">
                  {/* Module Header: Icon + Number + Perspective Tag */}
                  <div className="flex items-start justify-between gap-2">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center border shrink-0 ${
                        highlightedInCoreMode
                          ? 'bg-amber-500/15 border-amber-500/40 text-amber-600 dark:text-amber-300'
                          : isSky
                            ? 'bg-sky-500/10 border-sky-500/30 text-sky-500 dark:text-sky-400'
                            : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="font-mono text-[11px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800">
                        MODULE {stage.number}
                      </span>
                      {highlightedInCoreMode && (
                        <span className="inline-flex items-center gap-1 font-mono text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                          <Star className="w-2.5 h-2.5 fill-current" />
                          <span>{coreLessons.length} 节核心主线</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Module Title & Perspective Tag */}
                  <div className="space-y-1.5">
                    <span
                      className={`inline-block text-[11px] font-mono px-2 py-0.5 rounded-md border ${
                        isSky
                          ? 'bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/20'
                          : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20'
                      }`}
                    >
                      {stage.perspectiveTag}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors leading-snug">
                      {cleanTitle}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      {stage.shortDesc}
                    </p>
                  </div>

                  {/* Core lessons highlighted list when filter is 'core' */}
                  {isCoreMode && (
                    <div className="pt-1 space-y-1">
                      {hasCore ? (
                        coreLessons.map((lesson) => {
                          const done = completedLessons.includes(lesson.id);
                          return (
                            <div
                              key={lesson.id}
                              className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-amber-500/10 border border-amber-500/25 text-[11px] text-amber-900 dark:text-amber-200"
                            >
                              {done ? (
                                <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                              ) : (
                                <Star className="w-3 h-3 text-amber-500 fill-current shrink-0" />
                              )}
                              <span className="truncate font-medium">{lesson.title}</span>
                            </div>
                          );
                        })
                      ) : (
                        <div className="text-[11px] font-mono text-slate-400 dark:text-slate-500 py-1">
                          含 {stageTotal} 节进阶专题（非核心主线）
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Progress Bar */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="text-slate-500 dark:text-slate-400">
                      进度 {stageCompleted}/{stageTotal} 课
                    </span>
                    <span
                      className={
                        progressPct === 100
                          ? 'text-emerald-500 dark:text-emerald-400 font-semibold'
                          : 'text-sky-600 dark:text-sky-400'
                      }
                    >
                      {progressPct}%
                    </span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        highlightedInCoreMode
                          ? 'bg-gradient-to-r from-amber-500 to-sky-400'
                          : isSky
                            ? 'bg-gradient-to-r from-sky-500 to-cyan-400'
                            : 'bg-gradient-to-r from-emerald-500 to-teal-400'
                      }`}
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Compact Practical Toolbox Strip */}
        <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-900/30 p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="inline-flex items-center gap-1.5 text-xs font-mono text-emerald-600 dark:text-emerald-400">
              <FlaskConical className="w-3.5 h-3.5" />
              <span>实战直觉工具箱 · 边学边算，拒绝纸上谈兵</span>
            </span>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              打开模拟器亲手把 80GB 显存拉爆，或者看看 5 块钱云端 RTX 4090 的真实压测曲线。
            </p>
          </div>
          <div className="grid sm:grid-cols-3 gap-2.5 shrink-0">
            <button
              onClick={() => onNavigate('lab')}
              className="flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl text-xs font-medium bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-sky-400/50 text-slate-700 dark:text-slate-200 transition-colors"
            >
              <span className="flex items-center gap-2">
                <FlaskConical className="w-4 h-4 text-sky-400 shrink-0" />
                <span>KV Cache 模拟器</span>
              </span>
              <ArrowRight className="w-3.5 h-3.5 shrink-0" />
            </button>
            <button
              onClick={() => onNavigate('benchmarks')}
              className="flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl text-xs font-medium bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-400/50 text-slate-700 dark:text-slate-200 transition-colors"
            >
              <span className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>vLLM 压测实录</span>
              </span>
              <ArrowRight className="w-3.5 h-3.5 shrink-0" />
            </button>
            <button
              onClick={() => onNavigate('glossary')}
              className="flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl text-xs font-medium bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-sky-400/50 text-slate-700 dark:text-slate-200 transition-colors"
            >
              <span className="flex items-center gap-2">
                <BookMarked className="w-4 h-4 text-sky-400 shrink-0" />
                <span>核心黑话词典</span>
              </span>
              <ArrowRight className="w-3.5 h-3.5 shrink-0" />
            </button>
          </div>
        </div>
      </section>

      {/* 26-Week Chip-Green Learning Heatmap */}
      <LearningHeatmap completedCount={completedCount} />
    </div>
  );
}
