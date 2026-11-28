import React, { useState, useMemo } from 'react';
import { ShieldAlert, CheckCircle2, Terminal } from 'lucide-react';
import CodeBlock from '../CodeBlock';

const VRAM_OPTIONS = [
  { id: 24, label: '24 GB (RTX 4090 / 3090)' },
  { id: 40, label: '40 GB (A100-40G)' },
  { id: 80, label: '80 GB (H100 / A100-80G)' },
];

const MODEL_OPTIONS = [
  { id: 'Qwen/Qwen2.5-7B-Instruct', label: 'Qwen2.5-7B', paramsB: 7.6 },
  { id: 'Qwen/Qwen2.5-14B-Instruct', label: 'Qwen2.5-14B', paramsB: 14.7 },
  { id: 'Qwen/Qwen2.5-32B-Instruct', label: 'Qwen2.5-32B', paramsB: 32.5 },
  { id: 'meta-llama/Meta-Llama-3-70B-Instruct', label: 'Llama-3-70B', paramsB: 70.6 },
];

const QUANT_OPTIONS = [
  { id: 'bf16', label: 'BF16 (2B/参数)', bytes: 2.0, flagVllm: '--dtype bfloat16', flagSgl: '--dtype bfloat16' },
  { id: 'fp8', label: 'FP8 (1B/参数)', bytes: 1.0, flagVllm: '--quantization fp8', flagSgl: '--quantization fp8' },
  { id: 'awq', label: 'AWQ INT4 (0.5B/参数)', bytes: 0.55, flagVllm: '--quantization awq', flagSgl: '--quantization awq' },
];

const CTX_OPTIONS = [4096, 8192, 16384, 32768];

