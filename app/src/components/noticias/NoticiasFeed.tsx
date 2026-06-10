// app/src/components/noticias/NoticiasFeed.tsx
import { useState, useEffect } from 'react';
import { applyRules } from '~/data/watchboard-rules';
import type { NoticiaCategory } from '~/data/watchboard-rules';
import { CATEGORY_CONFIG } from '~/data/watchboard-rules';
import { NoticiaCard } from '~/components/noticias/NoticiaCard';
import type { NoticiaItem } from '~/components/noticias/NoticiaCard';

interface WbEvent {
  id: string;
  date: string;
  title: string;
  type: string;
  sources: Array<{ name: string; url: string; tier: number; pole: string }>;
}

interface WbEventsResponse {
  events: WbEvent[];
}

const TRACKERS: Array<{
  slug: string;
  emoji: string;
  color: string;
  types?: string[];
}> = [
  { slug: 'global-recession-risk', emoji: '📉', color: '#e67e22' },
  { slug: 'sheinbaum-presidency',  emoji: '🇲🇽', color: '#006847', types: ['economic', 'political'] },
  { slug: 'trump-presidencies',    emoji: '🇺🇸', color: '#3c3b6e', types: ['trade', 'economic'] },
  { slug: 'mexico',                emoji: '🌮', color: '#ce1126', types: ['economic', 'market'] },
];

const ALL_CATEGORIES: Array<{ id: NoticiaCategory | 'all'; label: string }> = [
  { id: 'all', label: 'Todas' },
  { id: 'politica-monetaria', label: 'Política monetaria' },
  { id: 'fiscal', label: 'Fiscal' },
  { id: 'externa', label: 'Externa' },
  { id: 'sistemica', label: 'Sistémica' },
];

async function fetchTracker(t: typeof TRACKERS[number]): Promise<NoticiaItem[]> {
  const res = await fetch(
    `https://watchboard.dev/api/v1/events/${t.slug}.json`,
  );
  const data = (await res.json()) as WbEventsResponse;
  const events = data.events ?? [];

  return events
    .filter((e) => !t.types || t.types.includes(e.type))
    .map((e): NoticiaItem => ({
      id: `${t.slug}::${e.id}`,
      date: e.date,
      title: e.title,
      type: e.type,
      sources: e.sources ?? [],
      tracker: t.slug,
      trackerEmoji: t.emoji,
      trackerColor: t.color,
      impact: applyRules(e, t.slug),
    }));
}

export function NoticiasFeed() {
  const [items, setItems] = useState<NoticiaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [activeCategory, setActiveCategory] = useState<NoticiaCategory | 'all'>('all');

  useEffect(() => {
    Promise.allSettled(TRACKERS.map(fetchTracker))
      .then((results) => {
        const seen = new Set<string>();
        const all: NoticiaItem[] = [];

        for (const r of results) {
          if (r.status === 'fulfilled') {
            for (const item of r.value) {
              if (!seen.has(item.id)) {
                seen.add(item.id);
                all.push(item);
              }
            }
          }
        }

        all.sort((a, b) => b.date.localeCompare(a.date));
        setItems(all.slice(0, 40));
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  const filtered =
    activeCategory === 'all'
      ? items
      : items.filter((i) => i.impact.category === activeCategory);

  if (loading) {
    return (
      <div className="py-12 text-center text-sm" style={{ color: 'var(--color-text-mute)' }}>
        Cargando noticias…
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-12 text-center text-sm" style={{ color: 'var(--color-text-mute)' }}>
        No se pudo conectar con Watchboard. Intenta más tarde.
      </div>
    );
  }

  return (
    <div>
      {/* Category filter pills */}
      <div
        className="flex gap-2 overflow-x-auto pb-2 mb-4"
        style={{ scrollbarWidth: 'none' }}
        role="tablist"
        aria-label="Filtrar por categoría"
      >
        {ALL_CATEGORIES.map((cat) => {
          const isActive = activeCategory === cat.id;
          const catCfg =
            cat.id !== 'all' ? CATEGORY_CONFIG[cat.id as NoticiaCategory] : null;
          return (
            <button
              key={cat.id}
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveCategory(cat.id as NoticiaCategory | 'all')}
              className="shrink-0 text-[11px] font-semibold px-3 py-1 rounded-full border transition-colors"
              style={{
                background: isActive
                  ? catCfg?.bg ?? 'var(--color-accent)'
                  : 'transparent',
                color: isActive
                  ? catCfg?.text ?? '#fff'
                  : 'var(--color-text-mute)',
                borderColor: isActive
                  ? catCfg?.border ?? 'var(--color-accent)'
                  : 'var(--color-border)',
                cursor: 'pointer',
              }}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Feed */}
      {filtered.length === 0 ? (
        <p className="text-sm text-center py-8" style={{ color: 'var(--color-text-mute)' }}>
          No hay eventos en esta categoría.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filtered.map((item) => (
            <NoticiaCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
