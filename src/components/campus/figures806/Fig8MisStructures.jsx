import React, { useState } from 'react';
import { Sliders, ArrowLeftRight } from 'lucide-react';
import { sampleCurve, createMapper } from './svgHelpers';
import { ZoomFigureButton, ZoomablePanel } from './ZoomableFigure';

function MisBandChargePanel({
  title,
  regime, // 'acc' | 'dep' | 'inv'
  isPType,
  compact = false,
}) {
  const W = compact ? 380 : 640;
  const H = 370;
  const xMetal = 46;
  const xOx1 = 80;
  const xOx2 = 122;
  const xEnd = W - 26;

  // Energy band vertical coords (top half: y=32..208)
  const yEf = 126;
  // P-type bulk: EF below Ei (Ei higher, Ev closer to EF); N-type bulk: EF above Ei
  const yEiBulk = isPType ? yEf - 26 : yEf + 26;
  const yEcBulk = yEiBulk - 44;
  const yEvBulk = yEiBulk + 44;

  // Band bending delta at semiconductor surface (SVG y: negative = UP, positive = DOWN)
  // P-type: acc (VG<0) -> bend UP (-32); dep (VG>0) -> bend DOWN (+28); inv (VG>>0) -> strong bend DOWN (+54, Ei drops below EF!)
  // N-type (mirror!): acc (VG>0) -> bend DOWN (+32); dep (VG<0) -> bend UP (-28); inv (VG<<0) -> strong bend UP (-54, Ei rises above EF!)
  let bend = 0;
  if (isPType) {
    bend = regime === 'acc' ? -32 : regime === 'dep' ? 28 : 54;
  } else {
    bend = regime === 'acc' ? 32 : regime === 'dep' ? -28 : -54;
  }

  // Metal EF shifts opposite to semiconductor bending:
  // P-type VG<0 -> metal EF UP (-30); VG>0 -> metal EF DOWN (+28 or +52)
  const metalEfY =
    yEf +
    (isPType
      ? regime === 'acc'
        ? -28
        : regime === 'dep'
          ? 24
          : 52
      : regime === 'acc'
        ? 28
        : regime === 'dep'
          ? -24
          : -52);

  const mapX = createMapper(0, 1, xOx2, xEnd);
  const decay = (u) => Math.exp(-4.4 * u);

  const ecPath = sampleCurve((u) => yEcBulk + bend * decay(u), 0, 1, 70, mapX, (y) => y);
  const eiPath = sampleCurve((u) => yEiBulk + bend * decay(u), 0, 1, 70, mapX, (y) => y);
  const evPath = sampleCurve((u) => yEvBulk + bend * decay(u), 0, 1, 70, mapX, (y) => y);

  // Charge density axis in bottom half (y0 = 290)
  const y0 = 290;
  // Gate charge sign: P-type acc has -QG (down), dep/inv have +QG (up); N-type opposite!
  const gatePositive = isPType ? regime !== 'acc' : regime === 'acc';
  const gateH = regime === 'inv' ? 46 : regime === 'dep' ? 34 : 38;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full h-auto select-none"
      role="img"
      aria-label={title}
    >
      <text
        x={W / 2}
        y={17}
        textAnchor="middle"
        className="fill-slate-900 dark:fill-slate-100 text-[12px] font-bold"
      >
        {title}
      </text>

      {/* Insulator Oxide Box */}
      <rect
        x={xOx1}
        y={32}
        width={xOx2 - xOx1}
        height={176}
        className="fill-slate-200/75 dark:fill-slate-800/80 stroke-slate-700 dark:stroke-slate-400"
        strokeWidth="1.5"
      />
      <text
        x={(xOx1 + xOx2) / 2}
        y={64}
        textAnchor="middle"
        className="fill-slate-700 dark:fill-slate-200 text-[11px] font-medium"
        style={{ writingMode: 'vertical-rl' }}
      >
        绝缘层
      </text>

      {/* Metal EF line */}
      <line
        x1={22}
        y1={metalEfY}
        x2={xOx1}
        y2={metalEfY}
        className="stroke-slate-600 dark:stroke-slate-300"
        strokeWidth="1.8"
        strokeDasharray="6 3 2 3"
      />
      <text
        x={48}
        y={metalEfY - 7}
        textAnchor="middle"
        className="fill-slate-700 dark:fill-slate-200 text-[11px] font-medium"
      >
        金属
      </text>

      {/* Semiconductor EF */}
      <line
        x1={xOx2}
        y1={yEf}
        x2={xEnd}
        y2={yEf}
        stroke="#0D9488"
        className="dark:stroke-teal-400"
        strokeWidth="1.8"
        strokeDasharray="7 3 2 3"
      />

      {/* Semiconductor Ec, Ei, Ev */}
      <path
        d={ecPath}
        fill="none"
        className="stroke-slate-900 dark:stroke-slate-100"
        strokeWidth="2.3"
      />
      <path
        d={eiPath}
        fill="none"
        className="stroke-slate-500 dark:stroke-slate-400"
        strokeWidth="1.5"
        strokeDasharray="5 4"
      />
      <path
        d={evPath}
        fill="none"
        className="stroke-slate-900 dark:stroke-slate-100"
        strokeWidth="2.3"
      />

      <text x={xEnd - 22} y={yEcBulk - 6} className="fill-slate-800 dark:fill-slate-200 text-[10.5px] font-mono font-bold">
        Ec
      </text>
      <text x={xEnd - 22} y={yEiBulk - 6} className="fill-slate-500 dark:fill-slate-400 text-[10.5px] font-mono">
        Ei
      </text>
      <text x={xEnd - 22} y={yEf - 6} className="fill-[#0F766E] dark:fill-teal-300 text-[10.5px] font-mono font-bold">
        EF
      </text>
      <text x={xEnd - 22} y={yEvBulk + 13} className="fill-slate-800 dark:fill-slate-200 text-[10.5px] font-mono font-bold">
        Ev
      </text>

      {/* Guide dotted lines down to rho(x) */}
      <line
        x1={xOx1}
        y1={212}
        x2={xOx1}
        y2={350}
        className="stroke-slate-400 dark:stroke-slate-600"
        strokeWidth="1"
        strokeDasharray="2 3"
      />
      <line
        x1={xOx2}
        y1={212}
        x2={xOx2}
        y2={350}
        className="stroke-slate-400 dark:stroke-slate-600"
        strokeWidth="1"
        strokeDasharray="2 3"
      />

      {/* Space Charge Density rho(x) Axes */}
      <line
        x1={32}
        y1={230}
        x2={32}
        y2={355}
        className="stroke-slate-500"
        strokeWidth="1.2"
      />
      <line
        x1={32}
        y1={y0}
        x2={xEnd}
        y2={y0}
        className="stroke-slate-700 dark:stroke-slate-300"
        strokeWidth="1.3"
      />
      <text
        x={16}
        y={292}
        textAnchor="middle"
        transform="rotate(-90 16 292)"
        className="fill-slate-600 dark:fill-slate-300 text-[11px] font-mono"
      >
        ρ(x)
      </text>

      {/* Gate surface charge bar (±QG) */}
      <rect
        x={xOx1 - 10}
        y={gatePositive ? y0 - gateH : y0}
        width={10}
        height={gateH}
        fill={gatePositive ? '#0284C7' : '#DC2626'}
      />
      <text
        x={xOx1 - 14}
        y={gatePositive ? y0 - gateH + 14 : y0 + 16}
        textAnchor="end"
        className={`text-[10.5px] font-mono font-bold ${
          gatePositive
            ? 'fill-sky-600 dark:fill-sky-400'
            : 'fill-red-600 dark:fill-rose-400'
        }`}
      >
        {gatePositive ? '+QG' : '-QG'}
      </text>

      {/* Semiconductor charge distribution */}
      {regime === 'acc' && (
        <>
          <rect
            x={xOx2}
            y={isPType ? y0 - 40 : y0}
            width={11}
            height={40}
            fill={isPType ? '#0284C7' : '#DC2626'}
          />
          <text
            x={xOx2 + 18}
            y={isPType ? y0 - 18 : y0 + 22}
            className={`text-[10.5px] font-semibold ${
              isPType
                ? 'fill-sky-600 dark:fill-sky-400'
                : 'fill-red-600 dark:fill-rose-400'
            }`}
          >
            {isPType ? '表面空穴堆积 (+)' : '表面电子堆积 (-)'}
          </text>
        </>
      )}

      {regime === 'dep' && (
        <>
          <rect
            x={xOx2}
            y={isPType ? y0 : y0 - 18}
            width={compact ? 86 : 120}
            height={18}
            fill="#D97706"
          />
          <text
            x={xOx2 + (compact ? 43 : 60)}
            y={isPType ? y0 + 34 : y0 - 26}
            textAnchor="middle"
            className="fill-amber-600 dark:fill-amber-300 text-[10.5px] font-semibold"
          >
            {isPType ? '电离受主耗尽层 xd (-)' : '电离施主耗尽层 xd (+)'}
          </text>
        </>
      )}

      {regime === 'inv' && (
        <>
          {/* Thin inversion sheet */}
          <rect
            x={xOx2}
            y={isPType ? y0 : y0 - 42}
            width={10}
            height={42}
            fill={isPType ? '#DC2626' : '#0284C7'}
          />
          {/* Locked max depletion layer xdm */}
          <rect
            x={xOx2 + 10}
            y={isPType ? y0 : y0 - 18}
            width={compact ? 112 : 165}
            height={18}
            fill="#D97706"
          />
          <text
            x={xOx2 + 4}
            y={isPType ? y0 + 56 : y0 - 48}
            className={`text-[10.5px] font-semibold ${
              isPType
                ? 'fill-red-600 dark:fill-rose-400'
                : 'fill-sky-600 dark:fill-sky-400'
            }`}
          >
            {isPType ? '反型电子 Qn' : '反型空穴 Qp'}
          </text>
          <text
            x={xOx2 + (compact ? 72 : 95)}
            y={isPType ? y0 + 34 : y0 - 26}
            textAnchor="middle"
            className="fill-amber-600 dark:fill-amber-300 text-[10.5px] font-semibold"
          >
            最大耗尽层 xdm
          </text>
        </>
      )}
    </svg>
  );
}

