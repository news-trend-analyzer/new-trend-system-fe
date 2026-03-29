export type Category = '전체' | '기술' | '엔터' | '스포츠' | '정치' | '경제' | '사회' | '문화';

export interface Article {
  id: number;
  thumbnail: string;
  title: string;
  summary: string;
  source: string;
  date: string;
}

export interface TrendItem {
  id: string | number; // 백엔드 키워드 ID
  trendType?: 'daily' | 'realtime';
  rank: number;
  keyword: string;
  originalKeyword?: string; // API에서 받은 원래 키워드 (검색용)
  category: Category;
  description: string;
  status: 'up' | 'down' | 'same';
  trendData: number[];
  articles: Article[];
}

export interface KeywordRanking {
  id?: string;
  rank?: number;
  keyword?: string;
  query?: string;
  name?: string;
  type: 'COMPOSITE' | 'SINGLE' | string;
  status: 'new' | 'up' | 'down' | 'same';
  rankChange: number;
  score: number;        // 전체 점수
  score24h: number;     // 최근 24시간 점수
  scoreRecent: number;  // 가장 최근 구간 점수
  scorePrev: number;    // 직전 구간 점수
  diffScore: number;    // scoreRecent - scorePrev 등의 변화량
  /** 실시간 랭킹 등 API가 내려주는 최종 점수 */
  finalScore?: number;
  /** 일부 API는 snake_case로 전달 */
  final_score?: number;
  articles?: string[];
}

export interface SearchSuggestion {
  keyword: string;
  count?: number;
}

export interface SearchResult {
  id: string;
  title: string;
  link: string;
  press: string;
  pubDate: string;
  description?: string;
  category?: string;
}

export interface SearchResultResponse {
  total: number;
  items: SearchResult[];
  page?: number;
  pageSize?: number;
}