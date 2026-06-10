import { useStore } from '@nanostores/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect } from 'react';
import { $sidebarCollapsed } from '~/stores/sidebarState';

export function SidebarToggle() {
  const collapsed = useStore($sidebarCollapsed);

  useEffect(() => {
    const shell = document.getElementById('app-shell');
    const sidebar = document.querySelector<HTMLElement>('[data-sidebar]');
    const val = String(collapsed);
    shell?.setAttribute('data-collapsed', val);
    sidebar?.setAttribute('data-collapsed', val);
  }, [collapsed]);

  return (
    <button
      type="button"
      onClick={() => $sidebarCollapsed.set(!collapsed)}
      aria-label={collapsed ? 'Expandir sidebar' : 'Colapsar sidebar'}
      className="flex items-center justify-center size-7 rounded-md text-(--color-text-mute) hover:text-(--color-text) hover:bg-(--color-bg-elev-2) transition-colors focus-visible:outline-2 focus-visible:outline-(--color-accent)"
    >
      {collapsed
        ? <ChevronRight className="size-4" aria-hidden="true" />
        : <ChevronLeft className="size-4" aria-hidden="true" />
      }
    </button>
  );
}
