import { useState, useEffect, useMemo } from 'react';
import { Category, TrendItem, KeywordRanking } from '@/types';
import { useKeywordRanking } from './useKeywordRanking';
import { fetchRealtimeRanking } from '@/utils/api';

export type TrendSortType = 'daily' | 'realtime';

/** API `rank`(오름차순) 기준 정렬. rank 없음은 맨 뒤로. */
function sortRankingsByRank(rankings: KeywordRanking[]): KeywordRanking[] {
  return [...rankings].sort((a, b) => {
    const ra = typeof a.rank === 'number' ? a.rank : Number.POSITIVE_INFINITY;
    const rb = typeof b.rank === 'number' ? b.rank : Number.POSITIVE_INFINITY;
    return ra - rb;
  });
}

function readFinalScore(r: KeywordRanking): number {
  if (typeof r.finalScore === 'number' && !Number.isNaN(r.finalScore)) return r.finalScore;
  if (typeof r.final_score === 'number' && !Number.isNaN(r.final_score)) return r.final_score;
  return Number.NEGATIVE_INFINITY;
}

/** 실시간: `finalScore`(또는 API `final_score`) 내림차순. 없으면 맨 뒤. 표시 `rank`는 1..n으로 맞춤. */
function sortRankingsByFinalScore(rankings: KeywordRanking[]): KeywordRanking[] {
  const scored = rankings.map((r, i) => ({ r, i }));
  scored.sort((a, b) => {
    const fa = readFinalScore(a.r);
    const fb = readFinalScore(b.r);
    if (fb !== fa) return fb - fa;
    return a.i - b.i;
  });
  return scored.map(({ r }, idx) => ({ ...r, rank: idx + 1 }));
}

function transformRankingsToTrendItems(
  rankings: KeywordRanking[],
  selectedCategory: Category
): TrendItem[] {
  // API 데이터를 TrendItem 형태로 변환
  const trendItems: TrendItem[] = rankings.map((ranking, index) => {
    // 점수 파생값 계산
    const totalScore = ranking.score24h ?? ranking.score ?? 0;
    const recentScore = ranking.scoreRecent ?? totalScore;
    const prevScore =
      ranking.scorePrev ?? (typeof ranking.diffScore === 'number' ? recentScore - ranking.diffScore : Math.max(0, recentScore * 0.7));

    // 트렌드 데이터 생성 (이전 → 최근 → 전체 흐름)
    const trendData = [
      Math.max(0, prevScore),
      Math.max(0, (prevScore + recentScore) / 2),
      Math.max(0, recentScore),
      Math.max(0, totalScore * 0.8),
      Math.max(0, totalScore * 0.9),
      Math.max(0, totalScore),
    ];

    // 상태 매핑: 백엔드의 'new'를 프론트의 'up'으로 표시
    const mappedStatus: 'up' | 'down' | 'same' =
      ranking.status === 'down' ? 'down' : ranking.status === 'same' ? 'same' : 'up';

    // articles: string[] 또는 { title/headline/text/name }[] 형식 지원
    const articleTitles: string[] = (ranking.articles ?? []).map((a: unknown) => {
      if (typeof a === 'string') return a;
      if (a && typeof a === 'object') {
        const o = a as Record<string, unknown>;
        const t = o.title ?? o.headline ?? o.text ?? o.name ?? o.articleTitle ?? '';
        return String(t ?? '');
      }
      return '';
    }).filter(Boolean);

    // keyword 우선 (다양한 필드명 지원), 없으면 첫 기사 제목 사용
    const r = ranking as unknown as Record<string, unknown>;
    const rawKeyword = [
      ranking.keyword,
      r?.displayText,
      r?.displaytext,
      ranking.query,
      ranking.name,
      r?.normalizedText,
      r?.normalized_text,
      r?.keywordText,
      r?.text,
    ]
      .filter((v): v is string => typeof v === 'string' && v.length > 0)[0] ?? '';
    const displayKeyword = rawKeyword || (articleTitles[0] ?? '');

    // 기사 제목 배열을 Article 형태로 변환
    const articles = articleTitles.map((title, articleIndex) => ({
      id: articleIndex + 1,
      thumbnail: `https://picsum.photos/200/120?random=${index * 10 + articleIndex}`,
      title: title,
      summary: `${title}에 대한 상세 내용입니다.`,
      source: '트렌드뉴스',
      date: '1시간 전',
    }));

    return {
      id: ranking.id ?? index + 1,
      rank: ranking.rank ?? index + 1,
      keyword: (() => {
        const kw = displayKeyword || `키워드 #${ranking.rank ?? index + 1}`;
        if (import.meta.env.DEV && !displayKeyword) {
          console.warn('[Trend] 키워드 없음, 폴백 사용:', { rank: ranking.rank, raw: ranking });
        }
        return kw;
      })(),
      originalKeyword: rawKeyword || displayKeyword,
      category: '전체' as Category, // API에 카테고리 정보가 없으므로 기본값
      description: `Score: ${totalScore.toFixed(0)}점`,
      status: mappedStatus,
      trendData,
      articles,
    };
  });

  // 카테고리 필터링 (현재는 모두 '전체'이므로 실제 필터링 효과는 없음)
  return selectedCategory === '전체'
    ? trendItems
    : trendItems.filter(item => item.category === selectedCategory);
}

