// app/src/stores/terminalMode.ts
import { persistentAtom } from '@nanostores/persistent';

/**
 * Power-user "Terminal mode" toggle (UI control deferred to v0.3.0).
 * Persisted across sessions via localStorage so future code can read it.
 */
export const $terminalMode = persistentAtom<'on' | 'off'>(
  'sfm-terminal-mode',
  'off',
);
