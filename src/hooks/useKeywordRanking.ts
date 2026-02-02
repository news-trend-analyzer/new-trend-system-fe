import { useState, useEffect } from 'react';
import { KeywordRanking } from '@/types';
import { fetchKeywordRanking } from '@/utils/api';

export function useKeywordRanking() {
  const [rankings, setRankings] = useState<KeywordRanking[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const loadRankings = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchKeywordRanking();
        setRankings(data);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('알 수 없는 오류가 발생했습니다'));
      } finally {
        setLoading(false);
      }
    };

    loadRankings();
  }, []);

  return { rankings, loading, error };
}


