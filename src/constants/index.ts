import { Category, TrendItem } from '@/types';

export const CATEGORIES: Category[] = ['전체', '기술', '엔터', '스포츠', '정치', '경제', '사회', '문화'];

export const MOCK_DATA: TrendItem[] = Array.from({ length: 20 }, (_, i) => ({
  id: i + 1,
  rank: i + 1,
  keyword: `트렌드 키워드 ${i + 1}`,
  category: ['기술', '경제', '엔터', '스포츠', '사회'][i % 5] as Category,
  description: "이 키워드는 현재 소셜 미디어와 뉴스에서 가장 많이 언급되고 있는 주제입니다.",
  status: i % 3 === 0 ? 'up' : i % 3 === 1 ? 'down' : 'same',
  trendData: [10, 40, 30, 80, 60, 90],
  articles: [
    { id: 1, thumbnail: 'https://picsum.photos/200/120?random=1', title: '관련 뉴스 제목입니다.', summary: '뉴스 요약 내용이 여기에 들어갑니다.', source: '트렌드신문', date: '1시간 전' },
    { id: 2, thumbnail: 'https://picsum.photos/200/120?random=2', title: '화제의 중심이 된 이유', summary: '분석 결과 해당 키워드는 급격한 상승세를 보이고 있습니다.', source: '인사이트', date: '3시간 전' },
  ]
}));

