import React, { useState, useMemo, useEffect } from 'react';
import {
  ChevronDown,
  ChevronUp,
  ChevronRight,
  CheckCircle2,
  Circle,
  Clock,
  ArrowLeft,
  ArrowRight,
  Lightbulb,
  Calculator,
  AlertTriangle,
  Sparkles,
  FlaskConical,
  ListTree,
  Search,
  X,
  Lock,
  Target,
  Star,
  BookOpen,
  HelpCircle,
  ClipboardCheck,
  Check,
  Copy,
  Radar,
} from 'lucide-react';
import { CURRICULUM_STAGES } from '../data/curriculum';
import LessonLabCard from '../components/LessonLabCard';
import { LESSON_LAB_WIDGETS } from '../data/labCatalog';
import { copyTextToClipboard } from '../components/CodeBlock';

const CALLOUT_STYLES = {
  engineer: {
    icon: Calculator,
    label: '算账视角',
    boxClass:
      'border border-sky-500/25 border-l-4 border-l-[#38BDF8] bg-sky-500/[0.06] dark:bg-sky-500/10 text-slate-800 dark:text-slate-200 shadow-sm',
    titleClass: 'text-sky-700 dark:text-[#38BDF8]',
  },
  analogy: {
    icon: Lightbulb,
    label: '大白话直觉',
    boxClass:
      'border-sky-500/30 bg-sky-500/5 dark:bg-sky-500/10 text-slate-800 dark:text-slate-200',
    titleClass: 'text-sky-700 dark:text-sky-300',
  },
  formula: {
    icon: Calculator,
    label: '硬核算账',
    boxClass:
      'border-emerald-500/30 bg-emerald-500/5 dark:bg-emerald-500/10 text-slate-800 dark:text-slate-200',
    titleClass: 'text-emerald-700 dark:text-emerald-300',
  },
  warning: {
    icon: AlertTriangle,
    label: '瓶颈警报',
    boxClass:
      'border-rose-500/35 bg-rose-500/5 dark:bg-rose-500/10 text-slate-800 dark:text-slate-200',
    titleClass: 'text-rose-700 dark:text-rose-300',
  },
  tip: {
    icon: Sparkles,
    label: '系统贴士',
    boxClass:
      'border-amber-500/30 bg-amber-500/5 dark:bg-amber-500/10 text-slate-800 dark:text-slate-200',
    titleClass: 'text-amber-700 dark:text-amber-300',
  },
};

