import os
import json
import time
import urllib.request
import urllib.error
from datetime import datetime, timezone, timedelta
from email.utils import parsedate_to_datetime

BJ_TZ = timezone(timedelta(hours=8))

TAVILY_API_KEY = os.environ.get("TAVILY_API_KEY", "").strip()
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "").strip()
OUTPUT_PATH = "public/data/ai-radar.json"

SEARCH_QUERIES = [
    ("model_release", "new AI model release announcement technical report OpenAI Anthropic Claude Google Gemini DeepSeek Qwen Llama site:x.com OR hackernews"),
    ("model_release", "open weight LLM release huggingface config benchmark reasoning model DeepSeek Qwen Llama Mistral site:x.com"),
    ("ai_chip", "vLLM SGLang TensorRT-LLM Triton TileLang KV cache quantization inference optimization benchmark site:x.com OR github.com"),
    ("ai_chip", "NVIDIA Blackwell Rubin AMD MI350 Ascend NPU TPU HBM SRAM AI chip architecture paper OR release"),
    ("freebie", "AI tool free tier Pro access open beta Antigravity Cursor Claude Gemini API free site:x.com OR hackernews"),
]


def post_json(url, payload, extra_headers=None):
    data = json.dumps(payload).encode("utf-8")
    headers = {"Content-Type": "application/json"}
    if extra_headers:
        headers.update(extra_headers)
    req = urllib.request.Request(
        url,
        data=data,
        headers=headers,
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=45) as resp:
        return json.loads(resp.read().decode("utf-8"))


def list_gemini_flash_models():
    """Query live Gemini models list via x-goog-api-key header as fallback."""
    url = "https://generativelanguage.googleapis.com/v1beta/models"
    req = urllib.request.Request(url, headers={"x-goog-api-key": GEMINI_API_KEY})
    try:
        with urllib.request.urlopen(req, timeout=20) as resp:
            data = json.loads(resp.read().decode("utf-8"))
        flash_models = []
        for m in data.get("models", []):
            methods = m.get("supportedGenerationMethods") or []
            name = (m.get("name") or "").replace("models/", "")
            if "generateContent" in methods and "flash" in name.lower():
                flash_models.append(name)
        return flash_models
    except Exception:
        return []


def call_gemini_generate(payload):
    candidates = [
        "gemini-3.8-flash",
        "gemini-3.7-flash",
        "gemini-3.8-flash-lite",
        "gemini-3.5-flash-lite",
        "gemini-2.5-flash",
    ]
    tried = set()
    last_err = None

    def try_models(model_list):
        nonlocal last_err
        for model_id in model_list:
            if not model_id or model_id in tried:
                continue
            tried.add(model_id)
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_id}:generateContent"
            for attempt in range(2):
                try:
                    return post_json(url, payload, {"x-goog-api-key": GEMINI_API_KEY})
                except urllib.error.HTTPError as e:
                    body = ""
                    try:
                        body = e.read().decode("utf-8", errors="ignore")[:300]
                    except Exception:
                        pass
                    print(f"[Warn] Gemini model {model_id} (try {attempt + 1}) HTTP {e.code}: {body}")
                    last_err = e
                    if e.code in (429, 500, 502, 503, 504) and attempt == 0:
                        time.sleep(3)
                        continue
                    if e.code in (400, 404, 429, 500, 502, 503, 504):
                        break
                    raise
        return None

    res = try_models(candidates)
    if res is not None:
        return res

    discovered = list_gemini_flash_models()
    if discovered:
        res = try_models(discovered)
        if res is not None:
            return res

    if last_err:
        raise last_err
    raise RuntimeError("No working Gemini model found")


