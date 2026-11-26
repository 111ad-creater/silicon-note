import React, { useState, useEffect, useMemo } from 'react';
import { Layers, Plus, Play, X, Zap, RotateCcw, AlertOctagon, Sparkles } from 'lucide-react';

const TOTAL_BLOCKS = 64; // 8x8 memory pool
const CONTIGUOUS_RESERVE = 16; // Each contiguous request reserves 16 slots

const REQ_PALETTE = [
  { bg: 'bg-sky-500', text: 'text-slate-950', border: 'border-sky-300', dot: '#0EA5E9' },
  { bg: 'bg-emerald-400', text: 'text-slate-950', border: 'border-emerald-200', dot: '#34D399' },
  { bg: 'bg-violet-500', text: 'text-white', border: 'border-violet-300', dot: '#8B5CF6' },
  { bg: 'bg-amber-400', text: 'text-slate-950', border: 'border-amber-200', dot: '#FBBF24' },
  { bg: 'bg-pink-500', text: 'text-white', border: 'border-pink-300', dot: '#EC4899' },
  { bg: 'bg-cyan-400', text: 'text-slate-950', border: 'border-cyan-200', dot: '#22D3EE' },
  { bg: 'bg-lime-400', text: 'text-slate-950', border: 'border-lime-200', dot: '#A3E635' },
  { bg: 'bg-orange-400', text: 'text-slate-950', border: 'border-orange-200', dot: '#FB923C' },
];

function createInitialSim() {
  return {
    nextId: 1,
    leftBlocks: Array(TOTAL_BLOCKS).fill(null), // null or { reqId, kind: 'used'|'reserved', colorIdx }
    leftRequests: [], // { id, used, maxLen: 16, start, colorIdx }
    leftOomCount: 0,
    leftLastOom: false,
    rightBlocks: Array(TOTAL_BLOCKS).fill(null), // null or { reqId, colorIdx }
    rightRequests: [], // { id, blocks: [], colorIdx, targetLen }
    rightOomCount: 0,
  };
}

function findContiguousRun(blocks, needed) {
  let run = 0;
  for (let i = 0; i < blocks.length; i += 1) {
    if (blocks[i] === null) {
      run += 1;
      if (run === needed) return i - needed + 1;
    } else {
      run = 0;
    }
  }
  return -1;
}

function stepAddRequest(prev, initialTokensOverride, targetLenOverride) {
  const reqId = prev.nextId;
  const colorIdx = (reqId - 1) % REQ_PALETTE.length;
  const initTokens = initialTokensOverride ?? (reqId % 2 === 0 ? 2 : 1);
  const targetLen = targetLenOverride ?? 5 + ((reqId * 3) % 7);

  // Left: contiguous 16-block reservation
  const leftBlocks = [...prev.leftBlocks];
  const leftRequests = [...prev.leftRequests];
  let leftOomCount = prev.leftOomCount;
  let leftLastOom = false;

  const startIdx = findContiguousRun(leftBlocks, CONTIGUOUS_RESERVE);
  if (startIdx >= 0) {
    for (let k = 0; k < CONTIGUOUS_RESERVE; k += 1) {
      leftBlocks[startIdx + k] = {
        reqId,
        kind: k < initTokens ? 'used' : 'reserved',
        colorIdx,
      };
    }
    leftRequests.push({
      id: reqId,
      start: startIdx,
      used: initTokens,
      maxLen: CONTIGUOUS_RESERVE,
      colorIdx,
    });
  } else {
    leftOomCount += 1;
    leftLastOom = true;
  }

  // Right: PagedAttention allocates only initTokens discrete free blocks
  const rightBlocks = [...prev.rightBlocks];
  const rightRequests = [...prev.rightRequests];
  let rightOomCount = prev.rightOomCount;

  const freeIndices = [];
  for (let i = 0; i < rightBlocks.length; i += 1) {
    if (rightBlocks[i] === null) freeIndices.push(i);
    if (freeIndices.length === initTokens) break;
  }

  if (freeIndices.length === initTokens) {
    freeIndices.forEach((bIdx) => {
      rightBlocks[bIdx] = { reqId, colorIdx };
    });
    rightRequests.push({
      id: reqId,
      blocks: freeIndices,
      colorIdx,
      targetLen,
    });
  } else {
    rightOomCount += 1;
  }

  return {
    nextId: reqId + 1,
    leftBlocks,
    leftRequests,
    leftOomCount,
    leftLastOom,
    rightBlocks,
    rightRequests,
    rightOomCount,
  };
}

