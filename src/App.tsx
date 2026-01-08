import { useState } from 'react';
import { Category, TrendItem, SearchResultResponse } from '@/types';
import Navigation from '@/components/layout/Navigation';
import HeroSection from '@/components/layout/HeroSection';
import Footer from '@/components/layout/Footer';
import ScrollToTopButton from '@/components/layout/ScrollToTopButton';
import TrendList from '@/components/trend/TrendList';
import TrendDetailModal from '@/components/modal/TrendDetailModal';
import SearchResultList from '@/components/search/SearchResultList';
import { useTrendFilterWithStatus } from '@/hooks/useTrendFilter';

export default function App() {
  const [selectedCategory, setSelectedCategory] = useState<Category>('전체');
  const [selectedItem, setSelectedItem] = useState<TrendItem | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResponse, setSearchResponse] = useState<SearchResultResponse>({ total: 0, items: [], page: 1, pageSize: 10 });
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [isSearchLoading, setIsSearchLoading] = useState(false);

  const { filteredData, loading, error } = useTrendFilterWithStatus(selectedCategory);

  // 키워드 배열 추출 (첫 번째 기사 제목 또는 키워드)
  const keywords = filteredData.map(item => item.keyword).filter(Boolean);

  const handleSearch = (query: string, response: SearchResultResponse) => {
    setSearchQuery(query);
    setSearchResponse(response);
    setIsSearchMode(true);
    setIsSearchLoading(false);
  };

  const handleBackToTrends = () => {
    setIsSearchMode(false);
    setSearchQuery('');
    setSearchResponse({ total: 0, items: [], page: 1, pageSize: 10 });
  };


  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-teal-100 flex flex-col">
      <Navigation keywords={keywords} onLogoClick={handleBackToTrends} />
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
          <TrendList
            filteredData={filteredData}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            onItemClick={setSelectedItem}
            loading={loading}
            error={error}
          />
        )}
      </div>
      <Footer />
      <ScrollToTopButton />
      <TrendDetailModal item={selectedItem} onClose={() => setSelectedItem(null)} />
    </div>
  );
}

