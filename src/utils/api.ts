import { KeywordRanking, SearchSuggestion, SearchResult, SearchResultResponse } from '@/types';

// 개발 환경에서는 프록시를 통해 /api로 시작하는 경로 사용
// 프로덕션에서는 환경변수 필수 (Vercel 등 배포 환경에서 설정 필요)
// 개발 환경에서는 환경 변수와 관계없이 프록시를 우선 사용
function getApiBaseUrl(): string {
  if (import.meta.env.DEV) {
    return '/api';
  }
  
  // 프로덕션 환경에서는 환경 변수 필수
  const url = import.meta.env.VITE_API_BASE_URL;
  if (!url || url.trim() === '') {
    throw new Error(
      'VITE_API_BASE_URL 환경 변수가 설정되지 않았습니다.\n\n' +
      'Vercel 환경 변수 설정 방법:\n' +
      '1. Vercel 대시보드 > 프로젝트 선택 > Settings\n' +
      '2. Environment Variables 클릭\n' +
      '3. 다음 변수 추가:\n' +
      '   - Key: VITE_API_BASE_URL\n' +
      '   - Value: https://your-api-server.com (실제 백엔드 서버 URL)\n' +
      '   - Environment: Production, Preview, Development 모두 선택\n' +
      '4. 재배포 (Redeploy) 실행\n\n' +
      '⚠️ 프로덕션 환경에서는 localhost를 사용할 수 없습니다.'
    );
  }
  
  // localhost 사용 방지
  if (url.includes('localhost') || url.includes('127.0.0.1')) {
    throw new Error(
      `VITE_API_BASE_URL에 localhost가 포함되어 있습니다: ${url}\n\n` +
      '프로덕션 환경에서는 실제 백엔드 서버 URL을 사용해야 합니다.\n' +
      '예: https://api.yourdomain.com'
    );
  }
  
  return url;
}

function getSearchApiBaseUrl(): string {
  if (import.meta.env.DEV) {
    return '/search-api';
  }
  
  // 프로덕션 환경에서는 환경 변수 필수
  const url = import.meta.env.VITE_SEARCH_API_BASE_URL;
  if (!url || url.trim() === '') {
    throw new Error(
      'VITE_SEARCH_API_BASE_URL 환경 변수가 설정되지 않았습니다.\n\n' +
      'Vercel 환경 변수 설정 방법:\n' +
      '1. Vercel 대시보드 > 프로젝트 선택 > Settings\n' +
      '2. Environment Variables 클릭\n' +
      '3. 다음 변수 추가:\n' +
      '   - Key: VITE_SEARCH_API_BASE_URL\n' +
      '   - Value: https://your-search-api-server.com (실제 검색 API 서버 URL)\n' +
      '   - Environment: Production, Preview, Development 모두 선택\n' +
      '4. 재배포 (Redeploy) 실행\n\n' +
      '⚠️ 프로덕션 환경에서는 localhost를 사용할 수 없습니다.'
    );
  }
  
  // localhost 사용 방지
  if (url.includes('localhost') || url.includes('127.0.0.1')) {
    throw new Error(
      `VITE_SEARCH_API_BASE_URL에 localhost가 포함되어 있습니다: ${url}\n\n` +
      '프로덕션 환경에서는 실제 검색 API 서버 URL을 사용해야 합니다.\n' +
      '예: https://search-api.yourdomain.com'
    );
  }
  
  return url;
}

const API_BASE_URL = getApiBaseUrl();
const SEARCH_API_BASE_URL = getSearchApiBaseUrl();

function getTrendApiHeaders(): HeadersInit {
  return {
    'Content-Type': 'application/json',
  };
}

// 검색 API용 헤더 (Admin API Key 제외)
function getSearchApiHeaders(): HeadersInit {
  return {
    'Content-Type': 'application/json',
  };
}

