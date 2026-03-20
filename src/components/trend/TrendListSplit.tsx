import { useState } from 'react';
import { TrendItem as TrendItemType } from '@/types';
import TrendItem from './TrendItem';
import TrendDetailPanel from './TrendDetailPanel';

interface TrendListSplitProps {
  dailyData: TrendItemType[];
  realtimeData: TrendItemType[];
  selectedItem: TrendItemType | null;
  onItemClick: (item: TrendItemType) => void;
  loading?: boolean;
  error?: Error | null;
}

type TabType = 'daily' | 'realtime';

export default function TrendListSplit({
  dailyData,
  realtimeData,
  selectedItem,
  onItemClick,
  loading = false,
  error = null,
}: TrendListSplitProps) {
  const [activeTab, setActiveTab] = useState<TabType>('daily');
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
                        onClick={() => onItemClick(item)}
                        isSelected={
                          selectedItem &&
                          (selectedItem.originalKeyword || selectedItem.keyword) === (item.originalKeyword || item.keyword)
                        }
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 우측: 키워드 상세 */}
          <div className={`lg:col-span-2 w-full transition-all duration-300 ${selectedItem ? 'min-h-[400px]' : ''}`}>
            <TrendDetailPanel item={selectedItem} />
          </div>
        </div>
      )}
    </main>
  );
}
