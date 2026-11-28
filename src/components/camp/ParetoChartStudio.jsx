import React, { useState, useMemo, useRef } from 'react';
import { BarChart3, Download, Upload, Sparkles } from 'lucide-react';

const SAMPLE_CSV = `concurrency,tpot_ms,throughput_tps,baseline_tps
1,16,62,55
4,21,190,86
16,29,551,115
32,38,842,114
64,58,1120,112`;

function parseCsvOrJson(raw) {
  const trimmed = raw.trim();
  if (!trimmed) return [];
  if (trimmed.startsWith('[')) {
    const arr = JSON.parse(trimmed);
    return arr.map((r) => ({
      concurrency: Number(r.concurrency || r.batch || 1),
      tpot: Number(r.tpot_ms || r.tpot || 20),
      tps: Number(r.throughput_tps || r.tps || 100),
      baseline: Number(r.baseline_tps || r.baseline || 0),
    }));
  }
  const lines = trimmed.split(/\r?\n/).filter((l) => l.trim());
  const rows = [];
  for (let i = 0; i < lines.length; i++) {
    const cols = lines[i].split(/[,\t]+/).map((c) => c.trim());
    if (i === 0 && Number.isNaN(Number(cols[0]))) continue; // skip header
    if (cols.length >= 3) {
      rows.push({
        concurrency: Number(cols[0]) || i + 1,
        tpot: Number(cols[1]) || 0,
        tps: Number(cols[2]) || 0,
        baseline: cols[3] ? Number(cols[3]) : 0,
      });
    }
  }
  return rows;
}

