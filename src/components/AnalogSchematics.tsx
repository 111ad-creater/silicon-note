import React, { useState, useEffect } from 'react';
import { ZoomIn, X, Sparkles, Cpu, Info } from 'lucide-react';
import { ZoomControls, ZoomViewport } from './campus/ZoomableFigureModal.jsx';
import {
  Schematic11,
  Schematic12,
  Schematic13,
  Schematic21,
  Schematic22,
} from './campus/schematics/Stage12Schematics.jsx';
import {
  Schematic31,
  Schematic32,
  Schematic41,
  Schematic42,
  Schematic51,
  Schematic52,
  Schematic53,
} from './campus/schematics/Stage35Schematics.jsx';

interface VariantOption {
  id: string;
  label: string;
  formula?: string;
}

interface SchematicMeta {
  title: string;
  subtitle: string;
  defaultVariant: string;
  variants?: VariantOption[];
  coreFormula: string;
  defaultHint: string;
  Component: React.ComponentType<any>;
}

const SCHEMATIC_CATALOG: Record<string, SchematicMeta> = {
  '1.1': {
    title: '图 1.1 · NMOS 物理符号 & 饱和区小信号等效模型',
    subtitle: '点击或悬停 rO 圆圈查看考点提示',
    defaultVariant: 'dual',
    variants: [
      { id: 'dual', label: '并排全览 (直流 + 小信号)' },
      { id: 'dc', label: '直流大信号符号 (VGS/VDS/ID)', formula: '饱和条件：VGS > VTH 且 VDS ≥ VOV' },
      { id: 'ac', label: '交流小信号等效 (gm·vgs ∥ rO)', formula: 'gm = 2ID/VOV | rO ≈ 1/(λID) | 本征增益 = gm·rO' },
    ],
    coreFormula: 'gm = 2ID/VOV | rO ≈ 1/(λID) | 本征增益 = gm·rO',
    defaultHint: '提示：悬停/点击图中 rO 节点查看 λ=0 简化条件。',
    Component: Schematic11,
  },
  '1.2': {
    title: '图 1.2 · 共源极 (CS) 原型、三大高频变式 & CG/CD 速览',
    subtitle: '5 种基本电路积木一键切换对比',
    defaultVariant: 'basic',
    variants: [
      { id: 'basic', label: '① 基本电阻负载 CS', formula: 'Av = -gm·(RD ∥ rO) | Rin = ∞' },
      { id: 'diode', label: '② 变式1: 二极管接法', formula: '栅漏短接 = 1/gm2 | Av = -gm1/gm2' },
      { id: 'isource', label: '③ 变式2: 电流源负载', formula: 'Av = -gm1·(rO1 ∥ rO2)' },
      { id: 'degen', label: '④ 变式3: 源极退化 RS', formula: 'Av ≈ -RD / (1/gm + RS)' },
      { id: 'cg_cd', label: '⑤ 共栅 CG & 源跟随 CD', formula: 'CG: Av=+gmRD, Rin≈1/gm | CD: Av<1, Rout≈1/gm' },
    ],
    coreFormula: '观察法铁律：Av = -Gm · Rout | 栅漏短接 = 1/gm',
    defaultHint: '提示：切换到「变式1」并悬停紫色 G-D 短接线查看秒杀替换口诀！',
    Component: Schematic12,
  },
  '1.3': {
    title: '图 1.3 · 共源共栅 (Cascode) 叠罗汉放大器',
    subtitle: '对比普通电阻负载 vs 全 Cascode 电流源负载',
    defaultVariant: 'cascode',
    variants: [
      { id: 'cascode', label: '全 Cascode 电流源负载', formula: 'Av ≈ -gm1·[(gm2·rO2·rO1) ∥ (gm3·rO3·rO4)] ≈ -(gm·rO)²' },
      { id: 'rd', label: '普通电阻负载 RD（反面教材）', formula: 'Av ≈ -gm1 · [(gm·rO²) ∥ RD] ≈ -gm1 · RD' },
    ],
    coreFormula: 'Gm = gm1（不翻倍！）| Rout ≈ gm2·rO2·rO1 | Vout_min = VOV1 + VOV2',
    defaultHint: '提示：悬停/点击中间紫色圆点 Node X 查看 M2 的防弹盾牌作用！',
    Component: Schematic13,
  },
  '2.1': {
    title: '图 2.1 · 对称差动放大器 &「半边电路法」一刀劈开',
    subtitle: '一键切换差模虚拟交流地 vs 共模尾电阻拆分',
    defaultVariant: 'diff',
    variants: [
      { id: 'diff', label: '差模分析（中间直接接地）', formula: 'Adm = -gm·(RD ∥ rO)（双端差分）' },
      { id: 'common', label: '共模分析（RSS 拆成两个 2RSS）', formula: 'Acm ≈ -RD / (1/gm + 2RSS) | CMRR ≈ gm·RSS' },
    ],
    coreFormula: 'Adm = -gm·(RD ∥ rO) | 共模 Acm ≈ -RD / (2RSS) | CMRR ≈ gm·RSS',
    defaultHint: '提示：悬停/点击红色对称虚线与 Node P 查看虚拟交流地原理！',
    Component: Schematic21,
  },
  '2.2': {
    title: '图 2.2 · 基本电流镜 & 经典五管运放（有源负载）',
    subtitle: '直观展示双端转单端一推一拉信号电流合流',
    defaultVariant: 'ota5',
    variants: [
      { id: 'ota5', label: '五管运放（双端转单端合流）', formula: 'Av = gm1 · (rO2 ∥ rO4)（不砍半！）' },
      { id: 'mirror', label: '基本电流镜复制原理', formula: 'Iout/IREF = [(W/L)2/(W/L)1]·[(1+λVDS2)/(1+λVDS1)]' },
    ],
    coreFormula: '五管运放增益：Av = gm1 · (rO2 ∥ rO4)（不砍半！）| 镜极点 ωp_mirror ≈ gm3 / C_mirror',
    defaultHint: '提示：悬停/点击左侧二极管接法节点 M3 查看为何不能直接劈半边！',
    Component: Schematic22,
  },
  '3.1': {
    title: '图 3.1 · 密勒效应 (Miller Effect) 跨接电容等效拆解',
    subtitle: '切换放大倍数 |Av| 实时感受输入等效电容暴涨',
    defaultVariant: '40',
    variants: [
      { id: '10', label: '|Av| = 10 (Cin = 110 fF)', formula: 'Cin_Miller = 10fF × (1 + 10) = 110 fF' },
      { id: '40', label: '|Av| = 40 (Cin = 410 fF)', formula: 'Cin_Miller = 10fF × (1 + 40) = 410 fF' },
      { id: '100', label: '|Av| = 100 (Cin = 1010 fF)', formula: 'Cin_Miller = 10fF × (1 + 100) = 1010 fF' },
    ],
    coreFormula: 'Cin_Miller = CF·(1 + |Av|) | 避坑：密勒近似会漏掉右半平面零点 ωz = +gm/CGD',
    defaultHint: '提示：悬停/点击红色 Cin 大电容查看“推门大力士”物理直觉！',
    Component: Schematic31,
  },
  '3.2': {
    title: '图 3.2 · 节点 RC 快速数极点法（Cascode 三节点定位）',
    subtitle: '点击图中 ① ② ③ 发光气泡或下方按钮查看对应极点表达式',
    defaultVariant: '3',
    variants: [
      { id: '1', label: '① 输入栅极节点', formula: 'ωp_in = 1 / [RS · (CGS1 + 2·CGD1)]' },
      { id: '2', label: '② 中间 Node X（低阻）', formula: 'ωpX ≈ gm2 / (CDB1 + CSB2 + CGS2)' },
      { id: '3', label: '③ 输出节点（主极点 ωp1）', formula: 'ωp1 = 1 / [Rout · (CL + CDB2 + CGD2)]' },
    ],
    coreFormula: '单节点极点：ωp = 1/(R_node · C_node) | 节点电阻越大、电容越大 → 主极点',
    defaultHint: '提示：直接点击电路上的 ① ② ③ 发光圆点可交互查看每个节点的 R 与 C！',
    Component: Schematic32,
  },
  '4.1': {
    title: '图 4.1 · 负反馈四大组态方框图（采样与混合判别）',
    subtitle: '切换四大组态对比输入混合与输出采样接线差异',
    defaultVariant: 'vv',
    variants: [
      { id: 'vv', label: '电压-串联 (V-V)', formula: 'Rin ↑ ·(1+Aβ) | Rout ↓ /(1+Aβ)' },
      { id: 'iv', label: '电流-串联 (I-V)', formula: 'Rin ↑ ·(1+Aβ) | Rout ↑ ·(1+Aβ)' },
      { id: 'vi', label: '电压-并联 (V-I)', formula: 'Rin ↓ /(1+Aβ) | Rout ↓ /(1+Aβ)' },
      { id: 'ii', label: '电流-并联 (I-I)', formula: 'Rin ↓ /(1+Aβ) | Rout ↑ ·(1+Aβ)' },
    ],
    coreFormula: '口诀：输入「串大并小」| 输出「压小流大」| A_closed = A/(1 + Aβ) ≈ 1/β',
    defaultHint: '提示：悬停/点击右侧输出采样点查看 3 秒判定电压/电流采样技巧！',
    Component: Schematic41,
  },
  '4.2': {
    title: '图 4.2 · 三大经典运放拓扑简化结构对比',
    subtitle: '并排对比或聚焦单拓扑叠层与摆幅标尺',
    defaultVariant: 'all',
    variants: [
      { id: 'all', label: '三图并排对比', formula: '套筒 VDD-5VOV | 折叠 VDD-4VOV | 两级 VDD-2VOV' },
      { id: 'telescopic', label: '套筒式 (Telescopic)', formula: '单支路 5 层叠管 · 最快省电 · 窄摆幅 VDD-5VOV' },
      { id: 'folded', label: '折叠式 (Folded)', formula: '双支路折叠 · 较宽摆幅 VDD-4VOV · 可短接缓冲' },
      { id: 'twostage', label: '两级运放 (Two-Stage)', formula: '输出仅 2 层 · 最宽摆幅 VDD-2VOV · 必加 CC 补偿' },
    ],
    coreFormula: '套筒：最省电最快但摆幅最窄 | 折叠：功耗翻倍换宽摆幅 | 两级：摆幅最大但必加补偿',
    defaultHint: '提示：悬停/点击两级运放共源输出级查看 VDD - 2VOV 宽摆幅原因！',
    Component: Schematic42,
  },
  '5.1': {
    title: '图 5.1 · 运放波特图 (Bode Plot) 与相位裕度 (PM) 几何图解',
    subtitle: '切换次极点 ωp2 位置观察相位裕度 PM 动态变化',
    defaultVariant: 'pm60',
    variants: [
      { id: 'pm60', label: 'ωp2 = 2.2·ω_GX（PM≈60° 黄金稳态）', formula: '黄金设计目标：PM ≥ 60° (ωp2 ≥ 2.2·GBW)' },
      { id: 'pm45', label: 'ωp2 = ω_GX（PM=45° 临界振铃）', formula: '稳定底线：PM = 45°（阶跃响应出现明显振铃过冲）' },
      { id: 'osc', label: 'ωp2 < ω_GX（振荡危险）', formula: '⚠️ 相位逼近 -180° 悬崖，极易触发自激振荡！' },
    ],
    coreFormula: '黄金设计目标：PM ≥ 60° (ωp2 ≥ 2.2·GBW) | β = 1 单位增益缓冲器是最恶劣稳定情况',
    defaultHint: '提示：悬停/点击红色 -180° 警戒线查看巴克豪森振荡判据！',
    Component: Schematic51,
  },
  '5.2': {
    title: '图 5.2 · 两级运放密勒补偿、调零电阻 RZ 与「极点分裂」',
    subtitle: '切换调零电阻 RZ 观察 s 平面右半平面零点移动轨迹',
    defaultVariant: 'rz_cancel',
    variants: [
      { id: 'cc_only', label: '未加 RZ (纯 CC)', formula: '引入恶毒 RHP 零点：ωz = +gm2 / CC' },
      { id: 'rz_cancel', label: '加入调零电阻 RZ = 1/gm2', formula: '消除 RHP 零点：1/gm2 - RZ = 0 → ωz → ∞' },
      { id: 'rz_lhp', label: 'RZ > 1/gm2（翻转至 LHP）', formula: '好零点：ωz 翻转至左半平面，可精准抵消次极点 ωp2！' },
    ],
    coreFormula: 'GBW = gm1/CC | ωp2 = gm2/CL | 消除 RHP 零点：RZ = 1/gm2',
    defaultHint: '提示：悬停/点击紫色桥接处的 RZ 电阻查看期末压轴大题三步模板！',
    Component: Schematic52,
  },
  '5.3': {
    title: '图 5.3 · 带隙基准 (Bandgap) 温度曲线叠加 & 核心原理框图',
    subtitle: '左图 CTAT+PTAT 零温漂叠加 · 右图运放钳位与启动电路',
    defaultVariant: 'dual',
    variants: [
      { id: 'dual', label: '曲线 + 框图全览' },
      { id: 'curve', label: 'CTAT + PTAT 温度补偿曲线', formula: '∂VBE/∂T ≈ -1.5mV/K + K·∂VT/∂T·ln(n) = 0' },
      { id: 'circuit', label: '带隙基准核心电路', formula: 'VREF = VBE + (R2/R1)·VT·ln(n) ≈ 1.2V' },
    ],
    coreFormula: 'VREF = VBE + K·VT·ln(n) ≈ 1.2V | 必加 Startup 启动电路防止全零简并态',
    defaultHint: '提示：悬停/点击虚线框 Startup 启动电路查看防死锁原理！',
    Component: Schematic53,
  },
};

