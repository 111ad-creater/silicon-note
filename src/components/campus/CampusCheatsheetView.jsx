import React, { useState } from 'react';
import { Copy, Check, Printer, Zap, ShieldCheck, Eye } from 'lucide-react';
import {
  ANALOG_CMOS_CHEATSHEET,
  buildCheatsheetCopyText,
} from '../../data/analogCmosCheatsheet';
import {
  CHEATSHEET_ROW_SCHEMATICS,
  CheatsheetSchematicModal,
} from '../AnalogSchematics.tsx';

export default function CampusCheatsheetView() {
  const [copied, setCopied] = useState(false);
  const [previewTarget, setPreviewTarget] = useState(null);

  const handleCopy = async () => {
    const text = buildCheatsheetCopyText();
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // ignore clipboard errors silently
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-4">
      {/* Toolbar (Hidden on Print) */}
      <div className="print:hidden flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120]/90 px-4 py-3.5">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
            <Zap className="w-4 h-4 text-[#8B5CF6]" />
            <span>{ANALOG_CMOS_CHEATSHEET.title}</span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {ANALOG_CMOS_CHEATSHEET.subtitle} · 紧凑单页排版，支持一键复制 Markdown 与 A4 打印
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleCopy}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
              copied
                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-700 dark:text-emerald-300'
                : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-[#8B5CF6]/60 hover:text-[#8B5CF6] dark:hover:text-[#A78BFA]'
            }`}
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? '已复制到剪贴板' : '一键复制速查表'}</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#8B5CF6] hover:bg-[#7C3AED] text-white shadow-sm transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>打印 / 导出 A4</span>
          </button>
        </div>
      </div>

      {/* Compact Printable A4 Sheet */}
      <div className="campus-print-sheet rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120]/95 p-5 sm:p-6 space-y-5 shadow-sm print:border-slate-300 print:shadow-none print:p-0 print:bg-white print:text-slate-900">
        {/* Sheet Header */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-3 print:border-slate-300">
          <div>
            <div className="text-[11px] font-mono font-semibold uppercase tracking-wider text-[#8B5CF6] dark:text-[#A78BFA] print:text-[#6D28D9]">
              SILICONNOTE CAMPUS · A4 EXAM CHEATSHEET
            </div>
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white print:text-slate-900">
              {ANALOG_CMOS_CHEATSHEET.tableTitle}
            </h2>
          </div>
          <span className="px-2.5 py-1 rounded-lg text-[11px] font-mono bg-[#8B5CF6]/10 text-[#7C3AED] dark:text-[#C4B5FD] border border-[#8B5CF6]/25 print:border-slate-300 print:text-slate-700">
            拉扎维第 2 版 · 观察法核心速览
          </span>
        </div>

        {/* 7-Row Compact Building Block Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 print:border-slate-300">
          <table className="w-full text-left border-collapse text-xs sm:text-[13px]">
            <thead>
              <tr className="bg-[#8B5CF6]/12 dark:bg-[#8B5CF6]/18 border-b-2 border-[#8B5CF6]/35 print:bg-slate-100 print:border-slate-400">
                {ANALOG_CMOS_CHEATSHEET.headers.map((h, idx) => (
                  <th
                    key={idx}
                    className="py-2.5 px-3 font-semibold text-violet-950 dark:text-violet-200 whitespace-nowrap print:text-slate-900 print:py-2 print:px-2"
                  >
                    {h}
                  </th>
                ))}
                <th className="print:hidden py-2.5 px-3 font-semibold text-violet-950 dark:text-violet-200 whitespace-nowrap text-center">
                  电路图
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/80 dark:divide-slate-800/80 print:divide-slate-300">
              {ANALOG_CMOS_CHEATSHEET.rows.map((row, rIdx) => {
                const schematicTarget = CHEATSHEET_ROW_SCHEMATICS[rIdx];
                return (
                  <tr
                    key={rIdx}
                    className="odd:bg-white dark:odd:bg-transparent even:bg-slate-50/80 dark:even:bg-slate-800/35 hover:bg-[#8B5CF6]/[0.06] transition-colors print:even:bg-slate-50"
                  >
                    {row.map((cell, cIdx) => {
                      const isMonoCol = cIdx >= 2 && cIdx <= 4;
                      return (
                        <td
                          key={cIdx}
                          className={`py-2.5 px-3 leading-snug print:py-1.5 print:px-2 print:text-slate-800 ${
                            cIdx === 0
                              ? 'font-semibold text-slate-900 dark:text-white whitespace-nowrap'
                              : isMonoCol
                                ? 'font-mono text-[12px] text-[#6D28D9] dark:text-[#C4B5FD] whitespace-nowrap'
                                : 'text-slate-600 dark:text-slate-300'
                          }`}
                        >
                          {cell}
                        </td>
                      );
                    })}
                    <td className="print:hidden py-2 px-3 text-center whitespace-nowrap">
                      {schematicTarget && (
                        <button
                          type="button"
                          onClick={() => setPreviewTarget(schematicTarget)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold border border-[#8B5CF6]/35 bg-[#8B5CF6]/10 text-[#6D28D9] dark:text-[#C4B5FD] hover:bg-[#8B5CF6]/20 transition-colors"
                        >
                          <Eye className="w-3 h-3" />
                          <span>查看电路图</span>
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* 3 Iron Rules Section */}
        <div className="space-y-3 pt-1">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white print:text-slate-900">
            <ShieldCheck className="w-4 h-4 text-[#8B5CF6] shrink-0" />
            <span>{ANALOG_CMOS_CHEATSHEET.rulesTitle}</span>
          </div>

          <div className="grid grid-cols-1 gap-2.5">
            {ANALOG_CMOS_CHEATSHEET.ironRules.map((rule) => (
              <div
                key={rule.index}
                className="rounded-xl border border-[#8B5CF6]/25 border-l-4 border-l-[#8B5CF6] bg-[#8B5CF6]/[0.05] dark:bg-[#8B5CF6]/10 px-4 py-3 space-y-1 print:bg-slate-50 print:border-slate-300 print:border-l-[#8B5CF6]"
              >
                <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#6D28D9] dark:text-[#C4B5FD] print:text-[#5B21B6]">
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-md bg-[#8B5CF6]/15 border border-[#8B5CF6]/30">
                    {rule.index}
                  </span>
                  <span>{rule.title}</span>
                </div>
                <p className="text-xs sm:text-[13px] leading-relaxed text-slate-700 dark:text-slate-200 font-mono print:text-slate-800">
                  {rule.content}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Interactive Schematic Preview Modal */}
      <CheatsheetSchematicModal
        target={previewTarget}
        onClose={() => setPreviewTarget(null)}
      />
    </div>
  );
}
