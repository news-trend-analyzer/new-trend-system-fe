import { useState, useEffect } from 'react';
import { SearchResult, SearchResultResponse } from '@/types';
import { searchArticles } from '@/utils/api';

interface SearchResultListProps {
  query: string;
  results: SearchResult[];
  total?: number;
  loading?: boolean;
  onSearch?: (query: string, response: SearchResultResponse) => void;
}

export default function SearchResultList({ query, results, total: initialTotal, loading: initialLoading, onSearch }: SearchResultListProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [totalResults, setTotalResults] = useState(initialTotal || results.length);
  const [displayResults, setDisplayResults] = useState<SearchResult[]>(results);
  const [isLoading, setIsLoading] = useState(false);
  const pageSize = 10;

  // query가 변경되면 첫 페이지로 리셋
  useEffect(() => {
    setCurrentPage(1);
    setDisplayResults(results);
    setTotalResults(initialTotal || results.length);
  }, [query]);
  
  // results나 total이 변경되면 (첫 페이지일 때만) 업데이트
  useEffect(() => {
    if (currentPage === 1) {
      setDisplayResults(results);
      setTotalResults(initialTotal || results.length);
    }
  }, [results, initialTotal, currentPage]);

  // 페이지 변경 시 검색 실행
  useEffect(() => {
    if (query) {
      if (currentPage === 1) {
        // 첫 페이지일 때는 전달받은 결과 사용
        setDisplayResults(results);
        setTotalResults(initialTotal || results.length);
      } else {
        // 2페이지 이상일 때는 API 호출
        setIsLoading(true);
        searchArticles(query, currentPage, pageSize)
          .then(response => {
            setDisplayResults(response.items);
            setTotalResults(response.total);
            if (onSearch) {
              onSearch(query, response);
            }
          })
        .catch(error => {
          if (import.meta.env.DEV) {
            console.error('페이지네이션 검색 에러:', error);
          }
        })
          .finally(() => {
            setIsLoading(false);
          });
      }
    }
  }, [currentPage, query]);

  const loading = initialLoading || isLoading;
  if (loading) {
    return (
      <main className="max-w-5xl mx-auto px-4 pb-20 min-h-[60vh]">
        <div className="flex items-center justify-center py-20 min-h-[40vh]">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-teal-500 border-t-transparent mb-4"></div>
            <p className="text-slate-600">검색 중...</p>
          </div>
        </div>
      </main>
    );
  }

  if (!loading && displayResults.length === 0) {
    return (
      <main className="max-w-5xl mx-auto px-4 pb-20 min-h-[60vh]">
        <div className="text-center py-20 min-h-[40vh] flex items-center justify-center">
          <div>
            <p className="text-slate-500 mb-2">"{query}"에 대한 검색 결과가 없습니다.</p>
            <p className="text-slate-400 text-sm">다른 키워드로 검색해보세요.</p>
          </div>
        </div>
      </main>
    );
  }

  const formatDate = (dateString: string) => {
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

  return (
    <main className="max-w-5xl mx-auto px-4 pb-20 min-h-[60vh]">
      <div className="py-6 border-b border-slate-200">
        <h2 className="text-2xl font-bold text-slate-900">
          "{query}" 검색 결과
        </h2>
        <p className="text-slate-500 mt-1">
          총 {totalResults}개의 결과
        </p>
      </div>
      
      <div className="grid gap-4 mt-6">
        {displayResults.map((result, index) => (
          <a
            key={result.id || index}
            href={result.link}
            target="_blank"
            rel="noopener noreferrer"
            className="block bg-white rounded-2xl p-6 hover:shadow-lg transition-shadow border border-slate-200"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-slate-900 mb-2 line-clamp-2">
                  {result.title}
                </h3>
                {result.description && (
                  <p className="text-slate-600 text-sm mb-3 line-clamp-2">
                    {result.description.replace(/<[^>]*>/g, '')}
                  </p>
                )}
                <div className="flex items-center gap-4 text-xs text-slate-400">
                  <span className="font-medium">{result.press}</span>
                  {result.pubDate && (
                    <span>{formatDate(result.pubDate)}</span>
                  )}
                  {result.category && (
                    <span className="px-2 py-1 bg-slate-100 rounded">
                      {result.category}
                    </span>
                  )}
                </div>
              </div>
              <i className="ri-external-link-line text-slate-400 text-xl"></i>
            </div>
          </a>
        ))}
      </div>
      
      {totalResults > pageSize && (
        <Pagination
          currentPage={currentPage}
          totalPages={Math.ceil(totalResults / pageSize)}
          onPageChange={setCurrentPage}
        />
      )}
    </main>
  );
}

// 페이지네이션 컴포넌트
const Pagination = ({ currentPage, totalPages, onPageChange }: { currentPage: number; totalPages: number; onPageChange: (page: number) => void }) => {
  const handlePageClick = (page: number) => {
    onPageChange(page);
  };
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  return (
    <div className="flex items-center justify-center gap-2 mt-8 pt-6 border-t border-slate-200">
      <button
        onClick={() => handlePageClick(currentPage - 1)}
        disabled={currentPage === 1}
        className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        aria-label="이전 페이지"
      >
        <i className="ri-arrow-left-s-line text-xl"></i>
      </button>
      
      {getPageNumbers().map((page, index) => (
        page === '...' ? (
          <span key={`ellipsis-${index}`} className="px-2 text-slate-400">
            ...
          </span>
        ) : (
          <button
            key={page}
            onClick={() => handlePageClick(page as number)}
            className={`px-4 py-2 rounded-lg transition-colors ${
              currentPage === page
                ? 'bg-teal-500 text-white font-semibold'
                : 'hover:bg-slate-100 text-slate-700'
            }`}
          >
            {page}
          </button>
        )
      ))}
      
      <button
        onClick={() => handlePageClick(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        aria-label="다음 페이지"
      >
        <i className="ri-arrow-right-s-line text-xl"></i>
      </button>
    </div>
  );
};

