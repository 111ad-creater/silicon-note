import React, { useState, useEffect } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, X } from 'lucide-react';

const ZOOM_PRESETS = [1, 1.5, 2, 2.5];

export function ZoomControls({ zoom, onZoomChange, accent = 'violet' }) {
  const isTeal = accent === 'teal';
  const activeBtn = isTeal
    ? 'bg-[#0D9488] text-white border-[#0D9488]'
    : 'bg-[#8B5CF6] text-white border-[#8B5CF6]';
  const hoverBorder = isTeal
    ? 'hover:border-[#0D9488]/60 hover:text-[#0F766E] dark:hover:text-teal-300'
    : 'hover:border-[#8B5CF6]/60 hover:text-[#6D28D9] dark:hover:text-[#C4B5FD]';

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <button
        type="button"
        onClick={() => onZoomChange(Math.max(1, Number((zoom - 0.25).toFixed(2))))}
        disabled={zoom <= 1}
        aria-label="缩小"
        title="缩小"
        className={`inline-flex items-center justify-center min-h-[32px] px-2.5 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors ${hoverBorder}`}
      >
        <ZoomOut className="w-3.5 h-3.5" />
      </button>

      {ZOOM_PRESETS.map((preset) => {
        const isCurrent = Math.abs(zoom - preset) < 0.01;
        return (
          <button
            key={preset}
            type="button"
            onClick={() => onZoomChange(preset)}
            className={`min-h-[32px] px-2.5 rounded-lg text-xs font-mono font-semibold border transition-colors ${
              isCurrent
                ? activeBtn
                : `border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 ${hoverBorder}`
            }`}
          >
            {Math.round(preset * 100)}%
          </button>
        );
      })}

      <button
        type="button"
        onClick={() => onZoomChange(Math.min(3, Number((zoom + 0.25).toFixed(2))))}
        disabled={zoom >= 3}
        aria-label="放大"
        title="放大"
        className={`inline-flex items-center justify-center min-h-[32px] px-2.5 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors ${hoverBorder}`}
      >
        <ZoomIn className="w-3.5 h-3.5" />
      </button>

      {zoom > 1 && (
        <button
          type="button"
          onClick={() => onZoomChange(1)}
          aria-label="重置缩放"
          title="还原 100%"
          className={`inline-flex items-center gap-1 min-h-[32px] px-2.5 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 transition-colors ${hoverBorder}`}
        >
          <RotateCcw className="w-3 h-3" />
          <span>还原</span>
        </button>
      )}
    </div>
  );
}

export function ZoomViewport({ zoom, onToggleZoom, children, className = '' }) {
  return (
    <div
      onDoubleClick={onToggleZoom}
      title="双击可快速切换放大 / 还原，放大后可拖动或滚动平移查看细节"
      className={`max-h-[68vh] overflow-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#060A13] p-3 sm:p-5 text-slate-800 dark:text-slate-100 ${className}`}
    >
      <div
        style={{
          width: `${Math.round(zoom * 100)}%`,
          minWidth: '100%',
        }}
        className="mx-auto transition-[width] duration-150 ease-out [&>svg]:w-full [&>svg]:max-w-none [&>svg]:h-auto"
      >
        {children}
      </div>
    </div>
  );
}

/**
 * Reusable click-to-zoom wrapper for any SVG/diagram card (e.g. 806 Physics figures).
 */
export function FigureZoomBox({
  title = '物理原理图谱',
  accent = 'teal',
  children,
}) {
  const [open, setOpen] = useState(false);
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open]);

  const handleOpen = () => {
    setZoom(1);
    setOpen(true);
  };

  const handleCardClick = (e) => {
    // Allow internal interactive buttons inside a figure to work without triggering zoom
    if (e.target.closest('button, a, input, select')) return;
    handleOpen();
  };

  const isTeal = accent === 'teal';

  return (
    <>
      <div className="relative group">
        <div
          onClick={handleCardClick}
          className="cursor-zoom-in"
          title="点击图片可放大查看细节"
        >
          {children}
        </div>

        <button
          type="button"
          onClick={handleOpen}
          className={`mt-2 inline-flex items-center gap-1.5 min-h-[32px] px-3 py-1 rounded-xl text-xs font-semibold border transition-colors ${
            isTeal
              ? 'border-[#0D9488]/35 bg-[#0D9488]/10 text-[#0F766E] dark:text-teal-300 hover:bg-[#0D9488]/20'
              : 'border-[#8B5CF6]/35 bg-[#8B5CF6]/10 text-[#6D28D9] dark:text-[#C4B5FD] hover:bg-[#8B5CF6]/20'
          }`}
        >
          <ZoomIn className="w-3.5 h-3.5" />
          <span>🔍 点击图片放大查看</span>
        </button>
      </div>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={title}
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-sm p-3 sm:p-6"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`w-full max-w-6xl max-h-[92vh] overflow-y-auto rounded-2xl border bg-white dark:bg-[#0B1120] p-4 sm:p-6 shadow-2xl space-y-4 ${
              isTeal ? 'border-[#0D9488]/40' : 'border-[#8B5CF6]/40'
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
              <div>
                <div
                  className={`text-[11px] font-mono font-semibold uppercase tracking-wider ${
                    isTeal ? 'text-[#0D9488]' : 'text-[#8B5CF6]'
                  }`}
                >
                  VECTOR ZOOM · 无极放大模式 ({Math.round(zoom * 100)}%)
                </div>
                <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">
                  {title}
                </h3>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <ZoomControls zoom={zoom} onZoomChange={setZoom} accent={accent} />
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="关闭放大弹窗"
                  className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:border-slate-400 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <ZoomViewport
              zoom={zoom}
              onToggleZoom={() => setZoom((z) => (z > 1.1 ? 1 : 2))}
            >
              {children}
            </ZoomViewport>
          </div>
        </div>
      )}
    </>
  );
}
