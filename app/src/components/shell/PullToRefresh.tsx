import { useEffect, useRef, useState } from 'react';
import { RotateCw } from 'lucide-react';

const THRESHOLD = 80;

export function PullToRefresh() {
  const [pulling, setPulling] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const pullingRef = useRef(0);
  const startYRef = useRef(0);
  const activeRef = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    function start(e: TouchEvent) {
      if (window.scrollY > 0) return;
      const t = e.touches[0]!;
      startYRef.current = t.clientY;
      activeRef.current = true;
    }
    function move(e: TouchEvent) {
      if (!activeRef.current) return;
      const t = e.touches[0]!;
      const dy = t.clientY - startYRef.current;
      if (dy <= 0) return;
      const next = Math.min(dy, THRESHOLD * 1.5);
      pullingRef.current = next;
      setPulling(next);
    }
    function end() {
      if (!activeRef.current) return;
      activeRef.current = false;
      if (pullingRef.current >= THRESHOLD) {
        setRefreshing(true);
        setPulling(THRESHOLD);
        setTimeout(() => window.location.reload(), 200);
      } else {
        pullingRef.current = 0;
        setPulling(0);
      }
    }

    document.addEventListener('touchstart', start, { passive: true });
    document.addEventListener('touchmove', move, { passive: true });
    document.addEventListener('touchend', end, { passive: true });
    return () => {
      document.removeEventListener('touchstart', start);
      document.removeEventListener('touchmove', move);
      document.removeEventListener('touchend', end);
    };
  }, []); // empty deps — listeners attached once, refs hold mutable state

  if (pulling === 0 && !refreshing) return null;

  const ready = pulling >= THRESHOLD;

  return (
    <div
      className="lg:hidden fixed top-14 inset-x-0 z-30 flex justify-center pointer-events-none"
      style={{
        transform: `translateY(${pulling - THRESHOLD}px)`,
        opacity: Math.min(pulling / THRESHOLD, 1),
        transition: refreshing ? 'transform 0.2s' : 'none',
      }}>
      <div
        className="card-surface px-3 py-1.5 inline-flex items-center gap-2 text-xs text-[--color-text-dim]">
        <RotateCw
          className={`size-3 text-[--color-gold] ${refreshing || ready ? 'animate-spin' : ''}`}
        />
        {refreshing ? 'Actualizando…' : ready ? 'Soltar para actualizar' : 'Tirar para actualizar'}
      </div>
    </div>
  );
}
