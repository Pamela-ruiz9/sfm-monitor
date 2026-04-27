# Roadmap: Infraestructura & Deploy
> SFM Risk Monitor — Pamela-ruiz9/sfm-monitor
> Actualizado: 2026-04-27

## Principios de arquitectura

- **Costo total: ~$0/mes** — GitHub Pages + GitHub Actions + APIs gratuitas
- **Sin manejo de usuarios** — dashboard 100% estático e informativo
- **Centralización de datos:** pipeline Python en GH Actions → commitea JSONs al repo → GitHub Pages los sirve
- **Automatización máxima** — CNBV es el único punto manual; todo lo demás correrá solo
- **Open source completo** — reproducible, citable, sin vendor lock-in

---

## Estado actual (baseline)

| Componente | Estado | Notas |
|---|---|---|
| Frontend | ✅ HTML/CSS/JS + Chart.js | Funciona, suficiente para Fase 1-2 |
| Pipeline Banxico | ✅ GH Actions diario | FX, tasa, INPC automatizados |
| Datos CNBV | ⚠️ Manual mensual | IMOR, ICOR, IFRS9, SoFiPOs |
| ICAP / LCR / NSFR | ❌ No existe | Pendiente Fase 1 |
| Reservas internacionales | ❌ No existe | Fácil — misma API Banxico |
| TIIE Fondeo / TIIE 28d | ❌ No existe | Fácil — misma API Banxico |
| INEGI (IGAE, PIB) | ❌ No existe | Pendiente Fase 2 |
| Observabilidad | ❌ No existe | Healthchecks.io + alertas |
| Status page | ❌ No existe | Upptime pendiente |

---

## Arquitectura de datos (decisión central)

```
GitHub Actions (cron)
       │
       ├── fetchers/banxico.py    → data/series_banxico.json
       ├── fetchers/cnbv.py       → data/cnbv_banca_multiple.json
       ├── fetchers/cnbv_sofipos.py → data/cnbv_sofipos.json
       ├── fetchers/inegi.py      → data/macro_inegi.json
       └── pipeline.py            → data/index.json (manifest con hashes)
                                        │
                                  git commit & push
                                        │
                                  GitHub Pages sirve los JSONs
                                        │
                              Frontend lee data/index.json
                              → cache busting automático
```

**Por qué un solo repo:**
- Datos versionados con git history completo (vintage nativo)
- Cero infraestructura externa
- Cualquiera puede clonar y replicar todo el pipeline localmente
- GitHub Pages sirve los JSONs con CORS libre

---

## FASE 0 — Fundamentos del pipeline
**Duración:** Semana 1  
**Objetivo:** datos reales fluyendo automáticamente, sin tocar el frontend

### 0.1 Modernizar el workflow de Banxico

Añadir al script existente las series faltantes:

| Serie Banxico | Código | Frecuencia |
|---|---|---|
| TIIE 28 días | SF43783 | Diaria |
| TIIE de Fondeo | SF343410 | Diaria |
| Reservas internacionales | SF43707 | Semanal (martes) |
| Activos internacionales netos | SF110168 | Semanal |
| Cetes 28d subasta | SF60633 | Semanal |
| UDIs | SP68257 | Diaria |

**Entregable:** `data/series_banxico.json` con todos los indicadores de mercado y macro monetaria.

### 0.2 Restructurar JSONs por dominio

```
data/
├── index.json                  # manifest: {filename, sha256, last_updated, n_rows}
├── series_banxico.json         # FX, tasas, reservas, inflación (<500KB)
├── cnbv_banca_multiple.json    # IMOR, IMORA, ICOR, ICAP, ROA/ROE, IFRS9
├── cnbv_sofipos.json           # SoFiPOs indicadores
└── macro_inegi.json            # IGAE, PIB, empleo (Fase 2)
```

El `index.json` permite cache busting: el frontend solo recarga un archivo si su hash cambió.

### 0.3 Script CNBV — parser automático

El punto más complejo. CNBV no tiene API; publica Excel con:
- Encoding Windows-1252 (Latin-1)
- Headers multinivel de 3-5 filas
- Cifras centinela: `(-)` = cero exacto, `n.s.` = no significativo

Script de detección + descarga:
```python
# Detecta si CNBV publicó nuevo mes comparando
# el último archivo disponible vs. last_updated en index.json
# Si hay mes nuevo → descarga → parsea → valida → commitea
```

