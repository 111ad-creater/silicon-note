import React, { useState, useEffect, useMemo } from 'react';
import { Flame } from 'lucide-react';
import { loadActivityLog, getTodayIso } from '../utils/activityStore';

function getCellColor(count) {
  if (!count || count <= 0) {
    return 'bg-slate-200/80 dark:bg-slate-800/90 border-slate-300/40 dark:border-slate-700/40';
  }
  if (count <= 2) {
    return 'bg-emerald-500/35 border-emerald-500/40';
  }
  if (count <= 5) {
    return 'bg-emerald-500/65 border-emerald-400/50';
  }
  return 'bg-emerald-400 border-emerald-300 shadow-[0_0_6px_rgba(16,185,129,0.45)]';
}

export default function LearningHeatmap({ completedCount = 0 }) {
  const [activityLog, setActivityLog] = useState(loadActivityLog);

  useEffect(() => {
    const refresh = () => setActivityLog(loadActivityLog());
    window.addEventListener('silicon-note-activity-updated', refresh);
    return () => window.removeEventListener('silicon-note-activity-updated', refresh);
  }, []);

  const { weeks, totalActions, activeDays } = useMemo(() => {
    const today = new Date();
    const todayIso = getTodayIso();
    // 26 weeks = 182 days aligned by week columns
    const totalDays = 26 * 7;
    const days = [];
    let actionsSum = 0;
    let activeDaysCount = 0;

    for (let i = totalDays - 1; i >= 0; i--) {
      const dt = new Date(today);
      dt.setDate(today.getDate() - i);
      const y = dt.getFullYear();
      const m = String(dt.getMonth() + 1).padStart(2, '0');
      const d = String(dt.getDate()).padStart(2, '0');
      const iso = `${y}-${m}-${d}`;
      let count = Number(activityLog[iso]) || 0;
      if (iso === todayIso && count === 0 && completedCount > 0) {
        count = 1; // reflect baseline engagement today
      }
      if (count > 0) {
        actionsSum += count;
        activeDaysCount += 1;
      }
      days.push({ iso, count });
    }

    const weekCols = [];
    for (let w = 0; w < 26; w++) {
      weekCols.push(days.slice(w * 7, w * 7 + 7));
    }
    return { weeks: weekCols, totalActions: actionsSum, activeDays: activeDaysCount };
  }, [activityLog, completedCount]);

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-[#0B1120]/90 p-5 sm:p-6 space-y-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-0.5">
          <div className="inline-flex items-center gap-2 text-xs font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
            <Flame className="w-4 h-4" />
            <span>26-WEEK LEARNING HEATMAP · 近半年学习热力图</span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            完成课程、刷题、实验调参或训练营打卡均自动点亮芯片绿格（累计活跃 {activeDays} 天 · {totalActions} 次学习动作）
          </p>
        </div>

        <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-400">
          <span>Less</span>
          <span className="w-3 h-3 rounded-sm bg-slate-200 dark:bg-slate-800" />
          <span className="w-3 h-3 rounded-sm bg-emerald-500/35" />
          <span className="w-3 h-3 rounded-sm bg-emerald-500/65" />
          <span className="w-3 h-3 rounded-sm bg-emerald-400" />
          <span>More</span>
        </div>
      </div>

      <div className="overflow-x-auto pb-1">
        <div className="inline-flex gap-1.5 min-w-max">
          {weeks.map((col, wIdx) => (
            <div key={wIdx} className="flex flex-col gap-1.5">
              {col.map((cell) => (
                <div
                  key={cell.iso}
                  title={`${cell.iso}: ${cell.count} 次学习/刷题/实验活动`}
                  className={`w-3.5 h-3.5 rounded-[3px] border transition-transform hover:scale-125 ${getCellColor(
                    cell.count
                  )}`}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
