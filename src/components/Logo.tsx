interface LogoProps {
  className?: string;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export default function Logo({ className = '', showText = true, size = 'md' }: LogoProps) {
  const iconSizes = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  const textSizes = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* SVG 로고 아이콘 */}
      <div className={`relative ${iconSizes[size]}`}>
        <svg
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          {/* 배경 원 */}
          <circle cx="50" cy="50" r="48" fill="url(#gradient)" />
          
          {/* 그라디언트 정의 */}
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#14b8a6" />
              <stop offset="100%" stopColor="#059669" />
            </linearGradient>
          </defs>
          
          {/* 상승하는 트렌드 그래프 - 더 크고 명확하게 */}
          <polyline
            points="20,70 35,55 50,60 65,40 80,30"
            stroke="white"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          
          {/* 그래프 포인트 */}
          <circle cx="20" cy="70" r="3" fill="white" />
          <circle cx="35" cy="55" r="3" fill="white" />
          <circle cx="50" cy="60" r="3" fill="white" />
          <circle cx="65" cy="40" r="3" fill="white" />
          <circle cx="80" cy="30" r="4" fill="white" />
        </svg>
      </div>

      {/* 텍스트 */}
      {showText && (
        <span className={`font-bold bg-gradient-to-r from-teal-500 to-emerald-600 bg-clip-text text-transparent ${textSizes[size]}`}>
          TREN:D LAB
        </span>
      )}
    </div>
  );
}