Reportes a parsear:
- **Sector 40 Banca Múltiple:** IMOR, IMORA, ICOR, ROA, ROE
- **R12 cartera:** IFRS9 Stages 1/2/3
- **Boletines ICAP:** Capital Neto/APR, CET1, CCB, CCF, LCR (CCL), NSFR (CFEN)
- **Sector 50 SoFiPOs:** IMOR por cartera, ROA, IMORA

### 0.4 Validación con Pandera

Schema de validación para cada JSON:
```python
# Ejemplo para IMOR banca múltiple:
# - rango válido: 0% a 30%
# - no puede haber saltos >200% entre meses consecutivos
# - serie debe tener continuidad desde 2006
# - alerta si nuevo valor cruza umbral regulatorio
```

Si la validación falla → GitHub Actions abre issue automáticamente, no commitea datos corruptos.

### 0.5 Observabilidad desde día 1

- **Healthchecks.io** (free, 20 checks): ping al inicio y al final del workflow. Si no hay ping en 26h → alerta por email
- **Auto-issue** si el workflow falla: `peter-evans/create-issue-from-file@v5`
- Badge de freshness en el frontend: verde (<24h), amarillo (>24h), rojo (>72h)

---

## FASE 1 — Pipeline completo México
**Duración:** Semanas 2-4  
**Objetivo:** todos los indicadores del perfil de riesgo México automatizados o semi-automatizados

### 1.1 Automatización CNBV (máximo posible)

CNBV publica ~día 30-35 del mes siguiente. El workflow CNBV:
1. Corre el día 1 de cada mes
2. Verifica si el mes anterior ya está publicado
3. Si sí → descarga, parsea, valida, commitea
4. Si no → reintenta cada 48h hasta el día 15
5. Si día 15 sin datos → abre issue de alerta

**Limitación honesta:** CNBV tiene downtimes frecuentes y cambios de schema sin aviso. El schema de IFRS9 cambió en 2022 y el C-0441 cambió en julio 2024. Los snapshot tests con `syrupy` detectan estos cambios antes de corromper los datos.

### 1.2 Ampliar cobertura Banxico

Añadir al pipeline diario:
- **Mapa de Riesgo Crediticio Bancario** (cuando Banxico publique REF semestral) — parseo PDF con pdfplumber para extraer tabla del Recuadro
- **Aggregate indicators** del REF para citación directa

### 1.3 Status page con Upptime

Repo separado `Pamela-ruiz9/sfm-monitor-status` con Upptime:
```yaml
# .upptimerc.yml
sites:
  - name: SFM Monitor (GitHub Pages)
    url: https://pamela-ruiz9.github.io/sfm-monitor
  - name: Banxico SIE API
    url: https://www.banxico.org.mx/SieAPIRest/service/v1/series/SF43718/datos/oportuno
  - name: CNBV Portafolio
    url: https://portafolioinfo.cnbv.gob.mx
  - name: INEGI BIE
    url: https://www.inegi.org.mx/app/api/indicadores/desarrolladores/jsonxml/INDICATOR/736181/es/0700/false/BIE/2.0/token
```

100% gratis, corre en GitHub Actions, genera badges y página pública de status.

### 1.4 Estructura del pipeline Python

```
pipeline/
├── pyproject.toml          # uv: dependencias declaradas
├── uv.lock                 # lockfile cross-platform reproducible
├── src/
│   ├── fetchers/
│   │   ├── banxico.py      # SIE API client con rate limiting (80 req/min)
│   │   ├── cnbv.py         # Downloader + parser Excel Latin-1 + headers multinivel
│   │   ├── cnbv_boletines.py # ICAP, LCR, NSFR desde boletines PDF/Excel
│   │   └── inegi.py        # BIE API (claves post-migración dic 2025)
│   ├── schemas/
│   │   ├── banxico.py      # Pandera schemas series monetarias
│   │   ├── cnbv.py         # Pandera schemas IMOR/ICAP/IFRS9
│   │   └── types.py        # Branded types: Percentage, BasisPoints, SeriesId
│   ├── transforms/
│   │   ├── percentiles.py  # Percentiles rolling p10/25/50/75/90 (metodología Banxico)
│   │   └── semaforo.py     # Cálculo del semáforo por eje
│   └── pipeline.py         # Orquestador: fetch → validate → transform → write
├── tests/
│   ├── snapshots/          # syrupy: tests de no-regresión histórica
│   └── test_schemas.py     # Pandera validation tests
└── .github/workflows/
    ├── update-banxico.yml  # Diario lun-vie 8am CDMX
    ├── update-cnbv.yml     # Mensual día 1, reintento cada 48h
    └── update-inegi.yml    # Mensual T+53 días
```

