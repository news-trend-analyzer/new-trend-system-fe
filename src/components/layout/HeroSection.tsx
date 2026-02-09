import { useState, useEffect, useRef } from 'react';
import { searchSuggestions, searchArticles } from '@/utils/api';
import { SearchSuggestion, SearchResultResponse } from '@/types';

interface HeroSectionProps {
  onSearch?: (query: string, response: SearchResultResponse) => void;
}

export default function HeroSection({ onSearch }: HeroSectionProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // 디바운싱을 위한 useEffect
  useEffect(() => {
    if (searchQuery.trim().length === 0) {
      setSuggestions([]);
      setShowSuggestions(false);
      setIsLoading(false);
      return;
    }

    // 최소 1글자 이상 입력해야 검색
    if (searchQuery.trim().length < 1) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setIsLoading(true);
      try {
        const results = await searchSuggestions(searchQuery);
        setSuggestions(results);
        setShowSuggestions(results.length > 0);
      } catch (error) {
        if (import.meta.env.DEV) {
          console.error('검색 에러:', error);
        }
        setSuggestions([]);
        setShowSuggestions(false);
      } finally {
        setIsLoading(false);
      }
    }, 300); // 300ms 디바운싱

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // 외부 클릭 시 자동완성 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleKeyDown = (e: { key: string; preventDefault: () => void }) => {
    if (e.key === 'ArrowDown' && showSuggestions && suggestions.length > 0) {
      e.preventDefault();
      setSelectedIndex((prev) => 
        prev < suggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp' && showSuggestions && suggestions.length > 0) {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      // 엔터를 누르면 검색 실행 (검색창 텍스트 유지)
      handleSearch();
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    // 자동완성 클릭 시 해당 키워드로 검색 실행
    const query = suggestion.keyword;
    setSearchQuery(query); // 검색창 텍스트 업데이트
    setShowSuggestions(false);
    performSearch(query);
  };

  const performSearch = async (query: string) => {
    if (!query.trim()) return;
    
    setIsLoading(true);
    try {
      const response = await searchArticles(query, 1, 10); // 첫 페이지, 10개씩
      if (onSearch) {
        onSearch(query, response);
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('검색 실행 에러:', error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      setShowSuggestions(false);
      performSearch(searchQuery);
    }
  };

  return (
    <section className="bg-gradient-to-b from-white to-slate-50 pt-16 pb-12">
      <div className="max-w-4xl mx-auto px-4 text-center">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-6">
          지금 대한민국에서 <br/>
          <span className="text-teal-500">가장 뜨거운 트렌드</span>를 만나보세요
        </h1>
        <div ref={searchRef} className="relative max-w-2xl mx-auto">
          <div className="relative">
            <input 
              ref={inputRef}
              type="text" 
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setSelectedIndex(-1);
              }}
              onFocus={() => {
                if (suggestions.length > 0) {
                  setShowSuggestions(true);
                }
              }}
              onKeyDown={handleKeyDown}
              placeholder="궁금한 키워드를 검색해보세요"
              className="w-full px-6 py-4 rounded-2xl border-none shadow-xl shadow-slate-200/50 ring-1 ring-slate-200 focus:ring-2 focus:ring-teal-500 outline-none text-lg transition-all"
            />
            <button 
              onClick={handleSearch}
              className="absolute right-3 top-2.5 bg-teal-500 hover:bg-teal-600 text-white p-2 px-5 rounded-xl transition-all"
            >
              <i className="ri-search-line"></i>
            </button>
          </div>
          {/* 자동완성 드롭다운 */}
          {(showSuggestions || isLoading) && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-slate-200 max-h-80 overflow-y-auto z-50">
              {isLoading ? (
                <div className="p-4 text-center text-slate-500">
                  <div className="inline-block animate-spin rounded-full h-5 w-5 border-2 border-teal-500 border-t-transparent"></div>
                  <span className="ml-2">검색 중...</span>
                </div>
              ) : suggestions.length > 0 ? (
                suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(suggestion)}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={`w-full text-left px-6 py-3 hover:bg-teal-50 transition-colors flex items-center gap-3 ${
                      index === selectedIndex ? 'bg-teal-50' : ''
                    } ${index === 0 ? 'rounded-t-2xl' : ''} ${
                      index === suggestions.length - 1 ? 'rounded-b-2xl' : ''
                    }`}
                  >
                    <i className="ri-search-line text-slate-400"></i>
                    <span className="flex-1 text-slate-700">{suggestion.keyword}</span>
                    {suggestion.count !== undefined && (
                      <span className="text-xs text-slate-400">{suggestion.count}</span>
                    )}
                  </button>
                ))
              ) : (
                <div className="p-4 text-center text-slate-500 text-sm">
                  검색 결과가 없습니다.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

