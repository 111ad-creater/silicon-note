import React, { useState } from 'react';
import { Copy, Check, ChevronDown, ChevronRight, Terminal, FileCode2 } from 'lucide-react';

/**
 * Copy text to clipboard with fallback for non-secure / legacy browser contexts.
 */
export async function copyTextToClipboard(text) {
  if (!text) return false;
  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // fallback below
  }
  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    textarea.style.pointerEvents = 'none';
    document.body.appendChild(textarea);
    textarea.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(textarea);
    return ok;
  } catch {
    return false;
  }
}

const PY_KEYWORDS = new Set([
  'def',
  'return',
  'if',
  'elif',
  'else',
  'for',
  'in',
  'range',
  'import',
  'from',
  'as',
  'lambda',
  'True',
  'False',
  'None',
  'and',
  'or',
  'not',
  'print',
]);

const BASH_KEYWORDS = new Set([
  'pip',
  'export',
  'vllm',
  'serve',
  'bench',
  'nvidia-smi',
  'curl',
  'watch',
  'nsys',
  'profile',
  'python',
  'python3',
]);

function highlightLine(line, language, lineIdx) {
  if (language === 'markdown') {
    if (/^#{1,3}\s/.test(line)) {
      return <span className="text-sky-300 font-bold">{line}</span>;
    }
    if (/^\|.*\|$/.test(line.trim())) {
      return <span className="text-emerald-300/90">{line}</span>;
    }
    if (/^\s*-\s+\*\*/.test(line)) {
      return <span className="text-slate-200">{line}</span>;
    }
    return <span className="text-slate-300">{line}</span>;
  }

  // Comment detection (full line or inline `#` outside quotes)
  const trimmed = line.trim();
  if (trimmed.startsWith('#')) {
    return <span className="text-slate-500 italic">{line}</span>;
  }

  // Decorator in Python
  if (language === 'python' && trimmed.startsWith('@')) {
    return <span className="text-amber-300">{line}</span>;
  }

  // Split strings, flags (--xxx), numbers, and words safely without HTML injection
  const tokenRegex =
    /(#.*$|f?"(?:\\.|[^"\\])*"|f?'(?:\\.|[^'\\])*'|--[a-zA-Z0-9_-]+|\b\d+(?:\.\d+)?\b|\b[a-zA-Z_][a-zA-Z0-9_-]*\b)/g;

  const parts = [];
  let lastIdx = 0;
  let match;
  let tokKey = 0;

  while ((match = tokenRegex.exec(line)) !== null) {
    if (match.index > lastIdx) {
      parts.push(line.slice(lastIdx, match.index));
    }
    const tok = match[0];
    let cls = 'text-slate-200';

    if (tok.startsWith('#')) {
      cls = 'text-slate-500 italic';
    } else if (tok.startsWith('"') || tok.startsWith("'") || tok.startsWith('f"') || tok.startsWith("f'")) {
      cls = 'text-emerald-300';
    } else if (tok.startsWith('--')) {
      cls = 'text-cyan-300';
    } else if (/^\d/.test(tok)) {
      cls = 'text-amber-300';
    } else if (language === 'python' && PY_KEYWORDS.has(tok)) {
      cls = 'text-sky-400 font-semibold';
    } else if (language === 'bash' && BASH_KEYWORDS.has(tok)) {
      cls = 'text-sky-400 font-semibold';
    } else if (language === 'python' && (tok === 'tl' || tok === 'torch' || tok === 'triton')) {
      cls = 'text-violet-300';
    }

    parts.push(
      <span key={`${lineIdx}-${tokKey++}`} className={cls}>
        {tok}
      </span>
    );
    lastIdx = match.index + tok.length;
  }

  if (lastIdx < line.length) {
    parts.push(line.slice(lastIdx));
  }

  return parts.length > 0 ? parts : ' ';
}

export default function CodeBlock({
  title,
  filename,
  language = 'bash',
  code = '',
  defaultExpanded = false,
  collapsible = true,
  copyLabel = '复制代码',
  compact = false,
}) {
  const [expanded, setExpanded] = useState(defaultExpanded || !collapsible);
  const [copied, setCopied] = useState(false);

  const lines = code.split('\n');

  const handleCopy = async (e) => {
    if (e) e.stopPropagation();
    const ok = await copyTextToClipboard(code);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const langBadge =
    language === 'python' ? 'PYTHON' : language === 'markdown' ? 'MARKDOWN' : 'BASH';

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-[#050811] overflow-hidden shadow-sm">
      {/* Header Bar */}
      <div
        onClick={() => collapsible && setExpanded((prev) => !prev)}
        role={collapsible ? 'button' : undefined}
        tabIndex={collapsible ? 0 : undefined}
        onKeyDown={(e) => {
          if (collapsible && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            setExpanded((prev) => !prev);
          }
        }}
        className={`flex flex-wrap items-center justify-between gap-2 px-3.5 py-2.5 bg-slate-900/95 border-b border-slate-800/90 ${
          collapsible ? 'cursor-pointer hover:bg-slate-900 transition-colors select-none' : ''
        }`}
      >
        <div className="flex items-center gap-2 min-w-0">
          {collapsible && (
            <span className="text-slate-400 shrink-0">
              {expanded ? (
                <ChevronDown className="w-4 h-4 text-sky-400" />
              ) : (
                <ChevronRight className="w-4 h-4 text-slate-400" />
              )}
            </span>
          )}
          {language === 'bash' ? (
            <Terminal className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          ) : (
            <FileCode2 className="w-3.5 h-3.5 text-sky-400 shrink-0" />
          )}
          <span className="text-xs font-mono font-medium text-slate-200 truncate">
            {title || filename}
          </span>
          <span className="hidden sm:inline-flex px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-400 border border-slate-700/80 shrink-0">
            {langBadge} · {lines.length} 行
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {collapsible && (
            <span className="text-[11px] font-mono text-slate-400 hidden sm:inline">
              {expanded ? '收起代码' : '展开查看'}
            </span>
          )}
          <button
            type="button"
            onClick={handleCopy}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-mono font-medium border transition-all ${
              copied
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700 hover:border-sky-400/50'
            }`}
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>已复制</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-sky-400" />
                <span>{copyLabel}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Code Content */}
      {expanded && (
        <div
          className={`overflow-x-auto font-mono text-xs leading-relaxed ${
            compact ? 'p-3.5' : 'p-4'
          }`}
        >
          <pre className="m-0 whitespace-pre">
            {lines.map((line, idx) => (
              <div key={idx} className="flex">
                {!compact && (
                  <span className="select-none w-8 pr-3 text-right text-slate-600 shrink-0 text-[11px]">
                    {idx + 1}
                  </span>
                )}
                <code className="flex-1">{highlightLine(line, language, idx)}</code>
              </div>
            ))}
          </pre>
        </div>
      )}
    </div>
  );
}
