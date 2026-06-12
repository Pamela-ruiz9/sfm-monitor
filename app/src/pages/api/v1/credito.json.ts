import type { APIRoute } from 'astro';
import { loadSfmData } from '~/data/loader';

export const GET: APIRoute = () => {
  const data = loadSfmData();
  const hpc = data.credito.historico_por_cartera;

  const payload = {
    updated: data.ultima_actualizacion,
    fechas: hpc.fechas,
    series: {
      imor_total: hpc.imor_total,
      imora_total: hpc.imora_total,
      icor_total: hpc.icor_total,
      roa: hpc.roa,
      roe: hpc.roe,
      imor_comercial: hpc.imor_comercial,
      imor_consumo: hpc.imor_consumo,
      imor_vivienda: hpc.imor_vivienda,
      imor_tarjeta: hpc.imor_tarjeta,
    },
    actuals: {
      imor: { valor: data.credito.imor.actual, fecha: data.credito.imor.fecha },
      imora: { valor: data.credito.imora.actual, fecha: data.credito.imora.fecha },
      icor: { valor: data.credito.icor.actual, fecha: data.credito.icor.fecha },
      roa: { valor: data.credito.roa.actual, fecha: data.credito.roa.fecha },
      roe: { valor: data.credito.roe.actual, fecha: data.credito.roe.fecha },
    },
  };

  return new Response(JSON.stringify(payload, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
