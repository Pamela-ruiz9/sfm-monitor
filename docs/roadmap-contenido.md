# Roadmap de Contenido — SFM Risk Monitor 🌙

> **Responsable:** Nyx  
> **Principio rector:** dos audiencias, una misma pantalla. Analistas ven los números; ciudadanos y periodistas ven la historia. El contenido tiene que servir a los dos sin sacrificar ninguno.

---

## Estado actual de los datos (para el equipo)

El repo ya tiene `data/sfm-data.json` con la siguiente cobertura:

| Módulo | Indicadores presentes | Fuente | Automatización | UI |
|--------|----------------------|--------|----------------|-----|
| Mercado | FX FIX, Tasa Banxico, TIIE 28d, Reservas, Cetes 28d, UDI | Banxico SIE | ✅ GitHub Actions diario L-V 8am CDMX | ✅ Home |
| Inflación | INPC general, subyacente, no subyacente | Banxico SIE | ✅ | ✅ Home |
| Macro INEGI | IGAE (historia completa desde pipeline 2026-06-11), PIB (trimestral), desempleo, subocupación, informalidad, salario mínimo | INEGI BIE + STPS | ✅ (series 736181+737370 merged) | ✅ Macro |
| Macro Banxico | Remesas familiares (22 meses, SE27803) | Banxico SIE | ✅ | ✅ KpiCard + RemesasChart (2026-06-11) |
| Crédito Banca Múltiple | IMOR/IMORA/ICOR/ROA/ROE por cartera y 62 bancos · MIF · Quitas · EPRC · IFRS9 stages · Crecimiento cartera | CNBV CSV sh_datos_40 + R12A | ⚠️ Manual mensual | ✅ Instituciones/Banca Múltiple |
| SoFiPOs | IMOR por cartera, IMORA, ROA, ROE (123 meses) · por entidad | CNBV Excel | ⚠️ Manual mensual | ✅ Instituciones/SoFiPOs (ROE sin mostrar) |
| Histórico largo | FX desde 1994, Inflación desde 2000, IMOR desde 2000 | Banxico + CNBV | ⚠️ Estático en JSON | ✅ |

**Pendiente urgente — explotar datos ya en JSON sin descarga adicional:**
- ~~Reservas internacionales (SF43707)~~ ✅ KpiCard + `ReservasChart.tsx` en Home (2026-06-01)
- ~~Subyacente / no-subyacente~~ ✅ SP74625 + SP74627 en pipeline y `InflacionChart.tsx` (2026-06-01)
- ~~Remesas familiares~~ ✅ `RemesasChart.tsx` + KpiCard `$4,978 MUSD` en Macro (2026-06-11). Datos Banxico SE27803.
- ~~SoFiPOs ROE~~ ✅ `sofipos.roe` (123 meses) en `SofiposImoraRoaChart` como línea discontinua azul + KpiCard (2026-06-11).
- ~~IGAE historia pre-2026~~ ✅ Pipeline fusiona serie 736181 + 737370 en `fetch_igae_merged()`. Eliminado `IGAE_CUTOFF`. Próxima ejecución del workflow poblará el historial completo (2026-06-11).
- Desglose IFRS9 automático desde CNBV (hoy es carga manual)
- `index.json` con hash + timestamp por archivo (cache busting)
- **Exportaciones (471584), importaciones (471588), inversión fija (462219)** — series INEGI rotas post-BIE dic 2025 (HTTP 400); buscar nuevos IDs en `inegi.org.mx/app/indicadores/`

**El pipeline de Banxico funciona bien.** El cuello de botella real es CNBV: CSVs en encoding Latin-1, headers multinivel de 3-5 filas, formato que cambia con cada ciclo regulatorio. Eso requiere un parser robusto con validación Pandera antes de automatizarlo.

---

## Principios de contenido

### Los 7 elementos citables desde el inicio
> *"La diferencia entre un proyecto hobby y uno citable son 7 elementos que cuestan poco al inicio y mucho al retrofittear."*

1. **DOI persistente vía Zenodo** — desde el primer release `v1.0.0`
2. **JSON-LD `Dataset` markup** — en cada página de indicador + `DataCatalog` en homepage
3. **`CITATION.cff`** — ya está en el repo ✅
4. **Citation generator multi-formato** — APA 7, Chicago, MLA, BibTeX, RIS
5. **Fichas metodológicas type-safe** — una por indicador, en Astro Content Collections
6. **Status page automatizado** — Upptime monitoreando endpoints upstream
7. **Doble licenciamiento MIT + CC-BY 4.0** — ya están `LICENSE` y `LICENSE-CONTENT` ✅

