export interface GlossaryEntry {
  term: string;
  short: string;   // definicion en 1 linea para el tooltip
  full?: string;   // descripcion mas larga para uso futuro
}

export const GLOSSARY: Record<string, GlossaryEntry> = {
  imor: {
    term: 'IMOR',
    short: 'Indice de Morosidad: cartera vencida / cartera total. Umbral de alerta: >3.5%.',
    full: 'Mide que proporcion de los prestamos no se estan pagando. Una IMOR alta indica deterioro crediticio del sistema.',
  },
  imora: {
    term: 'IMORA',
    short: 'IMOR Ajustado: incluye castigos de los ultimos 12 meses. Mas conservador que IMOR.',
    full: 'Corrige el IMOR por los creditos que ya fueron castigados (dados de baja del balance). Siempre mayor o igual que IMOR.',
  },
  icor: {
    term: 'ICOR',
    short: 'Indice de Cobertura: reservas de perdida / cartera vencida. Minimo sano: >1x.',
    full: 'Indica si el banco tiene suficientes reservas para cubrir su cartera mala. Un ICOR < 1x es senal de alerta.',
  },
  icap: {
    term: 'ICAP',
    short: 'Indice de Capitalizacion: capital neto / activos ponderados por riesgo. Minimo regulatorio: 10.5%.',
    full: 'Mide la capacidad del banco para absorber perdidas. El regulador (CNBV) exige minimo 10.5% mas colchones adicionales para D-SIBs.',
  },
  ifrs9: {
    term: 'IFRS 9',
    short: 'Norma contable que clasifica creditos en 3 etapas segun su probabilidad de default.',
    full: 'Etapa 1: creditos sanos. Etapa 2: deterioro significativo (mayor reserva requerida). Etapa 3: creditos en default.',
  },
  tiie: {
    term: 'TIIE',
    short: 'Tasa de Interes Interbancaria de Equilibrio. Referencia del mercado de dinero en Mexico.',
    full: 'La TIIE de Fondeo sustituyo a la TIIE 28d como referencia principal en 2024. Se usa para fijar tasas de creditos variables.',
  },
  cetes: {
    term: 'Cetes 28d',
    short: 'Certificados de la Tesoreria a 28 dias. Tasa libre de riesgo de corto plazo en Mexico.',
  },
  fix: {
    term: 'FIX',
    short: 'Tipo de cambio MXN/USD determinado por Banxico al cierre del dia habil anterior.',
    full: 'Es el tipo de cambio oficial para obligaciones denominadas en dolares pagaderas en Mexico.',
  },
  roa: {
    term: 'ROA',
    short: 'Retorno sobre Activos: utilidad neta / activos totales. Mide la rentabilidad bancaria.',
  },
  roe: {
    term: 'ROE',
    short: 'Retorno sobre Capital: utilidad neta / capital contable. Mide el retorno para accionistas.',
  },
  sofipo: {
    term: 'SoFiPO',
    short: 'Sociedad Financiera Popular. Entidades de microfinanzas supervisadas por CNBV en Mexico.',
    full: 'Las SoFiPOs atienden a segmentos no bancarizados con creditos de consumo y vivienda. Su IMOR es significativamente mayor que el de banca multiple (~9-10% vs ~2-3%).',
  },
};
