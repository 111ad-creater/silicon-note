import React from 'react';
import { Compass } from 'lucide-react';
import { sampleCurve, createMapper } from './svgHelpers';
import { ZoomFigureButton, ZoomablePanel } from './ZoomableFigure';

const PANELS = [
  {
    id: 'ge',
    title: '(a) 锗 (Ge) 能带结构',
    egText: 'Eg = 0.67 eV',
    egSub: '(间接带隙，极小在 L)',
    egXVal: -1.0,
    egTopVal: 0.67,
    // Conduction band: min at L(-1)=0.67, peak ~1.8 at -0.52, dip ~0.85 at 0, peak ~2.0 at 0.48, dip ~0.9 at 1.0
    cbFn: (k) => {
      if (k <= 0) {
        const u = k + 1; // 0 at L, 1 at Gamma
        return (
          0.67 +
          1.15 * Math.pow(Math.sin(Math.PI * Math.pow(u, 0.92)), 2) +
          0.18 * u
        );
      }
      const u = k; // 0 at Gamma, 1 at X
      return (
        0.85 +
        1.16 * Math.pow(Math.sin(Math.PI * Math.pow(u, 1.05)), 2) +
        0.05 * u
      );
    },
    splitDelta: 0.29,
  },
  {
    id: 'si',
    title: '(b) 硅 (Si) 能带结构',
    egText: 'Eg = 1.12 eV',
    egSub: '极小值在 0.85 ΓX',
    egXVal: 0.85,
    egTopVal: 1.12,
    // Conduction band: ~2.0 at L(-1), sharp cusp ~3.10 at Gamma(0), min 1.12 at 0.85, rises slightly to ~1.18 at X(1)
    cbFn: (k) => {
      if (k <= 0) {
        const u = -k; // 0 at Gamma, 1 at L
        return 3.1 - 1.1 * Math.pow(u, 0.58);
      }
      if (k <= 0.85) {
        const u = k / 0.85; // 0 at Gamma, 1 at 0.85
        return 3.1 - 1.98 * (1 - Math.pow(1 - u, 1.85));
      }
      const u = (k - 0.85) / 0.15;
      return 1.12 + 0.06 * u * u;
    },
    splitDelta: 0.044,
  },
  {
    id: 'gaas',
    title: '(c) 砷化镓 (GaAs) 能带结构',
    egText: 'Eg = 1.43 eV',
    egSub: '(直接带隙)',
    egXVal: 0.0,
    egTopVal: 1.43,
    // Conduction band: 1.72 at L(-1) (+0.29 eV), peak ~2.36 at -0.5, min 1.43 at Gamma(0), peak ~2.53 at 0.5, ~1.74 at X(1)
    cbFn: (k) => {
      if (k <= 0) {
        const u = -k; // 0 at Gamma, 1 at L
        const base = 1.43 + 0.29 * u;
        return base + 0.78 * Math.pow(Math.sin(Math.PI * Math.pow(u, 0.9)), 2);
      }
      const u = k; // 0 at Gamma, 1 at X
      const base = 1.43 + 0.31 * u;
      return base + 0.94 * Math.pow(Math.sin(Math.PI * Math.pow(u, 0.95)), 2);
    },
    splitDelta: 0.34,
    showSecondaryValley: true,
  },
];