function stepAdvanceRound(prev) {
  const leftBlocks = [...prev.leftBlocks];
  const leftRequests = prev.leftRequests.map((req) => {
    if (req.used < req.maxLen) {
      const nextUsed = req.used + 1;
      leftBlocks[req.start + req.used] = {
        reqId: req.id,
        kind: 'used',
        colorIdx: req.colorIdx,
      };
      return { ...req, used: nextUsed };
    }
    return req;
  });

  const rightBlocks = [...prev.rightBlocks];
  let rightOomCount = prev.rightOomCount;
  const rightRequests = prev.rightRequests.map((req) => {
    if (req.blocks.length >= req.targetLen) return req;
    const freeIdx = rightBlocks.findIndex((b) => b === null);
    if (freeIdx >= 0) {
      rightBlocks[freeIdx] = { reqId: req.id, colorIdx: req.colorIdx };
      return { ...req, blocks: [...req.blocks, freeIdx] };
    }
    rightOomCount += 1;
    return req;
  });

  return {
    ...prev,
    leftBlocks,
    leftRequests,
    leftLastOom: false,
    rightBlocks,
    rightRequests,
    rightOomCount,
  };
}

function stepFreeRequest(prev, specificId) {
  const targetId =
    specificId ??
    (prev.rightRequests.length > 0
      ? prev.rightRequests[Math.floor(prev.rightRequests.length / 2)].id
      : null);
  if (targetId === null) return prev;

  const leftBlocks = prev.leftBlocks.map((b) => (b && b.reqId === targetId ? null : b));
  const leftRequests = prev.leftRequests.filter((r) => r.id !== targetId);

  const rightBlocks = prev.rightBlocks.map((b) => (b && b.reqId === targetId ? null : b));
  const rightRequests = prev.rightRequests.filter((r) => r.id !== targetId);

  return {
    ...prev,
    leftBlocks,
    leftRequests,
    leftLastOom: false,
    rightBlocks,
    rightRequests,
  };
}

function buildHighConcurrencyDemoState() {
  let state = createInitialSim();
  state = stepAddRequest(state, 3, 7); // Req 1 -> left [0..15]
  state = stepAddRequest(state, 2, 8); // Req 2 -> left [16..31]
  state = stepAddRequest(state, 3, 6); // Req 3 -> left [32..47]
  state = stepAdvanceRound(state);
  state = stepAdvanceRound(state);
  // Free Req 2 (middle hole [16..31]), then add Req 4 (fills [16..31]), wait: to show external fragmentation:
  // If we fill 4 requests [0..15], [16..31], [32..47], [48..63], free #1 and #3? No, freeing 16 contiguous still fits 16!
  // Wait: how does external fragmentation happen with fixed 16?
  // Suppose Req 1 uses 16, Req 2 uses 16, Req 3 uses 16... if all blocks are 16-aligned they fit, UNLESS we allocate variable or partial or left is full with internal waste!
  // Let's also allow a small 8-block vs 16-block realistic variable request maxLen OR fill 4 requests on Left (each wasting 10+ internal slots = 64/64 occupied!) and then Req 5 arrives: Left has 48+ wasted reserved blocks and rejects Req 5 with OOM, while Right has 40+ free blocks and smoothly accepts Req 5, 6, 7, 8!
  state = stepAddRequest(state, 2, 9); // Req 4 -> left [48..63] (64/64 locked!)
  state = stepAddRequest(state, 2, 7); // Req 5 -> Left hits OOM! Right only used ~19/64 blocks, accepts Req 5!
  state = stepAddRequest(state, 3, 6); // Req 6 -> Left hits OOM! Right accepts Req 6!
  state = stepAddRequest(state, 2, 8); // Req 7 -> Left hits OOM! Right accepts Req 7!
  return state;
}

