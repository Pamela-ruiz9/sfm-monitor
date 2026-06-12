# Roadmap SFM Monitor — Epics y Historias de Usuario

**Última actualización:** 2026-06-11 (sesión — Score Global + API pública v1)  
**Versión en producción:** v0.2.0-dev (Astro app reemplazó el `index.html` via `deploy.yml`)  
**Autora:** Ingrid Pamela Ruiz Puga · Co-autor blueprint: Artemio Padilla

---

## Resumen ejecutivo

SFM Monitor está en producción con el stack Astro 5 + React 19. El cutover formal (tag v0.2.0, Zenodo DOI) está pendiente de confirmación. El dashboard cubre las 5 pestañas con datos automáticos (Banxico + INEGI vía GitHub Actions) y datos CNBV manuales mensuales. La sección Macro tiene sub-ruta "Noticias & Impacto" operativa con pipeline Watchboard build-time, panel de contexto macroeconómico y filtro por categoría. La app tiene modo claro/oscuro persistente. El HeroScore muestra el **Score Global compuesto** (percentil rolling, 8 KPIs, pesos 50/30/20) con 3 barras de subíndices y link a metodología. La **API pública estática v1** expone 6 endpoints JSON con CORS abierto, generados en cada deploy.

### Estado de gates

| Gate | Estado |
|---|---|
| G1 — charts migradas | ✅ Completo (todos los charts CNBV + macro + mercado implementados) |
| G2 — Playwright visual | ✅ Desktop OK · smoke-check.spec.ts verde · mobile/webkit pendiente |
| G3 — Paridad de datos | ✅ Completo |
| G4 — CitationBox + MetricTooltip | ✅ Completo |
| G5 — Observabilidad | 🔴 Código listo, GoatCounter + Healthchecks pausados |
| G6 — Deploy | ✅ GitHub Pages via `deploy.yml` — Cloudflare descartado |
| G7 — Tag v0.2.0 en remoto | 🔴 Pendiente confirmación de Pame |

---

## Epic 1 — Sprint de bugs pre-cutover ✅ COMPLETO

