export interface GlossaryEntry {
  term: string;
  short: string;         // 1-line definition for tooltip hover
  full?: string;         // longer definition for MetricInfo accordion
  formula?: string;      // plain-text formula
  threshold?: string;    // healthy range / alert threshold
  source?: string;       // regulatory / data source
}

export const GLOSSARY: Record<string, GlossaryEntry> = {
  imor: {
    term: 'IMOR',
    short: 'Indice de Morosidad: cartera vencida / cartera total. Umbral de alerta: >3.5%.',
    full: 'Mide qué proporción de los préstamos no se están pagando. Una IMOR alta indica deterioro crediticio del sistema. Se eleva en recesiones, tras shocks de ingreso y en ciclos de sobre-endeudamiento.',
    formula: 'Cartera Vencida ÷ Cartera Total × 100',
    threshold: 'Verde ≤ 3.5% · Alerta 3.5–4.5% · Crítico > 4.5%',
    source: 'CNBV Portafolio de Información, Sector 40 (concepto 40200017)',
  },
  imora: {
    term: 'IMORA',
    short: 'IMOR Ajustado: incluye castigos de los ultimos 12 meses. Mas conservador que IMOR.',
    full: 'Corrige el IMOR por los créditos que ya fueron castigados (dados de baja del balance en los últimos 12 meses). Siempre ≥ IMOR. Cuando IMORA >> IMOR, el banco está limpiando su cartera agresivamente vía castigos.',
    formula: '(Cartera Vencida + Castigos 12m) ÷ (Cartera Total + Castigos 12m) × 100',
    threshold: 'Verde ≤ 4.5% · Alerta 4.5–6% · Crítico > 6%',
    source: 'CNBV Portafolio de Información, Sector 40 (concepto 40200033)',
  },
  icor: {
    term: 'ICOR',
    short: 'Indice de Cobertura: reservas de perdida / cartera vencida. Minimo sano: >1x.',
    full: 'Indica si el banco tiene suficientes reservas (EPRC) para cubrir toda su cartera mala. Un ICOR < 1.0× significa que las reservas no alcanzan a cubrir la cartera vencida — señal de alerta de subcapitalización de pérdidas.',
    formula: 'EPRC ÷ Cartera Vencida  (EPRC = Estimaciones Preventivas para Riesgos Crediticios)',
    threshold: 'Crítico < 1.0× · Mínimo sano ≥ 1.0× · Banca MX sistema: ~2×',
    source: 'CNBV Portafolio de Información, Sector 40 (concepto 40200096)',
  },
  icap: {
    term: 'ICAP',
    short: 'Indice de Capitalizacion: capital neto / activos ponderados por riesgo. Minimo regulatorio: 10.5%.',
    full: 'Mide la capacidad del banco para absorber pérdidas inesperadas. Se calcula sobre activos ponderados por riesgo (crédito, mercado, operativo). Los D-SIBs designados por Banxico tienen un suplemento adicional de 0.6–1.5%.',
    formula: 'Capital Neto ÷ Activos Sujetos a Riesgo Total × 100',
    threshold: 'Mínimo regulatorio: 10.5% + suplemento D-SIB · Sistema MX: ~20%',
    source: 'CNBV CUB Art. 2 Bis 6 y Anexo 1-O · Basilea III (BIS BCBS)',
  },
  ifrs9: {
    term: 'IFRS 9',
    short: 'Norma contable que clasifica creditos en 3 etapas segun su probabilidad de default.',
    full: 'Estándar contable internacional adoptado por México en 2022 que reemplazó el modelo de pérdida incurrida por uno de pérdida esperada. Stage 1: créditos sanos (reserva = pérdida esperada 12m). Stage 2: aumento significativo de riesgo (reserva = pérdida esperada de vida). Stage 3: créditos en default (mismo que cartera vencida tradicional).',
    formula: 'Reserva = PD × LGD × EAD  (PD: probabilidad de default, LGD: pérdida dado default, EAD: exposición)',
    threshold: 'Stage 2 en tendencia ascendente > 3 trimestres consecutivos = señal de alerta sistémica',
    source: 'CNBV Reporte R12A · IASB IFRS 9 (2014) · CUB Anexo 33',
  },
  tiie: {
    term: 'TIIE 28d',
    short: 'Tasa de Interes Interbancaria de Equilibrio a 28 dias. Referencia del mercado de dinero en Mexico.',
    full: 'Tasa de referencia del mercado interbancario mexicano a 28 días. Determinada diariamente por Banxico a partir de cotizaciones de instituciones de crédito. La mayoría de los créditos variables (hipotecas, corporativos) están referenciados a TIIE. Sigue la tasa objetivo con un spread de ~20–50 pb.',
    formula: 'Determinada por subasta diaria Banxico — promedio de cotizaciones de al menos 6 bancos',
    threshold: 'Refleja la tasa objetivo Banxico más un spread de liquidez de ~20–50 pb',
    source: 'Banco de México, SIE, serie SF43783',
  },
  cetes: {
    term: 'Cetes 28d',
    short: 'Certificados de la Tesoreria a 28 dias. Tasa libre de riesgo de corto plazo en Mexico.',
    full: 'Instrumentos de deuda del gobierno federal a descuento, subastados semanalmente por Banxico. Son la tasa libre de riesgo de referencia en México y base para valuar instrumentos de renta fija.',
    formula: 'Rendimiento = (Valor Nominal − Precio) ÷ Precio × (360 ÷ Plazo) × 100',
    threshold: 'Referencia: spread TIIE−Cetes < 50 pb = mercado tranquilo; > 100 pb = tensión interbancaria',
    source: 'Banco de México, SIE, serie SF60633',
  },
  fix: {
    term: 'FIX',
    short: 'Tipo de cambio MXN/USD determinado por Banxico al cierre del dia habil anterior.',
    full: 'Es el tipo de cambio oficial para obligaciones denominadas en dólares pagaderas en México (DOF Art. 8 Ley Monetaria). Banxico lo publica alrededor de las 12:00 h cada día hábil. Diferente al tipo de cambio de mercado (interbancario) que fluctúa durante el día.',
    formula: 'Promedio ponderado de operaciones del mercado cambiario al mayoreo del día anterior',
    threshold: 'No hay umbral fijo; contexto histórico: COVID mar-2020 = $25.1, SVB mar-2023 = $19.2',
    source: 'Banco de México, SIE, serie SF43718 · DOF 22 oct 1996',
  },
  roa: {
    term: 'ROA',
    short: 'Retorno sobre Activos: utilidad neta / activos totales. Mide la rentabilidad bancaria.',
    full: 'Mide qué tan eficientemente un banco genera ganancias con sus activos. Un ROA bajo puede indicar márgenes comprimidos, alto costo de fondeo o elevadas reservas por cartera mala. Para banca múltiple en México, un ROA > 1.5% se considera saludable.',
    formula: 'Utilidad Neta (últimos 12m, anualizada) ÷ Activo Total Promedio × 100',
    threshold: 'Verde > 1.5% · Alerta 0.5–1.5% · Crítico < 0.5% (negativo = pérdida)',
    source: 'CNBV Portafolio de Información, Sector 40 (concepto 40200001)',
  },
  roe: {
    term: 'ROE',
    short: 'Retorno sobre Capital: utilidad neta / capital contable. Mide el retorno para accionistas.',
    full: 'Mide el retorno generado para los accionistas. Un ROE > costo de capital (aprox. 12–15% en México) destruye valor. A diferencia del ROA, el ROE puede inflarse con apalancamiento — por eso se analiza junto con el ICAP.',
    formula: 'Utilidad Neta (últimos 12m, anualizada) ÷ Capital Contable Promedio × 100',
    threshold: 'Verde > 12% · Alerta 5–12% · Crítico < 5% (negativo = pérdida para accionistas)',
    source: 'CNBV Portafolio de Información, Sector 40 (concepto 40200002)',
  },
  sofipo: {
    term: 'SoFiPO',
    short: 'Sociedad Financiera Popular. Entidades de microfinanzas supervisadas por CNBV en Mexico.',
    full: 'Las SoFiPOs atienden a segmentos no bancarizados (sector popular, rural) con créditos de consumo, vivienda y comercial. Supervisadas por CNBV bajo la Ley de Ahorro y Crédito Popular. Su IMOR estructuralmente mayor (~9–10%) refleja el perfil de riesgo de sus acreditados, no necesariamente una gestión deficiente.',
    threshold: 'IMOR de referencia SoFiPOs: ~8–12% (vs ~2–3% BM) · Alerta si supera 15%',
    source: 'CNBV Portafolio de Información, Sector 27',
  },
};