export default function Fig8MisStructures({
  section = 'all',
  defaultPType = true,
  defaultMisView = 'interactive',
  defaultRegime = 'inv',
}) {
  const [isPType, setIsPType] = useState(defaultPType);
  const [misView, setMisView] = useState(defaultMisView); // 'interactive' | 'triptych'
  const [regime, setRegime] = useState(defaultRegime);

  const show81 = section === 'all' || section === 'fig81';
  const show82 = section === 'all' || section === 'fig82';

  // Fig 8-2(a) High/Low freq C-V math curves (mirrors cleanly when N-type!)
  const W = 440;
  const H = 310;
  const pad = { l: 50, r: 22, t: 36, b: 42 };
  const aMin = isPType ? -3.6 : -4.6;
  const aMax = isPType ? 4.6 : 3.6;
  const mapX_a = createMapper(aMin, aMax, pad.l, W - pad.r);
  const mapY_cv = createMapper(0.16, 1.12, H - pad.b, pad.t);

  // Mirror VG around 0 when N-type!
  const xEval = (vg) => (isPType ? vg : -vg);

  // Low-frequency C/C0 (A->B->C(0, 0.74)->D(1.05, 0.51)->E->F(1.0))
  const cvLowFn = (vg) => {
    const v = xEval(vg);
    const dep = 0.4 + 0.6 / (1 + Math.exp((v + 0.25) / 0.62));
    const invRise = 0.6 / (1 + Math.exp(-(v - 1.95) / 0.36));
    return Math.min(1.0, dep + invRise * (1 - dep) / 0.6 * 0.6);
  };
  // High-frequency C/C0 (follows until D, locks at Cmin = 0.40)
  const cvHighFn = (vg) => {
    const v = xEval(vg);
    return 0.4 + 0.6 / (1 + Math.exp((v + 0.25) / 0.62));
  };

  // Fig 8-2(b) Ideal vs VFB-shifted C-V (mirrors cleanly when N-type!)
  const bMin = isPType ? -4.6 : -3.2;
  const bMax = isPType ? 3.2 : 4.6;
  const mapX_b = createMapper(bMin, bMax, pad.l, W - pad.r);
  const idealCvFn = (vg) => {
    const v = xEval(vg);
    return 0.38 + 0.62 / (1 + Math.exp(v / 0.65));
  };
  // P-type Al-SiO2-Si shifts LEFT (VFB = -1.8V); mirrored N-type shifts RIGHT (+1.8V)
  const vfbShift = isPType ? -1.8 : 1.8;
  const actualCvFn = (vg) => idealCvFn(vg - vfbShift);

  const cfbVal = idealCvFn(0);

  return (
    <div className="space-y-5">
      {/* Shared P-type / N-type Substrate Mirror Toggle */}
      <div className="rounded-xl border border-[#0D9488]/35 bg-[#0D9488]/[0.06] dark:bg-[#0D9488]/12 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-[#0F766E] dark:text-teal-300">
          <ArrowLeftRight className="w-4 h-4 text-[#0D9488]" />
          <span>
            当前衬底类型：{isPType ? 'P 型硅衬底 (2026 真题默认)' : 'N 型硅衬底 (镜像对称模式)'}
          </span>
        </div>

        <div className="inline-flex items-center p-1 rounded-xl border border-[#0D9488]/30 bg-white/90 dark:bg-slate-900">
          <button
            type="button"
            onClick={() => setIsPType(true)}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
              isPType
                ? 'bg-[#0D9488] text-white'
                : 'text-slate-600 dark:text-slate-300'
            }`}
          >
            P 型衬底
          </button>
          <button
            type="button"
            onClick={() => setIsPType(false)}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
              !isPType
                ? 'bg-[#0D9488] text-white'
                : 'text-slate-600 dark:text-slate-300'
            }`}
          >
            N 型衬底 (左右镜像翻转)
          </button>
        </div>
      </div>

      {/* ================================================================= */}
      {/* 图 8-1：MIS 三态能带与空间电荷联动图                                 */}
      {/* ================================================================= */}
      {show81 && (
      <div className="rounded-2xl border border-[#0D9488]/30 bg-white dark:bg-[#0B1120]/95 p-4 sm:p-5 space-y-4 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
              <Sliders className="w-4 h-4 text-[#0D9488]" />
              <span>
                图 8-1：{isPType ? 'P 型' : 'N 型'} MIS 结构三种偏压状态能带与空间电荷 ρ(x) 联动图
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              点击偏压状态切换按钮，联动查看表面能带弯曲方向、金属 EF 移动及表面空间电荷分布。
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setMisView('interactive')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                misView === 'interactive'
                  ? 'bg-[#0D9488] text-white border-[#0D9488]'
                  : 'bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
              }`}
            >
              交互状态联动
            </button>
            <button
              type="button"
              onClick={() => setMisView('triptych')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                misView === 'triptych'
                  ? 'bg-[#0D9488] text-white border-[#0D9488]'
                  : 'bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
              }`}
            >
              三态并排总览 (a)(b)(c)
            </button>
            <ZoomFigureButton
              title={`图 8-1：${isPType ? 'P 型' : 'N 型'} MIS 结构三种偏压状态能带与空间电荷联动图`}
              badge="图 8-1 交互放大"
              renderModalContent={() => (
                <Fig8MisStructures
                  section="fig81"
                  defaultPType={isPType}
                  defaultMisView={misView}
                  defaultRegime={regime}
                />
              )}
            />
          </div>
        </div>

        {misView === 'interactive' ? (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/65 px-4 py-3">
              {[
                {
                  id: 'acc',
                  label: isPType
                    ? '① 多子堆积 (VG < 0, Vs < 0)'
                    : '① 多子堆积 (VG > 0, Vs > 0)',
                },
                {
                  id: 'dep',
                  label: isPType
                    ? '② 多子耗尽 (VG > 0, Vs > 0)'
                    : '② 多子耗尽 (VG < 0, Vs < 0)',
                },
                {
                  id: 'inv',
                  label: isPType
                    ? '③ 少子强反型 (VG >> 0, Vs ≥ 2VB)'
                    : '③ 少子强反型 (VG << 0, |Vs| ≥ 2|VB|)',
                },
              ].map((st) => (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => setRegime(st.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold border transition-colors ${
                    regime === st.id
                      ? 'bg-[#0D9488] text-white border-[#0D9488]'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-[#0D9488]/50'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>

            <ZoomablePanel
              title="图 8-1 MIS 能带与空间电荷分布"
              badge="图 8-1 单图放大"
              className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/40 dark:bg-[#060A13]/70 p-3 max-w-3xl mx-auto"
            >
              <MisBandChargePanel
                title={
                  regime === 'acc'
                    ? isPType
                      ? '(a) 多子堆积 (VG < 0, Vs < 0)'
                      : '(a) 多子堆积 (VG > 0, Vs > 0)'
                    : regime === 'dep'
                      ? isPType
                        ? '(b) 多子耗尽 (VG > 0, Vs > 0)'
                        : '(b) 多子耗尽 (VG < 0, Vs < 0)'
                      : isPType
                        ? '(c) 少子强反型 (VG >> 0, Vs ≥ 2VB)'
                        : '(c) 少子强反型 (VG << 0, |Vs| ≥ 2|VB|)'
                }
                regime={regime}
                isPType={isPType}
              />
            </ZoomablePanel>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <ZoomablePanel
              title={
                isPType
                  ? '(a) 多子堆积 (VG < 0, Vs < 0)'
                  : '(a) 多子堆积 (VG > 0, Vs > 0)'
              }
              badge="图 8-1(a) 放大"
              className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/40 dark:bg-[#060A13]/70 p-2.5"
            >
              <MisBandChargePanel
                title={
                  isPType
                    ? '(a) 多子堆积 (VG < 0, Vs < 0)'
                    : '(a) 多子堆积 (VG > 0, Vs > 0)'
                }
                regime="acc"
                isPType={isPType}
                compact
              />
            </ZoomablePanel>
            <ZoomablePanel
              title={
                isPType
                  ? '(b) 多子耗尽 (VG > 0, Vs > 0)'
                  : '(b) 多子耗尽 (VG < 0, Vs < 0)'
              }
              badge="图 8-1(b) 放大"
              className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/40 dark:bg-[#060A13]/70 p-2.5"
            >
              <MisBandChargePanel
                title={
                  isPType
                    ? '(b) 多子耗尽 (VG > 0, Vs > 0)'
                    : '(b) 多子耗尽 (VG < 0, Vs < 0)'
                }
                regime="dep"
                isPType={isPType}
                compact
              />
            </ZoomablePanel>
            <ZoomablePanel
              title={
                isPType
                  ? '(c) 少子强反型 (VG >> 0, Vs ≥ 2VB)'
                  : '(c) 少子强反型 (VG << 0, |Vs| ≥ 2|VB|)'
              }
              badge="图 8-1(c) 放大"
              className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/40 dark:bg-[#060A13]/70 p-2.5"
            >
              <MisBandChargePanel
                title={
                  isPType
                    ? '(c) 少子强反型 (VG >> 0, Vs ≥ 2VB)'
                    : '(c) 少子强反型 (VG << 0, |Vs| ≥ 2|VB|)'
                }
                regime="inv"
                isPType={isPType}
                compact
              />
            </ZoomablePanel>
          </div>
        )}
      </div>
      )}

      {/* ================================================================= */}
      {/* 图 8-2：高低频 C-V 特性曲线与平带电压 VFB 测法                       */}
      {/* ================================================================= */}
      {show82 && (
      <div className="rounded-2xl border border-[#0D9488]/30 bg-white dark:bg-[#0B1120]/95 p-4 sm:p-5 space-y-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
            图 8-2：{isPType ? 'P 型' : 'N 型'} MIS 高低频 C-V 特性曲线与平带电压 VFB 测法（2026 真题第四大题核心图）
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/25">
              2026 真题原图
            </span>
            <ZoomFigureButton
              title={`图 8-2：${isPType ? 'P 型' : 'N 型'} MIS 高低频 C-V 特性曲线与平带电压 VFB 测法`}
              badge="图 8-2 全图"
              label="放大全图"
              renderModalContent={() => (
                <Fig8MisStructures section="fig82" defaultPType={isPType} />
              )}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* (a) High/Low Freq C-V */}
          <ZoomablePanel
            title={`(a) ${isPType ? 'P 型' : 'N 型'} MIS 高低频 C-V 特性曲线 (2026真题)`}
            badge="图 8-2(a) 放大"
            className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-[#060A13]/70 p-2.5"
          >
            <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto select-none">
              <text
                x={W / 2 + 10}
                y={18}
                textAnchor="middle"
                className="fill-slate-900 dark:fill-slate-100 text-[12px] font-bold"
              >
                (a) {isPType ? 'P 型' : 'N 型'} MIS 高低频 C-V 特性曲线 (2026真题)
              </text>

              <line x1={pad.l} y1={pad.t} x2={pad.l} y2={H - pad.b} className="stroke-slate-500" strokeWidth="1.2" />
              <line x1={pad.l} y1={H - pad.b} x2={W - pad.r} y2={H - pad.b} className="stroke-slate-500" strokeWidth="1.2" />
              <line x1={mapX_a(0)} y1={pad.t} x2={mapX_a(0)} y2={H - pad.b} className="stroke-slate-700 dark:stroke-slate-300" strokeWidth="1.3" />
              <line x1={pad.l} y1={mapY_cv(1.0)} x2={W - pad.r} y2={mapY_cv(1.0)} className="stroke-slate-400 dark:stroke-slate-600" strokeWidth="1" strokeDasharray="2 3" />

              {[0.2, 0.4, 0.6, 0.8, 1.0].map((val) => (
                <text key={val} x={pad.l - 7} y={mapY_cv(val) + 4} textAnchor="end" className="fill-slate-500 text-[10px] font-mono">
                  {val.toFixed(1)}
                </text>
              ))}
              {(isPType ? [-3, -2, -1, 0, 1, 2, 3, 4] : [-4, -3, -2, -1, 0, 1, 2, 3]).map((v) => (
                <text key={v} x={mapX_a(v)} y={H - pad.b + 15} textAnchor="middle" className="fill-slate-500 text-[10px] font-mono">
                  {v}
                </text>
              ))}

              <text x={14} y={H / 2} textAnchor="middle" transform={`rotate(-90 14 ${H / 2})`} className="fill-slate-600 dark:fill-slate-300 text-[11px] font-mono">
                C / C0
              </text>
              <text x={(pad.l + W - pad.r) / 2} y={H - 8} textAnchor="middle" className="fill-slate-600 dark:fill-slate-300 text-[11px]">
                栅压 VG
              </text>

              {/* Low Freq C-V */}
              <path
                d={sampleCurve(cvLowFn, aMin + 0.1, aMax - 0.1, 140, mapX_a, mapY_cv)}
                fill="none"
                stroke="#0D9488"
                className="dark:stroke-teal-400"
                strokeWidth="2.8"
              />
              {/* High Freq C-V */}
              <path
                d={sampleCurve(cvHighFn, aMin + 0.1, aMax - 0.1, 140, mapX_a, mapY_cv)}
                fill="none"
                stroke="#DC2626"
                className="dark:stroke-rose-400"
                strokeWidth="2.8"
                strokeDasharray="7 4"
              />

              {/* Key points C(CFB) and D(Cmin) */}
              <circle cx={mapX_a(0)} cy={mapY_cv(cvHighFn(0))} r="4" className="fill-slate-900 dark:fill-white" />
              <text
                x={mapX_a(isPType ? -0.25 : 0.25)}
                y={mapY_cv(cvHighFn(0)) + 14}
                textAnchor={isPType ? 'end' : 'start'}
                className="fill-slate-700 dark:fill-slate-200 text-[10.5px] font-mono font-bold"
              >
                CFB (C)
              </text>

              <circle
                cx={mapX_a(isPType ? 1.05 : -1.05)}
                cy={mapY_cv(cvLowFn(isPType ? 1.05 : -1.05))}
                r="4"
                className="fill-slate-900 dark:fill-white"
              />
              <text
                x={mapX_a(isPType ? 1.05 : -1.05)}
                y={mapY_cv(0.41) + 22}
                textAnchor="middle"
                className="fill-slate-700 dark:fill-slate-200 text-[10.5px] font-mono font-bold"
              >
                D (Cmin)
              </text>

              <text
                x={mapX_a(isPType ? -2.2 : 2.2)}
                y={mapY_cv(1.04)}
                textAnchor="middle"
                className="fill-slate-700 dark:fill-slate-200 text-[10.5px] font-semibold"
              >
                A (堆积 C0)
              </text>
              <text
                x={mapX_a(isPType ? 3.1 : -3.1)}
                y={mapY_cv(1.04)}
                textAnchor="middle"
                className="fill-[#0F766E] dark:fill-teal-300 text-[10.5px] font-semibold"
              >
                E → F (低频反型)
              </text>
              <text
                x={mapX_a(isPType ? 3.1 : -3.1)}
                y={mapY_cv(0.46)}
                textAnchor="middle"
                className="fill-red-600 dark:fill-rose-400 text-[10.5px] font-semibold"
              >
                G → H (高频反型)
              </text>

              {/* Legend */}
              <g transform={`translate(${pad.l + 10}, ${H - pad.b - 48})`}>
                <rect x="-4" y="-4" width="152" height="40" rx="6" className="fill-white/90 dark:fill-slate-900/90 stroke-slate-200 dark:stroke-slate-700" />
                <line x1="4" y1="9" x2="22" y2="9" stroke="#0D9488" strokeWidth="2.5" />
                <text x="27" y="13" className="fill-slate-700 dark:fill-slate-200 text-[10px]">
                  1. 低频 C-V (A-B-C-D-E-F)
                </text>
                <line x1="4" y1="25" x2="22" y2="25" stroke="#DC2626" strokeWidth="2.5" strokeDasharray="5 3" />
                <text x="27" y="29" className="fill-slate-700 dark:fill-slate-200 text-[10px]">
                  2. 高频 C-V (A-B-C-D-G-H)
                </text>
              </g>
            </svg>
          </ZoomablePanel>

          {/* (b) Flatband Voltage VFB Shift */}
          <ZoomablePanel
            title={`(b) 功函数差引起的平带电压 VFB ${isPType ? '左移' : '右移'}测法`}
            badge="图 8-2(b) 放大"
            className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-[#060A13]/70 p-2.5"
          >
            <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto select-none">
              <defs>
                <marker id="vfb-a" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
                  <path d="M0,1 L5,3 L0,5 Z" fill="#DC2626" />
                </marker>
                <marker id="vfb-b" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto-start-reverse">
                  <path d="M0,1 L5,3 L0,5 Z" fill="#DC2626" />
                </marker>
              </defs>

              <text
                x={W / 2 + 10}
                y={18}
                textAnchor="middle"
                className="fill-slate-900 dark:fill-slate-100 text-[12px] font-bold"
              >
                (b) 功函数差引起的平带电压 VFB {isPType ? '左移' : '右移'}测法
              </text>

              <line x1={pad.l} y1={pad.t} x2={pad.l} y2={H - pad.b} className="stroke-slate-500" strokeWidth="1.2" />
              <line x1={pad.l} y1={H - pad.b} x2={W - pad.r} y2={H - pad.b} className="stroke-slate-500" strokeWidth="1.2" />
              <line x1={mapX_b(0)} y1={pad.t} x2={mapX_b(0)} y2={H - pad.b} className="stroke-slate-700 dark:stroke-slate-300" strokeWidth="1.3" />

              {[0.2, 0.4, 0.6, 0.8, 1.0].map((val) => (
                <text key={val} x={pad.l - 7} y={mapY_cv(val) + 4} textAnchor="end" className="fill-slate-500 text-[10px] font-mono">
                  {val.toFixed(1)}
                </text>
              ))}
              {(isPType ? [-4, -3, -2, -1, 0, 1, 2, 3] : [-3, -2, -1, 0, 1, 2, 3, 4]).map((v) => (
                <text key={v} x={mapX_b(v)} y={H - pad.b + 15} textAnchor="middle" className="fill-slate-500 text-[10px] font-mono">
                  {v}
                </text>
              ))}

              <text x={14} y={H / 2} textAnchor="middle" transform={`rotate(-90 14 ${H / 2})`} className="fill-slate-600 dark:fill-slate-300 text-[11px] font-mono">
                C / C0
              </text>
              <text x={(pad.l + W - pad.r) / 2} y={H - 8} textAnchor="middle" className="fill-slate-600 dark:fill-slate-300 text-[11px]">
                栅压 VG
              </text>

              {/* Ideal curve (1) */}
              <path
                d={sampleCurve(idealCvFn, bMin + 0.1, bMax - 0.1, 120, mapX_b, mapY_cv)}
                fill="none"
                className="stroke-slate-900 dark:stroke-slate-100"
                strokeWidth="2.6"
              />
              {/* Shifted actual curve (2) */}
              <path
                d={sampleCurve(actualCvFn, bMin + 0.1, bMax - 0.1, 120, mapX_b, mapY_cv)}
                fill="none"
                stroke="#7C3AED"
                className="dark:stroke-violet-400"
                strokeWidth="2.8"
                strokeDasharray="7 4"
              />

              {/* CFB/C0 horizontal measurement arrow */}
              <line
                x1={mapX_b(vfbShift)}
                y1={mapY_cv(cfbVal)}
                x2={mapX_b(0)}
                y2={mapY_cv(cfbVal)}
                stroke="#DC2626"
                strokeWidth="2"
                markerStart="url(#vfb-b)"
                markerEnd="url(#vfb-a)"
              />
              <circle cx={mapX_b(0)} cy={mapY_cv(cfbVal)} r="4" fill="#DC2626" />
              <circle cx={mapX_b(vfbShift)} cy={mapY_cv(cfbVal)} r="4" fill="#DC2626" />
              <line
                x1={mapX_b(vfbShift)}
                y1={mapY_cv(cfbVal)}
                x2={mapX_b(vfbShift)}
                y2={H - pad.b}
                stroke="#DC2626"
                strokeWidth="1.4"
                strokeDasharray="2 3"
              />

              <text
                x={mapX_b(vfbShift / 2)}
                y={mapY_cv(cfbVal) - 9}
                textAnchor="middle"
                className="fill-red-600 dark:fill-rose-400 text-[11.5px] font-mono font-bold"
              >
                VFB
              </text>
              <text
                x={mapX_b(isPType ? 0.2 : -0.2)}
                y={mapY_cv(cfbVal) + 4}
                textAnchor={isPType ? 'start' : 'end'}
                className="fill-slate-700 dark:fill-slate-200 text-[10.5px] font-mono font-bold"
              >
                CFB / C0
              </text>
              <text
                x={mapX_b(vfbShift)}
                y={H - pad.b - 10}
                textAnchor="middle"
                className="fill-red-600 dark:fill-rose-400 text-[10.5px] font-semibold"
              >
                VFB 坐标
              </text>

              {/* Legend */}
              <g transform={`translate(${isPType ? W - 210 : pad.l + 10}, ${pad.t + 6})`}>
                <line x1="0" y1="7" x2="20" y2="7" className="stroke-slate-900 dark:stroke-slate-100" strokeWidth="2.4" />
                <text x="25" y="11" className="fill-slate-700 dark:fill-slate-200 text-[10px]">
                  曲线 (1) 理想 MIS
                </text>
                <line x1="0" y1="24" x2="20" y2="24" stroke="#7C3AED" strokeWidth="2.4" strokeDasharray="5 3" />
                <text x="25" y="28" className="fill-slate-700 dark:fill-slate-200 text-[10px]">
                  曲线 (2) 实际 MIS ({isPType ? 'Wm < Ws 左移' : 'Wm > Ws 右移'})
                </text>
              </g>
            </svg>
          </ZoomablePanel>
        </div>
      </div>
      )}
    </div>
  );
}
