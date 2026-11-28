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
  Search,
  Copy,
  Bot,
  Stethoscope,
  ExternalLink,
  Brain,
  Upload,
  BookOpenCheck,
} from 'lucide-react';
import { BENCHMARK_POSTS } from '../data/benchmarks';
import { CURRICULUM_STAGES } from '../data/curriculum';
import {
  TRAINING_TASKS,
  BENCHMARK_REPORT_TEMPLATE,
  CHEATSHEET_CARDS,
  TROUBLESHOOTING_SCENARIOS,
  SOFTWARE_TOOL_CATEGORIES,
} from '../data/trainingCamp';
import {
  REPORT_TEMPLATES_BY_LAB,
  PAPER_NOTE_TEMPLATE,
} from '../data/reportTemplates';
import { fetchDynamicData } from '../utils/dataLoader';
import { recordDailyActivity } from '../utils/activityStore';
import OomCommandGenerator from '../components/camp/OomCommandGenerator';
import ParetoChartStudio from '../components/camp/ParetoChartStudio';
import ErrorDecoder from '../components/camp/ErrorDecoder';
import DeepDiveQaModal from '../components/camp/DeepDiveQaModal';
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
  l0: {
    badge:
      'bg-cyan-500/12 text-cyan-700 dark:text-cyan-300 border-cyan-500/30',
    node: 'border-cyan-500/50 bg-cyan-500/15 text-cyan-600 dark:text-cyan-300',
  },
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
  l35: {
    badge:
      'bg-indigo-500/12 text-indigo-700 dark:text-indigo-300 border-indigo-500/30',
    node: 'border-indigo-500/50 bg-indigo-500/15 text-indigo-600 dark:text-indigo-300',
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

const LAB_FILTER_LEVELS = ['全部', 'L0', 'L1', 'L2', 'L3', 'L3.5', 'L4', 'L5', 'L6'];
const PAPER_DOMAINS = ['全部', '推理系统', '算子与显存', '芯片架构', '2026 前沿'];

const SUB_TABS = [
  {
    id: 'roadmap',
    label: '阶梯式工程训练路线',
    shortLabel: '阶梯实战',
    badge: 'L0~L4 · 8大实战',
    icon: Rocket,
  },
  {
    id: 'benchmarks',
    label: '实测与排障日记',
    shortLabel: '实测日记',
    badge: '8关绑定 · 8套模板',
    icon: Activity,
  },
  {
    id: 'cheatsheet',
    label: '性能工程师排障速查手册',
    shortLabel: '排障速查',
    badge: '防OOM/画图/报错',
    icon: Wrench,
  },
  {
    id: 'papers',
    label: '已读论文与个人理解',
    shortLabel: '论文笔记',
    badge: 'Paper Notes',
    icon: BookOpenCheck,
  },
];

export default function BenchmarksPage({
  onOpenLesson,
  requestedTab = null,
  requestedTabNonce = 0,
}) {
  const [activeTab, setActiveTab] = useState('roadmap');
  const [selectedPostId, setSelectedPostId] = useState(null);
  const [smiMode, setSmiMode] = useState('vllm_burst');
  const [chartMetric, setChartMetric] = useState('tpot');

  // Dynamic JSON states for Tab 2 (bench-logs) and Tab 4 (read-papers)
  const [benchLogs, setBenchLogs] = useState(BENCHMARK_POSTS);
  const [benchLabFilter, setBenchLabFilter] = useState('全部');
  const [benchSearch, setBenchSearch] = useState('');
  const [activeTemplateLab, setActiveTemplateLab] = useState('L1');

  const [readPapers, setReadPapers] = useState([]);
  const [paperDomainFilter, setPaperDomainFilter] = useState('全部');
  const [paperSearch, setPaperSearch] = useState('');

  // Local JSON preview modal + Deep-Dive Q&A modal
  const [jsonPreviewTarget, setJsonPreviewTarget] = useState(null); // 'bench' | 'papers' | null
  const [jsonPreviewInput, setJsonPreviewInput] = useState('');
  const [jsonPreviewError, setJsonPreviewError] = useState('');
  const [qaModalOpen, setQaModalOpen] = useState(false);

  // Report Template Modal & Copy feedback state
  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [templateCopied, setTemplateCopied] = useState(false);

  // Tab 3 interactive states: 6 scenario answers + tool category filter + copy feedback
  const [scenarioAnswers, setScenarioAnswers] = useState({});
  const [copiedId, setCopiedId] = useState(null);
  const [toolCatFilter, setToolCatFilter] = useState('全部');
  const [toolSearch, setToolSearch] = useState('');

  useEffect(() => {
    if (requestedTab && ['roadmap', 'benchmarks', 'cheatsheet', 'papers'].includes(requestedTab)) {
      setActiveTab(requestedTab);
    }
  }, [requestedTab, requestedTabNonce]);

  useEffect(() => {
    fetchDynamicData('bench-logs.json', BENCHMARK_POSTS).then((data) => {
      if (Array.isArray(data) && data.length > 0) setBenchLogs(data);
    });
    fetchDynamicData('read-papers.json', []).then((data) => {
      if (Array.isArray(data)) setReadPapers(data);
    });
  }, []);

  const filteredBenchLogs = useMemo(() => {
    const q = benchSearch.trim().toLowerCase();
    return benchLogs.filter((post) => {
      if (benchLabFilter !== '全部' && (post.lab_id || 'L1') !== benchLabFilter) return false;
      if (!q) return true;
      return (
        (post.title || '').toLowerCase().includes(q) ||
        (post.subtitle || '').toLowerCase().includes(q) ||
        (post.hardware || '').toLowerCase().includes(q) ||
        (post.modelTested || '').toLowerCase().includes(q) ||
        (post.tags || []).some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [benchLogs, benchLabFilter, benchSearch]);

  const filteredPapers = useMemo(() => {
    const q = paperSearch.trim().toLowerCase();
    return readPapers.filter((p) => {
      if (paperDomainFilter !== '全部' && p.domain !== paperDomainFilter) return false;
      if (!q) return true;
      return (
        (p.title_zh || '').toLowerCase().includes(q) ||
        (p.title_en || '').toLowerCase().includes(q) ||
        (p.venue || '').toLowerCase().includes(q) ||
        (p.core_bottleneck || '').toLowerCase().includes(q) ||
        (p.personal_understanding?.intuition || '').toLowerCase().includes(q) ||
        (p.personal_understanding?.critique_and_thought || '').toLowerCase().includes(q)
      );
    });
  }, [readPapers, paperDomainFilter, paperSearch]);

  const handleJumpToLabByLevel = (labLevel) => {
    const targetTask = TRAINING_TASKS.find((t) => t.labLevel === labLevel);
    setActiveTab('roadmap');
    setSelectedPostId(null);
    if (targetTask) {
      setTimeout(() => scrollToTask(targetTask.id), 60);
    }
  };

  const handleApplyJsonPreview = () => {
    try {
      const parsed = JSON.parse(jsonPreviewInput);
      const arr = Array.isArray(parsed) ? parsed : [parsed];
      if (jsonPreviewTarget === 'bench') {
        setBenchLogs(arr);
      } else if (jsonPreviewTarget === 'papers') {
        setReadPapers(arr);
      }
      setJsonPreviewError('');
      setJsonPreviewTarget(null);
    } catch (err) {
      setJsonPreviewError(err?.message || 'JSON 解析失败，请检查语法');
    }
  };

  const handleQuickCopy = async (id, text) => {
    const ok = await copyTextToClipboard(text);
    if (ok) {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const filteredTools = useMemo(() => {
    const q = toolSearch.trim().toLowerCase();
    return SOFTWARE_TOOL_CATEGORIES.filter((t) => {
      const catOk = toolCatFilter === '全部' || t.id === toolCatFilter;
      if (!catOk) return false;
      if (!q) return true;
      return (
        t.category.toLowerCase().includes(q) ||
        t.tools.toLowerCase().includes(q) ||
        t.purpose.toLowerCase().includes(q) ||
        t.command.toLowerCase().includes(q)
      );
    });
  }, [toolCatFilter, toolSearch]);

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
    setCheckedItems((prev) => {
      const nextVal = !prev[itemId];
      if (nextVal) recordDailyActivity(1);
      return {
        ...prev,
        [itemId]: nextVal,
      };
    });
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

  const selectedPost = benchLogs.find((p) => p.id === selectedPostId);

  const scrollToTask = (taskId) => {
    const el = document.getElementById(`training-task-${taskId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="py-6 sm:py-8 space-y-6">
      {/* Page Header + 4-Tab Switcher */}
      <div className="space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 text-xs font-mono text-sky-600 dark:text-sky-400">
              <Rocket className="w-4 h-4" />
              <span>HANDS-ON TRAINING · 工程实战、实测与论文研究工作台</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              工程实战与排障训练营
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 max-w-3xl leading-relaxed">
              专为「低预算、强正反馈、直通大厂简历」设计：覆盖 L0~L6 阶梯实战、实测日记、防 OOM/帕累托工具链与顶会论文精读批判笔记。
            </p>
          </div>

          <button
            type="button"
            onClick={() => setQaModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm transition-colors shrink-0"
          >
            <Brain className="w-4 h-4" />
            <span>系统架构深度问答演练舱 (10 题)</span>
          </button>
        </div>

        {/* 4 Sub-Tabs Bar */}
        <div
          role="tablist"
          aria-label="工程实战与排障训练营子页面"
          className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-[#0B1120]/90 p-1.5 shadow-sm"
        >
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-1.5">
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
                    TRAINING PROGRESS · L0 ~ L4 闯关进度
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
            <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-8 gap-2 pt-1">
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

                    {/* Collapsible Highlighted Code Block & Official References */}
                    {(task.code || (task.references && task.references.length > 0)) && (
                      <div className="space-y-3">
                        {task.code && (
                          <CodeBlock
                            title={task.codeTitle}
                            filename={task.codeFilename}
                            language={task.language}
                            code={task.code}
                            defaultExpanded={false}
                            collapsible={true}
                            copyLabel={task.language === 'markdown' ? '复制模板' : '复制代码'}
                          />
                        )}

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

                        {((task.references && task.references.length > 0) || task.labLevel) && (
                          <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
                            <div className="flex flex-wrap items-center gap-2">
                              {task.references && task.references.length > 0 && (
                                <>
                                  <span className="text-xs font-mono font-semibold text-slate-500 dark:text-slate-400">
                                    🔗 精选官方参考传送门：
                                  </span>
                                  {task.references.map((ref) => (
                                    <a
                                      key={ref.url}
                                      href={ref.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-slate-100/90 dark:bg-slate-900/80 text-slate-700 dark:text-slate-200 border border-slate-200/90 dark:border-slate-700/80 hover:border-[#38BDF8] hover:text-sky-600 dark:hover:text-[#38BDF8] transition-colors"
                                    >
                                      <ExternalLink className="w-3 h-3 text-sky-500 shrink-0" />
                                      <span>{ref.label}</span>
                                    </a>
                                  ))}
                                </>
                              )}
                            </div>

                            {task.labLevel && REPORT_TEMPLATES_BY_LAB[task.labLevel] && (
                              <button
                                type="button"
                                onClick={() => {
                                  const tpl = REPORT_TEMPLATES_BY_LAB[task.labLevel];
                                  handleQuickCopy(`tpl-${task.labLevel}`, tpl.template);
                                }}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-semibold bg-sky-500/10 text-sky-700 dark:text-sky-300 border border-sky-500/30 hover:bg-sky-500/20 transition-colors"
                              >
                                {copiedId === `tpl-${task.labLevel}` ? (
                                  <>
                                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                                    <span>已复制 {task.labLevel} 专属报告模板</span>
                                  </>
                                ) : (
                                  <>
                                    <ClipboardCopy className="w-3.5 h-3.5" />
                                    <span>复制 {task.labLevel} 专属报告模板</span>
                                  </>
                                )}
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </section>
              );
            })}
          </div>
        </div>
      )}

      {/* ==================== TAB 2: 实测与排障日记（8 关绑定 + 双时间戳 + 8 套模板） ==================== */}
      {activeTab === 'benchmarks' && (
        <div className="space-y-6">
          {/* 8 Dedicated Report Templates Bar */}
          <div className="rounded-2xl border border-sky-500/30 bg-gradient-to-r from-sky-500/10 via-cyan-500/5 to-emerald-500/10 p-4 sm:p-5 space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 text-xs font-mono text-sky-700 dark:text-sky-300 font-semibold">
                  <FileText className="w-4 h-4" />
                  <span>L0 ~ L6 全部 8 套专属实验报告 Markdown 模板（一键复制发 AI 整理回填）</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  选中对应实战关卡切换并复制专属结构化模板，或点击右侧「本地 JSON 预览导入」在推送 GitHub 前本地预览排版。
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setJsonPreviewTarget('bench');
                    setJsonPreviewInput(JSON.stringify(benchLogs, null, 2));
                    setJsonPreviewError('');
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:border-sky-400"
                >
                  <Upload className="w-3.5 h-3.5 text-sky-400" />
                  <span>本地 JSON 预览导入</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleCopyAndPreviewTemplate(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-sky-500 hover:bg-sky-400 text-slate-950 transition-colors"
                >
                  <ClipboardCopy className="w-3.5 h-3.5" />
                  <span>预览/复制通用总模板</span>
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {Object.values(REPORT_TEMPLATES_BY_LAB).map((tpl) => (
                <button
                  key={tpl.labId}
                  type="button"
                  onClick={() => setActiveTemplateLab(tpl.labId)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono font-semibold border transition-colors ${
                    activeTemplateLab === tpl.labId
                      ? 'bg-sky-500 text-slate-950 border-sky-400'
                      : 'bg-white/80 dark:bg-slate-900/80 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {tpl.labId} 模板
                </button>
              ))}
            </div>

            {REPORT_TEMPLATES_BY_LAB[activeTemplateLab] && (
              <CodeBlock
                title={REPORT_TEMPLATES_BY_LAB[activeTemplateLab].title}
                filename={REPORT_TEMPLATES_BY_LAB[activeTemplateLab].filename}
                language="markdown"
                code={REPORT_TEMPLATES_BY_LAB[activeTemplateLab].template}
                defaultExpanded={false}
                collapsible={true}
                copyLabel={`复制 ${activeTemplateLab} 模板`}
              />
            )}
          </div>

          {/* Original List View OR Detail View */}
          {!selectedPost ? (
            <div className="space-y-5">
              <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
                <div className="space-y-1">
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                    实测与排障日记 ({filteredBenchLogs.length})
                  </h2>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    绑定 L0~L6 关卡并记录创建/修改双时间戳；点击卡片查看交互式 <code className="font-mono text-sky-500">nvidia-smi</code> 面板与图表。
                  </p>
                </div>

                <div className="relative w-full lg:w-72">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={benchSearch}
                    onChange={(e) => setBenchSearch(e.target.value)}
                    placeholder="搜索日记标题、显卡或标签..."
                    className="w-full pl-8 pr-7 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120] text-slate-800 dark:text-slate-200"
                  />
                  {benchSearch && (
                    <button
                      type="button"
                      onClick={() => setBenchSearch('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Lab Level Filter Pills */}
              <div className="flex flex-wrap gap-1.5">
                {LAB_FILTER_LEVELS.map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setBenchLabFilter(lvl)}
                    className={`px-3 py-1 rounded-lg text-xs font-mono font-semibold border transition-colors ${
                      benchLabFilter === lvl
                        ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                        : 'bg-white dark:bg-[#0B1120] text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-emerald-400/50'
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>

              <div className="grid gap-6">
                {filteredBenchLogs.map((post) => (
                  <div
                    key={post.id}
                    onClick={() => setSelectedPostId(post.id)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') setSelectedPostId(post.id);
                    }}
                    className="group cursor-pointer text-left rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120]/90 hover:border-sky-400/60 p-6 sm:p-8 transition-all hover:-translate-y-0.5 hover:shadow-xl space-y-5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleJumpToLabByLevel(post.lab_id || 'L1');
                          }}
                          className="px-2.5 py-1 rounded-md bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-500/35 font-bold hover:bg-indigo-500/25"
                          title="跳转至 Tab 1 对应实战关卡"
                        >
                          {post.lab_id || 'L1'} 关卡 ↗
                        </button>
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25">
                          <Coins className="w-3.5 h-3.5" />
                          {post.cost}
                        </span>
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/25">
                          <Cpu className="w-3.5 h-3.5" />
                          {post.hardware}
                        </span>
                      </div>

                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-600 dark:text-sky-400 group-hover:translate-x-1 transition-transform">
                        <span>查看监控面板与对比图</span>
                        <ArrowRight className="w-4 h-4" />
                      </span>
                    </div>

                    {/* Dual Timestamps */}
                    <div className="flex flex-wrap items-center gap-4 text-[11px] font-mono text-slate-500 dark:text-slate-400">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-sky-400" />
                        <span>创建于：{post.created_at || `${post.date} 10:00`}</span>
                      </span>
                      <span>修改于：{post.updated_at || `${post.date} 18:00`}</span>
                      <span>· {post.readTime}</span>
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
                  </div>
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
        <div className="space-y-10">
          {/* Batch 3 & 5 Tools: Anti-OOM Generator + Pareto Chart Studio + 15-Error Decoder */}
          <OomCommandGenerator />
          <ParetoChartStudio />
          <ErrorDecoder onOpenLesson={onOpenLesson} />

          {/* Upper Section: 6 Real Troubleshooting Scenarios */}
          <div className="space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
              <div className="space-y-1.5">
                <div className="inline-flex items-center gap-2 text-xs font-mono text-sky-600 dark:text-sky-400">
                  <Stethoscope className="w-4 h-4" />
                  <span>TROUBLESHOOTING LABS · 6 场真实排障情景演练</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                  真实排障情景演练（3 选 1 交互破案）
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  点击 A / B / C 做出排障决策，即时判对错并展开救命命令与喂给 AI 的标准排障 Prompt（支持一键复制）。
                </p>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-mono font-semibold bg-sky-500/10 text-sky-700 dark:text-sky-300 border border-sky-500/25 shrink-0">
                已破案 {Object.values(scenarioAnswers).filter(Boolean).length} / {TROUBLESHOOTING_SCENARIOS.length} 场
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {TROUBLESHOOTING_SCENARIOS.map((sc) => {
                const picked = scenarioAnswers[sc.id];
                const isAnswered = Boolean(picked);
                const isRight = picked === sc.correctKey;

                return (
                  <div
                    key={sc.id}
                    className={`rounded-2xl border p-5 sm:p-6 space-y-4 transition-all ${
                      !isAnswered
                        ? 'border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120]/90'
                        : isRight
                          ? 'border-emerald-500/45 bg-emerald-500/[0.03] dark:bg-[#0B1120]/95'
                          : 'border-rose-500/45 bg-rose-500/[0.03] dark:bg-[#0B1120]/95'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug">
                        {sc.title}
                      </h3>
                      {isAnswered && (
                        <span
                          className={`shrink-0 px-2 py-0.5 rounded text-[11px] font-mono font-bold border ${
                            isRight
                              ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/35'
                              : 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/35'
                          }`}
                        >
                          {isRight ? '✅ 破案正确' : `❌ 应选 ${sc.correctKey}`}
                        </span>
                      )}
                    </div>

                    <div className="rounded-xl bg-slate-50 dark:bg-[#060A13]/80 border border-slate-200/80 dark:border-slate-800 p-3.5 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                      <span className="font-bold text-sky-600 dark:text-sky-400 mr-1">🔍 现场症状：</span>
                      {sc.symptom}
                    </div>

                    <div className="space-y-2">
                      {sc.options.map((opt) => {
                        const selected = picked === opt.key;
                        const rightOpt = opt.key === sc.correctKey;
                        let optClass =
                          'border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 text-slate-700 dark:text-slate-200 hover:border-sky-400/60';
                        if (isAnswered) {
                          if (rightOpt) {
                            optClass =
                              'border-emerald-500/60 bg-emerald-500/12 text-emerald-800 dark:text-emerald-200 font-medium';
                          } else if (selected) {
                            optClass =
                              'border-rose-500/60 bg-rose-500/12 text-rose-800 dark:text-rose-200';
                          } else {
                            optClass =
                              'border-slate-200/60 dark:border-slate-800/60 opacity-65 text-slate-500';
                          }
                        }

                        return (
                          <button
                            key={opt.key}
                            type="button"
                            onClick={() =>
                              setScenarioAnswers((prev) => ({ ...prev, [sc.id]: opt.key }))
                            }
                            className={`w-full text-left flex items-start gap-2.5 px-3.5 py-2.5 rounded-xl border text-xs transition-all ${optClass}`}
                          >
                            <span className="w-5 h-5 rounded-md font-mono font-bold text-[11px] flex items-center justify-center shrink-0 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200">
                              {opt.key}
                            </span>
                            <span className="leading-relaxed">{opt.text}</span>
                          </button>
                        );
                      })}
                    </div>

                    {isAnswered && (
                      <div className="space-y-3 pt-2 border-t border-slate-200/80 dark:border-slate-800">
                        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/[0.06] p-3 text-xs text-slate-700 dark:text-slate-200 leading-relaxed">
                          <span className="font-bold text-emerald-600 dark:text-emerald-400 mr-1">
                            ✅ 破案解析：
                          </span>
                          {sc.explanation}
                        </div>

                        <div className="rounded-xl bg-[#050811] border border-slate-800 p-3 space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[11px] font-mono text-emerald-400 font-semibold">
                              💻 救命命令
                            </span>
                            <button
                              type="button"
                              onClick={() => handleQuickCopy(`${sc.id}-cmd`, sc.rescueCommand)}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
                            >
                              {copiedId === `${sc.id}-cmd` ? (
                                <>
                                  <Check className="w-3 h-3 text-emerald-400" />
                                  <span>已复制</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3 text-sky-400" />
                                  <span>复制命令</span>
                                </>
                              )}
                            </button>
                          </div>
                          <pre className="text-[11px] font-mono text-slate-200 overflow-x-auto whitespace-pre-wrap">
                            {sc.rescueCommand}
                          </pre>
                        </div>

                        <div className="rounded-xl border border-sky-500/30 bg-sky-500/[0.06] p-3 space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <span className="inline-flex items-center gap-1.5 text-[11px] font-mono font-bold text-sky-600 dark:text-sky-400">
                              <Bot className="w-3.5 h-3.5" />
                              <span>🤖 喂给 AI 的排障 Prompt</span>
                            </span>
                            <button
                              type="button"
                              onClick={() => handleQuickCopy(`${sc.id}-prompt`, sc.aiPrompt)}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono bg-white dark:bg-slate-900 text-sky-700 dark:text-sky-300 border border-sky-500/30 hover:border-sky-400"
                            >
                              {copiedId === `${sc.id}-prompt` ? (
                                <>
                                  <Check className="w-3 h-3 text-emerald-500" />
                                  <span>已复制</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3" />
                                  <span>复制 Prompt</span>
                                </>
                              )}
                            </button>
                          </div>
                          <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                            「{sc.aiPrompt}」
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Middle Section: 10-Category Full-Stack Software Tools Cheatsheet Wall */}
          <div className="space-y-5 pt-4 border-t border-slate-200 dark:border-slate-800">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
              <div className="space-y-1.5">
                <div className="inline-flex items-center gap-2 text-xs font-mono text-emerald-600 dark:text-emerald-400">
                  <Wrench className="w-4 h-4" />
                  <span>FULL-STACK TOOLKIT · 10 大类工业界全量软件工具速查墙</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                  10 大类 AI 芯片与系统实战工具速查墙
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  补齐 Netron/ONNX、py-spy、nccl-tests、CUTLASS/TileLang、Mooncake/NIXL、msProf/ROCprof 等全栈大厂必备软件，支持分类筛选与一键复制。
                </p>
              </div>

              <div className="relative w-full lg:w-72">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={toolSearch}
                  onChange={(e) => setToolSearch(e.target.value)}
                  placeholder="搜索工具（如 Netron, py-spy, nccl）..."
                  className="w-full pl-8 pr-7 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120] text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:border-sky-400"
                />
                {toolSearch && (
                  <button
                    type="button"
                    onClick={() => setToolSearch('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Category Filter Pills */}
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => setToolCatFilter('全部')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                  toolCatFilter === '全部'
                    ? 'bg-sky-500 text-slate-950 border-sky-400 font-semibold'
                    : 'bg-white dark:bg-[#0B1120] text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-sky-400/50'
                }`}
              >
                全部 10 类
              </button>
              {SOFTWARE_TOOL_CATEGORIES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setToolCatFilter(t.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                    toolCatFilter === t.id
                      ? 'bg-sky-500 text-slate-950 border-sky-400 font-semibold'
                      : 'bg-white dark:bg-[#0B1120] text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-sky-400/50'
                  }`}
                >
                  {t.shortCat}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {filteredTools.map((tool) => (
                <div
                  key={tool.id}
                  className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120]/90 p-5 space-y-3.5 hover:border-sky-400/50 transition-all shadow-sm flex flex-col justify-between"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-sky-500/12 text-sky-700 dark:text-sky-300 border border-sky-500/25 font-semibold">
                        #{tool.index} · {tool.category}
                      </span>
                    </div>
                    <div className="text-sm font-bold font-mono text-slate-900 dark:text-white leading-snug">
                      {tool.tools}
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      {tool.purpose}
                    </p>
                  </div>

                  <CodeBlock
                    title="高频救命命令 / 实战入口"
                    language={tool.language}
                    code={tool.command}
                    collapsible={false}
                    compact={true}
                    copyLabel="复制命令"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Preserved Classic 5-Card Cheatsheet */}
          <div className="space-y-5 pt-4 border-t border-slate-200 dark:border-slate-800">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 text-xs font-mono text-amber-600 dark:text-amber-400">
                <Wrench className="w-4 h-4" />
                <span>CLASSIC CHEATSHEET · 经典 5 大保命口诀卡片</span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                经典随身排障口诀卡片
              </h3>
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

      {/* ==================== TAB 4: 已读论文与个人理解（Paper Notes） ==================== */}
      {activeTab === 'papers' && (
        <div className="space-y-6">
          {/* Top Bar */}
          <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-r from-emerald-500/10 via-sky-500/5 to-transparent p-5 space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-2 text-xs font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                  <BookOpenCheck className="w-4 h-4" />
                  <span>PAPER NOTES · 已精读 {readPapers.length} 篇系统/芯片顶会论文</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                  已读论文与个人理解（Paper Notes）
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                  拒绝干巴巴的论文摘要翻译：每篇均独立高亮「个人理解、算账推导、批判性思考与对应实测关卡联动」。
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setJsonPreviewTarget('papers');
                    setJsonPreviewInput(JSON.stringify(readPapers, null, 2));
                    setJsonPreviewError('');
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:border-emerald-400"
                >
                  <Upload className="w-3.5 h-3.5 text-emerald-400" />
                  <span>本地 JSON 预览导入</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickCopy('paper-tpl', PAPER_NOTE_TEMPLATE)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-colors"
                >
                  {copiedId === 'paper-tpl' ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>已复制新增论文 JSON 模板</span>
                    </>
                  ) : (
                    <>
                      <ClipboardCopy className="w-3.5 h-3.5" />
                      <span>复制新增论文模板</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex flex-wrap gap-1.5">
                {PAPER_DOMAINS.map((dom) => (
                  <button
                    key={dom}
                    type="button"
                    onClick={() => setPaperDomainFilter(dom)}
                    className={`px-3 py-1 rounded-lg text-xs font-medium border transition-colors ${
                      paperDomainFilter === dom
                        ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-semibold'
                        : 'bg-white dark:bg-[#0B1120] text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-emerald-400/50'
                    }`}
                  >
                    {dom}
                  </button>
                ))}
              </div>

              <div className="relative w-full md:w-72">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={paperSearch}
                  onChange={(e) => setPaperSearch(e.target.value)}
                  placeholder="搜索论文标题、顶会或算账关键词..."
                  className="w-full pl-8 pr-7 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120] text-slate-900 dark:text-white"
                />
                {paperSearch && (
                  <button
                    type="button"
                    onClick={() => setPaperSearch('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Paper Cards */}
          <div className="space-y-6">
            {filteredPapers.map((p) => (
              <article
                key={p.id}
                className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120]/95 overflow-hidden shadow-sm"
              >
                {/* Upper Zone: Objective Metadata */}
                <div className="p-5 sm:p-6 space-y-3 border-b border-slate-100 dark:border-slate-800/80">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded bg-sky-500/15 text-sky-700 dark:text-sky-300 border border-sky-500/30 font-bold">
                        {p.venue}
                      </span>
                      <span className="px-2.5 py-0.5 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 font-semibold">
                        {p.domain}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400">
                      <span>创建于：{p.created_at}</span>
                      <span>修改于：{p.updated_at}</span>
                      {p.paper_url && (
                        <a
                          href={p.paper_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-sky-500 hover:underline font-semibold"
                        >
                          <span>原文链接</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                      {p.title_zh}
                    </h3>
                    <p className="text-xs font-mono text-slate-500 dark:text-slate-400 mt-0.5">
                      {p.title_en}
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-50 dark:bg-[#060A13]/85 border border-slate-200/80 dark:border-slate-800 p-3 text-xs text-slate-700 dark:text-slate-300">
                    <strong className="text-rose-500 mr-1">核心瓶颈：</strong>
                    {p.core_bottleneck}
                  </div>
                </div>

                {/* Lower Zone: Highlighted Personal Understanding & Critical Thinking */}
                <div className="p-5 sm:p-6 bg-emerald-500/[0.04] dark:bg-emerald-950/15 border-l-4 border-l-emerald-400 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-mono font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">
                      个人理解与批判性思考 · PERSONAL INSIGHTS
                    </span>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {(p.related_labs || []).map((lvl) => (
                        <button
                          key={lvl}
                          type="button"
                          onClick={() => handleJumpToLabByLevel(lvl)}
                          className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-sky-500/15 text-sky-700 dark:text-sky-300 border border-sky-500/30 hover:bg-sky-500/25"
                        >
                          联动 {lvl} 实战 ↗
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-3.5 text-xs leading-relaxed">
                    <div className="rounded-xl bg-white/80 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800 p-3.5 space-y-1">
                      <div className="font-mono font-bold text-sky-600 dark:text-sky-400">核心直觉</div>
                      <p className="text-slate-700 dark:text-slate-200">{p.personal_understanding?.intuition}</p>
                    </div>
                    <div className="rounded-xl bg-white/80 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800 p-3.5 space-y-1">
                      <div className="font-mono font-bold text-emerald-600 dark:text-emerald-400">底层性能算账</div>
                      <p className="text-slate-700 dark:text-slate-200">{p.personal_understanding?.perf_math}</p>
                    </div>
                    <div className="rounded-xl bg-white/80 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800 p-3.5 space-y-1">
                      <div className="font-mono font-bold text-amber-600 dark:text-amber-400">局限性与延伸思考</div>
                      <p className="text-slate-700 dark:text-slate-200">{p.personal_understanding?.critique_and_thought}</p>
                    </div>
                    <div className="rounded-xl bg-white/80 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800 p-3.5 space-y-1">
                      <div className="font-mono font-bold text-indigo-600 dark:text-indigo-400">实测复现关联</div>
                      <p className="text-slate-700 dark:text-slate-200">{p.personal_understanding?.lab_link_note}</p>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      )}

      {/* Local JSON Preview Import Modal */}
      {jsonPreviewTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm"
          onClick={() => setJsonPreviewTarget(null)}
        >
          <div
            className="w-full max-w-2xl rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0B1120] shadow-2xl p-5 sm:p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                本地 JSON 预览导入（{jsonPreviewTarget === 'bench' ? 'bench-logs.json' : 'read-papers.json'}）
              </h3>
              <button
                type="button"
                onClick={() => setJsonPreviewTarget(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-500">
              在推送 GitHub（`[skip netlify]`）前，直接在此粘贴修改后的 JSON 实时预览网页排版效果。
            </p>
            <textarea
              rows={11}
              value={jsonPreviewInput}
              onChange={(e) => setJsonPreviewInput(e.target.value)}
              className="w-full p-3 rounded-xl text-xs font-mono border border-slate-200 dark:border-slate-800 bg-slate-950 text-emerald-300"
            />
            {jsonPreviewError && (
              <div className="text-xs font-mono text-rose-500">{jsonPreviewError}</div>
            )}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setJsonPreviewTarget(null)}
                className="px-4 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleApplyJsonPreview}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-sky-500 hover:bg-sky-400 text-slate-950"
              >
                应用预览
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Deep-Dive Q&A Modal */}
      <DeepDiveQaModal isOpen={qaModalOpen} onClose={() => setQaModalOpen(false)} />
    </div>
  );
}
