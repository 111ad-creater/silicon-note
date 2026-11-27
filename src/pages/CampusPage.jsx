import React, { useState, useMemo, useEffect } from 'react';
import {
  GraduationCap,
  Lock,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  BookOpenCheck,
  FileSpreadsheet,
  ListTree,
  ChevronDown,
  ChevronRight,
  Check,
  Search,
  X,
  Lightbulb,
  Calculator,
  AlertTriangle,
  Star,
  Table2,
  CheckCircle2,
} from 'lucide-react';
import { CAMPUS_COURSES } from '../data/campusCourses';
import CampusQuizSection from '../components/campus/CampusQuizSection';
import CampusCheatsheetView from '../components/campus/CampusCheatsheetView';
import AnalogSchematic from '../components/AnalogSchematics.tsx';
import Semiconductor806View, {
  STORAGE_806_CHAPTERS_KEY,
} from '../components/campus/Semiconductor806View';

const STORAGE_CAMPUS_PROGRESS_KEY = 'silicon-note-campus-progress-v1';

function loadCampusProgress() {
  try {
    const raw = localStorage.getItem(STORAGE_CAMPUS_PROGRESS_KEY);
    if (!raw) return { 'analog-cmos': [] };
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') return parsed;
    return { 'analog-cmos': [] };
  } catch {
    return { 'analog-cmos': [] };
  }
}

