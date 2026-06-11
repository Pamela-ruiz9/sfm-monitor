// app/src/components/noticias/NoticiasFeed.tsx
import { useState } from 'react';
import type { NoticiaCategory } from '~/data/watchboard-rules';
import { CATEGORY_CONFIG } from '~/data/watchboard-rules';
import { NoticiaCard } from '~/components/noticias/NoticiaCard';
import type { NoticiaItem } from '~/components/noticias/NoticiaCard';

const ALL_CATEGORIES: Array<{ id: NoticiaCategory | 'all'; label: string }> = [
  { id: 'all', label: 'Todas' },
  { id: 'politica-monetaria', label: 'Política monetaria' },
  { id: 'fiscal', label: 'Fiscal' },
  { id: 'externa', label: 'Externa' },
  { id: 'sistemica', label: 'Sistémica' },
];

interface Props {
  initialItems: NoticiaItem[];
}

export function NoticiasFeed({ initialItems }: Props) {
  const [activeCategory, setActiveCategory] = useState<NoticiaCategory | 'all'>('all');

  const filtered =
    activeCategory === 'all'
      ? initialItems
      : initialItems.filter((i) => i.impact.category === activeCategory);

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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((item) => (
            <NoticiaCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
