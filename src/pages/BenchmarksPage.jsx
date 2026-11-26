import React, { useState, useEffect, useMemo } from 'react';
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
  Rocket,
  BookOpen,
  ClipboardCopy,
  Check,
  X,
  Trophy,
  RotateCcw,
  Wrench,
  Lightbulb,
  FileText,
  Sparkles,
  CheckSquare,
  Square,
} from 'lucide-react';
import { BENCHMARK_POSTS } from '../data/benchmarks';
import { CURRICULUM_STAGES } from '../data/curriculum';
import {
  TRAINING_TASKS,
  BENCHMARK_REPORT_TEMPLATE,
  CHEATSHEET_CARDS,
} from '../data/trainingCamp';
import CodeBlock, { copyTextToClipboard } from '../components/CodeBlock';

const STORAGE_CHECKLIST_KEY = 'silicon-note-training-checklist-v1';

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

const TIER_STYLES = {
  l1: {
    badge:
      'bg-emerald-500/12 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
    node: 'border-emerald-500/50 bg-emerald-500/15 text-emerald-600 dark:text-emerald-300',
  },
  l2: {
    badge: 'bg-sky-500/12 text-sky-700 dark:text-sky-300 border-sky-500/30',
    node: 'border-sky-500/50 bg-sky-500/15 text-sky-600 dark:text-sky-300',
  },
  l3: {
    badge:
      'bg-amber-500/12 text-amber-700 dark:text-amber-300 border-amber-500/30',
    node: 'border-amber-500/50 bg-amber-500/15 text-amber-600 dark:text-amber-300',
  },
  l4: {
    badge:
      'bg-gradient-to-r from-sky-500/15 to-emerald-500/15 text-sky-700 dark:text-emerald-300 border-sky-500/35',
    node: 'border-emerald-400 bg-gradient-to-br from-sky-500/20 to-emerald-500/20 text-emerald-600 dark:text-emerald-300',
  },
};

const CHEATSHEET_ACCENTS = {
  sky: 'bg-sky-500/12 text-sky-700 dark:text-sky-300 border-sky-500/30',
  rose: 'bg-rose-500/12 text-rose-700 dark:text-rose-300 border-rose-500/30',
  emerald:
    'bg-emerald-500/12 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
  amber: 'bg-amber-500/12 text-amber-700 dark:text-amber-300 border-amber-500/30',
  indigo:
    'bg-indigo-500/12 text-indigo-700 dark:text-indigo-300 border-indigo-500/30',
};

const SUB_TABS = [
  {
    id: 'roadmap',
    label: '阶梯式工程训练路线',
    shortLabel: '阶梯实战',
    badge: 'L1~L4 · 6大实战',
    icon: Rocket,
  },
  {
    id: 'benchmarks',
    label: '实测与排障日记',
    shortLabel: '实测日记',
    badge: '含报告模板',
    icon: Activity,
  },
  {
    id: 'cheatsheet',
    label: '性能工程师排障速查手册',
    shortLabel: '排障速查',
    badge: 'Cheatsheet',
    icon: Wrench,
  },
];