export function useTrendFilter(selectedCategory: Category) {
  const { rankings, loading, error } = useKeywordRanking();

  const filteredData = useMemo(() => {
    if (loading) {
      return [];
    }

    if (error) {
      if (import.meta.env.DEV) {
        console.error('키워드 랭킹 로드 에러:', error);
      }
      return [];
    }

    if (!rankings || rankings.length === 0) {
      if (import.meta.env.DEV) {
        console.warn('랭킹 데이터 없음:', { rankings });
      }
      return [];
    }

    return transformRankingsToTrendItems(rankings, selectedCategory);
  }, [rankings, selectedCategory, loading, error]);

  return filteredData;
}

export function useTrendFilterWithStatus(selectedCategory: Category) {
  const { rankings, loading, error } = useKeywordRanking();

  const filteredData = useMemo(() => {
    if (loading) {
      return [];
    }

    if (error) {
      if (import.meta.env.DEV) {
        console.error('키워드 랭킹 로드 에러:', error);
      }
      return [];
    }

    if (!rankings || rankings.length === 0) {
      if (import.meta.env.DEV) {
        console.warn('랭킹 데이터 없음:', { rankings });
      }
      return [];
    }

    return transformRankingsToTrendItems(rankings, selectedCategory);
  }, [rankings, selectedCategory, loading, error]);

  return { filteredData, loading, error };
}

/** 메인 화면 2열 레이아웃용: 일간(/trend/top) + 실시간(/trend/realtime) 별도 API */
export function useTrendSplit(selectedCategory: Category) {
  const { rankings: dailyRankings, loading: dailyLoading, error: dailyError } = useKeywordRanking();
  const [realtimeRankings, setRealtimeRankings] = useState<KeywordRanking[]>([]);
  const [realtimeLoading, setRealtimeLoading] = useState(true);
  const [realtimeError, setRealtimeError] = useState<Error | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setRealtimeLoading(true);
        setRealtimeError(null);
        const data = await fetchRealtimeRanking(10);
        setRealtimeRankings(data);
      } catch (err) {
        setRealtimeError(err instanceof Error ? err : new Error('알 수 없는 오류가 발생했습니다'));
      } finally {
        setRealtimeLoading(false);
      }
    };
    load();
  }, []);

  const loading = dailyLoading || realtimeLoading;
  const error = dailyError || realtimeError;

  const { dailyData, realtimeData } = useMemo(() => {
    const daily = dailyError || !dailyRankings?.length
      ? []
      : transformRankingsToTrendItems(sortRankingsByRank(dailyRankings), selectedCategory);
    const realtime = realtimeError || !realtimeRankings?.length
      ? []
      : transformRankingsToTrendItems(sortRankingsByFinalScore(realtimeRankings), selectedCategory);
    return { dailyData: daily, realtimeData: realtime };
  }, [dailyRankings, dailyError, realtimeRankings, realtimeError, selectedCategory]);

  return { dailyData, realtimeData, loading, error };
}