**Estos van en Fase 0, no en Fase 3.**

---

## Fase 1 — Estructura de información (meses 1-2)

### Capa 1: Semáforo global

La primera pantalla del dashboard muestra **1 número, 1 color, 1 frase** que cualquier persona entienda antes de ver cualquier gráfica.

**Índice compuesto propio:**
- Metodología: percentiles rolling (p10/p25/p50/p75/p90) sobre serie histórica desde 2006
- Agregación: equal-weighting como default público + variante PCA visible como "modo experto"
- 5 colores: verde (<p25), amarillo-verde (p25–p50), amarillo (p50–p75), naranja (p75–p90), rojo (>p90)
- Citamos Banxico REF Oct 2018 Recuadro 3 como referencia metodológica; la composición es nuestra

**Por qué índice propio y no espejo de Banxico:**  
Banxico publica su Mapa Térmico en PDF semestral. Nosotros lo hacemos vivo, mensual, con metodología visible y reproducible. Eso nos convierte en fuente independiente, no en visualizador de datos ajenos.

**Atribución en el semáforo:**  
`Datos: Banco de México SIE + CNBV Portafolio de Información | Metodología propia | Actualizado: [fecha]`

---

### Capa 2: Los 5 ejes (Fase 1)

Adoptamos 5 de los 7 ejes del ESRB. Los otros 2 quedan para Fase 2.

**EJE 1 — CRÉDITO** *(fuente: CNBV — atribución: "CNBV, Portafolio de Información, Sector 40, consultado [fecha]")*

| Indicador | Pregunta en lenguaje humano | Fórmula | Umbral alerta |
|-----------|----------------------------|---------|---------------|
| IMOR | ¿Cuántos préstamos no se están pagando? | Cartera Etapa 3 / Cartera total | >3.5% |
| IMORA | ¿Cuántos préstamos malos esconden los castigos? | (Vencida + Castigos 12m) / (Total + Castigos 12m) | >4.5% |
| ICOR | ¿Tienen suficientes reservas para cubrir la cartera mala? | EPRC / Cartera vencida | <120% |
| Migration matrices IFRS9 | ¿Cuántos créditos están empeorando de etapa? | % Stage 1→2 y % Stage 2→3 por trimestre | Tendencia >3 trimestres consecutivos |

Desgloses: por cartera (consumo, vivienda, comercial, gobierno) y por banco G-7 (BBVA, Santander, Banamex, Banorte, HSBC, Scotiabank, Inbursa).

**SoFiPOs** (segmento de mayor riesgo visible):
- IMOR total: actual 9.91% — umbral alerta >10%
- IMOR por cartera: consumo ~14.5%, vivienda ~22.6%
- IMORA, ROA, ROE
- Texas Ratio adaptado = (Etapa 3 + Bienes Adjudicados) / (Capital Tangible + EPRC)

**EJE 2 — SOLVENCIA** *(fuente: CNBV)*

| Indicador | Pregunta en lenguaje humano | Valor actual | Mínimo regulatorio |
|-----------|----------------------------|--------------|--------------------|
| ICAP | ¿Tienen suficiente capital para absorber pérdidas? | 20.24% | 10.5% + SCCS |
| CCB (Capital Core Básico) | ¿Qué tan sólido es ese capital? | 18.14% | — |
| CCF (Capital Fundamental) | Capital de mayor calidad | 16.81% | — |
| Distancia al mínimo | ¿Qué tan lejos estamos de la zona de riesgo? | distance-from-threshold | 0% = alerta crítica |

D-SIBs designados abril 2025: BBVA México, Santander, Banamex, Banorte, HSBC, Scotiabank, Inbursa.  
SCCS adicional por D-SIB: 0.6%–1.5%.

**EJE 3 — LIQUIDEZ** *(fuente: CNBV)*

| Indicador | Pregunta en lenguaje humano | Valor actual | Mínimo |
|-----------|----------------------------|--------------|----|
| CCL / LCR | ¿Pueden sobrevivir 30 días de estrés sin fondeo externo? | 331% mediana | 100% |
| CFEN / NSFR | ¿Su fondeo es estable a largo plazo? | 145% | 100% |

