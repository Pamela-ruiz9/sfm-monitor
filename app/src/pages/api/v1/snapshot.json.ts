import type { APIRoute } from 'astro';
import { loadSfmData } from '~/data/loader';
import { computeScore } from '~/data/score';

export const GET: APIRoute = () => {
  const data = loadSfmData();
  const score = computeScore(data);

  const fechas = data.credito.historico_por_cartera.fechas;
  const periodo = fechas[fechas.length - 1] ?? 'N/D';

  const credito = {
    imor: {
      valor: data.credito.imor.actual,
      fecha: data.credito.imor.fecha,
      ...(data.credito.imor.semaforo !== undefined ? { semaforo: data.credito.imor.semaforo } : {}),
    },
    imora: {
      valor: data.credito.imora.actual,
      fecha: data.credito.imora.fecha,
      ...(data.credito.imora.semaforo !== undefined ? { semaforo: data.credito.imora.semaforo } : {}),
    },
    icor: {
      valor: data.credito.icor.actual,
      fecha: data.credito.icor.fecha,
      ...(data.credito.icor.semaforo !== undefined ? { semaforo: data.credito.icor.semaforo } : {}),
    },
    roa: { valor: data.credito.roa.actual, fecha: data.credito.roa.fecha },
    roe: { valor: data.credito.roe.actual, fecha: data.credito.roe.fecha },
  };

  const macro: {
    tipo_cambio: { valor: number; fecha: string };
    tasa_banxico: { valor: number; fecha: string };
    inflacion: { valor: number; fecha: string };
    igae?: { valor: number | null; fecha: string | null };
    pib?: { valor: number | null; fecha: string | null };
    desempleo?: { valor: number | null; fecha: string | null };
    remesas?: { valor: number | null; fecha: string | null };
  } = {
    tipo_cambio: { valor: data.tipo_cambio.actual, fecha: data.tipo_cambio.fecha },
    tasa_banxico: { valor: data.tasa_banxico.actual, fecha: data.tasa_banxico.fecha },
    inflacion: { valor: data.inflacion.actual, fecha: data.inflacion.fecha },
    ...(data.macro?.igae !== undefined
      ? { igae: { valor: data.macro.igae.actual, fecha: data.macro.igae.fecha } }
      : {}),
    ...(data.macro?.pib !== undefined
      ? { pib: { valor: data.macro.pib.actual, fecha: data.macro.pib.fecha } }
      : {}),
    ...(data.macro?.desempleo !== undefined
      ? { desempleo: { valor: data.macro.desempleo.actual, fecha: data.macro.desempleo.fecha } }
      : {}),
    ...(data.macro?.remesas !== undefined
      ? { remesas: { valor: data.macro.remesas.actual, fecha: data.macro.remesas.fecha } }
      : {}),
  };

  const sofiposUltima = data.sofipos.ultima;

  const payload = {
    updated: data.ultima_actualizacion,
    periodo,
    score: {
      value: score.value,
      label: score.label,
      color: score.color,
      subindices: score.subindices,
    },
    credito,
    macro,
    ...(sofiposUltima !== undefined
      ? {
          sofipos: {
            imor_total: sofiposUltima.imor_total,
            imora_total: sofiposUltima.imora_total,
            roa: sofiposUltima.roa,
            roe: sofiposUltima.roe,
            fecha: sofiposUltima.fecha,
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
