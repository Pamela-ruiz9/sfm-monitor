import { useEffect, useState } from 'react';
import { useStore } from '@nanostores/react';
import { Share, X, Download } from 'lucide-react';
import { $visitCount, bumpVisitCount } from '~/stores/onboarding';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISS_KEY = 'sfm-install-dismissed';
const DISMISS_DAYS = 30;

function isIOS(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  if (/iPad|iPhone|iPod/.test(ua) && !(window as unknown as { MSStream?: unknown }).MSStream) {
    return true;
  }
  // iPad in desktop mode reports UA as Mac but has touch support
  if (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1) {
    return true;
  }
  return false;
}

function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as { standalone?: boolean }).standalone === true
  );
}

function dismissExpired(): boolean {
  if (typeof localStorage === 'undefined') return true;
  const ts = localStorage.getItem(DISMISS_KEY);
  if (!ts) return true;
  const ageDays = (Date.now() - Number(ts)) / (1000 * 60 * 60 * 24);
  return ageDays >= DISMISS_DAYS;
}

export function PWAInstallPrompt() {
  const visitCount = useStore($visitCount);
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIOS, setShowIOS] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    bumpVisitCount();
    if (isStandalone()) return;
    if (!dismissExpired()) {
      setDismissed(true);
      return;
    }

    function onPrompt(e: Event) {
      e.preventDefault();
      setInstallEvent(e as BeforeInstallPromptEvent);
    }
    window.addEventListener('beforeinstallprompt', onPrompt);

    if (isIOS() && Number(visitCount) >= 2) {
      setShowIOS(true);
    }

    return () => window.removeEventListener('beforeinstallprompt', onPrompt);
  }, []);

  function dismiss() {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    }
    setDismissed(true);
    setInstallEvent(null);
    setShowIOS(false);
  }

  async function install() {
    if (!installEvent) return;
    await installEvent.prompt();
    const choice = await installEvent.userChoice;
    if (choice.outcome === 'accepted' || choice.outcome === 'dismissed') {
      dismiss();
    }
  }

  if (dismissed) return null;
  if (Number(visitCount) < 2) return null;

  if (installEvent) {
    return (
      <div className="fixed bottom-24 lg:bottom-6 right-4 z-[65] max-w-xs card-surface p-4 shadow-lg">
        <button
          onClick={dismiss}
          aria-label="Descartar"
          className="absolute top-2 right-2 text-[--color-text-mute] hover:text-[--color-text]">
          <X className="size-3" />
        </button>
        <div className="flex items-center gap-2 mb-2">
          <Download className="size-4 text-[--color-gold]" />
          <span className="text-xs font-semibold uppercase tracking-wider text-[--color-gold]">
            Instalar app
          </span>
        </div>
        <p className="text-xs text-[--color-text-dim] mb-3 leading-relaxed">
          Acceso rápido sin abrir el navegador. Funciona offline.
        </p>
        <button
          onClick={install}
          className="w-full px-3 py-2 rounded-md bg-[--color-gold] text-[--color-bg] text-xs font-semibold hover:opacity-90">
          Instalar SFM Monitor
        </button>
      </div>
    );
  }

  if (showIOS) {
    return (
      <div className="fixed bottom-24 lg:bottom-6 right-4 z-[65] max-w-xs card-surface p-4 shadow-lg">
        <button
          onClick={dismiss}
          aria-label="Descartar"
          className="absolute top-2 right-2 text-[--color-text-mute] hover:text-[--color-text]">
          <X className="size-3" />
        </button>
        <div className="flex items-center gap-2 mb-2">
          <Share className="size-4 text-[--color-gold]" />
          <span className="text-xs font-semibold uppercase tracking-wider text-[--color-gold]">
            Instalar en iOS
          </span>
        </div>
        <ol className="text-xs text-[--color-text-dim] space-y-1.5 leading-relaxed">
          <li>1. Toca el botón <Share className="inline size-3" /> Compartir</li>
          <li>2. Selecciona "Añadir a pantalla de inicio"</li>
          <li>3. Confirma con "Añadir"</li>
        </ol>
      </div>
    );
  }

  return null;
}
