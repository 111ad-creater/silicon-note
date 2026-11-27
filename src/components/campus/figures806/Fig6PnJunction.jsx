import React, { useState } from 'react';
import { Sliders, GitCommit } from 'lucide-react';
import { sampleCurve, createMapper } from './svgHelpers';
import { ZoomFigureButton, ZoomablePanel } from './ZoomableFigure';

// Smooth S-curve transition from 0 to 1 across [-xp, xn]
function depletionStep(x, xp, xn) {
  if (x <= -xp) return 0;
  if (x >= xn) return 1;
  const u = (x + xp) / (xp + xn);
  return 0.5 * (1 - Math.cos(Math.PI * u));
}

function PnBandPanel({ title, biasV, compact = false }) {
  const W = compact ? 380 : 620;
  const H = compact ? 270 : 290;
  const pad = { l: 26, r: 26, t: 32, b: 30 };

  const mapX = createMapper(-1, 1, pad.l, W - pad.r);
  const mapY = createMapper(0, 1, H - pad.b, pad.t);

  // Physics scaling with applied biasV in [-1.0, +0.65]
  // VD normalized to 1.0 -> barrier = 1.0 - biasV
  const barrierScale = Math.max(0.32, Math.min(1.68, 1.0 - biasV));
  const halfW = 0.14 * Math.sqrt(barrierScale);
  const xp = halfW;
  const xn = halfW;

  const pTopEc = 0.88;
  const pTopEv = 0.44;
  const barrierDrop = 0.27 * barrierScale;

  const ecFn = (x) => pTopEc - barrierDrop * depletionStep(x, xp, xn);
  const evFn = (x) => pTopEv - barrierDrop * depletionStep(x, xp, xn);

  // Quasi-Fermi levels
  const efpBulk = 0.56;
  const efnBulk = efpBulk + biasV * 0.24;

  const efpFn = (x) => {
    if (x <= xn) return efpBulk;
    const d = (x - xn) / 0.42;
    return efnBulk + (efpBulk - efnBulk) * Math.exp(-d * 1.45);
  };
  const efnFn = (x) => {
    if (x >= -xp) return efnBulk;
    const d = (-xp - x) / 0.42;
    return efpBulk + (efnBulk - efpBulk) * Math.exp(-d * 1.45);
  };

  const ecPath = sampleCurve(ecFn, -1, 1, 140, mapX, mapY);
  const evPath = sampleCurve(evFn, -1, 1, 140, mapX, mapY);
  const efpPath = sampleCurve(efpFn, -1, 1, 120, mapX, mapY);
  const efnPath = sampleCurve(efnFn, -1, 1, 120, mapX, mapY);

  const isZero = Math.abs(biasV) < 0.03;
  const isFwd = biasV >= 0.03;
  const barrierLabel = isZero
    ? 'qVD'
    : isFwd
      ? 'q(VD - V)'
      : 'q(VD + |V|)';

  const xArrow = mapX(xn + 0.15);
  const yArrowTop = mapY(pTopEc);
  const yArrowBot = mapY(pTopEc - barrierDrop);

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full h-auto select-none"
      role="img"
      aria-label={title}
    >
      <defs>
        <marker
          id={`pn-red-a-${compact}-${isFwd}`}
          markerWidth="6"
          markerHeight="6"
          refX="3"
          refY="3"
          orient="auto"
        >
          <path d="M0,1 L5,3 L0,5 Z" fill="#DC2626" />
        </marker>
        <marker
          id={`pn-red-b-${compact}-${isFwd}`}
          markerWidth="6"
          markerHeight="6"
          refX="3"
          refY="3"
          orient="auto-start-reverse"
        >
          <path d="M0,1 L5,3 L0,5 Z" fill="#DC2626" />
        </marker>
      </defs>

      <text
        x={W / 2}
        y={18}
        textAnchor="middle"
        className="fill-slate-900 dark:fill-slate-100 text-[12.5px] font-bold"
      >
        {title}
      </text>

      {/* Depletion region shading & -xp / xn lines */}
      <rect
        x={mapX(-xp)}
        y={pad.t}
        width={mapX(xn) - mapX(-xp)}
        height={H - pad.t - pad.b}
        className="fill-[#0D9488]/[0.07] dark:fill-[#0D9488]/[0.10]"
      />
      <line
        x1={mapX(-xp)}
        y1={pad.t}
        x2={mapX(-xp)}
        y2={H - pad.b}
        className="stroke-slate-400 dark:stroke-slate-600"
        strokeWidth="1.2"
        strokeDasharray="4 3"
      />
      <line
        x1={mapX(xn)}
        y1={pad.t}
        x2={mapX(xn)}
        y2={H - pad.b}
        className="stroke-slate-400 dark:stroke-slate-600"
        strokeWidth="1.2"
        strokeDasharray="4 3"
      />

      <text
        x={mapX(-xp)}
        y={H - 10}
        textAnchor="middle"
        className="fill-slate-500 dark:fill-slate-400 text-[10.5px] font-mono"
      >
        -xp
      </text>
      <text
        x={mapX(xn)}
        y={H - 10}
        textAnchor="middle"
        className="fill-slate-500 dark:fill-slate-400 text-[10.5px] font-mono"
      >
        xn
      </text>

      {/* Ec and Ev curves */}
      <path
        d={ecPath}
        fill="none"
        className="stroke-slate-900 dark:stroke-slate-100"
        strokeWidth="2.5"
      />
      <path
        d={evPath}
        fill="none"
        className="stroke-slate-900 dark:stroke-slate-100"
        strokeWidth="2.5"
      />

      {/* Quasi-Fermi Levels */}
      {isZero ? (
        <>
          <line
            x1={mapX(-1)}
            y1={mapY(efpBulk)}
            x2={mapX(1)}
            y2={mapY(efpBulk)}
            stroke="#0D9488"
            className="dark:stroke-teal-400"
            strokeWidth="2"
            strokeDasharray="7 3 2 3"
          />
          <text
            x={mapX(-0.35)}
            y={mapY(efpBulk) - 7}
            className="fill-[#0F766E] dark:fill-teal-300 text-[11px] font-mono font-bold"
          >
            EF
          </text>
        </>
      ) : (
        <>
          <path
            d={efpPath}
            fill="none"
            stroke="#0284C7"
            className="dark:stroke-sky-400"
            strokeWidth="1.9"
            strokeDasharray="7 3 2 3"
          />
          <path
            d={efnPath}
            fill="none"
            stroke="#DC2626"
            className="dark:stroke-rose-400"
            strokeWidth="1.9"
            strokeDasharray="7 3 2 3"
          />
          <text
            x={mapX(-0.78)}
            y={mapY(efpBulk) + 14}
            className="fill-sky-600 dark:fill-sky-400 text-[10.5px] font-mono font-bold"
          >
            EFp
          </text>
          <text
            x={mapX(0.76)}
            y={mapY(efnBulk) - 7}
            className="fill-red-600 dark:fill-rose-400 text-[10.5px] font-mono font-bold"
          >
            EFn
          </text>
          {/* Split arrow qV / q|V| */}
          <line
            x1={mapX(0)}
            y1={mapY(efpBulk)}
            x2={mapX(0)}
            y2={mapY(efnBulk)}
            stroke="#7C3AED"
            className="dark:stroke-violet-400"
            strokeWidth="1.8"
          />
          <text
            x={mapX(0) + 6}
            y={(mapY(efpBulk) + mapY(efnBulk)) / 2 + 4}
            className="fill-violet-700 dark:fill-violet-300 text-[10.5px] font-mono font-bold"
          >
            {isFwd ? 'qV' : 'q|V|'}
          </text>
        </>
      )}

      {/* Reference dashed line for p-side Ec across to n-side */}
      <line
        x1={mapX(-xp)}
        y1={yArrowTop}
        x2={xArrow + 14}
        y2={yArrowTop}
        className="stroke-slate-400 dark:stroke-slate-600"
        strokeWidth="1"
        strokeDasharray="2 3"
      />

      {/* Barrier Height Arrow */}
      <line
        x1={xArrow}
        y1={yArrowTop + 4}
        x2={xArrow}
        y2={yArrowBot - 4}
        stroke="#DC2626"
        strokeWidth="1.7"
        markerStart={`url(#pn-red-b-${compact}-${isFwd})`}
        markerEnd={`url(#pn-red-a-${compact}-${isFwd})`}
      />
      <text
        x={xArrow + 6}
        y={(yArrowTop + yArrowBot) / 2 + 4}
        className="fill-red-600 dark:fill-rose-400 text-[11px] font-mono font-bold"
      >
        {barrierLabel}
      </text>

      {/* Band Edge Labels */}
      <text
        x={mapX(-0.96)}
        y={mapY(pTopEc) - 7}
        className="fill-slate-700 dark:fill-slate-200 text-[10.5px] font-mono"
      >
        Ecp
      </text>
      <text
        x={mapX(-0.96)}
        y={mapY(pTopEv) + 14}
        className="fill-slate-700 dark:fill-slate-200 text-[10.5px] font-mono"
      >
        Evp
      </text>
      <text
        x={mapX(0.96)}
        y={mapY(pTopEc - barrierDrop) - 7}
        textAnchor="end"
        className="fill-slate-700 dark:fill-slate-200 text-[10.5px] font-mono"
      >
        Ecn
      </text>
      <text
        x={mapX(0.96)}
        y={mapY(pTopEv - barrierDrop) + 14}
        textAnchor="end"
        className="fill-slate-700 dark:fill-slate-200 text-[10.5px] font-mono"
      >
        Evn
      </text>
    </svg>
  );
}

