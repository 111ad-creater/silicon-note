import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  BookOpen,
  Calculator,
  ClipboardCheck,
  Sparkles,
} from 'lucide-react';
import {
  SEMI_806_CHAPTERS,
  SEMI_806_TOTAL_TERMS,
} from '../../data/semiconductor806Chapters';
import { SEMI_806_EXAMPLES } from '../../data/semiconductor806Examples';
import { SEMI_806_QUESTIONS } from '../../data/semiconductor806Questions';
import Semiconductor806KnowledgeTab from './Semiconductor806KnowledgeTab';
import Semiconductor806ExamplesTab from './Semiconductor806ExamplesTab';
import Semiconductor806QuestionsTab from './Semiconductor806QuestionsTab';

export const STORAGE_806_CHAPTERS_KEY = 'silicon-note-806-chapters-v1';
const STORAGE_806_TERMS_KEY = 'silicon-note-806-terms-v1';
const STORAGE_806_QUESTION_MARKS_KEY = 'silicon-note-806-question-marks-v1';
const STORAGE_806_MASK_MODE_KEY = 'silicon-note-806-mask-mode-v1';

function loadJsonArray(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function loadQuestionMarks() {
  try {
    const raw = localStorage.getItem(STORAGE_806_QUESTION_MARKS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function loadMaskMode() {
  try {
    const raw = localStorage.getItem(STORAGE_806_MASK_MODE_KEY);
    if (raw === null) return true; // 默认开启抽背遮罩，仅显露名词与 ★ 徽章
    return raw === 'true';
  } catch {
    return true;
  }
}

export default function Semiconductor806View({ onBack, onChapterProgressChange }) {
  const [activeSubTab, setActiveSubTab] = useState('knowledge'); // 'knowledge' | 'examples' | 'questions'
  const [masteredChapters, setMasteredChapters] = useState(() =>
    loadJsonArray(STORAGE_806_CHAPTERS_KEY)
  );
  const [masteredTerms, setMasteredTerms] = useState(() =>
    loadJsonArray(STORAGE_806_TERMS_KEY)
  );
  const [questionMarks, setQuestionMarks] = useState(loadQuestionMarks);
  const [maskMode, setMaskMode] = useState(loadMaskMode);

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_806_CHAPTERS_KEY,
        JSON.stringify(masteredChapters)
      );
    } catch {
      // ignore storage errors
    }
    if (onChapterProgressChange) {
      onChapterProgressChange(masteredChapters);
    }
  }, [masteredChapters, onChapterProgressChange]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_806_TERMS_KEY, JSON.stringify(masteredTerms));
    } catch {
      // ignore storage errors
    }
  }, [masteredTerms]);

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_806_QUESTION_MARKS_KEY,
        JSON.stringify(questionMarks)
      );
    } catch {
      // ignore storage errors
    }
  }, [questionMarks]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_806_MASK_MODE_KEY, String(maskMode));
    } catch {
      // ignore storage errors
    }
  }, [maskMode]);

  const toggleChapterMastered = (chapterId) => {
    setMasteredChapters((prev) =>
      prev.includes(chapterId)
        ? prev.filter((id) => id !== chapterId)
        : [...prev, chapterId]
    );
  };

  const toggleTermMastered = (termId) => {
    setMasteredTerms((prev) =>
      prev.includes(termId)
        ? prev.filter((id) => id !== termId)
        : [...prev, termId]
    );
  };

  const handleSetQuestionMark = (questionId, mark) => {
    setQuestionMarks((prev) => {
      const next = { ...prev };
      if (!mark) {
        delete next[questionId];
      } else {
        next[questionId] = mark;
      }
      return next;
    });
  };

  const totalChapters = SEMI_806_CHAPTERS.length;
  const masteredCount = masteredChapters.length;
  const pct = totalChapters > 0 ? Math.round((masteredCount / totalChapters) * 100) : 0;

  return (
    <div className="py-6 sm:py-8 space-y-6">
      {/* Top Course Header & 3 Sub-Tabs (Teal #0D9488 Theme) */}
      <section className="rounded-2xl border border-[#0D9488]/35 bg-white/95 dark:bg-[#0B1120]/95 p-5 sm:p-6 space-y-5 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-2">
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-[#0F766E] dark:text-teal-300 hover:underline"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>返回校内课程大厅</span>
            </button>

            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
                《806 半导体物理》
              </h1>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-[#0D9488]/15 text-[#0F766E] dark:text-teal-300 border border-[#0D9488]/35">
                <Sparkles className="w-3 h-3" />
                <span>哈工大 806 V2 · 9 组高清物理图谱</span>
              </span>
            </div>
            <p className="text-xs sm:text-[13px] text-slate-600 dark:text-slate-300">
              覆盖第 1~8、10 章背诵体系（9 组精准交互 SVG 图谱 + {SEMI_806_TOTAL_TERMS} 组词条抽背卡）、4 道连续性方程标杆范例、9 道往年计算题全解与 2026 初试真题全卷。
            </p>
          </div>

          {/* Live Mastery Progress Pill */}
          <div className="w-full lg:w-72 shrink-0 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-900/75 p-3.5 space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-600 dark:text-slate-300">
                章节背诵打卡 ({masteredCount}/{totalChapters} 章)
              </span>
              <span className="font-bold text-[#0D9488] dark:text-teal-300">
                {pct}%
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#0D9488] to-emerald-400 transition-all duration-300"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        </div>

        {/* 3 Sub-Tabs */}
        <div
          role="tablist"
          aria-label="806 半导体物理复习视图"
          className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-200/80 dark:border-slate-800/80"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeSubTab === 'knowledge'}
            onClick={() => setActiveSubTab('knowledge')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold border transition-all ${
              activeSubTab === 'knowledge'
                ? 'bg-[#0D9488] text-white border-[#0D9488] shadow-sm'
                : 'bg-slate-50 dark:bg-slate-900/70 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-[#0D9488]/50'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Tab 1：核心知识点（9 章）</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeSubTab === 'examples'}
            onClick={() => setActiveSubTab('examples')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold border transition-all ${
              activeSubTab === 'examples'
                ? 'bg-[#0D9488] text-white border-[#0D9488] shadow-sm'
                : 'bg-slate-50 dark:bg-slate-900/70 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-[#0D9488]/50'
            }`}
          >
            <Calculator className="w-4 h-4" />
            <span>Tab 2：连续性方程精讲例题（{SEMI_806_EXAMPLES.length} 道）</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeSubTab === 'questions'}
            onClick={() => setActiveSubTab('questions')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold border transition-all ${
              activeSubTab === 'questions'
                ? 'bg-[#0D9488] text-white border-[#0D9488] shadow-sm'
                : 'bg-slate-50 dark:bg-slate-900/70 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-[#0D9488]/50'
            }`}
          >
            <ClipboardCheck className="w-4 h-4" />
            <span>Tab 3：真题与计算题库（{SEMI_806_QUESTIONS.length} 题）</span>
          </button>
        </div>
      </section>

      {/* Active Sub-Tab Body */}
      {activeSubTab === 'knowledge' && (
        <Semiconductor806KnowledgeTab
          masteredChapters={masteredChapters}
          onToggleChapterMastered={toggleChapterMastered}
          masteredTerms={masteredTerms}
          onToggleTermMastered={toggleTermMastered}
          maskMode={maskMode}
          onToggleMaskMode={() => setMaskMode((m) => !m)}
        />
      )}

      {activeSubTab === 'examples' && <Semiconductor806ExamplesTab />}

      {activeSubTab === 'questions' && (
        <Semiconductor806QuestionsTab
          questionMarks={questionMarks}
          onSetQuestionMark={handleSetQuestionMark}
        />
      )}
    </div>
  );
}
