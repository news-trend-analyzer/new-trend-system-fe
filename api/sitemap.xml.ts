type TrendItem = {
  id?: string | number;
  keyword?: string;
  query?: string;
  name?: string;
  normalizedText?: string;
};

declare const process: {
  env: Record<string, string | undefined>;
};

const SITE_URL = 'https://trendlab.dev';
const DEFAULT_API_BASE = 'https://api.trendlab.dev';
const KEYWORD_LIMIT = 300;

type SitemapRuntimeConfig = {
  apiBase: string;
  apiKey?: string;
};

function toKeywordSlug(keyword: string): string {
  return encodeURIComponent(keyword.trim().toLowerCase());
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function extractKeyword(item: TrendItem): string {
  return (item.keyword || item.query || item.name || item.normalizedText || '').trim();
}

/** 키워드 URL — id 우선(안정 링크), id 없으면 슬러그 */
async function fetchTrendKeywordLocs(apiBase: string, apiKey?: string): Promise<string[]> {
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  if (apiKey) {
    headers['X-API-Key'] = apiKey;
  }

  const [dailyRes, realtimeRes] = await Promise.allSettled([
    fetch(`${apiBase}/trend/top`, { method: 'GET', headers }),
    fetch(`${apiBase}/trend/realtime?limit=100`, { method: 'GET', headers }),
  ]);

  const merged: { id: string | null; keyword: string }[] = [];

  const collect = async (result: PromiseSettledResult<Response>) => {
    if (result.status !== 'fulfilled' || !result.value.ok) return;
    const data = await result.value.json();
    const rows = Array.isArray(data) ? data : Array.isArray(data?.items) ? data.items : [];
    for (const row of rows as TrendItem[]) {
      const keyword = extractKeyword(row);
      if (!keyword) continue;
      const id = row.id != null && String(row.id).trim() !== '' ? String(row.id) : null;
      merged.push({ id, keyword });
    }
  };

  await Promise.all([collect(dailyRes), collect(realtimeRes)]);

  const seen = new Set<string>();
  const locs: string[] = [];
  for (const e of merged) {
    const loc = e.id
      ? `${SITE_URL}/keyword/${encodeURIComponent(e.id)}`
      : `${SITE_URL}/keyword/${toKeywordSlug(e.keyword)}`;
    if (seen.has(loc)) continue;
    seen.add(loc);
    locs.push(loc);
    if (locs.length >= KEYWORD_LIMIT) break;
  }
  return locs;
}

export default async function handler(_req: any, res: any): Promise<void> {
  const config: SitemapRuntimeConfig = {
    // 사이트맵 전용 변수가 있으면 최우선 사용, 없으면 기존 FE 환경 변수 fallback
    apiBase:
      process.env.SITEMAP_API_BASE_URL ||
      process.env.VITE_API_BASE_URL ||
      DEFAULT_API_BASE,
    apiKey: process.env.SITEMAP_API_KEY || process.env.VITE_ADMIN_API_KEY,
  };
  const nowIso = new Date().toISOString();

  let keywordLocs: string[] = [];
  try {
    keywordLocs = await fetchTrendKeywordLocs(config.apiBase, config.apiKey);
  } catch {
    keywordLocs = [];
  }

  const staticUrls = [
    { loc: `${SITE_URL}/`, changefreq: 'hourly', priority: '1.0' },
    { loc: `${SITE_URL}/report`, changefreq: 'daily', priority: '0.8' },
    { loc: `${SITE_URL}/terms`, changefreq: 'monthly', priority: '0.3' },
    { loc: `${SITE_URL}/privacy`, changefreq: 'monthly', priority: '0.3' },
  ];

  const keywordUrls = keywordLocs.map((loc) => ({
    loc,
    changefreq: 'hourly',
    priority: '0.7',
  }));

  const urls = [...staticUrls, ...keywordUrls];
  const body =
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    urls
      .map(
        (u) =>
          `  <url>\n` +
          `    <loc>${escapeXml(u.loc)}</loc>\n` +
          `    <lastmod>${nowIso}</lastmod>\n` +
          `    <changefreq>${u.changefreq}</changefreq>\n` +
          `    <priority>${u.priority}</priority>\n` +
          `  </url>`
      )
      .join('\n') +
    '\n</urlset>\n';

  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', 's-maxage=900, stale-while-revalidate=86400');
  res.status(200).send(body);
}
