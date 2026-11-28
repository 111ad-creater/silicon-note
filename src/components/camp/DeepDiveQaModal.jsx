import React, { useState, useEffect } from 'react';
import {
  X,
  Timer,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  Brain,
  MessageSquare,
} from 'lucide-react';
import { DEEP_DIVE_QA } from '../../data/deepDiveQa';

export default function DeepDiveQaModal({ isOpen, onClose }) {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(60);
  const [timerRunning, setTimerRunning] = useState(true);

  useEffect(() => {
    if (!isOpen) return undefined;
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen || !timerRunning || secondsLeft <= 0) return undefined;
    const id = setInterval(() => {
      setSecondsLeft((s) => Math.max(0, s - 1));
    }, 1000);
    return () => clearInterval(id);
  }, [isOpen, timerRunning, secondsLeft]);

  if (!isOpen) return null;

  const item = DEEP_DIVE_QA[index] || DEEP_DIVE_QA[0];

  const goTo = (nextIdx) => {
    const safe = (nextIdx + DEEP_DIVE_QA.length) % DEEP_DIVE_QA.length;
    setIndex(safe);
    setFlipped(false);
    setSecondsLeft(60);
    setTimerRunning(true);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl max-h-[90vh] rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0B1120] shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-sky-400" />
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                系统架构深度问答演练舱（Deep-Dive Q&A）
              </h3>
              <p className="text-xs font-mono text-slate-500">
                第 {index + 1} / {DEEP_DIVE_QA.length} 题 · {item.topic}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold border ${
                secondsLeft === 0
                  ? 'bg-amber-500/15 text-amber-500 border-amber-500/35'
                  : 'bg-sky-500/10 text-sky-600 dark:text-sky-300 border-sky-500/30'
              }`}
            >
              <Timer className="w-3.5 h-3.5" />
              <span>{secondsLeft}s 思考倒计时</span>
            </span>
            <button
              type="button"
              onClick={() => {
                setSecondsLeft(60);
                setTimerRunning(true);
              }}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-sky-400"
              title="重置 60 秒倒计时"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
          <div className="rounded-2xl border border-sky-500/30 bg-sky-500/[0.06] dark:bg-sky-950/25 p-5 space-y-3">
            <div className="text-xs font-mono font-bold text-sky-600 dark:text-sky-400">
              CORE ARCHITECTURE QUESTION
            </div>
            <p className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-relaxed">
              {item.question}
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  setFlipped((f) => !f);
                  setTimerRunning(false);
                }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-sky-500 hover:bg-sky-400 text-slate-950 transition-colors"
              >
                {flipped ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                <span>{flipped ? '隐藏机制拆解' : '翻转查看核心机制拆解 & 2 轮追问'}</span>
              </button>
            </div>
          </div>

          {flipped && (
            <div className="space-y-4">
              <div className="rounded-xl border border-emerald-500/35 bg-emerald-500/[0.06] p-4 sm:p-5 space-y-2">
                <div className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  底层物理 / 架构机制拆解
                </div>
                <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
                  {item.mechanism}
                </p>
              </div>

              <div className="space-y-3">
                <div className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>2 轮深度延伸追问与破局思路</span>
                </div>
                {item.followUps.map((fu, i) => (
                  <div
                    key={i}
                    className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 p-4 space-y-1.5"
                  >
                    <div className="text-xs font-bold text-slate-900 dark:text-white">{fu.q}</div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      {fu.a}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Nav */}
        <div className="px-5 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 flex items-center justify-between">
          <button
            type="button"
            onClick={() => goTo(index - 1)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:border-sky-400"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>上一题</span>
          </button>

          <div className="flex gap-1">
            {DEEP_DIVE_QA.map((q, i) => (
              <button
                key={q.id}
                type="button"
                onClick={() => goTo(i)}
                className={`w-2.5 h-2.5 rounded-full transition-colors ${
                  i === index ? 'bg-sky-400' : 'bg-slate-300 dark:bg-slate-700'
                }`}
                aria-label={`跳至第 ${i + 1} 题`}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={() => goTo(index + 1)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:border-sky-400"
          >
            <span>下一题</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