export default function Fig1BandStructure() {
  const W = 380;
  const H = 330;
  const pad = { l: 42, r: 22, t: 36, b: 36 };
  const mapX = createMapper(-1, 1, pad.l, W - pad.r);
  const mapY = createMapper(-1.6, 3.3, H - pad.b, pad.t);
  const yZero = mapY(0);
  const xGamma = mapX(0);

  return (
    <div className="rounded-2xl border border-[#0D9488]/30 bg-white dark:bg-[#0B1120]/95 p-4 sm:p-5 space-y-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
          <Compass className="w-4 h-4 text-[#0D9488]" />
          <span>图 1-1：锗 (Ge)、硅 (Si)、砷化镓 (GaAs) 简约布里渊区 E(k) 能带结构对比图</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-[#0D9488]/12 text-[#0F766E] dark:text-teal-300 border border-[#0D9488]/25">
            SVG 物理公式精准绘制
          </span>
          <ZoomFigureButton
            title="图 1-1：锗 (Ge)、硅 (Si)、砷化镓 (GaAs) 简约布里渊区 E(k) 能带结构对比图"
            badge="图 1-1 全图"
            label="放大全图"
            renderModalContent={() => <Fig1BandStructure />}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {PANELS.map((p, idx) => {
          const cbPath = sampleCurve(p.cbFn, -1, 1, 120, mapX, mapY);
          const hhPath = sampleCurve((k) => -1.1 * k * k, -1, 1, 80, mapX, mapY);
          const lhPath = sampleCurve((k) => -2.2 * k * k, -1, 1, 80, mapX, mapY);
          const soPath = sampleCurve(
            (k) => -p.splitDelta - 1.3 * k * k,
            -1,
            1,
            80,
            mapX,
            mapY
          );

          const dotX = mapX(p.egXVal);
          const dotY = mapY(p.egTopVal);
          const arrowX =
            p.id === 'ge' ? dotX + 10 : p.id === 'si' ? dotX : dotX;

          return (
            <ZoomablePanel
              key={p.id}
              title={p.title}
              badge="图 1-1 单图放大"
              className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-[#060A13]/70 p-2.5"
            >
              <svg
                viewBox={`0 0 ${W} ${H}`}
                className="w-full h-auto overflow-visible select-none"
                role="img"
                aria-label={p.title}
              >
                <defs>
                  <marker
                    id={`arrow-red-${p.id}`}
                    markerWidth="7"
                    markerHeight="7"
                    refX="3.5"
                    refY="3.5"
                    orient="auto"
                  >
                    <path d="M0,1 L6,3.5 L0,6 Z" fill="#DC2626" />
                  </marker>
                  <marker
                    id={`arrow-red-start-${p.id}`}
                    markerWidth="7"
                    markerHeight="7"
                    refX="3.5"
                    refY="3.5"
                    orient="auto-start-reverse"
                  >
                    <path d="M0,1 L6,3.5 L0,6 Z" fill="#DC2626" />
                  </marker>
                  <marker
                    id={`arrow-amber-${p.id}`}
                    markerWidth="7"
                    markerHeight="7"
                    refX="3.5"
                    refY="3.5"
                    orient="auto"
                  >
                    <path d="M0,1 L6,3.5 L0,6 Z" fill="#D97706" />
                  </marker>
                </defs>

                {/* Title */}
                <text
                  x={W / 2 + 8}
                  y={18}
                  textAnchor="middle"
                  className="fill-slate-900 dark:fill-slate-100 text-[13px] font-bold"
                >
                  {p.title}
                </text>

                {/* Axes */}
                <line
                  x1={pad.l}
                  y1={pad.t}
                  x2={pad.l}
                  y2={H - pad.b}
                  className="stroke-slate-400 dark:stroke-slate-600"
                  strokeWidth="1.2"
                />
                <line
                  x1={pad.l}
                  y1={H - pad.b}
                  x2={W - pad.r}
                  y2={H - pad.b}
                  className="stroke-slate-400 dark:stroke-slate-600"
                  strokeWidth="1.2"
                />

                {/* Reference Gamma & E=0 lines */}
                <line
                  x1={xGamma}
                  y1={pad.t}
                  x2={xGamma}
                  y2={H - pad.b}
                  className="stroke-slate-300 dark:stroke-slate-700"
                  strokeWidth="1"
                />
                <line
                  x1={pad.l}
                  y1={yZero}
                  x2={W - pad.r}
                  y2={yZero}
                  className="stroke-slate-300 dark:stroke-slate-700"
                  strokeWidth="1"
                />

                {/* Y ticks */}
                {[-1, 0, 1, 2, 3].map((t) => {
                  const ty = mapY(t);
                  return (
                    <g key={t}>
                      <line
                        x1={pad.l - 4}
                        y1={ty}
                        x2={pad.l}
                        y2={ty}
                        className="stroke-slate-400 dark:stroke-slate-500"
                        strokeWidth="1"
                      />
                      <text
                        x={pad.l - 8}
                        y={ty + 3.5}
                        textAnchor="end"
                        className="fill-slate-500 dark:fill-slate-400 text-[10px] font-mono"
                      >
                        {t}
                      </text>
                    </g>
                  );
                })}

                {idx === 0 && (
                  <text
                    x={12}
                    y={H / 2}
                    textAnchor="middle"
                    transform={`rotate(-90 12 ${H / 2})`}
                    className="fill-slate-600 dark:fill-slate-300 text-[11px] font-medium"
                  >
                    能量 E (eV)
                  </text>
                )}

                {/* X axis labels */}
                {[
                  { x: pad.l, label: 'L [111]' },
                  { x: xGamma, label: 'Γ (k=0)' },
                  { x: W - pad.r, label: 'X [100]' },
                ].map((tk) => (
                  <g key={tk.label}>
                    <line
                      x1={tk.x}
                      y1={H - pad.b}
                      x2={tk.x}
                      y2={H - pad.b + 4}
                      className="stroke-slate-400 dark:stroke-slate-500"
                      strokeWidth="1"
                    />
                    <text
                      x={tk.x}
                      y={H - pad.b + 17}
                      textAnchor="middle"
                      className="fill-slate-600 dark:fill-slate-300 text-[10.5px] font-mono"
                    >
                      {tk.label}
                    </text>
                  </g>
                ))}

                {/* Clip valence curves inside plot box */}
                <clipPath id={`clip-${p.id}`}>
                  <rect
                    x={pad.l}
                    y={pad.t}
                    width={W - pad.l - pad.r}
                    height={H - pad.t - pad.b}
                  />
                </clipPath>

                <g clipPath={`url(#clip-${p.id})`}>
                  {/* Split-off band */}
                  <path
                    d={soPath}
                    fill="none"
                    className="stroke-slate-500 dark:stroke-slate-400"
                    strokeWidth="1.6"
                    strokeDasharray="5 4"
                  />
                  {/* Light hole band */}
                  <path
                    d={lhPath}
                    fill="none"
                    stroke="#0284C7"
                    className="dark:stroke-sky-400"
                    strokeWidth="2"
                  />
                  {/* Heavy hole band */}
                  <path
                    d={hhPath}
                    fill="none"
                    className="stroke-slate-900 dark:stroke-slate-100"
                    strokeWidth="2.3"
                  />
                  {/* Conduction band */}
                  <path
                    d={cbPath}
                    fill="none"
                    stroke="#0D9488"
                    className="dark:stroke-teal-400"
                    strokeWidth="2.6"
                  />
                </g>

                {/* GaAs L-valley secondary minimum annotations */}
                {p.showSecondaryValley && (
                  <g>
                    {/* Dotted levels */}
                    <line
                      x1={mapX(-1)}
                      y1={mapY(1.72)}
                      x2={mapX(-0.42)}
                      y2={mapY(1.72)}
                      stroke="#D97706"
                      strokeWidth="1.2"
                      strokeDasharray="2 3"
                    />
                    <line
                      x1={mapX(-1)}
                      y1={mapY(1.43)}
                      x2={mapX(0)}
                      y2={mapY(1.43)}
                      stroke="#D97706"
                      strokeWidth="1.2"
                      strokeDasharray="2 3"
                    />
                    {/* Vertical offset double-arrow */}
                    <line
                      x1={mapX(-0.8)}
                      y1={mapY(1.69)}
                      x2={mapX(-0.8)}
                      y2={mapY(1.46)}
                      stroke="#D97706"
                      strokeWidth="1.4"
                    />
                    {/* Orange pointer arrow */}
                    <line
                      x1={mapX(-0.78)}
                      y1={mapY(2.68)}
                      x2={mapX(-0.96)}
                      y2={mapY(1.86)}
                      stroke="#D97706"
                      strokeWidth="1.5"
                      markerEnd={`url(#arrow-amber-${p.id})`}
                    />
                    <text
                      x={mapX(-0.98)}
                      y={mapY(2.96)}
                      className="fill-amber-600 dark:fill-amber-400 text-[10px] font-semibold"
                    >
                      次能谷 (L点)
                    </text>
                    <text
                      x={mapX(-0.98)}
                      y={mapY(2.74)}
                      className="fill-amber-600 dark:fill-amber-400 text-[10px] font-semibold"
                    >
                      高出约 0.29 eV
                    </text>
                    <circle
                      cx={mapX(-1)}
                      cy={mapY(1.72)}
                      r="4"
                      fill="#D97706"
                    />
                    <text
                      x={mapX(0.08)}
                      y={mapY(-0.56)}
                      className="fill-slate-600 dark:fill-slate-300 text-[10px] font-mono"
                    >
                      裂距 Δ = 0.34 eV
                    </text>
                  </g>
                )}

                {/* Eg double-headed arrow & red CB minimum dot */}
                <line
                  x1={arrowX}
                  y1={dotY + 6}
                  x2={arrowX}
                  y2={yZero - 4}
                  stroke="#DC2626"
                  strokeWidth="1.8"
                  markerStart={`url(#arrow-red-start-${p.id})`}
                  markerEnd={`url(#arrow-red-${p.id})`}
                />
                <circle cx={dotX} cy={dotY} r="4.2" fill="#DC2626" />

                {/* Eg Label */}
                {p.id === 'ge' && (
                  <g>
                    <text
                      x={arrowX + 12}
                      y={yZero - 28}
                      className="fill-red-600 dark:fill-rose-400 text-[10.5px] font-bold"
                    >
                      {p.egText}
                    </text>
                    <text
                      x={arrowX + 12}
                      y={yZero - 14}
                      className="fill-red-600 dark:fill-rose-400 text-[10px] font-semibold"
                    >
                      {p.egSub}
                    </text>
                  </g>
                )}

                {p.id === 'si' && (
                  <g>
                    <text
                      x={arrowX - 10}
                      y={yZero - 38}
                      textAnchor="end"
                      className="fill-red-600 dark:fill-rose-400 text-[10.5px] font-bold"
                    >
                      {p.egText}
                    </text>
                    <text
                      x={arrowX - 10}
                      y={yZero - 23}
                      textAnchor="end"
                      className="fill-red-600 dark:fill-rose-400 text-[10px] font-semibold"
                    >
                      {p.egSub}
                    </text>
                  </g>
                )}

                {p.id === 'gaas' && (
                  <g>
                    <text
                      x={arrowX + 10}
                      y={mapY(0.84)}
                      className="fill-red-600 dark:fill-rose-400 text-[10.5px] font-bold"
                    >
                      {p.egText}
                    </text>
                    <text
                      x={arrowX + 10}
                      y={mapY(0.66)}
                      className="fill-red-600 dark:fill-rose-400 text-[10px] font-semibold"
                    >
                      {p.egSub}
                    </text>
                  </g>
                )}
              </svg>
            </ZoomablePanel>
          );
        })}
      </div>

      {/* Legend & SVG Constraint Note */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-600 dark:text-slate-300 border-t border-slate-200/80 dark:border-slate-800/80 pt-3">
        <div className="flex flex-wrap items-center gap-4 font-mono">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-4 h-0.5 bg-[#0D9488] dark:bg-teal-400 inline-block" />
            <span>导带 Ec(k)</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-4 h-0.5 bg-slate-900 dark:bg-slate-100 inline-block" />
            <span>重空穴带 V1</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-4 h-0.5 bg-sky-600 dark:bg-sky-400 inline-block" />
            <span>轻空穴带 V2</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-4 border-t-2 border-dashed border-slate-500 inline-block" />
            <span>自旋-轨道分裂带 V3</span>
          </span>
        </div>
        <span className="text-[11px] text-slate-500 dark:text-slate-400">
          横轴：L[111] — Γ(k=0) — X[100]；价带顶严格对齐 Γ(0, 0)
        </span>
      </div>
    </div>
  );
}