export default function CampusPage() {
  const [selectedCourseId, setSelectedCourseId] = useState(null);
  const [activeSubTab, setActiveSubTab] = useState('lessons'); // 'lessons' | 'cheatsheet'
  const [activeLessonId, setActiveLessonId] = useState('1.1');
  const [lockedNotice, setLockedNotice] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileTocOpen, setMobileTocOpen] = useState(false);

  const [progressByCourse, setProgressByCourse] = useState(loadCampusProgress);
  const [semi806Mastered, setSemi806Mastered] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_806_CHAPTERS_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  const analogCourse = useMemo(
    () => CAMPUS_COURSES.find((c) => c.id === 'analog-cmos'),
    []
  );

  const [expandedStages, setExpandedStages] = useState(() => {
    const init = {};
    (analogCourse?.stages || []).forEach((s) => {
      init[s.id] = true;
    });
    return init;
  });

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_CAMPUS_PROGRESS_KEY,
        JSON.stringify(progressByCourse)
      );
    } catch {
      // ignore storage errors
    }
  }, [progressByCourse]);

  const activeCourse = useMemo(
    () => CAMPUS_COURSES.find((c) => c.id === selectedCourseId) || null,
    [selectedCourseId]
  );

  const stages = activeCourse?.stages || [];

  const flatLessons = useMemo(
    () =>
      stages.flatMap((stage) =>
        stage.lessons.map((lesson) => ({ ...lesson, stage }))
      ),
    [stages]
  );

  const filteredStages = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return stages;
    return stages
      .map((stage) => {
        const stageMatch =
          stage.title.toLowerCase().includes(q) ||
          stage.chapterRef.toLowerCase().includes(q);
        const matchedLessons = stageMatch
          ? stage.lessons
          : stage.lessons.filter((l) => {
              const formulaText = (l.formulas || [])
                .map((f) => `${f.label} ${f.expr}`)
                .join(' ');
              const quizText = (l.quizzes || [])
                .map((qz) => `${qz.question} ${qz.answer}`)
                .join(' ');
              return (
                l.title.toLowerCase().includes(q) ||
                l.id.toLowerCase().includes(q) ||
                (l.intuition || '').toLowerCase().includes(q) ||
                (l.pitfall || '').toLowerCase().includes(q) ||
                formulaText.toLowerCase().includes(q) ||
                quizText.toLowerCase().includes(q)
              );
            });
        return { ...stage, lessons: matchedLessons };
      })
      .filter((s) => s.lessons.length > 0);
  }, [stages, searchQuery]);

  // Ensure active lesson stage is expanded when jumping between lessons
  useEffect(() => {
    if (!stages.length) return;
    const ownerStage = stages.find((s) =>
      s.lessons.some((l) => l.id === activeLessonId)
    );
    if (ownerStage) {
      setExpandedStages((prev) =>
        prev[ownerStage.id] ? prev : { ...prev, [ownerStage.id]: true }
      );
    }
  }, [activeLessonId, stages]);

  const masteredForCourse = useCallbackMastered(
    progressByCourse,
    activeCourse?.id || 'analog-cmos'
  );

  const toggleLessonMastered = (courseId, lessonId) => {
    setProgressByCourse((prev) => {
      const current = Array.isArray(prev[courseId]) ? prev[courseId] : [];
      const exists = current.includes(lessonId);
      const updated = exists
        ? current.filter((id) => id !== lessonId)
        : [...current, lessonId];
      return { ...prev, [courseId]: updated };
    });
  };

  const handleCardClick = (course) => {
    if (course.status === 'available') {
      setLockedNotice(null);
      setSelectedCourseId(course.id);
      setActiveSubTab('lessons');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      setLockedNotice(
        course.comingSoonMessage || `${course.title} 即将上线，敬请期待！`
      );
    }
  };

  const handleQuickJumpStage = (stage) => {
    if (!analogCourse) return;
    setLockedNotice(null);
    setSelectedCourseId(analogCourse.id);
    setActiveSubTab('lessons');
    if (stage.lessons && stage.lessons.length > 0) {
      setActiveLessonId(stage.lessons[0].id);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLessonClick = (lessonId) => {
    setActiveLessonId(lessonId);
    setMobileTocOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleStage = (stageId) => {
    setExpandedStages((prev) => ({ ...prev, [stageId]: !prev[stageId] }));
  };

  // =========================================================================
  // VIEW 1: 校内课程大厅 (Campus Course Hub)
  // =========================================================================
  if (!activeCourse) {
    const analogMastered = progressByCourse['analog-cmos'] || [];
    const analogTotal = analogCourse?.lessonCount || 12;
    const analogPct =
      analogTotal > 0 ? Math.round((analogMastered.length / analogTotal) * 100) : 0;

    return (
      <div className="py-8 sm:py-12 space-y-10">
        {/* Campus Hero Header */}
        <section className="relative overflow-hidden rounded-2xl border border-[#8B5CF6]/25 bg-white/90 dark:bg-[#0B1120]/90 p-6 sm:p-8 shadow-sm">
          <div className="pointer-events-none absolute -top-24 -right-16 w-72 h-72 rounded-full bg-[#8B5CF6]/15 blur-3xl" />
          <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono border border-[#8B5CF6]/35 bg-[#8B5CF6]/10 text-[#7C3AED] dark:text-[#C4B5FD]">
                <GraduationCap className="w-3.5 h-3.5" />
                <span>CAMPUS HUB · 校内课程与期末保过中心</span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                校内课程（Campus）
              </h1>
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                面向微电子 / IC 本科核心专业课与考研备考的直觉化速通讲义。与主线 AI 芯片课程独立并行，专为考前突击、公式秒杀与随堂自测打造。
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 shrink-0">
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/70 px-4 py-3 text-center">
                <div className="text-lg sm:text-xl font-mono font-bold text-[#8B5CF6] dark:text-[#A78BFA]">
                  {CAMPUS_COURSES.filter((c) => c.status === 'available').length} / {CAMPUS_COURSES.length}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  已上线课程
                </div>
              </div>
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/70 px-4 py-3 text-center">
                <div className="text-lg sm:text-xl font-mono font-bold text-slate-900 dark:text-white">
                  {analogMastered.length}/{analogTotal}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  模拟 CMOS 进度
                </div>
              </div>
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/70 px-4 py-3 text-center">
                <div className="text-lg sm:text-xl font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  24 题
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  期末交互自测
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Locked Course Notice Toast */}
        {lockedNotice && (
          <div
            role="status"
            className="flex items-center justify-between gap-3 rounded-xl border border-[#8B5CF6]/40 bg-[#8B5CF6]/10 px-4 py-3 text-sm text-[#6D28D9] dark:text-[#DDD6FE]"
          >
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-4 h-4 text-[#8B5CF6] shrink-0" />
              <span className="font-medium">即将上线：{lockedNotice}</span>
            </div>
            <button
              type="button"
              onClick={() => setLockedNotice(null)}
              aria-label="关闭提示"
              className="p-1 rounded-lg hover:bg-[#8B5CF6]/15 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Scalable Multi-Course Card Grid */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="w-1.5 h-5 rounded-full bg-[#8B5CF6]" />
              <span>校内课程大厅 · 全部课程</span>
            </h2>
            <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
              可扩展多课程网格架构
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {CAMPUS_COURSES.map((course) => {
              const isAvailable = course.status === 'available';
              const isTeal = course.accent === 'teal';
              const courseMastered =
                course.id === 'semiconductor-physics-806'
                  ? semi806Mastered
                  : progressByCourse[course.id] || [];
              const pct =
                isAvailable && course.lessonCount > 0
                  ? Math.round((courseMastered.length / course.lessonCount) * 100)
                  : 0;
              const unitLabel = course.progressUnit || '课';

              return (
                <button
                  key={course.id}
                  type="button"
                  onClick={() => handleCardClick(course)}
                  className={`group text-left rounded-2xl border p-5 sm:p-6 transition-all flex flex-col justify-between gap-5 ${
                    isAvailable
                      ? isTeal
                        ? 'border-[#0D9488]/45 bg-white dark:bg-[#0B1120]/95 shadow-md hover:-translate-y-1 hover:border-[#0D9488] hover:shadow-[0_0_32px_-10px_rgba(13,148,136,0.4)]'
                        : 'border-[#8B5CF6]/45 bg-white dark:bg-[#0B1120]/95 shadow-md hover:-translate-y-1 hover:border-[#8B5CF6] hover:shadow-[0_0_32px_-10px_rgba(139,92,246,0.4)]'
                      : 'border-slate-200/90 dark:border-slate-800/90 bg-slate-50/80 dark:bg-[#0B1120]/55 opacity-85 hover:opacity-100 hover:border-[#8B5CF6]/35'
                  }`}
                >
                  <div className="space-y-3.5">
                    {/* Top Badge Row */}
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-semibold border ${
                          isAvailable
                            ? isTeal
                              ? 'bg-[#0D9488]/12 text-[#0F766E] dark:text-teal-300 border-[#0D9488]/35'
                              : 'bg-[#8B5CF6]/12 text-[#6D28D9] dark:text-[#C4B5FD] border-[#8B5CF6]/35'
                            : 'bg-slate-200/70 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 border-slate-300/80 dark:border-slate-700'
                        }`}
                      >
                        {isAvailable ? (
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        ) : (
                          <Lock className="w-3 h-3" />
                        )}
                        <span>{course.badge}</span>
                      </span>

                      <span className="text-[11px] font-mono text-slate-400">
                        {isAvailable
                          ? course.countLabel || `${course.stageCount} 阶段 / ${course.lessonCount} 课`
                          : '敬请期待'}
                      </span>
                    </div>

                    {/* Title & Subtitle */}
                    <div className="space-y-1">
                      <h3
                        className={`text-lg font-extrabold text-slate-900 dark:text-white transition-colors ${
                          isTeal
                            ? 'group-hover:text-[#0D9488] dark:group-hover:text-teal-300'
                            : 'group-hover:text-[#7C3AED] dark:group-hover:text-[#C4B5FD]'
                        }`}
                      >
                        {course.title}
                      </h3>
                      <p
                        className={`text-xs font-medium ${
                          isTeal
                            ? 'text-[#0F766E] dark:text-teal-400'
                            : 'text-[#7C3AED] dark:text-[#A78BFA]'
                        }`}
                      >
                        {course.subtitle}
                      </p>
                    </div>

                    <p className="text-xs sm:text-[13px] text-slate-600 dark:text-slate-400 leading-relaxed">
                      {course.description}
                    </p>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1.5">
                      {course.tags.map((tag) => (
                        <span
                          key={tag}
                          className={`px-2 py-0.5 rounded-md text-[11px] font-mono border ${
                            isAvailable
                              ? isTeal
                                ? 'bg-[#0D9488]/10 text-[#0F766E] dark:text-teal-300 border-[#0D9488]/25'
                                : 'bg-[#8B5CF6]/10 text-[#6D28D9] dark:text-[#DDD6FE] border-[#8B5CF6]/25'
                              : 'bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-800'
                          }`}
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Bottom Progress / CTA */}
                  {isAvailable ? (
                    <div className="space-y-2.5 pt-3 border-t border-slate-200/80 dark:border-slate-800/80">
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="text-slate-500 dark:text-slate-400">
                          {isTeal ? '背诵进度' : '通关进度'} ({courseMastered.length}/{course.lessonCount} {unitLabel})
                        </span>
                        <span
                          className={`font-bold ${
                            isTeal
                              ? 'text-[#0F766E] dark:text-teal-300'
                              : 'text-[#7C3AED] dark:text-[#A78BFA]'
                          }`}
                        >
                          {pct}%
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            isTeal
                              ? 'bg-gradient-to-r from-[#0D9488] to-emerald-400'
                              : 'bg-gradient-to-r from-[#8B5CF6] to-fuchsia-400'
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <div
                        className={`flex items-center justify-between text-xs font-semibold pt-1 ${
                          isTeal
                            ? 'text-[#0F766E] dark:text-teal-300'
                            : 'text-[#7C3AED] dark:text-[#C4B5FD]'
                        }`}
                      >
                        <span>{course.ctaLabel || '进入课程与积木速查表'}</span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  ) : (
                    <div className="pt-3 border-t border-slate-200/70 dark:border-slate-800/70 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                      <span>点击查看上线状态</span>
                      <span className="font-mono text-[11px]">即将上线</span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </section>

        {/* Quick 5-Stage Overview of Analog CMOS */}
        {analogCourse && (
          <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-[#0B1120]/75 p-5 sm:p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="text-[11px] font-mono uppercase tracking-wider text-[#8B5CF6] dark:text-[#A78BFA]">
                  QUICK JUMP · 《模拟 CMOS 集成电路设计》5 阶段导览
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                  点击任意阶段直达对应保过核心课（已掌握 {analogPct}%）
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedCourseId('analog-cmos');
                  setActiveSubTab('cheatsheet');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border border-[#8B5CF6]/40 bg-[#8B5CF6]/10 text-[#6D28D9] dark:text-[#C4B5FD] hover:bg-[#8B5CF6]/20 transition-colors"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>直达考前 A4 积木速查表</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {analogCourse.stages.map((stage) => {
                const doneCount = stage.lessons.filter((l) =>
                  analogMastered.includes(l.id)
                ).length;
                return (
                  <button
                    key={stage.id}
                    type="button"
                    onClick={() => handleQuickJumpStage(stage)}
                    className="text-left rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 p-3.5 hover:border-[#8B5CF6]/60 hover:bg-[#8B5CF6]/[0.05] transition-all space-y-2"
                  >
                    <div className="flex items-center justify-between text-[11px] font-mono text-[#7C3AED] dark:text-[#A78BFA]">
                      <span>{stage.chapterRef}</span>
                      <span>
                        {doneCount}/{stage.lessons.length}
                      </span>
                    </div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white leading-snug">
                      {stage.title}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      权重：{stage.examWeight}
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        )}
      </div>
    );
  }

  // =========================================================================
  // VIEW 1.5: 《806 半导体物理》考研复习模块 (3 Sub-Tabs, Teal #0D9488)
  // =========================================================================
  if (activeCourse.id === 'semiconductor-physics-806') {
    return (
      <Semiconductor806View
        onBack={() => {
          setSelectedCourseId(null);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onChapterProgressChange={setSemi806Mastered}
      />
    );
  }

  // =========================================================================
  // VIEW 2: 《模拟 CMOS》课程详情页 (2 Sub-Tabs)
  // =========================================================================
  const totalLessons = flatLessons.length;
  const masteredCount = masteredForCourse.length;
  const masteryPct =
    totalLessons > 0 ? Math.round((masteredCount / totalLessons) * 100) : 0;

  const foundIdx = flatLessons.findIndex((item) => item.id === activeLessonId);
  const currentIdx = foundIdx >= 0 ? foundIdx : 0;
  const currentLesson = flatLessons[currentIdx] || flatLessons[0];
  const prevLesson = currentIdx > 0 ? flatLessons[currentIdx - 1] : null;
  const nextLesson =
    currentIdx < flatLessons.length - 1 ? flatLessons[currentIdx + 1] : null;
  const isCurrentMastered = currentLesson
    ? masteredForCourse.includes(currentLesson.id)
    : false;
  const isSearching = searchQuery.trim().length > 0;

  return (
    <div className="py-6 sm:py-8 space-y-6">
      {/* Top Course Header & Sub-Tabs (Hidden on Print) */}
      <section className="print:hidden rounded-2xl border border-[#8B5CF6]/30 bg-white/95 dark:bg-[#0B1120]/95 p-5 sm:p-6 space-y-5 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => {
                setSelectedCourseId(null);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-[#7C3AED] dark:text-[#A78BFA] hover:underline"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>返回校内课程大厅</span>
            </button>

            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
                {activeCourse.title}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-[#8B5CF6]/12 text-[#6D28D9] dark:text-[#C4B5FD] border border-[#8B5CF6]/30">
                {activeCourse.subtitle}
              </span>
            </div>
          </div>

          {/* Live Mastery Progress Pill */}
          <div className="w-full lg:w-72 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-900/75 p-3.5 space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-600 dark:text-slate-300">
                课程通关进度 ({masteredCount}/{totalLessons} 课)
              </span>
              <span className="font-bold text-[#7C3AED] dark:text-[#A78BFA]">
                {masteryPct}%
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#8B5CF6] to-fuchsia-400 transition-all duration-300"
                style={{ width: `${masteryPct}%` }}
              />
            </div>
          </div>
        </div>

        {/* 2 Sub-Tabs */}
        <div
          role="tablist"
          aria-label="模拟 CMOS 课程子视图"
          className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-200/80 dark:border-slate-800/80"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeSubTab === 'lessons'}
            onClick={() => setActiveSubTab('lessons')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold border transition-all ${
              activeSubTab === 'lessons'
                ? 'bg-[#8B5CF6] text-white border-[#8B5CF6] shadow-sm'
                : 'bg-slate-50 dark:bg-slate-900/70 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-[#8B5CF6]/50'
            }`}
          >
            <BookOpenCheck className="w-4 h-4" />
            <span>Tab 1：12 节核心通关课</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeSubTab === 'cheatsheet'}
            onClick={() => setActiveSubTab('cheatsheet')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold border transition-all ${
              activeSubTab === 'cheatsheet'
                ? 'bg-[#8B5CF6] text-white border-[#8B5CF6] shadow-sm'
                : 'bg-slate-50 dark:bg-slate-900/70 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-[#8B5CF6]/50'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Tab 2：考前 A4 积木速查表 (Cheatsheet)</span>
          </button>
        </div>
      </section>

      {/* Sub-Tab 2: Cheatsheet */}
      {activeSubTab === 'cheatsheet' ? (
        <CampusCheatsheetView />
      ) : (
        /* Sub-Tab 1: 12 Core Lessons (Left TOC + Right Reader) */
        <div>
          {/* Mobile TOC Toggle Bar */}
          <div className="lg:hidden mb-4">
            <button
              type="button"
              onClick={() => setMobileTocOpen((v) => !v)}
              className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120] text-sm font-medium text-slate-800 dark:text-slate-200"
            >
              <span className="flex items-center gap-2">
                <ListTree className="w-4 h-4 text-[#8B5CF6]" />
                <span>
                  课程目录 ({masteredCount}/{totalLessons} 已掌握 · {masteryPct}%)
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
            {/* Left Collapsible Directory Tree */}
            <aside
              className={`lg:col-span-4 xl:col-span-3 lg:sticky lg:top-24 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120]/90 p-3 space-y-2.5 ${
                mobileTocOpen ? 'block' : 'hidden lg:block'
              }`}
            >
              <div className="px-2.5 py-2 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
                <span className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {stages.length} 阶段 · {totalLessons} 课
                </span>
                <span className="text-xs font-mono font-semibold text-[#7C3AED] dark:text-[#A78BFA]">
                  {masteredCount}/{totalLessons} ({masteryPct}%)
                </span>
              </div>

              {/* Search box */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="搜索章节、公式或关键词..."
                  className="w-full pl-8 pr-7 py-1.5 rounded-lg text-xs border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:border-[#8B5CF6] transition-colors"
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

              {/* Tree */}
              <div className="space-y-1.5 max-h-[68vh] overflow-y-auto pr-1">
                {filteredStages.length === 0 ? (
                  <div className="py-8 px-3 text-center text-xs text-slate-500 dark:text-slate-400 space-y-2">
                    <p>未找到匹配 “{searchQuery}” 的课程</p>
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="text-[#7C3AED] dark:text-[#A78BFA] hover:underline"
                    >
                      重置搜索
                    </button>
                  </div>
                ) : (
                  filteredStages.map((stage) => {
                    const isOpen = isSearching
                      ? true
                      : Boolean(expandedStages[stage.id]);
                    const stageDone = stage.lessons.filter((l) =>
                      masteredForCourse.includes(l.id)
                    ).length;

                    return (
                      <div key={stage.id} className="rounded-xl overflow-hidden">
                        <button
                          type="button"
                          onClick={() => toggleStage(stage.id)}
                          className="w-full flex items-center justify-between px-2.5 py-2 text-left text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60 rounded-lg transition-colors"
                        >
                          <span className="flex items-center gap-1.5 min-w-0">
                            {isOpen ? (
                              <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            ) : (
                              <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            )}
                            <span className="truncate">{stage.title}</span>
                          </span>
                          <span className="ml-2 font-mono text-[11px] text-slate-400 shrink-0">
                            {stageDone}/{stage.lessons.length}
                          </span>
                        </button>

                        {isOpen && (
                          <div className="mt-1 ml-2.5 pl-2 border-l border-slate-200 dark:border-slate-800 space-y-1">
                            {stage.lessons.map((lesson) => {
                              const active = lesson.id === currentLesson?.id;
                              const done = masteredForCourse.includes(lesson.id);

                              return (
                                <div
                                  key={lesson.id}
                                  className={`flex items-start gap-2 px-2 py-1.5 rounded-lg text-xs transition-all ${
                                    active
                                      ? 'bg-[#8B5CF6]/12 text-[#6D28D9] dark:text-[#C4B5FD] font-medium border border-[#8B5CF6]/35'
                                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200 border border-transparent'
                                  }`}
                                >
                                  {/* Mastery Checkbox */}
                                  <button
                                    type="button"
                                    role="checkbox"
                                    aria-checked={done}
                                    aria-label={`标记 ${lesson.title} 为已掌握`}
                                    title={done ? '取消已掌握标记' : '勾选标记已掌握'}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleLessonMastered(activeCourse.id, lesson.id);
                                    }}
                                    className={`mt-0.5 w-4 h-4 rounded flex items-center justify-center shrink-0 border transition-colors ${
                                      done
                                        ? 'bg-[#8B5CF6] border-[#8B5CF6] text-white'
                                        : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 hover:border-[#8B5CF6]'
                                    }`}
                                  >
                                    {done && <Check className="w-3 h-3 stroke-[3]" />}
                                  </button>

                                  {/* Lesson Title Click Area */}
                                  <button
                                    type="button"
                                    onClick={() => handleLessonClick(lesson.id)}
                                    className="flex-1 text-left leading-snug"
                                  >
                                    <span>{lesson.title}</span>
                                    {lesson.mustExam && (
                                      <span className="ml-1.5 inline-block px-1.5 py-0.2 rounded text-[10px] font-mono bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/25 align-middle">
                                        ★ 必考
                                      </span>
                                    )}
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </aside>

            {/* Right Lesson Content Reader */}
            {currentLesson && (
              <article className="lg:col-span-8 xl:col-span-9 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120]/90 p-6 sm:p-8 lg:p-10 shadow-sm space-y-7">
                {/* Stage Banner */}
                <div className="rounded-xl border border-[#8B5CF6]/25 bg-[#8B5CF6]/[0.05] dark:bg-[#8B5CF6]/10 p-4 space-y-1.5">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
                    <span className="font-bold text-[#6D28D9] dark:text-[#C4B5FD]">
                      {currentLesson.stage.title}
                    </span>
                    <div className="flex flex-wrap items-center gap-2 text-[11px]">
                      <span className="px-2 py-0.5 rounded bg-white/80 dark:bg-slate-900/80 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        {currentLesson.stage.chapterRef}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-amber-500/12 text-amber-700 dark:text-amber-300 border border-amber-500/25">
                        期末权重：{currentLesson.stage.examWeight}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                    通关目标：{currentLesson.stage.goal}
                  </p>
                </div>

                {/* Lesson Header */}
                <header className="space-y-3 border-b border-slate-200 dark:border-slate-800 pb-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
                      <span className="px-2.5 py-1 rounded-md bg-[#8B5CF6]/12 text-[#6D28D9] dark:text-[#C4B5FD] border border-[#8B5CF6]/30">
                        LESSON {currentLesson.id}
                      </span>
                      {currentLesson.mustExam && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 font-semibold">
                          <Star className="w-3 h-3 fill-current" />
                          <span>★ 期末必考</span>
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        toggleLessonMastered(activeCourse.id, currentLesson.id)
                      }
                      className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                        isCurrentMastered
                          ? 'bg-[#8B5CF6]/15 border-[#8B5CF6]/45 text-[#6D28D9] dark:text-[#DDD6FE]'
                          : 'bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-[#8B5CF6]/50'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{isCurrentMastered ? '已掌握 ✓' : '标记为已掌握'}</span>
                    </button>
                  </div>

                  <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white leading-tight">
                    {currentLesson.title}
                  </h2>
                </header>

                {/* 1. 【大白话直觉与物理画面】 */}
                <section className="space-y-2.5">
                  <div className="flex items-center gap-2 text-xs font-mono font-semibold uppercase tracking-wider text-[#7C3AED] dark:text-[#A78BFA]">
                    <Lightbulb className="w-4 h-4 shrink-0" />
                    <span>【大白话直觉与物理画面】</span>
                  </div>
                  <p className="text-[15.5px] leading-7 text-slate-700 dark:text-slate-300">
                    {currentLesson.intuition}
                  </p>
                </section>

                {/* 交互式 SVG 矢量电路原理图 */}
                <AnalogSchematic lessonId={currentLesson.id} />

                {/* 2. 【期末必考公式与“观察法”套路】 */}
                <section className="space-y-3">
                  <div className="flex items-center gap-2 text-xs font-mono font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                    <Calculator className="w-4 h-4 shrink-0" />
                    <span>【期末必考公式与“观察法”套路】</span>
                  </div>
                  <div className="space-y-2.5">
                    {currentLesson.formulas.map((f, fIdx) => (
                      <div
                        key={fIdx}
                        className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-[#060A13]/85 px-4 py-3.5 space-y-1.5"
                      >
                        <div className="text-xs font-semibold text-slate-900 dark:text-white">
                          {f.label}
                        </div>
                        <div className="font-mono text-[13px] sm:text-sm leading-relaxed text-[#5B21B6] dark:text-[#C4B5FD] whitespace-pre-line">
                          {f.expr}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                {/* 3. 【高频考点对比表】 */}
                {currentLesson.table && (
                  <section className="space-y-2.5">
                    <div className="flex items-center gap-2 text-xs font-mono font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      <Table2 className="w-4 h-4 text-[#8B5CF6] shrink-0" />
                      <span>{currentLesson.table.title}</span>
                    </div>
                    <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                      <table className="w-full text-left border-collapse text-sm">
                        <thead>
                          <tr className="bg-[#8B5CF6]/10 dark:bg-[#8B5CF6]/16 border-b-2 border-[#8B5CF6]/35">
                            {currentLesson.table.headers.map((h, hIdx) => (
                              <th
                                key={hIdx}
                                className="py-3 px-4 font-semibold text-violet-950 dark:text-violet-200 whitespace-nowrap"
                              >
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200/80 dark:divide-slate-800/80">
                          {currentLesson.table.rows.map((row, rIdx) => (
                            <tr
                              key={rIdx}
                              className="odd:bg-white dark:odd:bg-transparent even:bg-slate-50/80 dark:even:bg-slate-800/35 hover:bg-[#8B5CF6]/[0.06] dark:hover:bg-[#8B5CF6]/10 transition-colors"
                            >
                              {row.map((cell, cIdx) => (
                                <td
                                  key={cIdx}
                                  className={`py-3 px-4 leading-relaxed ${
                                    cIdx === 0
                                      ? 'font-medium text-slate-900 dark:text-white whitespace-nowrap'
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
                )}

                {/* 4. 【期末保过避坑提示】 (Violet Left Border #8B5CF6) */}
                <section
                  aria-label="期末保过避坑提示"
                  className="rounded-xl border border-[#8B5CF6]/25 border-l-4 border-l-[#8B5CF6] bg-[#8B5CF6]/[0.06] dark:bg-[#8B5CF6]/10 p-4 sm:p-5 space-y-2"
                >
                  <div className="flex items-center gap-2 font-semibold text-sm text-[#6D28D9] dark:text-[#C4B5FD]">
                    <AlertTriangle className="w-4 h-4 text-[#8B5CF6] shrink-0" />
                    <span>期末保过避坑提示</span>
                    <span className="ml-auto text-[10px] font-mono uppercase opacity-75">
                      HIGH-YIELD TIP
                    </span>
                  </div>
                  <p className="text-sm leading-7 text-slate-800 dark:text-slate-200">
                    {currentLesson.pitfall}
                  </p>
                </section>

                {/* 5. 【随堂期末自测题（每课 2 道）】 */}
                <CampusQuizSection
                  lessonId={currentLesson.id}
                  quizzes={currentLesson.quizzes}
                />

                {/* Prev / Next Footer */}
                <footer className="pt-6 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                  {prevLesson ? (
                    <button
                      type="button"
                      onClick={() => handleLessonClick(prevLesson.id)}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-[#8B5CF6]/50 text-left transition-colors"
                    >
                      <ArrowLeft className="w-4 h-4 text-slate-400 shrink-0" />
                      <div>
                        <div className="text-[11px] font-mono text-slate-400">
                          上一课
                        </div>
                        <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 line-clamp-1">
                          {prevLesson.title}
                        </div>
                      </div>
                    </button>
                  ) : (
                    <div />
                  )}

                  {nextLesson && (
                    <button
                      type="button"
                      onClick={() => handleLessonClick(nextLesson.id)}
                      className="flex items-center justify-end gap-3 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-[#8B5CF6]/50 text-right transition-colors"
                    >
                      <div>
                        <div className="text-[11px] font-mono text-slate-400">
                          下一课
                        </div>
                        <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 line-clamp-1">
                          {nextLesson.title}
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-[#8B5CF6] shrink-0" />
                    </button>
                  )}
                </footer>
              </article>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function useCallbackMastered(progressByCourse, courseId) {
  return useMemo(() => {
    const arr = progressByCourse?.[courseId];
    return Array.isArray(arr) ? arr : [];
  }, [progressByCourse, courseId]);
}
