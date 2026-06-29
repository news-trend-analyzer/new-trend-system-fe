import { useState, useEffect } from 'react';
import { TrendItem as TrendItemType } from '@/types';

interface TrendItemProps {
  item: TrendItemType;
  index: number;
  onClick: () => void;
  isSelected?: boolean;
}

export default function TrendItem({ item, index, onClick, isSelected = false }: TrendItemProps) {
  const [currentTitleIndex, setCurrentTitleIndex] = useState(0);
  
  const titles = item.articles.map(article => article.title).filter(Boolean);

  useEffect(() => {
    if (titles.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentTitleIndex((prevIndex) => (prevIndex + 1) % titles.length);
    }, 3000); // 3초마다 변경

    return () => clearInterval(interval);
  }, [titles.length]);

  const currentTitle = titles[currentTitleIndex] || item.description || `${item.keyword} 관련 이슈를 확인해보세요`;

  return (
    <div
      onClick={onClick}
      className={`group relative overflow-hidden p-4 rounded-2xl border shadow-md hover:shadow-lg cursor-pointer transition-all flex items-start gap-4 ${
        isSelected
          ? 'bg-teal-50 border-teal-300 ring-2 ring-teal-200 shadow-lg'
          : 'bg-white border-slate-200 hover:border-teal-200'
      }`}
    >
      <div className={`text-2xl font-black italic leading-none transition-colors w-11 ${isSelected ? 'text-teal-400' : 'text-slate-200 group-hover:text-slate-300'}`}>
        #{item.rank}
      </div>
      <div className="min-w-0 flex-1">
        <div className="mb-1.5 flex items-center gap-3 flex-nowrap">
          <div className="flex-1 min-w-0">
            <h3 className="line-clamp-1 text-lg font-extrabold text-slate-900 group-hover:text-teal-700">
              {item.keyword}
            </h3>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 h-6">
            {/* 상태 표시 - 가로 배치 유지, 줄바꿈 방지 */}
            <div className="flex items-center shrink-0">
              {item.status === 'up' && (
                <div className="flex items-center gap-1 px-2 py-0.5 bg-rose-50 text-rose-600 rounded-full whitespace-nowrap">
                  <i className="ri-arrow-up-s-fill text-sm leading-none shrink-0"></i>
                  <span className="text-xs font-semibold leading-none">상승</span>
                </div>
              )}
              {item.status === 'down' && (
                <div className="flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full whitespace-nowrap">
                  <i className="ri-arrow-down-s-fill text-sm leading-none shrink-0"></i>
                  <span className="text-xs font-semibold leading-none">하강</span>
                </div>
              )}
              {item.status === 'same' && (
                <div className="flex items-center gap-1 px-2 py-0.5 bg-slate-50 text-slate-600 rounded-full whitespace-nowrap">
                  <div className="h-[2px] w-3 bg-slate-400 rounded shrink-0"></div>
                  <span className="text-xs font-semibold leading-none">유지</span>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="relative min-h-5 overflow-hidden">
          <p
            key={currentTitleIndex}
            className="line-clamp-1 text-sm font-medium leading-5 text-slate-600 transition-colors group-hover:text-slate-800"
          >
            {currentTitle}
          </p>
        </div>
        <div className="mt-2 flex min-w-0 items-center gap-2 text-xs font-semibold text-slate-400">
          <span className="text-teal-600 opacity-80 group-hover:opacity-100">
            {isSelected ? '지금 보는 중' : '키워드 분석'}
          </span>
        </div>
      </div>
    </div>
  );
}
