import { persistentAtom } from '@nanostores/persistent';

export const $sidebarCollapsed = persistentAtom<boolean>('sfm-sidebar-collapsed', false, {
  encode: JSON.stringify,
  decode: JSON.parse,
});