**EJE 4 — MERCADO Y MACRO** *(fuente: Banxico SIE — atribución: "Banco de México, SIE, serie [código], consultado [fecha]")*

| Serie | Código Banxico | Frecuencia | Valor actual |
|-------|---------------|------------|--------------|
| FX FIX MXN/USD | SF43718 | Diaria | $17.40 |
| FX Liquidación | SF60653 | Diaria | — |
| Tasa objetivo Banxico | SF61745 | Variable | 6.75% |
| TIIE 28d | SF43783 | Diaria | — |
| TIIE de Fondeo | SF343410 | Diaria | — |
| Cetes 28d | SF60633 | Semanal | — |
| Reservas internacionales | SF43707 | Semanal (martes 9am) | — |
| INPC general | SP1 | Mensual | 4.45% |
| Inflación subyacente | SP74625 | Mensual | — |
| Inflación no subyacente | SP74627 | Mensual | — |
| UDIs | SP68257 | Diaria | — |

Visualización: series temporales con anotaciones de crisis canónicas (Tequila dic 1994, GFC sep 2008, COVID mar 2020, SVB mar 2023).

**EJE 5 — ESTRUCTURAL** *(fuente: CNBV + Banxico)*

| Indicador | Pregunta en lenguaje humano | Fórmula | Umbral alerta | Fuente |
|-----------|----------------------------|---------|---------------|--------|
| HHI activos | ¿Controlan pocos bancos la mayor parte del sistema? | Σ(participación_i)² × 10,000 sobre activos totales | <1,000 competitivo · 1,000–1,800 moderado · >1,800 concentrado | CNBV Sector 40, cálculo propio |
| HHI cartera | ¿La cartera de crédito está en pocas manos? | Σ(participación_i)² × 10,000 sobre cartera total | Mismos umbrales | CNBV Sector 40 |
| HHI depósitos | ¿Y el fondeo? | Σ(participación_i)² × 10,000 sobre depósitos totales | Mismos umbrales | CNBV Sector 40 |
| Participación D-SIBs | ¿Qué parte del sistema descansa en los 7 bancos sistémicos? | Σ Activos D-SIBs / Activos sistema × 100 | Informativo — referencia: nivel histórico + CESF | CNBV Sector 40 + lista D-SIBs Banxico |
| Crédito / PIB | ¿Qué tan profundo es el sistema financiero respecto a la economía? | Cartera total banca / PIB nominal × 100 | Informativo en Fase 1 — referencia: promedio MX histórico ~35–40%, LATAM ~55% | CNBV Sector 40 + INEGI BIE |
| IMOR banca de desarrollo | ¿Están pagando bien los créditos de la banca pública? | Misma definición IMOR Sector 40 (Cartera Etapa 3 / Cartera total) | >3.5% (mismo umbral banca múltiple) | CNBV Portafolio, Banca de Desarrollo |
| ICAP banca de desarrollo | ¿Tiene capital suficiente la banca pública? | Capital Neto / Activos sujetos a riesgo total | <10.5% (mínimo regulatorio CUB) | CNBV Portafolio, Banca de Desarrollo |

**Instituciones banca de desarrollo (cobertura completa CNBV, 7 instituciones):** Banobras, Nafin, Bancomext, Banjercito, SHF, FND, Banco del Bienestar.

**Nota metodológica — umbral HHI:** se adopta la escala OCDE usada en el Reporte de Estabilidad Financiera de Banxico (no la escala COFECE 1,000/2,500). Razón: el REF es la referencia regulatoria canónica para estabilidad sistémica; COFECE aplica su escala en contexto de competencia económica, que es un análisis distinto. Se documenta explícitamente en la ficha metodológica del indicador.

**Nota crédito/PIB:** la desviación respecto a tendencia de largo plazo (credit-to-GDP gap, HP filter λ=400,000, metodología BIS BCBS d187) va en Eje 7 — Sistémico. En este eje solo se publica el nivel con contexto histórico.

---

### Capa 3: Fichas metodológicas por indicador

Cada indicador tiene su propia ficha con estructura estándar:

