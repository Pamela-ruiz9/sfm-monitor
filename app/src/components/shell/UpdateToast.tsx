import { useEffect, useState } from 'react';
import { RotateCw, X } from 'lucide-react';

export function UpdateToast() {
  const [needsUpdate, setNeedsUpdate] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;
    let mounted = true;
    import('virtual:pwa-register').then(({ registerSW }) => {
      const updateSW = registerSW({
        onNeedRefresh() {
          if (mounted) setNeedsUpdate(true);
        },
      });
      (window as unknown as { __sfmUpdateSW?: typeof updateSW }).__sfmUpdateSW = updateSW;
    }).catch(() => {
      // virtual:pwa-register not available in some build modes — silently noop
    });
    return () => {
      mounted = false;
    };
  }, []);

  if (!needsUpdate) return null;

  return (
    <div className="fixed bottom-24 lg:bottom-6 left-1/2 -translate-x-1/2 z-[70] flex items-center gap-3 px-4 py-2.5 rounded-lg card-surface border-[--color-gold]/40 shadow-lg">
      <RotateCw className="size-4 text-[--color-gold]" aria-hidden="true" />
      <span className="text-xs text-[--color-text]">
        Nueva versión disponible
      </span>
      <button
        onClick={() => (window as unknown as { __sfmUpdateSW?: (n: boolean) => void }).__sfmUpdateSW?.(true)}
        className="text-xs text-[--color-gold] font-medium hover:underline">
        Refrescar
      </button>
      <button
        onClick={() => setNeedsUpdate(false)}
        aria-label="Descartar"
        className="text-[--color-text-mute] hover:text-[--color-text]">
        <X className="size-3" />
      </button>
    </div>
  );
}
