/** 공개 사이트 URL (canonical·OG). 배포 도메인이 다르면 VITE_SITE_URL 설정 */
export function getSiteUrl(): string {
  const raw = import.meta.env.VITE_SITE_URL?.trim();
  const base = raw && raw.length > 0 ? raw : 'https://trendlab.dev';
  return base.replace(/\/$/, '');
}

const DEFAULT_PAGE_TITLE = 'TREN:D LAB - 뉴스 트렌드 시스템';
const DEFAULT_META_DESCRIPTION =
  '실시간 뉴스 트렌드를 분석하고 키워드 랭킹을 제공하여 최신 이슈를 한눈에 파악할 수 있는 서비스입니다.';

const JSON_LD_ID = 'seo-keyword-jsonld';

function truncateMeta(text: string, max = 160): string {
  const t = text.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1).trimEnd()}…`;
}

function ensureMeta(attr: 'name' | 'property', key: string, content: string) {
  const metas = document.head.querySelectorAll('meta');
  for (const m of metas) {
    if (m.getAttribute(attr) === key) {
      m.setAttribute('content', content);
      return;
    }
  }
  const el = document.createElement('meta');
  el.setAttribute(attr, key);
  el.setAttribute('content', content);
  document.head.appendChild(el);
}

function ensureCanonical(href: string | null) {
  const existing = document.head.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!href) {
    existing?.remove();
    return;
  }
  const link = existing ?? document.createElement('link');
  if (!existing) {
    link.setAttribute('rel', 'canonical');
    document.head.appendChild(link);
  }
  link.setAttribute('href', href);
}

function setJsonLd(data: Record<string, unknown> | null) {
  const existing = document.getElementById(JSON_LD_ID) as HTMLScriptElement | null;
  if (!data) {
    existing?.remove();
    return;
  }
  const script = existing ?? document.createElement('script');
  if (!existing) {
    script.id = JSON_LD_ID;
    script.type = 'application/ld+json';
    document.head.appendChild(script);
  }
  script.textContent = JSON.stringify(data);
}

function defaultOgImageUrl(): string {
  return `${getSiteUrl()}/trendlab_image2.png`;
}

export function applyKeywordPageSeo(params: { keyword: string; description: string; pagePath: string }) {
  const site = getSiteUrl();
  const path = params.pagePath.startsWith('/') ? params.pagePath : `/${params.pagePath}`;
  const pageUrl = `${site}${path}`;
  const title = `${params.keyword} - TREN:D LAB`;
  const desc = truncateMeta(
    params.description?.trim() ||
      `「${params.keyword}」 실시간 뉴스 트렌드와 관련 기사를 TREN:D LAB에서 확인하세요.`,
    160,
  );

  document.title = title;

  ensureMeta('name', 'description', desc);
  ensureMeta('property', 'og:title', title);
  ensureMeta('property', 'og:description', desc);
  ensureMeta('property', 'og:url', pageUrl);
  ensureMeta('property', 'og:type', 'article');
  ensureMeta('property', 'og:image', defaultOgImageUrl());
  ensureMeta('property', 'og:locale', 'ko_KR');
  ensureMeta('property', 'og:site_name', 'TREN:D LAB');
  ensureMeta('name', 'twitter:card', 'summary_large_image');
  ensureMeta('name', 'twitter:title', title);
  ensureMeta('name', 'twitter:description', desc);
  ensureMeta('name', 'twitter:image', defaultOgImageUrl());

  ensureCanonical(pageUrl);

  setJsonLd({
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: title,
    description: desc,
    url: pageUrl,
    isPartOf: {
      '@type': 'WebSite',
      name: 'TREN:D LAB',
      url: site,
    },
  });
}

export function resetDefaultSeo() {
  const site = getSiteUrl();
  document.title = DEFAULT_PAGE_TITLE;

  ensureMeta('name', 'description', DEFAULT_META_DESCRIPTION);
  ensureMeta('property', 'og:title', DEFAULT_PAGE_TITLE);
  ensureMeta('property', 'og:description', DEFAULT_META_DESCRIPTION);
  ensureMeta('property', 'og:url', `${site}/`);
  ensureMeta('property', 'og:type', 'website');
  ensureMeta('property', 'og:image', defaultOgImageUrl());
  ensureMeta('property', 'og:locale', 'ko_KR');
  ensureMeta('property', 'og:site_name', 'TREN:D LAB');
  ensureMeta('name', 'twitter:card', 'summary_large_image');
  ensureMeta('name', 'twitter:title', DEFAULT_PAGE_TITLE);
  ensureMeta('name', 'twitter:description', DEFAULT_META_DESCRIPTION);
  ensureMeta('name', 'twitter:image', defaultOgImageUrl());

  ensureCanonical(`${site}/`);

  setJsonLd(null);
}
