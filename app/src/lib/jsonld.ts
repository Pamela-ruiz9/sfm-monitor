/**
 * JSON-LD structured data helpers for SFM Monitor.
 * Each indicator page gets a Dataset + WebPage markup.
 *
 * Reference: https://schema.org/Dataset
 */

const SITE_URL = 'https://pamela-ruiz9.github.io/sfm-monitor';
const DATA_URL = `${SITE_URL}/data/sfm-data.json`;
const LICENSE_CC = 'https://creativecommons.org/licenses/by/4.0/';
const LICENSE_MIT = 'https://opensource.org/licenses/MIT';
const CREATORS = [
  { '@type': 'Person', name: 'Ruiz Puga, Ingrid Pamela', affiliation: 'BBVA México' },
  { '@type': 'Person', name: 'Padilla, Artemio' },
];

export interface DatasetMeta {
  name: string;
  description: string;
  path: string;
  keywords?: string[];
  /** ISO date of last update, e.g. "2026-05-01" */
  dateModified?: string;
}

/** DataCatalog markup for the homepage */
export function catalogJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'DataCatalog',
    name: 'SFM Monitor — Monitor de Riesgo del Sistema Financiero Mexicano',
    description:
      'Dashboard público, citable y open source del riesgo del Sistema Financiero Mexicano. Agrega indicadores de crédito, mercado y contexto macro de Banxico, CNBV e INEGI.',
    url: SITE_URL,
    license: LICENSE_CC,
    creator: CREATORS,
    inLanguage: 'es',
    keywords: [
      'sistema financiero mexicano',
      'riesgo financiero',
      'IMOR',
      'IMORA',
      'ICOR',
      'IFRS 9',
      'Banxico',
      'CNBV',
      'open data',
    ],
    dataset: [
      { '@type': 'Dataset', name: 'Instituciones Financieras — Banca Múltiple y SoFiPOs', url: `${SITE_URL}/instituciones` },
      { '@type': 'Dataset', name: 'Riesgo de Mercado', url: `${SITE_URL}/riesgo` },
      { '@type': 'Dataset', name: 'Mercado de Dinero', url: `${SITE_URL}/mercado` },
    ],
  };
}

/** Dataset markup for a specific indicator page */
export function datasetJsonLd(meta: DatasetMeta) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    name: meta.name,
    description: meta.description,
    url: `${SITE_URL}${meta.path}`,
    license: LICENSE_CC,
    creator: CREATORS,
    inLanguage: 'es',
    ...(meta.dateModified ? { dateModified: meta.dateModified } : {}),
    keywords: [
      'sistema financiero mexicano',
      ...(meta.keywords ?? []),
    ],
    distribution: [
      {
        '@type': 'DataDownload',
        encodingFormat: 'application/json',
        contentUrl: DATA_URL,
      },
    ],
  };
}

/** SoftwareApplication markup (for README / repo root) */
export function softwareJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareSourceCode',
    name: 'SFM Monitor',
    description:
      'Dashboard open source del riesgo del Sistema Financiero Mexicano',
    url: 'https://github.com/Pamela-ruiz9/sfm-monitor',
    license: LICENSE_MIT,
    programmingLanguage: ['TypeScript', 'Astro', 'Python'],
    author: CREATORS,
    codeRepository: 'https://github.com/Pamela-ruiz9/sfm-monitor',
  };
}
