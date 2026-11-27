import React, { useState, useMemo } from 'react';
import {
  ClipboardCheck,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  RotateCcw,
  Tag,
  Calculator,
  Filter,
} from 'lucide-react';
import { SEMI_806_QUESTIONS } from '../../data/semiconductor806Questions';

export default function Semiconductor806QuestionsTab({
  questionMarks,
  onSetQuestionMark,
}) {
  const [categoryFilter, setCategoryFilter] = useState('all'); // 'all' | 'past9' | 'exam2026'
  const [tagFilter, setTagFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'mastered' | 'review' | 'unmarked'
  const [openIds, setOpenIds] = useState({}); // default all collapsed!

  const past9Count = useMemo(
    () => SEMI_806_QUESTIONS.filter((q) => q.category === 'past9').length,
    []
  );
  const exam2026Count = useMemo(
    () => SEMI_806_QUESTIONS.filter((q) => q.category === 'exam2026').length,
    []
  );

  const availableTags = useMemo(() => {
    const base =
      categoryFilter === 'all'
        ? SEMI_806_QUESTIONS
        : SEMI_806_QUESTIONS.filter((q) => q.category === categoryFilter);
    const set = new Set();
    base.forEach((q) => q.tags.forEach((t) => set.add(t)));
    return Array.from(set);
  }, [categoryFilter]);

  const stats = useMemo(() => {
    let mastered = 0;
    let review = 0;
    SEMI_806_QUESTIONS.forEach((q) => {
      if (questionMarks[q.id] === 'mastered') mastered += 1;
      else if (questionMarks[q.id] === 'review') review += 1;
    });
    return {
      mastered,
      review,
      unmarked: SEMI_806_QUESTIONS.length - mastered - review,
    };
  }, [questionMarks]);

  const filteredQuestions = useMemo(() => {
    return SEMI_806_QUESTIONS.filter((q) => {
      if (categoryFilter !== 'all' && q.category !== categoryFilter) return false;
      if (tagFilter !== 'all' && !q.tags.includes(tagFilter)) return false;
      const mark = questionMarks[q.id] || 'unmarked';
      if (statusFilter !== 'all' && mark !== statusFilter) return false;
      return true;
    });
  }, [categoryFilter, tagFilter, statusFilter, questionMarks]);

  const handleCategoryChange = (cat) => {
    setCategoryFilter(cat);
    setTagFilter('all');
  };

  const toggleOpen = (id) => {
    setOpenIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const setAllOpen = (expand) => {
    const next = {};
    filteredQuestions.forEach((q) => {
      next[q.id] = expand;
    });
    setOpenIds((prev) => ({ ...prev, ...next }));
  };

  return (
    <div className="space-y-6">
      {/* Top Filter & Tracker Console */}
      <section className="rounded-2xl border border-[#D97706]/35 bg-white/95 dark:bg-[#0B1120]/95 p-5 sm:p-6 space-y-4 shadow-sm">
        {/* Primary Category Filter */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => handleCategoryChange('all')}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold border transition-all ${
                categoryFilter === 'all'
                  ? 'bg-[#D97706] text-white border-[#D97706] shadow-sm'
                  : 'bg-slate-50 dark:bg-slate-900/70 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-[#D97706]/50'
              }`}
            >
              全部真题库 ({SEMI_806_QUESTIONS.length})
            </button>

            <button
              type="button"
              onClick={() => handleCategoryChange('past9')}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold border transition-all ${
                categoryFilter === 'past9'
                  ? 'bg-[#D97706] text-white border-[#D97706] shadow-sm'
                  : 'bg-slate-50 dark:bg-slate-900/70 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-[#D97706]/50'
              }`}
            >
              往年 9 道计算题 ({past9Count})
            </button>

            <button
              type="button"
              onClick={() => handleCategoryChange('exam2026')}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold border transition-all ${
                categoryFilter === 'exam2026'
                  ? 'bg-[#D97706] text-white border-[#D97706] shadow-sm'
                  : 'bg-slate-50 dark:bg-slate-900/70 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-[#D97706]/50'
              }`}
            >
              2026 最新初试真题全卷 ({exam2026Count})
            </button>
          </div>

          {/* Status Filter & Collapse All */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-1 p-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/70 text-[11px] font-mono">
              {[
                { id: 'all', label: `全部` },
                { id: 'mastered', label: `已掌握 ${stats.mastered}` },
                { id: 'review', label: `需二刷 ${stats.review}` },
                { id: 'unmarked', label: `未标记 ${stats.unmarked}` },
              ].map((st) => (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => setStatusFilter(st.id)}
                  className={`px-2.5 py-1 rounded-lg transition-colors ${
                    statusFilter === st.id
                      ? 'bg-[#D97706]/15 text-[#B45309] dark:text-amber-300 font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setAllOpen(true)}
              className="px-2.5 py-1.5 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-[#D97706]/50"
            >
              展开本组解析
            </button>
            <button
              type="button"
              onClick={() => setAllOpen(false)}
              className="px-2.5 py-1.5 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-[#D97706]/50"
            >
              折叠全部
            </button>
          </div>
        </div>

        {/* Topic Tag Filter Row */}
        <div className="flex flex-wrap items-center gap-1.5 pt-3 border-t border-slate-200/80 dark:border-slate-800/80">
          <span className="inline-flex items-center gap-1 text-[11px] font-mono text-slate-500 dark:text-slate-400 mr-1">
            <Filter className="w-3 h-3 text-[#D97706]" />
            <span>考点筛选：</span>
          </span>
          <button
            type="button"
            onClick={() => setTagFilter('all')}
            className={`px-2.5 py-0.5 rounded-full text-[11px] font-mono border transition-colors ${
              tagFilter === 'all'
                ? 'bg-[#0D9488] text-white border-[#0D9488]'
                : 'bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-[#0D9488]/50'
            }`}
          >
            全部考点
          </button>
          {availableTags.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => setTagFilter((cur) => (cur === tag ? 'all' : tag))}
              className={`px-2.5 py-0.5 rounded-full text-[11px] font-mono border transition-colors ${
                tagFilter === tag
                  ? 'bg-[#0D9488] text-white border-[#0D9488]'
                  : 'bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-[#0D9488]/50'
              }`}
            >
              #{tag}
            </button>
          ))}
        </div>
      </section>

      {/* Amber-Gold Interactive Question Cards */}
      {filteredQuestions.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#D97706]/40 p-10 text-center space-y-3 bg-white/70 dark:bg-[#0B1120]/70">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            当前筛选条件下暂无题目。
          </p>
          <button
            type="button"
            onClick={() => {
              setCategoryFilter('all');
              setTagFilter('all');
              setStatusFilter('all');
            }}
            className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-[#D97706] text-white"
          >
            重置全部筛选
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredQuestions.map((q) => {
            const isOpen = Boolean(openIds[q.id]);
            const mark = questionMarks[q.id] || null;

            return (
              <article
                key={q.id}
                className={`rounded-2xl border-2 p-5 sm:p-6 space-y-4 shadow-sm transition-colors ${
                  mark === 'review'
                    ? 'border-[#D97706] bg-amber-500/[0.04] dark:bg-[#0B1120]/95'
                    : mark === 'mastered'
                      ? 'border-[#D97706]/45 bg-white/95 dark:bg-[#0B1120]/95'
                      : 'border-[#D97706]/55 bg-white/95 dark:bg-[#0B1120]/95'
                }`}
              >
                {/* Top Card Header: Badges & Mastery/Review Toggles */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-mono font-bold bg-[#D97706]/15 text-[#B45309] dark:text-amber-300 border border-[#D97706]/35">
                      <ClipboardCheck className="w-3.5 h-3.5 text-[#D97706]" />
                      <span>{q.numberLabel}</span>
                    </span>

                    <span className="px-2 py-0.5 rounded-md text-[11px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                      {q.source}
                    </span>

                    {q.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-mono bg-[#D97706]/10 text-[#B45309] dark:text-amber-200 border border-[#D97706]/25"
                      >
                        <Tag className="w-2.5 h-2.5" />
                        <span>{tag}</span>
                      </span>
                    ))}
                  </div>

                  {/* Mark Status: 已掌握 / 需二刷 */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() =>
                        onSetQuestionMark(
                          q.id,
                          mark === 'mastered' ? null : 'mastered'
                        )
                      }
                      aria-pressed={mark === 'mastered'}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-colors ${
                        mark === 'mastered'
                          ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-700 dark:text-emerald-300'
                          : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-emerald-500/50'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>已掌握</span>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        onSetQuestionMark(
                          q.id,
                          mark === 'review' ? null : 'review'
                        )
                      }
                      aria-pressed={mark === 'review'}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-colors ${
                        mark === 'review'
                          ? 'bg-[#D97706] border-[#D97706] text-white'
                          : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-[#D97706]/60'
                      }`}
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>需二刷</span>
                    </button>
                  </div>
                </div>

                {/* Question Title & Prompt */}
                <div className="space-y-2">
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                    {q.title}
                  </h3>
                  <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-900/55 px-4 py-3.5">
                    <p className="text-sm leading-7 text-slate-800 dark:text-slate-200 whitespace-pre-line">
                      {q.question}
                    </p>
                  </div>
                </div>

                {/* Toggle Exam Standard Solution */}
                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={() => toggleOpen(q.id)}
                    aria-expanded={isOpen}
                    className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold border transition-all ${
                      isOpen
                        ? 'bg-[#D97706]/15 border-[#D97706]/50 text-[#B45309] dark:text-amber-200'
                        : 'bg-[#D97706] hover:bg-[#B45309] border-[#D97706] text-white shadow-sm'
                    }`}
                  >
                    <span>
                      {isOpen ? '收起考试标准解析' : '查看考试标准解析'}
                    </span>
                    {isOpen ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>

                  <span className="text-[11px] font-mono text-slate-400">
                    {mark === 'mastered'
                      ? '状态：已掌握 ✓'
                      : mark === 'review'
                        ? '状态：错题/需二刷'
                        : '点击左侧按钮展开标准步骤'}
                  </span>
                </div>

                {/* Collapsible Standard Answer Body */}
                <div
                  className={`grid transition-all duration-300 ease-out ${
                    isOpen
                      ? 'grid-rows-[1fr] opacity-100'
                      : 'grid-rows-[0fr] opacity-0'
                  }`}
                >
                  <div className="overflow-hidden">
                    <div className="rounded-xl border border-[#D97706]/35 bg-[#D97706]/[0.05] dark:bg-[#D97706]/[0.08] p-4 sm:p-5 space-y-3 mt-1">
                      <div className="text-xs font-mono font-bold text-[#B45309] dark:text-amber-300 uppercase tracking-wider">
                        考试标准参考解答
                      </div>

                      {q.solution.map((blk, sIdx) =>
                        blk.type === 'formula' ? (
                          <div
                            key={sIdx}
                            className="rounded-xl border border-[#0D9488]/35 bg-white/95 dark:bg-[#050811] px-4 py-3 space-y-1"
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
                            key={sIdx}
                            className="text-sm leading-7 text-slate-800 dark:text-slate-200 whitespace-pre-line"
                          >
                            {blk.content}
                          </p>
                        )
                      )}
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
