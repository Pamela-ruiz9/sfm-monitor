import { Command } from 'cmdk';
import { useEffect, useState } from 'react';
import { Search, ArrowRight } from 'lucide-react';
import { INDICATORS, searchIndicators } from '~/data/indicators';
import { openDrawer } from '~/stores/drawerState';

export function CmdKPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === 'Escape') setOpen(false);
    }
    function onClick(e: MouseEvent) {
      const target = (e.target as HTMLElement | null)?.closest('[data-cmdk-trigger]');
      if (target) {
        e.preventDefault();
        setOpen(true);
      }
    }
    document.addEventListener('keydown', onKey);
    document.addEventListener('click', onClick);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('click', onClick);
    };
  }, []);

  if (!open) return null;

  const results = query.trim() ? searchIndicators(query) : INDICATORS.slice(0, 6);

  return (
    <div
      className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-start justify-center pt-[10vh] px-4"
      onClick={() => setOpen(false)}
      role="presentation">
      <Command
        label="Buscar indicador"
        className="w-full max-w-lg card-surface overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        shouldFilter={false}>
        <div className="flex items-center gap-2 border-b border-[--color-border] px-4">
          <Search className="size-4 text-[--color-text-mute]" aria-hidden="true" />
          <Command.Input
            value={query}
            onValueChange={setQuery}
            placeholder="Buscar IMOR, FX, SF43718…"
            className="flex-1 bg-transparent border-none py-3 text-sm text-[--color-text] placeholder-[--color-text-mute] focus:outline-none"
            autoFocus
          />
          <kbd className="text-[10px] mono px-1.5 py-0.5 rounded bg-[--color-bg-elev-2] border border-[--color-border-soft] text-[--color-text-dim]">
            esc
          </kbd>
        </div>
        <Command.List className="max-h-80 overflow-y-auto py-1">
          <Command.Empty className="px-4 py-6 text-sm text-[--color-text-mute] text-center">
            Sin resultados. Quizás: IMOR · FX · Tasa Banxico · Inflación
          </Command.Empty>
          {results.map((i) => (
            <Command.Item
              key={i.id}
              value={i.id}
              onSelect={() => {
                openDrawer(i.id);
                setOpen(false);
                setQuery('');
              }}
              className="flex items-center justify-between gap-3 px-4 py-2 mx-1 rounded-md text-sm cursor-pointer text-[--color-text-dim] data-[selected=true]:bg-[--color-bg-elev-2] data-[selected=true]:text-[--color-text]">
              <div className="flex flex-col min-w-0">
                <span className="truncate">{i.label}</span>
                {i.refCode && (
                  <span className="mono text-[10px] text-[--color-text-mute]">
                    {i.refCode} · {i.tab}
                  </span>
                )}
              </div>
              <ArrowRight className="size-3 text-[--color-text-mute] flex-shrink-0" />
            </Command.Item>
          ))}
        </Command.List>
      </Command>
    </div>
  );
}