export async function fetchKeywordRanking(): Promise<KeywordRanking[]> {
  const url = `${API_BASE_URL}/trend/top`;
  
  if (import.meta.env.DEV) {
    console.log('API 호출:', url);
    console.log('API_BASE_URL:', API_BASE_URL);
  }
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: getTrendApiHeaders(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      if (import.meta.env.DEV) {
        console.error('API 에러 응답:', errorText);
      }
      throw new Error(`API 호출 실패: ${response.status} ${response.statusText}${import.meta.env.DEV ? ` - ${errorText}` : ''}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('API 호출 중 에러 발생:', error);
      console.error('에러 상세:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
    }
    
    if (error instanceof TypeError) {
      if (error.message.includes('fetch') || error.message.includes('Failed to fetch')) {
        throw new Error(`네트워크 에러: ${url}에 연결할 수 없습니다. 서버가 실행 중인지 확인해주세요. (CORS 문제일 수 있습니다)`);
      }
    }
    throw error;
  }
}

export async function fetchRealtimeRanking(limit: number = 10): Promise<KeywordRanking[]> {
  const url = `${API_BASE_URL}/trend/realtime?limit=${limit}`;

  if (import.meta.env.DEV) {
    console.log('API 호출:', url);
  }

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: getTrendApiHeaders(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      if (import.meta.env.DEV) {
        console.error('API 에러 응답:', errorText);
      }
      throw new Error(`API 호출 실패: ${response.status} ${response.statusText}${import.meta.env.DEV ? ` - ${errorText}` : ''}`);
    }

    const data = await response.json();
    // 응답이 배열이 아니면 data/items/rankings 등에서 추출
    if (Array.isArray(data)) return data;
    const arr = data?.data ?? data?.items ?? data?.rankings ?? [];
    return Array.isArray(arr) ? arr : [];
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('실시간 API 호출 중 에러 발생:', error);
    }
    throw error;
  }
}

export interface KeywordInsightBriefingQuestion {
  question: string;
  answer: string;
  interestCount?: number;
}

export interface KeywordInsightCommerceHint {
  label: string;
  query: string;
  reason?: string;
}

export interface KeywordInsightBriefing {
  oneLineSummary?: string;
  whySteps?: string[];
  trendSignal?: {
    label?: string;
    changeRate?: number;
    basis?: string;
  };
  questions?: KeywordInsightBriefingQuestion[];
  essentialArticleIds?: Array<string | number>;
  commerceHints?: KeywordInsightCommerceHint[];
}

export interface KeywordInsightResponse {
  keywordId: string | number;
  keyword: string;
  summary: string | null;
  articleIds: Array<string | number> | null;
  analyzedAt: string | null;
  articleCount?: number;
  briefing?: KeywordInsightBriefing | null;
  commerceHints?: KeywordInsightCommerceHint[];
}

export interface CoupangAffiliateProduct {
  id?: string | number;
  name: string;
  url: string;
  imageUrl?: string;
  price?: number;
  priceText?: string;
  sourceQuery?: string;
}

// 키워드 AI 인사이트 요약 조회 (단건: /trend/keyword-insight/:keywordId)
export async function fetchKeywordInsight(keywordId: string): Promise<KeywordInsightResponse | null> {
  if (!keywordId || keywordId.trim().length === 0) {
    return null;
  }

  const url = `${API_BASE_URL}/trend/keyword-insight/${encodeURIComponent(keywordId.trim())}`;

  if (import.meta.env.DEV) {
    console.log('키워드 인사이트 API 호출:', url);
  }

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: getTrendApiHeaders(),
    });

    if (!response.ok) {
      if (import.meta.env.DEV) {
        const errorText = await response.text();
        console.warn('키워드 인사이트 API 호출 실패:', response.status, errorText);
      }
      return null;
    }

    const rawData = (await response.json()) as (Partial<KeywordInsightResponse> & { data?: Partial<KeywordInsightResponse> }) | null;
    const data = rawData && typeof rawData === 'object' && rawData.data && typeof rawData.data === 'object'
      ? rawData.data
      : rawData;
    if (!data || typeof data !== 'object') return null;

    return {
      keywordId: data.keywordId ?? keywordId,
      keyword: typeof data.keyword === 'string' ? data.keyword : '',
      summary: typeof data.summary === 'string' ? data.summary : null,
      articleIds: Array.isArray(data.articleIds) ? data.articleIds : null,
      analyzedAt: typeof data.analyzedAt === 'string' ? data.analyzedAt : null,
      articleCount: typeof data.articleCount === 'number' ? data.articleCount : undefined,
      briefing: data.briefing && typeof data.briefing === 'object' ? data.briefing : null,
      commerceHints: Array.isArray(data.commerceHints) ? data.commerceHints : undefined,
    };
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('키워드 인사이트 API 호출 중 에러 발생:', error);
    }
    return null;
  }
}

function normalizeCoupangProduct(raw: any, sourceQuery: string): CoupangAffiliateProduct | null {
  if (!raw || typeof raw !== 'object') return null;

  const name =
    raw.name ||
    raw.title ||
    raw.productName ||
    raw.product_name ||
    raw.itemName ||
    raw.label ||
    raw.query ||
    raw.keyword ||
    sourceQuery ||
    '';
  const url =
    raw.url ||
    raw.link ||
    raw.href ||
    raw.productLink ||
    raw.productUrl ||
    raw.product_url ||
    raw.affiliateUrl ||
    raw.affiliate_url ||
    raw.partnersUrl ||
    raw.partners_url ||
    raw.clickUrl ||
    raw.click_url ||
    raw.landingUrl ||
    raw.landing_url ||
    raw.landingURL ||
    raw.deeplink ||
    raw.deepLink ||
    raw.deep_link ||
    raw.shortUrl ||
    raw.shortenUrl ||
    raw.short_url ||
    raw.originalUrl ||
    raw.original_url ||
    '';
  const imageUrl =
    raw.imageUrl ||
    raw.image_url ||
    raw.productImageUrl ||
    raw.product_image_url ||
    raw.productImage ||
    raw.product_image ||
    raw.thumbnail ||
    raw.thumbnailUrl ||
    raw.image ||
    undefined;
  const rawPrice = raw.price ?? raw.productPrice ?? raw.product_price ?? raw.salePrice ?? raw.sale_price;
  const price = typeof rawPrice === 'number' ? rawPrice : Number.isFinite(Number(rawPrice)) ? Number(rawPrice) : undefined;
  const priceText = typeof raw.priceText === 'string' ? raw.priceText : typeof raw.price_text === 'string' ? raw.price_text : undefined;

  if (!url) return null;

  return {
    id: raw.id ?? raw.productId ?? raw.product_id,
    name: String(name),
    url: String(url),
    imageUrl: typeof imageUrl === 'string' ? imageUrl : undefined,
    price,
    priceText,
    sourceQuery,
  };
}

function extractProductRows(data: any): any[] {
  const looksLikeProduct = (value: any) => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
    const hasName = Boolean(value.name || value.title || value.productName || value.product_name || value.itemName || value.label);
    const hasUrl = Boolean(
      value.url ||
      value.link ||
      value.href ||
      value.productLink ||
      value.productUrl ||
      value.product_url ||
      value.affiliateUrl ||
      value.affiliate_url ||
      value.partnersUrl ||
      value.partners_url ||
      value.clickUrl ||
      value.click_url ||
      value.landingUrl ||
      value.landing_url ||
      value.landingURL ||
      value.deeplink ||
      value.deepLink ||
      value.deep_link ||
      value.shortUrl ||
      value.shortenUrl ||
      value.short_url ||
      value.originalUrl ||
      value.original_url
    );
    return hasUrl && (hasName || Boolean(value.query || value.keyword));
  };

  const candidates = [
    data,
    data?.data,
    data?.result,
    data?.results,
    data?.items,
    data?.products,
    data?.productData,
    data?.data?.items,
    data?.data?.products,
    data?.data?.productData,
    data?.data?.result,
    data?.data?.results,
    data?.result?.items,
    data?.result?.products,
    data?.result?.productData,
    data?.data?.result?.items,
    data?.data?.result?.products,
    data?.data?.result?.productData,
    data?.data?.data,
    data?.data?.data?.items,
    data?.data?.data?.products,
    data?.data?.data?.productData,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate;
    if (looksLikeProduct(candidate)) return [candidate];
  }

  const queue = [data];
  const visited = new Set<any>();

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current || typeof current !== 'object' || visited.has(current)) continue;
    visited.add(current);

    if (Array.isArray(current)) {
      if (current.some(looksLikeProduct)) return current;
      continue;
    }

    for (const value of Object.values(current)) {
      if (!value || typeof value !== 'object') continue;
      if (Array.isArray(value) && value.some(looksLikeProduct)) return value;
      queue.push(value);
    }
  }

  return [];
}

async function fetchCoupangDeeplinkFallback(query: string): Promise<CoupangAffiliateProduct[]> {
  const url = `${API_BASE_URL}/trend/affiliate/coupang/deeplink`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: getTrendApiHeaders(),
      body: JSON.stringify({ query: query.trim() }),
    });

    if (!response.ok) {
      if (import.meta.env.DEV) {
        const errorText = await response.text();
        console.warn('쿠팡 딥링크 fallback API 호출 실패:', response.status, errorText);
      }
      return [];
    }

    const data = await response.json();
    const rows = extractProductRows(data);
    const fallbackRows = rows.length > 0 ? rows : [data];

    return fallbackRows
      .map(row => normalizeCoupangProduct({ query: query.trim(), ...row }, query.trim()))
      .filter((product): product is CoupangAffiliateProduct => Boolean(product))
      .slice(0, 3);
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('쿠팡 딥링크 fallback API 호출 중 에러 발생:', error);
    }
    return [];
  }
}

export async function fetchCoupangProducts(query: string): Promise<CoupangAffiliateProduct[]> {
  if (!query || query.trim().length === 0) {
    return [];
  }

  const url = `${API_BASE_URL}/trend/affiliate/coupang/products`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: getTrendApiHeaders(),
      body: JSON.stringify({ query: query.trim() }),
    });

    if (!response.ok) {
      if (response.status === 404) {
        return fetchCoupangDeeplinkFallback(query);
      }

      if (import.meta.env.DEV) {
        const errorText = await response.text();
        console.warn('쿠팡 상품 API 호출 실패:', response.status, errorText);
      }
      return [];
    }

    const data = await response.json();
    const rows = extractProductRows(data);
    const products = rows
      .map(row => normalizeCoupangProduct(row, query.trim()))
      .filter((product): product is CoupangAffiliateProduct => Boolean(product))
      .slice(0, 3);

    if (import.meta.env.DEV && rows.length > 0 && products.length === 0) {
      console.warn('쿠팡 상품 API 응답은 받았지만 표시 가능한 상품 필드를 찾지 못했습니다:', data);
    }

    if (import.meta.env.DEV && rows.length === 0) {
      console.warn('쿠팡 상품 API 응답에서 상품 배열을 찾지 못했습니다:', data);
    }

    return products;
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('쿠팡 상품 API 호출 중 에러 발생:', error);
    }
    return [];
  }
}

export async function searchSuggestions(query: string): Promise<SearchSuggestion[]> {
  if (!query || query.trim().length === 0) {
    return [];
  }

  const url = `${SEARCH_API_BASE_URL}/articles/search?query=${encodeURIComponent(query.trim())}`;
  
  if (import.meta.env.DEV) {
    console.log('검색 API 호출:', url);
    console.log('SEARCH_API_BASE_URL:', SEARCH_API_BASE_URL);
  }
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: getSearchApiHeaders(),
    });

    if (!response.ok) {
      if (import.meta.env.DEV) {
        const errorText = await response.text();
        console.warn('검색 API 호출 실패:', response.status, errorText);
      }
      return [];
    }

    const data = await response.json();
    
    if (import.meta.env.DEV) {
      console.log('검색 API 원본 응답:', data);
      console.log('응답 타입:', typeof data);
      console.log('배열인가?', Array.isArray(data));
    }
    
    // 키워드 추출 헬퍼 함수
    const extractKeyword = (item: any): string => {
      if (typeof item === 'string') {
        return item;
      }
      if (typeof item === 'object' && item !== null) {
        // 검색 API 응답 구조에 맞게 title 우선 사용
        return item.title || item.keyword || item.query || item.text || item.name || item.label || '';
      }
      return '';
    };
    
    // API 응답 형태에 맞게 변환
    if (Array.isArray(data)) {
      const mapped: SearchSuggestion[] = [];
      data.forEach((item: any) => {
        const keyword = extractKeyword(item);
        if (keyword) {
          mapped.push({
            keyword,
            count: item.count || item.score || undefined,
          });
        }
      });
      if (import.meta.env.DEV) {
        console.log('변환된 검색 결과:', mapped);
      }
      return mapped;
    }
    
    // 객체 형태일 경우 (예: { items: [...], total: 25 })
    if (data && typeof data === 'object') {
      const results: SearchSuggestion[] = [];
      
      // items 배열이 있는 경우 (검색 API 응답 구조)
      if (Array.isArray(data.items)) {
        data.items.forEach((item: any) => {
          const keyword = extractKeyword(item);
          if (keyword) {
            results.push({ keyword, count: item.count });
          }
        });
        if (import.meta.env.DEV) {
          console.log('items 배열에서 변환된 결과:', results);
        }
        return results;
      }
      
      if (Array.isArray(data.suggestions)) {
        data.suggestions.forEach((item: any) => {
          const keyword = extractKeyword(item);
          if (keyword) {
            results.push({ keyword, count: item.count });
          }
        });
        return results;
      }
      
      if (Array.isArray(data.results)) {
        data.results.forEach((item: any) => {
          const keyword = extractKeyword(item);
          if (keyword) {
            results.push({ keyword, count: item.count });
          }
        });
        return results;
      }
      
      // 단일 객체인 경우
      const keyword = extractKeyword(data);
      if (keyword) {
        return [{ keyword, count: (data as any).count }];
      }
    }
    
    if (import.meta.env.DEV) {
      console.warn('예상하지 못한 응답 형태:', data);
    }
    return [];
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('검색 API 호출 중 에러 발생:', error);
      console.error('에러 상세:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : String(error),
      });
    }
    return []; // 에러 시 빈 배열 반환
  }
}

// 검색 결과 전체를 가져오는 함수 (검색 실행 시)
export async function searchArticles(query: string, page: number = 1, pageSize: number = 10): Promise<SearchResultResponse> {
  if (!query || query.trim().length === 0) {
    return { total: 0, items: [], page: 1, pageSize };
  }

  const url = `${SEARCH_API_BASE_URL}/articles/search?query=${encodeURIComponent(query.trim())}&page=${page}&size=${pageSize}`;
  
  if (import.meta.env.DEV) {
    console.log('검색 결과 API 호출:', url);
  }
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: getSearchApiHeaders(),
    });

    if (!response.ok) {
      if (import.meta.env.DEV) {
        console.warn('검색 결과 API 호출 실패:', response.status);
      }
      return { total: 0, items: [], page, pageSize };
    }

    const data = await response.json();
    
    if (import.meta.env.DEV) {
      console.log('검색 결과 API 원본 응답:', data);
    }
    
    // {total: 25, items: Array(10)} 형태 처리
    if (data && typeof data === 'object' && Array.isArray(data.items)) {
      return {
        total: data.total || data.items.length,
        items: data.items.map((item: any): SearchResult => ({
          id: item.id || item.link || '',
          title: item.title || '',
          link: item.link || item.id || '',
          press: item.press || '',
          pubDate: item.pubDate || '',
          description: item.description || '',
          category: item.category || '',
        })),
        page: data.page || page,
        pageSize: data.size || pageSize,
      };
    }
    
    return { total: 0, items: [], page, pageSize };
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('검색 결과 API 호출 중 에러 발생:', error);
    }
    return { total: 0, items: [], page, pageSize };
  }
}

// 키워드 ID 기반 기사 조회 함수 (트렌드 상세에서 사용)
export async function searchArticlesByKeyword(keywordId: string, page: number = 1, pageSize: number = 10): Promise<SearchResultResponse> {
  if (!keywordId || String(keywordId).trim().length === 0) {
    return { total: 0, items: [], page: 1, pageSize };
  }

  const url = `${SEARCH_API_BASE_URL}/articles/by-keyword?keywordId=${encodeURIComponent(String(keywordId).trim())}&page=${page}&size=${pageSize}`;

  if (import.meta.env.DEV) {
    console.log('키워드 상세 API 호출:', url);
  }

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: getSearchApiHeaders(),
    });

    if (!response.ok) {
      if (import.meta.env.DEV) {
        console.warn('키워드 상세 API 호출 실패:', response.status);
      }
      return { total: 0, items: [], page, pageSize };
    }

    const data = await response.json();

    // 예: { total, items: [...], page, size, ... }
    if (data && typeof data === 'object' && Array.isArray(data.items)) {
      return {
        total: data.total || data.items.length,
        items: data.items.map((item: any): SearchResult => ({
          id: item.id || item.url || item.title || '',
          title: item.title || '',
          link: item.url || item.id || '',
          press: item.publisher || '',
          pubDate: item.publishedAt || item.pubDate || '',
          description: item.description || '',
          category: item.category || '',
        })),
        page: data.page || page,
        pageSize: data.size || pageSize,
      };
    }

    return { total: 0, items: [], page, pageSize };
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('키워드 상세 API 호출 중 에러 발생:', error);
    }
    return { total: 0, items: [], page, pageSize };
  }
}

// 데이터 리포트 API 타입 정의
export interface DataReportRanking {
  id: string;
  normalizedText: string;
  displayText?: string;
  display_text?: string;
  freqSum: string;
  scoreSum: number;
}

export interface TimeSeriesData {
  bucketTime: string;
  freqSum: number;
  scoreSum: number;
}

export interface RelatedArticle {
  id: string;
  publisher: string;
  title: string;
  url: string;
  publishedAt: string;
  weight: number;
}

export interface RelatedKeyword {
  id: string;
  normalizedText: string;
  coCount: string;
  weightSum: number;
  associationScore: number;
}

// 데이터 리포트 API 함수들
function getDataReportApiBaseUrl(): string {
  if (import.meta.env.DEV) {
    // 개발 환경에서는 localhost:3002 직접 사용 (프록시 설정 필요 시 vite.config.ts 수정)
    return 'http://localhost:3002';
  }

  // 운영 환경: 우선 전용 ENV가 있으면 사용, 없으면 기존 트렌드 API BASE URL 재사용
  const url = import.meta.env.VITE_DATA_REPORT_API_BASE_URL;
  if (url && url.trim() !== '') {
    return url;
  }

  // 별도 환경 변수가 없으면 기존 트렌드 API BASE URL 사용
  return getApiBaseUrl();
}

const DATA_REPORT_API_BASE_URL = getDataReportApiBaseUrl();

export async function fetchDataReportRanking(): Promise<DataReportRanking[]> {
  const url = `${DATA_REPORT_API_BASE_URL}/data-report/ranking`;
  
  if (import.meta.env.DEV) {
    console.log('데이터 리포트 랭킹 API 호출:', url);
  }
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`데이터 리포트 랭킹 API 호출 실패: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('데이터 리포트 랭킹 API 호출 중 에러:', error);
    }
    throw error;
  }
}

