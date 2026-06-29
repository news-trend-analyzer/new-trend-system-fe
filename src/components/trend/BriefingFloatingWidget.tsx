import { TrendItem as TrendItemType } from '@/types';

interface BriefingFloatingWidgetProps {
  items: TrendItemType[];
  completedIds: Set<string>;
  selectedItem: TrendItemType | null;
  onSelect: (item: TrendItemType) => void;
}

export default function BriefingFloatingWidget({
  items,
  completedIds,
  selectedItem,
  onSelect,
}: BriefingFloatingWidgetProps) {
  if (items.length === 0) return null;

  const completedCount = items.filter(item => completedIds.has(String(item.id))).length;
  const progress = Math.round((completedCount / items.length) * 100);
  const nextItem = items.find(item => !completedIds.has(String(item.id))) || items[0];

  const isSelected = (item: TrendItemType) => {
    if (!selectedItem) return false;
    return String(selectedItem.id) === String(item.id) ||
      (selectedItem.originalKeyword || selectedItem.keyword) === (item.originalKeyword || item.keyword);
  };

  return (
    <>
      <aside className="fixed left-5 top-32 z-40 hidden w-72 rounded-2xl border border-teal-100 bg-white/95 p-4 shadow-2xl shadow-slate-900/12 backdrop-blur lg:block xl:left-8">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-black text-slate-900">오늘의 브리핑</p>
            <p className="mt-0.5 text-xs font-medium text-slate-500">오늘 3개만 보면 끝</p>
          </div>
          <span className="rounded-full bg-teal-50 px-2.5 py-1 text-xs font-black text-teal-700">
            {completedCount}/{items.length}
          </span>
        </div>

        <div className="mb-3 h-2 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-teal-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="grid gap-1.5">
          {items.map((item, index) => {
            const isDone = completedIds.has(String(item.id));
            const active = isSelected(item);
            return (
              <button
                key={`floating-briefing-${item.id}`}
                type="button"
                onClick={() => onSelect(item)}
                className={`flex items-center gap-2 rounded-xl px-2.5 py-2 text-left transition-colors ${
                  active ? 'bg-teal-50' : 'hover:bg-slate-50'
                }`}
              >
                <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[11px] font-black ${
                  isDone
                    ? 'border-teal-500 bg-teal-500 text-white'
                    : active
                      ? 'border-teal-400 text-teal-600'
                      : 'border-slate-300 text-slate-400'
                }`}>
                  {isDone ? <i className="ri-check-line" /> : index + 1}
                </span>
                <span className="min-w-0 flex-1 truncate text-sm font-bold text-slate-800">
                  {item.keyword}
                </span>
              </button>
            );
          })}
        </div>
      </aside>

      <div className="fixed inset-x-3 bottom-5 z-40 rounded-2xl border border-teal-100 bg-white/95 p-3 shadow-2xl shadow-slate-900/15 backdrop-blur lg:hidden">
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex items-center justify-between gap-2">
              <p className="truncate text-sm font-black text-slate-900">오늘의 브리핑 {completedCount}/{items.length}</p>
              <span className="text-xs font-bold text-teal-700">{progress}%</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-teal-500 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
          <button
            type="button"
            onClick={() => onSelect(nextItem)}
            className="shrink-0 rounded-xl bg-slate-900 px-3 py-2 text-xs font-black text-white"
          >
            다음 보기
          </button>
        </div>
      </div>
    </>
  );
}
