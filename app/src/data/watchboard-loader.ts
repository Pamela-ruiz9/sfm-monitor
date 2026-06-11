// Build-time loader for data/watchboard-events.json — updated daily by update-watchboard.yml.
// Zod strips unknown fields; we only expose the shapes we actually consume.
import { z } from 'zod';
import rawData from '../../../data/watchboard-events.json';

const WbSourceSchema = z.object({
  name: z.string(),
  url: z.string(),
  tier: z.number(),
  pole: z.string(),
});

const WbEventSchema = z.object({
  id: z.string(),
  date: z.string(),
  title: z.string(),
  type: z.string(),
  sources: z.array(WbSourceSchema).default([]),
});

const WbKpiSchema = z.object({
  id: z.string(),
  label: z.string(),
  value: z.string(),
  color: z.string(),
  delta: z.string().optional(),
});

const TrackerDataSchema = z.object({
  events: z.array(WbEventSchema).default([]),
  kpis: z.array(WbKpiSchema).optional(),
});

const WatchboardDataSchema = z.object({
  updated: z.string(),
  trackers: z.record(z.string(), TrackerDataSchema),
});

export type WbSource = z.infer<typeof WbSourceSchema>;
export type WbEvent = z.infer<typeof WbEventSchema>;
export type WbKpi = z.infer<typeof WbKpiSchema>;

let cached: z.infer<typeof WatchboardDataSchema> | null = null;

function load(): z.infer<typeof WatchboardDataSchema> {
  if (cached) return cached;
  const result = WatchboardDataSchema.safeParse(rawData);
  if (!result.success) {
    throw new Error(`watchboard-events.json schema error: ${result.error.message}`);
  }
  cached = result.data;
  return cached;
}

export function getWatchboardUpdated(): string {
  return load().updated;
}

export function getTrackerEvents(slug: string): WbEvent[] {
  return load().trackers[slug]?.events ?? [];
}

export function getTrackerKpis(slug: string): WbKpi[] {
  return load().trackers[slug]?.kpis ?? [];
}
