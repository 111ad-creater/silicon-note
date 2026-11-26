import React, { useState } from 'react';
import { Rocket, FlaskConical } from 'lucide-react';
import { LESSON_LAB_WIDGETS } from '../data/labCatalog';

function PillButton({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold border transition-all ${
        active
          ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
          : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-400/60'
      }`}
    >
      {children}
    </button>
  );
}

export default function LessonLabCard({ lessonId, onOpenLabWithPreset }) {
  const cfg = LESSON_LAB_WIDGETS[lessonId];
  if (!cfg) return null;

  return (
    <LessonLabCardInner
      key={lessonId}
      cfg={cfg}
      onOpenLabWithPreset={onOpenLabWithPreset}
    />
  );
}

function LessonLabCardInner({ cfg, onOpenLabWithPreset }) {
  // Interactive mini-state initialized to exact preset defaults
  const [divergence, setDivergence] = useState(cfg.defaultPreset.divergence ?? 50);
  const [sparsity, setSparsity] = useState(cfg.defaultPreset.sparsity ?? true);
  const [tpuBatch, setTpuBatch] = useState(cfg.defaultPreset.batch ?? 1);
  const [memChip, setMemChip] = useState('H100'); // 'RTX4090' | 'H100' | 'B200'
  const [bitFmt, setBitFmt] = useState(cfg.defaultPreset.format ?? 'BF16');
  const [smoothOn, setSmoothOn] = useState(cfg.defaultPreset.smoothquant ?? true);
  const [roofBatch, setRoofBatch] = useState(cfg.defaultPreset.batch ?? 1);
  const [prec70b, setPrec70b] = useState(cfg.defaultPreset.precision ?? 'INT4');
  const [stageToggle, setStageToggle] = useState(cfg.defaultPreset.stage ?? 'prefill');
  const [vllmStep, setVllmStep] = useState(1); // 0 = initial, 1 = fragmented OOM contrast
  const [attn64k, setAttn64k] = useState(cfg.defaultPreset.attn ?? 'mla');
  const [model16p, setModel16p] = useState(cfg.defaultPreset.model ?? '7B');
  const [ckptOn, setCkptOn] = useState(cfg.defaultPreset.ckpt === 'selective');
  const [zeroLvl, setZeroLvl] = useState(cfg.defaultPreset.zero ?? 'zero2');
  const [tpCrossNode, setTpCrossNode] = useState(true);
  const [overlapOn, setOverlapOn] = useState(false);
  const [sloBatch, setSloBatch] = useState(cfg.defaultPreset.batch ?? 32);
  const [debugScene, setDebugScene] = useState(cfg.defaultPreset.scene ?? 'cuda_graph');
  const [debugFixed, setDebugFixed] = useState(false);

  // Build dynamic outgoing preset reflecting user's mini-interaction
  const buildOutgoingPreset = () => {
    switch (cfg.widgetType) {
      case 'gpu_divergence':
        return { mode: 'gpu_warp', divergence };
      case 'gpu_sparsity':
        return { mode: 'gpu_warp', sparsity };
      case 'tpu_batch':
        return { mode: 'tpu_systolic', batch: tpuBatch };
      case 'mem_roofline':
        return {
          chip: memChip,
          stage: 'decode',
          compareGddr: true,
        };
      case 'bit_microscope':
        return { format: bitFmt, compare: bitFmt === 'FP16' ? 'BF16' : 'FP16' };
      case 'smoothquant':
        return { tab: 'outlier', smoothquant: smoothOn };
      case 'roofline_batch':
        return { chip: 'H100', batch: roofBatch, stage: 'decode' };
      case 'paper_math_70b':
        return { model: '70B', precision: prec70b, chip: 'H100', stage: 'decode', batch: 1 };
      case 'prefill_decode':
        return { chip: 'H100', stage: stageToggle, batch: 1 };
      case 'vllm_mini':
        return { mode: 'compare', autoDemo: true };
      case 'kv_attn_64k':
        return { ctx: 64, attn: attn64k };
      case 'train_16p':
        return { model: model16p, gpus: 1, zero: 'ddp' };
      case 'train_recompute':
        return { model: '7B', ckpt: ckptOn ? 'selective' : 'none', gpus: 1, zero: 'ddp' };
      case 'train_zero':
        return { model: '13B', gpus: 8, zero: zeroLvl };
      case 'nsight_tp':
        return { scene: 'cross_node_tp', fixed: !tpCrossNode };
      case 'nsight_overlap':
        return { scene: 'no_overlap', fixed: overlapOn };
      case 'slo_tpot':
        return { batch: sloBatch, ctx: 8 };
      case 'nsight_debug':
        return { scene: debugScene, fixed: debugFixed };
      default:
        return cfg.defaultPreset;
    }
  };

  const renderPreview = () => {
    switch (cfg.widgetType) {
      case 'gpu_divergence': {
        const util = divergence === 0 || divergence === 100 ? 100 : 50;
        const countA = Math.round((divergence / 100) * 16);
        return (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <PillButton active={divergence === 0} onClick={() => setDivergence(0)}>
                0% 无分叉 (齐步)
              </PillButton>
              <PillButton active={divergence === 50} onClick={() => setDivergence(50)}>
                50% if-else 分叉
              </PillButton>
              <span className="ml-auto font-mono text-xs font-bold text-indigo-600 dark:text-indigo-300">
                有效算力利用率：{util}% {util === 50 ? '(一半线程罚站!)' : '(全速满载!)'}
              </span>
            </div>
            <div className="grid grid-cols-8 gap-1.5">
              {Array.from({ length: 16 }).map((_, i) => {
                const isA = i < countA;
                return (
                  <div
                    key={i}
                    className={`h-5 rounded text-[9px] font-mono font-bold flex items-center justify-center transition-all ${
                      util === 100 || isA
                        ? 'bg-emerald-500/85 text-slate-950'
                        : 'bg-slate-300 dark:bg-slate-800 text-slate-500'
                    }`}
                  >
                    {util === 100 || isA ? '跑' : '停'}
                  </div>
                );
              })}
            </div>
          </div>
        );
      }

      case 'gpu_sparsity':
        return (
          <div className="space-y-2.5">
            <div className="flex flex-wrap items-center gap-2">
              <PillButton active={!sparsity} onClick={() => setSparsity(false)}>
                普通稠密计算 (1.0x)
              </PillButton>
              <PillButton active={sparsity} onClick={() => setSparsity(true)}>
                ⚡ 开启 2:4 稀疏跳过 50% 零值
              </PillButton>
              <span className="ml-auto font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400">
                Tensor Core 算力：{sparsity ? '2.0x 翻倍!' : '1.0x 基准'}
              </span>
            </div>
            <div className="grid grid-cols-4 gap-2 font-mono text-xs text-center">
              {['w0=0.8', sparsity ? '0 (跳过)' : 'w1=0', 'w2=-0.4', sparsity ? '0 (跳过)' : 'w3=0'].map(
                (item, idx) => (
                  <div
                    key={idx}
                    className={`py-1.5 rounded-lg border ${
                      sparsity && (idx === 1 || idx === 3)
                        ? 'border-dashed border-slate-400 dark:border-slate-700 text-slate-400 line-through'
                        : 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-semibold'
                    }`}
                  >
                    {item}
                  </div>
                )
              )}
            </div>
          </div>
        );

      case 'tpu_batch': {
        const cycles = 2 * 4 + tpuBatch - 2;
        const util = ((4 * tpuBatch) / (4 * cycles)) * 100;
        return (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex gap-2">
              <PillButton active={tpuBatch === 1} onClick={() => setTpuBatch(1)}>
                Batch = 1 (单兵)
              </PillButton>
              <PillButton active={tpuBatch === 8} onClick={() => setTpuBatch(8)}>
                Batch = 8 (流水线)
              </PillButton>
            </div>
            <div className="font-mono text-xs">
              4×4 脉动网格：总拍数 <strong className="text-sky-500">{cycles}</strong> 拍 · 平均填满率{' '}
              <strong className={tpuBatch === 1 ? 'text-rose-500' : 'text-emerald-500'}>
                {util.toFixed(1)}%
              </strong>
            </div>
          </div>
        );
      }

      case 'mem_roofline': {
        const spec =
          memChip === 'RTX4090'
            ? { name: 'GDDR6X', bw: 1.0, tps: 14.3 }
            : memChip === 'B200'
              ? { name: 'HBM3e', bw: 8.0, tps: 114.3 }
              : { name: 'HBM3', bw: 3.35, tps: 47.9 };
        return (
          <div className="space-y-2.5">
            <div className="flex flex-wrap items-center gap-2">
              <PillButton active={memChip === 'RTX4090'} onClick={() => setMemChip('RTX4090')}>
                GDDR6X (1.0 TB/s)
              </PillButton>
              <PillButton active={memChip === 'H100'} onClick={() => setMemChip('H100')}>
                HBM3 (3.35 TB/s)
              </PillButton>
              <PillButton active={memChip === 'B200'} onClick={() => setMemChip('B200')}>
                HBM3e (8.0 TB/s)
              </PillButton>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono text-slate-500 w-28">斜坡抬升高度</span>
              <div className="flex-1 h-3 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-500 to-emerald-400 transition-all duration-300"
                  style={{ width: `${(spec.bw / 8.0) * 100}%` }}
                />
              </div>
              <span className="font-mono text-xs font-bold text-emerald-500">
                70B-INT4 ≈ {spec.tps} tok/s ({spec.bw}x)
              </span>
            </div>
          </div>
        );
      }

      case 'bit_microscope': {
        const specs = {
          FP32: { s: 1, e: 8, m: 23, area: 100.0 },
          FP16: { s: 1, e: 5, m: 10, area: 18.9 },
          BF16: { s: 1, e: 8, m: 7, area: 9.3 },
          FP8_E4M3: { s: 1, e: 4, m: 3, area: 1.7 },
        };
        const cur = specs[bitFmt] || specs.BF16;
        return (
          <div className="space-y-2.5">
            <div className="flex flex-wrap items-center gap-2">
              {[
                { id: 'FP32', label: 'FP32 (1/8/23)' },
                { id: 'FP16', label: 'FP16 (1/5/10)' },
                { id: 'BF16', label: 'BF16 (1/8/7)' },
                { id: 'FP8_E4M3', label: 'FP8 (1/4/3)' },
              ].map((f) => (
                <PillButton key={f.id} active={bitFmt === f.id} onClick={() => setBitFmt(f.id)}>
                  {f.label}
                </PillButton>
              ))}
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
              <span className="text-slate-600 dark:text-slate-300">
                S:{cur.s} · E:{cur.e} · M:{cur.m}
              </span>
              <span className="text-indigo-600 dark:text-indigo-300 font-bold">
                乘法器相对硅片面积 ≈ ({cur.m}/23)² = {cur.area.toFixed(1)}%
              </span>
            </div>
          </div>
        );
      }

      case 'smoothquant':
        return (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex gap-2">
              <PillButton active={!smoothOn} onClick={() => setSmoothOn(false)}>
                直接 INT4 (10m 巨人碾压)
              </PillButton>
              <PillButton active={smoothOn} onClick={() => setSmoothOn(true)}>
                🪄 开启 SmoothQuant (÷√10)
              </PillButton>
            </div>
            <div className="font-mono text-xs">
              巨人高度：<strong className="text-rose-500">{smoothOn ? '3.16' : '10.0'}</strong> ·
              正常值压扁成 0：
              <strong className={smoothOn ? 'text-emerald-500' : 'text-rose-500'}>
                {smoothOn ? ' 1/20 (MSE 暴降 92%!)' : ' 14/20 丢失!'}
              </strong>
            </div>
          </div>
        );

      case 'roofline_batch': {
        const ai = roofBatch; // BF16 Decode: AI ≈ Batch
        const ridge = 295.2;
        const mfu = Math.min(100, (ai / ridge) * 100);
        return (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-slate-700 dark:text-slate-200">
                拖动 Batch Size（H100 BF16 Decode · 脊点 295）
              </span>
              <span className="font-mono font-bold text-indigo-600 dark:text-indigo-300">
                Batch = {roofBatch} · AI = {ai} · MFU = {mfu.toFixed(1)}%
              </span>
            </div>
            <input
              type="range"
              min={1}
              max={256}
              value={roofBatch}
              onChange={(e) => setRoofBatch(Number(e.target.value))}
              className="w-full silicon-slider bg-slate-200 dark:bg-slate-800"
            />
          </div>
        );
      }

      case 'paper_math_70b': {
        const gb = prec70b === 'BF16' ? 140 : 35;
        const tps = 3350 / gb;
        return (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex gap-2">
              <PillButton active={prec70b === 'BF16'} onClick={() => setPrec70b('BF16')}>
                Llama-3 70B · BF16 (140 GB)
              </PillButton>
              <PillButton active={prec70b === 'INT4'} onClick={() => setPrec70b('INT4')}>
                Llama-3 70B · INT4 (35 GB)
              </PillButton>
            </div>
            <div className="font-mono text-xs">
              H100 (3.35 TB/s) Batch=1 理论极限：
              <strong className="text-emerald-500 ml-1">{tps.toFixed(1)} tok/s</strong>
            </div>
          </div>
        );
      }

      case 'prefill_decode':
        return (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex gap-2">
              <PillButton
                active={stageToggle === 'prefill'}
                onClick={() => setStageToggle('prefill')}
              >
                📖 读题 Prefill (L=1024)
              </PillButton>
              <PillButton
                active={stageToggle === 'decode'}
                onClick={() => setStageToggle('decode')}
              >
                ✍️ 写字 Decode (Batch=1)
              </PillButton>
            </div>
            <div className="font-mono text-xs">
              {stageToggle === 'prefill' ? (
                <span className="text-emerald-500 font-bold">
                  AI = 1024 · 稳落算力平顶 (MFU 100%)
                </span>
              ) : (
                <span className="text-amber-500 font-bold">
                  AI = 1.0 · 跌落内存斜坡 (MFU 0.34%)
                </span>
              )}
            </div>
          </div>
        );

      case 'vllm_mini':
        return (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex gap-2">
              <PillButton active={vllmStep === 0} onClick={() => setVllmStep(0)}>
                初始状态 (3 请求)
              </PillButton>
              <PillButton active={vllmStep === 1} onClick={() => setVllmStep(1)}>
                + 第 5 个新请求对比
              </PillButton>
            </div>
            <div className="font-mono text-xs">
              {vllmStep === 1 ? (
                <span>
                  左侧连续分配：<strong className="text-rose-500">OOM 拒接!</strong> · 右侧便利贴：
                  <strong className="text-emerald-500">严丝合缝 (浪费 &lt; 4%)</strong>
                </span>
              ) : (
                <span>左侧已有 75% 斜纹内部碎片 · 右侧仅占 8 格便利贴</span>
              )}
            </div>
          </div>
        );

      case 'kv_attn_64k': {
        // 8B scale, 64K * 16 users reference (or single 64K * 8 users = 256GB MHA)
        const gbMap = { mha: 256, gqa: 64, mla: 18 };
        return (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex gap-1.5">
              <PillButton active={attn64k === 'mha'} onClick={() => setAttn64k('mha')}>
                MHA (1.0x)
              </PillButton>
              <PillButton active={attn64k === 'gqa'} onClick={() => setAttn64k('gqa')}>
                GQA (1/4)
              </PillButton>
              <PillButton active={attn64k === 'mla'} onClick={() => setAttn64k('mla')}>
                DeepSeek MLA (1/14)
              </PillButton>
            </div>
            <div className="font-mono text-xs">
              64K · 8 并发 KV Cache：
              <strong className={attn64k === 'mha' ? 'text-rose-500' : 'text-emerald-500'}>
                {' '}
                {gbMap[attn64k]} GB {attn64k === 'mha' ? '(爆 80G!)' : '(可轻松装下)'}
              </strong>
            </div>
          </div>
        );
      }

      case 'train_16p': {
        const P = model16p === '70B' ? 70 : 7;
        return (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex gap-2">
              <PillButton active={model16p === '7B'} onClick={() => setModel16p('7B')}>
                7B 模型 (16P)
              </PillButton>
              <PillButton active={model16p === '70B'} onClick={() => setModel16p('70B')}>
                70B 模型 (16P)
              </PillButton>
            </div>
            <div className="font-mono text-xs">
              静态总显存 <strong className="text-sky-500">{16 * P} GB</strong>（其中 12P 优化器独占{' '}
              <strong className="text-indigo-500">{12 * P} GB · 75%</strong>）
            </div>
          </div>
        );
      }

      case 'train_recompute': {
        const act = ckptOn ? 9.8 : 24.5;
        return (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <PillButton active={ckptOn} onClick={() => setCkptOn((v) => !v)}>
              {ckptOn ? '✅ 已勾选选择性重计算 (-60%)' : '☐ 点击勾选选择性重计算'}
            </PillButton>
            <div className="font-mono text-xs">
              7B 单卡激活值：
              <strong className={ckptOn ? 'text-emerald-500' : 'text-amber-500'}>
                {act.toFixed(1)} GB
              </strong>{' '}
              ({ckptOn ? '已暴降 60%，耗时仅 +5%' : '未重计算基准'})
            </div>
          </div>
        );
      }

      case 'train_zero': {
        // 13B, 8 GPUs: W=26, G=26, Opt=156, Act=45.5
        const memMap = {
          ddp: { val: 253.5, ok: false },
          zero1: { val: 117.0, ok: false },
          zero2: { val: 94.3, ok: false },
          zero3: { val: 71.5, ok: true },
        };
        // Wait: with 13B without ckpt Act=45.5, ZeRO-2 static = 26 + 26/8 + 156/8 = 48.75GB, +45.5 = 94.3GB; ZeRO-3 = 26 + 45.5 = 71.5GB!
        // Let's also allow clicking ZeRO-1/2/3 cleanly:
        const cur = memMap[zeroLvl] || memMap.zero2;
        return (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-1.5">
              {['ddp', 'zero1', 'zero2', 'zero3'].map((z) => (
                <PillButton key={z} active={zeroLvl === z} onClick={() => setZeroLvl(z)}>
                  {z.toUpperCase()}
                </PillButton>
              ))}
            </div>
            <div className="font-mono text-xs">
              13B · 8 卡单卡总显存：
              <strong className={cur.ok ? 'text-emerald-500' : 'text-rose-500'}>
                {cur.val} GB {cur.ok ? '(✅ 低于 80GB!)' : '(OOM > 80G)'}
              </strong>
            </div>
          </div>
        );
      }

      case 'nsight_tp':
        return (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex gap-2">
              <PillButton active={tpCrossNode} onClick={() => setTpCrossNode(true)}>
                跨机网卡 TP (100 GB/s)
              </PillButton>
              <PillButton active={!tpCrossNode} onClick={() => setTpCrossNode(false)}>
                机内 NVLink TP (900 GB/s)
              </PillButton>
            </div>
            <div className="font-mono text-xs">
              TP AllReduce 通信耗时：
              <strong className={tpCrossNode ? 'text-rose-500' : 'text-emerald-500'}>
                {tpCrossNode ? '72 ms (膨胀 9 倍!)' : '8 ms (瞬缩至 1/9)'}
              </strong>
            </div>
          </div>
        );

      case 'nsight_overlap':
        return (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <PillButton active={overlapOn} onClick={() => setOverlapOn((v) => !v)}>
              {overlapOn ? '✅ Overlap 重叠已开启' : '⚡ 点击开启通信计算 Overlap'}
            </PillButton>
            <div className="font-mono text-xs">
              单步总耗时：
              <strong className={overlapOn ? 'text-emerald-500' : 'text-amber-500'}>
                {overlapOn ? '100 ms (40ms 通信彻底隐藏!)' : '140 ms (100ms算 + 40ms通信)'}
              </strong>
            </div>
          </div>
        );

      case 'slo_tpot': {
        // Rough match to Lab 1 (8K context, GQA=1GB/user, 2000 GB/s, 16GB weights)
        const movedGB = 16 + sloBatch * 1.0;
        const tpot = (movedGB / 2000) * 1000;
        const tpsTotal = (1000 / tpot) * sloBatch;
        return (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-slate-700 dark:text-slate-200">
                拖动并发用户数 (8K 上下文 · GQA · 2000 GB/s)
              </span>
              <span className="font-mono font-bold">
                {sloBatch} 人 · TPOT{' '}
                <strong className={tpot > 50 ? 'text-rose-500' : 'text-emerald-500'}>
                  {tpot.toFixed(1)} ms {tpot > 50 ? '(超 50ms 红线!)' : '(流畅)'}
                </strong>{' '}
                · 总吞吐 {tpsTotal.toFixed(0)} tok/s
              </span>
            </div>
            <input
              type="range"
              min={1}
              max={64}
              value={sloBatch}
              onChange={(e) => setSloBatch(Number(e.target.value))}
              className="w-full silicon-slider bg-slate-200 dark:bg-slate-800"
            />
          </div>
        );
      }

      case 'nsight_debug':
        return (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-1.5">
              <PillButton
                active={debugScene === 'sync_lock'}
                onClick={() => {
                  setDebugScene('sync_lock');
                  setDebugFixed(true);
                }}
              >
                {debugScene === 'sync_lock' && debugFixed ? '✅ 已删隐式同步锁' : '修复隐式同步锁'}
              </PillButton>
              <PillButton
                active={debugScene === 'cuda_graph'}
                onClick={() => {
                  setDebugScene('cuda_graph');
                  setDebugFixed(true);
                }}
              >
                {debugScene === 'cuda_graph' && debugFixed ? '✅ 已开 CUDA Graph' : '开启 CUDA Graph'}
              </PillButton>
            </div>
            <div className="font-mono text-xs">
              {debugFixed ? (
                <span className="text-emerald-500 font-bold">
                  {debugScene === 'sync_lock'
                    ? '气泡 45% → 5%（加速 1.72x）'
                    : 'CPU 发射降 85%（加速 3.75x）'}
                </span>
              ) : (
                <span className="text-amber-500">点击按钮预览 Nsight 气泡消除效果</span>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="rounded-xl border border-indigo-500/30 border-l-4 border-l-[#4F46E5] bg-indigo-500/[0.06] dark:bg-indigo-950/25 p-4 sm:p-5 space-y-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <FlaskConical className="w-4 h-4 text-[#4F46E5] dark:text-indigo-400 shrink-0" />
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300">
            🧪 动手验证直觉 · 随堂直觉沙盒
          </span>
        </div>
        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-500/25">
          {cfg.labLabel}
        </span>
      </div>

      <div className="space-y-1">
        <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
          {cfg.title}
        </h3>
        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          {cfg.desc}
        </p>
      </div>

      {/* Inline lightweight interactive preview */}
      <div className="rounded-xl border border-indigo-500/20 bg-white/80 dark:bg-[#060A13]/80 p-3.5">
        {renderPreview()}
      </div>

      {/* Jump CTA button */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => onOpenLabWithPreset && onOpenLabWithPreset(cfg.labId, buildOutgoingPreset())}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-[#4F46E5] hover:bg-indigo-500 text-white shadow-sm transition-all active:scale-[0.99]"
        >
          <Rocket className="w-3.5 h-3.5" />
          <span>🚀 带着当前参数进入交互实验室深玩 →</span>
        </button>
      </div>
    </div>
  );
}
