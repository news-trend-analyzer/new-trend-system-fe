import { Link, NavLink } from 'react-router-dom';
import Logo from '@/components/Logo';

interface NavigationProps {
  keywords?: string[];
}

export default function Navigation({ keywords }: NavigationProps) {
  return (
    <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200 safe-area-pt">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 min-h-14 md:h-16 flex items-center justify-between gap-2 py-2 md:py-0">
        <div className="flex items-center gap-3 sm:gap-6 min-w-0 flex-1">
          <Link to="/" className="flex items-center shrink-0">
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
          <div className="flex md:hidden items-center justify-end gap-1 sm:gap-2 text-sm font-medium text-slate-600 shrink-0">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `px-2.5 py-1.5 rounded-lg whitespace-nowrap hover:text-teal-500 transition-colors ${isActive ? 'text-teal-600 bg-teal-50' : ''}`
              }
            >
              랭킹
            </NavLink>
            <NavLink
              to="/report"
              className={({ isActive }) =>
                `px-2.5 py-1.5 rounded-lg whitespace-nowrap hover:text-teal-500 transition-colors ${isActive ? 'text-teal-600 bg-teal-50' : ''}`
              }
            >
              리포트
            </NavLink>
          </div>
        </div>
      </div>
    </nav>
  );
}

