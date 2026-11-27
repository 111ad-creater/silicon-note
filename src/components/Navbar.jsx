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
} from 'lucide-react';

const NAV_ITEMS = [
  { id: 'home', label: '首页', icon: Home },
  { id: 'docs', label: '学习路线', icon: BookOpen },
  { id: 'lab', label: '交互实验室', icon: FlaskConical, badge: '9合1' },
  { id: 'benchmarks', label: '实战训练营', icon: Activity },
  { id: 'glossary', label: '术语词典', icon: BookMarked },
  {
    id: 'campus',
    label: '校内课程',
    icon: GraduationCap,
    accent: 'violet',
    badge: 'Campus',
  },
];

export default function Navbar({ activePage, onNavigate, isDark, onToggleTheme }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNav = (pageId) => {
    onNavigate(pageId);
    setMobileMenuOpen(false);
  };

  return (
    <header className="print:hidden sticky top-0 z-50 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-[#060A13]/85 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <button
          onClick={() => handleNav('home')}
          className="flex items-center gap-3 group text-left focus:outline-none"
        >
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-sky-400/20 to-emerald-400/20 border border-sky-400/40 flex items-center justify-center shadow-sm group-hover:shadow-glow-cyber transition-all">
            <Cpu className="w-5 h-5 text-sky-500 dark:text-sky-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold tracking-tight text-slate-900 dark:text-white text-base sm:text-lg">
                SiliconNote
              </span>
              <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                v1.0
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block leading-none mt-0.5">
              AI 芯片与系统直觉图鉴
            </p>
          </div>
        </button>

        {/* Desktop Nav */}
        <nav className="hidden lg:flex items-center gap-1 bg-slate-100/80 dark:bg-slate-900/70 p-1 rounded-xl border border-slate-200/70 dark:border-slate-800/80">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            const isViolet = item.accent === 'violet';
            return (
              <button
                key={item.id}
                onClick={() => handleNav(item.id)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? isViolet
                      ? 'bg-[#8B5CF6]/15 text-[#7C3AED] dark:text-[#C4B5FD] shadow-sm border border-[#8B5CF6]/45'
                      : 'bg-white dark:bg-slate-800 text-sky-600 dark:text-sky-400 shadow-sm border border-slate-200/80 dark:border-slate-700/80'
                    : isViolet
                      ? 'text-[#7C3AED] dark:text-[#A78BFA] hover:bg-[#8B5CF6]/10 border border-transparent hover:border-[#8B5CF6]/25'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/40 dark:hover:bg-slate-800/40'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
                {item.badge && (
                  <span
                    className={`ml-0.5 px-1.5 py-0.2 rounded text-[10px] font-mono border ${
                      isViolet
                        ? 'bg-[#8B5CF6]/15 text-[#7C3AED] dark:text-[#C4B5FD] border-[#8B5CF6]/35'
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

        {/* Right Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleTheme}
            aria-label="切换深浅色主题"
            title={isDark ? '切换到浅色模式' : '切换到深色模式'}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-900/70 text-slate-700 dark:text-slate-300 hover:border-sky-400/50 transition-colors"
          >
            {isDark ? (
              <>
                <Sun className="w-4 h-4 text-amber-400" />
                <span className="hidden sm:inline">浅色</span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 text-sky-600" />
                <span className="hidden sm:inline">深色</span>
              </>
            )}
          </button>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen((v) => !v)}
            aria-label="打开菜单"
            className="lg:hidden p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-900/70 text-slate-700 dark:text-slate-300"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
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
            return (
              <button
                key={item.id}
                onClick={() => handleNav(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? isViolet
                      ? 'bg-[#8B5CF6]/15 text-[#7C3AED] dark:text-[#C4B5FD] border border-[#8B5CF6]/40'
                      : 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-400/30'
                    : isViolet
                      ? 'text-[#7C3AED] dark:text-[#A78BFA] hover:bg-[#8B5CF6]/10'
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
                        : 'bg-sky-500/15 text-sky-600 dark:text-sky-300'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
}