export default function BenchmarksPage({ onOpenLesson }) {
  const [activeTab, setActiveTab] = useState('roadmap');
  const [selectedPostId, setSelectedPostId] = useState(null);
  const [smiMode, setSmiMode] = useState('vllm_burst');
  const [chartMetric, setChartMetric] = useState('tpot');

  // Report Template Modal & Copy feedback state
  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [templateCopied, setTemplateCopied] = useState(false);

  // Persistent Checklist state across the 6 training tasks
  const [checkedItems, setCheckedItems] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_CHECKLIST_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          return parsed;
        }
      }
      return {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_CHECKLIST_KEY, JSON.stringify(checkedItems));
    } catch {
      // ignore storage errors
    }
  }, [checkedItems]);

  useEffect(() => {
    if (!templateModalOpen) return undefined;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setTemplateModalOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [templateModalOpen]);

  // Lookup map: lessonId -> lesson title for prerequisite button tooltips
  const lessonTitleMap = useMemo(() => {
    const map = {};
    CURRICULUM_STAGES.forEach((stage) => {
      (stage.lessons || []).forEach((lesson) => {
        map[lesson.id] = lesson.title;
      });
    });
    return map;
  }, []);

  const totalChecklistCount = useMemo(
    () => TRAINING_TASKS.reduce((acc, t) => acc + t.checklist.length, 0),
    []
  );

  const completedChecklistCount = useMemo(
    () =>
      TRAINING_TASKS.reduce(
        (acc, t) =>
          acc + t.checklist.filter((item) => Boolean(checkedItems[item.id])).length,
        0
      ),
    [checkedItems]
  );

  const completedTasksCount = useMemo(
    () =>
      TRAINING_TASKS.filter((t) =>
        t.checklist.every((item) => Boolean(checkedItems[item.id]))
      ).length,
    [checkedItems]
  );

  const overallProgressPct =
    totalChecklistCount > 0
      ? Math.round((completedChecklistCount / totalChecklistCount) * 100)
      : 0;

  const toggleChecklistItem = (itemId) => {
    setCheckedItems((prev) => ({
      ...prev,
      [itemId]: !prev[itemId],
    }));
  };

  const handleResetChecklist = () => {
    setCheckedItems({});
  };

  const handleCopyAndPreviewTemplate = async (openModal = true) => {
    const ok = await copyTextToClipboard(BENCHMARK_REPORT_TEMPLATE);
    if (ok) {
      setTemplateCopied(true);
      setTimeout(() => setTemplateCopied(false), 2600);
    }
    if (openModal) {
      setTemplateModalOpen(true);
    }
  };

  const selectedPost = BENCHMARK_POSTS.find((p) => p.id === selectedPostId);

  const scrollToTask = (taskId) => {
    const el = document.getElementById(`training-task-${taskId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="py-6 sm:py-8 space-y-6">
      {/* Page Header + 3-Tab Switcher */}
      <div className="space-y-5">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 text-xs font-mono text-sky-600 dark:text-sky-400">
            <Rocket className="w-4 h-4" />
            <span>HANDS-ON TRAINING · 工程实战与排障训练营</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            工程实战与排障训练营
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 max-w-3xl leading-relaxed">
            专为「低预算、强正反馈、直通大厂简历」设计：用几块钱云端 GPU 与本机 Python，走完从 vLLM
            部署 OOM 排障、纸面算账校验、AWQ/Prefix Caching 对照评测、Nsight 抓气泡破案、Triton
            融合算子到输出大厂级评测报告的完整工程闭环。
          </p>
        </div>

        {/* 3 Sub-Tabs Bar */}
        <div
          role="tablist"
          aria-label="工程实战与排障训练营子页面"
          className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-[#0B1120]/90 p-1.5 shadow-sm"
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
            {SUB_TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl text-left transition-all border ${
                    isActive
                      ? 'bg-sky-500/12 dark:bg-sky-500/15 border-sky-400/60 text-slate-900 dark:text-white shadow-sm'
                      : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100/70 dark:hover:bg-slate-900/60'
                  }`}
                >
                  <span className="flex items-center gap-2 min-w-0">
                    <Icon
                      className={`w-4 h-4 shrink-0 ${
                        isActive ? 'text-sky-500 dark:text-sky-400' : 'text-slate-400'
                      }`}
                    />
                    <span className="text-xs sm:text-sm font-semibold truncate">
                      <span className="hidden md:inline">{tab.label}</span>
                      <span className="md:hidden">{tab.shortLabel}</span>
                    </span>
                  </span>
                  <span
                    className={`shrink-0 px-2 py-0.5 rounded-md text-[10px] font-mono border ${
                      isActive
                        ? 'bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-400/30'
                        : 'bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-slate-200/80 dark:border-slate-800'
                    }`}
                  >
                    {tab.badge}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ==================== TAB 1: 阶梯式工程训练路线 ==================== */}
      {activeTab === 'roadmap' && (
        <div className="space-y-6">
          {/* Global Progress Dashboard Card */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120]/90 p-5 sm:p-6 shadow-sm space-y-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                  <span className="text-xs font-mono uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                    TRAINING PROGRESS · L1 ~ L4 闯关进度
                  </span>
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                  已完成 {completedChecklistCount} / {totalChecklistCount} 个实操打卡项
                  <span className="ml-2 text-sm font-mono font-semibold text-sky-600 dark:text-sky-400">
                    ({overallProgressPct}%)
                  </span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  已完整通关 <strong className="text-slate-800 dark:text-slate-200">{completedTasksCount}</strong> /{' '}
                  {TRAINING_TASKS.length} 个阶梯实战 · 勾选进度自动保存在本地浏览器
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                <div className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 text-xs font-mono text-slate-600 dark:text-slate-300">
                  总预算参考：<span className="text-emerald-600 dark:text-emerald-400 font-bold">¥0 ~ ¥50</span>
                </div>
                {completedChecklistCount > 0 && (
                  <button
                    type="button"
                    onClick={handleResetChecklist}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:border-rose-400/40 transition-colors"
                    title="清空所有已勾选进度"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>重置进度</span>
                  </button>
                )}
              </div>
            </div>

            {/* Global Progress Bar */}
            <div className="h-2.5 w-full rounded-full bg-slate-100 dark:bg-slate-800/90 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-sky-500 via-cyan-400 to-emerald-400 transition-all duration-300"
                style={{ width: `${Math.max(overallProgressPct, completedChecklistCount > 0 ? 3 : 0)}%` }}
              />
            </div>

            {/* Quick Ladder Jump Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 pt-1">
              {TRAINING_TASKS.map((task) => {
                const doneInTask = task.checklist.filter((c) => checkedItems[c.id]).length;
                const totalInTask = task.checklist.length;
                const isTaskDone = doneInTask === totalInTask;
                return (
                  <button
                    key={task.id}
                    type="button"
                    onClick={() => scrollToTask(task.id)}
                    className={`text-left p-2.5 rounded-xl border transition-all flex flex-col justify-between gap-1.5 ${
                      isTaskDone
                        ? 'border-emerald-500/40 bg-emerald-500/8 dark:bg-emerald-500/10'
                        : 'border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 hover:border-sky-400/50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 text-[10px] font-mono">
                      <span className="font-bold text-slate-700 dark:text-slate-200">
                        {task.shortName}
                      </span>
                      <span
                        className={
                          isTaskDone
                            ? 'text-emerald-600 dark:text-emerald-400 font-bold'
                            : 'text-slate-500 dark:text-slate-400'
                        }
                      >
                        {doneInTask}/{totalInTask}
                      </span>
                    </div>
                    <div className="text-[11px] font-medium text-slate-600 dark:text-slate-300 truncate">
                      {task.tier} · {task.budget}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Ladder Timeline of 6 Tasks */}
          <div className="relative space-y-6 md:pl-10">
            {/* Vertical Timeline Line on md+ */}
            <div
              aria-hidden="true"
              className="hidden md:block absolute left-4 top-6 bottom-6 w-px bg-gradient-to-b from-emerald-500/50 via-sky-500/50 to-emerald-400/40"
            />

            {TRAINING_TASKS.map((task) => {
              const tierStyle = TIER_STYLES[task.tierKey] || TIER_STYLES.l1;
              const doneCount = task.checklist.filter((c) => checkedItems[c.id]).length;
              const totalCount = task.checklist.length;
              const isAllDone = doneCount === totalCount;

              return (
                <section
                  key={task.id}
                  id={`training-task-${task.id}`}
                  className="relative scroll-mt-20"
                >
                  {/* Timeline Step Circle on md+ */}
                  <div
                    className={`hidden md:flex absolute -left-10 top-6 w-8 h-8 rounded-full border-2 items-center justify-center font-mono text-xs font-bold shadow-sm transition-colors ${
                      isAllDone
                        ? 'bg-emerald-500 border-emerald-400 text-slate-950'
                        : `${tierStyle.node} bg-white dark:bg-[#060A13]`
                    }`}
                  >
                    {isAllDone ? <Check className="w-4 h-4" /> : task.stepNumber}
                  </div>

                  {/* Task Card */}
                  <div
                    className={`rounded-2xl border p-5 sm:p-6 space-y-5 transition-all ${
                      isAllDone
                        ? 'border-emerald-500/40 bg-white dark:bg-[#0B1120]/95 shadow-sm'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120]/90'
                    }`}
                  >
                    {/* Card Header & Metadata Badges */}
                    <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-3">
                      <div className="space-y-2.5">
                        <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-md font-semibold border ${tierStyle.badge}`}
                          >
                            {task.tier}
                          </span>
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800">
                            <Clock className="w-3.5 h-3.5 text-sky-500" />
                            <span>耗时：{task.duration}</span>
                          </span>
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25">
                            <Coins className="w-3.5 h-3.5" />
                            <span>预算：{task.budget}</span>
                          </span>
                        </div>

                        <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white leading-snug">
                          {task.shortName} · {task.title}
                        </h3>
                      </div>

                      {/* Completion Status + Resume Output */}
                      <div className="flex flex-wrap lg:flex-col items-start lg:items-end gap-2 shrink-0">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono font-semibold border ${
                            isAllDone
                              ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/35'
                              : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800'
                          }`}
                        >
                          {isAllDone ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                              <span>已通关 ({doneCount}/{totalCount})</span>
                            </>
                          ) : (
                            <span>
                              打卡 {doneCount}/{totalCount}
                            </span>
                          )}
                        </span>

                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-mono bg-sky-500/8 text-sky-700 dark:text-sky-300 border border-sky-500/20">
                          <Sparkles className="w-3 h-3 shrink-0" />
                          <span>简历产出：{task.resumeOutput}</span>
                        </span>
                      </div>
                    </div>

                    {/* Goal Box */}
                    <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/80 dark:bg-[#060A13]/70 p-3.5 sm:p-4 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                      <span className="font-bold text-sky-600 dark:text-sky-400 mr-1.5">
                        【实战目标】
                      </span>
                      {task.goal}
                    </div>

                    {/* Prerequisite Lessons Quick Jump */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 text-xs font-mono text-slate-500 dark:text-slate-400">
                        <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
                        <span>关联前置课程：</span>
                      </span>
                      {task.prerequisites.map((lessonId) => {
                        const title = lessonTitleMap[lessonId];
                        return (
                          <button
                            key={lessonId}
                            type="button"
                            onClick={() => onOpenLesson && onOpenLesson(lessonId)}
                            title={title ? `跳转至第 ${lessonId} 课：${title}` : `跳转至第 ${lessonId} 课`}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-mono font-semibold border border-indigo-500/30 bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-500/20 hover:border-indigo-400/50 transition-colors"
                          >
                            <span>第 {lessonId} 课</span>
                            {title && (
                              <span className="hidden sm:inline font-sans font-normal text-indigo-600/80 dark:text-indigo-300/80 max-w-[160px] truncate">
                                · {title.replace(/^\d+\.\d+\s*/, '')}
                              </span>
                            )}
                            <span>↗</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Interactive Checklist */}
                    <div className="space-y-2">
                      <div className="text-xs font-mono font-semibold text-slate-500 dark:text-slate-400">
                        分步打卡 CHECKLIST（点击打勾 · 自动保存）
                      </div>
                      <div className="space-y-2">
                        {task.checklist.map((item) => {
                          const checked = Boolean(checkedItems[item.id]);
                          return (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => toggleChecklistItem(item.id)}
                              aria-pressed={checked}
                              className={`w-full text-left flex items-start gap-3 p-3 rounded-xl border transition-all ${
                                checked
                                  ? 'border-emerald-500/35 bg-emerald-500/8 dark:bg-emerald-500/10'
                                  : 'border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 hover:border-sky-400/50'
                              }`}
                            >
                              <span className="mt-0.5 shrink-0">
                                {checked ? (
                                  <CheckSquare className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                                ) : (
                                  <Square className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                                )}
                              </span>
                              <span
                                className={`text-xs sm:text-sm leading-relaxed transition-colors ${
                                  checked
                                    ? 'line-through text-slate-500 dark:text-slate-400'
                                    : 'text-slate-800 dark:text-slate-200'
                                }`}
                              >
                                {item.text}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Collapsible Highlighted Code Block */}
                    <div className="space-y-2.5">
                      <CodeBlock
                        title={task.codeTitle}
                        filename={task.codeFilename}
                        language={task.language}
                        code={task.code}
                        defaultExpanded={false}
                        collapsible={true}
                        copyLabel={task.language === 'markdown' ? '复制模板' : '复制代码'}
                      />

                      {task.stepNumber === 6 && (
                        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            此报告模板已同步挂载至「Tab 2 · 实测与排障日记」顶部快捷入口。
                          </span>
                          <button
                            type="button"
                            onClick={() => setActiveTab('benchmarks')}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-sky-500/10 text-sky-700 dark:text-sky-300 border border-sky-500/30 hover:bg-sky-500/20 transition-colors"
                          >
                            <span>前往 Tab 2 实测日记</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </section>
              );
            })}
          </div>
        </div>
      )}

      {/* ==================== TAB 2: 实测与排障日记（保留原日记 + 报告模板） ==================== */}
      {activeTab === 'benchmarks' && (
        <div className="space-y-6">
          {/* Prominent Report Template Action Strip */}
          <div className="rounded-2xl border border-sky-500/30 bg-gradient-to-r from-sky-500/10 via-cyan-500/5 to-emerald-500/10 p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 text-xs font-mono text-sky-700 dark:text-sky-300 font-semibold">
                <FileText className="w-4 h-4" />
                <span>实战 6 · 标准化评测成果交付物</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                跑完云端压测与 Nsight 抓包后，直接套用工业界大厂标准 Markdown 模板输出评测报告（含环境快照、Roofline 理论锚点与 P50/P99 表格）。
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => handleCopyAndPreviewTemplate(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-sky-500 hover:bg-sky-400 text-slate-950 shadow-glow-cyber transition-all active:scale-[0.99]"
              >
                {templateCopied ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>已复制模板并打开预览</span>
                  </>
                ) : (
                  <>
                    <ClipboardCopy className="w-4 h-4" />
                    <span>📋 一键复制大厂级性能评测报告 Markdown 模板</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Original List View OR Detail View */}
          {!selectedPost ? (
            <div className="space-y-6">
              <div className="space-y-1.5">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                  实测与排障日记
                </h2>
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
                      <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                        {post.title}
                      </h3>
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
          ) : (
            (() => {
              const smi = selectedPost.nvidiaSmiModes[smiMode];
              const metric = METRIC_CONFIG[chartMetric];
              const maxVal = Math.max(
                ...selectedPost.chartData.map((d) =>
                  Math.max(d[metric.hfKey], d[metric.vllmKey])
                )
              );

              return (
                <div className="space-y-8">
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
                      <span className="text-slate-500 dark:text-slate-400">
                        {selectedPost.modelTested}
                      </span>
                    </div>

                    <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white leading-tight">
                      {selectedPost.title}
                    </h2>
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
                          <h3 className="font-bold text-base text-slate-900 dark:text-white">
                            模拟 <code className="font-mono text-sky-500">nvidia-smi</code> 实时监控面板
                          </h3>
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
                            <span className="text-slate-400">
                              VRAM 显存水位 ({smi.memUsed} / {smi.memTotal})
                            </span>
                            <span
                              className={
                                smi.memPct > 95 ? 'text-rose-400 font-bold' : 'text-sky-400'
                              }
                            >
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
                            <span
                              className={
                                smi.utilNum >= 80
                                  ? 'text-emerald-400 font-bold'
                                  : 'text-amber-400'
                              }
                            >
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
                          <h3 className="font-bold text-base text-slate-900 dark:text-white">
                            原生 PyTorch (HF) vs vLLM 实测性能对比图表
                          </h3>
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
                          <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                            {item.title}
                          </h4>
                          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                            {item.detail}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })()
          )}
        </div>
      )}

      {/* ==================== TAB 3: 性能工程师排障速查手册 ==================== */}
      {activeTab === 'cheatsheet' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-2 text-xs font-mono text-emerald-600 dark:text-emerald-400">
                <Wrench className="w-4 h-4" />
                <span>PERFORMANCE ENGINEER CHEATSHEET · 排障速查卡片墙</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                性能工程师排障速查手册
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                高频 Linux / <code className="font-mono text-sky-500">nvidia-smi</code> / vLLM OOM 调参 /{' '}
                <code className="font-mono text-sky-500">torch.cuda.Event</code> 精准计时 / NCCL 死锁排障口诀，每张卡片支持一键复制。
              </p>
            </div>
          </div>

          {/* Dual-Column Geek Cheatsheet Card Wall */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {CHEATSHEET_CARDS.map((card, idx) => {
              const isLastOdd =
                CHEATSHEET_CARDS.length % 2 === 1 && idx === CHEATSHEET_CARDS.length - 1;
              const accentClass =
                CHEATSHEET_ACCENTS[card.accent] || CHEATSHEET_ACCENTS.sky;

              return (
                <div
                  key={card.id}
                  className={`rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120]/90 p-5 sm:p-6 flex flex-col justify-between gap-4 hover:border-sky-400/50 transition-all shadow-sm ${
                    isLastOdd ? 'md:col-span-2' : ''
                  }`}
                >
                  <div className="space-y-4">
                    {/* Card Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-800">
                            #{card.index}
                          </span>
                          <span
                            className={`font-mono text-[11px] px-2 py-0.5 rounded border font-medium ${accentClass}`}
                          >
                            {card.tag}
                          </span>
                        </div>
                        <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                          {card.title}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {card.subtitle}
                        </p>
                      </div>
                    </div>

                    {/* Content Body (side-by-side on full-width 5th card on md+) */}
                    <div
                      className={
                        isLastOdd ? 'grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch' : 'space-y-4'
                      }
                    >
                      <CodeBlock
                        title={`${card.tag} 核心片段`}
                        language={card.language}
                        code={card.code}
                        collapsible={false}
                        compact={true}
                        copyLabel="复制命令"
                      />

                      {/* Engineer Tip /口诀 */}
                      <div className="rounded-xl border border-amber-500/25 bg-amber-500/[0.07] dark:bg-amber-500/10 p-3.5 sm:p-4 flex items-start gap-2.5">
                        <Lightbulb className="w-4 h-4 text-amber-500 dark:text-amber-400 shrink-0 mt-0.5" />
                        <div className="space-y-1 text-xs leading-relaxed">
                          <div className="font-mono font-bold text-amber-700 dark:text-amber-300">
                            工程师实战口诀与避坑提示
                          </div>
                          <p className="text-slate-700 dark:text-slate-200">{card.tip}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ==================== REPORT TEMPLATE PREVIEW MODAL ==================== */}
      {templateModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm"
          onClick={() => setTemplateModalOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="report-template-modal-title"
        >
          <div
            className="w-full max-w-3xl max-h-[88vh] rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0B1120] shadow-2xl flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
              <div className="space-y-0.5 min-w-0">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-sky-500 shrink-0" />
                  <h3
                    id="report-template-modal-title"
                    className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate"
                  >
                    大厂级性能评测报告标准 Markdown 模板
                  </h3>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  源自「实战 6」，可直接粘贴至 GitHub README / 技术专栏 / 简历作品集
                </p>
              </div>

              <button
                type="button"
                onClick={() => setTemplateModalOpen(false)}
                aria-label="关闭弹窗"
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Copy Feedback Strip */}
            {templateCopied && (
              <div className="px-5 py-2.5 bg-emerald-500/12 border-b border-emerald-500/25 flex items-center gap-2 text-xs font-medium text-emerald-700 dark:text-emerald-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>已将完整 Markdown 模板复制到剪贴板！你可以直接 Ctrl+V 粘贴使用。</span>
              </div>
            )}

            {/* Modal Body */}
            <div className="p-4 sm:p-5 overflow-y-auto flex-1">
              <CodeBlock
                title="llm_benchmark_report_template.md"
                language="markdown"
                code={BENCHMARK_REPORT_TEMPLATE}
                collapsible={false}
                copyLabel="再次复制模板"
              />
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 flex flex-wrap items-center justify-between gap-3">
              <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                提示：按 Esc 键或点击遮罩区域即可关闭
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleCopyAndPreviewTemplate(false)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-sky-500 hover:bg-sky-400 text-slate-950 transition-colors"
                >
                  {templateCopied ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>已复制</span>
                    </>
                  ) : (
                    <>
                      <ClipboardCopy className="w-3.5 h-3.5" />
                      <span>复制全文</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setTemplateModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl text-xs font-medium border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:border-sky-400/50 transition-colors"
                >
                  关闭
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
