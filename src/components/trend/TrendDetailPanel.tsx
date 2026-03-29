import { useState, useEffect, useMemo, memo } from 'react';
import { TrendItem, SearchResult, SearchResultResponse } from '@/types';
import { fetchKeywordInsight, searchArticlesByKeyword } from '@/utils/api';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

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

function normalizeMarkdown(text: string): string {
  return text
    // 제로폭 문자 제거 (마크다운 파싱 방해)
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    // 백엔드에서 이스케이프된 줄바꿈을 실제 줄바꿈으로 복원
    .replace(/\\n/g, '\n')
    // 이스케이프된 마크다운 기호 복원 (\*\*bold\*\* -> **bold**)
    .replace(/\\([\\`*_{}[\]()#+\-.!>~|])/g, '$1')
    // 전각 별표(＊)를 일반 별표(*)로 통일
    .replace(/＊/g, '*')
    // ***text*** 같은 구문은 **text**로 단순화
    .replace(/\*{3,}/g, '**')
    // **"text"** / **“text”** 형태는 따옴표 안쪽을 bold로 재배치
    .replace(/\*\*\s*(["“‘])/g, '$1**')
    .replace(/(["”’])\s*\*\*/g, '**$1')
    // 볼드 구문 주변 불필요 공백 제거 (** text ** -> **text**)
    .replace(/\*\*\s+/g, '**')
    .replace(/\s+\*\*/g, '**')
    .trim();
}

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
  const [keywordInsight, setKeywordInsight] = useState('');
  const [insightKeyword, setInsightKeyword] = useState('');
  const [isInsightLoading, setIsInsightLoading] = useState(false);
  const pageSize = 5;
  const isRealtimeItem = item?.trendType === 'realtime';

  useEffect(() => {
    if (item) {
      setCurrentPage(1);
      setSearchResponse({ total: 0, items: [], page: 1, pageSize: 5 });
      setKeywordInsight('');
      setInsightKeyword('');
    }
  }, [item]);

  useEffect(() => {
    if (isRealtimeItem) {
      setInsightKeyword('');
      setKeywordInsight('');
      setIsInsightLoading(false);
      return;
    }

    if (item?.id) {
      let cancelled = false;
      setIsInsightLoading(true);

      fetchKeywordInsight(String(item.id))
        .then((insightData) => {
          if (!cancelled) {
            setInsightKeyword(insightData?.keyword ?? '');
            setKeywordInsight(insightData?.summary ?? '');
          }
        })
        .catch(() => {
          if (!cancelled) {
            setInsightKeyword('');
            setKeywordInsight('');
          }
        })
        .finally(() => {
          if (!cancelled) {
            setIsInsightLoading(false);
          }
        });

      return () => { cancelled = true; };
    }

    setInsightKeyword('');
    setKeywordInsight('');
    setIsInsightLoading(false);
  }, [item, isRealtimeItem]);

  useEffect(() => {
    if (item?.id) {
      let cancelled = false;
      if (currentPage > 1 && searchResponse.items.length > 0) {
        setIsLoading(true);
      } else if (currentPage === 1) {
        setIsLoading(true);
        setSearchResponse({ total: 0, items: [], page: 1, pageSize: 5 });
      }

      searchArticlesByKeyword(String(item.id), currentPage, pageSize)
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
  }, [item, currentPage]);

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
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <i className="ri-robot-2-line text-sm text-teal-600"></i>
            AI 요약
            <span className="text-[11px] font-medium normal-case tracking-normal text-amber-700">
              (참고용, 원문 확인 권장)
            </span>
          </h4>
          {isInsightLoading ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-slate-400 leading-relaxed text-sm">AI 요약 생성 중...</p>
            </div>
          ) : isRealtimeItem ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
              <p className="text-amber-700 leading-relaxed text-sm font-medium">
                실시간 랭킹에서는 AI 요약을 제공하지 않습니다.
              </p>
            </div>
          ) : (
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-teal-100 text-teal-700 text-[11px] font-semibold mb-2">
                <i className="ri-sparkling-2-line text-xs"></i>
                AI 요약
              </div>
              {insightKeyword && (
                <p className="text-[11px] font-semibold text-teal-700 mb-2">
                  키워드: <span className="text-teal-800">{insightKeyword}</span>
                </p>
              )}
              {keywordInsight ? (
                <div className="text-slate-700 leading-7 text-[15px] break-words">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      p: ({ children }) => <p className="mb-3 last:mb-0">{children}</p>,
                      ul: ({ children }) => <ul className="list-disc pl-5 mb-3 last:mb-0 space-y-1">{children}</ul>,
                      ol: ({ children }) => <ol className="list-decimal pl-5 mb-3 last:mb-0 space-y-1">{children}</ol>,
                      li: ({ children }) => <li>{children}</li>,
                      strong: ({ children }) => <strong className="font-bold text-slate-800">{children}</strong>,
                      em: ({ children }) => <em className="italic">{children}</em>,
                      a: ({ href, children }) => (
                        <a
                          href={href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-teal-700 underline underline-offset-2 hover:text-teal-800"
                        >
                          {children}
                        </a>
                      ),
                      code: ({ children }) => (
                        <code className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-800 text-[13px]">{children}</code>
                      ),
                      blockquote: ({ children }) => (
                        <blockquote className="border-l-4 border-teal-200 pl-3 text-slate-600 mb-3 last:mb-0">
                          {children}
                        </blockquote>
                      ),
                    }}
                  >
                    {normalizeMarkdown(keywordInsight)}
                  </ReactMarkdown>
                </div>
              ) : (
                <p className="text-slate-500 leading-relaxed text-sm">
                  AI 요약 정보가 없습니다.
                </p>
              )}
            </div>
          )}
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
              <div className="relative w-full">
                <div className="max-h-[min(720px,70dvh)] overflow-y-auto overscroll-y-contain rounded-xl">
                  <div className={`grid gap-3 ${isLoading ? 'opacity-50 pointer-events-none' : ''}`}>
                    {searchResponse.items.map((result, index) => (
                      <SearchResultItem key={result.id || index} result={result} />
                    ))}
                  </div>
                </div>
                {isLoading && (
                  <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-white/80">
                    <div className="text-center">
                      <div className="inline-block animate-spin rounded-full h-8 w-8 border-3 border-teal-500 border-t-transparent mb-2"></div>
                      <p className="text-slate-500 text-sm">로딩 중...</p>
                    </div>
                  </div>
                )}
              </div>
              {searchResponse.total > pageSize && (
                <div className="mt-4 shrink-0">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={Math.ceil(searchResponse.total / pageSize)}
                    onPageChange={setCurrentPage}
                    disabled={isLoading}
                  />
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}
