import { TrendItem as TrendItemType } from '@/types';
import TrendItem from './TrendItem';
import CategoryFilter from './CategoryFilter';
import { Category } from '@/types';

interface TrendListProps {
  filteredData: TrendItemType[];
  selectedCategory: Category;
  onCategoryChange: (category: Category) => void;
  onItemClick: (item: TrendItemType) => void;
  loading?: boolean;
  error?: Error | null;
}

export default function TrendList({ 
  filteredData, 
  selectedCategory, 
  onCategoryChange,
  onItemClick,
  loading = false,
  error = null
}: TrendListProps) {
  return (
    <main className="max-w-5xl mx-auto px-4 pb-20 min-h-[60vh]">
      <CategoryFilter 
        selectedCategory={selectedCategory} 
        onCategoryChange={onCategoryChange} 
      />
      
      {loading && (
        <div className="flex items-center justify-center py-20 min-h-[40vh]">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-teal-500 border-t-transparent mb-4"></div>
            <p className="text-slate-600">키워드 랭킹을 불러오는 중...</p>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 my-8 min-h-[20vh]">
          <div className="flex items-start gap-3">
            <i className="ri-error-warning-line text-rose-500 text-2xl mt-0.5"></i>
            <div className="flex-1">
              <h3 className="font-bold text-rose-800 mb-1">데이터를 불러올 수 없습니다</h3>
              <p className="text-rose-700 text-sm">{error.message}</p>
              <p className="text-rose-600 text-xs mt-2">
                브라우저 콘솔(F12)에서 자세한 에러 정보를 확인할 수 있습니다.
              </p>
            </div>
          </div>
        </div>
      )}

      {!loading && !error && filteredData.length === 0 && (
        <div className="text-center py-20 min-h-[40vh] flex items-center justify-center">
          <p className="text-slate-500">카테고리별 랭킹은 준비 중이에요.
          조금만 기다려 주세요 🙂</p>
        </div>
      )}

      {!loading && !error && filteredData.length > 0 && (
        <div className="grid gap-4">
          {filteredData.map((item, idx) => (
            <TrendItem
              key={item.id}
              item={item}
              index={idx}
              onClick={() => onItemClick(item)}
            />
          ))}
        </div>
      )}
    </main>
  );
}

