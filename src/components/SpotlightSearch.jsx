import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Search,
  X,
  BookOpen,
  BookMarked,
  Rocket,
  AlertOctagon,
  FileText,
  Radio,
  ArrowRight,
} from 'lucide-react';
import { CURRICULUM_STAGES } from '../data/curriculum';
import { GLOSSARY_TERMS } from '../data/glossary';
import { TRAINING_TASKS } from '../data/trainingCamp';
import { INFRA_ERRORS } from '../data/infraErrors';
import { fetchDynamicData } from '../utils/dataLoader';

const TYPE_META = {
  lesson: { label: '课程', icon: BookOpen, color: 'text-sky-500' },
  glossary: { label: '术语', icon: BookMarked, color: 'text-emerald-500' },
  camp: { label: '实战', icon: Rocket, color: 'text-indigo-400' },
  error: { label: '报错', icon: AlertOctagon, color: 'text-rose-500' },
  paper: { label: '论文', icon: FileText, color: 'text-emerald-400' },
  bench: { label: '日记', icon: FileText, color: 'text-sky-400' },
  radar: { label: 'AI雷达', icon: Radio, color: 'text-amber-500' },
};

export default function SpotlightSearch({ isOpen, onClose, onSelectResult }) {
  const [query, setQuery] = useState('');
  const [activeIdx, setActiveIdx] = useState(0);
  const [dynamicItems, setDynamicItems] = useState({ papers: [], bench: [], radar: [] });
  const inputRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    setQuery('');
    setActiveIdx(0);
    setTimeout(() => inputRef.current?.focus(), 30);

    Promise.all([
      fetchDynamicData('read-papers.json', []),
      fetchDynamicData('bench-logs.json', []),
      fetchDynamicData('ai-radar.json', { items: [] }),
    ]).then(([papers, bench, radar]) => {
      setDynamicItems({
        papers: Array.isArray(papers) ? papers : [],
        bench: Array.isArray(bench) ? bench : [],
        radar: Array.isArray(radar?.items) ? radar.items : [],
      });
    });
  }, [isOpen]);

  const allEntries = useMemo(() => {
    const entries = [];
    CURRICULUM_STAGES.forEach((stage) => {
      stage.lessons.forEach((l) => {
        entries.push({
          type: 'lesson',
          id: `lesson-${l.id}`,
          title: l.title,
          sub: `${stage.title} · ${l.goal || ''}`,
          payload: { page: 'docs', lessonId: l.id },
        });
      });
    });
    GLOSSARY_TERMS.forEach((g) => {
      entries.push({
        type: 'glossary',
        id: `glossary-${g.id}`,
        title: `${g.term} — ${g.fullName}`,
        sub: g.plainDesc,
        payload: { page: 'glossary' },
      });
    });
    TRAINING_TASKS.forEach((t) => {
      entries.push({
        type: 'camp',
        id: `camp-${t.id}`,
        title: `${t.shortName} · ${t.title}`,
        sub: t.goal,
        payload: { page: 'benchmarks', tab: 'roadmap', taskId: t.id },
      });
    });
    INFRA_ERRORS.forEach((err) => {
      entries.push({
        type: 'error',
        id: err.id,
        title: err.keyword,
        sub: err.rootCause,
        payload: { page: 'benchmarks', tab: 'cheatsheet' },
      });
    });
    dynamicItems.bench.forEach((b) => {
      entries.push({
        type: 'bench',
        id: `bench-${b.id}`,
        title: b.title,
        sub: `${b.lab_id || ''} · ${b.subtitle || ''}`,
        payload: { page: 'benchmarks', tab: 'benchmarks' },
      });
    });
    dynamicItems.papers.forEach((p) => {
      entries.push({
        type: 'paper',
        id: `paper-${p.id}`,
        title: `${p.title_zh} (${p.venue})`,
        sub: `${p.title_en} · ${p.core_bottleneck}`,
        payload: { page: 'benchmarks', tab: 'papers' },
      });
    });
    dynamicItems.radar.forEach((r) => {
      entries.push({
        type: 'radar',
        id: `radar-${r.id}`,
        title: r.title_zh,
        sub: r.summary_zh,
        payload: { page: 'radar' },
      });
    });
    return entries;
  }, [dynamicItems]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return allEntries.slice(0, 12);
    return allEntries
      .filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          (e.sub || '').toLowerCase().includes(q)
      )
      .slice(0, 18);
  }, [allEntries, query]);

  useEffect(() => {
    setActiveIdx(0);
  }, [query]);

  if (!isOpen) return null;

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx((i) => (results.length ? (i + 1) % results.length : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx((i) => (results.length ? (i - 1 + results.length) % results.length : 0));
    } else if (e.key === 'Enter' && results[activeIdx]) {
      e.preventDefault();
      onSelectResult(results[activeIdx].payload);
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 p-4 bg-slate-950/75 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0B1120] shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-200 dark:border-slate-800">
          <Search className="w-4 h-4 text-sky-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="全局模糊搜索：课程、术语、实战、报错、日记、论文、AI 雷达..."
            className="flex-1 bg-transparent text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none"
          />
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-500">
            ESC
          </kbd>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-[60vh] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/70">
          {results.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500">
              未找到匹配「{query}」的内容
            </div>
          ) : (
            results.map((item, idx) => {
              const meta = TYPE_META[item.type] || TYPE_META.lesson;
              const Icon = meta.icon;
              const selected = idx === activeIdx;
              return (
                <button
                  key={item.id}
                  type="button"
                  onMouseEnter={() => setActiveIdx(idx)}
                  onClick={() => {
                    onSelectResult(item.payload);
                    onClose();
                  }}
                  className={`w-full text-left px-4 py-3 flex items-center justify-between gap-3 transition-colors ${
                    selected ? 'bg-sky-500/12' : 'hover:bg-slate-50 dark:hover:bg-slate-900/60'
                  }`}
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <Icon className={`w-4 h-4 shrink-0 mt-0.5 ${meta.color}`} />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-300 shrink-0">
                          {meta.label}
                        </span>
                        <span className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white truncate">
                          {item.title}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                        {item.sub}
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                </button>
              );
            })
          )}
        </div>

        {/* Footer Hints */}
        <div className="px-4 py-2 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 flex items-center justify-between text-[11px] font-mono text-slate-400">
          <span>↑↓ 方向键选择 · Enter 直达</span>
          <span>共索引 {allEntries.length} 条全站知识</span>
        </div>
      </div>
    </div>
  );
}
