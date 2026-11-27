import React, { useState, useMemo, useEffect } from 'react';
import {
  Search,
  X,
  ListTree,
  ChevronDown,
  ChevronRight,
  Check,
  CheckCircle2,
  Eye,
  EyeOff,
  Star,
  Table2,
  AlertTriangle,
  BookOpen,
  MessageSquareText,
  RotateCcw,
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Compass,
} from 'lucide-react';
import {
  SEMI_806_CHAPTERS,
  SEMI_806_TOTAL_TERMS,
  SEMI_806_TOTAL_SHORT_ANSWERS,
} from '../../data/semiconductor806Chapters';
import Fig1BandStructure from './figures806/Fig1BandStructure';
import Fig3FermiTemp from './figures806/Fig3FermiTemp';
import Fig4Conductivity from './figures806/Fig4Conductivity';
import Fig5Continuity from './figures806/Fig5Continuity';
import Fig6PnJunction from './figures806/Fig6PnJunction';
import Fig7MetalSemi from './figures806/Fig7MetalSemi';
import Fig8MisStructures from './figures806/Fig8MisStructures';
import { FigureZoomBox } from './ZoomableFigureModal';

const CHAPTER_FIGURES = {
  fig1: Fig1BandStructure,
  fig3: Fig3FermiTemp,
  fig4: Fig4Conductivity,
  fig5: Fig5Continuity,
  fig6: Fig6PnJunction,
  fig7: Fig7MetalSemi,
  fig8: Fig8MisStructures,
};