```
/indicadores/[slug]/
├── La pregunta que responde (lenguaje humano, 1 oración)
├── Fórmula exacta (KaTeX)
├── Valor actual + contexto histórico
├── Umbrales de alerta y justificación regulatoria
│   └── Referencia a CUB: Anexo 33, Anexo 1-O, Art. 2 Bis 5/6/117, Art. 220
├── Diferencia con definición internacional
│   └── Ej: IMOR vs NPL ratio EBA/IMF FSI (no comparables directamente)
├── Fuente y fecha de actualización con atribución exacta
└── Código de replicación (link al repo)
```

**Fichas prioritarias Fase 1:** IMOR, IMORA, ICOR, ICAP, CCL/LCR, CFEN/NSFR, FX, Tasa Banxico, Inflación.

---

### Capa 4: Glosario integrado

- Tooltip en dos niveles sobre cada sigla: versión corta (1 línea) + link a ficha completa
- Componente `<MetricTooltip slug="imor">IMOR</MetricTooltip>` reutilizable
- Sin glosario separado — el conocimiento vive donde se necesita

---

## Fase 2 — Profundidad: los 7 ejes completos (meses 3-4)

**EJE 6 — MACRO GENERAL** *(fuente: INEGI BIE post-migración dic 2025 + SHCP)*

| Indicador | Clave INEGI | Lag publicación |
|-----------|------------|-----------------|
| PIB trimestral | 381016 | T+55 días |
| IGAE mensual | 736181 | T+53 días |
| INPC | 628194 | — |
| ENOE (desempleo, informalidad) | — | T+28d mensual |
| Confianza del Consumidor | — | — |
| SHRFSP (deuda pública amplia) | SHCP | T+30 |
| Cobertura IPAB | IPAB | 400K UDIs ~$3.4M MXN |
| SIEFOREs CONSAR | CONSAR/SISET | Día 13-15 mensual |

**EJE 7 — SISTÉMICO** *(fuente: Banxico REF + estimaciones propias)*

- Credit-to-GDP gap: HP filter λ=400,000 (metodología BIS BCBS 2010 d187)
  - Umbral L=2pp → CCyB escalonado; H=10pp → CCyB 2.5% máximo
  - BIS publica gaps oficiales para México — citamos y comparamos con nuestro cálculo
- Índice de stress financiero propio (IEMF-style): 6 categorías, PCA
  - Backtesting vs Tequila 1995, GFC 2008, COVID 2020
  - Método: CDF empírica por variable → equal-weight dentro de subíndice → agregación tipo CISS (peso por co-movimiento)
- SRISK estimado para D-SIBs con datos públicos (metodología Brownlees-Engle 2017, RFS 30(1))

---

## Fase 3 — Citabilidad y distribución (mes 5-6)

### Infraestructura citable

- **DOI Zenodo:** conectar repo → reservar DOI → release `v1.0.0` → badge en README
- **JSON-LD `Dataset`** por indicador + `DataCatalog` en homepage → Google Dataset Search
- **Citation generator:** componente `<CitationBox />` con tabs APA 7 / Chicago / MLA / BibTeX / RIS
- **API pública:** `/api/v1/*.json` con CORS abierto + `Cache-Control: public, max-age=3600`
- **OpenAPI 3.1** documentada en `/docs/api` con Scalar o Redoc CE
- **Paquete Python `sfmriskmx`** en PyPI (~50 líneas, thin wrapper sobre los JSONs)

### Distribución del contenido

Cada actualización mensual genera automáticamente:
- Imagen embebible del heatmap con metadata (fuente, fecha, DOI) — OG dinámico con Satori
- Snippet de texto para newsletter/redes (2-3 oraciones: qué cambió, qué vigilar)
- CSV descargable con atribución en header y footer
- iframe embebible responsive con auto-resize

**Newsletter:** Buttondown (100 subs gratis, dev-friendly, Markdown). Una edición mensual = lectura del momento del sistema financiero. 2-3 párrafos + el heatmap del mes.

**Atribución exacta por fuente:**
- Banxico: `"Fuente: Banco de México, SIE, serie [SF43718], consultado el [YYYY-MM-DD]"`
- CNBV: `"Fuente: CNBV, Portafolio de Información, [Sector], consultado el [YYYY-MM-DD]"`
- FMI (cuando aplique): `"Source: International Monetary Fund, [Database], <link>"`
- INEGI: `"Fuente: INEGI. [Programa]. [Año]"` — Términos de Libre Uso explícitamente comerciales
- BIS: verificar `bis.org/copyright.htm` antes de cada uso

---

## Fase 4 — Comparativa global (mes 7+)