def enrich_open_model_spec(hf_repo: str):
    """自动拉取开源模型 HuggingFace config.json 并算出核心物理参数，供前端一键送入芯片天梯"""
    if not hf_repo or "/" not in hf_repo:
        return None
    url = f"https://huggingface.co/{hf_repo}/raw/main/config.json"
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "SiliconNote-Bot"})
        with urllib.request.urlopen(req, timeout=15) as resp:
            cfg = json.loads(resp.read().decode("utf-8"))
        L = cfg.get("num_hidden_layers", 0)
        H = cfg.get("hidden_size", 0)
        Nq = cfg.get("num_attention_heads", 1)
        Nkv = cfg.get("num_key_value_heads", Nq)
        head_dim = cfg.get("head_dim", H // max(Nq, 1))
        experts = cfg.get("num_local_experts") or cfg.get("n_routed_experts") or 1
        kv_bytes_bf16 = 2 * L * Nkv * head_dim * 2
        keys = [
            "num_hidden_layers",
            "hidden_size",
            "intermediate_size",
            "num_attention_heads",
            "num_key_value_heads",
            "vocab_size",
            "num_local_experts",
            "num_experts_per_tok",
            "max_position_embeddings",
        ]
        return {
            "is_open_weight": True,
            "hf_repo": hf_repo,
            "is_moe": experts > 1,
            "num_layers": L,
            "hidden_size": H,
            "gqa_ratio": round(Nq / max(Nkv, 1), 1),
            "kv_kb_per_token_bf16": round(kv_bytes_bf16 / 1024, 2),
            "max_context": cfg.get("max_position_embeddings", 0),
            "raw_config": {k: cfg[k] for k in keys if k in cfg},
        }
    except Exception:
        return None


def parse_bj_time(raw_date_str: str) -> str:
    """将网页/API 返回的原始发布时间精准转换为北京时间（YYYY-MM-DD HH:mm），严禁编造或出现未来时间。"""
    if not raw_date_str or not isinstance(raw_date_str, str):
        return ""
    text = raw_date_str.strip()
    if not text:
        return ""

    dt = None
    try:
        dt = parsedate_to_datetime(text)
    except (TypeError, ValueError):
        dt = None

    if dt is None:
        try:
            iso_text = text[:-1] + "+00:00" if text.endswith("Z") else text
            dt = datetime.fromisoformat(iso_text)
        except ValueError:
            return ""

    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)

    dt_bj = dt.astimezone(BJ_TZ)
    now_bj = datetime.now(BJ_TZ)
    if dt_bj > now_bj:
        return ""

    return dt_bj.strftime("%Y-%m-%d %H:%M")


def fetch_tavily_news():
    raw_items = []
    url_to_time = {}
    for cat, query in SEARCH_QUERIES:
        payload = {
            "api_key": TAVILY_API_KEY,
            "query": query,
            "search_depth": "basic",
            "topic": "news",
            "days": 2,
            "max_results": 4,
            "include_images": True,
        }
        try:
            res = post_json("https://api.tavily.com/search", payload)
            images = res.get("images", [])
            for idx, r in enumerate(res.get("results", [])):
                img = images[idx] if idx < len(images) else ""
                if isinstance(img, dict):
                    img = img.get("url", "")
                item_url = (r.get("url") or "").strip()
                raw_pub = r.get("published_date", "")
                parsed_bj = parse_bj_time(raw_pub)
                if item_url:
                    url_to_time[item_url] = parsed_bj
                    url_to_time[item_url.rstrip("/")] = parsed_bj
                raw_items.append(
                    {
                        "suggested_category": cat,
                        "title": r.get("title", ""),
                        "url": item_url,
                        "published_date": raw_pub,
                        "content": r.get("content", "")[:650],
                        "image_url": img if str(img).startswith("http") else "",
                    }
                )
        except Exception as e:
            print(f"[Warn] Tavily failed for {cat}: {e}")
    return raw_items, url_to_time


