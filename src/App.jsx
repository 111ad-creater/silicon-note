import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import DocsPage from './pages/DocsPage';
import LabPage from './pages/LabPage';
import BenchmarksPage from './pages/BenchmarksPage';
import GlossaryPage from './pages/GlossaryPage';
import CampusPage from './pages/CampusPage';
import AiRadarPage from './pages/AiRadarPage';
import PortfolioView from './components/PortfolioView';
import SpotlightSearch from './components/SpotlightSearch';
import FormulaQuickRefModal from './components/FormulaQuickRefModal';
import WrongQuestionsModal from './components/WrongQuestionsModal';
import DataBackupModal from './components/DataBackupModal';
import { CURRICULUM_STAGES } from './data/curriculum';
import { loadWrongBook, recordDailyActivity } from './utils/activityStore';
import {
  normalizeLabId,
  parseInitialRouteFromUrl,
  syncLabUrl,
} from './data/labCatalog';

const STORAGE_THEME_KEY = 'silicon-note-theme';
const STORAGE_PROGRESS_KEY = 'silicon-note-completed-lessons-v3';

const ALL_POPULATED_LESSON_IDS = CURRICULUM_STAGES.flatMap((stage) =>
  stage.lessons.filter((l) => l.blocks && l.blocks.length > 0).map((l) => l.id)
);

