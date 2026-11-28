import React, { useState, useEffect } from 'react';
import { X, Calculator, Activity, Cpu, ShieldAlert, Wrench } from 'lucide-react';

const NSIGHT_WAVEFORMS = [
  {
    id: 'launch-bubble',
    title: '① 碎片发射气泡（Kernel Launch Overhead）',
    diagnosis: 'CPU 发射小 Kernel 的固定微秒级开销远大于 GPU 执行本身，导致时间轴出现大量短促碎条与白色空隙。',
    fix: '开启 CUDA Graph（图下沉）将数百个小算子打包为 1 条指令触发，并用 Triton/TileLang 做算子融合。',
    badBars: [
      { x: 10, w: 18 }, { x: 48, w: 15 }, { x: 84, w: 20 }, { x: 126, w: 14 },
      { x: 162, w: 18 }, { x: 202, w: 16 }, { x: 240, w: 18 },
    ],
    goodBars: [{ x: 10, w: 250 }],
  },
  {
    id: 'implicit-sync',
    title: '② 隐式同步空白（Implicit CPU-GPU Sync）',
    diagnosis: '循环内误用 .item() 或同步 cudaMemcpy，强迫 GPU 跑完一阵后彻底停机等待 CPU 分词/日志处理，形成大片连续空白。',
    fix: '删除同步锁、开启 Pinned Memory (pin_memory=True) 与异步 CUDA Stream 流水线喂数据。',
    badBars: [
      { x: 10, w: 42 }, { x: 105, w: 40 }, { x: 200, w: 45 },
    ],
    goodBars: [
      { x: 10, w: 60 }, { x: 74, w: 60 }, { x: 138, w: 60 }, { x: 202, w: 58 },
    ],
  },
  {
    id: 'comm-exposed',
    title: '③ 通信裸露未重叠（Exposed Collective Comm）',
    diagnosis: 'NCCL AllReduce / All-to-All 通信条完全串行排在矩阵计算条之后，GPU 算力单元在等待网卡传输时全程原地罚站。',
    fix: '使用多异步流 Compute-Comm Overlap（或 DualPipe），把通信条藏进计算条下方并行执行。',
    badBars: [
      { x: 10, w: 90, label: 'Compute' },
      { x: 104, w: 65, color: '#F59E0B', label: 'NCCL' },
      { x: 174, w: 85, label: 'Compute' },
    ],
    goodBars: [
      { x: 10, w: 120, label: 'Compute + Hidden Comm' },
      { x: 134, w: 126, label: 'Compute + Hidden Comm' },
    ],
  },
  {
    id: 'npu-fallback',
    title: '④ NPU 算子回退断层（Operator Fallback）',
    diagnosis: '自研 NPU 遇到 1 个未支持算子时，设备轨道骤然中断，数据经 PCIe 拷回 CPU 缓慢计算后再拷回 NPU，拖垮整层流水线。',
    fix: '用 msProf/PyTorch Profiler 定位 CPU Fallback 节点，使用 TileLang / Triton NPU 后端补齐融合算子。',
    badBars: [
      { x: 10, w: 55, label: 'NPU' },
      { x: 70, w: 80, color: '#EF4444', label: 'CPU Fallback' },
      { x: 155, w: 60, label: 'NPU' },
    ],
    goodBars: [
      { x: 10, w: 85, label: 'NPU GEMM' },
      { x: 99, w: 75, label: 'NPU Fused Norm' },
      { x: 178, w: 82, label: 'NPU Attn' },
    ],
  },
  {
    id: 'rl-rollout',
    title: '⑤ RL Rollout 长尾阶梯（Straggler Tail）',
    diagnosis: 'GRPO/RLVR 同步批处理下，短思维链早已结束并空转闲置，全卡必须干等最长的 20K Token 轨迹生成完成。',
    fix: '采用异步解耦 Rollout 调度池 + 连续批处理插队释放槽位，并配合分片权重高速广播。',
    badBars: [
      { x: 10, w: 45, label: 'Seq1' },
      { x: 10, w: 250, color: '#F59E0B', label: 'Long CoT Straggler (20K)' },
    ],
    goodBars: [
      { x: 10, w: 115, label: 'Async Pool A' },
      { x: 129, w: 131, label: 'Async Pool B' },
    ],
  },
];

