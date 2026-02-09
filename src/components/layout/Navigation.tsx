import { Link, NavLink } from 'react-router-dom';
import Logo from '@/components/Logo';

interface NavigationProps {
  keywords?: string[];
}

export default function Navigation({ keywords }: NavigationProps) {
  return (
    <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center">
            <Logo size="md" />
          </Link>
          <div className="hidden md:flex items-center gap-8 font-medium text-slate-600">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `hover:text-teal-500 transition-colors ${isActive ? 'text-teal-600' : ''}`
              }
            >
              트렌드 랭킹
            </NavLink>
            <NavLink
              to="/report"
              className={({ isActive }) =>
                `hover:text-teal-500 transition-colors ${isActive ? 'text-teal-600' : ''}`
              }
            >
              데이터 리포트
            </NavLink>
          </div>
        </div>
        <button className="p-2 hover:bg-slate-100 rounded-full transition-colors">
          <i className="ri-user-line text-xl"></i>
        </button>
      </div>
    </nav>
  );
}