| US | Descripción | Estado |
|---|---|---|
| US-101 | TabId 'riesgo' + SwipeNav | ✅ |
| US-102 | Shell PWA completo en /riesgo | ✅ |
| US-103 | IMOR KPI dinámico (no hardcode) | ✅ |
| US-104 | Tasa Banxico duplicada + eje TIIE (#101) | ✅ |
| US-105 | ICOR eje Y desproporcionado (#93) | ✅ |
| US-106 | IMORA multiplicador (#92) — no-bug confirmado | ✅ |

---

## Epic 2 — Cutover formal

**Objetivo:** Tag v0.2.0, DOI Zenodo, cleanup legacy.

| US | Descripción | Estado |
|---|---|---|
| US-201 | Playwright mobile/webkit G2 | 🔶 Desktop OK, webkit pendiente |
| US-202 | CitationBox APA/BibTeX/RIS | ✅ Completo |
| US-203 | MetricTooltip glosario hover | ✅ Completo |
| US-204 | Sentry error tracking | 🔴 Pendiente |
| US-205 | GoatCounter + Healthchecks.io | 🔴 Código listo, servicios sin configurar |
| US-206 | Deploy GitHub Pages | ✅ Activo vía `deploy.yml` |
| US-207 | Tag v0.1.0 en remoto | 🔴 Requiere confirmación Pame |
| US-208 | Cutover formal v0.2.0 | 🔴 Pendiente US-207 + confirmación |

---

## Epic 3 — Contenido y datos automáticos

**Objetivo:** Explotar al máximo las fuentes que ya corren en GitHub Actions sin descargas adicionales.

### US-301 — Reservas internacionales ✅
Completo. SF43707 en pipeline, `ReservasChart.tsx` + KpiCard en home.

### US-302 — INEGI BIE (IGAE, PIB, ENOE) ✅ (parcial)
Pipeline consulta: IGAE (737370), PIB (381016), desocupación (444774), subocupación (444775), informalidad (444779).  
**Limitación activa:** IGAE serie 737370 solo tiene 4 meses de historia (dic 2025–mar 2026) — nueva serie post-migración BIE. Exportaciones (471584), importaciones (471588), IFB (462219) retornan HTTP 400 — IDs rotos, probe-inegi.yml creado para identificar nuevos IDs.

### US-303 — Charts macro completos ✅
`IgaeChart`, `PibChart`, `DesempleoChart` (con subocupación), `InformalidadChart`, KpiCards tasa real, salario mínimo. Macro page completa.

### US-304 — ICAP (capitalización) desde CSV CNBV
**Estado:** Pendiente. Requiere descarga manual del reporte de capitalización CNBV.  
**Bloqueo:** No está en `sh_datos_40.csv` actual — es un reporte separado (boletin_capitalizacion.xlsx).

### US-305 — MIF y tasas implícitas ✅
`MifChart.tsx` implementado. Conceptos 40200218/40200162/40200037 en pipeline CNBV.

### US-306 — Inflación subyacente y no subyacente ✅
SP74625 + SP74627 en pipeline. `InflacionChart.tsx` con 3 líneas.

### US-307 — Informalidad + tasas reales ✅
`InformalidadChart.tsx` serie 444779. KpiCards tasa real Banxico y Cetes 28d.

### US-308 — Remesas familiares — KpiCard + chart ✅ 2026-06-11
`RemesasChart.tsx` (línea verde, 22 meses), KpiCard `$4,978 MUSD`, `metricSlug="remesas"`. Datos Banxico SE27803.

### US-309 — SoFiPOs ROE — conectar serie existente ✅ 2026-06-11
`sofipos.roe` (123 meses) en `SofiposImoraRoaChart` como tercera línea discontinua azul (`#79c0ff`). KpiCard con tone dinámico verde/rojo.

### US-310 — IGAE historia pre-2026 ✅ 2026-06-11
Pipeline fusiona serie BIE 736181 (historia pre-2026) con 737370 (post-dic-2025). Eliminado filtro `IGAE_CUTOFF`. Workflow disparado manualmente; el historial completo estará en sfm-data.json desde la próxima ejecución automática.

### US-311 — Crecimiento de cartera total ✅
`CarteraCrecimientoChart.tsx` implementado. Concepto 40100185, 304 meses 2001–2026. YoY en Banca Múltiple.

### US-312 — Salario mínimo general ✅
Serie SL11298 en pipeline. KpiCard $315.04 + `SalarioMinimoChart.tsx` en Macro.

### US-313 — Subocupación ENOE ✅
Serie 444775 en pipeline. Línea punteada en `DesempleoChart.tsx`. KpiCard en Macro.

### US-314 — Íconos PWA reales ✅
Íconos 192/512/maskable/apple-touch reemplazan placeholders 1×1.

### US-315 — Pipeline Watchboard build-time ✅ 2026-06-11
`scripts/fetch-watchboard.py` fetcha 4 trackers (global-recession-risk, sheinbaum-presidency, trump-presidencies, mexico) + KPIs vía API pública Watchboard. `.github/workflows/update-watchboard.yml` corre cron L-V 14:00 UTC, commitea `data/watchboard-events.json` si hubo cambios, dispara `deploy.yml`. `app/src/data/watchboard-loader.ts` con schema Zod + caché por módulo. NoticiasFeed refactorizado: zero fetches en cliente, acepta `initialItems` build-time. ContextoBanda acepta `rawKpis` build-time.

---

## Epic 4 — Instituciones: filtros combinados banco × cartera

**Objetivo:** Habilitar exploración cruzada por institución Y por tipo de cartera en todos los indicadores disponibles. El usuario debe poder ver, por ejemplo, "IMOR consumo de Banamex" o "ROA de Nu México".

**Datos disponibles en JSON:**
- `historico_por_banco` — 62 bancos, 304 meses. Campos por banco: `imor_total`, `imor_comercial`, `imor_consumo`, `imor_vivienda`, `imor_tarjeta`, `imora_total`, `icor_total`, `roa`, `roe`
- `sofipos.historico_por_entidad` — series por institución SoFiPO (IMOR por cartera)

### US-401 — Selector combinado banco × cartera en ImorSegPivotChart ✅ 2026-06-11
Pills de cartera (Total/Comercial/Consumo/Vivienda/Tarjeta) visibles en vista "Por banco". Se agregó constante `BANCO_CARTERAS` y guard para resetear `consumo_norev` al cambiar de vista. La lógica de datos ya existía en el `useMemo`.

### US-402 — Filtro por banco en IMORA, ICOR, ROA/ROE ✅ Ya implementado
`ImoraChart`, `IcorChart`, `RoaRoeChart` tienen selector de banco funcional. No existe desglose por cartera para IMORA/ICOR/ROA/ROE en el JSON (solo `imora_total`, `icor_total`, `roa`, `roe` por banco). No requiere trabajo adicional — los datos no existen.

### US-403 — Vista "por institución" unificada en Instituciones ✅ 2026-06-11
`BancoPerfilPanel` en `/instituciones/banca-multiple`: selector de banco con 5 KPI chips (IMOR, IMORA, ICOR, ROA, ROE con comparativa vs sistema) + pills de cartera + mini chart IMOR últimos 36 meses. Al seleccionar banco, los charts IMOR/IMORA/ICOR/ROA+ROE se sincronizan vía nanostore `$selectedBancoId`.

### US-404 — SoFiPOs por entidad con filtro de cartera
**Estado:** `historico_por_entidad` existe en `sfm-data.json`. `SofiposEntidadesChart` muestra IMOR total por entidad. Falta cruzar entidad × cartera.  
**Tarea:** En la vista de entidad individual, mostrar IMOR comercial/consumo/vivienda de esa entidad.  
**Esfuerzo:** M · **Dependencia:** Verificar estructura de `historico_por_entidad` en el JSON

### US-405 — Toggle de métrica en vista por institución
**Estado:** Hoy el usuario tiene que navegar a secciones diferentes para ver distintos indicadores del mismo banco.  
**Tarea:** Selector de métrica (IMOR / IMORA / ICOR / ROA / ROE) dentro de la vista por institución — un solo chart que cambia de métrica.  
**Esfuerzo:** M · **Dependencia:** US-403

---

## Epic 5 — UX e interacción

| US | Descripción | Estado | Esfuerzo |
|---|---|---|---|
| US-501 | Drag-to-zoom en series temporales | 🔴 Pendiente | M |
| US-502 | Exportación PNG/CSV con atribución | 🔴 Pendiente | M |
| US-503 | Permalinks con nuqs (estado en URL) | 🔴 Pendiente | M |
| US-504 | Embeds iframes responsive | 🔴 Pendiente | M |
| US-505 | Selector rango fechas 1A/3A/5A/Máx universal | 🔶 FX/Tasa/Inflación OK · resto pendiente | S |
| US-506 | Sub-nav móvil en Header para Macro e Instituciones | ✅ 2026-06-11 — strip `lg:hidden` en Header con regex match por ruta | S |
| US-507 | Modo claro / oscuro persistente | ✅ 2026-06-11 — `ThemeToggle.tsx` (client:only react) en Sidebar + Header icon-only; `html.light` CSS vars override; anti-FOUC inline script en `<head>`; `localStorage['sfm-theme']` | S |

---

## Epic 6 — Features estratégicas (medio plazo)

| US | Descripción | Estado | Esfuerzo |
|---|---|---|---|
| US-601 | API pública `/api/v1/*.json` con CORS | ✅ 2026-06-11 — 6 endpoints estáticos: index, snapshot, score, credito, macro, sofipos | M |
| US-602 | Paquete Python `sfmriskmx` en PyPI | 🔴 | M |
| US-603 | Comparativa internacional MX vs LatAm/OCDE | 🔴 Completar Epic 3 primero | XL |
| US-604 | Credit-to-GDP gap metodología BIS | 🔴 | L |
| US-605 | Índice de stress financiero propio (CISS) | ✅ 2026-06-11 — `score.ts` + `HeroScore.astro` + sección colapsable en `/metodologia#score-global`. Percentil rolling 8 KPIs, pesos 50/30/20, 5 bandas de color, referencia ECB CISS (Hollo et al. 2012) | XL |
| US-606 | ICAP + LCR/NSFR desde reportes CNBV manuales | 🔴 Requiere descarga CNBV | M |
| US-607 | Noticias & Impacto — página `/macro/noticias` | ✅ 2026-06-11 — feed Watchboard (4 trackers), `applyRules()` 10 reglas 4 ejes SFM, `NoticiaCard` con badge de impacto, `ContextoBanda` con KPIs macroeconómicos en español + párrafo resumen | M |

---

## Backlog sin sprint

| Pendiente | Bloqueo |
|---|---|
| Exportaciones/importaciones/IFB INEGI | IDs rotos post-BIE dic 2025 — probe-inegi.yml creado |
| ICAP, LCR/NSFR | Descarga manual CNBV (boletin_capitalizacion.xlsx, reporte_liquidez.xlsx) |
| IGAE historia larga | Nuevo ID INEGI BIE para serie pre-2025 |
| IFRS9 por banco (granular) | R12A no tiene granularidad por institución en CSV público |

---

*Actualizado: 2026-06-11 — Score Global (US-605) + API pública v1 (US-601) + BancoPerfilPanel (US-403)*
