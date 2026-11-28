import React, { useState, useEffect, useMemo } from 'react';
import { X, BookX, Check, Trash2, Star, RotateCcw } from 'lucide-react';
import {
  loadWrongBook,
  removeWrongQuestion,
  saveWrongBook,
  recordDailyActivity,
} from '../utils/activityStore';

export default function WrongQuestionsModal({ isOpen, onClose }) {
  const [items, setItems] = useState(loadWrongBook);
  const [catFilter, setCatFilter] = useState('全部'); // '全部' | 'AI芯片' | '模拟CMOS/校内' | '仅星标'
  const [answers, setAnswers] = useState({});

  useEffect(() => {
    if (isOpen) {
      setItems(loadWrongBook());
      setAnswers({});
    }
    const refresh = () => setItems(loadWrongBook());
    window.addEventListener('silicon-note-wrongbook-updated', refresh);
    return () => window.removeEventListener('silicon-note-wrongbook-updated', refresh);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  const filtered = useMemo(() => {
    return items.filter((it) => {
      if (catFilter === '全部') return true;
      if (catFilter === '仅星标') return Boolean(it.starred);
      return it.category === catFilter;
    });
  }, [items, catFilter]);

  if (!isOpen) return null;

  const handleRetryAnswer = (item, key) => {
    setAnswers((prev) => ({ ...prev, [item.uid]: key }));
    recordDailyActivity(1);
  };

  const handleMasteredRemove = (uid) => {
    removeWrongQuestion(uid);
    setItems(loadWrongBook());
  };

  const handleClearAll = () => {
    saveWrongBook([]);
    setItems([]);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl max-h-[88vh] rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0B1120] shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <BookX className="w-5 h-5 text-amber-500" />
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                全站智能错题本与星标收藏 ({items.length})
              </h3>
              <p className="text-xs text-slate-500">
                自动收录答错或星标的 AI 芯片课与模拟 CMOS 习题，二刷答对即可一键移出
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {items.length > 0 && (
              <button
                type="button"
                onClick={handleClearAll}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-rose-500"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>清空</span>
              </button>
            )}
            <button type="button" onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 flex flex-wrap gap-1.5">
          {['全部', 'AI芯片', '模拟CMOS/校内', '仅星标'].map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCatFilter(cat)}
              className={`px-3 py-1 rounded-lg text-xs font-medium border transition-colors ${
                catFilter === cat
                  ? 'bg-amber-500 text-slate-950 border-amber-400 font-semibold'
                  : 'bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* List */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {filtered.length === 0 ? (
            <div className="py-16 text-center space-y-2">
              <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                错题本空空如也！
              </p>
              <p className="text-xs text-slate-400">
                在学习路线或校内课程中答错习题、或点击题目右上角「★ 收藏」，都会自动收拢到这里供随时二刷。
              </p>
            </div>
          ) : (
            filtered.map((item) => {
              const picked = answers[item.uid];
              const isAnswered = Boolean(picked);
              const isCorrect = picked === item.correctKey;

              return (
                <div
                  key={item.uid}
                  className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 p-4 space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-[11px] font-mono">
                      <span className="px-2 py-0.5 rounded bg-sky-500/12 text-sky-600 dark:text-sky-300 border border-sky-500/25">
                        {item.category}
                      </span>
                      <span className="text-slate-500">第 {item.lessonId} 课</span>
                      {item.starred && (
                        <span className="inline-flex items-center gap-1 text-amber-500">
                          <Star className="w-3 h-3 fill-current" />
                          <span>星标</span>
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleMasteredRemove(item.uid)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-mono bg-emerald-500/12 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/20"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>已掌握 · 移出错题本</span>
                    </button>
                  </div>

                  <p className="text-sm font-medium text-slate-900 dark:text-white leading-relaxed">
                    {item.question}
                  </p>

                  {Array.isArray(item.options) && item.options.length > 0 && (
                    <div className="grid sm:grid-cols-2 gap-2">
                      {item.options.map((opt) => {
                        const sel = picked === opt.key;
                        const right = opt.key === item.correctKey;
                        return (
                          <button
                            key={opt.key}
                            type="button"
                            onClick={() => handleRetryAnswer(item, opt.key)}
                            className={`text-left px-3 py-2 rounded-lg text-xs border transition-all flex items-center gap-2 ${
                              isAnswered
                                ? right
                                  ? 'border-emerald-500 bg-emerald-500/15 text-emerald-700 dark:text-emerald-200 font-semibold'
                                  : sel
                                    ? 'border-rose-500 bg-rose-500/15 text-rose-600 dark:text-rose-200'
                                    : 'border-slate-200/70 dark:border-slate-800 opacity-60'
                                : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/70 hover:border-sky-400'
                            }`}
                          >
                            <span className="font-mono font-bold">{opt.key}.</span>
                            <span className="flex-1">{opt.text}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {isAnswered && (
                    <div className="rounded-lg border border-amber-500/30 bg-amber-500/[0.07] p-3 text-xs space-y-1">
                      <div className="flex items-center justify-between font-mono font-bold">
                        <span className={isCorrect ? 'text-emerald-500' : 'text-rose-500'}>
                          {isCorrect ? '✅ 二刷答对！可点击右上角移出错题本' : `❌ 再巩固一下，正确答案：${item.correctKey}`}
                        </span>
                        {isCorrect && (
                          <button
                            type="button"
                            onClick={() => handleMasteredRemove(item.uid)}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500 text-slate-950 text-[11px]"
                          >
                            <Check className="w-3 h-3" />
                            <span>立即移出</span>
                          </button>
                        )}
                      </div>
                      <p className="text-slate-700 dark:text-slate-200 leading-relaxed">
                        {item.answer}
                      </p>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
