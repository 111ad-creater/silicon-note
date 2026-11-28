import React, { useState, useEffect, useMemo } from 'react';
import {
  Radio,
  Search,
  X,
  ExternalLink,
  Cpu,
  Clock,
  RefreshCw,
  ArrowRight,
  Package,
  GitBranch,
  Maximize2,
} from 'lucide-react';
import { fetchDynamicDataWithSource } from '../utils/dataLoader';

const FALLBACK_RADAR = {
  updated_at: '本地内置快照',
  total_count: 0,
  items: [],
};

const FALLBACK_ENGINES = {
  updated_at: '本地内置快照',
  engines: [],
};

const CATEGORY_TABS = [
  { id: 'all', label: '全部' },
  { id: 'model_release', label: '新模型发布 (40%)' },
  { id: 'ai_chip', label: 'AI 芯片与推理 (40%)' },
  { id: 'freebie', label: '工具羊毛 (20%)' },
];

const VERIFICATION_BADGES = {
  official: {
    label: '官方实锤',
    cls: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/35',
  },
  freebie: {
    label: '限时羊毛',
    cls: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/35',
  },
  preprint: {
    label: '论文/预印本',
    cls: 'bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/35',
  },
  unverified: {
    label: '待证实',
    cls: 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/35',
  },
};

const CATEGORY_LABELS = {
  model_release: '新模型发布',
  ai_chip: 'AI 芯片与推理',
  freebie: '工具羊毛',
};

