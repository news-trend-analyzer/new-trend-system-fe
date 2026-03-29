/** index.html의 Google tag(gtag.js)와 동일한 측정 ID */
export const GA_MEASUREMENT_ID = 'G-CBX1SYN65W';

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
  }
}

/** 클라이언트 라우팅 시 화면별 조회 전송 (최초 로드는 index.html의 config로 수집) */
export function sendGtagPageView(pathname: string, search: string): void {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') return;
  const page_path = pathname + search;
  window.gtag('config', GA_MEASUREMENT_ID, {
    page_path,
  });
}
