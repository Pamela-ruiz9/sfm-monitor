# Changelog

Todas las versiones notables de SFM Monitor se documentan en este archivo.

El formato sigue [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/) y este proyecto adhiere a [Semantic Versioning](https://semver.org/lang/es/):

- **MAJOR** si cambia el schema de `data/sfm-data.json` de forma incompatible
- **MINOR** si se añaden indicadores o features sin romper compatibilidad
- **PATCH** si solo se refrescan datos o se corrigen bugs

---

## [Sin publicar] — `0.2.0-dev`

### En curso (Astro 5 + React 19 migration, ver `docs/migration-astro.md`)
- ✅ M0 bootstrap: `app/` con Astro 5.16 + React 19.2 + TS strict + Tailwind v4 + Zod root schema
- ✅ M0 foundations: branded types (Percentage, BasisPoints, Currency, SeriesId), data loader con cache y fail-loud
- ✅ M1 parcial: 3 charts migradas (`FXChart`, `TasaBanxicoChart`, `InflacionChart`)
- 🔄 M1 pendiente: visual regression con Playwright `toHaveScreenshot()`
- 📋 M2: charts CNBV (IMOR histórico, IMOR por segmento, IMOR por banco G-7) + tabla virtualizada
- 📋 M3: IFRS 9 stacked area + SoFiPOs top 15
- 📋 M4: features citables (JSON-LD `Dataset`, `<CitationBox>`, glosario, OG dinámico)
- 📋 M5: cutover a `v0.2.0` siguiendo `docs/cutover.md` (gates G1-G7 deben estar ✅)

### Por hacer (no bloqueado por migración Astro)
- DOI persistente vía Zenodo — requiere paso manual (ver `docs/citability.md`)
- Pipeline CNBV CSV automatizado (R12A IFRS9, SoFiPOs R11)
- Integración Banxico API para inflación subyacente (SP74625)

---

## [0.1.0] — 2026-04-27

Primera versión etiquetada del dashboard. Snapshot del trabajo previo no versionado, congelado para ser citable como artefacto de partida antes de la migración a Astro.

### Añadido
- Dashboard `index.html` (HTML/CSS/JS estático) con 4 módulos: Riesgo de Crédito, Riesgo de Mercado, Contexto Macro, Comparativo SoFiPOs vs Banca Múltiple
- 9 charts con Chart.js 4 + chartjs-plugin-annotation
- Datos consolidados en `data/sfm-data.json` (Banxico + CNBV procesados)
- Datos crudos por institución en `raw-data/cnbv_indicadores.json`, `raw-data/sofipos_by_inst.json`, `raw-data/imor_historico.json`
- Catálogo CNBV Sector 40 en `data/Raw_data/cat_instituciones_40.csv`
- GitHub Action `update-data.yml` con cron diario L-V 8:00 AM CDMX para refrescar Banxico (FX SF43718, tasa SF61745, TIIE SF43783, INPC SP74625)
- Roadmap interactivo en `roadmap.html`
- Documentación estratégica en `docs/research/blueprint-2026.md` (212 líneas, blueprint integral de stack y metodología)
- Roadmaps tácticos en `docs/roadmap-contenido.md` y `docs/roadmap-infraestructura.md`
- Doble licenciamiento: código MIT (`LICENSE`), contenido y datos derivados CC-BY 4.0 (`LICENSE-CONTENT`)
- `CITATION.cff` con coautoría (Ingrid Pamela Ruiz Puga + Artemio Padilla)
- `JSON-LD Dataset` markup para indexación en Google Scholar y Google Dataset Search
- `.zenodo.json` con metadatos para registro de DOI persistente

### Indicadores cubiertos
- **Banca Múltiple (desde dic 2000)**: IMOR total y por segmento (comercial, consumo, vivienda, tarjeta), IMOR por banco G-7, IMORA, ICOR, ROA, ROE
- **IFRS 9 (desde ene 2022)**: distribución cartera por etapa 1/2/3
- **SoFiPOs (desde ene 2016)**: IMOR por institución y por segmento, ROA, IMORA — top 15 por activo
- **Mercado**: FX MXN/USD desde 1994 (Banxico SF43718), tasa objetivo Banxico (SF61745), TIIE 28d (SF43783)
- **Macro**: inflación anual calculada del INPC (SP74625)

### Notas de versionado
Esta versión se etiqueta como `0.1.0` (no `1.0.0`) porque:
- El stack es legacy (HTML estático monolítico de 3,300+ líneas) y será reemplazado en `0.2.0` por Astro
- Falta TypeScript strict, Zod schemas, branded types
- Falta cutover de pipeline a uv + Polars + Pandera + Pydantic v2
- Faltan integraciones de fuentes documentadas en blueprint: BIS credit-to-GDP, IMF FSI cross-country, INEGI BIE post-migración

`v1.0.0` se reservará para el dashboard ya migrado a Astro con las 7 features citables del blueprint completas (DOI, JSON-LD, citation generator, fichas metodológicas, glosario, status page, doble licencia).

[Sin publicar]: https://github.com/Pamela-ruiz9/sfm-monitor/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/Pamela-ruiz9/sfm-monitor/releases/tag/v0.1.0