**Dependencias (uv):**
```toml
[project]
dependencies = [
    "requests>=2.32",
    "pandas>=2.2",          # para compatibilidad con Excel CNBV
    "polars>=1.0",          # para series grandes y transforms
    "pandera[polars]>=0.31",
    "pydantic>=2.7",
    "openpyxl>=3.1",        # Excel CNBV
    "pdfplumber>=0.11",     # boletines PDF Banxico/CNBV
    "httpx>=0.27",
    "sentry-sdk>=2.0",
]
[tool.uv]
python = "3.12"
```

---

## FASE 2 — Frontend evolution
**Duración:** Semanas 5-7  
**Objetivo:** frontend que muestre todo lo del pipeline, sin cambiar stack si no es necesario

### Decisión de stack: incremental vs migración a Astro

**Recomendación: incremental primero.**

El stack actual (HTML/CSS/JS + Chart.js) funciona y está en producción. Antes de migrar a Astro 5:

1. Restructurar el JS para consumir los nuevos JSONs por dominio
2. Añadir `<DataFreshnessBadge>` leyendo `index.json`
3. Implementar el heatmap de riesgo con **Apache ECharts** (Chart.js no tiene heatmap nativo decente)
4. Cuando el contenido justifique la complejidad → migrar a Astro

**Si se decide migrar a Astro 5 + Cloudflare Pages:**

```bash
npm create astro@latest -- --template minimal
npx astro add react tailwind
npx shadcn init
```

Ventajas concretas para SFM:
- Content Collections type-safe con Zod para fichas metodológicas
- `client:visible` para cargar charts solo cuando están en viewport (mejor LCP)
- Deploy en Cloudflare Pages: bandwidth ilimitado, 300+ edge locations, gratis

### Visualización por capa

| Tipo de chart | Librería | Por qué |
|---|---|---|
| Heatmap de riesgo (firma del proyecto) | Apache ECharts v6 | Heatmap nativo, Canvas+SVG, Apache 2.0 |
| FX MXN/USD y tasas (series temporales) | Lightweight Charts v5 | 35KB, candlestick nativo, Apache 2.0 |
| Series largas multi-banco | uPlot | ~50KB, el más rápido, 31K pts/ms |
| KPI cards y sparklines | Tremor | Componentes listos, sobre Recharts+Tailwind |
| Tablas de bancos | TanStack Table v8 | Virtualizado, sortable, filterable |
| Fichas metodológicas | Observable Plot | Gramática ggplot, small multiples |

### Características de UX prioritarias

- **Semáforo resumen** en primera pantalla: 5 ejes → 1 número de "salud del sistema"
- **Tooltips de glosario** (Floating UI): hover sobre IMOR → definición + fórmula + alerta
- **URL state con nuqs**: filtros persistentes y compartibles (`?from=2020&eje=credito`)
- **Export**: PNG/CSV por chart con metadata de fuente embebida
- **Dark mode** nativo con CSS variables

---

## FASE 3 — Citabilidad y distribución
**Duración:** Semanas 8-10  
**Objetivo:** que alguien pueda citar esto en un paper o tesis

### DOI persistente vía Zenodo

1. Conectar repo a `zenodo.org` (flip switch en Settings → GitHub)
2. Añadir `CITATION.cff` al repo ✅ (ya está)
3. Crear release `v1.0.0` en GitHub
4. Zenodo asigna DOI automáticamente: `10.5281/zenodo.XXXXXXX`
5. Badge en README: `[![DOI](https://zenodo.org/badge/...)]`

### JSON-LD Dataset markup

Cada página de indicador tendrá:
```json
{
  "@context": "https://schema.org",
  "@type": "Dataset",
  "name": "IMOR Banca Múltiple México",
  "description": "Índice de Morosidad de la Banca Múltiple en México...",
  "url": "https://pamela-ruiz9.github.io/sfm-monitor/indicadores/imor",
  "license": "https://creativecommons.org/licenses/by/4.0/",
  "creator": {"@type": "Person", "name": "Pame Ruiz"},
  "temporalCoverage": "2000-12-01/..",
  "variableMeasured": "IMOR",
  "distribution": [
    {"@type": "DataDownload", "encodingFormat": "application/json",
     "contentUrl": "https://pamela-ruiz9.github.io/sfm-monitor/data/cnbv_banca_multiple.json"}
  ]
}
```

