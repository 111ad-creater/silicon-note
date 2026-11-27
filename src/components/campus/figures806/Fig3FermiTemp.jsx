import React from 'react';
import { Activity } from 'lucide-react';
import { sampleCurve, createMapper } from './svgHelpers';
import { ZoomFigureButton, ZoomablePanel } from './ZoomableFigure';

// True physics-inspired EF(T) curve (in normalized bandgap coordinates: Ev=0, Ei=0.5, ED=0.82, Ec=1.0)
// Starts strictly at (Ec+ED)/2 = 0.91 at T=0, rises to peak ~0.922 around T=26K (Nc = 0.11 ND),
// crosses (Ec+ED)/2 around T=58K, crosses ED=0.82 around T=118K, then monotonically approaches Ei=0.50.
function evalEf(T) {
  const Ev = 0;
  const Ec = 1.0;
  const ED = 0.82;
  const Ei = 0.5;
  const mid = (Ec + ED) / 2; // 0.91

  // Low-T weak ionization formula: mid + (kT/2)*ln(ND / (2*Nc)), with Nc ~ T^(3/2)
  // Smooth blend into exhaustion & intrinsic asymptote toward Ei
  if (T <= 0.5) return mid;
  const kT = 0.00072 * T;
  const twoNcRatio = Math.pow(T / 58, 1.5);
  const weakTerm = mid + 0.5 * kT * Math.log(1 / twoNcRatio);
  const intrinsicWeight = 1 / (1 + Math.exp(-(T - 260) / 105));
  const satCurve =
    ED -
    0.00055 * Math.max(0, T - 85) -
    0.16 * (1 - Math.exp(-Math.max(0, T - 105) / 180));
  const lowToSatBlend = 1 / (1 + Math.exp(-(T - 105) / 22));
  const combinedLowSat =
    weakTerm * (1 - lowToSatBlend) + Math.min(weakTerm, satCurve) * lowToSatBlend;
  const val = combinedLowSat * (1 - intrinsicWeight) + (Ei + 0.11 * Math.exp(-(T - 220) / 220)) * intrinsicWeight;
  return Math.max(Ei + 0.015, Math.min(Ec - 0.04, val));
}

