import React from 'react';
import { TrendingUp } from 'lucide-react';
import { sampleCurve, createMapper } from './svgHelpers';
import { ZoomFigureButton, ZoomablePanel } from './ZoomableFigure';

export default function Fig4Conductivity() {
  const W = 380;
  const H = 310;
  const pad = { l: 46, r: 20, t: 36, b: 40 };

  // Panel (a) rho - T
  const mapXa = createMapper(0, 10, pad.l, W - pad.r);
  const mapYa = createMapper(0, 10, H - pad.b, pad.t);
  const intrinsicRhoFn = (t) => 9.8 * Math.exp(-0.22 * (t - 2.6));
  const extrinsicRhoFn = (t) => {
    // N-shaped curve: A(0.5, 6.2) -> B(3.5, 3.6) -> C(6.7, 5.2) -> D(9.5, 0.7)
    const ab = 6.4 - 2.6 * Math.sin((Math.PI * (t - 0.5)) / 6.0);
    if (t <= 3.5) {
      const u = (t - 0.5) / 3.0;
      return 6.3 - 3.6 * u + 1.0 * u * u;
    }
    if (t <= 6.7) {
      const u = (t - 3.5) / 3.2;
      return 3.7 + 1.55 * (3 * u * u - 2 * u * u * u);
    }
    const u = (t - 6.7) / 2.8;
    return 5.25 - 4.65 * Math.pow(u, 1.35);
  };
  // Smooth continuous polynomial-like spline for extrinsic rho(T)
  const smoothExtrinsicFn = (t) => {
    // Cubic-like smooth wave anchored at A(0.5,6.2), B(3.5,3.7), C(6.7,5.2), D(9.4,0.8)
    const p1 = 5.9 * Math.exp(-0.62 * t) + 1.9;
    const bump = 3.2 * Math.exp(-Math.pow((t - 6.5) / 1.75, 2));
    const drop = 4.6 / (1 + Math.exp(-(t - 7.6) / 0.68));
    return Math.max(0.6, p1 + bump - drop + 0.55);
  };

  // Panel (b) mu - T (peak curve: left T^(3/2), right T^(-3/2))
  const mapXb = createMapper(0, 10, pad.l, W - pad.r);
  const mapYb = createMapper(0, 10, H - pad.b, pad.t);
  const muTFn = (t) => {
    const tr = Math.max(0.15, t / 2.4);
    // Matthiessen: 1 / (a * T^(-3/2) + b * T^(3/2))
    const inv = 0.055 * Math.pow(tr, -1.5) + 0.055 * Math.pow(tr, 1.5);
    return 1 / inv;
  };

  // Panel (c) mu - Ni (log-log plot: x from log10(1e14)=14 to 19, y from log10(50)=1.7 to log10(3000)=3.48)
  const mapXc = createMapper(13.6, 19.2, pad.l, W - pad.r);
  const mapYc = createMapper(1.68, 3.45, H - pad.b, pad.t);
  // Caughey-Thomas model for Silicon at 300K
  const muNLogFn = (logN) => {
    const N = Math.pow(10, logN);
    const mu = 92 + (1360 - 92) / (1 + Math.pow(N / 1.3e17, 0.91));
    return Math.log10(mu);
  };
  const muPLogFn = (logN) => {
    const N = Math.pow(10, logN);
    const mu = 54 + (495 - 54) / (1 + Math.pow(N / 2.3e17, 0.88));
    return Math.log10(mu);
  };

  const aPts = [
    { t: 0.5, label: 'A', dx: 0, dy: -11 },
    { t: 3.4, label: 'B', dx: 0, dy: 16 },
    { t: 6.45, label: 'C', dx: 0, dy: -11 },
    { t: 9.4, label: 'D', dx: 11, dy: 4 },
  ];

  return (
    <div className="rounded-2xl border border-[#0D9488]/30 bg-white dark:bg-[#0B1120]/95 p-4 sm:p-5 space-y-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
          <TrendingUp className="w-4 h-4 text-[#0D9488]" />
          <span>图 4-1：本征/杂质半导体电阻率 ρ-T 曲线（2026 真题）及迁移率 μ-T、μ-Ni 特性曲线</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/25">
            2026 真题第二大题核心图
          </span>
          <ZoomFigureButton
            title="图 4-1：本征/杂质半导体 ρ-T 曲线（2026 真题）及 μ-T、μ-Ni 特性曲线"
            badge="图 4-1 全图"
            label="放大全图"
            renderModalContent={() => <Fig4Conductivity />}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Panel (a) rho - T */}
        <ZoomablePanel
          title="(a) ρ-T 特性曲线 (2026真题)"
          badge="图 4-1(a) 放大"
          className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-[#060A13]/70 p-2.5"
        >
          <svg
            viewBox={`0 0 ${W} ${H}`}
            className="w-full h-auto select-none"
            role="img"
            aria-label="电阻率随温度变化曲线"
          >
            <text
              x={W / 2 + 8}
              y={18}
              textAnchor="middle"
              className="fill-slate-900 dark:fill-slate-100 text-[12.5px] font-bold"
            >
              (a) ρ-T 特性曲线 (2026真题)
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

            <text
              x={16}
              y={H / 2}
              textAnchor="middle"
              transform={`rotate(-90 16 ${H / 2})`}
              className="fill-slate-600 dark:fill-slate-300 text-[11px]"
            >
              电阻率 ρ
            </text>
            <text
              x={(pad.l + W - pad.r) / 2}
              y={H - 12}
              textAnchor="middle"
              className="fill-slate-600 dark:fill-slate-300 text-[11px]"
            >
              温度 T
            </text>

            {/* Intrinsic dashed curve */}
            <path
              d={sampleCurve(intrinsicRhoFn, 3.6, 9.5, 80, mapXa, mapYa)}
              fill="none"
              stroke="#0284C7"
              className="dark:stroke-sky-400"
              strokeWidth="2.4"
              strokeDasharray="7 4"
            />

            {/* Extrinsic N-shaped curve */}
            <path
              d={sampleCurve(smoothExtrinsicFn, 0.5, 9.4, 120, mapXa, mapYa)}
              fill="none"
              stroke="#DC2626"
              className="dark:stroke-rose-400"
              strokeWidth="2.8"
              strokeLinecap="round"
            />

            {/* A, B, C, D markers */}
            {aPts.map((pt) => {
              const cx = mapXa(pt.t);
              const cy = mapYa(smoothExtrinsicFn(pt.t));
              return (
                <g key={pt.label}>
                  <circle
                    cx={cx}
                    cy={cy}
                    r="4"
                    className="fill-slate-900 dark:fill-white"
                  />
                  <text
                    x={cx + pt.dx}
                    y={cy + pt.dy}
                    textAnchor="middle"
                    className="fill-slate-900 dark:fill-white text-[12px] font-mono font-bold"
                  >
                    {pt.label}
                  </text>
                </g>
              );
            })}

            {/* Segment labels */}
            <text
              x={mapXa(2.1)}
              y={mapYa(2.9)}
              textAnchor="middle"
              className="fill-[#0D9488] dark:fill-teal-300 text-[10.5px] font-semibold"
            >
              AB 弱电离
            </text>
            <text
              x={mapXa(4.9)}
              y={mapYa(5.7)}
              textAnchor="middle"
              className="fill-amber-600 dark:fill-amber-300 text-[10.5px] font-semibold"
            >
              BC 饱和电离
            </text>
            <text
              x={mapXa(7.35)}
              y={mapYa(2.6)}
              textAnchor="middle"
              className="fill-red-600 dark:fill-rose-400 text-[10.5px] font-semibold"
            >
              CD 本征区
            </text>

            {/* Legend */}
            <g transform={`translate(${W - 148}, ${pad.t + 6})`}>
              <line
                x1="0"
                y1="6"
                x2="22"
                y2="6"
                stroke="#0284C7"
                strokeWidth="2.2"
                strokeDasharray="5 3"
              />
              <text
                x="28"
                y="10"
                className="fill-slate-700 dark:fill-slate-200 text-[10.5px]"
              >
                本征半导体
              </text>
              <line
                x1="0"
                y1="24"
                x2="22"
                y2="24"
                stroke="#DC2626"
                strokeWidth="2.4"
              />
              <text
                x="28"
                y="28"
                className="fill-slate-700 dark:fill-slate-200 text-[10.5px]"
              >
                杂质半导体
              </text>
            </g>
          </svg>
        </ZoomablePanel>

        {/* Panel (b) mu - T */}
        <ZoomablePanel
          title="(b) 迁移率 μ 随温度 T 变化"
          badge="图 4-1(b) 放大"
          className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-[#060A13]/70 p-2.5"
        >
          <svg
            viewBox={`0 0 ${W} ${H}`}
            className="w-full h-auto select-none"
            role="img"
            aria-label="迁移率随温度变化单峰曲线"
          >
            <text
              x={W / 2 + 8}
              y={18}
              textAnchor="middle"
              className="fill-slate-900 dark:fill-slate-100 text-[12.5px] font-bold"
            >
              (b) 迁移率 μ 随温度 T 变化
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

            <text
              x={16}
              y={H / 2}
              textAnchor="middle"
              transform={`rotate(-90 16 ${H / 2})`}
              className="fill-slate-600 dark:fill-slate-300 text-[11px]"
            >
              迁移率 μ
            </text>
            <text
              x={(pad.l + W - pad.r) / 2}
              y={H - 12}
              textAnchor="middle"
              className="fill-slate-600 dark:fill-slate-300 text-[11px]"
            >
              温度 T
            </text>

            {/* Vertical peak dotted reference */}
            <line
              x1={mapXb(2.4)}
              y1={pad.t}
              x2={mapXb(2.4)}
              y2={H - pad.b}
              className="stroke-slate-400 dark:stroke-slate-600"
              strokeWidth="1.2"
              strokeDasharray="2 3"
            />

            {/* Single peak mu(T) curve */}
            <path
              d={sampleCurve(muTFn, 0.65, 9.5, 130, mapXb, mapYb)}
              fill="none"
              stroke="#0D9488"
              className="dark:stroke-teal-400"
              strokeWidth="2.8"
              strokeLinecap="round"
            />

            {/* Left & Right scattering regime annotations */}
            <text
              x={mapXb(1.4)}
              y={mapYb(1.3)}
              className="fill-sky-600 dark:fill-sky-400 text-[10.5px] font-semibold"
            >
              电离杂质散射
            </text>
            <text
              x={mapXb(1.4)}
              y={mapYb(0.6)}
              className="fill-sky-600 dark:fill-sky-400 text-[10.5px] font-mono"
            >
              μ ∝ T^(3/2)
            </text>

            <text
              x={mapXb(5.2)}
              y={mapYb(5.2)}
              className="fill-amber-600 dark:fill-amber-300 text-[10.5px] font-semibold"
            >
              晶格振动散射
            </text>
            <text
              x={mapXb(5.2)}
              y={mapYb(4.5)}
              className="fill-amber-600 dark:fill-amber-300 text-[10.5px] font-mono"
            >
              μ ∝ T^(-3/2)
            </text>
          </svg>
        </ZoomablePanel>

        {/* Panel (c) mu - Ni */}
        <ZoomablePanel
          title="(c) 硅中迁移率随掺杂浓度变化"
          badge="图 4-1(c) 放大"
          className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-[#060A13]/70 p-2.5"
        >
          <svg
            viewBox={`0 0 ${W} ${H}`}
            className="w-full h-auto select-none"
            role="img"
            aria-label="硅中迁移率随掺杂浓度变化曲线"
          >
            <text
              x={W / 2 + 8}
              y={18}
              textAnchor="middle"
              className="fill-slate-900 dark:fill-slate-100 text-[12.5px] font-bold"
            >
              (c) 硅中迁移率随掺杂浓度变化
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

            {/* Y log ticks */}
            {[
              { val: 2, label: '10²' },
              { val: 3, label: '10³' },
            ].map((tk) => (
              <g key={tk.label}>
                <line
                  x1={pad.l - 4}
                  y1={mapYc(tk.val)}
                  x2={pad.l}
                  y2={mapYc(tk.val)}
                  className="stroke-slate-500"
                  strokeWidth="1"
                />
                <text
                  x={pad.l - 7}
                  y={mapYc(tk.val) + 3.5}
                  textAnchor="end"
                  className="fill-slate-500 dark:fill-slate-400 text-[10.5px] font-mono"
                >
                  {tk.label}
                </text>
              </g>
            ))}

            {/* X log ticks */}
            {[14, 15, 16, 17, 18, 19].map((exp) => (
              <g key={exp}>
                <line
                  x1={mapXc(exp)}
                  y1={H - pad.b}
                  x2={mapXc(exp)}
                  y2={H - pad.b + 4}
                  className="stroke-slate-500"
                  strokeWidth="1"
                />
                <text
                  x={mapXc(exp)}
                  y={H - pad.b + 16}
                  textAnchor="middle"
                  className="fill-slate-500 dark:fill-slate-400 text-[10px] font-mono"
                >
                  10^{exp}
                </text>
              </g>
            ))}

            <text
              x={15}
              y={H / 2}
              textAnchor="middle"
              transform={`rotate(-90 15 ${H / 2})`}
              className="fill-slate-600 dark:fill-slate-300 text-[10.5px]"
            >
              迁移率 μ (cm²/V·s)
            </text>
            <text
              x={(pad.l + W - pad.r) / 2}
              y={H - 8}
              textAnchor="middle"
              className="fill-slate-600 dark:fill-slate-300 text-[10.5px]"
            >
              杂质浓度 Ni (1/cm³)
            </text>

            {/* Electron mu_n */}
            <path
              d={sampleCurve(muNLogFn, 14, 19, 100, mapXc, mapYc)}
              fill="none"
              stroke="#0284C7"
              className="dark:stroke-sky-400"
              strokeWidth="2.8"
              strokeLinecap="round"
            />

            {/* Hole mu_p */}
            <path
              d={sampleCurve(muPLogFn, 14, 19, 100, mapXc, mapYc)}
              fill="none"
              stroke="#7C3AED"
              className="dark:stroke-violet-400"
              strokeWidth="2.8"
              strokeLinecap="round"
            />

            {/* Legend */}
            <g transform={`translate(${pad.l + 12}, ${H - pad.b - 48})`}>
              <rect
                x="-4"
                y="-4"
                width="96"
                height="40"
                rx="6"
                className="fill-white/90 dark:fill-slate-900/90 stroke-slate-200 dark:stroke-slate-700"
              />
              <line
                x1="4"
                y1="9"
                x2="24"
                y2="9"
                stroke="#0284C7"
                strokeWidth="2.6"
              />
              <text
                x="30"
                y="13"
                className="fill-slate-700 dark:fill-slate-200 text-[10.5px]"
              >
                电子 μn
              </text>
              <line
                x1="4"
                y1="25"
                x2="24"
                y2="25"
                stroke="#7C3AED"
                strokeWidth="2.6"
              />
              <text
                x="30"
                y="29"
                className="fill-slate-700 dark:fill-slate-200 text-[10.5px]"
              >
                空穴 μp
              </text>
            </g>
          </svg>
        </ZoomablePanel>
      </div>
    </div>
  );
}