function renderInlineText(text) {
  if (!text || typeof text !== 'string') return text;
  const tokens = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return tokens.map((part, idx) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return (
        <strong key={idx} className="font-semibold text-slate-900 dark:text-white">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
      return (
        <code
          key={idx}
          className="px-1.5 py-0.5 mx-0.5 rounded bg-slate-100 dark:bg-slate-800/90 text-sky-600 dark:text-sky-300 font-mono text-[0.87em] border border-slate-200/80 dark:border-slate-700/80"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}

function getBlockSearchText(block) {
  if (!block) return '';
  if (block.text) return block.text;
  if (block.content) return `${block.title || ''} ${block.content}`;
  if (block.type === 'list' && Array.isArray(block.items)) {
    return block.items
      .map((item) => (typeof item === 'string' ? item : `${item.lead || ''} ${item.body || ''}`))
      .join(' ');
  }
  if (block.type === 'table') {
    return [
      block.title || '',
      ...(block.headers || []),
      ...(block.rows || []).flat(),
    ].join(' ');
  }
  if (block.type === 'quiz') {
    return `${block.question || ''} ${block.answer || ''}`;
  }
  if (block.type === 'jd_radar' && Array.isArray(block.items)) {
    return `${block.title || ''} ${block.items
      .map((i) => `${i.role} ${i.snippet} ${i.reason}`)
      .join(' ')}`;
  }
  if (block.type === 'exercises' && Array.isArray(block.items)) {
    return block.items
      .map((item) => {
        const opts = (item.options || []).map((o) => o.text).join(' ');
        return `${item.tag || ''} ${item.question || ''} ${opts} ${item.answer || ''}`;
      })
      .join(' ');
  }
  return '';
}

function ExerciseItem({ item }) {
  const [selectedKey, setSelectedKey] = useState(null);
  const [isOpen, setIsOpen] = useState(false);

  const hasOptions = Array.isArray(item.options) && item.options.length > 0;
  const isAnswered = selectedKey !== null;
  const isCorrect = isAnswered && selectedKey === item.correctKey;

  const handleSelectOption = (optKey) => {
    setSelectedKey(optKey);
    setIsOpen(true);
  };

  return (
    <div className="rounded-xl border border-amber-500/20 bg-white/90 dark:bg-[#0B1120]/85 p-4 sm:p-5 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-mono font-semibold bg-amber-500/12 text-amber-800 dark:text-amber-300 border border-amber-500/25">
            习题 {item.index} · {item.tag}
          </span>
          {isAnswered && (
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-mono font-semibold border ${
                isCorrect
                  ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/35'
                  : 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/35'
              }`}
            >
              {isCorrect ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
              <span>{isCorrect ? '回答正确' : `已选 ${selectedKey === 'T' ? '正确' : selectedKey === 'F' ? '错误' : selectedKey} · 请看解析`}</span>
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={() => setIsOpen((v) => !v)}
          aria-expanded={isOpen}
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium border transition-colors ${
            isOpen
              ? 'bg-amber-500/15 border-amber-500/40 text-amber-800 dark:text-amber-200'
              : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-amber-500/60 hover:text-amber-700 dark:hover:text-amber-300'
          }`}
        >
          <span>{isOpen ? '收起答案与解析' : '查看答案与解析'}</span>
          {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      <p className="text-[14.5px] leading-7 font-medium text-slate-900 dark:text-slate-100">
        {renderInlineText(item.question)}
      </p>

      {hasOptions && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-0.5">
          {item.options.map((opt) => {
            const isSelected = selectedKey === opt.key;
            const isRightOption = opt.key === item.correctKey;

            let btnStyle =
              'border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 text-slate-700 dark:text-slate-200 hover:border-amber-500/60 hover:bg-amber-500/[0.06]';

            if (isAnswered) {
              if (isRightOption) {
                btnStyle =
                  'border-emerald-500/60 bg-emerald-500/12 text-emerald-800 dark:text-emerald-200 font-medium';
              } else if (isSelected) {
                btnStyle =
                  'border-rose-500/60 bg-rose-500/12 text-rose-800 dark:text-rose-200';
              } else {
                btnStyle =
                  'border-slate-200/70 dark:border-slate-800/70 bg-slate-50/40 dark:bg-slate-900/30 text-slate-500 dark:text-slate-400 opacity-70';
              }
            }

            return (
              <button
                key={opt.key}
                type="button"
                onClick={() => handleSelectOption(opt.key)}
                className={`flex items-center gap-2.5 text-left px-3.5 py-2.5 rounded-lg border text-xs sm:text-[13px] transition-all ${btnStyle}`}
              >
                {item.kind === 'choice' && (
                  <span
                    className={`w-5 h-5 rounded-md font-mono text-[11px] font-bold flex items-center justify-center shrink-0 border ${
                      isAnswered && isRightOption
                        ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                        : isAnswered && isSelected
                          ? 'bg-rose-500 text-white border-rose-400'
                          : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-700'
                    }`}
                  >
                    {opt.key}
                  </span>
                )}
                <span className="flex-1 leading-snug">{renderInlineText(opt.text)}</span>
                {isAnswered && isRightOption && (
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                )}
                {isAnswered && isSelected && !isRightOption && (
                  <X className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      )}

      <div
        className={`grid transition-all duration-300 ease-out ${
          isOpen ? 'grid-rows-[1fr] opacity-100 pt-1' : 'grid-rows-[0fr] opacity-0'
        }`}
      >
        <div className="overflow-hidden">
          <div className="rounded-lg border border-amber-500/25 bg-amber-500/[0.06] dark:bg-amber-500/10 p-3.5 space-y-1">
            <div className="text-[11px] font-mono font-semibold text-amber-800 dark:text-amber-300">
              答案与解析
            </div>
            <p className="text-sm leading-7 text-slate-700 dark:text-slate-200">
              {renderInlineText(item.answer)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ExerciseGroup({ lessonId, items }) {
  return (
    <section
      aria-label="随堂基础自测"
      className="rounded-2xl border border-amber-500/25 border-l-4 border-l-[#D97706] bg-amber-500/[0.04] dark:bg-amber-500/[0.07] p-5 sm:p-6 space-y-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs font-mono font-semibold text-[#B45309] dark:text-amber-400 uppercase tracking-wider">
          <ClipboardCheck className="w-4 h-4 text-[#D97706] shrink-0" />
          <span>随堂基础自测 · BASIC CHECK</span>
        </div>
        <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-amber-500/12 text-amber-800 dark:text-amber-300 border border-amber-500/25">
          共 {items.length} 道巩固习题
        </span>
      </div>

      <div className="space-y-3.5">
        {items.map((item) => (
          <ExerciseItem key={`${lessonId}-ex-${item.index}`} item={item} />
        ))}
      </div>
    </section>
  );
}

function CalloutBlock({ block }) {
  const [copied, setCopied] = useState(false);
  const style = CALLOUT_STYLES[block.variant] || CALLOUT_STYLES.tip;
  const Icon = style.icon;

  const handleCopy = async () => {
    const textToCopy = block.copyText || block.content;
    const ok = await copyTextToClipboard(textToCopy);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div
      className={`rounded-xl p-4 sm:p-5 space-y-2 ${
        block.variant === 'engineer' ? '' : 'border '
      }${style.boxClass}`}
    >
      <div className={`flex flex-wrap items-center gap-2 font-semibold text-sm ${style.titleClass}`}>
        <Icon className="w-4 h-4 shrink-0" />
        <span>{block.title}</span>
        <div className="ml-auto flex items-center gap-2">
          {block.copyText && (
            <button
              type="button"
              onClick={handleCopy}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-mono border transition-colors ${
                copied
                  ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/40'
                  : 'bg-white/80 dark:bg-slate-900/80 text-sky-700 dark:text-sky-300 border-sky-500/30 hover:border-sky-400'
              }`}
            >
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              <span>{copied ? '已复制' : '一键复制命令/Prompt'}</span>
            </button>
          )}
          <span className="text-[10px] font-mono uppercase opacity-75">
            {style.label}
          </span>
        </div>
      </div>
      <p className="text-sm leading-7 whitespace-pre-line opacity-95">
        {renderInlineText(block.content)}
      </p>
    </div>
  );
}

function JdRadarQuiz({ block }) {
  const [answers, setAnswers] = useState({});
  const items = block.items || [];
  const answeredCount = Object.keys(answers).length;
  const correctCount = items.filter((item) => answers[item.id] === item.verdict).length;

  return (
    <section
      aria-label="JD 关键词避坑雷达"
      className="rounded-2xl border border-sky-500/30 bg-gradient-to-br from-sky-500/[0.05] via-white to-emerald-500/[0.04] dark:from-[#0B1120] dark:via-[#0B1120] dark:to-emerald-950/20 p-5 sm:p-6 space-y-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-sky-600 dark:text-sky-400 uppercase tracking-wider">
            <Radar className="w-4 h-4 shrink-0" />
            <span>{block.title}</span>
          </div>
          {block.subtitle && (
            <p className="text-xs text-slate-600 dark:text-slate-400">{block.subtitle}</p>
          )}
        </div>
        <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold border border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300">
          得分：{correctCount} / {items.length}（已判 {answeredCount}/{items.length}）
        </span>
      </div>

      <div className="grid md:grid-cols-2 gap-3.5">
        {items.map((item, idx) => {
          const picked = answers[item.id];
          const isAnswered = Boolean(picked);
          const isRight = picked === item.verdict;
          return (
            <div
              key={item.id}
              className={`rounded-xl border p-4 space-y-3 transition-all ${
                !isAnswered
                  ? 'border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/60'
                  : isRight
                    ? 'border-emerald-500/45 bg-emerald-500/[0.06]'
                    : 'border-rose-500/45 bg-rose-500/[0.06]'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-mono font-bold text-slate-900 dark:text-white">
                  #{idx + 1} · {item.role}
                </span>
                {isAnswered && (
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                      isRight
                        ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                        : 'bg-rose-500/20 text-rose-700 dark:text-rose-300'
                    }`}
                  >
                    {isRight ? '判断精准' : '踩坑了'}
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {item.snippet}
              </p>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setAnswers((prev) => ({ ...prev, [item.id]: 'go' }))}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-mono font-bold border transition-colors ${
                    picked === 'go'
                      ? item.verdict === 'go'
                        ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                        : 'bg-rose-500 text-white border-rose-400'
                      : 'bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-emerald-400'
                  }`}
                >
                  冲 ✅
                </button>
                <button
                  type="button"
                  onClick={() => setAnswers((prev) => ({ ...prev, [item.id]: 'run' }))}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-mono font-bold border transition-colors ${
                    picked === 'run'
                      ? item.verdict === 'run'
                        ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                        : 'bg-rose-500 text-white border-rose-400'
                      : 'bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-rose-400'
                  }`}
                >
                  逃 ❌
                </button>
              </div>

              {isAnswered && (
                <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-200 pt-1 border-t border-slate-200/70 dark:border-slate-800/80">
                  {item.reason}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function QuizCard({ question, answer }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-[#060A13]/80 p-5 sm:p-6 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs font-mono font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
          <HelpCircle className="w-4 h-4 shrink-0" />
          <span>课后思考题 · SELF-CHECK</span>
        </div>
        <button
          type="button"
          onClick={() => setIsOpen((v) => !v)}
          aria-expanded={isOpen}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
            isOpen
              ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-700 dark:text-emerald-300'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-sky-400/60 hover:text-sky-600 dark:hover:text-sky-300'
          }`}
        >
          <span>{isOpen ? '收起参考解析' : '查看参考解析'}</span>
          {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      <p className="text-[15px] leading-7 font-medium text-slate-900 dark:text-slate-100">
        {renderInlineText(question)}
      </p>

      <div
        className={`grid transition-all duration-300 ease-out ${
          isOpen ? 'grid-rows-[1fr] opacity-100 pt-1' : 'grid-rows-[0fr] opacity-0'
        }`}
      >
        <div className="overflow-hidden">
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/[0.06] dark:bg-emerald-500/10 p-4 space-y-1.5">
            <div className="text-xs font-mono font-semibold text-emerald-700 dark:text-emerald-400">
              参考解析
            </div>
            <p className="text-sm leading-7 text-slate-700 dark:text-slate-200">
              {renderInlineText(answer)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

const DEFAULT_EXPANDED_IDS = ['module-1', 'module-5'];

export default function DocsPage({
  activeLessonId,
  onSelectLesson,
  completedLessons,
  onToggleComplete,
  onNavigateLab,
}) {
  const [expandedStages, setExpandedStages] = useState(() => {
    const init = {};
    CURRICULUM_STAGES.forEach((s) => {
      init[s.id] = DEFAULT_EXPANDED_IDS.includes(s.id);
    });
    return init;
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileTocOpen, setMobileTocOpen] = useState(false);

  const flatLessons = useMemo(
    () =>
      CURRICULUM_STAGES.flatMap((stage) =>
        stage.lessons.map((lesson) => ({ ...lesson, stage }))
      ),
    []
  );

  // Ensure the module containing the active lesson is expanded when navigating from outside
  useEffect(() => {
    const activeStage = CURRICULUM_STAGES.find((s) =>
      s.lessons.some((l) => l.id === activeLessonId)
    );
    if (activeStage) {
      setExpandedStages((prev) =>
        prev[activeStage.id] ? prev : { ...prev, [activeStage.id]: true }
      );
    }
  }, [activeLessonId]);

  const filteredStages = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return CURRICULUM_STAGES;
    return CURRICULUM_STAGES.map((stage) => {
      const stageMatch =
        stage.title.toLowerCase().includes(q) ||
        (stage.perspectiveTag || '').toLowerCase().includes(q);
      const matchedLessons = stageMatch
        ? stage.lessons
        : stage.lessons.filter(
            (l) =>
              l.title.toLowerCase().includes(q) ||
              l.id.toLowerCase().includes(q) ||
              (l.goal || '').toLowerCase().includes(q) ||
              (l.summary || '').toLowerCase().includes(q) ||
              (l.articleTitle || '').toLowerCase().includes(q) ||
              (l.tags || []).some((t) => t.toLowerCase().includes(q)) ||
              (l.blocks || []).some((b) => getBlockSearchText(b).toLowerCase().includes(q))
          );
      return { ...stage, lessons: matchedLessons };
    }).filter((stage) => stage.lessons.length > 0);
  }, [searchQuery]);

  const foundIdx = flatLessons.findIndex((item) => item.id === activeLessonId);
  const currentIdx = foundIdx >= 0 ? foundIdx : 0;
  const currentItem = flatLessons[currentIdx] || flatLessons[0];
  const prevLesson = currentIdx > 0 ? flatLessons[currentIdx - 1] : null;
  const nextLesson = currentIdx < flatLessons.length - 1 ? flatLessons[currentIdx + 1] : null;

  const hasContent = Boolean(currentItem.blocks && currentItem.blocks.length > 0);
  const isCompleted = completedLessons.includes(currentItem.id);
  const isSearching = searchQuery.trim().length > 0;

  const toggleStage = (stageId) => {
    setExpandedStages((prev) => ({ ...prev, [stageId]: !prev[stageId] }));
  };

  const handleLessonClick = (lessonId) => {
    onSelectLesson(lessonId);
    setMobileTocOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="py-6 sm:py-8">
      {/* Mobile TOC Toggle Bar */}
      <div className="lg:hidden mb-4">
        <button
          onClick={() => setMobileTocOpen((v) => !v)}
          className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120] text-sm font-medium text-slate-800 dark:text-slate-200"
        >
          <span className="flex items-center gap-2">
            <ListTree className="w-4 h-4 text-sky-400" />
            <span>
              课程目录 ({completedLessons.length}/{flatLessons.length} 已完成)
            </span>
          </span>
          {mobileTocOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
      </div>

      <div className="grid lg:grid-cols-12 gap-8 items-start">
        {/* Left Collapsible Directory Tree */}
        <aside
          className={`lg:col-span-4 xl:col-span-3 lg:sticky lg:top-24 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120]/90 p-3 space-y-2.5 ${
            mobileTocOpen ? 'block' : 'hidden lg:block'
          }`}
        >
          <div className="px-2.5 py-2 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              8 大模块 · {flatLessons.length} 课
            </span>
            <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400">
              {completedLessons.length}/{flatLessons.length}
            </span>
          </div>

          {/* Concise Course Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索课程编号或关键词..."
              className="w-full pl-8 pr-7 py-1.5 rounded-lg text-xs border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:border-sky-400 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                aria-label="清空搜索"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="space-y-1.5 max-h-[68vh] overflow-y-auto pr-1">
            {filteredStages.length === 0 ? (
              <div className="py-8 px-3 text-center text-xs text-slate-500 dark:text-slate-400 space-y-2">
                <p>未找到匹配 “{searchQuery}” 的课程</p>
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-sky-600 dark:text-sky-400 hover:underline"
                >
                  重置搜索
                </button>
              </div>
            ) : (
              filteredStages.map((stage) => {
                const isOpen = isSearching ? true : Boolean(expandedStages[stage.id]);
                const stageDone = stage.lessons.filter((l) =>
                  completedLessons.includes(l.id)
                ).length;

                return (
                  <div key={stage.id} className="rounded-xl overflow-hidden">
                    <button
                      onClick={() => toggleStage(stage.id)}
                      className="w-full flex items-center justify-between px-2.5 py-2 text-left text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60 rounded-lg transition-colors"
                    >
                      <span className="flex items-center gap-1.5 truncate">
                        {isOpen ? (
                          <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        ) : (
                          <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        )}
                        <span className="truncate">{stage.title}</span>
                      </span>
                      <span className="ml-2 font-mono text-[11px] text-slate-400 shrink-0">
                        {stageDone}/{stage.lessons.length}
                      </span>
                    </button>

                    {isOpen && (
                      <div className="mt-1 ml-3 pl-2.5 border-l border-slate-200 dark:border-slate-800 space-y-1">
                        {stage.lessons.map((lesson) => {
                          const active = lesson.id === currentItem.id;
                          const done = completedLessons.includes(lesson.id);
                          const ready = Boolean(lesson.blocks && lesson.blocks.length > 0);

                          return (
                            <button
                              key={lesson.id}
                              onClick={() => handleLessonClick(lesson.id)}
                              className={`w-full flex items-start gap-2 px-2.5 py-2 rounded-lg text-left text-xs transition-all ${
                                active
                                  ? 'bg-sky-500/12 text-sky-600 dark:text-sky-300 font-medium border border-sky-400/30'
                                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200'
                              }`}
                            >
                              {done ? (
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400 shrink-0 mt-0.5" />
                              ) : (
                                <Circle
                                  className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${
                                    ready
                                      ? 'text-sky-400/70'
                                      : 'text-slate-300 dark:text-slate-700'
                                  }`}
                                />
                              )}
                              <span className="leading-snug flex-1">
                                <span>{lesson.title}</span>
                                <span className="inline-flex flex-wrap items-center gap-1 ml-1.5 align-middle">
                                  {lesson.isCore && (
                                    <span className="inline-block px-1.5 py-0.2 rounded text-[10px] font-mono bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/25">
                                      核心主线
                                    </span>
                                  )}
                                  {lesson.featured && (
                                    <span className="inline-block px-1.5 py-0.2 rounded text-[10px] font-mono bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25">
                                      已完成
                                    </span>
                                  )}
                                  {LESSON_LAB_WIDGETS[lesson.id] && (
                                    <span className="inline-block px-1.5 py-0.2 rounded text-[10px] font-mono bg-indigo-500/15 text-indigo-600 dark:text-indigo-300 border border-indigo-500/25">
                                      🧪 沙盒
                                    </span>
                                  )}
                                </span>
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </aside>

        {/* Right Reader or Placeholder Unlock Card */}
        <article className="lg:col-span-8 xl:col-span-9 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120]/90 p-6 sm:p-10 shadow-sm space-y-8">
          {hasContent ? (
            <>
              {/* Full Article Header */}
              <header className="space-y-4 border-b border-slate-200 dark:border-slate-800 pb-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
                    <span className="px-2.5 py-1 rounded-md bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
                      {currentItem.stage.title}
                    </span>
                    {currentItem.isCore && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                        <Star className="w-3 h-3 fill-current" />
                        <span>核心主线</span>
                      </span>
                    )}
                    {currentItem.readTime && (
                      <span className="inline-flex items-center gap-1 text-slate-500 dark:text-slate-400">
                        <Clock className="w-3.5 h-3.5" />
                        {currentItem.readTime}
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => onToggleComplete(currentItem.id)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                      isCompleted
                        ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-700 dark:text-emerald-300'
                        : 'bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-emerald-400/50'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{isCompleted ? '已标记学完' : '标记为已学完'}</span>
                  </button>
                </div>

                <div className="text-xs font-mono text-slate-500 dark:text-slate-400">
                  {currentItem.title}
                </div>

                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white leading-tight">
                  {currentItem.articleTitle || currentItem.title}
                </h1>

                {(currentItem.summary || currentItem.goal) && (
                  <p className="text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                    {renderInlineText(currentItem.summary || currentItem.goal)}
                  </p>
                )}

                {currentItem.tags && currentItem.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {currentItem.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2.5 py-0.5 rounded-full text-xs font-mono bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </header>

              {/* Article Body Blocks */}
              <div className="space-y-6">
                {currentItem.blocks.map((block, idx) => {
                  if (block.type === 'heading') {
                    return (
                      <h2
                        key={idx}
                        className="text-xl font-bold text-slate-900 dark:text-white pt-3 flex items-center gap-2.5"
                      >
                        <span className="w-1.5 h-6 rounded-full bg-gradient-to-b from-sky-400 to-emerald-400" />
                        <span>{block.text}</span>
                      </h2>
                    );
                  }

                  if (block.type === 'paragraph') {
                    return (
                      <p
                        key={idx}
                        className="text-[15.5px] leading-7 text-slate-700 dark:text-slate-300"
                      >
                        {renderInlineText(block.text)}
                      </p>
                    );
                  }

                  if (block.type === 'list') {
                    const ListTag = block.ordered !== false ? 'ol' : 'ul';
                    return (
                      <ListTag key={idx} className="space-y-3">
                        {block.items.map((item, itemIdx) => {
                          const isObj = item && typeof item === 'object';
                          const lead = isObj ? item.lead : null;
                          const body = isObj ? item.body : item;
                          return (
                            <li
                              key={itemIdx}
                              className="flex items-start gap-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-900/40 px-4 py-3.5"
                            >
                              <span className="mt-0.5 w-6 h-6 rounded-lg bg-sky-500/12 dark:bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/25 font-mono text-xs font-bold flex items-center justify-center shrink-0">
                                {block.ordered !== false ? itemIdx + 1 : '•'}
                              </span>
                              <div className="text-[15px] leading-7 text-slate-700 dark:text-slate-300 flex-1">
                                {lead && (
                                  <strong className="font-semibold text-slate-900 dark:text-white">
                                    {renderInlineText(lead)}
                                  </strong>
                                )}
                                {renderInlineText(body)}
                              </div>
                            </li>
                          );
                        })}
                      </ListTag>
                    );
                  }

                  if (block.type === 'callout') {
                    return <CalloutBlock key={idx} block={block} />;
                  }

                  if (block.type === 'jd_radar') {
                    return <JdRadarQuiz key={idx} block={block} />;
                  }

                  if (block.type === 'table') {
                    return (
                      <React.Fragment key={idx}>
                        <div className="space-y-2.5">
                          {block.title && (
                            <div className="text-xs font-mono font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                              📊 {block.title}
                            </div>
                          )}
                          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                            <table className="w-full text-left border-collapse text-sm">
                              <thead>
                                <tr className="bg-sky-500/10 dark:bg-sky-500/15 border-b-2 border-sky-500/30">
                                  {block.headers.map((h, hIdx) => (
                                    <th
                                      key={hIdx}
                                      className="py-3 px-4 font-semibold text-sky-900 dark:text-sky-200 whitespace-nowrap"
                                    >
                                      {renderInlineText(h)}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-200/80 dark:divide-slate-800/80">
                                {block.rows.map((row, rIdx) => (
                                  <tr
                                    key={rIdx}
                                    className="odd:bg-white dark:odd:bg-transparent even:bg-slate-50/80 dark:even:bg-slate-800/35 hover:bg-sky-500/[0.06] dark:hover:bg-sky-500/10 transition-colors"
                                  >
                                    {row.map((cell, cIdx) => (
                                      <td
                                        key={cIdx}
                                        className={`py-3 px-4 leading-relaxed ${
                                          cIdx === 0
                                            ? 'font-medium text-slate-900 dark:text-white whitespace-nowrap'
                                            : 'text-slate-600 dark:text-slate-300'
                                        }`}
                                      >
                                        {renderInlineText(cell)}
                                      </td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                        {LESSON_LAB_WIDGETS[currentItem.id] && (
                          <LessonLabCard
                            lessonId={currentItem.id}
                            onOpenLabWithPreset={onNavigateLab}
                          />
                        )}
                      </React.Fragment>
                    );
                  }

                  if (block.type === 'exercises') {
                    return (
                      <ExerciseGroup
                        key={`${currentItem.id}-exercises-${idx}`}
                        lessonId={currentItem.id}
                        items={block.items}
                      />
                    );
                  }

                  if (block.type === 'quiz') {
                    return (
                      <QuizCard
                        key={`${currentItem.id}-quiz-${idx}`}
                        question={block.question}
                        answer={block.answer}
                      />
                    );
                  }

                  if (block.type === 'flowchart') {
                    return (
                      <div
                        key={idx}
                        className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-[#060A13]/80 p-5 space-y-4"
                      >
                        <div className="text-xs font-mono font-semibold text-sky-600 dark:text-sky-400 uppercase tracking-wider">
                          ⚡ 流程图 · {block.title}
                        </div>
                        <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-3">
                          {block.steps.map((step, sIdx) => (
                            <div
                              key={sIdx}
                              className="relative rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120] p-3.5 space-y-2"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <span className="w-6 h-6 rounded-full bg-sky-500/15 text-sky-600 dark:text-sky-400 font-mono text-xs font-bold flex items-center justify-center border border-sky-500/30">
                                  {sIdx + 1}
                                </span>
                                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                  {step.badge}
                                </span>
                              </div>
                              <div className="font-semibold text-sm text-slate-900 dark:text-white">
                                {step.label}
                              </div>
                              <div className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                                {step.sub}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  }

                  return null;
                })}

                {/* Interactive Lab CTA Banner inside Lesson 5.2 */}
                {currentItem.id === '5.2' && (
                  <div className="rounded-2xl border border-emerald-500/35 bg-gradient-to-r from-sky-500/10 via-emerald-500/10 to-transparent p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="text-sm font-bold text-slate-900 dark:text-white">
                        动手把刚刚学到的「大书柜」拉到 80GB 红线！
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300">
                        在交互实验室里切换 MHA / GQA / DeepSeek MLA，亲眼见证 KV Cache 何时把显卡炸到 OOM。
                      </p>
                    </div>
                    <button
                      onClick={() => onNavigateLab('lab1')}
                      className="shrink-0 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-colors"
                    >
                      <FlaskConical className="w-4 h-4" />
                      <span>打开 KV Cache 模拟器</span>
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            /* Placeholder Unlock Card for Pending Lessons */
            <div className="py-4 sm:py-6">
              <div className="relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-gradient-to-br from-slate-50 via-white to-sky-500/[0.04] dark:from-[#060A13] dark:via-[#0B1120] dark:to-sky-500/[0.06] p-6 sm:p-8 space-y-6">
                <div className="pointer-events-none absolute -top-16 -right-16 w-56 h-56 rounded-full bg-sky-500/10 blur-3xl" />

                {/* Badges Row */}
                <div className="relative flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
                    <span className="px-2.5 py-1 rounded-md bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
                      {currentItem.stage.title}
                    </span>
                    {currentItem.isCore ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/35 font-semibold">
                        <Star className="w-3 h-3 fill-current" />
                        <span>核心主线 · 优先掌握</span>
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-800">
                        专题拓展课
                      </span>
                    )}
                  </div>

                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-800">
                    <Lock className="w-3 h-3" />
                    <span>课程待解锁</span>
                  </span>
                </div>

                {/* Lesson Title */}
                <div className="relative space-y-2">
                  <div className="text-xs font-mono text-slate-400">
                    {currentItem.stage.perspectiveTag} · LESSON {currentItem.id}
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white leading-tight">
                    {currentItem.title}
                  </h1>
                </div>

                {/* One-sentence Core Learning Objective */}
                <div className="relative rounded-xl border border-sky-500/25 bg-sky-500/[0.06] dark:bg-sky-500/10 p-4 sm:p-5 space-y-1.5">
                  <div className="flex items-center gap-2 text-xs font-mono font-semibold text-sky-700 dark:text-sky-300 uppercase tracking-wider">
                    <Target className="w-4 h-4 shrink-0" />
                    <span>本节核心学习目标</span>
                  </div>
                  <p className="text-sm sm:text-base text-slate-700 dark:text-slate-200 leading-relaxed">
                    {currentItem.goal}
                  </p>
                </div>

                {/* Action Strip */}
                <div className="relative pt-2 flex flex-wrap items-center justify-between gap-4 border-t border-slate-200/80 dark:border-slate-800/80">
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    本节图鉴正文正在打磨中，可先阅读已完成挂载的旗舰示例长文或进入实验室互动。
                  </p>
                  <div className="flex flex-wrap items-center gap-2.5">
                    <button
                      onClick={() => handleLessonClick('5.2')}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-sm transition-colors"
                    >
                      <BookOpen className="w-4 h-4" />
                      <span>跳转至已完成示例课（5.2）</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onNavigateLab('lab1')}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-medium border border-slate-200 dark:border-slate-700 hover:border-sky-400/50 text-slate-700 dark:text-slate-200 transition-colors"
                    >
                      <FlaskConical className="w-3.5 h-3.5 text-sky-400" />
                      <span>交互实验室</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Prev / Next Navigation Footer */}
          <footer className="pt-6 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {prevLesson ? (
              <button
                onClick={() => handleLessonClick(prevLesson.id)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-sky-400/50 text-left transition-colors"
              >
                <ArrowLeft className="w-4 h-4 text-slate-400 shrink-0" />
                <div>
                  <div className="text-[11px] font-mono text-slate-400">上一课</div>
                  <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 line-clamp-1">
                    {prevLesson.title}
                  </div>
                </div>
              </button>
            ) : (
              <div />
            )}

            {nextLesson && (
              <button
                onClick={() => handleLessonClick(nextLesson.id)}
                className="flex items-center justify-end gap-3 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-sky-400/50 text-right transition-colors"
              >
                <div>
                  <div className="text-[11px] font-mono text-slate-400">下一课</div>
                  <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 line-clamp-1">
                    {nextLesson.title}
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-sky-400 shrink-0" />
              </button>
            )}
          </footer>
        </article>
      </div>
    </div>
  );
}
