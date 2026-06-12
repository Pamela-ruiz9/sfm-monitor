import type { APIRoute } from 'astro';
import { loadSfmData } from '~/data/loader';

export const GET: APIRoute = () => {
  const data = loadSfmData();

  // Build optional macro fields conditionally to satisfy exactOptionalPropertyTypes
  const optionalMacro: {
    igae?: { actual: number | null; fecha: string | null; historico?: { fecha: string; valor: number }[] };
    pib?: { actual: number | null; fecha: string | null };
    desempleo?: { actual: number | null; fecha: string | null };
    remesas?: { actual: number | null; fecha: string | null; historico?: { fecha: string; valor: number }[] };
  } = {
    ...(data.macro?.igae !== undefined
      ? {
          igae: {
            actual: data.macro.igae.actual,
            fecha: data.macro.igae.fecha,
            ...(data.macro.igae.historico !== undefined
              ? { historico: data.macro.igae.historico }
              : {}),
          },
        }
      : {}),
    ...(data.macro?.pib !== undefined
      ? { pib: { actual: data.macro.pib.actual, fecha: data.macro.pib.fecha } }
      : {}),
    ...(data.macro?.desempleo !== undefined
      ? { desempleo: { actual: data.macro.desempleo.actual, fecha: data.macro.desempleo.fecha } }
      : {}),
    ...(data.macro?.remesas !== undefined
      ? {
          remesas: {
            actual: data.macro.remesas.actual,
            fecha: data.macro.remesas.fecha,
            ...(data.macro.remesas.historico !== undefined
              ? { historico: data.macro.remesas.historico }
              : {}),
          },
        }
      : {}),
  };

  const reservasField: {
    reservas?: { actual: number | null; fecha: string | null };
  } = {
    ...(data.mercado?.reservas_internacionales !== undefined
      ? {
          reservas: {
            actual: data.mercado.reservas_internacionales.actual,
            fecha: data.mercado.reservas_internacionales.fecha,
          },
        }
      : {}),
  };

  const payload = {
    updated: data.ultima_actualizacion,
    tipo_cambio: {
      actual: data.tipo_cambio.actual,
      fecha: data.tipo_cambio.fecha,
      historico_mensual: data.tipo_cambio.historico_mensual,
    },
    tasa_banxico: {
      actual: data.tasa_banxico.actual,
      fecha: data.tasa_banxico.fecha,
      historico: data.tasa_banxico.historico.map((pt) => ({
        fecha: pt.fecha,
        valor: pt.valor,
      })),
    },
    inflacion: {
      actual: data.inflacion.actual,
      fecha: data.inflacion.fecha,
      historico_mensual: data.inflacion.historico_mensual,
    },
    ...optionalMacro,
    ...reservasField,
  };

  return new Response(JSON.stringify(payload, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
