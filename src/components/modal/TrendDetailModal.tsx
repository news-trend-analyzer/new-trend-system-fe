import { useState, useEffect, useMemo, memo } from 'react';
import { TrendItem, SearchResult, SearchResultResponse } from '@/types';
import { searchArticles } from '@/utils/api';

interface TrendDetailModalProps {
  item: TrendItem | null;
  onClose: () => void;
}

// formatDate 함수를 컴포넌트 밖으로 이동 (재생성 방지)
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

export default function TrendDetailModal({ item, onClose }: TrendDetailModalProps) {
  const [searchResponse, setSearchResponse] = useState<SearchResultResponse>({ total: 0, items: [], page: 1, pageSize: 10 });
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const pageSize = 10;

  // 검색어: 원래 키워드 사용 (복합키에서 :를 띄어쓰기로 변환)
  const searchKeyword = useMemo(() => {
    if (!item) return '';
    // originalKeyword가 있으면 사용, 없으면 keyword 사용
    const keyword = item.originalKeyword || item.keyword;
    // ":"를 띄어쓰기로 변환하여 검색어 생성 (예: "국민배우:안성기" -> "국민배우 안성기")
    return keyword.replace(/:/g, ' ').trim();
  }, [item]);

  useEffect(() => {
    if (item) {
      setCurrentPage(1); // 새로운 아이템이 선택되면 첫 페이지로 리셋
      setSearchResponse({ total: 0, items: [], page: 1, pageSize: 10 });
    }
  }, [item]);

  useEffect(() => {
    if (item && searchKeyword) {
      let cancelled = false;
      
      // 첫 페이지가 아니고 기존 결과가 있으면 이전 결과 유지하면서 로딩
      if (currentPage > 1 && searchResponse.items.length > 0) {
        setIsLoading(true);
      } else if (currentPage === 1) {
        // 첫 페이지일 때는 기존 결과 초기화
        setIsLoading(true);
        setSearchResponse({ total: 0, items: [], page: 1, pageSize: 10 });
      }
      
      searchArticles(searchKeyword, currentPage, pageSize)
        .then(response => {
          if (!cancelled) {
            setSearchResponse(response);
          }
        })
        .catch(error => {
          if (!cancelled) {
            if (import.meta.env.DEV) {
              console.error('검색 실행 에러:', error);
            }
            setSearchResponse({ total: 0, items: [], page: currentPage, pageSize });
          }
        })
        .finally(() => {
          if (!cancelled) {
            setIsLoading(false);
          }
        });

      // cleanup: 컴포넌트가 언마운트되거나 item이 변경되면 취소
      return () => {
        cancelled = true;
      };
    } else {
      setSearchResponse({ total: 0, items: [], page: 1, pageSize });
      setIsLoading(false);
    }
  }, [item, searchKeyword, currentPage]);
  if (!item) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/40"
      />
      <div 
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-2xl bg-white rounded-3xl z-[60] shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
      >
          <div className="min-h-32 bg-gradient-to-r from-teal-500 to-cyan-400 p-8 flex justify-between items-start text-white gap-4">
            <div className="flex-1 min-w-0">
              <div className="text-teal-100 font-bold mb-1">실시간 랭킹 #{item.rank}</div>
              <h2 className="text-2xl md:text-3xl font-black line-clamp-3 break-words">{item.keyword}</h2>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full flex-shrink-0">
              <i className="ri-close-line text-2xl"></i>
            </button>
          </div>

          <div className="p-8">
            <section className="mb-8">
              <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">키워드 분석</h4>
              <p className="text-slate-700 leading-relaxed text-lg">
                {item.description}
              </p>
            </section>

            <section>
              <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">
                관련 주요 소식
                {searchResponse.total > 0 && (
                  <span className="ml-2 text-slate-300 normal-case font-normal">
                    (전체 {searchResponse.total}개)
                  </span>
                )}
              </h4>
              
              {searchResponse.items.length === 0 && !isLoading ? (
                <div className="text-center py-12">
                  <p className="text-slate-400 text-sm">검색 결과가 없습니다.</p>
                </div>
              ) : (
                <>
                  <div className="relative min-h-[200px]">
                    {isLoading && (
                      <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10 rounded-xl">
                        <div className="text-center">
                          <div className="inline-block animate-spin rounded-full h-8 w-8 border-3 border-teal-500 border-t-transparent mb-3"></div>
                          <p className="text-slate-500 text-sm">로딩 중...</p>
                        </div>
                      </div>
                    )}
                    <div className={`grid gap-4 max-h-[50vh] overflow-y-auto mb-4 ${isLoading ? 'opacity-50' : ''}`}>
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
    </div>
  );
}

// 검색 결과 아이템 메모이제이션으로 렌더링 최적화
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

// 페이지네이션 컴포넌트
const Pagination = ({ currentPage, totalPages, onPageChange, disabled = false }: { currentPage: number; totalPages: number; onPageChange: (page: number) => void; disabled?: boolean }) => {
  const handlePageClick = (page: number) => {
    if (disabled) return;
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
    <div className="flex items-center justify-center gap-2 mt-6 pt-4 border-t border-slate-200">
      <button
        onClick={() => handlePageClick(currentPage - 1)}
        disabled={currentPage === 1 || disabled}
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
            disabled={disabled}
            className={`px-4 py-2 rounded-lg transition-colors ${
              currentPage === page
                ? 'bg-teal-500 text-white font-semibold'
                : 'hover:bg-slate-100 text-slate-700'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {page}
          </button>
        )
      ))}
      
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

