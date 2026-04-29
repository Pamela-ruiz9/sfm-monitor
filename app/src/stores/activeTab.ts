// app/src/stores/activeTab.ts
import { atom } from 'nanostores';

export type TabId = 'resumen' | 'mercado' | 'credito' | 'sofipos' | 'macro' | 'metodologia';

const PATH_TO_TAB: Record<string, TabId> = {
  '/': 'resumen',
  '/mercado': 'mercado',
  '/credito': 'credito',
  '/sofipos': 'sofipos',
  '/macro': 'macro',
  '/metodologia': 'metodologia',
};

const TAB_TO_PATH: Record<TabId, string> = {
  resumen: '/',
  mercado: '/mercado',
  credito: '/credito',
  sofipos: '/sofipos',
  macro: '/macro',
  metodologia: '/metodologia',
};

function pathToTab(path: string): TabId {
  return PATH_TO_TAB[path] ?? 'resumen';
}

export const $activeTab = atom<TabId>(
  typeof window === 'undefined' ? 'resumen' : pathToTab(window.location.pathname),
);

export function tabPath(t: TabId): string {
  return TAB_TO_PATH[t];
}

export function adjacentTab(current: TabId, dir: 'next' | 'prev'): TabId | null {
  const order: TabId[] = ['resumen', 'mercado', 'credito', 'sofipos', 'macro', 'metodologia'];
  const idx = order.indexOf(current);
  const target = dir === 'next' ? idx + 1 : idx - 1;
  return order[target] ?? null;
}

if (typeof window !== 'undefined') {
  window.addEventListener('popstate', () => {
    $activeTab.set(pathToTab(window.location.pathname));
  });
  // Sync on Astro view transitions
  document.addEventListener('astro:after-swap', () => {
    $activeTab.set(pathToTab(window.location.pathname));
  });
}