export default function Semiconductor806KnowledgeTab({
  masteredChapters,
  onToggleChapterMastered,
  masteredTerms,
  onToggleTermMastered,
  maskMode,
  onToggleMaskMode,
}) {
  const [activeChapterId, setActiveChapterId] = useState(SEMI_806_CHAPTERS[0].id);
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileTocOpen, setMobileTocOpen] = useState(false);
  const [onlyStarredTerms, setOnlyStarredTerms] = useState(false);

  // Per-term reveal state when maskMode is active
  const [revealedTerms, setRevealedTerms] = useState({});
  // Short-answer accordion expanded state
  const [openShortAnswers, setOpenShortAnswers] = useState(() => {
    const init = {};
    SEMI_806_CHAPTERS.forEach((ch) => {
      ch.shortAnswers.forEach((sa, idx) => {
        init[sa.id] = idx === 0;
      });
    });
    return init;
  });
  // Sidebar collapsible chapters
  const [expandedChapters, setExpandedChapters] = useState(() => {
    const init = {};
    SEMI_806_CHAPTERS.forEach((ch, idx) => {
      init[ch.id] = idx === 0;
    });
    return init;
  });

  const isSearching = searchQuery.trim().length > 0;

  const filteredChapters = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return SEMI_806_CHAPTERS;
    return SEMI_806_CHAPTERS.filter((ch) => {
      const inMeta =
        ch.fullTitle.toLowerCase().includes(q) ||
        ch.goal.toLowerCase().includes(q) ||
        ch.weight.toLowerCase().includes(q);
      const inTerms = ch.terms.some(
        (t) =>
          t.term.toLowerCase().includes(q) ||
          t.definition.toLowerCase().includes(q)
      );
      const inShort = ch.shortAnswers.some(
        (sa) =>
          sa.question.toLowerCase().includes(q) ||
          sa.points.some((p) => p.toLowerCase().includes(q))
      );
      const inTable =
        ch.table.title.toLowerCase().includes(q) ||
        ch.table.rows.some((r) =>
          r.some((cell) => cell.toLowerCase().includes(q))
        );
      const inPitfall = ch.pitfall.content.toLowerCase().includes(q);
      return inMeta || inTerms || inShort || inTable || inPitfall;
    });
  }, [searchQuery]);

  // Keep activeChapterId valid when filtering
  useEffect(() => {
    if (
      filteredChapters.length > 0 &&
      !filteredChapters.some((ch) => ch.id === activeChapterId)
    ) {
      setActiveChapterId(filteredChapters[0].id);
    }
  }, [filteredChapters, activeChapterId]);

  // Auto-expand active chapter in left tree
  useEffect(() => {
    setExpandedChapters((prev) =>
      prev[activeChapterId] ? prev : { ...prev, [activeChapterId]: true }
    );
  }, [activeChapterId]);

  const activeIdx = SEMI_806_CHAPTERS.findIndex((c) => c.id === activeChapterId);
  const currentChapter =
    SEMI_806_CHAPTERS[activeIdx >= 0 ? activeIdx : 0] || SEMI_806_CHAPTERS[0];
  const prevChapter = activeIdx > 0 ? SEMI_806_CHAPTERS[activeIdx - 1] : null;
  const nextChapter =
    activeIdx < SEMI_806_CHAPTERS.length - 1
      ? SEMI_806_CHAPTERS[activeIdx + 1]
      : null;

  const isCurrentChapterMastered = masteredChapters.includes(currentChapter.id);
  const chapterPct = Math.round(
    (masteredChapters.length / SEMI_806_CHAPTERS.length) * 100
  );

  const visibleTerms = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return currentChapter.terms.filter((t) => {
      if (onlyStarredTerms && !t.starred) return false;
      if (!q) return true;
      const chHeaderMatch =
        currentChapter.fullTitle.toLowerCase().includes(q) ||
        currentChapter.goal.toLowerCase().includes(q);
      if (chHeaderMatch) return true;
      return (
        t.term.toLowerCase().includes(q) ||
        t.definition.toLowerCase().includes(q)
      );
    });
  }, [currentChapter, onlyStarredTerms, searchQuery]);

  const handleSelectChapter = (chapterId, sectionAnchor = null) => {
    setActiveChapterId(chapterId);
    setMobileTocOpen(false);
    if (sectionAnchor) {
      setTimeout(() => {
        const el = document.getElementById(sectionAnchor);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 60);
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const toggleTreeExpand = (chapterId) => {
    setExpandedChapters((prev) => ({ ...prev, [chapterId]: !prev[chapterId] }));
  };

  const toggleRevealTerm = (termId) => {
    if (!maskMode) return;
    setRevealedTerms((prev) => ({ ...prev, [termId]: !prev[termId] }));
  };

  const resetCurrentChapterMasks = () => {
    setRevealedTerms((prev) => {
      const next = { ...prev };
      currentChapter.terms.forEach((t) => {
        delete next[t.id];
      });
      return next;
    });
  };

  const toggleShortAnswer = (saId) => {
    setOpenShortAnswers((prev) => ({ ...prev, [saId]: !prev[saId] }));
  };

  const expandAllShortAnswers = (expand) => {
    setOpenShortAnswers((prev) => {
      const next = { ...prev };
      currentChapter.shortAnswers.forEach((sa) => {
        next[sa.id] = expand;
      });
      return next;
    });
  };

  const allShortExpanded = currentChapter.shortAnswers.every(
    (sa) => openShortAnswers[sa.id]
  );

  return (
    <div>
      {/* Mobile TOC Toggle */}
      <div className="lg:hidden mb-4">
        <button
          type="button"
          onClick={() => setMobileTocOpen((v) => !v)}
          className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120] text-sm font-medium text-slate-800 dark:text-slate-200"
        >
          <span className="flex items-center gap-2">
            <ListTree className="w-4 h-4 text-[#0D9488]" />
            <span>
              9 章知识目录 ({masteredChapters.length}/9 章 · {chapterPct}%)
            </span>
          </span>
          {mobileTocOpen ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
        </button>
      </div>

      <div className="grid lg:grid-cols-12 gap-8 items-start">
        {/* Left 9-Chapter Collapsible Directory Tree */}
        <aside
          className={`lg:col-span-4 xl:col-span-3 lg:sticky lg:top-24 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120]/90 p-3.5 space-y-3 ${
            mobileTocOpen ? 'block' : 'hidden lg:block'
          }`}
        >
          {/* Recitation Total Progress Bar */}
          <div className="rounded-xl border border-[#0D9488]/25 bg-[#0D9488]/[0.06] dark:bg-[#0D9488]/10 p-3 space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="font-semibold text-slate-700 dark:text-slate-200">
                背诵总进度 ({masteredChapters.length}/9 章)
              </span>
              <span className="font-bold text-[#0D9488] dark:text-teal-300">
                {chapterPct}%
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#0D9488] to-emerald-400 transition-all duration-300"
                style={{ width: `${chapterPct}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 dark:text-slate-400">
              <span>名词抽背 {masteredTerms.length}/{SEMI_806_TOTAL_TERMS}</span>
              <span>简答 {SEMI_806_TOTAL_SHORT_ANSWERS} 题</span>
            </div>
          </div>

          {/* Real-time Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索章节、名词、简答或考点..."
              className="w-full pl-8 pr-7 py-1.5 rounded-lg text-xs border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:border-[#0D9488] transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label="清空搜索"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* 9-Chapter Collapsible Tree */}
          <div className="space-y-1.5 max-h-[62vh] overflow-y-auto pr-1">
            {filteredChapters.length === 0 ? (
              <div className="py-8 px-3 text-center text-xs text-slate-500 dark:text-slate-400 space-y-2">
                <p>未找到匹配 “{searchQuery}” 的知识点</p>
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="text-[#0D9488] dark:text-teal-300 hover:underline"
                >
                  重置搜索
                </button>
              </div>
            ) : (
              filteredChapters.map((ch) => {
                const isActive = ch.id === currentChapter.id;
                const isOpen = isSearching ? true : Boolean(expandedChapters[ch.id]);
                const done = masteredChapters.includes(ch.id);
                const chTermDoneCount = ch.terms.filter((t) =>
                  masteredTerms.includes(t.id)
                ).length;

                return (
                  <div
                    key={ch.id}
                    className={`rounded-xl border transition-colors ${
                      isActive
                        ? 'border-[#0D9488]/40 bg-[#0D9488]/[0.06] dark:bg-[#0D9488]/10'
                        : 'border-transparent hover:bg-slate-100/70 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 px-2 py-2">
                      {/* Chapter Recitation Checkbox */}
                      <button
                        type="button"
                        role="checkbox"
                        aria-checked={done}
                        aria-label={`标记 ${ch.fullTitle} 为已背诵`}
                        title={done ? '取消本章已背诵打卡' : '打卡标记本章已背诵'}
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleChapterMastered(ch.id);
                        }}
                        className={`w-4 h-4 rounded flex items-center justify-center shrink-0 border transition-colors ${
                          done
                            ? 'bg-[#0D9488] border-[#0D9488] text-white'
                            : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 hover:border-[#0D9488]'
                        }`}
                      >
                        {done && <Check className="w-3 h-3 stroke-[3]" />}
                      </button>

                      {/* Chapter Select Button */}
                      <button
                        type="button"
                        onClick={() => handleSelectChapter(ch.id)}
                        className={`flex-1 min-w-0 text-left text-xs leading-snug ${
                          isActive
                            ? 'font-bold text-[#0F766E] dark:text-teal-300'
                            : 'font-medium text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <span className="truncate block">{ch.fullTitle}</span>
                      </button>

                      {/* Expand / Collapse Sub-tree */}
                      <button
                        type="button"
                        onClick={() => toggleTreeExpand(ch.id)}
                        aria-label={`展开或折叠 ${ch.fullTitle} 子区块`}
                        className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                      >
                        {isOpen ? (
                          <ChevronDown className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronRight className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>

                    {isOpen && (
                      <div className="pb-2 ml-4 pl-2.5 mr-2 border-l border-[#0D9488]/30 space-y-0.5 text-[11px]">
                        {ch.figureId && (
                          <button
                            type="button"
                            onClick={() => handleSelectChapter(ch.id, 'sec-figure')}
                            className="w-full flex items-center justify-between px-2 py-1 rounded text-left text-[#0F766E] dark:text-teal-300 font-medium hover:bg-[#0D9488]/10 transition-colors"
                          >
                            <span>⓪ 核心精准物理图谱</span>
                            <span className="font-mono text-[10px]">SVG</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleSelectChapter(ch.id, 'sec-terms')}
                          className="w-full flex items-center justify-between px-2 py-1 rounded text-left text-slate-600 dark:text-slate-400 hover:bg-[#0D9488]/10 hover:text-[#0F766E] dark:hover:text-teal-300 transition-colors"
                        >
                          <span>① 高频名词抽背卡</span>
                          <span className="font-mono text-[10px]">
                            {chTermDoneCount}/{ch.terms.length}
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSelectChapter(ch.id, 'sec-short')}
                          className="w-full flex items-center justify-between px-2 py-1 rounded text-left text-slate-600 dark:text-slate-400 hover:bg-[#0D9488]/10 hover:text-[#0F766E] dark:hover:text-teal-300 transition-colors"
                        >
                          <span>② 核心简答与论述</span>
                          <span className="font-mono text-[10px]">
                            {ch.shortAnswers.length} 题
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSelectChapter(ch.id, 'sec-table')}
                          className="w-full flex items-center justify-between px-2 py-1 rounded text-left text-slate-600 dark:text-slate-400 hover:bg-[#0D9488]/10 hover:text-[#0F766E] dark:hover:text-teal-300 transition-colors"
                        >
                          <span>③ 高频考点对比表</span>
                          <span className="font-mono text-[10px]">1 表</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSelectChapter(ch.id, 'sec-pitfall')}
                          className="w-full flex items-center justify-between px-2 py-1 rounded text-left text-slate-600 dark:text-slate-400 hover:bg-[#0D9488]/10 hover:text-[#0F766E] dark:hover:text-teal-300 transition-colors"
                        >
                          <span>④ 考前避坑提示</span>
                          <span className="font-mono text-[10px]">Tip</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </aside>

        {/* Right Chapter Content Reader (Strict 4 Blocks) */}
        <article className="lg:col-span-8 xl:col-span-9 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120]/90 p-5 sm:p-8 lg:p-9 shadow-sm space-y-8">
          {/* Chapter Header Banner */}
          <header className="space-y-4 border-b border-slate-200 dark:border-slate-800 pb-6">
            <div className="rounded-xl border border-[#0D9488]/30 bg-[#0D9488]/[0.06] dark:bg-[#0D9488]/10 p-4 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
                <span className="px-2.5 py-0.5 rounded-md bg-[#0D9488]/15 text-[#0F766E] dark:text-teal-300 border border-[#0D9488]/30 font-bold">
                  {currentChapter.chapterLabel} · 806 考研核心知识体系
                </span>
                <span className="px-2.5 py-0.5 rounded-md bg-amber-500/12 text-amber-700 dark:text-amber-300 border border-amber-500/25">
                  考情权重：{currentChapter.weight}
                </span>
              </div>
              <p className="text-xs sm:text-[13px] leading-relaxed text-slate-700 dark:text-slate-200">
                核心目标：{currentChapter.goal}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white leading-tight">
                {currentChapter.fullTitle}
              </h2>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                {/* Global Mask Mode Toggle */}
                <button
                  type="button"
                  onClick={onToggleMaskMode}
                  aria-pressed={maskMode}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                    maskMode
                      ? 'bg-[#0D9488] text-white border-[#0D9488] shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-[#0D9488]/60'
                  }`}
                >
                  {maskMode ? (
                    <>
                      <EyeOff className="w-3.5 h-3.5" />
                      <span>关闭抽背遮罩模式</span>
                    </>
                  ) : (
                    <>
                      <Eye className="w-3.5 h-3.5 text-[#0D9488] dark:text-teal-400" />
                      <span>开启抽背遮罩模式</span>
                    </>
                  )}
                </button>

                {/* Chapter Check-off */}
                <button
                  type="button"
                  onClick={() => onToggleChapterMastered(currentChapter.id)}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                    isCurrentChapterMastered
                      ? 'bg-[#0D9488]/15 border-[#0D9488]/45 text-[#0F766E] dark:text-teal-300'
                      : 'bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-[#0D9488]/50'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{isCurrentChapterMastered ? '本章已背诵 ✓' : '打卡标记已背诵'}</span>
                </button>
              </div>
            </div>
          </header>

          {/* ================================================================= */}
          {/* 区块 ⓪：核心精准物理图谱（V2 SVG 物理公式绘制）                      */}
          {/* ================================================================= */}
          {currentChapter.figureId && CHAPTER_FIGURES[currentChapter.figureId] && (
            <section id="sec-figure" className="space-y-3 scroll-mt-24">
              <div className="flex items-center gap-2">
                <Compass className="w-4 h-4 text-[#0D9488] shrink-0" />
                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                  ⓪ 核心精准物理图谱
                </h3>
              </div>
              <FigureZoomBox title={`${currentChapter.shortTitle} · 核心精准物理图谱`} accent="teal">
                {React.createElement(CHAPTER_FIGURES[currentChapter.figureId])}
              </FigureZoomBox>
            </section>
          )}

          {/* ================================================================= */}
          {/* 区块 ①：高频名词解释抽背卡                                        */}
          {/* ================================================================= */}
          <section id="sec-terms" className="space-y-4 scroll-mt-24">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-[#0D9488] shrink-0" />
                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                  ① 高频名词解释抽背卡（共 {currentChapter.terms.length} 组）
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-mono bg-[#0D9488]/12 text-[#0F766E] dark:text-teal-300 border border-[#0D9488]/30">
                  {maskMode ? '抽背遮罩开启中 · 点击卡片自测' : '全部释义展开中'}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setOnlyStarredTerms((v) => !v)}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                    onlyStarredTerms
                      ? 'bg-amber-500/15 border-amber-500/40 text-amber-700 dark:text-amber-300'
                      : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-amber-500/40'
                  }`}
                >
                  <Star className="w-3 h-3 fill-current" />
                  <span>{onlyStarredTerms ? '已筛选 ★ 高频' : '只看 ★ 高频必背'}</span>
                </button>

                {maskMode && (
                  <button
                    type="button"
                    onClick={resetCurrentChapterMasks}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:border-[#0D9488]/50 transition-colors"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>重新遮盖本章</span>
                  </button>
                )}
              </div>
            </div>

            {visibleTerms.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-700 p-6 text-center text-xs text-slate-500 dark:text-slate-400">
                当前筛选条件下无匹配名词解释。
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {visibleTerms.map((item) => {
                  const isRevealed = !maskMode || Boolean(revealedTerms[item.id]);
                  const isTermMastered = masteredTerms.includes(item.id);

                  return (
                    <div
                      key={item.id}
                      onClick={() => toggleRevealTerm(item.id)}
                      role={maskMode ? 'button' : undefined}
                      tabIndex={maskMode ? 0 : undefined}
                      onKeyDown={(e) => {
                        if (maskMode && (e.key === 'Enter' || e.key === ' ')) {
                          e.preventDefault();
                          toggleRevealTerm(item.id);
                        }
                      }}
                      className={`group rounded-xl border p-4 transition-all flex flex-col justify-between gap-3 ${
                        maskMode ? 'cursor-pointer' : ''
                      } ${
                        isTermMastered
                          ? 'border-[#0D9488]/50 bg-[#0D9488]/[0.05] dark:bg-[#0D9488]/10'
                          : isRevealed
                            ? 'border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 hover:border-[#0D9488]/45'
                            : 'border-[#0D9488]/35 bg-white dark:bg-[#060A13]/85 hover:border-[#0D9488] hover:shadow-sm'
                      }`}
                    >
                      <div className="space-y-2.5">
                        {/* Term Header */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex flex-wrap items-center gap-1.5">
                            {item.starred && (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                                ★ 高频
                              </span>
                            )}
                            {item.is2026 && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-sky-500/15 text-sky-700 dark:text-sky-300 border border-sky-500/30">
                                2026真题
                              </span>
                            )}
                            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                              {item.term}
                            </h4>
                          </div>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onToggleTermMastered(item.id);
                            }}
                            title={isTermMastered ? '取消已背会标记' : '标记为已背会'}
                            className={`shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono border transition-colors ${
                              isTermMastered
                                ? 'bg-[#0D9488] text-white border-[#0D9488]'
                                : 'bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-[#0D9488]/60 hover:text-[#0D9488]'
                            }`}
                          >
                            <Check className="w-2.5 h-2.5" />
                            <span>{isTermMastered ? '已背会' : '记住'}</span>
                          </button>
                        </div>

                        {/* Definition or Masked Cover */}
                        {isRevealed ? (
                          <div className="space-y-1.5">
                            <p className="text-[13.5px] leading-6 text-slate-700 dark:text-slate-300">
                              {item.definition}
                            </p>
                            {maskMode && (
                              <div className="text-[11px] font-mono text-[#0D9488] dark:text-teal-400 opacity-80">
                                点击卡片可重新遮盖
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="rounded-lg border border-dashed border-[#0D9488]/40 bg-[#0D9488]/[0.06] dark:bg-[#0D9488]/10 px-3.5 py-4 flex items-center justify-center gap-2 text-xs font-medium text-[#0F766E] dark:text-teal-300 group-hover:bg-[#0D9488]/12 transition-colors">
                            <Sparkles className="w-3.5 h-3.5 shrink-0" />
                            <span>遮罩自测中 · 点击翻转 / 展开标准定义</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* ================================================================= */}
          {/* 区块 ②：核心简答与论述题（可折叠手风琴面板）                          */}
          {/* ================================================================= */}
          <section id="sec-short" className="space-y-3.5 scroll-mt-24">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <MessageSquareText className="w-4 h-4 text-[#0D9488] shrink-0" />
                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                  ② 核心简答与论述题（共 {currentChapter.shortAnswers.length} 题）
                </h3>
              </div>

              <button
                type="button"
                onClick={() => expandAllShortAnswers(!allShortExpanded)}
                className="text-xs font-medium text-[#0D9488] dark:text-teal-300 hover:underline"
              >
                {allShortExpanded ? '全部收起' : '全部展开'}
              </button>
            </div>

            <div className="space-y-3">
              {currentChapter.shortAnswers.map((sa) => {
                const isOpen = Boolean(openShortAnswers[sa.id]);
                return (
                  <div
                    key={sa.id}
                    className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 overflow-hidden"
                  >
                    <button
                      type="button"
                      onClick={() => toggleShortAnswer(sa.id)}
                      aria-expanded={isOpen}
                      className="w-full flex items-center justify-between gap-3 px-4 py-3.5 text-left hover:bg-[#0D9488]/[0.05] transition-colors"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-md text-xs font-mono font-bold bg-[#0D9488]/15 text-[#0F766E] dark:text-teal-300 border border-[#0D9488]/30 shrink-0">
                          {sa.number}
                        </span>
                        {sa.starred && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                            ★ 高频必背
                          </span>
                        )}
                        {sa.is2026 && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-sky-500/15 text-sky-700 dark:text-sky-300 border border-sky-500/30">
                            2026真题
                          </span>
                        )}
                        <span className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
                          {sa.question}
                        </span>
                      </div>

                      {isOpen ? (
                        <ChevronDown className="w-4 h-4 text-[#0D9488] shrink-0" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                      )}
                    </button>

                    <div
                      className={`grid transition-all duration-300 ease-out ${
                        isOpen
                          ? 'grid-rows-[1fr] opacity-100'
                          : 'grid-rows-[0fr] opacity-0'
                      }`}
                    >
                      <div className="overflow-hidden">
                        <div className="px-4 pb-4 pt-2 border-t border-slate-200/80 dark:border-slate-800/80 space-y-2.5 bg-white/80 dark:bg-[#060A13]/60">
                          {sa.points.map((pt, pIdx) => (
                            <p
                              key={pIdx}
                              className="text-sm leading-7 text-slate-700 dark:text-slate-200 whitespace-pre-line"
                            >
                              {pt}
                            </p>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* ================================================================= */}
          {/* 区块 ③：高频考点对比表（表头高亮 + 斑马纹响应式表格）                */}
          {/* ================================================================= */}
          <section id="sec-table" className="space-y-3 scroll-mt-24">
            <div className="flex items-center gap-2">
              <Table2 className="w-4 h-4 text-[#0D9488] shrink-0" />
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                ③ 高频考点对比表 · {currentChapter.table.title}
              </h3>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="bg-[#0D9488]/12 dark:bg-[#0D9488]/20 border-b-2 border-[#0D9488]/40">
                    {currentChapter.table.headers.map((h, hIdx) => (
                      <th
                        key={hIdx}
                        className="py-3 px-4 font-semibold text-teal-950 dark:text-teal-200 whitespace-nowrap"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/80 dark:divide-slate-800/80">
                  {currentChapter.table.rows.map((row, rIdx) => (
                    <tr
                      key={rIdx}
                      className="odd:bg-white dark:odd:bg-transparent even:bg-slate-50/85 dark:even:bg-slate-800/35 hover:bg-[#0D9488]/[0.06] dark:hover:bg-[#0D9488]/10 transition-colors"
                    >
                      {row.map((cell, cIdx) => (
                        <td
                          key={cIdx}
                          className={`py-3 px-4 leading-relaxed whitespace-pre-line ${
                            cIdx === 0
                              ? 'font-semibold text-slate-900 dark:text-white whitespace-nowrap'
                              : 'text-slate-600 dark:text-slate-300'
                          }`}
                        >
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* ================================================================= */}
          {/* 区块 ④：考前避坑提示（青碧绿 #0D9488 左侧边框 Callout）              */}
          {/* ================================================================= */}
          <section
            id="sec-pitfall"
            aria-label="考前避坑提示"
            className="scroll-mt-24 rounded-xl border border-[#0D9488]/30 border-l-4 border-l-[#0D9488] bg-[#0D9488]/[0.06] dark:bg-[#0D9488]/12 p-4 sm:p-5 space-y-2"
          >
            <div className="flex items-center gap-2 font-semibold text-sm text-[#0F766E] dark:text-teal-300">
              <AlertTriangle className="w-4 h-4 text-[#0D9488] shrink-0" />
              <span>④ {currentChapter.pitfall.label}</span>
              <span className="ml-auto text-[10px] font-mono uppercase opacity-75">
                806 EXAM TIP
              </span>
            </div>
            <p className="text-sm leading-7 text-slate-800 dark:text-slate-200">
              {currentChapter.pitfall.content}
            </p>
          </section>

          {/* Prev / Next Chapter Footer */}
          <footer className="pt-6 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {prevChapter ? (
              <button
                type="button"
                onClick={() => handleSelectChapter(prevChapter.id)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-[#0D9488]/60 text-left transition-colors"
              >
                <ArrowLeft className="w-4 h-4 text-slate-400 shrink-0" />
                <div>
                  <div className="text-[11px] font-mono text-slate-400">上一章</div>
                  <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 line-clamp-1">
                    {prevChapter.fullTitle}
                  </div>
                </div>
              </button>
            ) : (
              <div />
            )}

            {nextChapter && (
              <button
                type="button"
                onClick={() => handleSelectChapter(nextChapter.id)}
                className="flex items-center justify-end gap-3 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-[#0D9488]/60 text-right transition-colors"
              >
                <div>
                  <div className="text-[11px] font-mono text-slate-400">下一章</div>
                  <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 line-clamp-1">
                    {nextChapter.fullTitle}
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-[#0D9488] shrink-0" />
              </button>
            )}
          </footer>
        </article>
      </div>
    </div>
  );
}
