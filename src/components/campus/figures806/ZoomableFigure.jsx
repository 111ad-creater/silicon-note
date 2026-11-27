import React, { createContext, useContext, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ZoomIn, X } from 'lucide-react';
import { ZoomControls, ZoomViewport } from '../ZoomableFigureModal.jsx';

const ZoomModalContext = createContext(false);

function CmosStyleTealZoomModal({ title, badge, onClose, children }) {
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  return createPortal(
    <ZoomModalContext.Provider value={true}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title || '放大看图'}
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/75 backdrop-blur-sm p-3 sm:p-6"
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-6xl max-h-[92vh] overflow-y-auto rounded-2xl border border-[#0D9488]/40 bg-white dark:bg-[#0B1120] p-4 sm:p-6 shadow-2xl space-y-4"
        >
          {/* Modal Header — matches CMOS AnalogSchematic modal layout */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
            <div>
              <div className="text-[11px] font-mono font-semibold text-[#0D9488] uppercase tracking-wider">
                {badge || 'HIGH-RES VECTOR FIGURE'} · 无极放大模式 ({Math.round(zoom * 100)}%)
              </div>
              <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">
                {title}
              </h3>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <ZoomControls zoom={zoom} onZoomChange={setZoom} accent="teal" />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onClose();
                }}
                aria-label="关闭放大弹窗"
                className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:border-[#0D9488] hover:text-[#0D9488] transition-colors"
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
    </ZoomModalContext.Provider>,
    document.body
  );
}

/**
 * Header trigger button for zooming an entire figure card (matches CMOS "🔍 放大看图").
 */
export function ZoomFigureButton({
  title,
  badge,
  renderModalContent,
  label = '放大看图',
}) {
  const insideModal = useContext(ZoomModalContext);
  const [open, setOpen] = useState(false);

  if (insideModal) return null;

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen(true);
        }}
        className="inline-flex items-center gap-1.5 min-h-[34px] px-3 py-1.5 rounded-xl text-xs font-semibold border border-[#0D9488]/35 bg-[#0D9488]/10 text-[#0F766E] dark:text-teal-300 hover:bg-[#0D9488]/20 transition-colors shrink-0"
        title="点击全屏放大查看细节"
      >
        <ZoomIn className="w-3.5 h-3.5" />
        <span>🔍 {label}</span>
      </button>

      {open && (
        <CmosStyleTealZoomModal
          title={title}
          badge={badge}
          onClose={() => setOpen(false)}
        >
          {renderModalContent()}
        </CmosStyleTealZoomModal>
      )}
    </>
  );
}

/**
 * Click-to-zoom wrapper for individual SVG panels (sibling modal avoids portal bubbling!).
 */
export function ZoomablePanel({
  title,
  badge = 'HIGH-RES VECTOR FIGURE',
  className = '',
  children,
}) {
  const insideModal = useContext(ZoomModalContext);
  const [open, setOpen] = useState(false);

  if (insideModal) {
    return <div className={className}>{children}</div>;
  }

  const handleOpen = (e) => {
    if (e.target.closest('button, a, input, select')) return;
    setOpen(true);
  };

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        onClick={handleOpen}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setOpen(true);
          }
        }}
        title="点击图片可全屏放大查看细节"
        aria-label={`放大查看 ${title}`}
        className={`group cursor-zoom-in hover:border-[#0D9488]/50 transition-colors focus:outline-none focus:ring-2 focus:ring-[#0D9488]/45 ${className}`}
      >
        {children}
        <div className="pointer-events-none flex items-center justify-end gap-1 pt-1 text-[11px] font-mono text-slate-400 group-hover:text-[#0D9488] transition-colors">
          <ZoomIn className="w-3 h-3" />
          <span>点击可全屏放大</span>
        </div>
      </div>

      {open && (
        <CmosStyleTealZoomModal
          title={title}
          badge={badge}
          onClose={() => setOpen(false)}
        >
          {children}
        </CmosStyleTealZoomModal>
      )}
    </>
  );
}
