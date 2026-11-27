import React, { useState } from 'react';
import {
  ClipboardCheck,
  ChevronDown,
  ChevronUp,
  Check,
  X,
  RotateCcw,
} from 'lucide-react';

function CampusQuizCard({ quiz }) {
  const [selectedKey, setSelectedKey] = useState(null);
  const [isOpen, setIsOpen] = useState(false);

  const hasOptions = Array.isArray(quiz.options) && quiz.options.length > 0;
  const isAnswered = selectedKey !== null;
  const isCorrect = isAnswered && selectedKey === quiz.correctKey;

  const handleSelectOption = (optKey) => {
    setSelectedKey(optKey);
    setIsOpen(true);
  };

  const handleReset = () => {
    setSelectedKey(null);
    setIsOpen(false);
  };

  const selectedLabel =
    selectedKey === 'T' ? '正确' : selectedKey === 'F' ? '错误' : selectedKey;

  return (
    <div className="rounded-xl border border-[#D97706]/35 bg-white/95 dark:bg-[#0B1120]/90 p-4 sm:p-5 space-y-3 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-mono font-semibold bg-[#D97706]/12 text-[#B45309] dark:text-amber-300 border border-[#D97706]/30">
            自测题 {quiz.index} · {quiz.tag}
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
              <span>
                {isCorrect ? '回答正确' : `已选 ${selectedLabel} · 请看解析`}
              </span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {isAnswered && (
            <button
              type="button"
              onClick={handleReset}
              title="重做本题"
              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              <span>重做</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => setIsOpen((v) => !v)}
            aria-expanded={isOpen}
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium border transition-colors ${
              isOpen
                ? 'bg-[#D97706]/15 border-[#D97706]/45 text-[#B45309] dark:text-amber-200'
                : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-[#D97706]/60 hover:text-[#B45309] dark:hover:text-amber-300'
            }`}
          >
            <span>{isOpen ? '收起参考解答' : '查看参考解答'}</span>
            {isOpen ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>

      <p className="text-[14.5px] leading-7 font-medium text-slate-900 dark:text-slate-100">
        {quiz.question}
      </p>

      {hasOptions && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-0.5">
          {quiz.options.map((opt) => {
            const isSelected = selectedKey === opt.key;
            const isRightOption = opt.key === quiz.correctKey;

            let btnStyle =
              'border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-900/60 text-slate-700 dark:text-slate-200 hover:border-[#D97706]/60 hover:bg-[#D97706]/[0.06]';

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
                {quiz.kind === 'choice' && (
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
                <span className="flex-1 leading-snug">{opt.text}</span>
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
          <div className="rounded-lg border border-[#D97706]/30 bg-[#D97706]/[0.06] dark:bg-[#D97706]/10 p-3.5 space-y-1.5">
            <div className="text-[11px] font-mono font-semibold text-[#B45309] dark:text-amber-300">
              参考答案与解析
            </div>
            <p className="text-sm leading-7 text-slate-700 dark:text-slate-200 whitespace-pre-line font-sans">
              {quiz.answer}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CampusQuizSection({ lessonId, quizzes }) {
  if (!quizzes || quizzes.length === 0) return null;

  return (
    <section
      aria-label="随堂期末自测题"
      className="rounded-2xl border border-[#D97706]/35 border-l-4 border-l-[#D97706] bg-[#D97706]/[0.04] dark:bg-[#D97706]/[0.07] p-5 sm:p-6 space-y-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs font-mono font-semibold text-[#B45309] dark:text-amber-400 uppercase tracking-wider">
          <ClipboardCheck className="w-4 h-4 text-[#D97706] shrink-0" />
          <span>随堂期末自测题 · EXAM SELF-CHECK</span>
        </div>
        <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-[#D97706]/12 text-[#B45309] dark:text-amber-300 border border-[#D97706]/30">
          每课 {quizzes.length} 道 · 点击作答或展开解析
        </span>
      </div>

      <div className="space-y-3.5">
        {quizzes.map((quiz) => (
          <CampusQuizCard key={`${lessonId}-quiz-${quiz.index}`} quiz={quiz} />
        ))}
      </div>
    </section>
  );
}
