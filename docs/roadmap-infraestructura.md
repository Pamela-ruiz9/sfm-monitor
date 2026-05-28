# Roadmap: Infraestructura & Deploy
> SFM Risk Monitor — Pamela-ruiz9/sfm-monitor  
> v2 — reordenado: citabilidad y frontend primero

## Principios

- **Costo total: ~$0/mes** — GitHub Pages + GitHub Actions + APIs gratuitas
- **Sin manejo de usuarios** — dashboard 100% estático e informativo
- **Centralización de datos:** pipeline Python en GH Actions → commitea JSONs → GitHub Pages los sirve
- **Los 7 elementos citables se implementan en Sprint 0** — cuestan 2 sprints al inicio, 6 meses si se retrofittean después

---

## Los 7 elementos citables — Sprint 0 obligatorio

> "La diferencia entre un proyecto hobby y uno citable son siete elementos que cuestan poco si se hacen desde el inicio."

| # | Elemento | Estado | Acción |
|---|---|---|---|
| 1 | DOI persistente vía Zenodo | ⏳ Pendiente | Conectar repo → crear release v1.0.0 |
| 2 | JSON-LD `Dataset` markup | ⏳ Pendiente | Una etiqueta `<script type="application/ld+json">` por página |
| 3 | `CITATION.cff` | ✅ Ya en repo | Actualizar nombre de autora a Pame Ruiz |
| 4 | Citation generator multi-formato | ⏳ Pendiente | Componente con APA / BibTeX / RIS |
| 5 | Fichas metodológicas type-safe | ⏳ Pendiente | Una ficha por indicador (fórmula, fuente, umbrales) |
| 6 | Status page automatizado | ⏳ Pendiente | Upptime en repo separado |
| 7 | Doble licenciamiento MIT + CC-BY 4.0 | ✅ Ya en repo | `LICENSE` + `LICENSE-CONTENT` subidos |

---

## SPRINT 0 — Citabilidad base + migración frontend
**Duración:** Semana 1  
**Por qué primero:** construir sobre el stack nuevo desde el inicio; los 7 elementos citables son imposibles de retrofittear bien

### 0.1 Zenodo + DOI

1. Ir a `zenodo.org` → Login con GitHub
2. Settings → GitHub → flip switch en `Pamela-ruiz9/sfm-monitor`
3. Reservar DOI antes del primer release
4. Crear release `v1.0.0` en GitHub → Zenodo asigna `10.5281/zenodo.XXXXXXX`
5. Actualizar `CITATION.cff` con el DOI
6. Badge en README: `[![DOI](https://zenodo.org/badge/DOI/...svg)](https://doi.org/...)`

### 0.2 Migración frontend a Astro 5

**Por qué ahora y no después:** si migramos en Fase 2, todo el trabajo de fichas metodológicas, JSON-LD, citation generator y heatmap se hace dos veces. Hacerlo en el stack correcto desde el inicio ahorra 4-6 semanas.

```bash
# Bootstrap
npm create astro@latest sfm-astro -- --template minimal
cd sfm-astro
npx astro add react tailwind
npx shadcn@latest init

# Deploy inmediato a Cloudflare Pages (gratis, bandwidth ilimitado)
# Conectar repo en dash.cloudflare.com → Pages → Connect to Git
```

**Stack final:**
- Astro 5 + React 19 + TypeScript strict
- Tailwind CSS v4 (motor Rust, 100x más rápido en HMR)
- shadcn/ui para componentes base
- Cloudflare Pages (reemplaza GitHub Pages — sin límite de bandwidth)
- GitHub Pages se mantiene como mirror de respaldo

**Qué se migra del frontend actual:**
- `index.html` → layout Astro + páginas por sección
- Chart.js → se mantiene como fallback mientras se implementa ECharts
- `data/sfm-data.json` → se restructura en JSONs por dominio (ver Sprint 1)

### 0.3 JSON-LD Dataset markup

En cada página de indicador, dentro del `<head>`:

```json
{
  "@context": "https://schema.org",
  "@type": "Dataset",
  "name": "IMOR Banca Múltiple México",
  "description": "Índice de Morosidad de la Banca Múltiple...",
  "url": "https://sfm-monitor.pages.dev/indicadores/imor",
  "license": "https://creativecommons.org/licenses/by/4.0/",
  "creator": {"@type": "Person", "name": "Pame Ruiz"},
  "temporalCoverage": "2000-12-01/..",
  "distribution": [{
    "@type": "DataDownload",
    "encodingFormat": "application/json",
    "contentUrl": "https://sfm-monitor.pages.dev/data/cnbv_banca_multiple.json"
  }]
}
```

Homepage con `DataCatalog` agregando todos. Validar con Google Rich Results Test.

### 0.4 Fichas metodológicas (Astro Content Collections)

Una ficha MDX por indicador, type-safe con Zod schema:

```typescript
// src/content/config.ts
const indicators = defineCollection({
  schema: z.object({
    slug: z.string(),
    name: z.string(),
    question: z.string(), // "¿Cuántos préstamos no se están pagando?"
    formula: z.string(),  // KaTeX
    source: z.string(),   // "CNBV, Portafolio de Información, Sector 40"
    frequency: z.enum(['daily', 'weekly', 'monthly', 'quarterly']),
    threshold_alert: z.number(),
    threshold_critical: z.number(),
    regulatory_ref: z.string(), // "CUB Anexo 33, Art. 2 Bis 5"
    intl_comparison: z.string(), // diferencia con NPL ratio EBA/IMF
  })
})
```

Indicadores prioritarios para Fase 1: IMOR, IMORA, ICOR, ICAP, LCR, ROA, ROE, Tasa Banxico, FX, INPC.

### 0.5 Citation generator

Componente `<CitationBox />` con tabs:

```
APA 7:
Ruiz, P. (2026). SFM Risk Monitor [Conjunto de datos].
https://doi.org/10.5281/zenodo.XXXXXXX

BibTeX:
@dataset{sfm_risk_monitor_2026,
  author = {Ruiz, Pamela},
  title  = {SFM Risk Monitor},
  year   = {2026},
  doi    = {10.5281/zenodo.XXXXXXX}
}
```

### 0.6 Status page (Upptime)

Repo separado `Pamela-ruiz9/sfm-status`:
```yaml
# .upptimerc.yml
sites:
  - name: SFM Monitor
    url: https://sfm-monitor.pages.dev
  - name: Banxico SIE API
    url: https://www.banxico.org.mx/SieAPIRest/service/v1/series/SF43718/datos/oportuno
  - name: CNBV Portafolio
    url: https://portafolioinfo.cnbv.gob.mx
```

100% gratis, corre en GitHub Actions, genera badges y página pública.

---

## SPRINT 1 — Pipeline de datos robusto
**Duración:** Semanas 2-3  
**Objetivo:** datos reales fluyendo automáticamente, con validación

### Arquitectura de datos

```
GitHub Actions (cron)
       │
       ├── fetchers/banxico.py      → data/series_banxico.json
       ├── fetchers/cnbv.py         → data/cnbv_banca_multiple.json
       ├── fetchers/cnbv_sofipos.py → data/cnbv_sofipos.json
       └── pipeline.py              → data/index.json (manifest + hashes)
                                           │
                                     git commit & push
                                           │
                             Cloudflare Pages sirve los JSONs
                             con brotli (~50-150KB en wire)
```

### 1.1 Ampliar Banxico (fácil — misma API)

Series faltantes a añadir al workflow existente:

| Serie | Código | Frecuencia |
|---|---|---|
| TIIE de Fondeo (sucesora TIIE 28d) | SF343410 | Diaria |
| Reservas internacionales | SF43707 | Semanal |
| Activos internacionales netos | SF110168 | Semanal |
| Cetes 28d subasta | SF60633 | Semanal |
| UDIs | SP68257 | Diaria |

**Entregable:** `data/series_banxico.json` con todos los indicadores monetarios y de mercado.

### 1.2 Parser CNBV — el cuello de botella principal

CNBV no tiene API. Publica Excel con encoding Latin-1 y headers multinivel de 3-5 filas.

