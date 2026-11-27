import React, { useState } from 'react';
import {
  Calculator,
  ChevronDown,
  ChevronRight,
  FileText,
  Layers,
  CheckCircle2,
} from 'lucide-react';
import { SEMI_806_EXAMPLES } from '../../data/semiconductor806Examples';
import Fig5Continuity from './figures806/Fig5Continuity';
import { FigureZoomBox } from './ZoomableFigureModal';

export default function Semiconductor806ExamplesTab() {
  // Default: open Step 1 of Example 1, collapse others so user can step through or expand all
  const [openSteps, setOpenSteps] = useState(() => {
    const init = {};
    SEMI_806_EXAMPLES.forEach((ex) => {
      ex.steps.forEach((st, idx) => {
        init[st.id] = idx === 0;
      });
    });
    return init;
  });

  const toggleStep = (stepId) => {
    setOpenSteps((prev) => ({ ...prev, [stepId]: !prev[stepId] }));
  };

  const setExampleStepsOpen = (example, expand) => {
    setOpenSteps((prev) => {
      const next = { ...prev };
      example.steps.forEach((st) => {
        next[st.id] = expand;
      });
      return next;
    });
  };

  const setAllExamplesOpen = (expand) => {
    setOpenSteps((prev) => {
      const next = { ...prev };
      SEMI_806_EXAMPLES.forEach((ex) => {
        ex.steps.forEach((st) => {
          next[st.id] = expand;
        });
      });
      return next;
    });
  };

  const scrollToExample = (exId) => {
    const el = document.getElementById(exId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Top 806 Continuity Equation Template Banner + Quick Nav */}
      <section className="rounded-2xl border border-[#0D9488]/30 bg-white/95 dark:bg-[#0B1120]/95 p-5 sm:p-6 space-y-4 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-mono font-semibold text-[#0F766E] dark:text-teal-300 uppercase tracking-wider">
              <Layers className="w-4 h-4 text-[#0D9488]" />
              <span>806 连续性方程满分作答标准流水线</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
              完整收录《解答.pdf》与《连续性方程2.pdf》4 道标杆例题，按「题目描述 → 完整方程与化简 → 初始/边界条件 → 通解与特解 → 极限/物理校验」分步推演。
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setAllExamplesOpen(true)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#0D9488] hover:bg-[#0F766E] text-white transition-colors"
            >
              全部展开推演
            </button>
            <button
              type="button"
              onClick={() => setAllExamplesOpen(false)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:border-[#0D9488]/60 transition-colors"
            >
              全部收起自测
            </button>
          </div>
        </div>

        {/* Quick Jump Pills */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-2 border-t border-slate-200/80 dark:border-slate-800/80">
          {SEMI_806_EXAMPLES.map((ex) => (
            <button
              key={ex.id}
              type="button"
              onClick={() => scrollToExample(ex.id)}
              className="text-left rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/60 p-3 hover:border-[#0D9488]/60 hover:bg-[#0D9488]/[0.05] transition-all space-y-1"
            >
              <div className="flex items-center justify-between text-[11px] font-mono text-[#0F766E] dark:text-teal-300">
                <span>EXAMPLE {ex.index}</span>
                <span>{ex.steps.length} 步推演</span>
              </div>
              <div className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1">
                {ex.title.replace(/^例题 \d+：/, '')}
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* 4 Benchmark Example Cards */}
      <div className="space-y-6">
        {SEMI_806_EXAMPLES.map((ex) => {
          const allOpen = ex.steps.every((st) => openSteps[st.id]);

          return (
            <article
              key={ex.id}
              id={ex.id}
              className="scroll-mt-24 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120]/90 p-5 sm:p-7 space-y-5 shadow-sm"
            >
              {/* Example Header */}
              <header className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono">
                    <span className="px-2.5 py-0.5 rounded-md bg-[#0D9488]/15 text-[#0F766E] dark:text-teal-300 border border-[#0D9488]/30 font-bold">
                      标杆例题 {ex.index}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                      来源：{ex.source}
                    </span>
                    {ex.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 rounded-md bg-[#0D9488]/10 text-[#0F766E] dark:text-teal-300 border border-[#0D9488]/25"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                  <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white">
                    {ex.title}
                  </h3>
                </div>

                <button
                  type="button"
                  onClick={() => setExampleStepsOpen(ex, !allOpen)}
                  className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-[#0D9488]/40 bg-[#0D9488]/10 text-[#0F766E] dark:text-teal-300 hover:bg-[#0D9488]/20 transition-colors"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{allOpen ? '收起全部步骤' : '展开全部步骤'}</span>
                </button>
              </header>

              {/* Step 0: 题目描述 */}
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-900/65 p-4 sm:p-5 space-y-2.5">
                <div className="flex items-center gap-2 text-xs font-mono font-bold text-slate-700 dark:text-slate-200">
                  <FileText className="w-4 h-4 text-[#0D9488]" />
                  <span>📋 完整题目描述</span>
                </div>
                <p className="text-sm leading-7 text-slate-700 dark:text-slate-200">
                  {ex.problemIntro}
                </p>
                {ex.subQuestions.length > 0 && (
                  <div className="pt-1 space-y-1">
                    {ex.subQuestions.map((sq, idx) => (
                      <p
                        key={idx}
                        className="text-sm leading-6 text-slate-800 dark:text-slate-100 font-medium pl-1"
                      >
                        {sq}
                      </p>
                    ))}
                  </div>
                )}
              </div>

              {/* Corresponding Precision Physics Diagram */}
              {ex.figureMode && (
                <FigureZoomBox title={`${ex.title} · 物理图解`} accent="teal">
                  <Fig5Continuity mode={ex.figureMode} />
                </FigureZoomBox>
              )}

              {/* Step-by-Step Collapsible Deduction Panels */}
              <div className="space-y-3">
                {ex.steps.map((step, sIdx) => {
                  const isOpen = Boolean(openSteps[step.id]);
                  return (
                    <div
                      key={step.id}
                      className={`rounded-xl border transition-colors overflow-hidden ${
                        isOpen
                          ? 'border-[#0D9488]/45 bg-white dark:bg-[#060A13]/60'
                          : 'border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => toggleStep(step.id)}
                        aria-expanded={isOpen}
                        className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-[#0D9488]/[0.05] transition-colors"
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-[#0D9488] text-white">
                            STEP {sIdx + 1}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-[#0D9488]/12 text-[#0F766E] dark:text-teal-300 border border-[#0D9488]/25">
                            {step.phaseLabel}
                          </span>
                          <span className="text-sm font-bold text-slate-900 dark:text-white">
                            {step.title}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 text-xs font-mono text-slate-500 dark:text-slate-400 shrink-0">
                          <span className="hidden sm:inline">
                            {isOpen ? '收起' : '展开推演'}
                          </span>
                          {isOpen ? (
                            <ChevronDown className="w-4 h-4 text-[#0D9488]" />
                          ) : (
                            <ChevronRight className="w-4 h-4" />
                          )}
                        </div>
                      </button>

                      <div
                        className={`grid transition-all duration-300 ease-out ${
                          isOpen
                            ? 'grid-rows-[1fr] opacity-100'
                            : 'grid-rows-[0fr] opacity-0'
                        }`}
                      >
                        <div className="overflow-hidden">
                          <div className="px-4 pb-4 pt-3 border-t border-slate-200/80 dark:border-slate-800/80 space-y-3">
                            {step.blocks.map((blk, bIdx) =>
                              blk.type === 'formula' ? (
                                <div
                                  key={bIdx}
                                  className="rounded-xl border border-[#0D9488]/35 bg-teal-50/60 dark:bg-[#050811] px-4 py-3.5 space-y-1.5"
                                >
                                  {blk.label && (
                                    <div className="flex items-center gap-1.5 text-[11px] font-mono font-semibold text-[#0F766E] dark:text-teal-400">
                                      <Calculator className="w-3.5 h-3.5" />
                                      <span>{blk.label}</span>
                                    </div>
                                  )}
                                  <pre className="font-mono text-[13px] sm:text-sm leading-relaxed text-[#0F766E] dark:text-[#5EEAD4] whitespace-pre-wrap overflow-x-auto">
                                    {blk.content}
                                  </pre>
                                </div>
                              ) : (
                                <p
                                  key={bIdx}
                                  className="text-sm leading-7 text-slate-700 dark:text-slate-200 whitespace-pre-line"
                                >
                                  {blk.content}
                                </p>
                              )
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
