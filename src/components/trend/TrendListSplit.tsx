import { useRef, useEffect } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { TrendItem as TrendItemType } from '@/types';
import TrendItem from './TrendItem';
import TrendDetailPanel, { type KeywordInsightSeoPayload } from './TrendDetailPanel';

interface TrendListSplitProps {
  dailyData: TrendItemType[];
  realtimeData: TrendItemType[];
  selectedItem: TrendItemType | null;
  onItemClick: (item: TrendItemType | null) => void;
  loading?: boolean;
  error?: Error | null;
  /** /keyword/:id 딥링크 로딩·실패 시 패널 문구 */
  keywordDeepLinkLoading?: boolean;
  keywordDeepLinkNotFound?: boolean;
  onKeywordInsightForSeo?: (payload: KeywordInsightSeoPayload) => void;
}

type TabType = 'daily' | 'realtime';

const TAB_PARAM = 'tab';
/** 상세 패널 키워드 — 공유·북마크·뒤로가기·analytics(location.search) 연동 */
const KW_PARAM = 'kw';

function parseTabFromSearch(search: string): TabType {
  const params = new URLSearchParams(search);
  const t = params.get(TAB_PARAM)?.toLowerCase();
  return t === 'realtime' ? 'realtime' : 'daily';
}

export default function TrendListSplit({
  dailyData,
  realtimeData,
  selectedItem,
  onItemClick,
  loading = false,
  error = null,
  keywordDeepLinkLoading = false,
  keywordDeepLinkNotFound = false,
  onKeywordInsightForSeo,
}: TrendListSplitProps) {
  const detailPanelRef = useRef<HTMLDivElement>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const activeTab = parseTabFromSearch(searchParams.toString());
  const kwFromUrl = searchParams.get(KW_PARAM);
  const isKeywordRoute = location.pathname.startsWith('/keyword/');

  /* URL ↔ 선택 키워드 동기화 (딥링크, 브라우저 뒤로가기, 탭 전환) */
  useEffect(() => {
    if (isKeywordRoute) return;

    if (!kwFromUrl) {
      if (selectedItem !== null) onItemClick(null);
      return;
    }

    const list = activeTab === 'daily' ? dailyData : realtimeData;
    if (loading) return;

    const found = list.find(i => (i.originalKeyword || i.keyword) === kwFromUrl);
    if (found) {
      const key = found.originalKeyword || found.keyword;
      const selKey = selectedItem ? (selectedItem.originalKeyword || selectedItem.keyword) : null;
      if (selKey !== key || selectedItem?.trendType !== activeTab) {
        onItemClick({ ...found, trendType: activeTab });
      }
      return;
    }

    if (selectedItem !== null) onItemClick(null);
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      next.delete(KW_PARAM);
      return next;
    });
  }, [
    kwFromUrl,
    activeTab,
    dailyData,
    realtimeData,
    loading,
    selectedItem,
    onItemClick,
    setSearchParams,
    isKeywordRoute,
  ]);

  const handleItemSelect = (item: TrendItemType) => {
    onItemClick({ ...item, trendType: activeTab });
    const query = activeTab === 'realtime' ? '?tab=realtime' : '';
    navigate(`/keyword/${encodeURIComponent(String(item.id))}${query}`);
  };

  /* 단일 열(모바일)에서만: 목록 항목 선택 후 상세 패널이 보이도록 스크롤 */
  useEffect(() => {
    if (!selectedItem) return;
    if (!window.matchMedia('(max-width: 1023px)').matches) return;

    const id = requestAnimationFrame(() => {
      detailPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    return () => cancelAnimationFrame(id);
  }, [selectedItem]);

  const setActiveTab = (tab: TabType) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      if (tab === 'daily') {
        next.delete(TAB_PARAM);
      } else {
        next.set(TAB_PARAM, tab);
      }
      return next;
    });
  };

  const currentData = activeTab === 'daily' ? dailyData : realtimeData;

  return (
    <main className="max-w-7xl mx-auto px-4 pb-20 min-h-[60vh]">
      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 my-8">
          <div className="flex items-start gap-3">
            <i className="ri-error-warning-line text-rose-500 text-2xl mt-0.5"></i>
            <div className="flex-1">
              <h3 className="font-bold text-rose-800 mb-1">데이터를 불러올 수 없습니다</h3>
              <p className="text-rose-700 text-sm">{error.message}</p>
            </div>
          </div>
        </div>
      )}

      {!error && (
        <div className={`grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 mt-6 ${!selectedItem ? 'items-start' : ''}`}>
          {/* 좌측: 탭 + 랭킹 리스트 */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xl shadow-slate-300/20 overflow-hidden">
              {/* 탭 버튼 */}
              <div className="flex border-b border-slate-200">
                <button
                  onClick={() => setActiveTab('daily')}
                  className={`flex-1 py-4 px-4 text-sm font-semibold transition-colors flex items-center justify-center gap-2 ${
                    activeTab === 'daily'
                      ? 'bg-teal-50 text-teal-600 border-b-2 border-teal-500'
                      : 'text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  <i className="ri-calendar-check-line text-lg"></i>
                  하루 트렌드
                </button>
                <button
                  onClick={() => setActiveTab('realtime')}
                  className={`flex-1 py-4 px-4 text-sm font-semibold transition-colors flex items-center justify-center gap-2 ${
                    activeTab === 'realtime'
                      ? 'bg-amber-50 text-amber-600 border-b-2 border-amber-500'
                      : 'text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  <i className="ri-flashlight-line text-lg"></i>
                  실시간 트렌드
                </button>
              </div>

              {/* 랭킹 리스트 */}
              <div className="p-4">
                {loading ? (
                  <div className="flex items-center justify-center py-16">
                    <div className="text-center">
                      <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-teal-500 border-t-transparent mb-3"></div>
                      <p className="text-slate-600 text-sm">불러오는 중...</p>
                    </div>
                  </div>
                ) : currentData.length === 0 ? (
                  <div className="flex items-center justify-center py-16">
                    <p className="text-slate-500 text-sm">랭킹 데이터가 없습니다.</p>
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {currentData.map((item, idx) => (
                      <TrendItem
                        key={`${item.id}-${item.rank}-${activeTab}`}
                        item={item}
                        index={idx}
                        onClick={() => handleItemSelect({ ...item, trendType: activeTab })}
                        isSelected={
                          !!selectedItem &&
                          (String(selectedItem.id) === String(item.id) ||
                            (selectedItem.originalKeyword || selectedItem.keyword) ===
                              (item.originalKeyword || item.keyword))
                        }
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 우측: 키워드 상세 (모바일 스크롤 시 sticky 네비에 안 가리도록 scroll-mt) */}
          <div
            ref={detailPanelRef}
            className={`lg:col-span-2 w-full transition-all duration-300 scroll-mt-[5.25rem] lg:scroll-mt-0 ${
              selectedItem ? 'min-h-[400px]' : ''
            }`}
          >
            <TrendDetailPanel
              item={selectedItem}
              deepLinkLoading={keywordDeepLinkLoading}
              deepLinkNotFound={keywordDeepLinkNotFound}
              onKeywordInsightForSeo={onKeywordInsightForSeo}
            />
          </div>
        </div>
      )}
    </main>
  );
}