export async function fetchTimeSeries(keywordId: string, limit?: number): Promise<TimeSeriesData[]> {
  const url = limit 
    ? `${DATA_REPORT_API_BASE_URL}/data-report/time-series?keywordId=${keywordId}&limit=${limit}`
    : `${DATA_REPORT_API_BASE_URL}/data-report/time-series?keywordId=${keywordId}`;
  
  if (import.meta.env.DEV) {
    console.log('시계열 데이터 API 호출:', url);
  }
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`시계열 데이터 API 호출 실패: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('시계열 데이터 API 호출 중 에러:', error);
    }
    throw error;
  }
}

export async function fetchRelatedArticles(keywordId: string): Promise<RelatedArticle[]> {
  const url = `${DATA_REPORT_API_BASE_URL}/data-report/related-articles?keywordId=${keywordId}`;
  
  if (import.meta.env.DEV) {
    console.log('관련 기사 API 호출:', url);
  }
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`관련 기사 API 호출 실패: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('관련 기사 API 호출 중 에러:', error);
    }
    throw error;
  }
}

export async function fetchRelatedKeywords(keywordId: string): Promise<RelatedKeyword[]> {
  const url = `${DATA_REPORT_API_BASE_URL}/data-report/related-keywords?keywordId=${keywordId}`;
  
  if (import.meta.env.DEV) {
    console.log('관련 키워드 API 호출:', url);
  }
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`관련 키워드 API 호출 실패: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('관련 키워드 API 호출 중 에러:', error);
    }
    throw error;
  }
}

// 키워드 검색 API 타입 정의
export interface SearchKeywordResult {
  id: string;
  normalizedText: string;
}

// 키워드 검색 API
export async function searchKeyword(query: string, limit: number = 20): Promise<SearchKeywordResult[]> {
  const url = `${DATA_REPORT_API_BASE_URL}/data-report/search-keyword?keyword=${encodeURIComponent(query)}&limit=${limit}`;
  
  if (import.meta.env.DEV) {
    console.log('키워드 검색 API 호출:', url);
  }
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`키워드 검색 API 호출 실패: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('키워드 검색 API 호출 중 에러:', error);
    }
    throw error;
  }
}
