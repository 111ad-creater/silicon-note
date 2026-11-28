import os
import json
import urllib.request
from datetime import datetime, timezone, timedelta

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "").strip()
GITHUB_TOKEN = os.environ.get("GITHUB_TOKEN", "").strip()
OUTPUT_PATH = "public/data/engine-releases.json"

ENGINES = [
    {"id": "vllm", "name": "vLLM", "repo": "vllm-project/vllm", "category": "通用推理引擎"},
    {"id": "sglang", "name": "SGLang", "repo": "sgl-project/sglang", "category": "高并发 / RadixAttention"},
    {"id": "triton", "name": "OpenAI Triton", "repo": "triton-lang/triton", "category": "块级算子编译器"},
    {"id": "tilelang", "name": "TileLang", "repo": "tile-ai/tilelang", "category": "异构块级算子语言"},
    {"id": "llama-cpp", "name": "llama.cpp", "repo": "ggml-org/llama.cpp", "category": "端侧 / GGUF 引擎"},
    {"id": "nano-vllm", "name": "Nano-vLLM", "repo": "GeeeekExplorer/nano-vllm", "category": "极简教学/实验内核"},
]


def fetch_github_json(url):
    headers = {
        "User-Agent": "SiliconNote-Release-Tracker",
        "Accept": "application/vnd.github+json",
    }
    if GITHUB_TOKEN:
        headers["Authorization"] = f"Bearer {GITHUB_TOKEN}"
    req = urllib.request.Request(url, headers=headers)
    with urllib.request.urlopen(req, timeout=20) as resp:
        return json.loads(resp.read().decode("utf-8"))


def summarize_release_zh(name, version, notes):
    if not GEMINI_API_KEY or not notes:
        return f"{name} 发布 {version} 更新，包含性能调优与稳定性改进。"
    prompt = f"用 1 句客观精炼的中文（45字内，无 Emoji）总结 {name} {version} 的核心性能/架构改动：\n{notes[:1800]}"
    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {"temperature": 0.1},
    }
    data = json.dumps(payload).encode("utf-8")
    for model_id in (
        "gemini-3.8-flash",
        "gemini-3.7-flash",
        "gemini-3.8-flash-lite",
        "gemini-3.5-flash-lite",
        "gemini-2.5-flash",
    ):
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_id}:generateContent"
        req = urllib.request.Request(
            url,
            data=data,
            headers={
                "Content-Type": "application/json",
                "x-goog-api-key": GEMINI_API_KEY,
            },
            method="POST",
        )
        try:
            with urllib.request.urlopen(req, timeout=25) as resp:
                res = json.loads(resp.read().decode("utf-8"))
                return res["candidates"][0]["content"]["parts"][0]["text"].strip()
        except Exception:
            continue
    return f"{name} 发布 {version}，包含算子调度与显存路径优化。"


def main():
    now_bj = datetime.now(timezone(timedelta(hours=8)))
    bj_time = now_bj.strftime("%Y-%m-%d %H:%M (UTC+8)")

    existing = {}
    if os.path.exists(OUTPUT_PATH):
        try:
            with open(OUTPUT_PATH, "r", encoding="utf-8") as f:
                for item in json.load(f).get("engines", []):
                    existing[item["id"]] = item
        except Exception:
            pass

    results = []
    for eng in ENGINES:
        repo = eng["repo"]
        try:
            rel = fetch_github_json(f"https://api.github.com/repos/{repo}/releases/latest")
            version = rel.get("tag_name") or "latest"
            released_at = (rel.get("published_at") or "")[:10]
            notes = rel.get("body") or ""
            prev = existing.get(eng["id"], {})
            if prev.get("latest_version") == version and prev.get("highlights_zh"):
                highlights = prev["highlights_zh"]
            else:
                highlights = summarize_release_zh(eng["name"], version, notes)
            results.append(
                {
                    "id": eng["id"],
                    "name": eng["name"],
                    "repo": repo,
                    "latest_version": version,
                    "released_at": released_at or now_bj.strftime("%Y-%m-%d"),
                    "category": eng["category"],
                    "highlights_zh": highlights,
                    "url": rel.get("html_url") or f"https://github.com/{repo}/releases",
                }
            )
        except Exception:
            if eng["id"] in existing:
                results.append(existing[eng["id"]])
            else:
                results.append(
                    {
                        "id": eng["id"],
                        "name": eng["name"],
                        "repo": repo,
                        "latest_version": "main-latest",
                        "released_at": now_bj.strftime("%Y-%m-%d"),
                        "category": eng["category"],
                        "highlights_zh": "持续迭代核心调度与算子内核。",
                        "url": f"https://github.com/{repo}",
                    }
                )

    os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)
    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump({"updated_at": bj_time, "engines": results}, f, ensure_ascii=False, indent=2)


if __name__ == "__main__":
    main()
