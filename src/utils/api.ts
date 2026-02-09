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

// Admin API Key (환경 변수에서 읽어옴, 트렌드 API에만 사용)
const ADMIN_API_KEY = import.meta.env.VITE_ADMIN_API_KEY || '';

// 트렌드 API용 헤더 (Admin API Key 포함)
function getTrendApiHeaders(): HeadersInit {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  // Admin API Key가 설정되어 있으면 헤더에 추가
  if (ADMIN_API_KEY) {
    headers['X-API-Key'] = ADMIN_API_KEY;
  }
  
  return headers;
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

// 데이터 리포트 API 타입 정의
export interface DataReportRanking {
  id: string;
  normalizedText: string;
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