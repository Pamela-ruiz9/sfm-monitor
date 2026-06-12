import type { APIRoute } from 'astro';
import { loadSfmData } from '~/data/loader';
import { computeScore } from '~/data/score';
import type { SfmScore } from '~/data/score';

export const GET: APIRoute = () => {
  const data = loadSfmData();
  const score: SfmScore = computeScore(data);

  const payload: { updated: string } & SfmScore = {
    updated: data.ultima_actualizacion,
    ...score,
  };

  return new Response(JSON.stringify(payload, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
