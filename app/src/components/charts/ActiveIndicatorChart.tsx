import { useState, useEffect } from 'react';
import { FXChart } from './FXChart';
import { TasaBanxicoChart } from './TasaBanxicoChart';
import { InflacionChart } from './InflacionChart';
import { MercadoDineroChart } from './MercadoDineroChart';
import { ReservasChart } from './ReservasChart';
import type { MonthlyPointT } from '~/data/schema';

type ChartIndicator =
  | 'fx'
  | 'tasa'
  | 'inflacion'
  | 'tiie'
  | 'cetes'
  | 'spread-tiie-cetes'
  | 'reservas';

interface RatePoint {
  fecha: string;
  valor: number;
}

interface InflPt {
  fecha: string;
  mes: string;
  valor: number;
}

export interface ActiveIndicatorChartProps {
  fxSeries: MonthlyPointT[];
  tasaSeries: RatePoint[];
  inflacionSeries: InflPt[];
  tiieHist: RatePoint[];
  cetesHist: RatePoint[];
  banxicoHist: RatePoint[];
  reservasHist: RatePoint[];
}

const CHART_IDS = new Set<string>([
  'fx', 'tasa', 'inflacion', 'tiie', 'cetes', 'spread-tiie-cetes', 'reservas',
]);

interface ChartMeta {
  eyebrow: string;
  title: string;
  description: string;
  source: string;
  refCode: string;
  tone: 'gold' | 'red' | 'yellow' | 'green';
}

const META: Record<ChartIndicator, ChartMeta> = {
  fx: {
    eyebrow: 'Riesgo de mercado',
    title: 'Tipo de cambio MXN/USD · histórico',
    description: 'Serie mensual desde 1994. Bandas verticales: crisis Tequila (1994-95), GFC (2008-09), COVID-19 (2020).',
    source: 'Banco de México, SIE, serie SF43718',
    refCode: 'SF43718',
    tone: 'gold',
  },
  tasa: {
    eyebrow: 'Política monetaria',
    title: 'Tasa objetivo Banxico',
    description: 'Decisiones de política monetaria — stepped, mantiene valor hasta la siguiente reunión de Junta de Gobierno.',
    source: 'Banco de México, SIE, serie SF61745',
    refCode: 'SF61745',
    tone: 'red',
  },
  inflacion: {
    eyebrow: 'Precios al consumidor',
    title: 'Inflación anual INPC',
    description: 'Variación anual del Índice Nacional de Precios al Consumidor. Objetivo Banxico: 3% ±1pp.',
    source: 'INEGI · Banco de México, SIE',
    refCode: 'SP1',
    tone: 'yellow',
  },
  tiie: {
    eyebrow: 'Tasas de referencia',
    title: 'TIIE Fondeo · Cetes 28d · Tasa Banxico',
    description: 'Superposición de las tres tasas del mercado de dinero. El spread TIIE-Cetes refleja la tensión interbancaria.',
    source: 'Banco de México, SIE · SF43783 (TIIE) · SF43936 (Cetes) · SF61745 (Banxico)',
    refCode: 'SF43783',
    tone: 'gold',
  },
  cetes: {
    eyebrow: 'Tasas de referencia',
    title: 'TIIE Fondeo · Cetes 28d · Tasa Banxico',
    description: 'Superposición de las tres tasas del mercado de dinero. Cetes 28d como referencia de renta fija de corto plazo.',
    source: 'Banco de México, SIE · SF43783 (TIIE) · SF43936 (Cetes) · SF61745 (Banxico)',
    refCode: 'SF43936',
    tone: 'gold',
  },
  'spread-tiie-cetes': {
    eyebrow: 'Tasas de referencia',
    title: 'TIIE Fondeo · Cetes 28d · Tasa Banxico',
    description: 'Spread TIIE-Cetes como indicador de tensión interbancaria. Refleja la transmisión de la política monetaria.',
    source: 'Banco de México, SIE · SF43783 (TIIE) · SF43936 (Cetes) · SF61745 (Banxico)',
    refCode: 'SF43783',
    tone: 'gold',
  },
  reservas: {
    eyebrow: 'Reservas internacionales',
    title: 'Evolución semanal — últimas 52 semanas',
    description: 'Activos internacionales del Banco de México. Cushion contra choques externos y señal de confianza en el peso.',
    source: 'Banco de México, SIE, serie SF43707',
    refCode: 'SF43707',
    tone: 'green',
  },
};

function getInitialIndicator(): ChartIndicator {
  if (typeof window === 'undefined') return 'fx';
  const id = new URLSearchParams(window.location.search).get('indicator');
  return (id && CHART_IDS.has(id) ? id : 'fx') as ChartIndicator;
}

export function ActiveIndicatorChart({
  fxSeries,
  tasaSeries,
  inflacionSeries,
  tiieHist,
  cetesHist,
  banxicoHist,
  reservasHist,
}: ActiveIndicatorChartProps) {
  const [active, setActive] = useState<ChartIndicator>(getInitialIndicator);
  const meta = META[active];

  useEffect(() => {
    const handleSelect = (e: Event) => {
      const id = (e as CustomEvent<{ indicatorId: string }>).detail.indicatorId;
      if (CHART_IDS.has(id)) setActive(id as ChartIndicator);
    };
    const handlePop = () => {
      const id = new URLSearchParams(window.location.search).get('indicator');
      if (id && CHART_IDS.has(id)) setActive(id as ChartIndicator);
    };
    document.addEventListener('sfm:kpi-select', handleSelect);
    window.addEventListener('popstate', handlePop);
    return () => {
      document.removeEventListener('sfm:kpi-select', handleSelect);
      window.removeEventListener('popstate', handlePop);
    };
  }, []);

  function renderChart() {
    switch (active) {
      case 'fx':
        return <FXChart series={fxSeries} />;
      case 'tasa':
        return <TasaBanxicoChart series={tasaSeries} />;
      case 'inflacion':
        return <InflacionChart series={inflacionSeries} />;
      case 'tiie':
      case 'cetes':
      case 'spread-tiie-cetes':
        return <MercadoDineroChart tiie={tiieHist} cetes={cetesHist} banxico={banxicoHist} />;
      case 'reservas':
        return <ReservasChart series={reservasHist} />;
    }
  }

  return (
    <section className="space-y-3 scroll-mt-24">
      <header className="flex items-baseline justify-between gap-3">
        <div className="space-y-1 min-w-0">
          <div className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[--color-gold]">
            {meta.eyebrow}
          </div>
          <h2 className="serif text-xl lg:text-2xl font-semibold text-[--color-text] leading-tight">
            {meta.title}
          </h2>
          <p className="text-sm leading-relaxed text-[--color-text-dim] max-w-3xl">
            {meta.description}
          </p>
        </div>
        <span className="mono text-[10px] text-[--color-text-mute] whitespace-nowrap">
          {meta.refCode}
        </span>
      </header>
      <div className="card-surface p-4" data-tone={meta.tone}>
        {renderChart()}
      </div>
      <p className="text-[11px] text-[--color-text-mute]">
        <span className="text-[--color-text-mute]/70">Fuente:</span>{' '}
        {meta.source}
      </p>
    </section>
  );
}
