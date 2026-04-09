import { useEffect, useRef, useState } from 'react';

export default function useScrollDirection({ downThreshold = 10, upThreshold = 5 } = {}) {
  const [direction, setDirection] = useState(null);
  const [isAtTop, setIsAtTop] = useState(true);
  const lastY = useRef(0);
  const raf = useRef(null);

  useEffect(() => {
    const onScroll = () => {
      if (raf.current) return;
      raf.current = requestAnimationFrame(() => {
        const y = window.scrollY;
        setIsAtTop(y < 10);

        const delta = y - lastY.current;
        if (delta > downThreshold) setDirection('down');
        else if (delta < -upThreshold) setDirection('up');

        lastY.current = y;
        raf.current = null;
      });
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [downThreshold, upThreshold]);

  return { direction, isAtTop };
}
