import React from 'react';
import { Layers } from 'lucide-react';
import { sampleCurve, createMapper } from './svgHelpers';
import { ZoomFigureButton, ZoomablePanel } from './ZoomableFigure';

function MetalSemiQuadrant({ title, isNType, bendUp, isBlocking, badgeText }) {
  const W = 420;
  const H = 250;
  const xInt = 112;
  const xEnd = 400;
  const yEf = 122;

  // Semiconductor bulk Ec & Ev relative to collinear EF!
  // N-type: EF near Ec -> Ec = yEf - 26, Ev = yEf + 84
  // P-type: EF near Ev -> Ec = yEf - 84, Ev = yEf + 26
  const ecBulk = isNType ? yEf - 26 : yEf - 84;
  const evBulk = isNType ? yEf + 84 : yEf + 26;
  const shift = bendUp ? -42 : 42; // SVG y smaller = higher energy!

  const mapX = createMapper(0, 1, xInt, xEnd);
  const decay = (u) => Math.exp(-3.8 * u);
  const ecPath = sampleCurve((u) => ecBulk + shift * decay(u), 0, 1, 80, mapX, (y) => y);
  const evPath = sampleCurve((u) => evBulk + shift * decay(u), 0, 1, 80, mapX, (y) => y);

  // qVD barrier indicator: on Ec if N-type Wm>Ws or P-type Wm>Ws (bendUp), on Ev if bendDown
  const showOnEc = bendUp;
  const y1 = showOnEc ? ecBulk + shift : evBulk;
  const y2 = showOnEc ? ecBulk : evBulk + shift;
  const arrowX = xInt + 62;

  return (
    <ZoomablePanel
      title={title}
      badge="图 7-1 单图放大"
      className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-[#060A13]/70 p-3"
    >
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full h-auto select-none"
        role="img"
        aria-label={title}
      >
        <defs>
          <marker
            id={`ms-a-${isNType}-${bendUp}`}
            markerWidth="6"
            markerHeight="6"
            refX="3"
            refY="3"
            orient="auto"
          >
            <path d="M0,1 L5,3 L0,5 Z" fill="#DC2626" />
          </marker>
          <marker
            id={`ms-b-${isNType}-${bendUp}`}
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

        {/* Metal shaded Fermi sea */}
        <rect
          x={14}
          y={yEf}
          width={xInt - 14}
          height={H - yEf - 16}
          className="fill-slate-300/60 dark:fill-slate-700/55"
        />
        <text
          x={(14 + xInt) / 2}
          y={yEf + 44}
          textAnchor="middle"
          className="fill-slate-700 dark:fill-slate-200 text-[12px] font-medium"
        >
          金属
        </text>

        {/* Interface vertical line */}
        <line
          x1={xInt}
          y1={30}
          x2={xInt}
          y2={H - 16}
          className="stroke-slate-900 dark:stroke-slate-100"
          strokeWidth="2.4"
        />

        {/* Strictly Collinear EF across Metal + Semiconductor */}
        <line
          x1={14}
          y1={yEf}
          x2={xEnd}
          y2={yEf}
          stroke="#0D9488"
          className="dark:stroke-teal-400"
          strokeWidth="2"
          strokeDasharray="7 3 2 3"
        />
        <text
          x={xEnd - 18}
          y={yEf - 6}
          className="fill-[#0F766E] dark:fill-teal-300 text-[11px] font-mono font-bold"
        >
          EF
        </text>

        {/* Ec & Ev Band Curves */}
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

        <text
          x={xEnd - 18}
          y={ecBulk - 7}
          className="fill-slate-800 dark:fill-slate-200 text-[11px] font-mono font-bold"
        >
          Ec
        </text>
        <text
          x={xEnd - 18}
          y={evBulk + 14}
          className="fill-slate-800 dark:fill-slate-200 text-[11px] font-mono font-bold"
        >
          Ev
        </text>

        {/* Dotted barrier height lines + qVD double arrow */}
        <line
          x1={xInt}
          y1={y1}
          x2={arrowX + 36}
          y2={y1}
          stroke="#DC2626"
          strokeWidth="1.2"
          strokeDasharray="2 3"
        />
        <line
          x1={arrowX}
          y1={y1 + 4}
          x2={arrowX}
          y2={y2 - 4}
          stroke="#DC2626"
          strokeWidth="1.6"
          markerStart={`url(#ms-b-${isNType}-${bendUp})`}
          markerEnd={`url(#ms-a-${isNType}-${bendUp})`}
        />
        <text
          x={arrowX + 8}
          y={(y1 + y2) / 2 + 4}
          className="fill-red-600 dark:fill-rose-400 text-[11px] font-mono font-bold"
        >
          qVD
        </text>

        {/* Bottom Classification Pill */}
        <rect
          x={145}
          y={H - 36}
          width={235}
          height={24}
          rx={6}
          className={
            isBlocking
              ? 'fill-rose-500/10 stroke-rose-500/70'
              : 'fill-[#0D9488]/10 stroke-[#0D9488]/70'
          }
          strokeWidth="1.2"
        />
        <text
          x={262}
          y={H - 20}
          textAnchor="middle"
          className={`text-[11px] font-bold ${
            isBlocking
              ? 'fill-red-600 dark:fill-rose-400'
              : 'fill-[#0F766E] dark:fill-teal-300'
          }`}
        >
          {badgeText}
        </text>
      </svg>
    </ZoomablePanel>
  );
}

export default function Fig7MetalSemi() {
  return (
    <div className="rounded-2xl border border-[#0D9488]/30 bg-white dark:bg-[#0B1120]/95 p-4 sm:p-5 space-y-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
          <Layers className="w-4 h-4 text-[#0D9488]" />
          <span>图 7-1：金属—半导体接触四种平衡能带结构图（阻挡层 vs 反阻挡层）</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/25">
            平衡态 EF 严格齐平 · 2026 真题考点
          </span>
          <ZoomFigureButton
            title="图 7-1：金属—半导体接触四种平衡能带结构图（阻挡层 vs 反阻挡层）"
            badge="图 7-1 全图"
            label="放大全图"
            renderModalContent={() => <Fig7MetalSemi />}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <MetalSemiQuadrant
          title="(a) N 型半导体，Wm > Ws"
          isNType
          bendUp
          isBlocking
          badgeText="★ N 型阻挡层 (整流，能带上弯，Vs < 0)"
        />
        <MetalSemiQuadrant
          title="(b) N 型半导体，Wm < Ws"
          isNType
          bendUp={false}
          isBlocking={false}
          badgeText="N 型反阻挡层 (欧姆，能带下弯，Vs > 0)"
        />
        <MetalSemiQuadrant
          title="(c) P 型半导体，Wm < Ws (2026真题)"
          isNType={false}
          bendUp={false}
          isBlocking
          badgeText="★ P 型阻挡层 (整流，能带下弯，Vs > 0)"
        />
        <MetalSemiQuadrant
          title="(d) P 型半导体，Wm > Ws"
          isNType={false}
          bendUp
          isBlocking={false}
          badgeText="P 型反阻挡层 (欧姆，能带上弯，Vs < 0)"
        />
      </div>
    </div>
  );
}
