// app/src/components/noticias/ImpactoTable.tsx
import type { AxisImpact } from '~/data/watchboard-rules';
import { DIRECTION_CONFIG, AXIS_LABEL } from '~/data/watchboard-rules';

interface Props {
  mechanism: string;
  axes: AxisImpact[];
  sourceUrl?: string;
}

export function ImpactoTable({ mechanism, axes, sourceUrl }: Props) {
  return (
    <div className="mt-3 rounded-md p-3 text-[11px]" style={{ background: 'var(--color-bg)', borderTop: '1px solid var(--color-border-soft)' }}>
      <div className="text-[9px] font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--color-accent)' }}>
        Análisis de impacto en SFM
      </div>
      {mechanism && (
        <p className="mb-3 leading-relaxed" style={{ color: 'var(--color-text-dim)' }}>
          {mechanism}
        </p>
      )}
      {axes.length > 0 && (
        <table className="w-full mb-3" style={{ borderCollapse: 'collapse' }}>
          <thead>
            <tr className="text-[9px]" style={{ color: 'var(--color-text-mute)', borderBottom: '1px solid var(--color-border)' }}>
              <th className="text-left py-1 font-semibold">Eje SFM</th>
              <th className="text-center py-1 font-semibold">Dirección</th>
              <th className="text-right py-1 font-semibold">Horizonte</th>
            </tr>
          </thead>
          <tbody>
            {axes.map((ai) => {
              const dir = DIRECTION_CONFIG[ai.direction];
              return (
                <tr key={ai.axis} style={{ borderBottom: '1px solid var(--color-border-soft)' }}>
                  <td className="py-1" style={{ color: 'var(--color-text)' }}>
                    {AXIS_LABEL[ai.axis]}
                  </td>
                  <td className="text-center py-1 font-semibold" style={{ color: dir.color }}>
                    {dir.symbol} {ai.direction.charAt(0).toUpperCase() + ai.direction.slice(1)}
                  </td>
                  <td className="text-right py-1" style={{ color: 'var(--color-text-mute)' }}>
                    {ai.horizon}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
      {sourceUrl && (
        <a
          href={sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[10px] hover:underline"
          style={{ color: 'var(--color-accent)' }}
        >
          ↗ Leer artículo fuente
        </a>
      )}
    </div>
  );
}
