import React, { useState, useMemo } from 'react';
import { Search, BookMarked, Lightbulb, Cpu, X } from 'lucide-react';
import { GLOSSARY_TERMS, GLOSSARY_CATEGORIES } from '../data/glossary';

function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function highlightMatch(text, query) {
  const q = query.trim();
  if (!q || !text) return text;
  const regex = new RegExp(`(${escapeRegExp(q)})`, 'gi');
  const parts = String(text).split(regex);
  return parts.map((part, i) =>
    part.toLowerCase() === q.toLowerCase() ? (
      <mark
        key={i}
        className="px-0.5 rounded bg-amber-300/60 dark:bg-amber-400/30 text-slate-950 dark:text-amber-200 font-semibold"
      >
        {part}
      </mark>
    ) : (
      part
    )
  );
}

export default function GlossaryPage() {
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('全部');

  const filteredTerms = useMemo(() => {
    const q = query.trim().toLowerCase();
    return GLOSSARY_TERMS.filter((item) => {
      const catValue = item.filterCategory || item.category;
      const matchCat = activeCategory === '全部' || catValue === activeCategory;
      if (!matchCat) return false;
      if (!q) return true;
      return (
        item.term.toLowerCase().includes(q) ||
        item.fullName.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        item.plainDesc.toLowerCase().includes(q) ||
        item.analogy.toLowerCase().includes(q) ||
        item.spec.toLowerCase().includes(q)
      );
    });
  }, [query, activeCategory]);

  return (
    <div className="py-6 sm:py-8 space-y-8">
      {/* Header & Search Bar */}
      <div className="space-y-5">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 text-xs font-mono text-emerald-600 dark:text-emerald-400">
            <BookMarked className="w-4 h-4" />
            <span>GLOSSARY · {GLOSSARY_TERMS.length} HIGH-FREQUENCY TERMS</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            AI 芯片与系统术语词典
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            英文缩写不再劝退：每个术语都配齐英文全称、大白话翻译与一个真实生活类比
          </p>
        </div>

        {/* Search + Category Controls */}
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          <div className="relative flex-1 max-w-xl">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="搜索中英文术语（如 Golden Model、MXFP4、Rollout、Boundary Tax、HBM）..."
              className="w-full pl-10 pr-9 py-2.5 rounded-xl text-sm border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120] text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20 transition-all"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                aria-label="清空搜索"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-1.5">
            {GLOSSARY_CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                  activeCategory === cat
                    ? 'bg-sky-500 text-slate-950 border-sky-400 font-semibold'
                    : 'bg-white dark:bg-[#0B1120] text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-sky-400/50'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results Count */}
      <div className="text-xs font-mono text-slate-500 dark:text-slate-400">
        共找到 {filteredTerms.length} / {GLOSSARY_TERMS.length} 个术语卡片
      </div>

      {/* Glossary Card Grid */}
      {filteredTerms.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 p-12 text-center space-y-2">
          <p className="text-base font-semibold text-slate-700 dark:text-slate-300">
            没有匹配到「{query}」相关术语
          </p>
          <p className="text-xs text-slate-500">试试搜 HBM、SRAM、KV Cache 或切换分类为“全部”</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-5">
          {filteredTerms.map((item) => {
            const isSky = item.badgeColor === 'sky';
            return (
              <div
                key={item.id}
                className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120]/90 hover:border-sky-400/50 p-5 sm:p-6 flex flex-col justify-between gap-4 transition-all hover:shadow-lg"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="text-xl font-extrabold font-mono tracking-tight text-slate-900 dark:text-white">
                        {highlightMatch(item.term, query)}
                      </h2>
                      <p className="text-xs font-mono text-sky-600 dark:text-sky-400 mt-0.5">
                        {highlightMatch(item.fullName, query)}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 px-2.5 py-1 rounded-full text-[11px] font-medium border ${
                        isSky
                          ? 'bg-sky-500/10 text-sky-600 dark:text-sky-300 border-sky-500/25'
                          : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 border-emerald-500/25'
                      }`}
                    >
                      {item.category}
                    </span>
                  </div>

                  {/* One-sentence plain explanation */}
                  <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
                    {highlightMatch(item.plainDesc, query)}
                  </p>

                  {/* Analogy Box */}
                  <div className="rounded-xl bg-slate-50 dark:bg-[#060A13]/90 border border-slate-200/80 dark:border-slate-800/90 p-3.5 flex items-start gap-2.5">
                    <Lightbulb className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      <span className="font-semibold text-slate-800 dark:text-slate-100">直觉 / 场景：</span>
                      {highlightMatch(item.analogy, query)}
                    </p>
                  </div>
                </div>

                {/* Spec Footer */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center gap-2 text-[11px] font-mono text-slate-500 dark:text-slate-400">
                  <Cpu className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>{highlightMatch(item.spec, query)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
