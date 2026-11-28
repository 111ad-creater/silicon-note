import React, { useState, useEffect } from 'react';
import { X, Download, Upload, CheckCircle2, AlertTriangle, Database } from 'lucide-react';
import {
  exportAllSiliconNoteData,
  importAllSiliconNoteData,
} from '../utils/activityStore';

export default function DataBackupModal({ isOpen, onClose }) {
  const [status, setStatus] = useState(null); // { ok: boolean, msg: string }

  useEffect(() => {
    if (!isOpen) return undefined;
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleExport = () => {
    const payload = exportAllSiliconNoteData();
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `silicon-note-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setStatus({
      ok: true,
      msg: `已导出 ${Object.keys(payload.data).length} 项本地学习进度与错题记录！`,
    });
  };

  const handleImport = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const json = JSON.parse(String(reader.result || ''));
        const count = importAllSiliconNoteData(json);
        setStatus({
          ok: true,
          msg: `成功恢复 ${count} 项本地学习数据！1 秒后自动刷新页面生效。`,
        });
        setTimeout(() => window.location.reload(), 1000);
      } catch (err) {
        setStatus({
          ok: false,
          msg: err?.message || '备份文件解析失败，请确认选择正确的 JSON 文件。',
        });
      }
    };
    reader.readAsText(file);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0B1120] shadow-2xl p-5 sm:p-6 space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-sky-400" />
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              跨设备学习数据备份与同步（PC ↔ iPad）
            </h3>
          </div>
          <button type="button" onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          将当前浏览器保存的 48 课掌握进度、训练营 L0~L6 打卡记录、校内 CMOS/806 进度、学习热力图与智能错题本打包为一个 JSON 文件，零服务器成本实现电脑与 iPad 互相同步。
        </p>

        <div className="grid sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={handleExport}
            className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-xs font-bold bg-sky-500 hover:bg-sky-400 text-slate-950 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>导出学习数据 JSON</span>
          </button>

          <label className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-xs font-bold border border-emerald-500/40 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-700 dark:text-emerald-300 cursor-pointer transition-colors">
            <Upload className="w-4 h-4" />
            <span>导入 JSON 恢复同步</span>
            <input type="file" accept=".json" onChange={handleImport} className="hidden" />
          </label>
        </div>

        {status && (
          <div
            className={`rounded-xl border p-3 flex items-center gap-2 text-xs ${
              status.ok
                ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                : 'border-rose-500/40 bg-rose-500/10 text-rose-600 dark:text-rose-300'
            }`}
          >
            {status.ok ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0" />
            )}
            <span>{status.msg}</span>
          </div>
        )}
      </div>
    </div>
  );
}
