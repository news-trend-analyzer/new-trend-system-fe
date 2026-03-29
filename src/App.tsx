import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { TrendItem, SearchResultResponse } from '@/types';
import Navigation from '@/components/layout/Navigation';
import HeroSection from '@/components/layout/HeroSection';
import Footer from '@/components/layout/Footer';
import ScrollToTopButton from '@/components/layout/ScrollToTopButton';
import TrendListSplit from '@/components/trend/TrendListSplit';
import SearchResultList from '@/components/search/SearchResultList';
import DataReportTab from '@/components/report/DataReportTab';
import LegalMarkdownPage from '@/pages/LegalMarkdownPage';
import { useTrendSplit } from '@/hooks/useTrendFilter';

const LEGAL_PAGE_MAP: Record<string, { slug: string; documentLabel: string }> = {
  '/terms': { slug: 'terms', documentLabel: '이용약관' },
  '/privacy': { slug: 'privacy', documentLabel: '개인정보처리방침' },
};

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const isReportPage = location.pathname === '/report';
  const legalPage = LEGAL_PAGE_MAP[location.pathname];

  const [selectedItem, setSelectedItem] = useState<TrendItem | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResponse, setSearchResponse] = useState<SearchResultResponse>({ total: 0, items: [], page: 1, pageSize: 10 });
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [isSearchLoading, setIsSearchLoading] = useState(false);

  const { dailyData, realtimeData, loading, error } = useTrendSplit('전체');

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
          <HeroSection onSearch={handleSearch} />
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