```python
# Detección automática de nuevo mes
# Corre día 1 de cada mes; reintenta cada 48h hasta día 15
# Si día 15 sin datos → abre issue de alerta
# Descarga → parsea → valida con Pandera → commitea

# Reportes a parsear:
# Sector 40 Banca Múltiple: IMOR, IMORA, ICOR, ROA, ROE
# R12: IFRS9 Stages 1/2/3
# Boletines ICAP: Capital Neto/APR, CET1, LCR, NSFR
# Sector 50 SoFiPOs: IMOR por cartera, ROA, IMORA
```

**Centinelas CNBV a manejar:**
- `(-)` = cero exacto
- `n.s.` = no significativo (ICOR > 1000%)
- Cambios de schema sin aviso (IFRS9 en 2022, C-0441 en jul 2024)

### 1.3 Validación con Pandera

Schema por indicador con rangos válidos y detección de anomalías:

```python
# IMOR: rango 0-30%, no saltos >200% entre meses
# ICAP: mínimo regulatorio 10.5%, alerta si cae <12%
# LCR: alerta si cae <150% (mediana actual 331%)
# Si validación falla → no commitea + abre GitHub Issue
```

### 1.4 index.json para cache busting

```json
{
  "generated_at": "2026-04-27T14:00:00Z",
  "pipeline_version": "1.0.0",
  "files": {
    "series_banxico.json": {"sha256": "abc123", "updated": "2026-04-27", "rows": 450},
    "cnbv_banca_multiple.json": {"sha256": "def456", "updated": "2026-03-31", "rows": 280}
  }
}
```

Frontend lee `index.json` primero → solo recarga archivos cuyo hash cambió.

### 1.5 Observabilidad

- **Healthchecks.io** (free, 20 checks): ping inicio + fin del workflow. Sin ping en 26h → alerta email
- **Sentry Developer** (free): errores del pipeline Python
- **DataFreshnessBadge** en el frontend: verde (<24h), amarillo (>24h), rojo (>72h)
- Auto-issue si workflow falla: `peter-evans/create-issue-from-file@v5`

---

## SPRINT 2 — Visualización core
**Duración:** Semanas 4-5  
**Objetivo:** el heatmap interactivo como primer deliverable público

### Stack de visualización por capa

| Tipo | Librería | Por qué |
|---|---|---|
| **Heatmap de riesgo** (visualización firma) | Apache ECharts v6 | Heatmap nativo, Canvas+SVG, Apache 2.0, ~150KB |
| FX MXN/USD y tasas | Lightweight Charts v5 | 35KB, candlestick nativo, anotaciones de eventos |
| Series largas multi-banco | uPlot | ~50KB, 31K pts/ms, el más rápido |
| KPI cards + sparklines | Tremor | Componentes listos sobre Recharts+Tailwind |
| Tablas de bancos | TanStack Table v8 | Virtualizado, sortable, filterable |

### El heatmap como primer deliverable

Replica del Mapa Térmico de Banxico pero interactivo:
- Percentiles rolling p10/25/50/75/90 sobre serie desde 2006
- Paleta ColorBrewer YlOrRd discretizada en 5 colores
- Click en celda → ficha del indicador con metodología
- Semáforo resumen: 5 ejes → 1 número de "salud del sistema"
- Embebible como iframe en cualquier sitio

### UX prioritaria

- **Pregunta, no sigla** — cada indicador muestra primero la pregunta que responde: *"¿Cuántos préstamos no se están pagando?"* → IMOR
- **Tooltips de glosario** (Floating UI): hover sobre sigla → definición + fórmula + alerta
- **URL state con nuqs**: filtros persistentes y compartibles (`?from=2020&eje=credito&banco=BBVA`)
- **Export PNG/CSV** con metadata de fuente embebida en cada chart

---

## SPRINT 3 — INEGI + comparativa básica
**Duración:** Semanas 6-7

- IGAE mensual (clave 736181, T+53 días)
- PIB trimestral (clave 381016, T+55 días)
- ENOE: desempleo e informalidad
- SHRFSP: deuda pública (SHCP Estadísticas Oportunas)
- IPAB: cobertura de seguro de depósito

*Nota: claves INEGI cambiaron en dic 2025 — verificar tabla de equivalencias antes de implementar*

