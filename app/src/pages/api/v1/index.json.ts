import type { APIRoute } from 'astro';
import { loadSfmData } from '~/data/loader';

export const GET: APIRoute = () => {
  const data = loadSfmData();

  const payload = {
    name: 'SFM Monitor API',
    version: 'v1',
    updated: data.ultima_actualizacion,
    description:
      'Indicadores públicos del Sistema Financiero Mexicano. Datos CNBV-Banxico, actualizados diariamente.',
    endpoints: [
      {
        path: '/api/v1/snapshot.json',
        description: 'Valores actuales de todos los indicadores + score global',
      },
      {
        path: '/api/v1/score.json',
        description: 'Score compuesto de riesgo sistémico (percentil rolling)',
      },
      {
        path: '/api/v1/credito.json',
        description: 'Series históricas de crédito: IMOR, IMORA, ICOR, ROA, ROE',
      },
      {
        path: '/api/v1/macro.json',
        description: 'Series de tipo de cambio, tasa Banxico, inflación, IGAE',
      },
      {
        path: '/api/v1/sofipos.json',
        description: 'Indicadores de Sociedades Financieras Populares (SoFiPOs)',
      },
    ],
    source: 'https://github.com/Pamela-ruiz9/sfm-monitor',
    license: 'CC-BY 4.0',
    cite: 'Ruiz Puga, I.P. (2025). SFM Monitor. https://doi.org/10.5281/zenodo.20370914',
  };

  return new Response(JSON.stringify(payload, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
