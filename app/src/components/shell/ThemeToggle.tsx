import { useState } from 'react';
import { Sun, Moon } from 'lucide-react';

const STORAGE_KEY = 'sfm-theme';

function getInitialTheme(): 'dark' | 'light' {
  if (typeof window === 'undefined') return 'dark';
  return localStorage.getItem(STORAGE_KEY) === 'light' ? 'light' : 'dark';
}

interface Props {
  /** true = solo icono (móvil/header), false = icono + etiqueta (sidebar) */
  iconOnly?: boolean;
}

export function ThemeToggle({ iconOnly = false }: Props) {
  const [theme, setTheme] = useState<'dark' | 'light'>(getInitialTheme);

  const toggle = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem(STORAGE_KEY, next);
    document.documentElement.classList.toggle('light', next === 'light');
  };

  const isDark = theme === 'dark';
  const label = isDark ? 'Modo claro' : 'Modo oscuro';
  const Icon = isDark ? Sun : Moon;

  if (iconOnly) {
    return (
      <button
        type="button"
        onClick={toggle}
        aria-label={label}
        className="flex items-center justify-center size-8 rounded-md transition-colors hover:bg-(--color-bg-elev)"
        style={{ color: 'var(--color-text-mute)' }}
      >
        <Icon className="size-4" aria-hidden="true" />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      className="flex items-center gap-3 w-full px-3 py-2 mx-1 rounded-md transition-colors hover:bg-(--color-bg-elev) hover:text-(--color-text)"
      style={{ color: 'var(--color-text-mute)' }}
    >
      <Icon className="size-4 shrink-0" aria-hidden="true" />
      <span className="sidebar-label text-sm">{label}</span>
    </button>
  );
}
