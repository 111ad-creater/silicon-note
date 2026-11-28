import React, { useState, useMemo } from 'react';
import {
  AlertOctagon,
  Search,
  X,
  Copy,
  Check,
  BookOpen,
  Terminal,
} from 'lucide-react';
import { INFRA_ERRORS } from '../../data/infraErrors';
import { copyTextToClipboard } from '../CodeBlock';

export default function ErrorDecoder({ onOpenLesson, initialQuery = '' }) {
  const [query, setQuery] = useState(initialQuery);
  const [catFilter, setCatFilter] = useState('全部');
  const [copiedKey, setCopiedKey] = useState(null);

  const categories = useMemo(
    () => ['全部', ...Array.from(new Set(INFRA_ERRORS.map((e) => e.category)))],
    []
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return INFRA_ERRORS.filter((e) => {
      if (catFilter !== '全部' && e.category !== catFilter) return false;
      if (!q) return true;
      return (
        e.keyword.toLowerCase().includes(q) ||
        e.rootCause.toLowerCase().includes(q) ||
        e.category.toLowerCase().includes(q) ||
        e.commands.some((c) => c.toLowerCase().includes(q))
      );
    });
  }, [query, catFilter]);

  const handleCopy = async (key, text) => {
    const ok = await copyTextToClipboard(text);
    if (ok) {
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 1800);
    }
  };

  return (
    <div className="rounded-2xl border border-rose-500/30 bg-white dark:bg-[#0B1120]/95 p-5 sm:p-6 space-y-5 shadow-sm">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 text-xs font-mono text-rose-600 dark:text-rose-400 font-semibold">
            <AlertOctagon className="w-4 h-4" />
            <span>ERROR DECODER · 15 大 AI Infra 高频报错极速诊断台</span>
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
            输入红字报错关键词，瞬间定位底层物理原因与 3 条黄金排查命令
          </h3>
        </div>

        <div className="relative w-full lg:w-80">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜报错（如 OOM、NCCL、NaN、Thermal、Fallback）..."
            className="w-full pl-8 pr-7 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-rose-400"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex flex-wrap gap-1.5">
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setCatFilter(cat)}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
              catFilter === cat
                ? 'bg-rose-500 text-white border-rose-400 font-semibold'
                : 'bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-rose-400/50'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Results Grid */}
      <div className="grid md:grid-cols-2 gap-4">
        {filtered.map((err) => (
          <div
            key={err.id}
            className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-[#060A13]/85 p-4 space-y-3 flex flex-col justify-between"
          >
            <div className="space-y-2.5">
              <div className="flex items-start justify-between gap-2">
                <div className="text-xs sm:text-sm font-mono font-bold text-rose-600 dark:text-rose-400 leading-snug">
                  {err.keyword}
                </div>
                <span className="shrink-0 px-2 py-0.5 rounded text-[10px] font-mono bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  {err.category}
                </span>
              </div>

              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                <strong className="text-slate-900 dark:text-white">底层物理原因：</strong>
                {err.rootCause}
              </p>

              <div className="rounded-lg bg-[#050811] border border-slate-800 p-2.5 space-y-1.5">
                <div className="flex items-center justify-between text-[10px] font-mono text-emerald-400">
                  <span className="inline-flex items-center gap-1">
                    <Terminal className="w-3 h-3" />
                    <span>3 条黄金排查命令</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(err.id, err.commands.join('\n'))}
                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-800 text-slate-200 hover:bg-slate-700"
                  >
                    {copiedKey === err.id ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span>已复制</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3 text-sky-400" />
                        <span>复制全部</span>
                      </>
                    )}
                  </button>
                </div>
                <pre className="text-[11px] font-mono text-slate-200 overflow-x-auto whitespace-pre-wrap leading-relaxed">
                  {err.commands.join('\n')}
                </pre>
              </div>
            </div>

            {err.lessonId && (
              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={() => onOpenLesson && onOpenLesson(err.lessonId)}
                  className="inline-flex items-center gap-1 text-[11px] font-mono font-semibold text-indigo-600 dark:text-indigo-300 hover:underline"
                >
                  <BookOpen className="w-3 h-3" />
                  <span>关联第 {err.lessonId} 课精读 ↗</span>
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
