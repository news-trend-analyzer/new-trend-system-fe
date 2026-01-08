import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendItem as TrendItemType } from '@/types';
import TrendMiniChart from './TrendMiniChart';

interface TrendItemProps {
  item: TrendItemType;
  index: number;
  onClick: () => void;
}

export default function TrendItem({ item, index, onClick }: TrendItemProps) {
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

  const currentTitle = titles[currentTitleIndex] || item.keyword;

  return (
    <motion.div
      layoutId={`card-${item.id}`}
      onClick={onClick}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="group bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl hover:border-teal-100 cursor-pointer transition-all flex items-center gap-6"
    >
      <div className="text-3xl font-black italic text-slate-200 group-hover:text-teal-500/20 transition-colors w-12">
        #{item.rank}
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-3 mb-1 flex-wrap">
          <div className="flex-1 min-w-0 relative h-7 overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.h3
                key={currentTitleIndex}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.8, ease: "easeInOut" }}
                className="text-lg font-bold group-hover:text-teal-600 line-clamp-1"
              >
                {currentTitle}
              </motion.h3>
            </AnimatePresence>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-xs font-semibold px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-center">
              {item.category}
            </span>
            {/* 상태 표시 */}
            {item.status === 'up' && (
              <div className="flex items-center gap-1 px-2 py-0.5 bg-rose-50 text-rose-600 rounded-full">
                <i className="ri-arrow-up-s-fill text-sm"></i>
                <span className="text-xs font-semibold">상승</span>
              </div>
            )}
            {item.status === 'down' && (
              <div className="flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full">
                <i className="ri-arrow-down-s-fill text-sm"></i>
                <span className="text-xs font-semibold">하강</span>
              </div>
            )}
            {item.status === 'same' && (
              <div className="flex items-center gap-1 px-2 py-0.5 bg-slate-50 text-slate-600 rounded-full">
                <div className="h-[2px] w-3 bg-slate-400 rounded"></div>
                <span className="text-xs font-semibold">유지</span>
              </div>
            )}
          </div>
        </div>
        <p className="text-slate-500 text-sm line-clamp-1">{item.description}</p>
      </div>
      <div className="flex items-center gap-6">
        <div className="hidden sm:block">
          <TrendMiniChart data={item.trendData} />
        </div>
        <div className="w-12 text-center">
          {item.status === 'up' && <i className="ri-arrow-up-s-fill text-rose-500 text-2xl"></i>}
          {item.status === 'down' && <i className="ri-arrow-down-s-fill text-blue-500 text-2xl"></i>}
          {item.status === 'same' && <div className="h-[2px] w-4 bg-slate-300 mx-auto rounded"></div>}
        </div>
      </div>
    </motion.div>
  );
}

