import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ScrollToTopButton() {
  const [isVisible, setIsVisible] = useState(false);

  // 스크롤 위치 감지
  useEffect(() => {
    const toggleVisibility = () => {
      if (window.pageYOffset > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', toggleVisibility);

    return () => {
      window.removeEventListener('scroll', toggleVisibility);
    };
  }, []);

  // 상단으로 스크롤
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={scrollToTop}
          className="fixed bottom-32 right-4 z-40 flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-tr from-teal-500 to-emerald-400 text-white shadow-lg shadow-teal-200/50 transition-shadow hover:shadow-xl hover:shadow-teal-200/70 sm:bottom-8 sm:right-8 sm:h-12 sm:w-12 group"
          aria-label="맨 위로 이동"
        >
          <i className="ri-arrow-up-line text-2xl group-hover:-translate-y-0.5 transition-transform"></i>
        </motion.button>
      )}
    </AnimatePresence>
  );
}