def summarize_with_gemini(raw_items, url_to_time=None):
    now_bj = datetime.now(BJ_TZ)
    bj_time = now_bj.strftime("%Y-%m-%d %H:%M (UTC+8)")
    url_time_map = url_to_time if isinstance(url_to_time, dict) else {}

    prompt = f"""你是一名极其严谨的 AI 科技情报官。请从以下原始资讯中去重精选 8~10 条，严格按配比筛选并输出合法 JSON（禁止 Markdown 标记）：
- 新模型发布与架构突破（category="model_release"）：约 40%（3~4 条）
- AI 芯片与推理优化（category="ai_chip"）：约 40%（3~4 条）
- 免费工具羊毛与福利（category="freebie"）：约 20%（1~2 条）

硬性红线：
1. 允许收录有技术价值的「待证实」情报（未官宣参数泄露、待复核突破声明），verification 标为 "unverified" 并客观说明疑点。
2. 彻底剔除娱乐性质内容：严禁玩梗、段子、名人八卦、纯整活或低质营销号！
3. verification 仅允许："official" | "freebie" | "preprint" | "unverified"。严禁在标题/摘要/标签中使用任何 Emoji。
4. 新模型自动解析字段：若该条目是新模型发布，请补充 `model_spec` 对象：
   - 开源权重模型：填写 `"is_open_weight": true, "hf_repo": "组织/仓库名(未知留空)", "params_summary": "如 671B MoE (37B 激活)", "context_window": "如 128K"`；
   - 闭源 API 模型：填写 `"is_open_weight": false, "context_window": "如 200K", "api_pricing": "如 $3/$15 per 1M", "highlights": "核心特性(未知填未公布，严禁编造)"`；
   - 非新模型新闻：`model_spec` 填 `null`。
5. 时间字段 `published_at` 统一留空 `""`，禁止自行编造发布时间，后续将由后端脚本按原网页链接精确回填。

输出 JSON 结构：
{{
  "updated_at": "{bj_time}", "total_count": 8,
  "items": [{{
    "id": "radar-1", "category": "model_release | ai_chip | freebie",
    "verification": "official | freebie | preprint | unverified",
    "title_zh": "精炼客观中文标题（28字内，无表情）", "summary_zh": "2~3 句硬核解读",
    "original_en": "1~2 句原汁原味英文原文摘录",
    "source_platform": "X (Twitter) | GitHub | Official Blog | arXiv",
    "author_handle": "@来源账号或媒体", "image_url": "有效图片链接或 ''",
    "source_url": "原始链接", "published_at": "", "tags": ["标签1", "标签2"],
    "model_spec": null
  }}]
}}"""

    payload = {
        "contents": [
            {
                "parts": [
                    {
                        "text": prompt
                        + "\n\n原始资讯：\n"
                        + json.dumps(raw_items, ensure_ascii=False)
                    }
                ]
            }
        ],
        "generationConfig": {
            "responseMimeType": "application/json",
            "temperature": 0.15,
        },
    }
    res = call_gemini_generate(payload)
    parsed = json.loads(res["candidates"][0]["content"]["parts"][0]["text"])
    valid_v = {"official", "freebie", "preprint", "unverified"}
    cleaned = []
    for it in parsed.get("items", []):
        if it.get("verification") not in valid_v:
            continue
        src_url = (it.get("source_url") or "").strip()
        it["published_at"] = url_time_map.get(
            src_url, url_time_map.get(src_url.rstrip("/"), "")
        )
        spec = it.get("model_spec")
        if (
            isinstance(spec, dict)
            and spec.get("is_open_weight")
            and spec.get("hf_repo")
        ):
            enriched = enrich_open_model_spec(spec["hf_repo"])
            if enriched:
                spec.update(enriched)
        cleaned.append(it)
    parsed["items"] = cleaned
    parsed["updated_at"] = bj_time
    parsed["total_count"] = len(cleaned)
    return parsed


if __name__ == "__main__":
    if TAVILY_API_KEY and GEMINI_API_KEY:
        raw, url_to_time = fetch_tavily_news()
        if raw:
            digest = summarize_with_gemini(raw, url_to_time)
            os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)
            with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
                json.dump(digest, f, ensure_ascii=False, indent=2)
