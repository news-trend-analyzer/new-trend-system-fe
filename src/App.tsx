import { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { TrendItem, SearchResultResponse } from '@/types';
import Navigation from '@/components/layout/Navigation';
import HeroSection from '@/components/layout/HeroSection';
import Footer from '@/components/layout/Footer';
import ScrollToTopButton from '@/components/layout/ScrollToTopButton';
import TrendListSplit from '@/components/trend/TrendListSplit';
import type { KeywordInsightSeoPayload } from '@/components/trend/TrendDetailPanel';
import SearchResultList from '@/components/search/SearchResultList';
import DataReportTab from '@/components/report/DataReportTab';
import LegalMarkdownPage from '@/pages/LegalMarkdownPage';
import { sendGtagPageView } from '@/lib/analytics';
import { applyKeywordPageSeo, resetDefaultSeo } from '@/lib/seo';
import { useTrendSplit } from '@/hooks/useTrendFilter';
import { fetchKeywordInsight } from '@/utils/api';

const LEGAL_PAGE_MAP: Record<string, { slug: string; documentLabel: string }> = {
  '/terms': { slug: 'terms', documentLabel: '이용약관' },
  '/privacy': { slug: 'privacy', documentLabel: '개인정보처리방침' },
};

function toKeywordSlug(keyword: string): string {
  return encodeURIComponent(keyword.trim().toLowerCase());
}

function isPlaceholderScoreDescription(d: string): boolean {
  return /^Score:\s*[\d.,]+점?$/.test(d.trim());
}

/** 랭킹 밖 키워드 — URL의 keywordId로 상세 API만으로 패널 표시 */
function buildFallbackTrendItem(
  keywordId: string,
  keyword: string,
  summary: string | null | undefined,
): TrendItem {
  const desc = (summary && summary.trim()) || `${keyword}에 대한 실시간 뉴스 트렌드와 관련 기사입니다.`;
  return {
    id: keywordId,
    rank: 0,
    keyword,
    originalKeyword: keyword,
    category: '전체',
    description: desc.length > 220 ? `${desc.slice(0, 217)}…` : desc,
    status: 'same',
    trendData: [0, 0, 0, 0, 0, 0],
    articles: [],
    trendType: 'daily',
  };
}

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const isReportPage = location.pathname === '/report';
  const isKeywordPage = location.pathname.startsWith('/keyword/');
  const legalPage = LEGAL_PAGE_MAP[location.pathname];

  const [selectedItem, setSelectedItem] = useState<TrendItem | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResponse, setSearchResponse] = useState<SearchResultResponse>({ total: 0, items: [], page: 1, pageSize: 10 });
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const [keywordResolvePending, setKeywordResolvePending] = useState(false);

  const { dailyData, realtimeData, loading, error } = useTrendSplit('전체');
  const keywordSlug = isKeywordPage ? location.pathname.replace('/keyword/', '').replace(/\/$/, '') : '';

  const selectedItemRef = useRef<TrendItem | null>(null);
  selectedItemRef.current = selectedItem;

  const gaFirstLoadRef = useRef(true);
  useEffect(() => {
    if (gaFirstLoadRef.current) {
      gaFirstLoadRef.current = false;
      return;
    }
    sendGtagPageView(location.pathname, location.search);
  }, [location.pathname, location.search]);

  // 리포트 페이지에서 메인으로 돌아올 때 검색 상태 초기화
  const prevPathnameRef = useRef(location.pathname);
  useEffect(() => {
    const prev = prevPathnameRef.current;
    if (prev === '/report' && location.pathname === '/') {
      setIsSearchMode(false);
      setSearchQuery('');
      setSearchResponse({ total: 0, items: [], page: 1, pageSize: 10 });
    }
    prevPathnameRef.current = location.pathname;
  }, [location.pathname]);

  const keywords = [...dailyData, ...realtimeData].map(item => item.keyword).filter(Boolean);

  useLayoutEffect(() => {
    if (!isKeywordPage) {
      setKeywordResolvePending(false);
      return;
    }
    if (loading) return;

    let decodedSegment: string;
    try {
      decodedSegment = decodeURIComponent(keywordSlug);
    } catch {
      decodedSegment = keywordSlug;
    }

    const allItems: TrendItem[] = [
      ...dailyData.map(item => ({ ...item, trendType: 'daily' as const })),
      ...realtimeData.map(item => ({ ...item, trendType: 'realtime' as const })),
    ];

    const fromList = allItems.find(item => {
      const key = item.originalKeyword || item.keyword;
      if (String(item.id) === decodedSegment) return true;
      if (toKeywordSlug(key) === keywordSlug) return true;
      if (toKeywordSlug(key) === toKeywordSlug(decodedSegment)) return true;
      return false;
    });

    if (fromList) {
      setKeywordResolvePending(false);
      setSelectedItem(fromList);
      return;
    }

    let cancelled = false;
    setKeywordResolvePending(true);
    setSelectedItem(null);

    void (async () => {
      const insight = await fetchKeywordInsight(decodedSegment.trim());
      if (cancelled) return;
      setKeywordResolvePending(false);
      if (insight?.keyword) {
        setSelectedItem(buildFallbackTrendItem(decodedSegment.trim(), insight.keyword, insight.summary));
      } else {
        setSelectedItem(null);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isKeywordPage, keywordSlug, loading, dailyData, realtimeData]);

  /** 패널에서 받은 인사이트 요약으로 메타 보강 (keyword-insight 추가 호출 없음) */
  const onKeywordInsightForSeo = useCallback(
    (payload: KeywordInsightSeoPayload) => {
      if (!isKeywordPage) return;
      const current = selectedItemRef.current;
      if (!current || String(current.id) !== payload.keywordId) return;

      const summary = payload.summary?.trim() ?? '';
      const fallbackFromItem = current.description?.trim() ?? '';
      const description =
        (summary.length > 0 ? summary : '') ||
        (fallbackFromItem && !isPlaceholderScoreDescription(fallbackFromItem) ? fallbackFromItem : '') ||
        `「${current.keyword}」 관련 실시간 뉴스 트렌드와 기사를 TREN:D LAB에서 확인하세요.`;

      applyKeywordPageSeo({
        keyword: current.keyword,
        description,
        pagePath: location.pathname,
      });
    },
    [isKeywordPage, location.pathname],
  );

  /** 첫 페인트·딥링크: 아직 패널 인사이트 전이면 item 기반 설명 또는 기본 문구 */
  useEffect(() => {
    if (!isKeywordPage) {
      resetDefaultSeo();
      return;
    }
    if (loading || keywordResolvePending) return;
    if (!selectedItem) {
      resetDefaultSeo();
      return;
    }

    const fallbackFromItem = selectedItem.description?.trim() ?? '';
    const description =
      (fallbackFromItem && !isPlaceholderScoreDescription(fallbackFromItem) ? fallbackFromItem : '') ||
      `「${selectedItem.keyword}」 관련 실시간 뉴스 트렌드와 기사를 TREN:D LAB에서 확인하세요.`;

    applyKeywordPageSeo({
      keyword: selectedItem.keyword,
      description,
      pagePath: location.pathname,
    });
  }, [isKeywordPage, selectedItem, loading, keywordResolvePending, location.pathname]);

  const handleSearch = (query: string, response: SearchResultResponse) => {
    setSearchQuery(query);
    setSearchResponse(response);
    setIsSearchMode(true);
    setIsSearchLoading(false);
  };

  const handleBackToTrends = () => {
    navigate('/');
    setIsSearchMode(false);
    setSearchQuery('');
    setSearchResponse({ total: 0, items: [], page: 1, pageSize: 10 });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-teal-100 flex flex-col">
      <Navigation keywords={keywords} />
      {isReportPage ? (
        <DataReportTab />
      ) : legalPage ? (
        <>
          <LegalMarkdownPage slug={legalPage.slug} documentLabel={legalPage.documentLabel} />
          <Footer />
        </>
      ) : (
        <>
          {!isKeywordPage && <HeroSection onSearch={handleSearch} />}
          <div className="flex-1">
            {isSearchMode ? (
              <div>
                <div className="max-w-5xl mx-auto px-4 pt-6">
                  <button
                    onClick={handleBackToTrends}
                    className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors mb-4"
                  >
                    <i className="ri-arrow-left-line"></i>
                    <span>트렌드 랭킹으로 돌아가기</span>
                  </button>
                </div>
                <SearchResultList
                  query={searchQuery}
                  results={searchResponse.items}
                  total={searchResponse.total}
                  loading={isSearchLoading}
                  onSearch={handleSearch}
                />
              </div>
            ) : (
              <TrendListSplit
                dailyData={dailyData}
                realtimeData={realtimeData}
                selectedItem={selectedItem}
                onItemClick={setSelectedItem}
                loading={loading}
                error={error}
                keywordDeepLinkLoading={isKeywordPage && (loading || keywordResolvePending)}
                keywordDeepLinkNotFound={isKeywordPage && !loading && !keywordResolvePending && !selectedItem}
                onKeywordInsightForSeo={onKeywordInsightForSeo}
              />
            )}
          </div>
          <Footer />
        </>
      )}
      {!isReportPage && <ScrollToTopButton />}
    </div>
  );
}

