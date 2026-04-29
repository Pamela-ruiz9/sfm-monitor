import type { Indicator } from '~/data/indicators';

interface Props {
  indicator: Indicator;
}

export function DrawerMetadata({ indicator }: Props) {
  return (
    <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
      <dt className="text-[--color-text-mute] uppercase tracking-wider text-[10px] font-semibold col-span-2 mt-2">
        Metodología
      </dt>
      <dd className="col-span-2 text-[--color-text-dim] leading-relaxed">
        {indicator.description}
      </dd>

      <dt className="text-[--color-text-mute]">Fuente</dt>
      <dd className="text-[--color-text-dim]">{indicator.source}</dd>

      <dt className="text-[--color-text-mute]">Unidad</dt>
      <dd className="text-[--color-text-dim] mono">{indicator.unit}</dd>

      {indicator.refCode && (
        <>
          <dt className="text-[--color-text-mute]">Código serie</dt>
          <dd className="text-[--color-text-dim] mono">{indicator.refCode}</dd>
        </>
      )}

      <dt className="text-[--color-text-mute]">Sección</dt>
      <dd className="text-[--color-text-dim] capitalize">{indicator.tab}</dd>
    </dl>
  );
}
