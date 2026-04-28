import { useDrag } from '@use-gesture/react';
import { useEffect } from 'react';
import { useStore } from '@nanostores/react';
import { $activeTab, adjacentTab, tabPath } from '~/stores/activeTab';
import { $drawerIndicator } from '~/stores/drawerState';

export function SwipeNav() {
  const tab = useStore($activeTab);
  const drawerOpen = useStore($drawerIndicator);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (drawerOpen) return; // Drawer handles its own swipe

    let startX = 0;
    let startY = 0;
    let startTime = 0;

    function start(e: TouchEvent) {
      const t = e.touches[0]!;
      startX = t.clientX;
      startY = t.clientY;
      startTime = Date.now();
    }
    function end(e: TouchEvent) {
      const t = e.changedTouches[0]!;
      const dx = t.clientX - startX;
      const dy = t.clientY - startY;
      const dt = Date.now() - startTime;
      if (dt > 600) return;
      if (Math.abs(dx) < 50) return;
      if (Math.abs(dy) > 30) return;
      const next = adjacentTab(tab, dx < 0 ? 'next' : 'prev');
      if (next) {
        window.location.href = tabPath(next);
      }
    }

    document.addEventListener('touchstart', start, { passive: true });
    document.addEventListener('touchend', end, { passive: true });
    return () => {
      document.removeEventListener('touchstart', start);
      document.removeEventListener('touchend', end);
    };
  }, [tab, drawerOpen]);

  // useDrag is imported but unused here intentionally — kept for future
  // pointer-event gesture refinement when we add visual feedback during drag.
  void useDrag;
  return null;
}
