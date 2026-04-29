import { useStore } from '@nanostores/react';
import { useEffect } from 'react';
import { Drawer } from 'vaul';
import { X } from 'lucide-react';
import { $drawerIndicator, closeDrawer, openDrawer } from '~/stores/drawerState';
import { getIndicator, type IndicatorId } from '~/data/indicators';
import { DrawerMetadata } from './DrawerMetadata';
import { DrawerExport } from './DrawerExport';

export function ChartDrawer() {
  const id = useStore($drawerIndicator);
  const indicator = id ? getIndicator(id) : undefined;
  const open = !!indicator;

  // Wire data-drawer-trigger anchors so they intercept and open the drawer
  // instead of navigating away.
  useEffect(() => {
    function onClick(e: MouseEvent) {
      const target = (e.target as HTMLElement | null)?.closest<HTMLElement>(
        '[data-drawer-trigger]',
      );
      if (!target) return;
      const triggerId = target.dataset['drawerTrigger'] as IndicatorId;
      if (!getIndicator(triggerId)) return;
      e.preventDefault();
      openDrawer(triggerId);
    }
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  return (
    <Drawer.Root
      open={open}
      onOpenChange={(o) => {
        if (!o) closeDrawer();
      }}
      shouldScaleBackground={false}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" />
        <Drawer.Content
          className="fixed bottom-0 left-0 right-0 z-50 mt-24 flex h-[88vh] flex-col rounded-t-2xl border-t border-[--color-border] bg-[--color-bg-elev] focus:outline-none"
          aria-describedby={undefined}>
          <div className="mx-auto mt-3 h-1.5 w-12 flex-shrink-0 rounded-full bg-[--color-border]" />
          {indicator ? (
            <div className="flex-1 overflow-y-auto px-5 pb-8 pt-4">
              <div className="flex items-start justify-between gap-3 mb-4">
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[--color-gold]">
                    {indicator.tab}
                  </div>
                  <Drawer.Title className="serif text-2xl font-semibold text-[--color-text] leading-tight mt-1">
                    {indicator.label}
                  </Drawer.Title>
                </div>
                <button
                  onClick={closeDrawer}
                  className="p-2 rounded-md text-[--color-text-mute] hover:text-[--color-text] hover:bg-[--color-bg-elev-2]"
                  aria-label="Cerrar">
                  <X className="size-4" />
                </button>
              </div>

              {/*
                Chart area: full per-indicator chart routing in drawer is
                explicitly deferred to a follow-up sprint (after M2-M3 lands all
                9 chart components). For now show an attribution card so the
                drawer is functional and links back to the legacy chart view.
              */}
              <div className="card-surface p-6 mb-4 h-64 flex items-center justify-center text-sm text-[--color-text-mute] text-center">
                Vista detallada de {indicator.shortLabel} disponible en el
                <a
                  href="https://pamela-ruiz9.github.io/sfm-monitor/"
                  className="text-[--color-gold] hover:underline ml-1">
                  dashboard estable ↗
                </a>
                {' '}mientras se completa la migración.
              </div>

              <div className="space-y-4">
                <DrawerMetadata indicator={indicator} />
                <DrawerExport indicator={indicator} />
              </div>
            </div>
          ) : null}
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
