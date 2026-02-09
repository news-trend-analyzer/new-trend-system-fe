import { useState, useEffect, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import Footer from '@/components/layout/Footer';
import ScrollToTopButton from '@/components/layout/ScrollToTopButton';
import { 
  fetchDataReportRanking, 
  fetchTimeSeries, 
  fetchRelatedArticles, 
  fetchRelatedKeywords,
  searchKeyword,
  DataReportRanking,
  TimeSeriesData,
  RelatedArticle,
  RelatedKeyword,
  SearchKeywordResult
} from '@/utils/api';

// 타입 정의
interface AnalysisFactor {
  type: 'trigger' | 'amplifier' | 'sustainer' | 'related';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  evidence?: string[];
}

interface KeywordAnalysis {
  summary: string; // 요약 분석
  factors: AnalysisFactor[]; // 영향 요인들
  trendPattern: {
    pattern: 'sudden_spike' | 'gradual_rise' | 'sustained' | 'fluctuating';
    description: string;
    peakTime?: string;
  };
  expectedDuration?: {
    level: 'short' | 'medium' | 'long';
    description: string;
  };
  relatedIssues?: string[]; // 관련 이슈들
}

interface KeywordData {
  id?: string; // API에서 받은 키워드 ID
  rank: number;
  keyword: string;
  score: number;
  change: number;
  status: 'up' | 'down' | 'same';
  trendData: number[];
  timeSeriesData?: TimeSeriesData[]; // 시계열 데이터 (시간 정보 포함)
  relatedKeywords?: string[];
  articles?: Article[];
  analysis?: KeywordAnalysis; // 체계적인 키워드 분석
}

interface Article {
  title: string;
  source: string;
  weight: number;
  url?: string;
}

interface SearchSuggestion {
  keyword: string;
  id?: string;
}

// 목 데이터
const mockKeywords: KeywordData[] = [
  {
    rank: 1,
    keyword: '한덕수',
    score: 1240,
    change: 21,
    status: 'up',
    trendData: [820, 920, 1050, 1180, 1240],
    relatedKeywords: ['총리', '선고', '구속', '대법원', '정치', '공판', '검찰'],
    analysis: {
      summary: '한덕수 총리의 실형 선고로 인해 정치권과 언론의 집중적인 관심이 쏠리고 있습니다. 대법원의 최종 판결이 주요 트리거가 되었으며, 총리직 유지 여부에 대한 논란과 정국 전반의 영향이 검색량 급증의 주요 원인입니다.',
      factors: [
        {
          type: 'trigger',
          title: '대법원 실형 선고',
          description: '대법원이 한덕수 총리에게 징역 2년을 확정하면서 정치권과 언론의 집중 조명이 시작되었습니다.',
          impact: 'high',
          evidence: ['대법원 판결 보도', '총리직 유지 논란', '정치권 반응']
        },
        {
          type: 'amplifier',
          title: '언론 집중 보도',
          description: '주요 언론사들이 연일 1면으로 다루며 이슈가 확산되었습니다.',
          impact: 'high',
          evidence: ['조선일보 1면', '연합뉴스 속보', 'MBC 특집 보도']
        },
        {
          type: 'sustainer',
          title: '정국 영향 우려',
          description: '총리직 유지 여부와 정국 전반에 미치는 영향에 대한 지속적인 논의가 이어지고 있습니다.',
          impact: 'medium',
          evidence: ['야당 반응', '여당 입장', '정치권 분석']
        },
        {
          type: 'related',
          title: '관련 사건 연쇄',
          description: '실형, 구속, 공판 등 관련 키워드와 함께 검색량이 증가하고 있습니다.',
          impact: 'medium',
          evidence: ['실형 키워드 상승', '구속 수감 보도', '공판 일정']
        }
      ],
      trendPattern: {
        pattern: 'sudden_spike',
        description: '대법원 판결 직후 급격한 상승세를 보이며, 이후 지속적인 관심이 이어지고 있습니다.',
        peakTime: '판결 직후 2시간'
      },
      expectedDuration: {
        level: 'medium',
        description: '총리직 유지 여부 결정과 정치권 반응에 따라 1-2주간 지속될 것으로 예상됩니다.'
      },
      relatedIssues: ['총리직 사퇴 논란', '정국 혼란', '법원 판결 영향', '정치권 대응']
    },
    articles: [
      { title: '한덕수 총리 실형 선고... 정국 혼란 가중', source: '조선일보', weight: 15 },
      { title: '대법원, 한덕수 총리 징역 2년 확정', source: '연합뉴스', weight: 14 },
      { title: '한덕수 실형에 야당 "당연한 결과"', source: '한겨레', weight: 14 },
      { title: '여당, 한덕수 판결에 강력 반발', source: '중앙일보', weight: 13 },
      { title: '한덕수 총리 구속 수감... 향후 전망은?', source: 'MBC', weight: 12 },
    ]
  },
  {
    rank: 2,
    keyword: '실형',
    score: 1180,
    change: 18,
    status: 'up',
    trendData: [750, 880, 990, 1100, 1180],
    relatedKeywords: ['선고', '판결', '법원', '징역'],
    analysis: {
      summary: '한덕수 총리 사건과 연관되어 "실형"이라는 법률 용어에 대한 관심이 높아졌습니다. 고위 공직자의 실형 선고에 대한 사회적 논의가 확산되고 있습니다.',
      factors: [
        {
          type: 'trigger',
          title: '한덕수 총리 실형 선고',
          description: '총리급 고위 공직자의 실형 선고가 주요 트리거가 되었습니다.',
          impact: 'high',
          evidence: ['대법원 판결', '총리 실형 보도']
        },
        {
          type: 'amplifier',
          title: '법률 용어 관심',
          description: '일반인들에게 생소한 "실형" 용어에 대한 설명과 이해가 확산되었습니다.',
          impact: 'medium',
          evidence: ['법률 용어 설명 기사', '실형 vs 집행유예 비교']
        }
      ],
      trendPattern: {
        pattern: 'gradual_rise',
        description: '주요 사건과 연계되어 점진적으로 관심이 증가하고 있습니다.'
      },
      expectedDuration: {
        level: 'short',
        description: '관련 사건의 진행 상황에 따라 수일간 지속될 것으로 예상됩니다.'
      },
      relatedIssues: ['법률 용어 이해', '고위 공직자 처벌', '사법 판결']
    },
    articles: [
      { title: '실형 선고 받은 고위 공직자들', source: 'KBS', weight: 13 },
      { title: '실형 확정 후 수감 절차는?', source: 'SBS', weight: 12 },
    ]
  },
  {
    rank: 3,
    keyword: '총리',
    score: 1022,
    change: -2,
    status: 'down',
    trendData: [1100, 1080, 1050, 1040, 1022],
    relatedKeywords: ['정부', '국무총리', '행정부'],
    articles: []
  },
  {
    rank: 4,
    keyword: '별세',
    score: 980,
    change: 33,
    status: 'up',
    trendData: [620, 720, 820, 920, 980],
    relatedKeywords: ['부고', '조문', '장례'],
    articles: []
  },
  {
    rank: 5,
    keyword: '신년회',
    score: 845,
    change: 5,
    status: 'up',
    trendData: [780, 790, 810, 830, 845],
    relatedKeywords: ['행사', '모임', '신년'],
    articles: []
  },
];

const mockSuggestions: SearchSuggestion[] = [
  { keyword: '한덕수' },
  { keyword: '한덕수 실형' },
  { keyword: '한덕수 총리' },
  { keyword: '실형' },
];

export default function DataReportTab() {
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedKeyword, setSelectedKeyword] = useState<KeywordData | null>(null);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const searchRef = useRef<HTMLDivElement>(null);
  
  // API 데이터 상태
  const [keywords, setKeywords] = useState<KeywordData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [searchNotFound, setSearchNotFound] = useState(false);
  const [similarKeywords, setSimilarKeywords] = useState<KeywordData[]>([]);

  // 랭킹 데이터 가져오기
  useEffect(() => {
    const loadRanking = async () => {
      setLoading(true);
      setError(null);
      try {
        const rankingData = await fetchDataReportRanking();
        
        // API 응답을 KeywordData 형태로 변환
        const convertedKeywords: KeywordData[] = await Promise.all(
          rankingData.map(async (item, index) => {
            // 시계열 데이터 가져오기
            let trendData: number[] = [];
            let timeSeriesData: TimeSeriesData[] = [];
            try {
              const timeSeries = await fetchTimeSeries(item.id, 20);
              timeSeriesData = timeSeries.reverse(); // 시간 순서대로 정렬
              trendData = timeSeriesData.map(ts => ts.scoreSum);
            } catch (err) {
              console.error('시계열 데이터 로드 실패:', err);
              trendData = [0, 0, 0, 0, 0]; // 기본값
            }
            
            // 점수 변화 계산 (보수적: 최근 평균과 비교)
            const score = item.scoreSum;
            let change = 0;
            
            if (trendData.length > 1) {
              // 최근 3개 시점의 평균값 계산 (더 보수적)
              const recentCount = Math.min(3, trendData.length - 1);
              const recentScores = trendData.slice(-recentCount - 1, -1); // 마지막 제외한 최근 N개
              const avgRecentScore = recentScores.reduce((sum, val) => sum + val, 0) / recentScores.length;
              
              // 평균값과 현재값 비교
              if (avgRecentScore > 0) {
                change = Math.round(((score - avgRecentScore) / avgRecentScore) * 100);
              }
            }
            
            return {
              rank: index + 1,
              keyword: item.normalizedText,
              id: item.id,
              score: score,
              change: change,
              status: change > 0 ? 'up' as const : change < 0 ? 'down' as const : 'same' as const,
              trendData: trendData.length > 0 ? trendData : [score],
              timeSeriesData: timeSeriesData.length > 0 ? timeSeriesData : undefined,
              relatedKeywords: [],
              articles: [],
            };
          })
        );
        
        setKeywords(convertedKeywords);
        setLastUpdated(new Date());
      } catch (err) {
        console.error('랭킹 데이터 로드 실패:', err);
        setError(err instanceof Error ? err : new Error('데이터를 불러올 수 없습니다'));
      } finally {
        setLoading(false);
      }
    };
    
    loadRanking();
  }, []);

  // 검색 자동완성 (타이핑 시 API 호출)
  useEffect(() => {
    if (searchQuery.trim().length === 0) {
      setSuggestions([]);
      setShowSuggestions(false);
      setLoading(false);
      return;
    }

    // 최소 1글자 이상 입력해야 검색
    if (searchQuery.trim().length < 1) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    // 먼저 로컬 랭킹에서 확인
    const localMatches = keywords
      .filter(k => k.keyword.toLowerCase().includes(searchQuery.toLowerCase()))
      .map(k => ({ keyword: k.keyword }));
    
    if (localMatches.length > 0) {
      setSuggestions(localMatches);
      setShowSuggestions(true);
    }

    // 디바운싱을 통한 API 호출
    const timeoutId = setTimeout(async () => {
      setLoading(true);
      try {
        const searchResults = await searchKeyword(searchQuery.trim());
        if (searchResults && searchResults.length > 0) {
          // API 결과를 자동완성 형태로 변환
          const apiSuggestions = searchResults.map(result => ({
            keyword: result.normalizedText,
            id: result.id,
          }));
          setSuggestions(apiSuggestions);
          setShowSuggestions(true);
        } else if (localMatches.length === 0) {
          setSuggestions([]);
          setShowSuggestions(false);
        }
      } catch (error) {
        if (import.meta.env.DEV) {
          console.error('검색 에러:', error);
        }
        // 에러 시 로컬 매칭 결과라도 표시
        if (localMatches.length > 0) {
          setSuggestions(localMatches);
          setShowSuggestions(true);
        } else {
          setSuggestions([]);
          setShowSuggestions(false);
        }
      } finally {
        setLoading(false);
      }
    }, 300); // 300ms 디바운싱

    return () => clearTimeout(timeoutId);
  }, [searchQuery, keywords]);

  // 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 키워드 선택 및 상세 데이터 로드
  const handleKeywordSelect = async (keywordData: KeywordData, fromTopKeywords: boolean = false) => {
    if (!keywordData.id) {
      setSelectedKeyword(keywordData);
      return;
    }
    
    // top keywords에서 선택한 경우 검색어 초기화
    if (fromTopKeywords) {
      setSearchQuery('');
      setSearchNotFound(false);
      setSimilarKeywords([]);
      // top keywords 선택 시에는 로딩 표시 없이 바로 표시하고 백그라운드에서 데이터 로드
      setSelectedKeyword(keywordData);
      
      // 백그라운드에서 상세 데이터 로드
      Promise.all([
        fetchRelatedArticles(keywordData.id).catch(() => []),
        fetchRelatedKeywords(keywordData.id).catch(() => []),
        fetchTimeSeries(keywordData.id, 20).catch(() => []),
      ]).then(([articles, relatedKeywords, timeSeries]) => {
        const updatedTimeSeries = timeSeries.length > 0 
          ? timeSeries.reverse()
          : keywordData.timeSeriesData;
        const updatedTrendData = updatedTimeSeries && updatedTimeSeries.length > 0
          ? updatedTimeSeries.map(ts => ts.scoreSum)
          : keywordData.trendData;
        
        const relatedKeywordsList = relatedKeywords.map(rk => rk.normalizedText);
        const articlesList: Article[] = articles.map(article => ({
          title: article.title,
          source: article.publisher,
          weight: article.weight,
          url: article.url,
        }));
        
        setSelectedKeyword({
          ...keywordData,
          trendData: updatedTrendData,
          timeSeriesData: updatedTimeSeries,
          relatedKeywords: relatedKeywordsList,
          articles: articlesList,
        });
      }).catch(err => {
        console.error('키워드 상세 데이터 로드 실패:', err);
      });
      
      return;
    }
    
    // 검색으로 선택한 경우에는 로딩 표시
    setLoading(true);
    try {
      // 관련 기사, 관련 키워드, 시계열 데이터 병렬로 가져오기
      const [articles, relatedKeywords, timeSeries] = await Promise.all([
        fetchRelatedArticles(keywordData.id).catch(() => []),
        fetchRelatedKeywords(keywordData.id).catch(() => []),
        fetchTimeSeries(keywordData.id, 20).catch(() => []),
      ]);
      
      // 시계열 데이터 업데이트
      const updatedTimeSeries = timeSeries.length > 0 
        ? timeSeries.reverse() // 시간 순서대로 정렬
        : keywordData.timeSeriesData;
      const updatedTrendData = updatedTimeSeries && updatedTimeSeries.length > 0
        ? updatedTimeSeries.map(ts => ts.scoreSum)
        : keywordData.trendData;
      
      // 관련 키워드 변환
      const relatedKeywordsList = relatedKeywords.map(rk => rk.normalizedText);
      
      // 관련 기사 변환
      const articlesList: Article[] = articles.map(article => ({
        title: article.title,
        source: article.publisher,
        weight: article.weight,
        url: article.url,
      }));
      
      setSelectedKeyword({
        ...keywordData,
        trendData: updatedTrendData,
        timeSeriesData: updatedTimeSeries,
        relatedKeywords: relatedKeywordsList,
        articles: articlesList,
      });
    } catch (err) {
      console.error('키워드 상세 데이터 로드 실패:', err);
      setSelectedKeyword(keywordData); // 기본 데이터라도 표시
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (keyword: string) => {
    // 먼저 로컬 랭킹에서 확인
    const found = keywords.find(k => k.keyword.toLowerCase() === keyword.toLowerCase());
    if (found) {
      handleKeywordSelect(found);
      setSearchQuery(keyword);
      setShowSuggestions(false);
      setSearchNotFound(false);
      setSimilarKeywords([]);
      return;
    }
    
    // 랭킹에 없으면 검색 API 호출
    setLoading(true);
    setSearchQuery(keyword);
    setShowSuggestions(false);
    
    try {
      const searchResults = await searchKeyword(keyword);
      
      // 검색 결과가 있는 경우
      if (searchResults && searchResults.length > 0) {
        // 첫 번째 결과를 선택 (정확히 일치하는 키워드)
        const firstResult = searchResults[0];
        
        // 시계열, 관련 기사, 관련 키워드 가져오기 (검색 시에는 limit=20)
        const [articles, relatedKeywords, timeSeries] = await Promise.all([
          fetchRelatedArticles(firstResult.id).catch(() => []),
          fetchRelatedKeywords(firstResult.id).catch(() => []),
          fetchTimeSeries(firstResult.id, 20).catch(() => []),
        ]);
        
        const timeSeriesReversed = timeSeries.reverse(); // 시간 순서대로 정렬
        const trendData = timeSeriesReversed.map((ts: TimeSeriesData) => ts.scoreSum);
        
        // 점수 계산 (시계열 데이터의 마지막 값 사용)
        const score = trendData.length > 0 ? trendData[trendData.length - 1] : 0;
        
        // 변화율 계산
        let change = 0;
        if (trendData.length > 1) {
          const recentCount = Math.min(3, trendData.length - 1);
          const recentScores = trendData.slice(-recentCount - 1, -1);
          const avgRecentScore = recentScores.reduce((sum, val) => sum + val, 0) / recentScores.length;
          if (avgRecentScore > 0) {
            change = Math.round(((score - avgRecentScore) / avgRecentScore) * 100);
          }
        }
        
        const keywordData: KeywordData = {
          id: firstResult.id,
          rank: 0, // 검색 결과는 랭킹에 없을 수 있음
          keyword: firstResult.normalizedText,
          score: score,
          change: change,
          status: change > 0 ? 'up' as const : change < 0 ? 'down' as const : 'same' as const,
          trendData: trendData.length > 0 ? trendData : [score],
          timeSeriesData: timeSeriesReversed.length > 0 ? timeSeriesReversed : undefined,
          relatedKeywords: relatedKeywords.map(rk => rk.normalizedText),
          articles: articles.map(article => ({
            title: article.title,
            source: article.publisher,
            weight: article.weight,
            url: article.url,
          })),
        };
        
        setSelectedKeyword(keywordData);
        setSearchNotFound(false);
        
        // 여러 결과가 있으면 나머지를 유사 검색어로 표시
        if (searchResults.length > 1) {
          const similarData: KeywordData[] = await Promise.all(
            searchResults.slice(1).map(async (result) => {
            let trendData: number[] = [];
            let timeSeriesData: TimeSeriesData[] = [];
            try {
              const ts = await fetchTimeSeries(result.id, 20);
              timeSeriesData = ts.reverse(); // 시간 순서대로 정렬
              trendData = timeSeriesData.map(t => t.scoreSum);
            } catch (err) {
              trendData = [0];
            }
              
            return {
              id: result.id,
              rank: 0,
              keyword: result.normalizedText,
              score: trendData.length > 0 ? trendData[trendData.length - 1] : 0,
              change: 0,
              status: 'same' as const,
              trendData: trendData.length > 0 ? trendData : [0],
              timeSeriesData: timeSeriesData.length > 0 ? timeSeriesData : undefined,
              relatedKeywords: [],
              articles: [],
            };
            })
          );
          setSimilarKeywords(similarData);
        } else {
          setSimilarKeywords([]);
        }
      } 
      // 검색 결과가 없는 경우
      else {
        setSearchNotFound(true);
        setSimilarKeywords([]);
        setSelectedKeyword(null);
      }
    } catch (error) {
      console.error('키워드 검색 실패:', error);
      setSearchNotFound(true);
      setSimilarKeywords([]);
      setSelectedKeyword(null);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const rankingData = await fetchDataReportRanking();
      
      const convertedKeywords: KeywordData[] = await Promise.all(
        rankingData.map(async (item, index) => {
          let trendData: number[] = [];
          let timeSeriesData: TimeSeriesData[] = [];
          try {
            const timeSeries = await fetchTimeSeries(item.id, 20);
            timeSeriesData = timeSeries.reverse(); // 시간 순서대로 정렬
            trendData = timeSeriesData.map(ts => ts.scoreSum);
          } catch (err) {
            trendData = [0, 0, 0, 0, 0];
          }
          
          const score = item.scoreSum;
          let change = 0;
          
          if (trendData.length > 1) {
            // 최근 3개 시점의 평균값 계산 (더 보수적)
            const recentCount = Math.min(3, trendData.length - 1);
            const recentScores = trendData.slice(-recentCount - 1, -1); // 마지막 제외한 최근 N개
            const avgRecentScore = recentScores.reduce((sum, val) => sum + val, 0) / recentScores.length;
            
            // 평균값과 현재값 비교
            if (avgRecentScore > 0) {
              change = Math.round(((score - avgRecentScore) / avgRecentScore) * 100);
            }
          }
          
          return {
            rank: index + 1,
            keyword: item.normalizedText,
            id: item.id,
            score: score,
            change: change,
            status: change > 0 ? 'up' as const : change < 0 ? 'down' as const : 'same' as const,
            trendData: trendData.length > 0 ? trendData : [score],
            timeSeriesData: timeSeriesData.length > 0 ? timeSeriesData : undefined,
            relatedKeywords: [],
            articles: [],
          };
        })
      );
      
      setKeywords(convertedKeywords);
      setLastUpdated(new Date());
      
      // 현재 선택된 키워드가 있으면 업데이트
      if (selectedKeyword?.id) {
        const updated = convertedKeywords.find(k => k.id === selectedKeyword.id);
        if (updated) {
          handleKeywordSelect(updated);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('데이터를 불러올 수 없습니다'));
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
  };

  // 차트 데이터 변환
  const getChartData = (keyword: KeywordData) => {
    if (keyword.timeSeriesData && keyword.timeSeriesData.length > 0) {
      // 시간 정보가 있으면 실제 시간 사용
      return keyword.timeSeriesData.map((ts) => {
        const date = new Date(ts.bucketTime);
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        return {
          time: `${hours}:${minutes}`,
          score: ts.scoreSum
        };
      });
    } else {
      // 시간 정보가 없으면 기본 형식
      return keyword.trendData.map((score, idx) => ({
        time: `T-${keyword.trendData.length - idx - 1}`,
        score
      }));
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* 헤더 */}
      <div className="bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
              <i className="ri-bar-chart-box-line text-teal-500"></i>
              데이터 리포트
            </h1>
            
            <div className="flex flex-wrap items-center gap-3">
              {/* 검색창 */}
              <div ref={searchRef} className="relative flex-1 md:flex-none md:w-96">
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => {
                      if (suggestions.length > 0) setShowSuggestions(true);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (searchQuery.trim()) {
                          handleSearch(searchQuery.trim());
                        }
                      }
                    }}
                    placeholder="궁금한 키워드를 검색해보세요"
                    className="w-full px-6 py-4 rounded-2xl border-none shadow-xl shadow-slate-200/50 ring-1 ring-slate-200 focus:ring-2 focus:ring-teal-500 outline-none text-lg transition-all"
                  />
                  <button 
                    onClick={() => {
                      if (searchQuery.trim()) {
                        handleSearch(searchQuery.trim());
                      }
                    }}
                    className="absolute right-3 top-2.5 bg-teal-500 hover:bg-teal-600 text-white p-2 px-5 rounded-xl transition-all"
                  >
                    <i className="ri-search-line"></i>
                  </button>
                </div>
                
                {/* 자동완성 드롭다운 */}
                {(showSuggestions || loading) && searchQuery.trim().length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-slate-200 max-h-80 overflow-y-auto z-50">
                    {loading ? (
                      <div className="p-4 text-center text-slate-500">
                        <div className="inline-block animate-spin rounded-full h-5 w-5 border-2 border-teal-500 border-t-transparent"></div>
                        <span className="ml-2">검색 중...</span>
                      </div>
                    ) : suggestions.length > 0 ? (
                      suggestions.map((suggestion, idx) => (
                        <button
                          key={suggestion.id || idx}
                          onClick={() => handleSearch(suggestion.keyword)}
                          className={`w-full text-left px-6 py-3 hover:bg-teal-50 transition-colors flex items-center gap-3 ${
                            idx === 0 ? 'rounded-t-2xl' : ''
                          } ${
                            idx === suggestions.length - 1 ? 'rounded-b-2xl' : ''
                          }`}
                        >
                          <i className="ri-search-line text-slate-400"></i>
                          <span className="flex-1 text-slate-700">{suggestion.keyword}</span>
                        </button>
                      ))
                    ) : (
                      <div className="p-4 text-center text-slate-500 text-sm">
                        검색 결과가 없습니다.
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* 새로고침 버튼 */}
              <button
                onClick={handleRefresh}
                className="px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-xl font-medium transition-all flex items-center gap-2"
              >
                <i className="ri-refresh-line"></i>
                <span className="hidden sm:inline">새로고침</span>
              </button>
            </div>
          </div>
          
          {/* 마지막 업데이트 시간 */}
          <p className="text-sm text-slate-500 mt-2">
            최종 업데이트: {formatTime(lastUpdated)}
          </p>
        </div>
      </div>

      {/* 메인 컨텐츠 */}
      <div className="max-w-7xl mx-auto px-4 py-6 flex-1 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* 왼쪽: Top Keywords */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <h2 className="text-xl font-bold text-slate-900 mb-2 flex items-center gap-2">
                <i className="ri-fire-fill text-rose-500"></i>
                Top Keywords
              </h2>
              <p className="text-sm text-slate-500 mb-6">최근 1시간 데이터 기반으로 분석됩니다.</p>
              
              <div className="space-y-4">
                {loading && keywords.length === 0 ? (
                  <div className="flex items-center justify-center py-20">
                    <div className="text-center">
                      <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-teal-500 border-t-transparent mb-4"></div>
                      <p className="text-slate-600">키워드 랭킹을 불러오는 중...</p>
                    </div>
                  </div>
                ) : error ? (
                  <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6">
                    <div className="flex items-start gap-3">
                      <i className="ri-error-warning-line text-rose-500 text-2xl mt-0.5"></i>
                      <div className="flex-1">
                        <h3 className="font-bold text-rose-800 mb-1">데이터를 불러올 수 없습니다</h3>
                        <p className="text-rose-700 text-sm">{error.message}</p>
                      </div>
                    </div>
                  </div>
                ) : keywords.length === 0 ? (
                  <div className="text-center py-20">
                    <p className="text-slate-500">데이터가 없습니다.</p>
                  </div>
                ) : (
                  keywords.map((keyword, idx) => (
                    <button
                      key={keyword.id || keyword.rank}
                      onClick={() => handleKeywordSelect(keyword, true)}
                    className={`group w-full text-left p-5 rounded-2xl border transition-all flex items-center gap-6 ${
                      selectedKeyword?.rank === keyword.rank
                        ? 'bg-teal-50 border-teal-300 shadow-md'
                        : 'bg-white border-slate-100 shadow-sm hover:shadow-xl hover:border-teal-100'
                    }`}
                  >
                    <div className={`text-3xl font-black italic transition-colors w-12 ${
                      selectedKeyword?.rank === keyword.rank
                        ? 'text-teal-500/30'
                        : 'text-slate-200 group-hover:text-teal-500/20'
                    }`}>
                      #{keyword.rank}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1 flex-wrap">
                        <h3 className="text-lg font-bold group-hover:text-teal-600 line-clamp-1">
                          {keyword.keyword}
                        </h3>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className={`text-xs font-semibold flex items-center gap-1 px-2 py-0.5 rounded-full ${
                            keyword.status === 'up' ? 'bg-rose-50 text-rose-600' : 
                            keyword.status === 'down' ? 'bg-blue-50 text-blue-600' : 
                            'bg-slate-50 text-slate-600'
                          }`}>
                            {keyword.status === 'up' && <i className="ri-arrow-up-s-fill text-sm"></i>}
                            {keyword.status === 'down' && <i className="ri-arrow-down-s-fill text-sm"></i>}
                            {keyword.status === 'same' && <div className="h-[2px] w-3 bg-slate-400 rounded"></div>}
                            <span className="text-xs font-semibold">
                              {keyword.change > 0 ? '+' : ''}{keyword.change}%
                            </span>
                          </span>
                        </div>
                      </div>
                      <p className="text-slate-500 text-sm">Score: {keyword.score.toLocaleString()}</p>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="hidden sm:block">
                        <svg width="80" height="30" className="text-teal-500 stroke-current fill-none">
                          <polyline
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            points={(() => {
                              if (keyword.trendData.length === 0) return '';
                              const max = Math.max(...keyword.trendData);
                              const min = Math.min(...keyword.trendData);
                              const range = max - min || 1;
                              return keyword.trendData.map((val, i) => {
                                const x = (i / (keyword.trendData.length - 1 || 1)) * 80;
                                const y = 30 - ((val - min) / range) * 25;
                                return `${x},${y}`;
                              }).join(' ');
                            })()}
                          />
                        </svg>
                      </div>
                      <div className="w-12 text-center">
                        {keyword.status === 'up' && <i className="ri-arrow-up-s-fill text-rose-500 text-2xl"></i>}
                        {keyword.status === 'down' && <i className="ri-arrow-down-s-fill text-blue-500 text-2xl"></i>}
                        {keyword.status === 'same' && <div className="h-[2px] w-4 bg-slate-300 mx-auto rounded"></div>}
                      </div>
                    </div>
                  </button>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* 오른쪽: Keyword Detail */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              {selectedKeyword ? (
                <div>
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h2 className="text-3xl font-bold text-slate-900 mb-2">
                        #{selectedKeyword.keyword}
                      </h2>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-slate-600">
                          Score: <span className="font-bold text-teal-600">{selectedKeyword.score.toLocaleString()}</span>
                        </span>
                        <span className="text-slate-600">
                          Rank: <span className="font-bold text-slate-900">#{selectedKeyword.rank}</span>
                        </span>
                      </div>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      selectedKeyword.status === 'up' ? 'bg-rose-50 text-rose-600' :
                      selectedKeyword.status === 'down' ? 'bg-blue-50 text-blue-600' :
                      'bg-slate-50 text-slate-600'
                    }`}>
                      {selectedKeyword.change > 0 ? '+' : ''}{selectedKeyword.change}%
                    </div>
                  </div>
                  <p className="text-sm text-slate-500 mb-6">키워드 리포트는 최근 24시간 데이터 기반으로 분석됩니다.</p>

                  {/* 키워드 분석 */}
                  {selectedKeyword.analysis && (
                    <div className="mb-6">
                      <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                        <i className="ri-bar-chart-box-line text-teal-500"></i>
                        키워드 분석
                      </h3>
                      
                      {/* 요약 분석 */}
                      <div className="bg-gradient-to-r from-teal-50 to-blue-50 border border-teal-100 rounded-xl p-5 mb-4">
                        <div className="flex items-start gap-3">
                          <i className="ri-file-list-3-line text-teal-600 text-xl mt-0.5"></i>
                          <div className="flex-1">
                            <h4 className="font-semibold text-slate-900 mb-2">요약 분석</h4>
                            <p className="text-slate-700 leading-relaxed">
                              {selectedKeyword.analysis.summary}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* 영향 요인 */}
                      <div className="mb-4">
                        <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                          <i className="ri-stack-line text-teal-500"></i>
                          영향 요인
                        </h4>
                        <div className="space-y-3">
                          {selectedKeyword.analysis.factors.map((factor, idx) => {
                            const typeIcons = {
                              trigger: 'ri-flashlight-line',
                              amplifier: 'ri-volume-up-line',
                              sustainer: 'ri-time-line',
                              related: 'ri-links-line'
                            };
                            const typeLabels = {
                              trigger: '트리거',
                              amplifier: '증폭 요인',
                              sustainer: '지속 요인',
                              related: '관련 이슈'
                            };
                            const impactColors = {
                              high: 'bg-rose-100 text-rose-700',
                              medium: 'bg-yellow-100 text-yellow-700',
                              low: 'bg-blue-100 text-blue-700'
                            };
                            const impactLabels = {
                              high: '높음',
                              medium: '보통',
                              low: '낮음'
                            };
                            
                            return (
                              <div key={idx} className="bg-white border border-slate-200 rounded-xl p-4 hover:border-teal-200 transition-colors">
                                <div className="flex items-start justify-between gap-3 mb-2">
                                  <div className="flex items-center gap-2 flex-1">
                                    <i className={`${typeIcons[factor.type]} text-teal-500`}></i>
                                    <span className="text-xs font-semibold px-2 py-0.5 bg-slate-100 text-slate-600 rounded">
                                      {typeLabels[factor.type]}
                                    </span>
                                    <h5 className="font-semibold text-slate-900">{factor.title}</h5>
                                  </div>
                                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${impactColors[factor.impact]}`}>
                                    영향도: {impactLabels[factor.impact]}
                                  </span>
                                </div>
                                <p className="text-sm text-slate-600 mb-2">{factor.description}</p>
                                {factor.evidence && factor.evidence.length > 0 && (
                                  <div className="mt-2 pt-2 border-t border-slate-100">
                                    <p className="text-xs text-slate-500 mb-1">근거:</p>
                                    <div className="flex flex-wrap gap-1">
                                      {factor.evidence.map((evidence, eIdx) => (
                                        <span key={eIdx} className="text-xs px-2 py-0.5 bg-slate-50 text-slate-600 rounded">
                                          {evidence}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* 트렌드 패턴 */}
                      {selectedKeyword.analysis.trendPattern && (
                        <div className="mb-4">
                          <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                            <i className="ri-line-chart-line text-teal-500"></i>
                            트렌드 패턴
                          </h4>
                          <div className="bg-white border border-slate-200 rounded-xl p-4">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-xs font-semibold px-2 py-0.5 bg-teal-100 text-teal-700 rounded">
                                {selectedKeyword.analysis.trendPattern.pattern === 'sudden_spike' ? '급등' :
                                 selectedKeyword.analysis.trendPattern.pattern === 'gradual_rise' ? '점진적 상승' :
                                 selectedKeyword.analysis.trendPattern.pattern === 'sustained' ? '지속' : '변동'}
                              </span>
                              {selectedKeyword.analysis.trendPattern.peakTime && (
                                <span className="text-xs text-slate-500">
                                  피크 시점: {selectedKeyword.analysis.trendPattern.peakTime}
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-slate-600">{selectedKeyword.analysis.trendPattern.description}</p>
                          </div>
                        </div>
                      )}

                      {/* 예상 지속 기간 */}
                      {selectedKeyword.analysis.expectedDuration && (
                        <div className="mb-4">
                          <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                            <i className="ri-calendar-line text-teal-500"></i>
                            예상 지속 기간
                          </h4>
                          <div className="bg-white border border-slate-200 rounded-xl p-4">
                            <div className="flex items-center gap-2 mb-2">
                              <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
                                selectedKeyword.analysis.expectedDuration.level === 'short' ? 'bg-blue-100 text-blue-700' :
                                selectedKeyword.analysis.expectedDuration.level === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-rose-100 text-rose-700'
                              }`}>
                                {selectedKeyword.analysis.expectedDuration.level === 'short' ? '단기' :
                                 selectedKeyword.analysis.expectedDuration.level === 'medium' ? '중기' : '장기'}
                              </span>
                            </div>
                            <p className="text-sm text-slate-600">{selectedKeyword.analysis.expectedDuration.description}</p>
                          </div>
                        </div>
                      )}

                      {/* 관련 이슈 */}
                      {selectedKeyword.analysis.relatedIssues && selectedKeyword.analysis.relatedIssues.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                            <i className="ri-links-line text-teal-500"></i>
                            관련 이슈
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {selectedKeyword.analysis.relatedIssues.map((issue, idx) => (
                              <span key={idx} className="px-3 py-1.5 bg-slate-100 hover:bg-teal-100 text-slate-700 hover:text-teal-700 rounded-full text-sm font-medium transition-colors">
                                {issue}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* 트렌드 타임라인 */}
                  <div className="mb-6">
                    <h3 className="text-lg font-bold text-slate-900 mb-4">트렌드 타임라인</h3>
                    {selectedKeyword.trendData && selectedKeyword.trendData.length > 0 ? (
                      <div 
                        className="bg-slate-50 rounded-xl p-4" 
                        style={{ height: '200px' }} 
                        tabIndex={-1}
                        onMouseDown={(e) => e.preventDefault()}
                        onFocus={(e) => e.target.blur()}
                      >
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart 
                            data={getChartData(selectedKeyword)}
                            style={{ outline: 'none', border: 'none' }}
                          >
                            <XAxis 
                              dataKey="time" 
                              tick={{ fontSize: 12, fill: '#64748b' }}
                              tickLine={false}
                            />
                            <YAxis 
                              tick={{ fontSize: 12, fill: '#64748b' }}
                              tickLine={false}
                            />
                            <Tooltip 
                              contentStyle={{ 
                                backgroundColor: 'white', 
                                border: '1px solid #e2e8f0',
                                borderRadius: '8px'
                              }}
                            />
                            <Line 
                              type="monotone" 
                              dataKey="score" 
                              stroke="#14b8a6" 
                              strokeWidth={3}
                              dot={{ fill: '#14b8a6', r: 4 }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <div className="bg-slate-50 rounded-xl p-8 text-center">
                        <p className="text-slate-500">시계열 데이터가 없습니다.</p>
                      </div>
                    )}
                    <p className="text-sm text-slate-500 mb-6">트렌드 점수는 키워드 빈도, 시간 데이터를 기반으로 계산됩니다.</p>
                  </div>

                  {/* 연관 키워드 */}
                  <div className="mb-6">
                    <h3 className="text-lg font-bold text-slate-900 mb-3">연관 키워드</h3>
                    {selectedKeyword.relatedKeywords && selectedKeyword.relatedKeywords.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {selectedKeyword.relatedKeywords.map((keyword, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleSearch(keyword)}
                            className="px-3 py-1.5 bg-slate-100 hover:bg-teal-100 text-slate-700 hover:text-teal-700 rounded-full text-sm font-medium transition-colors"
                          >
                            {keyword}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="text-slate-500 text-sm">관련 키워드가 없습니다.</p>
                    )}
                  </div>

                  {/* 주요 기사 */}
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 mb-3">이 키워드는 왜?</h3>
                    {selectedKeyword.articles && selectedKeyword.articles.length > 0 ? (
                      <div className="space-y-2">
                        {selectedKeyword.articles.map((article, idx) => (
                          <a
                            key={idx}
                            href={article.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-xs font-bold text-teal-600">({idx + 1})</span>
                                  <span className="text-sm font-medium text-slate-900 hover:text-teal-600 transition-colors">
                                    {article.title}
                                  </span>
                                  {article.url && (
                                    <i className="ri-external-link-line text-slate-400 text-xs"></i>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 text-xs text-slate-500">
                                  <span>{article.source}</span>
                                  <span>•</span>
                                  <span>가중치: {article.weight}</span>
                                </div>
                              </div>
                            </div>
                          </a>
                        ))}
                      </div>
                    ) : (
                      <p className="text-slate-500 text-sm">관련 기사가 없습니다.</p>
                    )}
                  </div>
                </div>
              ) : searchNotFound ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <i className="ri-search-line text-6xl text-slate-300 mb-4"></i>
                  <h3 className="text-xl font-bold text-slate-400 mb-2">
                    "{searchQuery}" 검색 결과가 없습니다
                  </h3>
                  {loading ? (
                    <div className="mt-6">
                      <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-teal-500 border-t-transparent"></div>
                      <p className="text-slate-500 mt-2">검색 중...</p>
                    </div>
                  ) : similarKeywords.length > 0 ? (
                    <div className="mt-6 w-full max-w-2xl">
                      <p className="text-slate-500 mb-4">유사한 키워드를 찾았습니다:</p>
                      <div className="flex flex-wrap gap-2 justify-center">
                        {similarKeywords.map((keyword) => (
                          <button
                            key={keyword.id || keyword.rank}
                            onClick={async () => {
                              await handleKeywordSelect(keyword);
                              setSearchNotFound(false);
                              setSearchQuery(keyword.keyword);
                            }}
                            className="px-4 py-2 bg-teal-50 hover:bg-teal-100 text-teal-700 hover:text-teal-800 rounded-full text-sm font-medium transition-colors border border-teal-200"
                          >
                            {keyword.keyword}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-slate-400">
                      정확한 키워드를 입력하거나<br/>
                      왼쪽 목록에서 키워드를 선택해보세요
                    </p>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <i className="ri-search-line text-6xl text-slate-300 mb-4"></i>
                  <h3 className="text-xl font-bold text-slate-400 mb-2">키워드를 선택하세요</h3>
                  <p className="text-slate-400">
                    왼쪽 목록에서 키워드를 클릭하거나<br/>
                    검색창에서 키워드를 검색해보세요
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer />
      <ScrollToTopButton />
    </div>
  );
}