---

## SPRINT 4+ — Comparativa internacional
**Duración:** Mes 3+  
**Condición de entrada:** México bien afinado, los 7 elementos citables activos, DOI asignado

Fuentes gratuitas priorizadas:

| Fuente | Qué cubre | Auth |
|---|---|---|
| IMF FSI | NPL, ICAP, ROA/ROE armonizados — comparativa directa con MX | Sin auth |
| BIS Data Portal | Credit-to-GDP gap, DSR | Sin auth, SDMX REST |
| BCB Brasil SGS | Todos los indicadores de Brasil | Sin auth |
| BCRA Argentina | Indicadores Argentina | Sin auth, API v3 |
| DBnomics | Agregador de todos los anteriores | `pip install dbnomics` |

**Advertencia de comparabilidad en cada chart:** IMOR México (IFRS9 Stage 3) ≠ NPL ratio EBA ≠ CECL US — nota metodológica visible obligatoria.

---

## Observabilidad — Setup manual pendiente

El código ya está en el repo (commit `66798a2`). Requiere configurar dos servicios externos y añadir sus secrets en GitHub.

### Healthchecks.io — monitoreo del pipeline de datos

1. Crear cuenta en [healthchecks.io](https://healthchecks.io) (gratis hasta 20 checks)
2. Dashboard → **Add Check**
   - Name: `sfm-monitor pipeline`
   - Tags: `banxico`, `data`
   - Period: `1 day`
   - Grace time: `1 hour`
   - → **Save**
3. Copiar la URL de ping generada (formato `https://hc-ping.com/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`)
4. Repo GitHub → **Settings → Secrets and variables → Actions → New repository secret**
   - Name: `HEALTHCHECKS_URL`
   - Value: la URL copiada
5. Verificar: Actions → `Update SFM Data` → **Run workflow** → el check debe volverse verde en Healthchecks.io

### GoatCounter — analytics sin cookies

1. Crear cuenta en [goatcounter.com](https://www.goatcounter.com) → **Sign up for hosted**
   - Code (subdominio): `sfm-monitor` → queda como `sfm-monitor.goatcounter.com`
   - Confirmar email
2. Settings → **Site** → sección "Allow domains": añadir `pamela-ruiz9.github.io`
3. La URL del contador es: `https://sfm-monitor.goatcounter.com/count`
4. Repo GitHub → **Settings → Secrets and variables → Actions → New repository secret**
   - Name: `PUBLIC_GOATCOUNTER_URL`
   - Value: `https://sfm-monitor.goatcounter.com/count`
5. Para desarrollo local: crear `app/.env` (ya está en `.gitignore`):
   ```
   PUBLIC_GOATCOUNTER_URL=https://sfm-monitor.goatcounter.com/count
   ```

> Activar cuando el producto esté nutrido y haya tráfico real que medir.

---

## Métricas de éxito

| Sprint | Métrica | Target |
|---|---|---|
| 0 | DOI asignado | Zenodo `10.5281/zenodo.XXXXX` |
| 0 | Astro en Cloudflare Pages | Lighthouse 90+ todas las categorías |
| 0 | JSON-LD validado | Google Rich Results Test ✅ |
| 1 | Pipeline Banxico | 100% series core automatizadas |
| 1 | Automatización CNBV | Detección automática de nuevo mes |
| 1 | Uptime pipeline | >99% (Upptime) |
| 2 | Heatmap live | Primer embed público funcional |
| 2 | Costo mensual | ~$0 |

---

## Atribuciones requeridas por ley

- **Banxico:** "Fuente: Banco de México, SIE, serie [SF43718], consultado [fecha]" — Cláusula 8: uso analítico libre, no comercialización
- **CNBV:** "Fuente: CNBV, Portafolio de Información, [Sector], consultado [fecha]" — Datos Abiertos
- **INEGI:** "Fuente: INEGI. [Programa]. [Año]" — Términos de Libre Uso, comercial permitido
- **FMI:** "Source: International Monetary Fund, [Database]" — no bulk download, no training LLMs
- **BIS / Banco Mundial / OCDE:** CC BY 4.0 con atribución textual
