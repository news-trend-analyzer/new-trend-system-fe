interface NavigationProps {
  keywords?: string[];
  onLogoClick?: () => void;
}

export default function Navigation({ onLogoClick }: NavigationProps) {

  return (
    <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <div 
          className="flex items-center gap-2 cursor-pointer"
          onClick={onLogoClick}
        >
          <div className="w-8 h-8 bg-gradient-to-tr from-teal-500 to-emerald-400 rounded-lg flex items-center justify-center shadow-lg shadow-teal-200">
            <i className="ri-flashlight-fill text-white text-xl"></i>
          </div>
          <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-600 to-emerald-600">
            TREN:D LAB
          </span>
        </div>
        <div className="hidden md:flex gap-8 font-medium text-slate-600">
          {/* <a href="#" className="hover:text-teal-500 transition-colors">실시간 랭킹</a>
          <a href="#" className="hover:text-teal-500 transition-colors">데이터 리포트</a>
          <a href="#" className="hover:text-teal-500 transition-colors">구독 서비스</a> */}
        </div>
        <button className="p-2 hover:bg-slate-100 rounded-full transition-colors">
          <i className="ri-user-line text-xl"></i>
        </button>
      </div>
    </nav>
  );
}