export default function OomCommandGenerator() {
  const [vramGB, setVramGB] = useState(24);
  const [modelId, setModelId] = useState(MODEL_OPTIONS[0].id);
  const [quantId, setQuantId] = useState('awq');
  const [engine, setEngine] = useState('vllm'); // 'vllm' | 'sglang'
  const [ctxLen, setCtxLen] = useState(8192);

  const calc = useMemo(() => {
    const model = MODEL_OPTIONS.find((m) => m.id === modelId) || MODEL_OPTIONS[0];
    const quant = QUANT_OPTIONS.find((q) => q.id === quantId) || QUANT_OPTIONS[2];
    const weightGB = model.paramsB * quant.bytes;
    const kvEstimateGB = (model.paramsB / 7) * (ctxLen / 8192) * 1.4;
    const neededGB = weightGB + kvEstimateGB + 1.5;
    const tpSize = neededGB > vramGB ? Math.min(8, Math.ceil(neededGB / (vramGB * 0.85))) : 1;
    const singleCardOom = neededGB > vramGB;
    const safeUtil = vramGB <= 24 ? 0.88 : 0.92;

    const launchCmd =
      engine === 'vllm'
        ? `vllm serve ${model.id} \\\n  ${quant.flagVllm} \\\n  --max-model-len ${ctxLen} \\\n  --gpu-memory-utilization ${safeUtil} \\\n  --enable-prefix-caching${tpSize > 1 ? ` \\\n  --tensor-parallel-size ${tpSize}` : ''}`
        : `python3 -m sglang.launch_server --model-path ${model.id} \\\n  ${quant.flagSgl} \\\n  --context-length ${ctxLen} \\\n  --mem-fraction-static ${safeUtil}${tpSize > 1 ? ` \\\n  --tp ${tpSize}` : ''}`;

    const benchCmd = `vllm bench serve --backend ${engine === 'vllm' ? 'vllm' : 'sglang'} --model ${model.id} --num-prompts 100 --max-concurrency 16 --ignore-eos`;
    const nsysCmd = `nsys profile -o ${engine}_trace --trace=cuda,nvtx,osrt --delay=20 --duration=30 ${launchCmd.split(' \\\n')[0]}`;

    return {
      weightGB,
      neededGB,
      singleCardOom,
      tpSize,
      safeUtil,
      launchCmd,
      benchCmd,
      nsysCmd,
    };
  }, [vramGB, modelId, quantId, engine, ctxLen]);

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120]/90 p-5 sm:p-6 space-y-5 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-mono text-sky-600 dark:text-sky-400">
            <Terminal className="w-4 h-4" />
            <span>ANTI-OOM GENERATOR · vLLM / SGLang 防爆显存命令生成器</span>
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
            一键生成安全启动 + 压测 + Nsight 抓包三联命令
          </h3>
        </div>
        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold border ${
            calc.singleCardOom
              ? 'bg-rose-500/15 text-rose-600 dark:text-rose-300 border-rose-500/35'
              : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/35'
          }`}
        >
          {calc.singleCardOom ? (
            <>
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>单卡超显存 ({calc.neededGB.toFixed(1)}G &gt; {vramGB}G) · 已自动配 TP={calc.tpSize}</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>单卡安全 ({calc.neededGB.toFixed(1)}G / {vramGB}G)</span>
            </>
          )}
        </span>
      </div>

      {/* Selector Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="space-y-1">
          <label className="text-[11px] font-mono text-slate-500">单卡显存</label>
          <select
            value={vramGB}
            onChange={(e) => setVramGB(Number(e.target.value))}
            className="w-full px-3 py-2 rounded-xl text-xs font-mono border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
          >
            {VRAM_OPTIONS.map((v) => (
              <option key={v.id} value={v.id}>{v.label}</option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-[11px] font-mono text-slate-500">模型规模</label>
          <select
            value={modelId}
            onChange={(e) => setModelId(e.target.value)}
            className="w-full px-3 py-2 rounded-xl text-xs font-mono border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
          >
            {MODEL_OPTIONS.map((m) => (
              <option key={m.id} value={m.id}>{m.label}</option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-[11px] font-mono text-slate-500">量化方案</label>
          <select
            value={quantId}
            onChange={(e) => setQuantId(e.target.value)}
            className="w-full px-3 py-2 rounded-xl text-xs font-mono border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
          >
            {QUANT_OPTIONS.map((q) => (
              <option key={q.id} value={q.id}>{q.label}</option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-[11px] font-mono text-slate-500">推理引擎</label>
          <div className="grid grid-cols-2 gap-1.5">
            {['vllm', 'sglang'].map((eng) => (
              <button
                key={eng}
                type="button"
                onClick={() => setEngine(eng)}
                className={`py-2 rounded-xl text-xs font-mono font-bold border transition-colors ${
                  engine === eng
                    ? 'bg-sky-500 text-slate-950 border-sky-400'
                    : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                }`}
              >
                {eng === 'vllm' ? 'vLLM' : 'SGLang'}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[11px] font-mono text-slate-500">上下文上限</label>
          <select
            value={ctxLen}
            onChange={(e) => setCtxLen(Number(e.target.value))}
            className="w-full px-3 py-2 rounded-xl text-xs font-mono border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
          >
            {CTX_OPTIONS.map((c) => (
              <option key={c} value={c}>{c / 1024}K ({c})</option>
            ))}
          </select>
        </div>
      </div>

      {/* 3 Copyable Commands */}
      <div className="grid lg:grid-cols-3 gap-4">
        <CodeBlock
          title="1. 安全启动服务命令"
          language="bash"
          code={calc.launchCmd}
          collapsible={false}
          compact={true}
          copyLabel="复制启动"
        />
        <CodeBlock
          title="2. 标准化并发压测命令"
          language="bash"
          code={calc.benchCmd}
          collapsible={false}
          compact={true}
          copyLabel="复制压测"
        />
        <CodeBlock
          title="3. Nsight Systems 抓包命令"
          language="bash"
          code={calc.nsysCmd}
          collapsible={false}
          compact={true}
          copyLabel="复制抓包"
        />
      </div>
    </div>
  );
}
