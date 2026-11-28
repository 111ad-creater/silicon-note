import React, { useState } from 'react';
import {
  Cpu,
  Sun,
  Moon,
  Menu,
  X,
  Home,
  BookOpen,
  FlaskConical,
  Activity,
  BookMarked,
  GraduationCap,
  Radio,
  Search,
  Calculator,
  BookX,
  Database,
  Briefcase,
} from 'lucide-react';

const NAV_ITEMS = [
  { id: 'home', label: '首页', icon: Home },
  { id: 'docs', label: '学习路线', icon: BookOpen },
  { id: 'lab', label: '交互实验室', icon: FlaskConical, badge: '10合1' },
  { id: 'benchmarks', label: '实战训练营', icon: Activity },
  { id: 'glossary', label: '术语词典', icon: BookMarked },
  { id: 'radar', label: 'AI 雷达', icon: Radio, accent: 'amber', badge: '16:00' },
  {
    id: 'campus',
    label: '校内课程',
    icon: GraduationCap,
    accent: 'violet',
    badge: 'Campus',
  },
];

export default function Navbar({
  activePage,
  onNavigate,
  isDark,
  onToggleTheme,
  portfolioMode,
  onTogglePortfolio,
  onOpenSearch,
  onOpenQuickRef,
  onOpenWrongBook,
  wrongCount = 0,
  onOpenBackup,
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNav = (pageId) => {
    if (portfolioMode && onTogglePortfolio) {
      onTogglePortfolio(false);
    }
    onNavigate(pageId);
    setMobileMenuOpen(false);
  };

  return (
    <header className="print:hidden sticky top-0 z-50 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-[#060A13]/85 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2">
        {/* Brand Logo */}
        <button
          onClick={() => handleNav('home')}
          className="flex items-center gap-2.5 group text-left focus:outline-none shrink-0"
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-400/20 to-emerald-400/20 border border-sky-400/40 flex items-center justify-center shadow-sm group-hover:shadow-glow-cyber transition-all">
            <Cpu className="w-4 h-4 text-sky-500 dark:text-sky-400" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold tracking-tight text-slate-900 dark:text-white text-sm sm:text-base">
                SiliconNote
              </span>
              <span className="hidden xl:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                v5
              </span>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 hidden xl:block leading-none mt-0.5">
              AI 芯片与系统直觉图鉴
            </p>
          </div>
        </button>

        {/* Desktop Nav */}
        {!portfolioMode && (
          <nav className="hidden lg:flex items-center gap-0.5 bg-slate-100/80 dark:bg-slate-900/70 p-1 rounded-xl border border-slate-200/70 dark:border-slate-800/80">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activePage === item.id;
              const isViolet = item.accent === 'violet';
              const isAmber = item.accent === 'amber';
              return (
                <button
                  key={item.id}
                  onClick={() => handleNav(item.id)}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs xl:text-[13px] font-medium transition-all whitespace-nowrap ${
                    isActive
                      ? isViolet
                        ? 'bg-[#8B5CF6]/15 text-[#7C3AED] dark:text-[#C4B5FD] shadow-sm border border-[#8B5CF6]/45'
                        : isAmber
                          ? 'bg-[#F59E0B]/15 text-amber-700 dark:text-[#F59E0B] shadow-sm border border-[#F59E0B]/45'
                          : 'bg-white dark:bg-slate-800 text-sky-600 dark:text-sky-400 shadow-sm border border-slate-200/80 dark:border-slate-700/80'
                      : isViolet
                        ? 'text-[#7C3AED] dark:text-[#A78BFA] hover:bg-[#8B5CF6]/10 border border-transparent hover:border-[#8B5CF6]/25'
                        : isAmber
                          ? 'text-amber-600 dark:text-[#F59E0B] hover:bg-[#F59E0B]/10 border border-transparent hover:border-[#F59E0B]/25'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/40 dark:hover:bg-slate-800/40'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span
                      className={`hidden xl:inline-block ml-0.5 px-1.5 py-0.2 rounded text-[10px] font-mono border ${
                        isViolet
                          ? 'bg-[#8B5CF6]/15 text-[#7C3AED] dark:text-[#C4B5FD] border-[#8B5CF6]/35'
                          : isAmber
                            ? 'bg-[#F59E0B]/15 text-amber-700 dark:text-[#F59E0B] border-[#F59E0B]/35'
                            : 'bg-sky-500/15 text-sky-600 dark:text-sky-300 border-sky-400/30'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        )}

        {/* Right Utility Controls */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Ctrl+K Search */}
          <button
            type="button"
            onClick={onOpenSearch}
            title="全局搜索 (Ctrl+K)"
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs border border-slate-200 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-900/70 text-slate-600 dark:text-slate-300 hover:border-sky-400/50 transition-colors"
          >
            <Search className="w-3.5 h-3.5 text-sky-500" />
            <kbd className="hidden xl:inline text-[10px] font-mono text-slate-400">Ctrl+K</kbd>
          </button>

          {/* Shift+? QuickRef */}
          <button
            type="button"
            onClick={onOpenQuickRef}
            title="一屏公式速查 & Nsight 波形 (Shift+?)"
            className="hidden sm:inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs border border-slate-200 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-900/70 text-slate-600 dark:text-slate-300 hover:border-emerald-400/50 transition-colors"
          >
            <Calculator className="w-3.5 h-3.5 text-emerald-500" />
          </button>

          {/* Wrong Book */}
          <button
            type="button"
            onClick={onOpenWrongBook}
            title="智能错题本"
            className="relative inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs border border-slate-200 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-900/70 text-slate-600 dark:text-slate-300 hover:border-amber-400/50 transition-colors"
          >
            <BookX className="w-3.5 h-3.5 text-amber-500" />
            {wrongCount > 0 && (
              <span className="px-1 rounded-full bg-amber-500 text-slate-950 font-mono text-[10px] font-bold">
                {wrongCount}
              </span>
            )}
          </button>

          {/* JSON Backup */}
          <button
            type="button"
            onClick={onOpenBackup}
            title="跨设备 JSON 数据备份与恢复"
            className="hidden sm:inline-flex items-center px-2 py-1.5 rounded-lg text-xs border border-slate-200 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-900/70 text-slate-600 dark:text-slate-300 hover:border-sky-400/50 transition-colors"
          >
            <Database className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {/* Portfolio Toggle */}
          <button
            type="button"
            onClick={() => onTogglePortfolio && onTogglePortfolio(!portfolioMode)}
            title="切换作品集总览模式"
            className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
              portfolioMode
                ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                : 'border-slate-200 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-900/70 text-slate-700 dark:text-slate-200 hover:border-emerald-400/50'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span className="hidden md:inline">{portfolioMode ? '退出总览' : '作品集'}</span>
          </button>

          {/* Theme Toggle */}
          <button
            onClick={onToggleTheme}
            aria-label="切换深浅色主题"
            title={isDark ? '切换到浅色模式' : '切换到深色模式'}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-900/70 text-slate-700 dark:text-slate-300 hover:border-sky-400/50 transition-colors"
          >
            {isDark ? (
              <Sun className="w-3.5 h-3.5 text-amber-400" />
            ) : (
              <Moon className="w-3.5 h-3.5 text-sky-600" />
            )}
          </button>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen((v) => !v)}
            aria-label="打开菜单"
            className="lg:hidden p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-900/70 text-slate-700 dark:text-slate-300"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#060A13] px-4 py-3 space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            const isViolet = item.accent === 'violet';
            const isAmber = item.accent === 'amber';
            return (
              <button
                key={item.id}
                onClick={() => handleNav(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? isViolet
                      ? 'bg-[#8B5CF6]/15 text-[#7C3AED] dark:text-[#C4B5FD] border border-[#8B5CF6]/40'
                      : isAmber
                        ? 'bg-[#F59E0B]/15 text-amber-700 dark:text-[#F59E0B] border border-[#F59E0B]/40'
                        : 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-400/30'
                    : isViolet
                      ? 'text-[#7C3AED] dark:text-[#A78BFA] hover:bg-[#8B5CF6]/10'
                      : isAmber
                        ? 'text-amber-600 dark:text-[#F59E0B] hover:bg-[#F59E0B]/10'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <Icon className="w-4 h-4" />
                  {item.label}
                </span>
                {item.badge && (
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${
                      isViolet
                        ? 'bg-[#8B5CF6]/15 text-[#7C3AED] dark:text-[#C4B5FD]'
                        : isAmber
                          ? 'bg-[#F59E0B]/15 text-amber-700 dark:text-[#F59E0B]'
                          : 'bg-sky-500/15 text-sky-600 dark:text-sky-300'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex gap-2">
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenQuickRef();
              }}
              className="flex-1 py-2 rounded-lg text-xs font-mono border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300"
            >
              公式速查 (Shift+?)
            </button>
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenBackup();
              }}
              className="flex-1 py-2 rounded-lg text-xs font-mono border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300"
            >
              导出/导入备份
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
