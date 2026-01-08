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
  id: number;
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
  keyword: string;
  totalScore: number;
  recentScore: number;
  trendScore: number;
  rank: number;
  rankChange?: number;
  status: 'up' | 'down' | 'same';
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

