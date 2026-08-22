'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

export default function NavigationProgressBar() {
  const pathname = usePathname();
  const [isNavigating, setIsNavigating] = useState(false);
  const [progress, setProgress] = useState(0);

  // Reset navigation state whenever route finishes changing
  useEffect(() => {
    setIsNavigating(false);
    setProgress(100);
    const timer = setTimeout(() => {
      setProgress(0);
    }, 250);
    return () => clearTimeout(timer);
  }, [pathname]);

  // Intercept click on internal links to start progress bar instantly
  useEffect(() => {
    const handleLinkClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest('a');
      if (!target) return;

      const href = target.getAttribute('href');
      if (
        href &&
        href.startsWith('/') &&
        !href.startsWith('/api') &&
        !target.getAttribute('target') &&
        href !== pathname
      ) {
        setIsNavigating(true);
        setProgress(30);

        // Animate up smoothly
        const interval = setInterval(() => {
          setProgress((prev) => {
            if (prev >= 85) {
              clearInterval(interval);
              return 85;
            }
            return prev + Math.random() * 15;
          });
        }, 150);

        setTimeout(() => clearInterval(interval), 3000);
      }
    };

    document.addEventListener('click', handleLinkClick, { capture: true });
    return () => document.removeEventListener('click', handleLinkClick, { capture: true });
  }, [pathname]);

  if (progress === 0 && !isNavigating) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 h-1 pointer-events-none overflow-hidden bg-transparent">
      <div
        className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 transition-all duration-200 ease-out shadow-[0_0_12px_rgba(16,185,129,0.8)]"
        style={{
          width: `${progress}%`,
          opacity: progress === 100 ? 0 : 1,
          transition: progress === 100 ? 'opacity 0.25s ease, width 0.1s ease' : 'width 0.2s ease',
        }}
      />
    </div>
  );
}