export default function Fig6PnJunction({
  section = 'all',
  defaultViewMode = 'interactive',
  defaultBiasV = 0.5,
}) {
  const [viewMode, setViewMode] = useState(defaultViewMode); // 'interactive' | 'triptych'
  const [biasV, setBiasV] = useState(defaultBiasV); // default forward bias to showcase split

  const show61 = section === 'all' || section === 'fig61';
  const show62 = section === 'all' || section === 'fig62';

  const biasLabel =
    Math.abs(biasV) < 0.03
      ? '零偏平衡态 (V = 0)'
      : biasV > 0
        ? `正向偏压 (V = +${biasV.toFixed(2)} V · 势垒降低变窄)`
        : `反向偏压 (V = ${biasV.toFixed(2)} V · 势垒增高变宽)`;

  // Fig 6-2 coordinates
  const W = 380;
  const H = 290;
  const pad = { l: 44, r: 22, t: 36, b: 40 };
  const mapX2 = createMapper(-1, 1, pad.l, W - pad.r);
  const mapY2 = createMapper(0, 1, H - pad.b, pad.t);
  const xp2 = 0.16;
  const xn2 = 0.16;

  // Fig 6-2(c) log J-V
  const mapXc = createMapper(0, 28, pad.l, W - pad.r);
  const mapYc = createMapper(-0.6, 8.2, H - pad.b, pad.t);

  return (
    <div className="space-y-5">
      {/* ================================================================= */}
      {/* 图 6-1：PN 结零偏/正偏/反偏交互能带图                               */}
      {/* ================================================================= */}
      {show61 && (
      <div className="rounded-2xl border border-[#0D9488]/30 bg-white dark:bg-[#0B1120]/95 p-4 sm:p-5 space-y-4 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
              <Sliders className="w-4 h-4 text-[#0D9488]" />
              <span>图 6-1：PN 结零偏、正偏、反偏能带结构图（2026 真题第三大题必画核心图）</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              切换偏压或拖动滑块，实时观察势垒高度 q(VD±V)、耗尽层宽窄与准费米能级 EFn/EFp 分裂。
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setViewMode('interactive')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                viewMode === 'interactive'
                  ? 'bg-[#0D9488] text-white border-[#0D9488]'
                  : 'bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
              }`}
            >
              交互偏压模拟
            </button>
            <button
              type="button"
              onClick={() => setViewMode('triptych')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                viewMode === 'triptych'
                  ? 'bg-[#0D9488] text-white border-[#0D9488]'
                  : 'bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
              }`}
            >
              三态并排总览 (a)(b)(c)
            </button>
            <ZoomFigureButton
              title="图 6-1：PN 结零偏、正偏、反偏能带结构图（支持偏压实时交互）"
              badge="图 6-1 交互放大"
              renderModalContent={() => (
                <Fig6PnJunction
                  section="fig61"
                  defaultViewMode={viewMode}
                  defaultBiasV={biasV}
                />
              )}
            />
          </div>
        </div>

        {viewMode === 'interactive' ? (
          <div className="space-y-3">
            {/* Bias Preset & Slider Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/65 px-4 py-3">
              <div className="flex flex-wrap items-center gap-2">
                {[
                  { label: '正偏 (V > 0)', val: 0.55 },
                  { label: '零偏 (V = 0)', val: 0.0 },
                  { label: '反偏 (V < 0)', val: -0.75 },
                ].map((preset) => {
                  const active = Math.abs(biasV - preset.val) < 0.06;
                  return (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => setBiasV(preset.val)}
                      className={`px-3 py-1 rounded-lg text-xs font-mono font-semibold border transition-colors ${
                        active
                          ? 'bg-[#0D9488] text-white border-[#0D9488]'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-[#0D9488]/50'
                      }`}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center gap-3 flex-1 max-w-xs">
                <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 shrink-0">
                  偏压 V:
                </span>
                <input
                  type="range"
                  min="-0.9"
                  max="0.65"
                  step="0.05"
                  value={biasV}
                  onChange={(e) => setBiasV(parseFloat(e.target.value))}
                  className="silicon-slider w-full bg-slate-200 dark:bg-slate-700"
                />
              </div>
            </div>

            <ZoomablePanel
              title={biasLabel}
              badge="图 6-1 单图放大"
              className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/40 dark:bg-[#060A13]/70 p-3 max-w-3xl mx-auto"
            >
              <PnBandPanel title={biasLabel} biasV={biasV} />
            </ZoomablePanel>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <ZoomablePanel
              title="(a) 零偏 (V=0) 平衡能带图"
              badge="图 6-1(a) 放大"
              className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/40 dark:bg-[#060A13]/70 p-2.5"
            >
              <PnBandPanel title="(a) 零偏 (V=0) 平衡能带图" biasV={0} compact />
            </ZoomablePanel>
            <ZoomablePanel
              title="(b) 正偏 (V>0) 势垒降低变窄"
              badge="图 6-1(b) 放大"
              className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/40 dark:bg-[#060A13]/70 p-2.5"
            >
              <PnBandPanel title="(b) 正偏 (V>0) 势垒降低变窄" biasV={0.48} compact />
            </ZoomablePanel>
            <ZoomablePanel
              title="(c) 反偏 (V<0) 势垒增高变宽"
              badge="图 6-1(c) 放大"
              className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/40 dark:bg-[#060A13]/70 p-2.5"
            >
              <PnBandPanel title="(c) 反偏 (V<0) 势垒增高变宽" biasV={-0.7} compact />
            </ZoomablePanel>
          </div>
        )}
      </div>
      )}

      {/* ================================================================= */}
      {/* 图 6-2：正偏载流子分布、电流密度分布 (J=Jn+Jp) 与实际/理想 J-V 偏差   */}
      {/* ================================================================= */}
      {show62 && (
      <div className="rounded-2xl border border-[#0D9488]/30 bg-white dark:bg-[#0B1120]/95 p-4 sm:p-5 space-y-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
            <GitCommit className="w-4 h-4 text-[#0D9488]" />
            <span>图 6-2：PN 结正偏载流子分布、电流密度分布 (J=Jn+Jp) 与实际/理想 J-V 偏差曲线</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/25">
              2026 真题 · 耗尽层 Jn/Jp 水平恒定
            </span>
            <ZoomFigureButton
              title="图 6-2：PN 结正偏载流子分布、电流密度分布 (J=Jn+Jp) 与实际/理想 J-V 偏差曲线"
              badge="图 6-2 全图"
              label="放大全图"
              renderModalContent={() => <Fig6PnJunction section="fig62" />}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Panel (a) 正偏载流子分布 */}
          <ZoomablePanel
            title="(a) 正偏载流子分布 (少子注入)"
            badge="图 6-2(a) 放大"
            className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-[#060A13]/70 p-2.5"
          >
            <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto select-none">
              <text
                x={W / 2}
                y={18}
                textAnchor="middle"
                className="fill-slate-900 dark:fill-slate-100 text-[12px] font-bold"
              >
                (a) 正偏载流子分布 (少子注入)
              </text>
              <line
                x1={pad.l}
                y1={pad.t}
                x2={pad.l}
                y2={H - pad.b}
                className="stroke-slate-500"
                strokeWidth="1.2"
              />
              <line
                x1={pad.l}
                y1={H - pad.b}
                x2={W - pad.r}
                y2={H - pad.b}
                className="stroke-slate-500"
                strokeWidth="1.2"
              />

              <line
                x1={mapX2(-xp2)}
                y1={pad.t}
                x2={mapX2(-xp2)}
                y2={H - pad.b}
                className="stroke-slate-400 dark:stroke-slate-600"
                strokeWidth="1"
                strokeDasharray="4 3"
              />
              <line
                x1={mapX2(xn2)}
                y1={pad.t}
                x2={mapX2(xn2)}
                y2={H - pad.b}
                className="stroke-slate-400 dark:stroke-slate-600"
                strokeWidth="1"
                strokeDasharray="4 3"
              />

              {/* Majority pp0 & nn0 */}
              <line
                x1={mapX2(-1)}
                y1={mapY2(0.75)}
                x2={mapX2(-xp2)}
                y2={mapY2(0.75)}
                stroke="#0284C7"
                strokeWidth="2.8"
              />
              <line
                x1={mapX2(xn2)}
                y1={mapY2(0.84)}
                x2={mapX2(1)}
                y2={mapY2(0.84)}
                stroke="#DC2626"
                strokeWidth="2.8"
              />

              {/* Minority injected profiles */}
              <path
                d={sampleCurve(
                  (x) => 0.1 + 0.34 * Math.exp((x + xp2) / 0.32),
                  -1,
                  -xp2,
                  60,
                  mapX2,
                  mapY2
                )}
                fill="none"
                stroke="#DC2626"
                strokeWidth="2.8"
              />
              <path
                d={sampleCurve(
                  (x) => 0.08 + 0.31 * Math.exp(-(x - xn2) / 0.34),
                  xn2,
                  1,
                  60,
                  mapX2,
                  mapY2
                )}
                fill="none"
                stroke="#0284C7"
                strokeWidth="2.8"
              />

              {/* Dashed depletion connection */}
              <line
                x1={mapX2(-xp2)}
                y1={mapY2(0.75)}
                x2={mapX2(xn2)}
                y2={mapY2(0.39)}
                stroke="#0284C7"
                strokeWidth="2"
                strokeDasharray="5 4"
              />
              <line
                x1={mapX2(-xp2)}
                y1={mapY2(0.44)}
                x2={mapX2(xn2)}
                y2={mapY2(0.84)}
                stroke="#DC2626"
                strokeWidth="2"
                strokeDasharray="5 4"
              />

              <text
                x={mapX2(-0.85)}
                y={mapY2(0.8)}
                className="fill-sky-600 dark:fill-sky-400 text-[10.5px] font-mono"
              >
                pp0
              </text>
              <text
                x={mapX2(0.82)}
                y={mapY2(0.89)}
                className="fill-red-600 dark:fill-rose-400 text-[10.5px] font-mono"
              >
                nn0
              </text>
              <text
                x={mapX2(-0.88)}
                y={mapY2(0.18)}
                className="fill-red-600 dark:fill-rose-400 text-[10.5px] font-mono"
              >
                np0
              </text>
              <text
                x={mapX2(0.78)}
                y={mapY2(0.16)}
                className="fill-sky-600 dark:fill-sky-400 text-[10.5px] font-mono"
              >
                pn0
              </text>
              <text
                x={mapX2(-0.46)}
                y={mapY2(0.5)}
                textAnchor="middle"
                className="fill-red-600 dark:fill-rose-400 text-[11px] font-semibold"
              >
                少子注入
              </text>

              <text
                x={mapX2(-xp2)}
                y={H - 14}
                textAnchor="middle"
                className="fill-slate-500 text-[10px] font-mono"
              >
                -xp
              </text>
              <text
                x={mapX2(xn2)}
                y={H - 14}
                textAnchor="middle"
                className="fill-slate-500 text-[10px] font-mono"
              >
                xn
              </text>
            </svg>
          </ZoomablePanel>

          {/* Panel (b) 正偏电流密度分布 */}
          <ZoomablePanel
            title="(b) 正偏电流密度分布 (2026真题)"
            badge="图 6-2(b) 放大"
            className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-[#060A13]/70 p-2.5"
          >
            <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto select-none">
              <text
                x={W / 2}
                y={18}
                textAnchor="middle"
                className="fill-slate-900 dark:fill-slate-100 text-[12px] font-bold"
              >
                (b) 正偏电流密度分布 (2026真题)
              </text>
              <line
                x1={pad.l}
                y1={pad.t}
                x2={pad.l}
                y2={H - pad.b}
                className="stroke-slate-500"
                strokeWidth="1.2"
              />
              <line
                x1={pad.l}
                y1={H - pad.b}
                x2={W - pad.r}
                y2={H - pad.b}
                className="stroke-slate-500"
                strokeWidth="1.2"
              />

              <line
                x1={mapX2(-xp2)}
                y1={pad.t}
                x2={mapX2(-xp2)}
                y2={H - pad.b}
                className="stroke-slate-400 dark:stroke-slate-600"
                strokeWidth="1"
                strokeDasharray="4 3"
              />
              <line
                x1={mapX2(xn2)}
                y1={pad.t}
                x2={mapX2(xn2)}
                y2={H - pad.b}
                className="stroke-slate-400 dark:stroke-slate-600"
                strokeWidth="1"
                strokeDasharray="4 3"
              />

              {/* Constant Total Current J */}
              <line
                x1={pad.l}
                y1={mapY2(0.84)}
                x2={W - pad.r}
                y2={mapY2(0.84)}
                className="stroke-slate-900 dark:stroke-white"
                strokeWidth="3"
              />
              <text
                x={pad.l - 8}
                y={mapY2(0.84) + 4}
                textAnchor="end"
                className="fill-slate-700 dark:fill-slate-200 text-[11px] font-mono font-bold"
              >
                J
              </text>
              <text
                x={pad.l - 8}
                y={mapY2(0) + 4}
                textAnchor="end"
                className="fill-slate-600 dark:fill-slate-300 text-[10.5px] font-mono"
              >
                0
              </text>

              {/* Jp(x): decays in n-side, flat in depletion, rises in p-side */}
              <path
                d={sampleCurve(
                  (x) => {
                    if (x < -xp2) return 0.84 - 0.28 * Math.exp((x + xp2) / 0.34);
                    if (x <= xn2) return 0.56;
                    return 0.56 * Math.exp(-(x - xn2) / 0.34);
                  },
                  -1,
                  1,
                  120,
                  mapX2,
                  mapY2
                )}
                fill="none"
                stroke="#0284C7"
                className="dark:stroke-sky-400"
                strokeWidth="2.6"
              />

              {/* Jn(x) = J - Jp(x) */}
              <path
                d={sampleCurve(
                  (x) => {
                    if (x < -xp2) return 0.28 * Math.exp((x + xp2) / 0.34);
                    if (x <= xn2) return 0.28;
                    return 0.84 - 0.56 * Math.exp(-(x - xn2) / 0.34);
                  },
                  -1,
                  1,
                  120,
                  mapX2,
                  mapY2
                )}
                fill="none"
                stroke="#DC2626"
                className="dark:stroke-rose-400"
                strokeWidth="2.6"
              />

              <text
                x={mapX2(-xp2)}
                y={H - 14}
                textAnchor="middle"
                className="fill-slate-500 text-[10px] font-mono"
              >
                -xp
              </text>
              <text
                x={mapX2(xn2)}
                y={H - 14}
                textAnchor="middle"
                className="fill-slate-500 text-[10px] font-mono"
              >
                xn
              </text>

              {/* Legend */}
              <g transform={`translate(${W - 122}, ${mapY2(0.56) - 10})`}>
                <rect
                  x="-4"
                  y="-6"
                  width="102"
                  height="52"
                  rx="6"
                  className="fill-white/90 dark:fill-slate-900/90 stroke-slate-200 dark:stroke-slate-700"
                />
                <line x1="2" y1="6" x2="22" y2="6" className="stroke-slate-900 dark:stroke-white" strokeWidth="2.5" />
                <text x="27" y="10" className="fill-slate-800 dark:fill-slate-200 text-[10px] font-mono">
                  J = Jn + Jp
                </text>
                <line x1="2" y1="21" x2="22" y2="21" stroke="#0284C7" strokeWidth="2.5" />
                <text x="27" y="25" className="fill-slate-800 dark:fill-slate-200 text-[10px] font-mono">
                  Jp
                </text>
                <line x1="2" y1="36" x2="22" y2="36" stroke="#DC2626" strokeWidth="2.5" />
                <text x="27" y="40" className="fill-slate-800 dark:fill-slate-200 text-[10px] font-mono">
                  Jn
                </text>
              </g>
            </svg>
          </ZoomablePanel>

          {/* Panel (c) 实际与理想 PN 结 J-V 偏差 */}
          <ZoomablePanel
            title="(c) 实际与理想 PN 结 J-V 偏差"
            badge="图 6-2(c) 放大"
            className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-[#060A13]/70 p-2.5"
          >
            <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto select-none">
              <text
                x={W / 2 + 8}
                y={18}
                textAnchor="middle"
                className="fill-slate-900 dark:fill-slate-100 text-[12px] font-bold"
              >
                (c) 实际与理想 PN 结 J-V 偏差
              </text>
              <line
                x1={pad.l}
                y1={pad.t}
                x2={pad.l}
                y2={H - pad.b}
                className="stroke-slate-500"
                strokeWidth="1.2"
              />
              <line
                x1={pad.l}
                y1={H - pad.b}
                x2={W - pad.r}
                y2={H - pad.b}
                className="stroke-slate-500"
                strokeWidth="1.2"
              />

              {[0, 2, 4, 6, 8].map((v) => (
                <text
                  key={v}
                  x={pad.l - 7}
                  y={mapYc(v) + 4}
                  textAnchor="end"
                  className="fill-slate-500 text-[10px] font-mono"
                >
                  {v}
                </text>
              ))}
              {[0, 5, 10, 15, 20, 25].map((v) => (
                <text
                  key={v}
                  x={mapXc(v)}
                  y={H - pad.b + 15}
                  textAnchor="middle"
                  className="fill-slate-500 text-[10px] font-mono"
                >
                  {v}
                </text>
              ))}

              <text
                x={14}
                y={H / 2}
                textAnchor="middle"
                transform={`rotate(-90 14 ${H / 2})`}
                className="fill-slate-600 dark:fill-slate-300 text-[10.5px] font-mono"
              >
                lg(J / Js)
              </text>
              <text
                x={(pad.l + W - pad.r) / 2}
                y={H - 8}
                textAnchor="middle"
                className="fill-slate-600 dark:fill-slate-300 text-[10.5px] font-mono"
              >
                q|V| / k0T
              </text>

              {/* Ideal reverse */}
              <line
                x1={mapXc(0.5)}
                y1={mapYc(0)}
                x2={mapXc(27.5)}
                y2={mapYc(0)}
                className="stroke-slate-600 dark:stroke-slate-400"
                strokeWidth="1.8"
              />

              {/* Ideal forward */}
              <line
                x1={mapXc(0.5)}
                y1={mapYc(0.2)}
                x2={mapXc(14.5)}
                y2={mapYc(5.3)}
                className="stroke-slate-900 dark:stroke-slate-100"
                strokeWidth="2.1"
              />

              {/* Actual forward (a, b, c, d) */}
              <path
                d={`M${mapXc(0.5)},${mapYc(1.1)} L${mapXc(5.5)},${mapYc(2.2)} L${mapXc(11.5)},${mapYc(4.5)} L${mapXc(19)},${mapYc(6.2)} L${mapXc(27.5)},${mapYc(6.9)}`}
                fill="none"
                stroke="#DC2626"
                className="dark:stroke-rose-400"
                strokeWidth="2.4"
                strokeDasharray="6 4"
              />

              {/* Actual reverse + breakdown */}
              <path
                d={`M${mapXc(0.5)},${mapYc(1.5)} L${mapXc(24.8)},${mapYc(2.75)} L${mapXc(26.5)},${mapYc(5.1)}`}
                fill="none"
                stroke="#0284C7"
                className="dark:stroke-sky-400"
                strokeWidth="2.4"
                strokeDasharray="7 3 2 3"
              />

              {/* a, b, c, d labels */}
              <text x={mapXc(2.6)} y={mapYc(2.1)} className="fill-red-600 dark:fill-rose-400 text-[11px] font-mono font-bold">
                a
              </text>
              <text x={mapXc(8.4)} y={mapYc(4.0)} className="fill-red-600 dark:fill-rose-400 text-[11px] font-mono font-bold">
                b
              </text>
              <text x={mapXc(14.6)} y={mapYc(5.7)} className="fill-red-600 dark:fill-rose-400 text-[11px] font-mono font-bold">
                c
              </text>
              <text x={mapXc(22.0)} y={mapYc(7.1)} className="fill-red-600 dark:fill-rose-400 text-[11px] font-mono font-bold">
                d
              </text>
              <text x={mapXc(23.5)} y={mapYc(5.2)} className="fill-sky-600 dark:fill-sky-400 text-[11px] font-bold">
                击穿
              </text>
            </svg>
          </ZoomablePanel>
        </div>
      </div>
      )}
    </div>
  );
}