export interface CheatsheetSchematicTarget {
  lessonId: string;
  variant: string;
  blockName: string;
}

export const CHEATSHEET_ROW_SCHEMATICS: CheatsheetSchematicTarget[] = [
  { lessonId: '1.2', variant: 'basic', blockName: '共源级 (CS)' },
  { lessonId: '1.2', variant: 'degen', blockName: '退化共源级 (CS+RS)' },
  { lessonId: '1.2', variant: 'cg_cd', blockName: '共栅级 (CG)' },
  { lessonId: '1.2', variant: 'cg_cd', blockName: '源跟随器 (CD)' },
  { lessonId: '1.3', variant: 'cascode', blockName: 'Cascode (叠罗汉)' },
  { lessonId: '2.1', variant: 'diff', blockName: '对称差动对 (Diff)' },
  { lessonId: '2.2', variant: 'ota5', blockName: '五管运放 (电流镜负载)' },
];

export interface AnalogSchematicProps {
  lessonId: string;
  initialVariant?: string;
  compact?: boolean;
}

export function AnalogSchematic({
  lessonId,
  initialVariant,
  compact = false,
}: AnalogSchematicProps) {
  const meta = SCHEMATIC_CATALOG[lessonId];
  const [variant, setVariant] = useState<string>(
    initialVariant || meta?.defaultVariant || ''
  );
  const [activeHintKey, setActiveHintKey] = useState<string | null>(null);
  const [activeHintText, setActiveHintText] = useState<string>('');
  const [zoomOpen, setZoomOpen] = useState<boolean>(false);
  const [zoomScale, setZoomScale] = useState<number>(1);

  useEffect(() => {
    const nextMeta = SCHEMATIC_CATALOG[lessonId];
    setVariant(initialVariant || nextMeta?.defaultVariant || '');
    setActiveHintKey(null);
    setActiveHintText('');
  }, [lessonId, initialVariant]);

  useEffect(() => {
    if (!zoomOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setZoomOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [zoomOpen]);

  if (!meta) return null;

  const { Component, variants, title, subtitle, coreFormula, defaultHint } = meta;
  const activeVariantMeta = variants?.find((v) => v.id === variant);
  const displayFormula = activeVariantMeta?.formula || coreFormula;

  const handleHint = (key: string, text: string) => {
    setActiveHintKey(key);
    setActiveHintText(text);
  };

  const openZoomModal = () => {
    setZoomScale(1);
    setZoomOpen(true);
  };

  return (
    <>
      <div className="rounded-2xl border border-violet-500/20 bg-[#FAFAFF] dark:bg-[#0F172A]/80 p-4 sm:p-5 space-y-3.5 shadow-sm [--svg-node-bg:#FAFAFF] dark:[--svg-node-bg:#0F172A]">
        {/* Header Bar */}
        <div className="flex flex-wrap items-start justify-between gap-2.5">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
              <Cpu className="w-4 h-4 text-[#8B5CF6] shrink-0" />
              <span>{title}</span>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">
              {subtitle}
            </p>
          </div>

          {!compact && (
            <button
              type="button"
              onClick={openZoomModal}
              className="inline-flex items-center gap-1.5 min-h-[34px] px-3 py-1.5 rounded-xl text-xs font-semibold border border-[#8B5CF6]/35 bg-[#8B5CF6]/10 text-[#6D28D9] dark:text-[#C4B5FD] hover:bg-[#8B5CF6]/20 transition-colors shrink-0"
            >
              <ZoomIn className="w-3.5 h-3.5" />
              <span>🔍 放大看图</span>
            </button>
          )}
        </div>

        {/* Interactive Variant Tabs */}
        {variants && variants.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {variants.map((v) => {
              const isSelected = v.id === variant;
              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => {
                    setVariant(v.id);
                    setActiveHintKey(null);
                    setActiveHintText('');
                  }}
                  className={`min-h-[34px] px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                    isSelected
                      ? 'bg-[#8B5CF6] text-white border-[#8B5CF6] shadow-sm'
                      : 'bg-white dark:bg-slate-900/75 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-[#8B5CF6]/50 hover:text-[#6D28D9] dark:hover:text-[#C4B5FD]'
                  }`}
                >
                  {v.label}
                </button>
              );
            })}
          </div>
        )}

        {/* SVG Canvas (Click anywhere on diagram to zoom in modal, or use magnification in compact mode) */}
        {compact ? (
          <div className="space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                当前比例：{Math.round(zoomScale * 100)}%（双击图面可快速缩放）
              </span>
              <ZoomControls zoom={zoomScale} onZoomChange={setZoomScale} accent="violet" />
            </div>
            <ZoomViewport
              zoom={zoomScale}
              onToggleZoom={() => setZoomScale((z) => (z > 1.1 ? 1 : 2))}
            >
              <Component
                variant={variant}
                onVariantChange={setVariant}
                activeHint={activeHintKey}
                onHint={handleHint}
              />
            </ZoomViewport>
          </div>
        ) : (
          <div
            onClick={openZoomModal}
            title="点击图片可全屏放大查看细节"
            className="group relative rounded-xl border border-slate-200/80 dark:border-slate-800/80 bg-white/90 dark:bg-[#0B1120]/90 p-2 sm:p-4 text-slate-800 dark:text-slate-100 cursor-zoom-in hover:border-[#8B5CF6]/45 transition-colors"
          >
            <Component
              variant={variant}
              onVariantChange={setVariant}
              activeHint={activeHintKey}
              onHint={handleHint}
            />
            <div className="pointer-events-none flex items-center justify-end gap-1 pt-1 text-[11px] font-mono text-slate-400 group-hover:text-[#8B5CF6] transition-colors">
              <ZoomIn className="w-3 h-3" />
              <span>点击原理图可全屏放大</span>
            </div>
          </div>
        )}

        {/* Bottom Formula & Node Pitfall Badges */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5">
          <div className="flex items-start gap-2 rounded-xl border border-[#8B5CF6]/25 bg-[#8B5CF6]/[0.06] dark:bg-[#8B5CF6]/10 px-3 py-2 text-xs">
            <Sparkles className="w-3.5 h-3.5 text-[#8B5CF6] shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-mono font-bold text-[#6D28D9] dark:text-[#C4B5FD] mr-1.5">
                核心秒杀公式：
              </span>
              <span className="font-mono text-slate-700 dark:text-slate-200">
                {displayFormula}
              </span>
            </div>
          </div>

          <div
            className={`flex items-start gap-2 rounded-xl border px-3 py-2 text-xs transition-colors ${
              activeHintText
                ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-900 dark:text-emerald-200'
                : 'border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/60 text-slate-600 dark:text-slate-300'
            }`}
          >
            <Info
              className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${
                activeHintText ? 'text-emerald-500' : 'text-[#38BDF8]'
              }`}
            />
            <div className="leading-snug">
              <span className="font-semibold mr-1">节点避坑提示：</span>
              <span>{activeHintText || defaultHint}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Fullscreen Lightbox Zoom Modal */}
      {zoomOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={title}
          onClick={() => setZoomOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-sm p-3 sm:p-6"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-6xl max-h-[92vh] overflow-y-auto rounded-2xl border border-[#8B5CF6]/40 bg-[#FAFAFF] dark:bg-[#0B1120] p-4 sm:p-6 shadow-2xl space-y-4 [--svg-node-bg:#FAFAFF] dark:[--svg-node-bg:#0B1120]"
          >
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
              <div>
                <div className="text-[11px] font-mono font-semibold text-[#8B5CF6] uppercase tracking-wider">
                  HIGH-RES VECTOR SCHEMATIC · 无极放大模式 ({Math.round(zoomScale * 100)}%)
                </div>
                <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">
                  {title}
                </h3>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <ZoomControls zoom={zoomScale} onZoomChange={setZoomScale} accent="violet" />
                <button
                  type="button"
                  onClick={() => setZoomOpen(false)}
                  aria-label="关闭放大弹窗"
                  className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:border-[#8B5CF6] hover:text-[#8B5CF6] transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {variants && variants.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {variants.map((v) => {
                  const isSelected = v.id === variant;
                  return (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => setVariant(v.id)}
                      className={`min-h-[36px] px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-medium border transition-all ${
                        isSelected
                          ? 'bg-[#8B5CF6] text-white border-[#8B5CF6] shadow-sm'
                          : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-[#8B5CF6]/50'
                      }`}
                    >
                      {v.label}
                    </button>
                  );
                })}
              </div>
            )}

            <ZoomViewport
              zoom={zoomScale}
              onToggleZoom={() => setZoomScale((z) => (z > 1.1 ? 1 : 2))}
            >
              <Component
                variant={variant}
                onVariantChange={setVariant}
                activeHint={activeHintKey}
                onHint={handleHint}
              />
            </ZoomViewport>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-xl border border-[#8B5CF6]/25 bg-[#8B5CF6]/[0.06] dark:bg-[#8B5CF6]/10 px-4 py-2.5 text-xs">
              <div className="font-mono text-[#6D28D9] dark:text-[#C4B5FD]">
                {displayFormula}
              </div>
              <div className="text-slate-600 dark:text-slate-300">
                {activeHintText || defaultHint}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export interface CheatsheetSchematicModalProps {
  target: CheatsheetSchematicTarget | null;
  onClose: () => void;
}

export function CheatsheetSchematicModal({
  target,
  onClose,
}: CheatsheetSchematicModalProps) {
  useEffect(() => {
    if (!target) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [target, onClose]);

  if (!target) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${target.blockName} 电路原理图`}
      onClick={onClose}
      className="print:hidden fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-sm p-3 sm:p-6"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-2xl border border-[#8B5CF6]/40 bg-white dark:bg-[#0B1120] p-4 sm:p-6 shadow-2xl space-y-4"
      >
        <div className="flex items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
          <div>
            <div className="text-[11px] font-mono font-semibold text-[#8B5CF6] uppercase tracking-wider">
              CHEATSHEET PREVIEW · 基本电路积木原理图
            </div>
            <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">
              {target.blockName}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="关闭原理图弹窗"
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:border-[#8B5CF6] hover:text-[#8B5CF6] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <AnalogSchematic
          lessonId={target.lessonId}
          initialVariant={target.variant}
          compact
        />
      </div>
    </div>
  );
}

export default AnalogSchematic;
