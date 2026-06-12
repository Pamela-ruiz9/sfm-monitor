import type { APIRoute } from 'astro';
import { loadSfmData } from '~/data/loader';

export const GET: APIRoute = () => {
  const data = loadSfmData();
  const sofipos = data.sofipos;

  const payload = {
    updated: data.ultima_actualizacion,
    fechas: sofipos.fechas,
    series: {
      imor_total: sofipos.imor_total,
      imora_total: sofipos.imora_total,
      roa: sofipos.roa,
      roe: sofipos.roe,
    },
    ...(sofipos.ultima !== undefined
      ? {
          ultima: {
            fecha: sofipos.ultima.fecha,
            imor_total: sofipos.ultima.imor_total,
            imora_total: sofipos.ultima.imora_total,
            roa: sofipos.ultima.roa,
            roe: sofipos.ultima.roe,
          },
        }
      : {}),
  };

  return new Response(JSON.stringify(payload, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
