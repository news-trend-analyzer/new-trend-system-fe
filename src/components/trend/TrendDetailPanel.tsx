import { useState, useEffect, useMemo, memo, useRef } from 'react';
import { TrendItem, SearchResult, SearchResultResponse } from '@/types';
import { fetchKeywordInsight, searchArticlesByKeyword, type KeywordInsightResponse } from '@/utils/api';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export type KeywordInsightSeoPayload = {
  keywordId: string;
  /** 메타 설명용 — null이면 App에서 폴백 문구로 채움 */
  summary: string | null;
};

interface TrendDetailPanelProps {
  item: TrendItem | null;
  nextItems?: TrendItem[];
  onNextItemClick?: (item: TrendItem) => void;
  briefingProgress?: {
    completed: number;
    total: number;
    isCurrentComplete: boolean;
  };
  /** /keyword/:id 진입 시 랭킹·인사이트 조회 중 */
  deepLinkLoading?: boolean;
  /** ID·슬러그 모두 매칭 실패 */
  deepLinkNotFound?: boolean;
  /** 인사이트 로드 후 메타/OG용 (패널에서 API 1회만 호출, App은 재요청 없음) */
  onKeywordInsightForSeo?: (payload: KeywordInsightSeoPayload) => void;
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

function buildBriefingQuestions(briefing: NonNullable<KeywordInsightResponse['briefing']>) {
  return (briefing.questions || [])
    .filter(question => question.question && question.answer)
    .map(question => ({
      question: question.question,
      answer: question.answer,
      count: question.interestCount,
    }));
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

export default function TrendDetailPanel({
  item,
  nextItems = [],
  onNextItemClick,
  briefingProgress,
  deepLinkLoading = false,
  deepLinkNotFound = false,
  onKeywordInsightForSeo,
}: TrendDetailPanelProps) {
  const onKeywordInsightForSeoRef = useRef(onKeywordInsightForSeo);
  onKeywordInsightForSeoRef.current = onKeywordInsightForSeo;
  const contentRef = useRef<HTMLDivElement>(null);

  const [searchResponse, setSearchResponse] = useState<SearchResultResponse>({ total: 0, items: [], page: 1, pageSize: 5 });
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [keywordInsight, setKeywordInsight] = useState('');
  const [keywordInsightData, setKeywordInsightData] = useState<KeywordInsightResponse | null>(null);
  const [insightKeyword, setInsightKeyword] = useState('');
  const [isInsightLoading, setIsInsightLoading] = useState(false);
  const [activeQuestionIndex, setActiveQuestionIndex] = useState<number | null>(0);
  const pageSize = 5;
  const totalPages = Math.ceil(searchResponse.total / pageSize);
  const isRealtimeItem = item?.trendType === 'realtime';
  /** item 전체가 아니라 id로 의존 — 클릭 직후·URL 동기화 등으로 같은 키워드 객체가 새 참조로 들어와도 API 중복 호출 방지 */
  const itemKeywordId = item?.id != null ? String(item.id) : null;
  const apiBriefing = useMemo(() => {
    const briefing = keywordInsightData?.briefing;
    if (!briefing) return null;
    const trendSignal = briefing.trendSignal;

    return {
      articleCount: keywordInsightData.articleCount,
      oneLineSummary: briefing.oneLineSummary,
      whySteps: (briefing.whySteps || []).filter(Boolean).slice(0, 4),
      trendSignal,
      hasTrendSignal: Boolean(
        trendSignal?.label ||
        trendSignal?.basis ||
        typeof trendSignal?.changeRate === 'number'
      ),
      questions: buildBriefingQuestions(briefing),
    };
  }, [keywordInsightData]);

  useEffect(() => {
    if (itemKeywordId) {
      contentRef.current?.scrollTo({ top: 0, behavior: 'auto' });
      setCurrentPage(1);
      setSearchResponse({ total: 0, items: [], page: 1, pageSize: 5 });
      setKeywordInsight('');
      setKeywordInsightData(null);
      setInsightKeyword('');
      setActiveQuestionIndex(0);
    }
  }, [itemKeywordId]);

  useEffect(() => {
    if (isRealtimeItem) {
      setInsightKeyword('');
      setKeywordInsight('');
      setKeywordInsightData(null);
      setIsInsightLoading(false);
      if (itemKeywordId) {
        onKeywordInsightForSeoRef.current?.({ keywordId: itemKeywordId, summary: null });
      }
      return;
    }

    if (itemKeywordId) {
      let cancelled = false;
      setIsInsightLoading(true);

      fetchKeywordInsight(itemKeywordId)
        .then((insightData) => {
          if (!cancelled) {
            setInsightKeyword(insightData?.keyword ?? '');
            setKeywordInsight(insightData?.summary ?? '');
            setKeywordInsightData(insightData);
            const raw = insightData?.summary?.trim();
            onKeywordInsightForSeoRef.current?.({
              keywordId: itemKeywordId,
              summary: raw && raw.length > 0 ? raw : null,
            });
          }
        })
        .catch(() => {
          if (!cancelled) {
            setInsightKeyword('');
            setKeywordInsight('');
            setKeywordInsightData(null);
            onKeywordInsightForSeoRef.current?.({ keywordId: itemKeywordId, summary: null });
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
    setKeywordInsightData(null);
    setIsInsightLoading(false);
  }, [itemKeywordId, isRealtimeItem]);

  useEffect(() => {
    if (itemKeywordId) {
      let cancelled = false;
      if (currentPage > 1 && searchResponse.items.length > 0) {
        setIsLoading(true);
      } else if (currentPage === 1) {
        setIsLoading(true);
        setSearchResponse({ total: 0, items: [], page: 1, pageSize: 5 });
      }

      searchArticlesByKeyword(itemKeywordId, currentPage, pageSize)
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
  }, [itemKeywordId, currentPage]);

  if (!item) {
    if (deepLinkLoading) {
      return (
        <div className="flex flex-col bg-white rounded-2xl border border-slate-200 shadow-xl shadow-slate-300/20 overflow-hidden min-h-[400px] lg:h-full">
          <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
            <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-teal-500 border-t-transparent mb-3" />
            <p className="text-slate-600 text-sm">키워드 정보를 불러오는 중...</p>
          </div>
        </div>
      );
    }
    if (deepLinkNotFound) {
      return (
        <div className="flex flex-col bg-white rounded-2xl border border-slate-200 shadow-xl shadow-slate-300/20 overflow-hidden min-h-[400px] lg:h-full">
          <div className="flex flex-col items-center justify-start pt-10 pb-10 px-10 text-center">
            <div className="w-16 h-16 rounded-2xl bg-amber-50 flex items-center justify-center mb-4">
              <i className="ri-error-warning-line text-3xl text-amber-600"></i>
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">키워드를 찾을 수 없습니다</h3>
            <p className="text-slate-500 text-sm max-w-sm leading-relaxed">
              링크가 만료되었거나 잘못되었을 수 있습니다. 왼쪽 랭킹에서 다른 키워드를 선택해 보세요.
            </p>
          </div>
        </div>
      );
    }
    return (
      <div className="flex flex-col bg-white rounded-2xl border border-slate-200 shadow-xl shadow-slate-300/20 overflow-hidden min-h-[400px] lg:h-full">
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
    <div className="min-h-[400px] lg:h-full flex flex-col overflow-hidden bg-white rounded-2xl border border-slate-200 shadow-xl shadow-slate-300/20 transition-colors duration-200">
      <div className="h-14 flex items-center gap-2 bg-gradient-to-r from-teal-500 to-cyan-400 pl-6 pr-5 text-white shrink-0">
        <div className="text-teal-100 font-semibold text-sm shrink-0">랭킹 #{item.rank}</div>
        <h1 className="text-base font-bold line-clamp-1 break-words flex-1 min-w-0">{item.keyword}</h1>
      </div>

      <div ref={contentRef} className="flex-1 overflow-y-auto p-6">
        <section className="mb-6">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <i className="ri-robot-2-line text-sm text-teal-600"></i>
            AI 요약
            <span className="text-[11px] font-medium normal-case tracking-normal text-amber-700">
              (참고용, 원문 확인 권장)
            </span>
          </h4>
          {isInsightLoading ? (
            <div className="flex min-h-[240px] items-center justify-center rounded-xl border border-slate-200 bg-slate-50 px-5 py-5">
              <div className="text-center">
                <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-4 border-teal-500 border-t-transparent" />
                <p className="text-slate-400 leading-relaxed text-sm">AI 요약 생성 중...</p>
              </div>
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
              {apiBriefing && (
                <div className="mb-4 space-y-5">
                  <div className="rounded-xl border border-slate-200 bg-white px-4 py-4">
                    <p className="text-sm font-extrabold text-slate-900">
                      AI가 {(apiBriefing.articleCount || searchResponse.total || item.articles.length || 1).toLocaleString()}개의 기사를 읽었습니다.
                    </p>
                    <p className="mt-1 text-xs font-medium text-slate-500">핵심 흐름만 먼저 확인하세요.</p>
                    {apiBriefing.oneLineSummary && (
                      <p className="mt-3 text-sm font-semibold leading-6 text-slate-700">
                        {apiBriefing.oneLineSummary}
                      </p>
                    )}
                  </div>

                  {apiBriefing.whySteps.length > 0 && (
                    <div className="rounded-xl border border-teal-100 bg-white px-4 py-4">
                      <p className="mb-3 flex items-center gap-1.5 text-base font-extrabold text-slate-900">
                        <i className="ri-fire-line text-xl text-rose-500"></i>
                        왜 떴나
                      </p>
                      <div className="rounded-xl bg-slate-50 px-4 py-1">
                        {apiBriefing.whySteps.map((step, index, steps) => (
                          <div key={`${step}-${index}`}>
                            <div className="flex items-center gap-3 py-3">
                              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-sm font-black text-teal-700 shadow-sm ring-1 ring-slate-200">
                                {index + 1}
                              </span>
                              <p className="line-clamp-1 text-base font-extrabold leading-6 text-slate-900">
                                {step}
                              </p>
                            </div>
                            {index < steps.length - 1 && (
                              <div className="ml-10 border-t border-slate-200" />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {apiBriefing.hasTrendSignal && (
                    <div className="rounded-xl border border-slate-200 bg-white px-4 py-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="mb-1 flex items-center gap-1.5 text-xs font-bold text-slate-500">
                            <i className="ri-line-chart-line text-sm text-teal-600"></i>
                            최근 흐름
                          </p>
                          {apiBriefing.trendSignal?.label && (
                            <p className="text-xl font-black text-slate-900">{apiBriefing.trendSignal.label}</p>
                          )}
                        </div>
                        {typeof apiBriefing.trendSignal?.changeRate === 'number' && (
                          <span className={apiBriefing.trendSignal.changeRate >= 0 ? 'text-lg font-black text-rose-500' : 'text-lg font-black text-blue-500'}>
                            {apiBriefing.trendSignal.changeRate >= 0 ? '+' : ''}{apiBriefing.trendSignal.changeRate}%
                          </span>
                        )}
                      </div>
                      {apiBriefing.trendSignal?.basis && (
                        <p className="mt-2 text-xs leading-5 text-slate-500">
                          {apiBriefing.trendSignal.basis}
                        </p>
                      )}
                    </div>
                  )}

                  {apiBriefing.questions.length > 0 && (
                    <div className="rounded-xl border border-slate-200 bg-white px-4 py-4">
                      <p className="mb-3 flex items-center gap-1.5 text-sm font-extrabold text-slate-900">
                        <i className="ri-question-answer-line text-base text-teal-600"></i>
                        사람들이 가장 많이 물어본 질문
                      </p>
                      <div className="grid gap-2">
                        {apiBriefing.questions.map((question, index) => {
                          const isActive = activeQuestionIndex === index;
                          return (
                            <button
                              key={question.question}
                              type="button"
                              onClick={() => setActiveQuestionIndex(isActive ? null : index)}
                              className={`rounded-xl border px-3 py-3 text-left transition-colors ${
                                isActive
                                  ? 'border-teal-200 bg-teal-50/70'
                                  : 'border-slate-100 bg-white hover:border-teal-100 hover:bg-slate-50'
                              }`}
                            >
                              <div className="flex items-center justify-between gap-3">
                                <span className="text-sm font-bold text-slate-800">Q. {question.question}</span>
                                <i className={`${isActive ? 'ri-arrow-up-s-line' : 'ri-arrow-down-s-line'} text-lg text-slate-400`}></i>
                              </div>
                              {typeof question.count === 'number' && (
                                <p className="mt-1 text-xs font-semibold text-teal-600">
                                  {question.count.toLocaleString()}명이 궁금해했습니다.
                                </p>
                              )}
                              {isActive && (
                                <p className="mt-2 text-sm leading-6 text-slate-600">
                                  {question.answer}
                                </p>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {briefingProgress && (
                    <div className="rounded-xl border border-teal-200 bg-teal-50 px-4 py-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="flex items-center gap-1.5 text-sm font-black text-teal-800">
                            <i className="ri-checkbox-circle-fill text-base"></i>
                            요약 확인 완료
                          </p>
                          <p className="mt-1 text-xs font-medium text-teal-700">
                            오늘의 브리핑 {briefingProgress.completed}/{briefingProgress.total || 3} 완료
                          </p>
                        </div>
                        {nextItems[0] && (
                          <button
                            type="button"
                            onClick={() => onNextItemClick?.(nextItems[0])}
                            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-teal-600 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-teal-700"
                          >
                            다음 이슈 보기
                            <i className="ri-arrow-right-s-line text-lg"></i>
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
              {!apiBriefing && keywordInsight ? (
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
              ) : !apiBriefing ? (
                <p className="text-slate-500 leading-relaxed text-sm">
                  AI 요약 정보가 없습니다.
                </p>
              ) : null}
            </div>
          )}
        </section>

        <section>
          <div className="mb-3 flex items-end justify-between gap-3">
            <div>
              <h4 className="flex items-center gap-2 text-base font-black text-slate-900">
                <i className="ri-newspaper-line text-lg text-teal-600"></i>
                {apiBriefing ? 'AI가 고른 필수 기사 3개' : '관련 주요 소식'}
              </h4>
              {searchResponse.total > 0 && (
                <p className="mt-0.5 text-xs font-medium text-slate-500">전체 {searchResponse.total}개 중 먼저 볼 기사</p>
              )}
            </div>
          </div>

          {searchResponse.items.length === 0 && !isLoading ? (
            <div className="text-center py-12">
              <p className="text-slate-400 text-sm">검색 결과가 없습니다.</p>
            </div>
          ) : (
            <>
              <div className="relative min-h-[360px] w-full">
                <div className="min-h-[360px] max-h-[min(720px,70dvh)] overflow-y-auto overscroll-y-contain rounded-xl">
                  <div className={`grid gap-3 ${isLoading ? 'opacity-50 pointer-events-none' : ''}`}>
                    {(apiBriefing ? searchResponse.items.slice(0, 3) : searchResponse.items).map((result, index) => (
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
                  {apiBriefing ? (
                    <button
                      type="button"
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={isLoading || currentPage >= totalPages}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-600 transition-colors hover:border-teal-200 hover:bg-teal-50 disabled:opacity-50"
                    >
                      {currentPage >= totalPages ? '필수 기사 모두 확인' : '필수 기사 더보기'}
                    </button>
                  ) : (
                    <Pagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      onPageChange={setCurrentPage}
                      disabled={isLoading}
                    />
                  )}
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}
