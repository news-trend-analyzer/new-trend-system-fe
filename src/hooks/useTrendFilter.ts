import { useMemo } from 'react';
import { Category, TrendItem } from '@/types';
import { useKeywordRanking } from './useKeywordRanking';

function transformRankingsToTrendItems(
  rankings: { keyword: string; totalScore: number; recentScore: number; trendScore: number; rank: number; status: 'up' | 'down' | 'same'; articles?: string[] }[],
  selectedCategory: Category
): TrendItem[] {
  // API 데이터를 TrendItem 형태로 변환
  const trendItems: TrendItem[] = rankings.map((ranking, index) => {
    // 트렌드 데이터 생성 (recentScore와 trendScore를 활용)
    const trendData = [
      Math.max(0, ranking.recentScore - ranking.trendScore * 2),
      Math.max(0, ranking.recentScore - ranking.trendScore),
      ranking.recentScore,
      ranking.totalScore * 0.8,
      ranking.totalScore * 0.9,
      ranking.totalScore,
    ];

    // 첫 번째 기사 제목을 키워드로 사용 (없으면 원래 keyword 사용)
    const displayKeyword = ranking.articles && ranking.articles.length > 0 
      ? ranking.articles[0] 
      : ranking.keyword;

    // 기사 제목 배열을 Article 형태로 변환
    const articles = ranking.articles ? ranking.articles.map((title, articleIndex) => ({
      id: articleIndex + 1,
      thumbnail: `https://picsum.photos/200/120?random=${index * 10 + articleIndex}`,
      title: title,
      summary: `${title}에 대한 상세 내용입니다.`,
      source: '트렌드뉴스',
      date: '1시간 전',
    })) : [];

    return {
      id: index + 1,
      rank: ranking.rank, // API에서 받은 rank 사용
      keyword: displayKeyword, // 첫 번째 기사 제목을 키워드로 사용
      originalKeyword: ranking.keyword, // 원래 키워드 저장 (검색용)
      category: '전체' as Category, // API에 카테고리 정보가 없으므로 기본값
      description: `${ranking.keyword} 키워드는 현재 총점 ${ranking.totalScore.toFixed(1)}점으로 많은 관심을 받고 있는 키워드입니다.`,
      status: ranking.status, // API에서 받은 status 사용
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

