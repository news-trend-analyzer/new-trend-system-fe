import { useState, useEffect, useMemo, memo } from 'react';
import { TrendItem, SearchResult, SearchResultResponse } from '@/types';
import { searchArticlesByKeyword } from '@/utils/api';

interface TrendDetailPanelProps {
  item: TrendItem | null;
}

const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return dateString;
  }
};

const SearchResultItem = memo(({ result }: { result: SearchResult }) => {
  const cleanDescription = useMemo(() => {
    return result.description ? result.description.replace(/<[^>]*>/g, '') : '';
  }, [result.description]);

  const formattedDate = useMemo(() => {
    return result.pubDate ? formatDate(result.pubDate) : '';
  }, [result.pubDate]);

  return (
    <a
      href={result.link}
      target="_blank"
      rel="noopener noreferrer"
      className="block p-4 rounded-xl border border-slate-200 hover:border-teal-300 hover:shadow-md transition-all group/news"
    >
      <h5 className="font-bold text-slate-900 group-hover/news:text-teal-600 transition-colors mb-2 line-clamp-2">
        {result.title}
      </h5>
      {cleanDescription && (
        <p className="text-sm text-slate-600 line-clamp-2 mb-3">
          {cleanDescription}
        </p>
      )}
      <div className="text-xs text-slate-400 flex items-center gap-2 flex-wrap">
        <span className="font-semibold text-slate-600">{result.press}</span>
        {formattedDate && (
          <>
            <span>•</span>
            <span>{formattedDate}</span>
          </>
        )}
        {result.category && (
          <>
            <span>•</span>
            <span className="px-2 py-0.5 bg-slate-100 rounded">
              {result.category}
            </span>
          </>
        )}
      </div>
    </a>
  );
});