export default function App() {
  const [initialRoute] = useState(() => parseInitialRouteFromUrl());
  const [activePage, setActivePage] = useState(initialRoute.page || 'home');
  const [activeLessonId, setActiveLessonId] = useState(initialRoute.lessonId || '1.1');
  const [activeLab, setActiveLab] = useState(initialRoute.activeLab || 'lab1');
  const [labPreset, setLabPreset] = useState(initialRoute.preset || null);
  const [labPresetNonce, setLabPresetNonce] = useState(initialRoute.preset ? 1 : 0);

  const [portfolioMode, setPortfolioMode] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [quickRefOpen, setQuickRefOpen] = useState(false);
  const [wrongBookOpen, setWrongBookOpen] = useState(false);
  const [backupOpen, setBackupOpen] = useState(false);
  const [wrongCount, setWrongCount] = useState(() => loadWrongBook().length);
  const [benchmarksInitTab, setBenchmarksInitTab] = useState(null);
  const [benchmarksTabNonce, setBenchmarksTabNonce] = useState(0);

  const [isDark, setIsDark] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_THEME_KEY);
      return saved ? saved === 'dark' : true;
    } catch {
      return true;
    }
  });

  const [completedLessons, setCompletedLessons] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_PROGRESS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
      return ALL_POPULATED_LESSON_IDS;
    } catch {
      return ALL_POPULATED_LESSON_IDS;
    }
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    try {
      localStorage.setItem(STORAGE_THEME_KEY, isDark ? 'dark' : 'light');
    } catch {
      // ignore storage errors
    }
  }, [isDark]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_PROGRESS_KEY, JSON.stringify(completedLessons));
    } catch {
      // ignore storage errors
    }
  }, [completedLessons]);

  useEffect(() => {
    syncLabUrl(activePage, activeLab, labPreset);
  }, [activePage, activeLab, labPreset]);

  useEffect(() => {
    const refreshWrong = () => setWrongCount(loadWrongBook().length);
    window.addEventListener('silicon-note-wrongbook-updated', refreshWrong);

    const onKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen((v) => !v);
      } else if (
        e.key === '?' &&
        e.shiftKey &&
        !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName || '')
      ) {
        e.preventDefault();
        setQuickRefOpen((v) => !v);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('silicon-note-wrongbook-updated', refreshWrong);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  const handleNavigate = (pageId) => {
    setPortfolioMode(false);
    setActivePage(pageId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenLab = useCallback((labId = 'lab1', preset = null) => {
    setPortfolioMode(false);
    const targetLab = typeof labId === 'string' ? normalizeLabId(labId) : 'lab1';
    setActiveLab(targetLab);
    setLabPreset(preset && typeof preset === 'object' ? preset : null);
    setLabPresetNonce((n) => n + 1);
    setActivePage('lab');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleSendToChipLadder = useCallback(
    (modelConfigPayload) => {
      handleOpenLab('lab10', modelConfigPayload);
    },
    [handleOpenLab]
  );

  const handleSpotlightSelect = useCallback((payload) => {
    if (!payload) return;
    setPortfolioMode(false);
    if (payload.page === 'docs' && payload.lessonId) {
      setActiveLessonId(payload.lessonId);
      setActivePage('docs');
    } else if (payload.page === 'benchmarks') {
      if (payload.tab) {
        setBenchmarksInitTab(payload.tab);
        setBenchmarksTabNonce((n) => n + 1);
      }
      setActivePage('benchmarks');
    } else if (payload.page) {
      setActivePage(payload.page);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleSelectLabTab = useCallback((labId) => {
    setActiveLab(normalizeLabId(labId));
    setLabPreset(null);
  }, []);

  const handleStartLessonOne = () => {
    setActiveLessonId('1.1');
    setActivePage('docs');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenStage = (stage, preferredLessonId) => {
    if (preferredLessonId) {
      setActiveLessonId(preferredLessonId);
    } else if (stage.lessons && stage.lessons.length > 0) {
      setActiveLessonId(stage.lessons[0].id);
    }
    setActivePage('docs');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenLesson = (lessonId) => {
    setActiveLessonId(lessonId);
    setActivePage('docs');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleToggleComplete = (lessonId) => {
    setCompletedLessons((prev) => {
      const adding = !prev.includes(lessonId);
      if (adding) recordDailyActivity(2);
      return adding ? [...prev, lessonId] : prev.filter((id) => id !== lessonId);
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-tech-grid">
      <Navbar
        activePage={activePage}
        onNavigate={handleNavigate}
        isDark={isDark}
        onToggleTheme={() => setIsDark((d) => !d)}
        portfolioMode={portfolioMode}
        onTogglePortfolio={setPortfolioMode}
        onOpenSearch={() => setSearchOpen(true)}
        onOpenQuickRef={() => setQuickRefOpen(true)}
        onOpenWrongBook={() => setWrongBookOpen(true)}
        wrongCount={wrongCount}
        onOpenBackup={() => setBackupOpen(true)}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8">
        {portfolioMode ? (
          <PortfolioView
            completedLessons={completedLessons}
            onOpenLab={(labId) => handleOpenLab(labId)}
            onNavigate={handleNavigate}
            onExitPortfolio={() => setPortfolioMode(false)}
          />
        ) : (
          <>
            {activePage === 'home' && (
              <HomePage
                completedLessons={completedLessons}
                onStartLessonOne={handleStartLessonOne}
                onOpenStage={handleOpenStage}
                onOpenLesson={handleOpenLesson}
                onNavigate={handleNavigate}
              />
            )}

            {activePage === 'docs' && (
              <DocsPage
                activeLessonId={activeLessonId}
                onSelectLesson={setActiveLessonId}
                completedLessons={completedLessons}
                onToggleComplete={handleToggleComplete}
                onNavigateLab={handleOpenLab}
              />
            )}

            {activePage === 'lab' && (
              <LabPage
                activeLab={activeLab}
                onSelectLab={handleSelectLabTab}
                preset={labPreset}
                presetNonce={labPresetNonce}
                onOpenLesson={handleOpenLesson}
              />
            )}

            {activePage === 'benchmarks' && (
              <BenchmarksPage
                onOpenLesson={handleOpenLesson}
                requestedTab={benchmarksInitTab}
                requestedTabNonce={benchmarksTabNonce}
              />
            )}

            {activePage === 'glossary' && <GlossaryPage />}

            {activePage === 'radar' && (
              <AiRadarPage onSendToChipLadder={handleSendToChipLadder} />
            )}

            {activePage === 'campus' && <CampusPage />}
          </>
        )}
      </main>

      <SpotlightSearch
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        onSelectResult={handleSpotlightSelect}
      />
      <FormulaQuickRefModal
        isOpen={quickRefOpen}
        onClose={() => setQuickRefOpen(false)}
      />
      <WrongQuestionsModal
        isOpen={wrongBookOpen}
        onClose={() => setWrongBookOpen(false)}
      />
      <DataBackupModal
        isOpen={backupOpen}
        onClose={() => setBackupOpen(false)}
      />

      <footer className="print:hidden border-t border-slate-200/80 dark:border-slate-800/80 bg-white/60 dark:bg-[#060A13]/80 py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2 font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>SiliconNote · AI 芯片与系统直觉图鉴</span>
          </div>
          <div className="font-mono text-[11px]">
            用算账直觉看懂 GPU/TPU 架构、Roofline 与大模型推理瓶颈
          </div>
        </div>
      </footer>
    </div>
  );
}
