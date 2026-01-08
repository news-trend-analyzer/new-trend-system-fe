import { Category } from '@/types';
import { CATEGORIES } from '@/constants';

interface CategoryFilterProps {
  selectedCategory: Category;
  onCategoryChange: (category: Category) => void;
}

export default function CategoryFilter({ selectedCategory, onCategoryChange }: CategoryFilterProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar mb-8">
      {CATEGORIES.map(cat => (
        <button
          key={cat}
          onClick={() => onCategoryChange(cat)}
          className={`px-5 py-2 rounded-full whitespace-nowrap transition-all border ${
            selectedCategory === cat 
            ? 'bg-teal-500 border-teal-500 text-white shadow-lg shadow-teal-200' 
            : 'bg-white border-slate-200 text-slate-500 hover:border-teal-300 hover:text-teal-600'
          }`}
        >
          {cat}
        </button>
      ))}
    </div>
  );
}