const Pagination = ({ currentPage, totalPages, onPageChange, disabled = false }: { currentPage: number; totalPages: number; onPageChange: (page: number) => void; disabled?: boolean }) => {
  const handlePageClick = (page: number) => {
    if (disabled) return;
    onPageChange(page);
  };
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      }
    }
    return pages;
  };

  return (
    <div className="flex items-center justify-center gap-2 mt-6 pt-4 border-t border-slate-200">
      <button
        onClick={() => handlePageClick(currentPage - 1)}
        disabled={currentPage === 1 || disabled}
        className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        aria-label="이전 페이지"
      >
        <i className="ri-arrow-left-s-line text-xl"></i>
      </button>
      {getPageNumbers().map((page, index) =>
        page === '...' ? (
          <span key={`ellipsis-${index}`} className="px-2 text-slate-400">...</span>
        ) : (
          <button
            key={page}
            onClick={() => handlePageClick(page as number)}
            disabled={disabled}
            className={`px-4 py-2 rounded-lg transition-colors ${
              currentPage === page ? 'bg-teal-500 text-white font-semibold' : 'hover:bg-slate-100 text-slate-700'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {page}
          </button>
        )
      )}
      <button
        onClick={() => handlePageClick(currentPage + 1)}
        disabled={currentPage === totalPages || disabled}
        className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        aria-label="다음 페이지"
      >
        <i className="ri-arrow-right-s-line text-xl"></i>
      </button>
    </div>
  );
};

export default function TrendDetailPanel({ item }: TrendDetailPanelProps) {
  const [searchResponse, setSearchResponse] = useState<SearchResultResponse>({ total: 0, items: [], page: 1, pageSize: 5 });
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const pageSize = 5;

  const searchKeyword = useMemo(() => {
    if (!item) return '';
    const keyword = item.originalKeyword || item.keyword;
    return keyword.trim();
  }, [item]);

  useEffect(() => {
    if (item) {
      setCurrentPage(1);
      setSearchResponse({ total: 0, items: [], page: 1, pageSize: 5 });
    }
  }, [item]);

  useEffect(() => {
    if (item && searchKeyword) {
      let cancelled = false;
      if (currentPage > 1 && searchResponse.items.length > 0) {
        setIsLoading(true);
      } else if (currentPage === 1) {
        setIsLoading(true);
        setSearchResponse({ total: 0, items: [], page: 1, pageSize: 5 });
      }

      searchArticlesByKeyword(searchKeyword, currentPage, pageSize)
        .then((response) => {
          if (!cancelled) setSearchResponse(response);
        })
        .catch(() => {
          if (!cancelled) setSearchResponse({ total: 0, items: [], page: currentPage, pageSize: 5 });
        })
        .finally(() => {
          if (!cancelled) setIsLoading(false);
        });
      return () => { cancelled = true; };
    } else {
      setSearchResponse({ total: 0, items: [], page: 1, pageSize: 5 });
      setIsLoading(false);
    }
  }, [item, searchKeyword, currentPage]);

  if (!item) {
    return (
      <div className="flex flex-col bg-white rounded-2xl border border-slate-200 shadow-xl shadow-slate-300/20 overflow-hidden transition-all duration-300">
        <div className="flex flex-col items-center justify-start pt-8 pb-10 px-10 text-center">
          <div className="w-20 h-20 rounded-2xl bg-teal-50 flex items-center justify-center mb-6">
            <i className="ri-bar-chart-box-line text-4xl text-teal-500"></i>
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-2">키워드를 선택해보세요</h3>
          <p className="text-slate-500 text-sm max-w-xs mb-6 leading-relaxed">
            왼쪽 랭킹에서 관심 있는 키워드를 클릭하면<br />
            키워드 분석과 관련 뉴스가 여기에 표시됩니다.
          </p>
          <div className="text-left w-full max-w-sm space-y-3">
            <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50">
              <i className="ri-calendar-check-line text-teal-500 text-xl mt-0.5 shrink-0"></i>
              <div>
                <p className="text-sm font-semibold text-slate-700">하루 트렌드</p>
                <p className="text-xs text-slate-500">최근 24시간 기준 인기 키워드</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50">
              <i className="ri-flashlight-line text-amber-500 text-xl mt-0.5 shrink-0"></i>
              <div>
                <p className="text-sm font-semibold text-slate-700">실시간 트렌드</p>
                <p className="text-xs text-slate-500">가장 최근 구간 기준 급상승 키워드</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[400px] flex flex-col overflow-hidden bg-white rounded-2xl border border-slate-200 shadow-xl shadow-slate-300/20 transition-all duration-300">
      <div className="h-14 flex items-center gap-2 bg-gradient-to-r from-teal-500 to-cyan-400 pl-6 pr-5 text-white shrink-0">
        <div className="text-teal-100 font-semibold text-sm shrink-0">랭킹 #{item.rank}</div>
        <h2 className="text-base font-bold line-clamp-1 break-words flex-1 min-w-0">{item.keyword}</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <section className="mb-6">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">키워드 분석</h4>
          <p className="text-slate-700 leading-relaxed text-sm">{item.description}</p>
        </section>

        <section>
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
            <i className="ri-newspaper-line text-sm"></i>
            관련 주요 소식
            {searchResponse.total > 0 && (
              <span className="ml-1 text-slate-500 normal-case font-normal">(전체 {searchResponse.total}개)</span>
            )}
          </h4>

          {searchResponse.items.length === 0 && !isLoading ? (
            <div className="text-center py-12">
              <p className="text-slate-400 text-sm">검색 결과가 없습니다.</p>
            </div>
          ) : (
            <>
              <div className="relative h-[720px]">
                {isLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10 rounded-xl">
                    <div className="text-center">
                      <div className="inline-block animate-spin rounded-full h-8 w-8 border-3 border-teal-500 border-t-transparent mb-2"></div>
                      <p className="text-slate-500 text-sm">로딩 중...</p>
                    </div>
                  </div>
                )}
                <div className={`grid gap-3 mb-4 ${isLoading ? 'opacity-50' : ''}`}>
                  {searchResponse.items.map((result, index) => (
                    <SearchResultItem key={result.id || index} result={result} />
                  ))}
                </div>
              </div>
              {searchResponse.total > pageSize && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={Math.ceil(searchResponse.total / pageSize)}
                  onPageChange={setCurrentPage}
                  disabled={isLoading}
                />
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}