### Citation generator

Componente `<CitationBox>` con tabs APA / BibTeX / RIS:

```
APA 7:
Ruiz, P. (2026). SFM Risk Monitor [Conjunto de datos].
https://doi.org/10.5281/zenodo.XXXXXXX

BibTeX:
@dataset{sfm_risk_monitor_2026,
  author = {Ruiz, Pamela},
  title  = {SFM Risk Monitor},
  year   = {2026},
  doi    = {10.5281/zenodo.XXXXXXX},
  url    = {https://pamela-ruiz9.github.io/sfm-monitor}
}
```

### OpenAPI + paquete Python

- OpenAPI 3.1 en `/docs/api` describiendo los JSONs estáticos
- Paquete `sfmmonitor` en PyPI (~50 líneas, thin wrapper sobre los JSONs)
- Notebooks Jupyter en `/examples` con mirror a Google Colab

---

## FASE 4 — Comparativa internacional
**Duración:** Mes 4+  
**Objetivo:** México en contexto LatAm y OCDE — solo cuando México esté bien afinado

### Fuentes internacionales gratuitas

| Fuente | Qué cubre | API |
|---|---|---|
| IMF FSI | NPL, ICAP, ROA/ROE armonizados para 100+ países | REST, sin auth |
| BIS Data Portal | Credit-to-GDP gap, DSR, policy rates | SDMX REST, sin auth |
| BCB Brasil SGS | Indicadores bancarios Brasil | REST, sin auth |
| BCRA Argentina | Indicadores bancarios Argentina | REST v3.0, sin auth |
| World Bank GFDD/WDI | Comparativa amplia 200+ países | REST, sin auth |
| DBnomics | Agregador de todos los anteriores | REST, `pip install dbnomics` |

### Indicadores cross-country priorizados

- IMOR/NPL ratio: MX vs BR vs CO vs CL vs PE vs ES vs US
- ICAP: ídem
- ROA/ROE: ídem
- Credit-to-GDP gap: BIS oficial para todos
- EMBI sovereign spreads: World Bank GEM (mensual, gratuito)
- Policy rates: BIS `WS_CBPOL`

**Nota de comparabilidad:** IMOR México (IFRS9 Stage 3) vs NPL ratio EBA/IMF FSI vs CECL US no son comparables directamente. Cada chart debe incluir nota metodológica visible.

---

## Métricas de éxito por fase

| Fase | Métrica | Target |
|---|---|---|
| 0 | Pipeline Banxico coriendo | 100% series core automatizadas |
| 0 | Schema validation | 0 datos corruptos en producción |
| 1 | Automatización CNBV | Detección automática de nuevo mes |
| 1 | Cobertura de indicadores | IMOR, ICAP, LCR, IFRS9 stages, ROA/ROE |
| 1 | Uptime pipeline | >99% (Upptime) |
| 2 | Lighthouse | 90+ todas las categorías |
| 2 | Latencia datos | Banxico <24h, CNBV <48h post-publicación |
| 3 | Citabilidad | DOI asignado, JSON-LD validado en Rich Results Test |
| 3 | Costo mensual | ~$0 |
| 4 | Cobertura países | MX + 5 países LatAm + US comparativa |

---

## Próximos pasos inmediatos

1. **Pame agrega `BANXICO_TOKEN` a GitHub Secrets** (Settings → Secrets → Actions)
2. **Sprint 0.1:** ampliar workflow Banxico con TIIE, reservas, TIIE Fondeo — listo para implementar
3. **Sprint 0.3:** script parser CNBV — el más crítico, necesita acceso a los archivos raw-data actuales
4. **Sprint 0.5:** Healthchecks.io + Upptime — 30 minutos de configuración, alto valor

---

*Atribuciones de datos:*
- *Banco de México:* "Fuente: Banco de México, SIE, serie [código], consultado [fecha]" — uso analítico libre con atribución; Cláusula 8 prohíbe comercialización
- *CNBV:* "Fuente: CNBV, Portafolio de Información, [Sector], consultado [fecha]" — Datos Abiertos
- *INEGI:* "Fuente: INEGI. [Programa]. [Año]" — Términos de Libre Uso, uso comercial permitido
- *FMI/BIS/Banco Mundial/OCDE:* CC BY 4.0 con atribución textual requerida