export default function Lab5VllmPaged({ preset, presetNonce }) {
  const [sim, setSim] = useState(() => createInitialSim());

  useEffect(() => {
    if (!preset) return;
    if (preset.autoDemo) {
      setSim(buildHighConcurrencyDemoState());
    }
  }, [preset, presetNonce]);

  const metrics = useMemo(() => {
    const leftUsedCount = sim.leftBlocks.filter((b) => b && b.kind === 'used').length;
    const leftInternalWaste = sim.leftBlocks.filter((b) => b && b.kind === 'reserved').length;
    const leftTotalAllocated = leftUsedCount + leftInternalWaste;
    const leftFree = TOTAL_BLOCKS - leftTotalAllocated;
    const leftHasContiguous16 = findContiguousRun(sim.leftBlocks, CONTIGUOUS_RESERVE) >= 0;
    const leftExternalDead = !leftHasContiguous16 ? leftFree : 0;
    const leftWasteDenom = Math.max(1, leftTotalAllocated + leftExternalDead);
    const leftWastePct = ((leftInternalWaste + leftExternalDead) / leftWasteDenom) * 100;

    const rightUsedCount = sim.rightBlocks.filter(Boolean).length;
    const rightFree = TOTAL_BLOCKS - rightUsedCount;
    // PagedAttention only has tiny <4% sub-block trailing token fragmentation (modeled as ~2.5% when active)
    const rightWastePct = sim.rightRequests.length > 0 ? 2.8 : 0;

    return {
      leftUsedCount,
      leftInternalWaste,
      leftFree,
      leftHasContiguous16,
      leftWastePct,
      rightUsedCount,
      rightFree,
      rightWastePct,
    };
  }, [sim]);

  return (
    <div className="space-y-6">
      {/* Action Toolbar */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120]/95 p-4 flex flex-wrap items-center justify-between gap-3 shadow-sm">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSim((s) => stepAddRequest(s))}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-sky-500 hover:bg-sky-400 text-slate-950 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ 新接入用户请求</span>
          </button>

          <button
            onClick={() => setSim((s) => stepAdvanceRound(s))}
            disabled={sim.rightRequests.length === 0}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-slate-950 transition-colors"
          >
            <Play className="w-3.5 h-3.5" />
            <span>▶ 推进生成 1 轮</span>
          </button>

          <button
            onClick={() => setSim((s) => stepFreeRequest(s))}
            disabled={sim.rightRequests.length === 0}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium border border-slate-200 dark:border-slate-700 hover:border-rose-400/50 disabled:opacity-40 text-slate-700 dark:text-slate-200 transition-colors"
          >
            <X className="w-3.5 h-3.5 text-rose-400" />
            <span>✕ 随机结束 1 个请求</span>
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSim(buildHighConcurrencyDemoState())}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>⚡ 一键演示高并发对比</span>
          </button>

          <button
            onClick={() => setSim(createInitialSim())}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-400 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>重置</span>
          </button>
        </div>
      </div>

      {/* Top Comparison Metrics Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl border border-rose-500/30 bg-rose-500/5">
          <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
            传统连续分配 · 显存浪费率
          </div>
          <div className="text-xl font-mono font-bold text-rose-500 mt-1">
            {metrics.leftWastePct.toFixed(1)}%
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            预留未使用：{metrics.leftInternalWaste} 格内部碎片
          </div>
        </div>

        <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5">
          <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
            vLLM 便利贴 · 显存浪费率
          </div>
          <div className="text-xl font-mono font-bold text-emerald-500 mt-1">
            {metrics.rightWastePct.toFixed(1)}%
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            按需粘贴 · 剩 {metrics.rightFree} / 64 空闲槽
          </div>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120]">
          <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
            当前最大并发接待人数
          </div>
          <div className="text-xl font-mono font-bold text-slate-900 dark:text-white mt-1">
            左 {sim.leftRequests.length} 人 vs{' '}
            <span className="text-sky-500">右 {sim.rightRequests.length} 人</span>
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            同卡 64 Block 显存池
          </div>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120]">
          <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
            传统模式累计 OOM 拒接
          </div>
          <div className="text-xl font-mono font-bold text-amber-500 mt-1">
            {sim.leftOomCount} 次拒接
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            vLLM 拒接：{sim.rightOomCount} 次
          </div>
        </div>
      </div>

      {/* Dual Split 8x8 Grids */}
      <div className="grid lg:grid-cols-2 gap-6 items-start">
        {/* LEFT: Traditional Contiguous Allocation */}
        <div
          className={`rounded-2xl border p-5 space-y-4 transition-all ${
            sim.leftLastOom
              ? 'border-rose-500 bg-rose-500/5 shadow-glow-oom'
              : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120]/95'
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                传统连续分配（整本大笔记本强行占座）
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                每个请求一次性锁死连续 16 格，未写完的空格别人不能用
              </p>
            </div>
            <span className="font-mono text-xs px-2.5 py-1 rounded-lg bg-rose-500/10 text-rose-500 border border-rose-500/25">
              连续 16 格/人
            </span>
          </div>

          {sim.leftLastOom && (
            <div className="rounded-xl border border-rose-500/50 bg-rose-500/15 px-3.5 py-2.5 flex items-center gap-2 text-xs text-rose-600 dark:text-rose-200 font-mono font-bold">
              <AlertOctagon className="w-4 h-4 text-rose-500 shrink-0" />
              <span>🚨 OOM 拒接新请求！连续 16 格已被占满或碎片阻塞（右侧仍在轻松接客！）</span>
            </div>
          )}

          {/* 8x8 Neon Grid */}
          <div className="grid grid-cols-8 gap-1.5 p-3.5 rounded-xl bg-slate-950 border border-slate-800">
            {sim.leftBlocks.map((cell, idx) => {
              if (!cell) {
                return (
                  <div
                    key={idx}
                    className="h-9 rounded-md border border-slate-800/80 bg-slate-900/50 flex items-center justify-center font-mono text-[10px] text-slate-700"
                  >
                    {idx}
                  </div>
                );
              }
              const pal = REQ_PALETTE[cell.colorIdx];
              if (cell.kind === 'used') {
                return (
                  <div
                    key={idx}
                    className={`h-9 rounded-md border ${pal.bg} ${pal.border} ${pal.text} flex items-center justify-center font-mono text-[10px] font-bold shadow-sm transition-all`}
                  >
                    R{cell.reqId}
                  </div>
                );
              }
              return (
                <div
                  key={idx}
                  title={`Req #${cell.reqId} 提前占座但未用的内部碎片`}
                  className="h-9 rounded-md border border-dashed border-slate-600/80 flex items-center justify-center font-mono text-[9px] text-slate-400"
                  style={{
                    backgroundImage:
                      'repeating-linear-gradient(45deg, rgba(148,163,184,0.16), rgba(148,163,184,0.16) 4px, transparent 4px, transparent 8px)',
                  }}
                >
                  碎
                </div>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-4 text-[11px] font-mono text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-sky-500 inline-block" />
              实际已写入 Token ({metrics.leftUsedCount} 格)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded border border-dashed border-slate-500 bg-slate-600/30 inline-block" />
              内部碎片浪费 ({metrics.leftInternalWaste} 格)
            </span>
          </div>
        </div>

        {/* RIGHT: vLLM PagedAttention */}
        <div className="rounded-2xl border border-emerald-500/30 bg-white dark:bg-[#0B1120]/95 p-5 space-y-4 shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-emerald-400" />
                <span>vLLM PagedAttention（按需粘贴的离散便利贴）</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                写 1 个字才申请 1 格便利贴，物理散落各地也能无缝协同
              </p>
            </div>
            <span className="font-mono text-xs px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25">
              零浪费分页
            </span>
          </div>

          {/* 8x8 Neon Grid */}
          <div className="grid grid-cols-8 gap-1.5 p-3.5 rounded-xl bg-slate-950 border border-slate-800">
            {sim.rightBlocks.map((cell, idx) => {
              if (!cell) {
                return (
                  <div
                    key={idx}
                    className="h-9 rounded-md border border-slate-800/80 bg-slate-900/50 flex items-center justify-center font-mono text-[10px] text-slate-600"
                  >
                    {idx}
                  </div>
                );
              }
              const pal = REQ_PALETTE[cell.colorIdx];
              return (
                <div
                  key={idx}
                  className={`h-9 rounded-md border ${pal.bg} ${pal.border} ${pal.text} flex flex-col items-center justify-center font-mono text-[9px] font-bold leading-none shadow-sm transition-all`}
                >
                  <span>R{cell.reqId}</span>
                  <span className="opacity-75 text-[8px]">#{idx}</span>
                </div>
              );
            })}
          </div>

          {/* Live Block Table Mapping */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/70 p-3.5 space-y-2">
            <div className="text-[11px] font-mono font-semibold text-sky-600 dark:text-sky-400">
              📑 实时 Block Table 小目录（逻辑连续 → 物理离散物理块号）
            </div>
            {sim.rightRequests.length === 0 ? (
              <div className="text-xs text-slate-400 font-mono py-1">
                暂无活跃请求，点击上方「+ 新接入用户请求」或「⚡ 一键演示高并发对比」开始观察。
              </div>
            ) : (
              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                {sim.rightRequests.map((req) => {
                  const pal = REQ_PALETTE[req.colorIdx];
                  return (
                    <div
                      key={req.id}
                      className="flex flex-wrap items-center gap-2 text-xs font-mono bg-white dark:bg-[#0B1120] px-2.5 py-1.5 rounded-lg border border-slate-200/80 dark:border-slate-800"
                    >
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: pal.dot }}
                      />
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        Req #{req.id}
                      </span>
                      <span className="text-slate-400">→</span>
                      <span className="text-emerald-600 dark:text-emerald-400 break-all">
                        [{req.blocks.join(', ')}]
                      </span>
                      <button
                        onClick={() => setSim((s) => stepFreeRequest(s, req.id))}
                        className="ml-auto text-[10px] text-slate-400 hover:text-rose-400"
                        title="释放该请求"
                      >
                        释放
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Intuition Strip */}
      <div className="rounded-xl bg-slate-100/80 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 p-4 flex items-start gap-3">
        <Sparkles className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
        <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-300">
          <strong className="text-slate-900 dark:text-white">实验观察指南：</strong>
          试着连续点击 4 次「+ 新接入用户请求」——左侧 64 格被 4 个人的斜纹预留座彻底占满（即便每人只写了 1~3 格），第 5 个用户立刻撞上{' '}
          <span className="font-mono text-rose-500 font-bold">OOM 拒接</span>；而右侧的 PagedAttention 才用了不到 10 格，还能继续轻松接待第 5、6、7、8 个新用户！
        </p>
      </div>
    </div>
  );
}
