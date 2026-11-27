import React from 'react';
import {
  FlaskConical,
  HardDrive,
  Cpu,
  Microscope,
  Activity,
  Layers,
  Flame,
  Clock,
  BookOpen,
  Zap,
  Thermometer,
} from 'lucide-react';
import { LAB_TABS } from '../data/labCatalog';
import Lab1KvCache from '../components/labs/Lab1KvCache';
import Lab2GpuTpu from '../components/labs/Lab2GpuTpu';
import Lab3PrecisionQuant from '../components/labs/Lab3PrecisionQuant';
import Lab4Roofline from '../components/labs/Lab4Roofline';
import Lab5VllmPaged from '../components/labs/Lab5VllmPaged';
import Lab6TrainMemory from '../components/labs/Lab6TrainMemory';
import Lab7NsightTimeline from '../components/labs/Lab7NsightTimeline';
import Lab8NpuAdapter from '../components/labs/Lab8NpuAdapter';
import Lab9ArchDvfs from '../components/labs/Lab9ArchDvfs';

const LAB_ICONS = {
  lab1: HardDrive,
  lab2: Cpu,
  lab3: Microscope,
  lab4: Activity,
  lab5: Layers,
  lab6: Flame,
  lab7: Clock,
  lab8: Zap,
  lab9: Thermometer,
};

export default function LabPage({
  activeLab = 'lab1',
  onSelectLab,
  preset = null,
  presetNonce = 0,
  onOpenLesson,
}) {
  const currentTab = LAB_TABS.find((t) => t.id === activeLab) || LAB_TABS[0];

  return (
    <div className="py-6 sm:py-8 space-y-6">
      {/* Lab Center Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 text-xs font-mono text-emerald-600 dark:text-emerald-400">
            <FlaskConical className="w-4 h-4" />
            <span>9-IN-1 INTERACTIVE VISUALIZATION LAB · 交互式可视化实验中心</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            {currentTab.number} · {currentTab.title}
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {currentTab.desc}
          </p>
        </div>

        {/* Linked Curriculum Lessons Quick Chips */}
        {currentTab.linkedLessons && currentTab.linkedLessons.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-mono text-slate-400 flex items-center gap-1">
              <BookOpen className="w-3.5 h-3.5" />
              <span>联动课程：</span>
            </span>
            {currentTab.linkedLessons.map((lid) => (
              <button
                key={lid}
                onClick={() => onOpenLesson && onOpenLesson(lid)}
                className="px-2.5 py-1 rounded-lg text-xs font-mono font-semibold border border-indigo-500/30 bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 hover:bg-indigo-500/20 transition-colors"
                title={`返回第 ${lid} 课正文`}
              >
                第 {lid} 课 ↗
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 9-in-1 Horizontal Lab Tab Switcher */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-[#0B1120]/90 p-2 shadow-sm">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-9 gap-2">
          {LAB_TABS.map((tab) => {
            const Icon = LAB_ICONS[tab.id] || FlaskConical;
            const isActive = tab.id === currentTab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onSelectLab && onSelectLab(tab.id)}
                className={`text-left p-2.5 sm:p-3 rounded-xl border transition-all flex flex-col justify-between gap-1.5 ${
                  isActive
                    ? 'border-sky-400 bg-sky-500/12 dark:bg-sky-500/15 shadow-sm'
                    : 'border-transparent hover:border-slate-200 dark:hover:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/60'
                }`}
              >
                <div className="flex items-center justify-between gap-1.5">
                  <span
                    className={`inline-flex items-center gap-1 text-[11px] font-mono font-bold ${
                      isActive ? 'text-sky-600 dark:text-sky-300' : 'text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    <span>{tab.number}</span>
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                    {tab.moduleTag}
                  </span>
                </div>
                <div
                  className={`text-xs font-bold leading-snug ${
                    isActive
                      ? 'text-slate-900 dark:text-white'
                      : 'text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {tab.shortTitle}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Sandbox Content */}
      <div>
        {currentTab.id === 'lab1' && (
          <Lab1KvCache preset={preset} presetNonce={presetNonce} />
        )}
        {currentTab.id === 'lab2' && (
          <Lab2GpuTpu preset={preset} presetNonce={presetNonce} />
        )}
        {currentTab.id === 'lab3' && (
          <Lab3PrecisionQuant preset={preset} presetNonce={presetNonce} />
        )}
        {currentTab.id === 'lab4' && (
          <Lab4Roofline preset={preset} presetNonce={presetNonce} />
        )}
        {currentTab.id === 'lab5' && (
          <Lab5VllmPaged preset={preset} presetNonce={presetNonce} />
        )}
        {currentTab.id === 'lab6' && (
          <Lab6TrainMemory preset={preset} presetNonce={presetNonce} />
        )}
        {currentTab.id === 'lab7' && (
          <Lab7NsightTimeline preset={preset} presetNonce={presetNonce} />
        )}
        {currentTab.id === 'lab8' && (
          <Lab8NpuAdapter preset={preset} presetNonce={presetNonce} />
        )}
        {currentTab.id === 'lab9' && (
          <Lab9ArchDvfs preset={preset} presetNonce={presetNonce} />
        )}
      </div>
    </div>
  );
}
