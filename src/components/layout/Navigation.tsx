import Logo from '@/components/Logo';

interface NavigationProps {
  keywords?: string[];
  onLogoClick?: () => void;
  onTrendRankingClick?: () => void;
  onDataReportClick?: () => void;
}

export default function Navigation({ onLogoClick, onTrendRankingClick, onDataReportClick }: NavigationProps) {

  return (
    <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <div 
          className="cursor-pointer"
          onClick={onLogoClick}
        >
          <Logo size="md" />
        </div>
        <div className="hidden md:flex items-center gap-8">
          <div className="flex gap-8 font-medium text-slate-600">
            <button 
              onClick={onTrendRankingClick || onLogoClick}
              className="hover:text-teal-500 transition-colors cursor-pointer"
            >
              트렌드 랭킹
            </button>
            <button 
              onClick={onDataReportClick}
              className="hover:text-teal-500 transition-colors cursor-pointer"
            >
              데이터 리포트
            </button>
          </div>
          <button className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <i className="ri-user-line text-xl"></i>
          </button>
        </div>
      </div>
    </nav>
  );
}