Solo cuando México esté bien afinado. Primero que todo funcione en casa.

**Países Tier 1** (APIs nativas, sin scraping):
- Brasil: BCB SGS API — NPL (21082), Selic (432), IPCA (433), Razão Basileia (25241)
- Perú: BCRP API
- EE.UU.: FRED — VIX (`VIXCLS`), UST 10Y (`DGS10`), NPL (`NPTLTL`), delinquency rates

**Países Tier 2** (IMF FSI como fuente armonizada):
- Colombia, Chile, Argentina: IMF FSI trimestral
- España, Alemania: ECB SDW dataflow `CBD2`

**Fuentes cross-country:**
- BIS Data Portal: credit-to-GDP gap (`WS_CREDIT_GAP`), DSR (`WS_DSR`), policy rates (`WS_CBPOL`)
- IMF FSI: NPL ratio (`FSANL_PT`), Capital/RWA (`FSKA_PT`), ROA/ROE (`FSERA_PT`/`FSERE_PT`)
- DBnomics como agregador SDMX unificado (un solo cliente Python)
- World Bank GEM para EMBI spreads soberanos (alternativa gratuita a CDS — no hay API sin costo confiable)

**Advertencia de comparabilidad:** IMOR México (IFRS 9) vs NPL ratio EBA/IMF FSI vs CECL (US GAAP) **no son comparables directamente**. El dashboard documenta explícitamente las diferencias metodológicas por país.

---

## Preguntas abiertas para Pame

1. ~~**¿El índice compuesto propio lo validamos juntas antes de publicarlo?**~~ ✅ Decidido: sí, validación conjunta antes de implementar. No arrancar el semáforo global sin revisión de Pame de la composición y umbrales.

2. ~~**¿Las fichas metodológicas van en español o bilingüe (ES/EN) desde Fase 1?**~~ ✅ Decidido: todo en español. El dashboard es para México.

3. ~~**¿El dashboard tiene nombre de dominio propio o queda en pamela-ruiz9.github.io/sfm-monitor?**~~ ✅ Decidido: URL canónica = `pamela-ruiz9.github.io/sfm-monitor` — sin dominio propio. Eliminar `app/public/CNAME` en el próximo cleanup.

---

*Última actualización: 2026-06-11*

---

## Métricas disponibles en CSV CNBV — backlog para implementar

> Inventario de indicadores que ya están en los archivos descargados y pueden agregarse al dashboard sin descargar nada nuevo.

### Del CSV sh_datos_40.csv (Sector 40 Banca Múltiple — 304 meses, dic 2000 – mar 2026)

| Métrica | Concepto CNBV | Nivel disponible | Estado |
|---|---|---|---|
| ~~Tasa de interés implícita activa~~ | ~~40200162~~ | ~~Sistema~~ | ✅ MifChart (2026-06-04) |
| ~~Tasa de interés implícita pasiva~~ | ~~40200037~~ | ~~Sistema~~ | ✅ MifChart (2026-06-04) |
| ~~Margen de intermediación financiera (MIF)~~ | ~~40200218~~ | ~~Sistema~~ | ✅ MifChart (2026-06-04) |
| ~~Tasa de deterioro ajustada (TDA)~~ | ~~40200074~~ | ~~Sistema~~ | ✅ ImoraChart línea TDA (2026-06-05) |
| ~~EPRC / Cartera IFRS9 (E1+E2+E3)~~ | ~~40200118~~ | ~~Sistema~~ | ✅ EprcChart (2026-06-05) |
| ~~Quitas y castigos — flujo 12 meses~~ | ~~40200193~~ | ~~Sistema~~ | ✅ QuitasChart (2026-06-04) |
| ~~Crecimiento de cartera total (YoY anual)~~ | ~~40100185 (saldo=130)~~ | ~~Sistema~~ | ✅ CarteraCrecimientoChart (2026-06-10) |
| IMORA por banco individual | 40200033 × entidad | Por banco | En JSON `historico_por_banco.imor_total` · chart con dropdown ✅ |
| ICOR por banco individual | 40200096 × entidad | Por banco | En JSON `historico_por_banco.icor_total` · chart con dropdown ✅ |
| ROA y ROE por banco individual | 40200001/002 × entidad | Por banco | En JSON `historico_por_banco.roa/roe` · chart con dropdown ✅ |
| ~~IMOR por cartera × banco~~ | ~~40100xxx × entidad~~ | ~~Por banco × cartera~~ | ✅ Pills de cartera visibles en vista "Por banco" — `ImorSegPivotChart` (US-401, 2026-06-11) |

