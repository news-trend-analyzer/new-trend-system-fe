import { KeywordRanking, SearchSuggestion, SearchResult, SearchResultResponse } from '@/types';

// 개발 환경에서는 프록시를 통해 /api로 시작하는 경로 사용
// 프로덕션에서는 환경변수나 직접 URL 사용
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 
  (import.meta.env.DEV ? '/api' : 'http://localhost:3002');

// 검색 API는 별도 URL 사용
const SEARCH_API_BASE_URL = import.meta.env.VITE_SEARCH_API_BASE_URL || 
  (import.meta.env.DEV ? '/search-api' : 'http://localhost:3001');

export async function fetchKeywordRanking(): Promise<KeywordRanking[]> {
  const url = `${API_BASE_URL}/trend/top`;
  
  if (import.meta.env.DEV) {
    console.log('API 호출:', url);
    console.log('API_BASE_URL:', API_BASE_URL);
  }
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
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
      headers: {
        'Content-Type': 'application/json',
      },
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

  const url = `${SEARCH_API_BASE_URL}/articles/search?query=${encodeURIComponent(query.trim())}&page=${page}&pageSize=${pageSize}`;
  
  if (import.meta.env.DEV) {
    console.log('검색 결과 API 호출:', url);
  }
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
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
        pageSize: data.pageSize || pageSize,
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

