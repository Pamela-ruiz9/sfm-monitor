// app/src/stores/drawerState.ts
import { atom } from 'nanostores';
import { getIndicator, type IndicatorId } from '~/data/indicators';

export const $drawerIndicator = atom<IndicatorId | null>(null);

function syncFromUrl(): void {
  if (typeof window === 'undefined') return;
  const params = new URLSearchParams(window.location.search);
  const id = params.get('indicator');
  if (!id) {
    $drawerIndicator.set(null);
    return;
  }
  const indicator = getIndicator(id);
  if (!indicator && import.meta.env['DEV']) {
    console.warn(
      `[drawerState] Unknown indicator id "${id}" in URL. ` +
        `Check ~/data/indicators.ts for valid ids.`,
    );
  }
  $drawerIndicator.set(indicator ? indicator.id : null);
}

export function openDrawer(id: IndicatorId): void {
  if (typeof window === 'undefined') return;
  const url = new URL(window.location.href);
  url.searchParams.set('indicator', id);
  history.pushState(null, '', url.toString());
  $drawerIndicator.set(id);
}

export function closeDrawer(): void {
  if (typeof window === 'undefined') return;
  const url = new URL(window.location.href);
  url.searchParams.delete('indicator');
  history.pushState(null, '', url.toString());
  $drawerIndicator.set(null);
}

if (typeof window !== 'undefined') {
  syncFromUrl();
  window.addEventListener('popstate', syncFromUrl);
  document.addEventListener('astro:after-swap', syncFromUrl);
}
