// app/src/components/noticias/NoticiaCard.tsx
import { useState, useEffect, useRef } from 'react';
import type { EventImpact } from '~/data/watchboard-rules';
import { CATEGORY_CONFIG, DIRECTION_CONFIG, AXIS_LABEL } from '~/data/watchboard-rules';
import { ImpactoTable } from '~/components/noticias/ImpactoTable';

interface WbSource {
  name: string;
  url: string;
  tier: number;
  pole: string;
}

export interface NoticiaItem {
  id: string;
  date: string;
  title: string;
  type: string;
  sources: WbSource[];
  tracker: string;
  trackerEmoji: string;
  trackerColor: string;
  impact: EventImpact;
}

interface Props {
  item: NoticiaItem;
}

function useCardImage(sourceUrl: string | undefined) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sourceUrl) return;
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          observer.disconnect();
          fetch(
            `https://api.microlink.io/?url=${encodeURIComponent(sourceUrl)}&meta=true`,
          )
            .then((r) => r.json())
            .then((data: unknown) => {
              const url =
                data &&
                typeof data === 'object' &&
                'data' in data &&
                data.data &&
                typeof data.data === 'object' &&
                'image' in data.data &&
                data.data.image &&
                typeof data.data.image === 'object' &&
                'url' in data.data.image
                  ? (data.data.image.url as string)
                  : null;
              if (url) setImageUrl(url);
            })
            .catch(() => {});
        }
      },
      { rootMargin: '300px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [sourceUrl]);

  return { ref, imageUrl, setImageUrl };
}

function formatDate(iso: string): string {
  const d = new Date(`${iso}T12:00:00`);
  return d.toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function NoticiaCard({ item }: Props) {
  const [expanded, setExpanded] = useState(false);
  const sourceUrl = item.sources[0]?.url;
  const { ref, imageUrl, setImageUrl } = useCardImage(sourceUrl);
  const catCfg = CATEGORY_CONFIG[item.impact.category];
  const hasImpact = item.impact.axes.length > 0 || item.impact.mechanism !== '';

  return (
    <article
      className="rounded-lg overflow-hidden"
      style={{ border: '1px solid var(--color-border)', background: 'var(--color-bg-elev)' }}
    >
      {/* Image */}
      <div
        ref={ref}
        className="w-full"
        style={{ aspectRatio: '3/2', background: imageUrl ? 'transparent' : item.trackerColor + '22', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        {imageUrl ? (
          <img
            src={imageUrl}
            alt=""
            aria-hidden="true"
            className="w-full h-full"
            style={{ objectFit: 'cover', display: 'block' }}
            onError={() => setImageUrl(null)}
          />
        ) : (
          <span style={{ fontSize: '2.5rem' }}>{item.trackerEmoji}</span>
        )}
      </div>

      {/* Body */}
      <div className="p-2.5">
        {/* Category + meta */}
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <span
            className="text-[9px] font-semibold px-2 py-0.5 rounded-full border"
            style={{ background: catCfg.bg, color: catCfg.text, borderColor: catCfg.border }}
          >
            {catCfg.label.toUpperCase()}
          </span>
          <span className="text-[10px]" style={{ color: 'var(--color-text-mute)' }}>
            {formatDate(item.date)}
            {item.sources[0] && ` · ${item.sources[0].name}`}
          </span>
        </div>

        {/* Title */}
        <h3 className="text-xs font-semibold leading-snug mb-1.5" style={{ color: 'var(--color-text)' }}>
          {item.title}
        </h3>

        {/* Impact chips */}
        {item.impact.axes.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-1.5">
            {item.impact.axes.map((ai) => {
              const dir = DIRECTION_CONFIG[ai.direction];
              return (
                <span
                  key={ai.axis}
                  className="text-[8px] font-semibold px-1.5 py-0.5 rounded-full border"
                  style={{ background: dir.bg, color: dir.color, borderColor: dir.border }}
                >
                  {dir.symbol} {AXIS_LABEL[ai.axis]}
                </span>
              );
            })}
          </div>
        )}

        {/* Expand toggle */}
        {hasImpact && (
          <button
            onClick={() => setExpanded((v) => !v)}
            className="text-[10px] font-medium"
            style={{ color: 'var(--color-accent)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            {expanded ? '▾ Ocultar análisis' : '▸ Ver análisis completo →'}
          </button>
        )}

        {/* Expanded block */}
        {expanded && (
          <ImpactoTable
            mechanism={item.impact.mechanism}
            axes={item.impact.axes}
            {...(sourceUrl && { sourceUrl })}
          />
        )}
      </div>
    </article>
  );
}