export default function AiRadarPage({ onSendToChipLadder }) {
  const [subTab, setSubTab] = useState('radar'); // 'radar' | 'engines'
  const [radarState, setRadarState] = useState({ data: FALLBACK_RADAR, source: 'fallback', loading: true });
  const [enginesState, setEnginesState] = useState({ data: FALLBACK_ENGINES, source: 'fallback', loading: true });

  const [query, setQuery] = useState('');
  const [catFilter, setCatFilter] = useState('all');
  const [verFilter, setVerFilter] = useState('all');
  const [lightboxImage, setLightboxImage] = useState(null);

  const loadAll = async () => {
    setRadarState((s) => ({ ...s, loading: true }));
    setEnginesState((s) => ({ ...s, loading: true }));
    const [rRes, eRes] = await Promise.all([
      fetchDynamicDataWithSource('ai-radar.json', FALLBACK_RADAR),
      fetchDynamicDataWithSource('engine-releases.json', FALLBACK_ENGINES),
    ]);
    setRadarState({ data: rRes.data, source: rRes.source, loading: false });
    setEnginesState({ data: eRes.data, source: eRes.source, loading: false });
  };

  useEffect(() => {
    loadAll();
  }, []);

  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    const items = radarState.data?.items || [];
    return items.filter((item) => {
      if (catFilter !== 'all' && item.category !== catFilter) return false;
      if (verFilter !== 'all' && item.verification !== verFilter) return false;
      if (!q) return true;
      return (
        (item.title_zh || '').toLowerCase().includes(q) ||
        (item.summary_zh || '').toLowerCase().includes(q) ||
        (item.original_en || '').toLowerCase().includes(q) ||
        (item.author_handle || '').toLowerCase().includes(q) ||
        (item.source_platform || '').toLowerCase().includes(q) ||
        (item.tags || []).some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [radarState.data, catFilter, verFilter, query]);

  const enginesList = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = enginesState.data?.engines || [];
    if (!q) return list;
    return list.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        e.repo.toLowerCase().includes(q) ||
        e.highlights_zh.toLowerCase().includes(q) ||
        e.category.toLowerCase().includes(q)
    );
  }, [enginesState.data, query]);

  return (
    <div className="py-6 sm:py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 text-xs font-mono text-amber-600 dark:text-[#F59E0B]">
            <Radio className="w-4 h-4" />
            <span>16:00 ZERO-BUILD AI RADAR · 零构建 CDN 动态情报台</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            AI 雷达 & 开源引擎追踪
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 max-w-3xl">
            每日 16:00 自动双核精选（40% 新模型发布 + 40% AI 芯片与推理 + 20% 免费算力羊毛），开源模型自动抓取 HuggingFace <code className="font-mono text-sky-500">config.json</code> 并支持一键送入芯片天梯算成本。
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 text-xs font-mono">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120] text-slate-600 dark:text-slate-300">
            <Clock className="w-3.5 h-3.5 text-amber-500" />
            <span>同步时间：{radarState.data?.updated_at || '-'}</span>
          </span>
          <span className="px-2.5 py-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
            数据源：{radarState.source === 'cdn' ? 'jsDelivr CDN' : radarState.source === 'local' ? '本地 JSON' : '内置快照'}
          </span>
          <button
            type="button"
            onClick={loadAll}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120] hover:border-amber-400/60 text-slate-700 dark:text-slate-200 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${radarState.loading ? 'animate-spin' : ''}`} />
            <span>刷新</span>
          </button>
        </div>
      </div>

      {/* Sub-Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-[#0B1120]/90 p-1.5">
        <div className="flex gap-1.5">
          <button
            type="button"
            onClick={() => setSubTab('radar')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold border transition-all ${
              subTab === 'radar'
                ? 'bg-amber-500/15 border-amber-500/50 text-amber-700 dark:text-[#F59E0B]'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Radio className="w-4 h-4" />
            <span>16:00 AI 雷达情报 ({radarState.data?.items?.length || 0})</span>
          </button>
          <button
            type="button"
            onClick={() => setSubTab('engines')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold border transition-all ${
              subTab === 'engines'
                ? 'bg-sky-500/15 border-sky-500/50 text-sky-700 dark:text-sky-300'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <GitBranch className="w-4 h-4" />
            <span>开源引擎 Release 追踪 ({enginesState.data?.engines?.length || 0})</span>
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜索中英文标题、模型、标签或来源..."
            className="w-full pl-8 pr-7 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-amber-400"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* ==================== TAB 1: AI RADAR ==================== */}
      {subTab === 'radar' && (
        <div className="space-y-5">
          {/* Category & Verification Filters */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex flex-wrap gap-1.5">
              {CATEGORY_TABS.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCatFilter(c.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                    catFilter === c.id
                      ? 'bg-amber-500 text-slate-950 border-amber-400 font-semibold'
                      : 'bg-white dark:bg-[#0B1120] text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-amber-400/50'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-mono text-slate-400 mr-1">状态筛选：</span>
              {[
                { id: 'all', label: '全部状态' },
                { id: 'official', label: '官方实锤' },
                { id: 'freebie', label: '限时羊毛' },
                { id: 'preprint', label: '论文/预印本' },
                { id: 'unverified', label: '待证实' },
              ].map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setVerFilter(v.id)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-mono border transition-colors ${
                    verFilter === v.id
                      ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-950 border-slate-700 dark:border-slate-200 font-semibold'
                      : 'bg-white dark:bg-[#0B1120] text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-slate-400'
                  }`}
                >
                  {v.label}
                </button>
              ))}
            </div>
          </div>

          {filteredItems.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 p-12 text-center text-sm text-slate-500">
              当前筛选条件下暂无匹配情报
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-5">
              {filteredItems.map((item) => {
                const vBadge =
                  VERIFICATION_BADGES[item.verification] || VERIFICATION_BADGES.official;
                const spec = item.model_spec;

                return (
                  <article
                    key={item.id}
                    className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120]/90 p-5 sm:p-6 flex flex-col justify-between gap-4 hover:border-amber-400/50 transition-all shadow-sm"
                  >
                    <div className="space-y-3.5">
                      {/* Meta & Pure Solid Badges (Zero Emoji) */}
                      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className={`px-2 py-0.5 rounded border font-semibold ${vBadge.cls}`}>
                            {vBadge.label}
                          </span>
                          <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800">
                            {CATEGORY_LABELS[item.category] || item.category}
                          </span>
                        </div>
                        <span className="text-slate-400">{item.published_at || '近期发布'}</span>
                      </div>

                      {/* Title & Summary */}
                      <div className="space-y-2">
                        <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-snug">
                          {item.title_zh}
                        </h2>
                        <p className="text-xs sm:text-[13px] text-slate-600 dark:text-slate-300 leading-relaxed">
                          {item.summary_zh}
                        </p>
                      </div>

                      {/* Model X-Ray Parameter Bar */}
                      {spec && (
                        <div className="rounded-xl border border-sky-500/30 bg-sky-500/[0.06] dark:bg-sky-950/25 p-3.5 space-y-2.5">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="text-[11px] font-mono font-bold text-sky-700 dark:text-sky-300 flex items-center gap-1.5">
                              <Cpu className="w-3.5 h-3.5" />
                              <span>
                                {spec.is_open_weight ? '开源模型 X 光参数条' : '闭源 API 规格条'}
                              </span>
                            </span>
                            {spec.hf_repo && (
                              <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                                {spec.hf_repo}
                              </span>
                            )}
                          </div>

                          {spec.is_open_weight ? (
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-mono">
                              <div className="p-2 rounded bg-white/80 dark:bg-slate-900/80 border border-slate-200/70 dark:border-slate-800">
                                <div className="text-slate-400">参数规模</div>
                                <div className="font-bold text-slate-900 dark:text-white truncate">
                                  {spec.params_summary || `${spec.num_layers}L`}
                                </div>
                              </div>
                              <div className="p-2 rounded bg-white/80 dark:bg-slate-900/80 border border-slate-200/70 dark:border-slate-800">
                                <div className="text-slate-400">GQA 倍率</div>
                                <div className="font-bold text-sky-600 dark:text-sky-400">
                                  {spec.gqa_ratio ? `${spec.gqa_ratio}:1` : '-'}
                                </div>
                              </div>
                              <div className="p-2 rounded bg-white/80 dark:bg-slate-900/80 border border-slate-200/70 dark:border-slate-800">
                                <div className="text-slate-400">KV/Token (BF16)</div>
                                <div className="font-bold text-emerald-600 dark:text-emerald-400">
                                  {spec.kv_kb_per_token_bf16 ? `${spec.kv_kb_per_token_bf16} KB` : '-'}
                                </div>
                              </div>
                              <div className="p-2 rounded bg-white/80 dark:bg-slate-900/80 border border-slate-200/70 dark:border-slate-800">
                                <div className="text-slate-400">上下文窗口</div>
                                <div className="font-bold text-slate-900 dark:text-white">
                                  {spec.context_window || (spec.max_context ? `${Math.round(spec.max_context / 1024)}K` : '-')}
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-1 text-xs font-mono text-slate-700 dark:text-slate-300">
                              <div>上下文：{spec.context_window || '-'} · 定价：{spec.api_pricing || '未公布'}</div>
                              {spec.highlights && (
                                <div className="text-slate-500 dark:text-slate-400 font-sans">
                                  特性：{spec.highlights}
                                </div>
                              )}
                            </div>
                          )}

                          {spec.is_open_weight && (
                            <div className="flex justify-end">
                              <button
                                type="button"
                                onClick={() =>
                                  onSendToChipLadder &&
                                  onSendToChipLadder({
                                    name: item.title_zh,
                                    hf_repo: spec.hf_repo,
                                    raw_config: spec.raw_config,
                                    params_summary: spec.params_summary,
                                  })
                                }
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-sky-500 hover:bg-sky-400 text-slate-950 transition-colors"
                              >
                                <span>送入芯片天梯算成本</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Dual-Form Media: 16:9 Image OR X/Twitter Original Quote Card */}
                      {item.image_url ? (
                        <button
                          type="button"
                          onClick={() => setLightboxImage({ url: item.image_url, title: item.title_zh })}
                          className="group relative w-full aspect-video rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-950"
                        >
                          <img
                            src={item.image_url}
                            alt={item.title_zh}
                            className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform"
                            loading="lazy"
                          />
                          <span className="absolute bottom-2 right-2 px-2 py-1 rounded-md bg-slate-950/75 text-white text-[10px] font-mono inline-flex items-center gap-1">
                            <Maximize2 className="w-3 h-3" />
                            <span>点击放大</span>
                          </span>
                        </button>
                      ) : (
                        item.original_en && (
                          <div className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/80 dark:bg-[#060A13]/85 p-3.5 space-y-1.5">
                            <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 dark:text-slate-400">
                              <span>{item.source_platform}</span>
                              <span className="text-sky-600 dark:text-sky-400">{item.author_handle}</span>
                            </div>
                            <p className="text-xs italic text-slate-700 dark:text-slate-300 leading-relaxed">
                              "{item.original_en}"
                            </p>
                          </div>
                        )
                      )}
                    </div>

                    {/* Footer Tags & Source Link */}
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap gap-1.5">
                        {(item.tags || []).map((t) => (
                          <span
                            key={t}
                            className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800"
                          >
                            #{t}
                          </span>
                        ))}
                      </div>
                      {item.source_url && (
                        <a
                          href={item.source_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-mono font-semibold text-amber-600 dark:text-[#F59E0B] hover:underline"
                        >
                          <span>原文溯源</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ==================== TAB 2: ENGINE RELEASES ==================== */}
      {subTab === 'engines' && (
        <div className="space-y-4">
          <div className="text-xs font-mono text-slate-500 dark:text-slate-400">
            追踪 6 大核心开源推理与算子框架最新版本（更新于 {enginesState.data?.updated_at || '-'}）
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {enginesList.map((eng) => (
              <div
                key={eng.id}
                className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120]/90 p-5 flex flex-col justify-between gap-4 hover:border-sky-400/50 transition-all shadow-sm"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <Package className="w-4 h-4 text-sky-400" />
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                          {eng.name}
                        </h3>
                      </div>
                      <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                        {eng.repo}
                      </div>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                      {eng.latest_version}
                    </span>
                  </div>

                  <div className="inline-block px-2 py-0.5 rounded text-[10px] font-mono bg-sky-500/10 text-sky-700 dark:text-sky-300 border border-sky-500/20">
                    {eng.category}
                  </div>

                  <p className="text-xs sm:text-[13px] text-slate-600 dark:text-slate-300 leading-relaxed">
                    {eng.highlights_zh}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-400">发布：{eng.released_at}</span>
                  <a
                    href={eng.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sky-600 dark:text-sky-400 hover:underline font-semibold"
                  >
                    <span>Release Notes</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Image Lightbox */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm"
          onClick={() => setLightboxImage(null)}
        >
          <div className="relative max-w-4xl w-full space-y-2" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setLightboxImage(null)}
              className="absolute -top-10 right-0 px-3 py-1 rounded-lg bg-slate-800 text-white text-xs font-mono inline-flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" />
              <span>关闭</span>
            </button>
            <img
              src={lightboxImage.url}
              alt={lightboxImage.title}
              className="w-full max-h-[82vh] object-contain rounded-xl border border-slate-700 bg-black"
            />
          </div>
        </div>
      )}
    </div>
  );
}