export default function FormulaQuickRefModal({ isOpen, onClose }) {
  const [tab, setTab] = useState('formulas'); // 'formulas' | 'waveforms'
  const [hoveredWave, setHoveredWave] = useState(null);

  useEffect(() => {
    if (!isOpen) return undefined;
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-5xl max-h-[90vh] rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0B1120] shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Calculator className="w-5 h-5 text-sky-400" />
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                一屏公式常数速查 & Nsight 5 大病症波形图谱
              </h3>
              <p className="text-[11px] font-mono text-slate-500">
                全局快捷键：Shift + ? 随时呼出 · Esc 关闭
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="inline-flex p-1 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setTab('formulas')}
                className={`px-3 py-1 rounded-lg transition-colors ${
                  tab === 'formulas'
                    ? 'bg-sky-500 text-slate-950'
                    : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                Tab A · 4 栏公式常数
              </button>
              <button
                type="button"
                onClick={() => setTab('waveforms')}
                className={`px-3 py-1 rounded-lg transition-colors ${
                  tab === 'waveforms'
                    ? 'bg-emerald-500 text-slate-950'
                    : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                Tab B · Nsight 5 大波形 SVG
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1">
          {tab === 'formulas' ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Col 1 */}
              <div className="rounded-xl border border-sky-500/30 bg-sky-500/[0.05] p-4 space-y-2.5">
                <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-sky-600 dark:text-sky-400">
                  <Calculator className="w-3.5 h-3.5" />
                  <span>1. 核心算账公式</span>
                </div>
                <ul className="space-y-2 text-xs font-mono text-slate-700 dark:text-slate-200">
                  <li>AI = FLOPs ÷ Bytes</li>
                  <li>拐点 Ridge = Peak_TF ÷ BW_TB</li>
                  <li>KV(BF16) = 2×L×Nkv×D×S×2B</li>
                  <li>推理计算 ≈ 2 × P / token</li>
                  <li>训练静态 ≈ 16 × P (AdamW)</li>
                  <li>动态功耗 P = α·C·V²·f</li>
                </ul>
              </div>

              {/* Col 2 */}
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/[0.05] p-4 space-y-2.5">
                <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  <Cpu className="w-3.5 h-3.5" />
                  <span>2. 主流显卡常数</span>
                </div>
                <ul className="space-y-2 text-xs font-mono text-slate-700 dark:text-slate-200">
                  <li>H100 SXM: 80G | 3.35TB/s | 989TF</li>
                  <li>H100 拐点 ≈ 295 FLOPs/Byte</li>
                  <li>B200: 192G | 8.0TB/s | 2250TF</li>
                  <li>RTX 4090: 24G | 1.0TB/s | 165TF</li>
                  <li>RTX 5090: 32G | 1.79TB/s | 209TF</li>
                  <li>昇腾 910B: 64G | 1.6TB/s | 320TF</li>
                </ul>
              </div>

              {/* Col 3 */}
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/[0.05] p-4 space-y-2.5">
                <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-amber-600 dark:text-amber-400">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>3. 体验与物理红线</span>
                </div>
                <ul className="space-y-2 text-xs font-mono text-slate-700 dark:text-slate-200">
                  <li>流畅阅读 TPOT ≤ 50ms (≥20 tok/s)</li>
                  <li>vLLM 分页碎片浪费 &lt; 4%</li>
                  <li>硅片结温热节流红线：85℃</li>
                  <li>光罩极限 Reticle Limit: 858 mm²</li>
                  <li>Decode 优秀 MBU 目标: &gt; 65%</li>
                  <li>Cache Line: CPU 64B / GPU 128B</li>
                </ul>
              </div>

              {/* Col 4 */}
              <div className="rounded-xl border border-indigo-500/30 bg-indigo-500/[0.05] p-4 space-y-2.5">
                <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400">
                  <Wrench className="w-3.5 h-3.5" />
                  <span>4. 排障四板斧</span>
                </div>
                <ul className="space-y-2 text-xs font-mono text-slate-700 dark:text-slate-200">
                  <li>1) nvidia-smi dmon -s pucm</li>
                  <li>2) nsys profile --trace=cuda,nvtx</li>
                  <li>3) py-spy top --pid &lt;PID&gt;</li>
                  <li>4) nccl-tests / ib_write_bw</li>
                  <li>5) nvidia-smi topo -m + numactl</li>
                  <li>6) nvidia-smi -q -d PERFORMANCE</li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span className="inline-flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  <span>悬停任意波形卡片查看精准诊断定位与优化方案</span>
                </span>
                {hoveredWave && (
                  <span className="font-mono text-sky-500 font-semibold">
                    当前聚焦：{hoveredWave.title}
                  </span>
                )}
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                {NSIGHT_WAVEFORMS.map((wf) => (
                  <div
                    key={wf.id}
                    onMouseEnter={() => setHoveredWave(wf)}
                    onMouseLeave={() => setHoveredWave(null)}
                    className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 p-4 space-y-3 hover:border-sky-400/60 transition-colors"
                  >
                    <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                      {wf.title}
                    </div>

                    {/* Pure Vector SVG Before vs After Waveform */}
                    <svg viewBox="0 0 280 76" className="w-full h-20 rounded-lg bg-[#050811] border border-slate-800">
                      <text x="8" y="14" fill="#FB7185" fontSize="8.5" fontFamily="monospace">
                        Before (病态时间轴)
                      </text>
                      <line x1="8" y1="30" x2="270" y2="30" stroke="#1E293B" strokeWidth="1" />
                      {wf.badBars.map((b, i) => (
                        <g key={i}>
                          <rect
                            x={b.x}
                            y={20}
                            width={b.w}
                            height={14}
                            rx="2"
                            fill={b.color || '#F43F5E'}
                          />
                          {b.label && b.w >= 40 && (
                            <text x={b.x + 4} y={30} fill="#050811" fontSize="7" fontFamily="monospace" fontWeight="bold">
                              {b.label}
                            </text>
                          )}
                        </g>
                      ))}

                      <text x="8" y="48" fill="#34D399" fontSize="8.5" fontFamily="monospace">
                        After (优化后)
                      </text>
                      <line x1="8" y1="64" x2="270" y2="64" stroke="#1E293B" strokeWidth="1" />
                      {wf.goodBars.map((b, i) => (
                        <g key={i}>
                          <rect
                            x={b.x}
                            y={54}
                            width={b.w}
                            height={14}
                            rx="2"
                            fill="#10B981"
                          />
                          {b.label && b.w >= 45 && (
                            <text x={b.x + 4} y={64} fill="#050811" fontSize="7" fontFamily="monospace" fontWeight="bold">
                              {b.label}
                            </text>
                          )}
                        </g>
                      ))}
                    </svg>

                    <div className="text-xs space-y-1">
                      <p className="text-slate-600 dark:text-slate-300">
                        <strong className="text-rose-500">病灶：</strong>{wf.diagnosis}
                      </p>
                      <p className="text-slate-600 dark:text-slate-300">
                        <strong className="text-emerald-500">处方：</strong>{wf.fix}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
