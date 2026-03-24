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
  
  // articles 배열에서 타이틀 추출 (keyword도 포함)
  const titles = item.articles.length > 0 
    ? item.articles.map(article => article.title)
    : [item.keyword];

  useEffect(() => {
    if (titles.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentTitleIndex((prevIndex) => (prevIndex + 1) % titles.length);
    }, 3000); // 3초마다 변경

    return () => clearInterval(interval);
  }, [titles.length]);

  const currentTitle = titles[currentTitleIndex] || item.keyword || `키워드 #${item.rank}`;

  return (
    <div
      onClick={onClick}
      className={`group p-5 rounded-2xl border shadow-md hover:shadow-lg cursor-pointer transition-all flex items-center gap-6 ${
        isSelected
          ? 'bg-teal-50 border-teal-300 ring-2 ring-teal-200'
          : 'bg-white border-slate-200 hover:border-teal-200'
      }`}
    >
      <div className={`text-3xl font-black italic transition-colors w-12 ${isSelected ? 'text-teal-400' : 'text-slate-200 group-hover:text-slate-300'}`}>
        #{item.rank}
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-3 mb-1 flex-nowrap">
          <div className="flex-1 min-w-0 relative h-7 overflow-hidden">
            <h3
              key={currentTitleIndex}
              className="text-lg font-bold group-hover:text-teal-600 line-clamp-1"
            >
              {currentTitle}
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
        <p className="text-slate-400 text-xs mt-0.5">{item.description}</p>
      </div>
    </div>
  );
}