### Del R12A IFRS9 (ya descargado — dic 2019 – mar 2026)

| Métrica | Disponibilidad | Estado |
|---|---|---|
| ~~IFRS9 etapas 1/2/3 por banco~~ | ~~Por entidad~~ | ✅ Ifrs9Chart dropdown 48 bancos (2026-06-04) |
| ~~IFRS9 etapas por segmento de cartera~~ | ~~Comercial/Consumo/Vivienda~~ | ✅ Ifrs9Chart pills segmento (2026-06-04) |

### SoFiPOs (en JSON — `historico_por_entidad` disponible)

| Métrica | Disponibilidad actual | Estado |
|---|---|---|
| ~~IMOR por cartera sistema total~~ | — | ✅ SofiposSegmentChart |
| ~~IMORA + ROA sistema~~ | — | ✅ SofiposImoraRoaChart |
| ~~Entidades individuales~~ | `historico_por_entidad` en JSON | ✅ SofiposEntidadesChart (top 15, toggle cartera) |
| ~~ROE sistema SoFiPOs~~ | ~~`sofipos.roe` 123 meses~~ | ✅ KpiCard + línea discontinua azul en SofiposImoraRoaChart (2026-06-11) |
| IMOR por cartera × entidad individual | `historico_por_entidad` — verificar granularidad | ❌ Pendiente (US-404) |

### Otros reportes CNBV (pendientes de descarga manual)

| Métrica | Fuente | Notas |
|---|---|---|
| Liquidez LCR y NSFR | Reporte R13/similar | Basilea III — activos líquidos / salidas netas 30 días |
| ICAP índice de capitalización | Boletín capitalización CNBV | Capital neto / Activos sujetos a riesgo — mínimo 10.5% (no está en sh_datos_40.csv) |

### Banxico SIE API (token activo — series automáticas)

| Métrica | Serie | Frecuencia | Estado |
|---|---|---|---|
| ~~Reservas internacionales brutas~~ | ~~SF43707~~ | ~~Semanal~~ | ✅ KpiCard + ReservasChart (2026-06-01) |
| ~~TIIE 28d~~ | ~~SF43783~~ | ~~Diaria~~ | ✅ Corregida (fix 2026-05-31) |
| ~~INPC subyacente~~ | ~~SP74625~~ | ~~Mensual~~ | ✅ En pipeline y dashboard (2026-06-01) |
| ~~INPC no subyacente~~ | ~~SP74627~~ | ~~Mensual~~ | ✅ En pipeline y dashboard (2026-06-01) |
| ~~Salario mínimo general~~ | ~~SL11298~~ | ~~Anual~~ | ✅ KpiCard + SalarioMinimoChart en Macro (2026-06-10) |
| ~~Remesas familiares~~ | ~~SE27803~~ | ~~Mensual~~ | ✅ KpiCard `$4,978 MUSD` + `RemesasChart.tsx` en Macro (2026-06-11) |
| ~~IGAE historia larga~~ | ~~736181 + 737370~~ | ~~T+53 días~~ | ✅ Pipeline fusiona ambas series, eliminado `IGAE_CUTOFF` (2026-06-11, US-310) |
| PIB trimestral | INEGI BIE 381016 | T+55 días | ✅ En pipeline y dashboard |
| ~~Desocupación ENOE~~ | ~~444774~~ | ~~Mensual~~ | ✅ DesempleoChart en Macro (2026-06-01) |
| ~~Subocupación ENOE~~ | ~~444775~~ | ~~Mensual~~ | ✅ DesempleoChart línea punteada (2026-06-10) |
| ~~Informalidad ENOE~~ | ~~444779~~ | ~~Mensual~~ | ✅ InformalidadChart en Macro (2026-06-01) |
| Exportaciones | 471584 | Mensual | ❌ HTTP 400 post-BIE dic 2025 — ID roto |
| Importaciones | 471588 | Mensual | ❌ HTTP 400 post-BIE dic 2025 — ID roto |
| Inversión fija bruta | 462219 | Mensual | ❌ HTTP 400 post-BIE dic 2025 — ID roto |

---

*Actualizado: 2026-06-10*
