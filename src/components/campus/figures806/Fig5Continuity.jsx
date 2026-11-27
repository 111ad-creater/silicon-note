import React from 'react';
import { LineChart } from 'lucide-react';
import { sampleCurve, createMapper } from './svgHelpers';
import { ZoomFigureButton, ZoomablePanel } from './ZoomableFigure';

/**
 * 图 5-1：连续性方程三大经典物理图像
 * mode: 'all' (Chapter 5) | 'ex1' (脉冲 + 掺金) | 'ex2' (指数光生表面复合) | 'ex3' (10τ方波) | 'ex4' (半边光照)
 */
export default function Fig5Continuity({ mode = 'all' }) {
  const showPulse = mode === 'all' || mode === 'ex1' || mode === 'ex3';
  const showHalf = mode === 'all' || mode === 'ex4';
  const showGold = mode === 'all' || mode === 'ex1';
  const showExpSurf = mode === 'ex2';

  const W = 380;
  const H = 310;
  const pad = { l: 48, r: 22, t: 36, b: 40 };

  // Panel (a): Pulse illumination & decay
  const pulseWidth = mode === 'ex3' ? 10 : 4;
  const pulseMaxT = mode === 'ex3' ? 20 : 9;
  const mapXp = createMapper(0, pulseMaxT, pad.l, W - pad.r);
  const mapYp = createMapper(-0.04, 1.12, H - pad.b, pad.t);
  const peakAtOff = 1 - Math.exp(-pulseWidth);

  // Panel (b): Half-side uniform illumination
  const mapXh = createMapper(-3.6, 3.6, pad.l, W - pad.r);
  const mapYh = createMapper(-0.04, 1.08, H - pad.b, pad.t);

  // Panel (d) for Example 2: Exponential absorption with Sp=0, finite Sp, Sp->inf
  // alpha * Lp = 2.5 => K = alpha*Phi0*tau / (1 - 6.25) < 0, Delta p(x) = [2.5 / (6.25 - 1)] * [ratio*e^(-x) - e^(-2.5x)]
  const expDist = (SpRatio) => (x) => {
    const aLp = 2.5;
    const pref = aLp / (aLp * aLp - 1); // 2.5 / 5.25
    const bFactor =
      SpRatio === Infinity ? 1 : (SpRatio + aLp) / (SpRatio + 1);
    return pref * (bFactor * Math.exp(-x) - Math.exp(-aLp * x));
  };
  const mapXe = createMapper(0, 4.0, pad.l, W - pad.r);
  const mapYe = createMapper(-0.02, 0.48, H - pad.b, pad.t);

  const gridCols =
    mode === 'all'
      ? 'grid-cols-1 lg:grid-cols-3'
      : mode === 'ex1'
        ? 'grid-cols-1 md:grid-cols-2'
        : 'grid-cols-1 max-w-xl';

  const headerTitle =
    mode === 'all'
      ? '图 5-1：连续性方程三大经典物理图像（脉冲光照衰退、半边光照稳态分布、掺金复合能级图）'
      : mode === 'ex1'
        ? '例题 1 核心图像：脉冲光瞬态响应 & 掺金 n 型硅复合能级图（对照图 5-1(a)(c)）'
        : mode === 'ex2'
          ? '例题 2 解析曲线：指数光生率 g(x)=αΦ0e^(-αx) 下不同表面复合速度 Sp 的 Δp(x) 分布'
          : mode === 'ex3'
            ? '例题 3 响应曲线：方波光照 (0~10τp 开灯，10τp~20τp 关灯) 少子时间响应'
            : '例题 4 核心图像：半边均匀光照下 x=0 连续光滑稳态分布（对照图 5-1(b)）';

  return (
    <div className="rounded-2xl border border-[#0D9488]/30 bg-white dark:bg-[#0B1120]/95 p-4 sm:p-5 space-y-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
          <LineChart className="w-4 h-4 text-[#0D9488]" />
          <span>{headerTitle}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-[#0D9488]/12 text-[#0F766E] dark:text-teal-300 border border-[#0D9488]/25">
            精确解析函数绘制
          </span>
          <ZoomFigureButton
            title={headerTitle}
            badge="图 5-1 全图"
            label="放大全图"
            renderModalContent={() => <Fig5Continuity mode={mode} />}
          />
        </div>
      </div>

      <div className={`grid ${gridCols} gap-4`}>
        {/* Panel (a): Pulse Rise & Decay */}
        {showPulse && (
          <ZoomablePanel
            title={
              mode === 'ex3'
                ? '方波光照响应 (Δt = 10τp)'
                : '(a) 脉冲光照响应与光电导衰退法'
            }
            badge="脉冲响应放大"
            className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-[#060A13]/70 p-2.5"
          >
            <svg
              viewBox={`0 0 ${W} ${H}`}
              className="w-full h-auto select-none"
              role="img"
              aria-label="脉冲光照响应与光电导衰退法"
            >
              <defs>
                <marker
                  id={`pulse-arr-${mode}`}
                  markerWidth="7"
                  markerHeight="7"
                  refX="5"
                  refY="3.5"
                  orient="auto"
                >
                  <path d="M0,1 L6,3.5 L0,6 Z" fill="#DC2626" />
                </marker>
              </defs>

              <text
                x={W / 2 + 8}
                y={18}
                textAnchor="middle"
                className="fill-slate-900 dark:fill-slate-100 text-[12px] font-bold"
              >
                {mode === 'ex3'
                  ? '方波光照响应 (Δt = 10τp)'
                  : '(a) 脉冲光照响应与光电导衰退法'}
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

              {/* Horizontal g0*tau asymptote */}
              <line
                x1={pad.l}
                y1={mapYp(1)}
                x2={W - pad.r}
                y2={mapYp(1)}
                className="stroke-slate-400 dark:stroke-slate-600"
                strokeWidth="1.2"
                strokeDasharray="2 3"
              />
              <text
                x={pad.l - 7}
                y={mapYp(1) + 4}
                textAnchor="end"
                className="fill-slate-600 dark:fill-slate-300 text-[10.5px] font-mono"
              >
                g0·τ
              </text>
              <text
                x={pad.l - 7}
                y={mapYp(0) + 4}
                textAnchor="end"
                className="fill-slate-600 dark:fill-slate-300 text-[10.5px] font-mono"
              >
                0
              </text>

              {/* Vertical turn-off line */}
              <line
                x1={mapXp(pulseWidth)}
                y1={pad.t}
                x2={mapXp(pulseWidth)}
                y2={H - pad.b}
                className="stroke-slate-400 dark:stroke-slate-600"
                strokeWidth="1.2"
                strokeDasharray="4 3"
              />

              {/* Rise curve */}
              <path
                d={sampleCurve(
                  (t) => 1 - Math.exp(-t),
                  0,
                  pulseWidth,
                  90,
                  mapXp,
                  mapYp
                )}
                fill="none"
                stroke="#0284C7"
                className="dark:stroke-sky-400"
                strokeWidth="2.8"
              />
              {/* Decay curve */}
              <path
                d={sampleCurve(
                  (t) => peakAtOff * Math.exp(-(t - pulseWidth)),
                  pulseWidth,
                  pulseMaxT,
                  90,
                  mapXp,
                  mapYp
                )}
                fill="none"
                stroke="#0D9488"
                className="dark:stroke-teal-400"
                strokeWidth="2.8"
              />

              {/* Key marker dots */}
              {mode === 'ex3' ? (
                <>
                  <circle
                    cx={mapXp(2)}
                    cy={mapYp(1 - Math.exp(-2))}
                    r="4"
                    fill="#DC2626"
                  />
                  <text
                    x={mapXp(2.5)}
                    y={mapYp(0.84)}
                    className="fill-red-600 dark:fill-rose-400 text-[10px] font-mono font-bold"
                  >
                    t=2τp: 0.865 gpτp
                  </text>
                  <circle
                    cx={mapXp(12)}
                    cy={mapYp(peakAtOff * Math.exp(-2))}
                    r="4"
                    fill="#DC2626"
                  />
                  <text
                    x={mapXp(12.6)}
                    y={mapYp(0.24)}
                    className="fill-red-600 dark:fill-rose-400 text-[10px] font-mono font-bold"
                  >
                    t=12τp: 0.135 gpτp
                  </text>
                </>
              ) : (
                <>
                  <circle
                    cx={mapXp(pulseWidth)}
                    cy={mapYp(peakAtOff)}
                    r="4"
                    fill="#DC2626"
                  />
                  <circle
                    cx={mapXp(pulseWidth + 1)}
                    cy={mapYp(peakAtOff * Math.exp(-1))}
                    r="4"
                    fill="#DC2626"
                  />
                  <line
                    x1={mapXp(6.8)}
                    y1={mapYp(0.55)}
                    x2={mapXp(pulseWidth + 1) + 7}
                    y2={mapYp(peakAtOff * Math.exp(-1)) - 5}
                    stroke="#DC2626"
                    strokeWidth="1.4"
                    markerEnd={`url(#pulse-arr-${mode})`}
                  />
                  <text
                    x={mapXp(6.8)}
                    y={mapYp(0.66)}
                    textAnchor="middle"
                    className="fill-red-600 dark:fill-rose-400 text-[10.5px] font-bold"
                  >
                    降至初值 1/e
                  </text>
                  <text
                    x={mapXp(6.8)}
                    y={mapYp(0.58)}
                    textAnchor="middle"
                    className="fill-red-600 dark:fill-rose-400 text-[10.5px] font-bold"
                  >
                    测得寿命 τ
                  </text>
                </>
              )}

              {/* X ticks */}
              {(mode === 'ex3'
                ? [
                    { t: 0, lbl: '0' },
                    { t: 2, lbl: '2τp' },
                    { t: 10, lbl: '10τp' },
                    { t: 12, lbl: '12τp' },
                    { t: 20, lbl: '20τp' },
                  ]
                : [
                    { t: 0, lbl: '0' },
                    { t: 4, lbl: '4τ' },
                    { t: 5, lbl: '5τ' },
                    { t: 8, lbl: '8τ' },
                  ]
              ).map((tk) => (
                <text
                  key={tk.lbl}
                  x={mapXp(tk.t)}
                  y={H - pad.b + 16}
                  textAnchor="middle"
                  className="fill-slate-600 dark:fill-slate-300 text-[10px] font-mono"
                >
                  {tk.lbl}
                </text>
              ))}

              <text
                x={16}
                y={H / 2}
                textAnchor="middle"
                transform={`rotate(-90 16 ${H / 2})`}
                className="fill-slate-600 dark:fill-slate-300 text-[11px] font-mono"
              >
                Δp(t)
              </text>
              <text
                x={(pad.l + W - pad.r) / 2}
                y={H - 8}
                textAnchor="middle"
                className="fill-slate-600 dark:fill-slate-300 text-[11px]"
              >
                时间 t
              </text>

              {/* Legend */}
              <g transform={`translate(${W - 122}, ${pad.t + 12})`}>
                <line
                  x1="0"
                  y1="6"
                  x2="18"
                  y2="6"
                  stroke="#0284C7"
                  strokeWidth="2.4"
                />
                <text
                  x="24"
                  y="10"
                  className="fill-slate-700 dark:fill-slate-200 text-[10px]"
                >
                  光照增长段
                </text>
                <line
                  x1="0"
                  y1="22"
                  x2="18"
                  y2="22"
                  stroke="#0D9488"
                  strokeWidth="2.4"
                />
                <text
                  x="24"
                  y="26"
                  className="fill-slate-700 dark:fill-slate-200 text-[10px]"
                >
                  撤光衰退段
                </text>
              </g>
            </svg>
          </ZoomablePanel>
        )}

        {/* Panel (b): Half-side uniform illumination */}
        {showHalf && (
          <ZoomablePanel
            title="(b) 半边均匀光照稳态分布"
            badge="图 5-1(b) 放大"
            className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-[#060A13]/70 p-2.5"
          >
            <svg
              viewBox={`0 0 ${W} ${H}`}
              className="w-full h-auto select-none"
              role="img"
              aria-label="半边均匀光照稳态分布"
            >
              <text
                x={W / 2 + 8}
                y={18}
                textAnchor="middle"
                className="fill-slate-900 dark:fill-slate-100 text-[12px] font-bold"
              >
                (b) 半边均匀光照稳态分布
              </text>

              {/* Illuminated left half shading */}
              <rect
                x={pad.l}
                y={pad.t}
                width={mapXh(0) - pad.l}
                height={H - pad.t - pad.b}
                className="fill-amber-500/[0.11] dark:fill-amber-500/[0.12]"
              />

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

              {/* x = 0 dividing line */}
              <line
                x1={mapXh(0)}
                y1={pad.t}
                x2={mapXh(0)}
                y2={H - pad.b}
                className="stroke-slate-700 dark:stroke-slate-300"
                strokeWidth="1.4"
                strokeDasharray="4 3"
              />

              {/* Y labels */}
              {[
                { val: 1, lbl: 'g0τp' },
                { val: 0.5, lbl: '0.5 g0τp' },
                { val: 0, lbl: '0' },
              ].map((tk) => (
                <text
                  key={tk.lbl}
                  x={pad.l - 6}
                  y={mapYh(tk.val) + 4}
                  textAnchor="end"
                  className="fill-slate-600 dark:fill-slate-300 text-[10px] font-mono"
                >
                  {tk.lbl}
                </text>
              ))}

              {/* X labels */}
              {[
                { x: -3, lbl: '-3Lp' },
                { x: 0, lbl: '0' },
                { x: 3, lbl: '+3Lp' },
              ].map((tk) => (
                <text
                  key={tk.lbl}
                  x={mapXh(tk.x)}
                  y={H - pad.b + 16}
                  textAnchor="middle"
                  className="fill-slate-600 dark:fill-slate-300 text-[10px] font-mono"
                >
                  {tk.lbl}
                </text>
              ))}

              <text
                x={(pad.l + W - pad.r) / 2}
                y={H - 8}
                textAnchor="middle"
                className="fill-slate-600 dark:fill-slate-300 text-[11px]"
              >
                空间位置 x
              </text>

              {/* Left illuminated curve: g0*tau * (1 - 0.5 e^x) */}
              <path
                d={sampleCurve(
                  (x) => 1 - 0.5 * Math.exp(x),
                  -3.6,
                  0,
                  80,
                  mapXh,
                  mapYh
                )}
                fill="none"
                stroke="#D97706"
                className="dark:stroke-amber-400"
                strokeWidth="2.8"
              />
              {/* Right dark curve: 0.5 * g0*tau * e^(-x) */}
              <path
                d={sampleCurve((x) => 0.5 * Math.exp(-x), 0, 3.6, 80, mapXh, mapYh)}
                fill="none"
                stroke="#0284C7"
                className="dark:stroke-sky-400"
                strokeWidth="2.8"
              />

              {/* Continuity point at x=0 */}
              <circle cx={mapXh(0)} cy={mapYh(0.5)} r="4.5" fill="#DC2626" />
              <text
                x={mapXh(0.18)}
                y={mapYh(0.51)}
                className="fill-red-600 dark:fill-rose-400 text-[10.5px] font-bold"
              >
                0.5·g0τp (连续且光滑)
              </text>

              <text
                x={mapXh(-1.8)}
                y={mapYh(0.32)}
                textAnchor="middle"
                className="fill-amber-700 dark:fill-amber-300 text-[11px] font-semibold"
              >
                均匀光照区 (g0)
              </text>
              <text
                x={mapXh(1.85)}
                y={mapYh(0.75)}
                textAnchor="middle"
                className="fill-sky-600 dark:fill-sky-400 text-[11px] font-semibold"
              >
                暗区纯扩散复合
              </text>
            </svg>
          </ZoomablePanel>
        )}

        {/* Panel (c): Gold-doped n-Si Energy Level Diagram */}
        {showGold && (
          <ZoomablePanel
            title="(c) 掺金 n 型硅复合能级图 (τ = 1/rpNt)"
            badge="图 5-1(c) 放大"
            className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-[#060A13]/70 p-2.5"
          >
            <svg
              viewBox={`0 0 ${W} ${H}`}
              className="w-full h-auto select-none"
              role="img"
              aria-label="掺金 n 型硅复合能级图"
            >
              <defs>
                <marker
                  id={`g-arr-green-${mode}`}
                  markerWidth="7"
                  markerHeight="7"
                  refX="5"
                  refY="3.5"
                  orient="auto"
                >
                  <path d="M0,1 L6,3.5 L0,6 Z" fill="#0D9488" />
                </marker>
                <marker
                  id={`g-arr-red-${mode}`}
                  markerWidth="7"
                  markerHeight="7"
                  refX="5"
                  refY="3.5"
                  orient="auto"
                >
                  <path d="M0,1 L6,3.5 L0,6 Z" fill="#DC2626" />
                </marker>
              </defs>

              <text
                x={W / 2}
                y={18}
                textAnchor="middle"
                className="fill-slate-900 dark:fill-slate-100 text-[12px] font-bold"
              >
                (c) 掺金 n 型硅复合能级图 (τ = 1/rpNt)
              </text>

              {/* Conduction Band shaded region */}
              <rect
                x={32}
                y={40}
                width={306}
                height={34}
                className="fill-sky-500/15 dark:fill-sky-500/20"
              />
              <text
                x={185}
                y={61}
                textAnchor="middle"
                className="fill-sky-700 dark:fill-sky-300 text-[11px] font-semibold"
              >
                导带 (多子电子丰富)
              </text>
              <line
                x1={32}
                y1={74}
                x2={338}
                y2={74}
                className="stroke-slate-900 dark:stroke-slate-100"
                strokeWidth="2.6"
              />
              <text
                x={344}
                y={78}
                className="fill-slate-900 dark:fill-slate-100 text-[11.5px] font-mono font-bold"
              >
                Ec
              </text>

              {/* Fermi Level EF strictly above Et */}
              <line
                x1={32}
                y1={115}
                x2={338}
                y2={115}
                className="stroke-slate-500 dark:stroke-slate-400"
                strokeWidth="1.6"
                strokeDasharray="6 4"
              />
              <text
                x={344}
                y={119}
                className="fill-slate-600 dark:fill-slate-300 text-[11.5px] font-mono font-bold"
              >
                EF
              </text>

              {/* Gold Acceptor Level Et */}
              <line
                x1={108}
                y1={174}
                x2={266}
                y2={174}
                stroke="#D97706"
                strokeWidth="3"
              />
              <text
                x={274}
                y={178}
                className="fill-amber-600 dark:fill-amber-400 text-[11.5px] font-mono font-bold"
              >
                Et
              </text>
              <circle cx={185} cy={174} r="6.5" fill="#0284C7" />
              <text
                x={195}
                y={165}
                className="fill-slate-800 dark:fill-slate-100 text-[11.5px] font-mono font-bold"
              >
                Au⁻
              </text>

              {/* Step 2: Fast electron capture downward from Ec to Et */}
              <line
                x1={146}
                y1={80}
                x2={146}
                y2={161}
                stroke="#0D9488"
                strokeWidth="2.2"
                markerEnd={`url(#g-arr-green-${mode})`}
              />
              <text
                x={136}
                y={128}
                textAnchor="end"
                className="fill-[#0F766E] dark:fill-teal-300 text-[10.5px] font-semibold"
              >
                ② 补俘获电子
              </text>
              <text
                x={136}
                y={142}
                textAnchor="end"
                className="fill-[#0F766E] dark:fill-teal-300 text-[10.5px] font-semibold"
              >
                rn (极快)
              </text>

              {/* Step 1: Rate-limiting hole capture downward from Et to Ev */}
              <line
                x1={190}
                y1={182}
                x2={214}
                y2={239}
                stroke="#DC2626"
                strokeWidth="2.3"
                markerEnd={`url(#g-arr-red-${mode})`}
              />
              <text
                x={216}
                y={209}
                className="fill-red-600 dark:fill-rose-400 text-[10.5px] font-bold"
              >
                ① 俘获空穴 rp
              </text>
              <text
                x={216}
                y={224}
                className="fill-red-600 dark:fill-rose-400 text-[10.5px] font-semibold"
              >
                (瓶颈步骤)
              </text>

              {/* Valence Band shaded region */}
              <line
                x1={32}
                y1={246}
                x2={338}
                y2={246}
                className="stroke-slate-900 dark:stroke-slate-100"
                strokeWidth="2.6"
              />
              <text
                x={344}
                y={250}
                className="fill-slate-900 dark:fill-slate-100 text-[11.5px] font-mono font-bold"
              >
                Ev
              </text>
              <rect
                x={32}
                y={246}
                width={306}
                height={34}
                className="fill-slate-400/15 dark:fill-slate-700/35"
              />
              <text
                x={185}
                y={267}
                textAnchor="middle"
                className="fill-slate-600 dark:fill-slate-300 text-[11px] font-medium"
              >
                价带 (少子空穴)
              </text>
            </svg>
          </ZoomablePanel>
        )}

        {/* Bonus analytical curve for Example 2 */}
        {showExpSurf && (
          <ZoomablePanel
            title="不同表面复合速度 Sp 下的 Δp(x) 分布 (αLp = 2.5)"
            badge="例题 2 曲线放大"
            className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-[#060A13]/70 p-2.5"
          >
            <svg
              viewBox={`0 0 ${W} ${H}`}
              className="w-full h-auto select-none"
              role="img"
              aria-label="指数光生率与表面复合分布曲线"
            >
              <text
                x={W / 2 + 8}
                y={18}
                textAnchor="middle"
                className="fill-slate-900 dark:fill-slate-100 text-[12px] font-bold"
              >
                不同表面复合速度 Sp 下的 Δp(x) 分布 (αLp = 2.5)
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

              {/* Sp = 0 */}
              <path
                d={sampleCurve(expDist(0), 0, 4.0, 100, mapXe, mapYe)}
                fill="none"
                stroke="#0284C7"
                className="dark:stroke-sky-400"
                strokeWidth="2.6"
              />
              {/* Sp = Dp/Lp */}
              <path
                d={sampleCurve(expDist(1), 0, 4.0, 100, mapXe, mapYe)}
                fill="none"
                stroke="#0D9488"
                className="dark:stroke-teal-400"
                strokeWidth="2.6"
              />
              {/* Sp -> inf */}
              <path
                d={sampleCurve(expDist(Infinity), 0, 4.0, 100, mapXe, mapYe)}
                fill="none"
                stroke="#DC2626"
                className="dark:stroke-rose-400"
                strokeWidth="2.6"
                strokeDasharray="5 3"
              />

              {[0, 1, 2, 3, 4].map((x) => (
                <text
                  key={x}
                  x={mapXe(x)}
                  y={H - pad.b + 16}
                  textAnchor="middle"
                  className="fill-slate-600 dark:fill-slate-300 text-[10px] font-mono"
                >
                  {x === 0 ? '0' : `${x}Lp`}
                </text>
              ))}
              <text
                x={(pad.l + W - pad.r) / 2}
                y={H - 8}
                textAnchor="middle"
                className="fill-slate-600 dark:fill-slate-300 text-[11px]"
              >
                深入样品距离 x / Lp
              </text>
              <text
                x={16}
                y={H / 2}
                textAnchor="middle"
                transform={`rotate(-90 16 ${H / 2})`}
                className="fill-slate-600 dark:fill-slate-300 text-[11px] font-mono"
              >
                Δp(x) / (Φ0τp/Lp)
              </text>

              <g transform={`translate(${W - 146}, ${pad.t + 8})`}>
                <line x1="0" y1="7" x2="20" y2="7" stroke="#0284C7" strokeWidth="2.4" />
                <text x="26" y="11" className="fill-slate-700 dark:fill-slate-200 text-[10px]">
                  Sp = 0 (无复合，切线水平)
                </text>
                <line x1="0" y1="24" x2="20" y2="24" stroke="#0D9488" strokeWidth="2.4" />
                <text x="26" y="28" className="fill-slate-700 dark:fill-slate-200 text-[10px]">
                  有限 Sp = Dp/Lp
                </text>
                <line
                  x1="0"
                  y1="41"
                  x2="20"
                  y2="41"
                  stroke="#DC2626"
                  strokeWidth="2.4"
                  strokeDasharray="4 2"
                />
                <text x="26" y="45" className="fill-slate-700 dark:fill-slate-200 text-[10px]">
                  Sp → ∞ (Δp(0)=0，体内非零)
                </text>
              </g>
            </svg>
          </ZoomablePanel>
        )}
      </div>
    </div>
  );
}