export default function ParetoChartStudio() {
  const [rawInput, setRawInput] = useState(SAMPLE_CSV);
  const svgRef = useRef(null);

  const data = useMemo(() => {
    try {
      return parseCsvOrJson(rawInput).filter((d) => d.tps > 0 && d.tpot > 0);
    } catch {
      return [];
    }
  }, [rawInput]);

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') setRawInput(reader.result);
    };
    reader.readAsText(file);
  };

  const handleDownloadPng = () => {
    if (!svgRef.current) return;
    const svgXml = new XMLSerializer().serializeToString(svgRef.current);
    const svgBlob = new Blob([svgXml], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 1280;
      canvas.height = 680;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#060A13';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      const a = document.createElement('a');
      a.download = 'silicon-note-pareto-chart.png';
      a.href = canvas.toDataURL('image/png');
      a.click();
    };
    img.src = url;
  };

  const W = 640;
  const H = 340;
  const PAD = { left: 58, right: 28, top: 28, bottom: 44 };
  const maxTpot = Math.max(70, ...data.map((d) => d.tpot * 1.15));
  const maxTps = Math.max(200, ...data.map((d) => Math.max(d.tps, d.baseline || 0) * 1.15));

  const mapX = (tpot) =>
    PAD.left + (tpot / maxTpot) * (W - PAD.left - PAD.right);
  const mapY = (tps) =>
    H - PAD.bottom - (tps / maxTps) * (H - PAD.top - PAD.bottom);

  const sloX = mapX(50);
  const polyPoints = data.map((d) => `${mapX(d.tpot)},${mapY(d.tps)}`).join(' ');

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120]/90 p-5 sm:p-6 space-y-5 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-mono text-emerald-600 dark:text-emerald-400">
            <BarChart3 className="w-4 h-4" />
            <span>PARETO CHART STUDIO · 压测 CSV/JSON 纯前端帕累托画图台</span>
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
            吞吐-延迟帕累托曲线（带 50ms SLO 红线）& 优化对比导出 PNG
          </h3>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setRawInput(SAMPLE_CSV)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:border-sky-400"
          >
            <Sparkles className="w-3.5 h-3.5 text-sky-400" />
            <span>填入 4090 压测示例</span>
          </button>
          <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:border-sky-400 cursor-pointer">
            <Upload className="w-3.5 h-3.5 text-emerald-400" />
            <span>导入 CSV</span>
            <input type="file" accept=".csv,.txt,.json" onChange={handleFileUpload} className="hidden" />
          </label>
          <button
            type="button"
            onClick={handleDownloadPng}
            disabled={data.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 disabled:opacity-40"
          >
            <Download className="w-3.5 h-3.5" />
            <span>下载高清 PNG</span>
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-5 items-start">
        {/* Left CSV/JSON Input + Bar Comparison */}
        <div className="lg:col-span-5 space-y-4">
          <div className="space-y-1.5">
            <label className="text-[11px] font-mono text-slate-500">
              粘贴 CSV（并发, TPOT_ms, 优化吞吐, 基线吞吐）或 JSON 数组
            </label>
            <textarea
              rows={7}
              value={rawInput}
              onChange={(e) => setRawInput(e.target.value)}
              className="w-full p-3 rounded-xl text-xs font-mono border border-slate-200 dark:border-slate-800 bg-slate-950 text-sky-300 focus:outline-none focus:border-sky-400"
            />
          </div>

          {data.length > 0 && (
            <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 p-3.5 space-y-2.5">
              <div className="text-[11px] font-mono font-semibold text-slate-500">
                优化前后吞吐柱状对比 (tok/s)
              </div>
              {data.map((d) => (
                <div key={d.concurrency} className="space-y-1 text-[11px] font-mono">
                  <div className="flex justify-between text-slate-600 dark:text-slate-300">
                    <span>{d.concurrency} 并发 (TPOT {d.tpot}ms)</span>
                    <span className="text-emerald-500 font-bold">{d.tps} tok/s</span>
                  </div>
                  <div className="h-2.5 rounded bg-slate-200 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-sky-500 to-emerald-400"
                      style={{ width: `${Math.min(100, (d.tps / maxTps) * 100)}%` }}
                    />
                  </div>
                  {d.baseline > 0 && (
                    <div className="h-1.5 rounded bg-slate-200 dark:bg-slate-800 overflow-hidden">
                      <div
                        className="h-full bg-amber-500/80"
                        style={{ width: `${Math.min(100, (d.baseline / maxTps) * 100)}%` }}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Pure SVG Pareto Plot */}
        <div className="lg:col-span-7 rounded-xl bg-slate-950 border border-slate-800 p-3 overflow-x-auto">
          <svg
            ref={svgRef}
            viewBox={`0 0 ${W} ${H}`}
            className="w-full h-auto min-w-[460px] select-none"
          >
            {/* Grid */}
            {[0.25, 0.5, 0.75, 1].map((r) => {
              const y = PAD.top + r * (H - PAD.top - PAD.bottom);
              const val = Math.round((1 - r) * maxTps);
              return (
                <g key={r}>
                  <line x1={PAD.left} y1={y} x2={W - PAD.right} y2={y} stroke="#1E293B" strokeWidth="1" />
                  <text x={PAD.left - 8} y={y + 3} textAnchor="end" fill="#64748B" fontSize="10" fontFamily="monospace">
                    {val}
                  </text>
                </g>
              );
            })}

            {/* Axes */}
            <line x1={PAD.left} y1={PAD.top} x2={PAD.left} y2={H - PAD.bottom} stroke="#475569" strokeWidth="1.5" />
            <line x1={PAD.left} y1={H - PAD.bottom} x2={W - PAD.right} y2={H - PAD.bottom} stroke="#475569" strokeWidth="1.5" />

            {/* 50ms SLO Red Line */}
            {50 <= maxTpot && (
              <>
                <line
                  x1={sloX}
                  y1={PAD.top}
                  x2={sloX}
                  y2={H - PAD.bottom}
                  stroke="#F43F5E"
                  strokeWidth="2"
                  strokeDasharray="5 4"
                />
                <text x={sloX + 6} y={PAD.top + 14} fill="#FB7185" fontSize="10.5" fontFamily="monospace" fontWeight="bold">
                  50ms SLO 红线
                </text>
              </>
            )}

            {/* Pareto Polyline */}
            {data.length > 1 && (
              <polyline
                points={polyPoints}
                fill="none"
                stroke="#38BDF8"
                strokeWidth="3"
                strokeLinejoin="round"
              />
            )}

            {/* Data Points */}
            {data.map((d) => {
              const cx = mapX(d.tpot);
              const cy = mapY(d.tps);
              const withinSlo = d.tpot <= 50;
              return (
                <g key={d.concurrency}>
                  <circle
                    cx={cx}
                    cy={cy}
                    r="6"
                    fill={withinSlo ? '#10B981' : '#F59E0B'}
                    stroke="#FFFFFF"
                    strokeWidth="2"
                  />
                  <text
                    x={cx}
                    y={cy - 10}
                    textAnchor="middle"
                    fill="#E2E8F0"
                    fontSize="10"
                    fontFamily="monospace"
                  >
                    B={d.concurrency} ({d.tps})
                  </text>
                </g>
              );
            })}

            {/* Axis Titles */}
            <text x={(PAD.left + W - PAD.right) / 2} y={H - 8} textAnchor="middle" fill="#94A3B8" fontSize="11" fontFamily="monospace">
              单用户 TPOT 延迟 (ms · 越靠左越流畅)
            </text>
            <text
              x={16}
              y={(PAD.top + H - PAD.bottom) / 2}
              textAnchor="middle"
              fill="#94A3B8"
              fontSize="11"
              fontFamily="monospace"
              transform={`rotate(-90 16 ${(PAD.top + H - PAD.bottom) / 2})`}
            >
              系统总吞吐 (tokens/s)
            </text>
          </svg>
        </div>
      </div>
    </div>
  );
}
