import { Link } from 'react-router-dom';
import Logo from '@/components/Logo';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white border-t border-slate-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* 브랜드 섹션 */}
          <div className="col-span-1 md:col-span-2">
            <div className="mb-4">
              <Logo size="md" />
            </div>
            <p className="text-slate-600 text-sm mb-4 max-w-md">
              실시간 뉴스 트렌드를 분석하고 키워드 랭킹을 제공하여 최신 이슈를 한눈에 파악할 수 있는 서비스입니다.
            </p>
            <div className="flex flex-col gap-3">
              <div className="flex gap-4">
                <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-slate-100 hover:bg-pink-100 flex items-center justify-center text-slate-600 hover:text-pink-600 transition-colors">
                  <i className="ri-instagram-fill text-xl"></i>
                </a>
                <a href="mailto:trendlab.data@gmail.com" className="w-10 h-10 rounded-full bg-slate-100 hover:bg-teal-100 flex items-center justify-center text-slate-600 hover:text-teal-600 transition-colors">
                  <i className="ri-mail-line text-xl"></i>
                </a>
              </div>
              <a href="mailto:trendlab.data@gmail.com" className="flex items-center gap-2 text-slate-600 hover:text-teal-600 transition-colors text-sm">
                <i className="ri-mail-line"></i>
                <span>trendlab.data@gmail.com</span>
              </a>
            </div>
          </div>

          {/* 빠른 링크 */}
          <div>
            <h3 className="font-bold text-slate-900 mb-4">빠른 링크</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-slate-600 hover:text-teal-600 transition-colors text-sm">
                  실시간 랭킹
                </Link>
              </li>
              <li>
                <Link to="/report" className="text-slate-600 hover:text-teal-600 transition-colors text-sm">
                  데이터 리포트
                </Link>
              </li>
            </ul>
          </div>

          {/* 지원 */}
          <div>
            <h3 className="font-bold text-slate-900 mb-4">지원</h3>
            <ul className="space-y-2">

              <li>
                <a href="#" className="text-slate-600 hover:text-teal-600 transition-colors text-sm">
                  자주 묻는 질문
                </a>
              </li>
              <li>
                <a href="#" className="text-slate-600 hover:text-teal-600 transition-colors text-sm">
                  문의하기
                </a>
              </li>
              <li>
                <Link to="/terms" className="text-slate-600 hover:text-teal-600 transition-colors text-sm">
                  이용약관
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-slate-600 hover:text-teal-600 transition-colors text-sm">
                  개인정보처리방침
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* 쿠팡 파트너스: 안내에 따른 필수 고지 문구 + 링크 */}
        <div className="pt-8 border-t border-slate-200">
          <p className="text-xs text-slate-500 leading-relaxed max-w-3xl">
            이 포스팅은 쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받습니다.
          </p>
          <p className="mt-2 text-xs text-slate-500 max-w-3xl">
            <a
              href="https://link.coupang.com/a/edGiOd"
              target="_blank"
              rel="noopener noreferrer sponsored"
              className="text-teal-600 hover:text-teal-700 underline underline-offset-2"
            >
              쿠팡에서 보기
            </a>
          </p>
        </div>

        {/* 하단 저작권 */}
        <div className="pt-6 border-t border-slate-200">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-slate-500 text-sm">
              © {currentYear} TREN:D LAB. All rights reserved.
            </p>
            <div className="flex gap-6 text-sm">
              <Link to="/privacy" className="text-slate-500 hover:text-teal-600 transition-colors">
                개인정보처리방침
              </Link>
              <Link to="/terms" className="text-slate-500 hover:text-teal-600 transition-colors">
                서비스 이용약관
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