export default function Fig3FermiTemp() {
  const W = 820;
  const H = 320;
  const pad = { l: 86, r: 44, t: 36, b: 44 };

  const mapX = createMapper(0, 650, pad.l, W - pad.r);
  const mapY = createMapper(-0.08, 1.08, H - pad.b, pad.t);

  const Ec = 1.0;
  const ED = 0.82;
  const mid = (Ec + ED) / 2;
  const Ei = 0.5;
  const Ev = 0.0;

  // Find peak point numerically
  let peakT = 0;
  let peakVal = -1;
  for (let t = 1; t <= 100; t += 0.5) {
    const v = evalEf(t);
    if (v > peakVal) {
      peakVal = v;
      peakT = t;
    }
  }

  const efPath = sampleCurve(evalEf, 0, 650, 260, mapX, mapY);

  return (
    <div className="rounded-2xl border border-[#0D9488]/30 bg-white dark:bg-[#0B1120]/95 p-4 sm:p-5 space-y-3 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
          <Activity className="w-4 h-4 text-[#0D9488]" />
          <span>图 3-1：N 型半导体费米能级 EF 随温度 T 的三区间演变曲线</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-[#0D9488]/12 text-[#0F766E] dark:text-teal-300 border border-[#0D9488]/25">
            含低温微升极大值 (Nc = 0.11 ND)
          </span>
          <ZoomFigureButton
            title="图 3-1：N 型半导体费米能级 EF 随温度 T 的三区间演变曲线"
            badge="图 3-1 放大"
            renderModalContent={() => <Fig3FermiTemp />}
          />
        </div>
      </div>

      <ZoomablePanel
        title="图 3-1：N 型半导体费米能级 EF 随温度 T 的三区间演变曲线"
        badge="图 3-1 放大"
        className="rounded-xl border border-slate-200/70 dark:border-slate-800/80 bg-slate-50/30 dark:bg-[#060A13]/50 p-2"
      >
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full h-auto select-none"
        role="img"
        aria-label="N 型半导体费米能级 EF 随温度 T 的三区间演变曲线"
      >
        <defs>
          <marker
            id="peak-arrow"
            markerWidth="7"
            markerHeight="7"
            refX="5"
            refY="3.5"
            orient="auto"
          >
            <path d="M0,1 L6,3.5 L0,6 Z" fill="#DC2626" />
          </marker>
        </defs>

        {/* Title */}
        <text
          x={W / 2}
          y={18}
          textAnchor="middle"
          className="fill-slate-900 dark:fill-slate-100 text-[13px] font-bold"
        >
          N 型半导体费米能级 EF 随温度 T 的三区间演变规律
        </text>

        {/* 3 Shaded Regime Regions */}
        <rect
          x={mapX(0)}
          y={pad.t}
          width={mapX(140) - mapX(0)}
          height={H - pad.t - pad.b}
          className="fill-emerald-500/[0.08] dark:fill-emerald-500/[0.10]"
        />
        <rect
          x={mapX(140)}
          y={pad.t}
          width={mapX(440) - mapX(140)}
          height={H - pad.t - pad.b}
          className="fill-sky-500/[0.07] dark:fill-sky-500/[0.08]"
        />
        <rect
          x={mapX(440)}
          y={pad.t}
          width={mapX(650) - mapX(440)}
          height={H - pad.t - pad.b}
          className="fill-amber-500/[0.09] dark:fill-amber-500/[0.09]"
        />

        {/* Axes */}
        <line
          x1={pad.l}
          y1={pad.t}
          x2={pad.l}
          y2={H - pad.b}
          className="stroke-slate-500 dark:stroke-slate-500"
          strokeWidth="1.3"
        />
        <line
          x1={pad.l}
          y1={H - pad.b}
          x2={W - pad.r}
          y2={H - pad.b}
          className="stroke-slate-500 dark:stroke-slate-500"
          strokeWidth="1.3"
        />

        {/* 5 Horizontal Reference Levels: Ec, (Ec+ED)/2, ED, Ei, Ev */}
        {/* Ec */}
        <line
          x1={pad.l}
          y1={mapY(Ec)}
          x2={W - pad.r}
          y2={mapY(Ec)}
          className="stroke-slate-900 dark:stroke-slate-100"
          strokeWidth="2.4"
        />
        <text
          x={W - pad.r + 8}
          y={mapY(Ec) + 4}
          className="fill-slate-900 dark:fill-slate-100 text-[12px] font-mono font-bold"
        >
          Ec
        </text>

        {/* (Ec+ED)/2 */}
        <line
          x1={pad.l}
          y1={mapY(mid)}
          x2={W - pad.r}
          y2={mapY(mid)}
          className="stroke-slate-400 dark:stroke-slate-500"
          strokeWidth="1.2"
          strokeDasharray="2 3"
        />
        <text
          x={pad.l - 8}
          y={mapY(mid) + 4}
          textAnchor="end"
          className="fill-slate-500 dark:fill-slate-400 text-[11px] font-mono"
        >
          (Ec+ED)/2
        </text>

        {/* ED */}
        <line
          x1={pad.l}
          y1={mapY(ED)}
          x2={W - pad.r}
          y2={mapY(ED)}
          stroke="#0284C7"
          className="dark:stroke-sky-400"
          strokeWidth="1.8"
          strokeDasharray="6 4"
        />
        <text
          x={W - pad.r + 8}
          y={mapY(ED) + 4}
          className="fill-sky-600 dark:fill-sky-400 text-[12px] font-mono font-bold"
        >
          ED
        </text>

        {/* Ei */}
        <line
          x1={pad.l}
          y1={mapY(Ei)}
          x2={W - pad.r}
          y2={mapY(Ei)}
          className="stroke-slate-600 dark:stroke-slate-400"
          strokeWidth="1.7"
          strokeDasharray="8 4 2 4"
        />
        <text
          x={W - pad.r + 8}
          y={mapY(Ei) + 4}
          className="fill-slate-600 dark:fill-slate-300 text-[12px] font-mono font-bold"
        >
          Ei
        </text>

        {/* Ev */}
        <line
          x1={pad.l}
          y1={mapY(Ev)}
          x2={W - pad.r}
          y2={mapY(Ev)}
          className="stroke-slate-900 dark:stroke-slate-100"
          strokeWidth="2.4"
        />
        <text
          x={W - pad.r + 8}
          y={mapY(Ev) + 4}
          className="fill-slate-900 dark:fill-slate-100 text-[12px] font-mono font-bold"
        >
          Ev
        </text>

        {/* Region Annotations */}
        <text
          x={mapX(70)}
          y={mapY(0.24)}
          textAnchor="middle"
          className="fill-emerald-700 dark:fill-emerald-300 text-[11px] font-semibold"
        >
          ① 低温弱电离区
        </text>
        <text
          x={mapX(70)}
          y={mapY(0.16)}
          textAnchor="middle"
          className="fill-emerald-700 dark:fill-emerald-300 text-[10.5px]"
        >
          (先微升后下降)
        </text>

        <text
          x={mapX(290)}
          y={mapY(0.24)}
          textAnchor="middle"
          className="fill-sky-700 dark:fill-sky-300 text-[11px] font-semibold"
        >
          ② 杂质饱和电离区 &amp; 过渡区
        </text>
        <text
          x={mapX(290)}
          y={mapY(0.16)}
          textAnchor="middle"
          className="fill-sky-700 dark:fill-sky-300 text-[10.5px]"
        >
          (EF 位于 ED 下方并向 Ei 靠拢)
        </text>

        <text
          x={mapX(545)}
          y={mapY(0.24)}
          textAnchor="middle"
          className="fill-amber-700 dark:fill-amber-300 text-[11px] font-semibold"
        >
          ③ 高温本征激发区
        </text>
        <text
          x={mapX(545)}
          y={mapY(0.16)}
          textAnchor="middle"
          className="fill-amber-700 dark:fill-amber-300 text-[10.5px]"
        >
          (EF ≈ Ei)
        </text>

        {/* X Axis Ticks */}
        {[0, 100, 200, 300, 400, 500, 600].map((t) => {
          const tx = mapX(t);
          return (
            <g key={t}>
              <line
                x1={tx}
                y1={H - pad.b}
                x2={tx}
                y2={H - pad.b + 4}
                className="stroke-slate-500"
                strokeWidth="1"
              />
              <text
                x={tx}
                y={H - pad.b + 17}
                textAnchor="middle"
                className="fill-slate-600 dark:fill-slate-300 text-[10.5px] font-mono"
              >
                {t}
              </text>
            </g>
          );
        })}

        <text
          x={(pad.l + W - pad.r) / 2}
          y={H - 8}
          textAnchor="middle"
          className="fill-slate-700 dark:fill-slate-300 text-[11.5px] font-medium"
        >
          温度 T (K)
        </text>
        <text
          x={20}
          y={H / 2}
          textAnchor="middle"
          transform={`rotate(-90 20 ${H / 2})`}
          className="fill-slate-700 dark:fill-slate-300 text-[11.5px] font-medium"
        >
          能量 E
        </text>

        {/* EF(T) Main Curve */}
        <path
          d={efPath}
          fill="none"
          stroke="#DC2626"
          className="dark:stroke-rose-400"
          strokeWidth="3.2"
          strokeLinecap="round"
        />

        {/* Peak Hump Marker & Label */}
        <circle
          cx={mapX(peakT)}
          cy={mapY(peakVal)}
          r="4.5"
          fill="#DC2626"
          className="dark:fill-rose-400"
        />
        <line
          x1={mapX(95)}
          y1={mapY(0.955)}
          x2={mapX(peakT) + 7}
          y2={mapY(peakVal) - 2}
          stroke="#DC2626"
          strokeWidth="1.5"
          markerEnd="url(#peak-arrow)"
        />
        <text
          x={mapX(100)}
          y={mapY(0.952)}
          className="fill-red-600 dark:fill-rose-400 text-[11.5px] font-bold"
        >
          极大值点 (Nc = 0.11 ND)
        </text>
      </svg>
      </ZoomablePanel>
    </div>
  );
}
