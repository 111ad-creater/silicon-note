export const GITHUB_REPO = '111ad-creater/silicon-note';

export type DataSourceKind = 'cdn' | 'local' | 'fallback';

export interface DynamicDataResult<T> {
  data: T;
  source: DataSourceKind;
}

/**
 * Fetch dynamic JSON data with zero-Netlify-build CDN priority:
 * 1. jsDelivr CDN direct link (@main/public/data/<filename>)
 * 2. Local static /data/<filename>
 * 3. Built-in fallback data
 */
export async function fetchDynamicDataWithSource<T>(
  filename: string,
  fallbackData: T
): Promise<DynamicDataResult<T>> {
  const isUnconfiguredRepo =
    !GITHUB_REPO || GITHUB_REPO.includes('YOUR_GITHUB_USER');

  const urls: Array<{ url: string; kind: DataSourceKind }> = [];
  if (!isUnconfiguredRepo) {
    urls.push({
      url: `https://cdn.jsdelivr.net/gh/${GITHUB_REPO}@main/public/data/${filename}`,
      kind: 'cdn',
    });
  }
  urls.push({
    url: `/data/${filename}`,
    kind: 'local',
  });

  for (const target of urls) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 5000);
      const res = await fetch(target.url, {
        cache: 'no-store',
        signal: controller.signal,
      });
      clearTimeout(timer);
      if (!res.ok) continue;
      const json = (await res.json()) as T;
      if (json !== null && json !== undefined) {
        return { data: json, source: target.kind };
      }
    } catch {
      // Try next source gracefully
    }
  }

  return { data: fallbackData, source: 'fallback' };
}

export async function fetchDynamicData<T>(
  filename: string,
  fallbackData: T
): Promise<T> {
  const res = await fetchDynamicDataWithSource(filename, fallbackData);
  return res.data;
}
