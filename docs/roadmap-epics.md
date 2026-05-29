# Roadmap SFM Monitor — Epics y Historias de Usuario

**Fecha:** 2026-05-28  
**Versión objetivo próxima:** v0.2.0 (cutover target: **martes 10 de junio de 2026**)  
**Autora:** Ingrid Pamela Ruiz Puga · Co-autor blueprint: Artemio Padilla

---

## Resumen ejecutivo

SFM Monitor está en `v0.2.0-dev` con el stack Astro 5 + React 19 listo para cutover. Se identificaron 6 bugs (4 en código, 2 en datos/charts) y 6 gates de cutover pendientes. El target de cutover es el 10 de junio de 2026. Post-cutover, el roadmap contempla 3 sprints: datos/contenido, UX, y features estratégicas de largo plazo (API pública, comparativa internacional, índice de stress propio).

**Estado de gates a 2026-05-28:**

| Gate | Estado |
|---|---|
| G1 — 9/9 charts migradas | ✅ Completo |
| G2 — Playwright visual | 🔶 Desktop OK, mobile/webkit pendiente |
| G3 — Paridad de datos | ✅ Completo |
| G4 — CitationBox + MetricTooltip | ✅ Completo (CitationBox + MetricTooltip + glossary.ts implementados) |
| G5 — Observabilidad | 🔴 Código listo, servicios pausados (GoatCounter, Healthchecks, Sentry pendiente) |
| G6 — Deploy preview Cloudflare | 🔴 Pendiente — bloquea el cutover |
| G7 — Tag v0.1.0 en remoto | 🔴 Existe local, sin push |

---

## Epic 1 — Sprint de bugs pre-cutover

**Objetivo:** Dejar todos los bugs conocidos resueltos antes de ejecutar el cutover.  
**Estado:** US-101, US-102, US-103 ya corregidos en commit `fix: TabId riesgo + PWA en riesgo.astro + IMOR asOf real`.

---

### US-101 — Agregar `'riesgo'` a `TabId` y sincronizar SwipeNav ✅

**Como** desarrolladora, **quiero** que `TabId` incluya `'riesgo'` y que `activeTab.ts` mapee `/riesgo` correctamente, **para** que SwipeNav funcione en móvil en la página `/riesgo`.

**Estado:** Corregido. TabId, PATH_TO_TAB, TAB_TO_PATH y adjacentTab actualizados.  
**Esfuerzo:** XS · **Labels:** bug, mobile

---

### US-102 — Completar shell de `/riesgo` con componentes PWA faltantes ✅

**Como** desarrolladora, **quiero** que `riesgo.astro` incluya UpdateToast, PWAInstallPrompt, OnboardingTour y PullToRefresh, **para** que la experiencia PWA sea consistente en todas las páginas.

**Estado:** Corregido. Imports y slots añadidos siguiendo el patrón de `macro.astro`.  
**Esfuerzo:** XS · **Labels:** bug, ux

---

### US-103 — KPI IMOR: reemplazar hardcode por dato dinámico ✅

**Como** analista financiero, **quiero** que el KPI "IMOR Banca" muestre fecha y valor reales del pipeline CNBV, **para** que no sea un placeholder estático que envejece silenciosamente.

**Estado:** Corregido. `asOf` ahora usa `data.credito.imor.fecha`.  
**Esfuerzo:** XS · **Labels:** bug, data-integrity

---

### US-104 — Gráfica Tasa Banxico duplicada en tab Macro + eje TIIE incorrecto (#101)

**Como** analista financiero, **quiero** ver una sola gráfica de tasas en el tab Macro con el eje TIIE correctamente escalado, **para** que la lectura de política monetaria no sea ambigua.

**Criterios de aceptación:**
- [ ] En `/macro`, no hay gráfica de Tasa Banxico duplicada respecto a Resumen
- [ ] El eje Y de TIIE refleja el valor real en % (ej. ~8.5%, no 850%)
- [ ] Las tres líneas (TIIE, Cetes, Banxico) son legibles en la misma escala
- [ ] `npm run build` pasa

**Esfuerzo:** S · **Labels:** bug, charts

---

### US-105 — ICOR: escala del eje Y desproporcionada (#93) ✅

**Como** analista financiero, **quiero** que la gráfica ICOR tenga bounds apropiados en el eje Y, **para** leer tendencias sin distorsión visual.

**Estado:** Corregido. `suggestedMax: 3.5`, tick formateado como `×1.23`.  
**Esfuerzo:** S · **Labels:** bug, charts

---

### US-106 — IMORA banca: verificar multiplicador ×100 duplicado (#92) ✅ (no-bug)

**Como** analista financiero, **quiero** confirmar si IMORA en ~100% es un bug de pipeline o datos reales.

**Estado:** Investigado. `imora_total` está en escala 0–100 (ej. 4.39 = 4.39%); `ImoraChart` no aplica multiplicador adicional; valores históricos 2.35%–8.10% son plausibles. **No hay bug.** Issue cerrado.

**Anomalía encontrada:** TIIE Fondeo (SF343410) en `sfm-data.json` muestra ~17–21% vs tasa objetivo Banxico ~6.5–9%. Posible bug de pipeline — serie equivocada o unidades incorrectas en `update-data.yml`. Requiere investigación manual del pipeline.

**Esfuerzo:** M · **Labels:** bug, data-integrity, pipeline

---

## Epic 2 — Sprint de cutover (target: 10 junio 2026)

**Objetivo:** Completar gates G2, G4, G5, G6, G7 para ejecutar el cutover el martes 10 de junio.  
**Precondición:** Bugs US-101 a US-103 resueltos (ya están).

---

### US-201 — Cobertura Playwright mobile (webkit) y comparación vs legacy [G2]

**Como** desarrolladora, **quiero** Playwright con cobertura completa en mobile y comparación contra el `index.html` legacy, **para** que el gate G2 quede verde antes del cutover.

**Criterios de aceptación:**
- [ ] `webkit` instalado en CI
- [ ] Baselines en 5 viewports: desktop 1280×720, desktop 1440×900, mobile 375×667 Chrome, mobile 375×667 webkit, tablet 768×1024
- [ ] `toHaveScreenshot({ maxDiffPixelRatio: 0.005 })` pasa para las 5 rutas en todos los viewports
- [ ] Al menos 1 test de comparación lado a lado contra legacy (FX, Tasa Banxico, INPC)
- [ ] CI reporta "G2 PASS" en el PR de cutover

**Esfuerzo:** L · **Labels:** testing, infra · **[DESBLOQUEA G2]**

---

### US-202 — Componente `<CitationBox>` con APA / BibTeX / RIS [G4] ✅

**Como** periodista/ciudadano, **quiero** un cuadro de citación con formatos listos para copiar, **para** poder citar el dashboard correctamente en artículos o trabajos académicos.

**Criterios de aceptación:**
- [ ] `CitationBox.astro` con props: `title`, `authors`, `url`, `doi`, `year`, `version`
- [ ] Tres pestañas: APA / BibTeX / RIS con botón "Copiar" por pestaña
- [ ] DOI: `10.5281/zenodo.20370914`; versión: `v0.2.0`
- [ ] Incluido en `/metodologia` y en el footer de `Layout.astro`
- [ ] `npm run build` pasa

**Esfuerzo:** M · **Labels:** enhancement, citability · **[DESBLOQUEA G4]**

---

### US-203 — Componente `<MetricTooltip>` con glosario hover [G4] ✅

**Como** periodista/ciudadano, **quiero** que los acrónimos financieros muestren una definición en tooltip al hacer hover, **para** entender los indicadores sin navegar a Metodología.

**Criterios de aceptación:**
- [ ] `MetricTooltip.tsx` con `@floating-ui/react` (useFloating + useHover + useFocus)
- [ ] Accesible: `role="tooltip"`, activable por teclado, cierra con Escape
- [ ] Glosario centralizado en `app/src/data/glossary.ts` cubriendo: IMOR, IMORA, ICOR, IFRS 9, TIIE, Cetes, FIX, ROA, ROE, SoFiPO
- [ ] Usado en secciones de gráficas en `credito.astro` e `instituciones.astro`
- [ ] Bundle JS adicional < 5 KB gzip

**Esfuerzo:** M · **Labels:** enhancement, ux, a11y · **[DESBLOQUEA G4]**

---

### US-204 — Configurar Sentry para error tracking [G5]

**Como** sistema, **quiero** que los errores JS en producción sean capturados en Sentry, **para** detectar regresiones post-cutover sin depender de reportes manuales.

**Criterios de aceptación:**
- [ ] `@sentry/astro` instalado; `sentry()` en `astro.config.ts` con DSN desde env
- [ ] Secret `PUBLIC_SENTRY_DSN` en GitHub Actions
- [ ] Sin errores de inicialización cuando el DSN no está definido (modo no-op en dev)
- [ ] Error de prueba verificado en el dashboard de Sentry antes de merge

**Esfuerzo:** S · **Labels:** infra · **[DESBLOQUEA G5 parcial]**

---

### US-205 — Activar GoatCounter y Healthchecks.io [G5]

**Como** sistema, **quiero** GoatCounter registrando visitas y Healthchecks.io confirmando el pipeline, **para** tener observabilidad básica desde el día del cutover.

**Contexto:** El código condicional ya existe en el repo (`Layout.astro` y `update-data.yml`). Solo falta configurar los servicios externos y añadir secrets.

**Criterios de aceptación:**
- [ ] Cuenta GoatCounter creada; secret `PUBLIC_GOATCOUNTER_URL` en GitHub Actions
- [ ] Una visita al deploy preview aparece en GoatCounter
- [ ] Check creado en healthchecks.io; secret `HEALTHCHECKS_URL` configurado
- [ ] Ejecución manual de `update-data.yml` confirma ping exitoso en healthchecks.io

**Esfuerzo:** S · **Labels:** infra · **[DESBLOQUEA G5]**

---

### US-206 — Deploy preview en Cloudflare Pages [G6]

**Como** desarrolladora, **quiero** el Astro app desplegado en Cloudflare Pages con dominio de preview y CNAME `sfmrisk.mx`, **para** verificar que todo funciona antes del cutover.

**Criterios de aceptación:**
- [ ] Proyecto creado en Cloudflare Pages; build: `cd app && npm ci && npm run build`; output: `app/dist`
- [ ] Variable `BASE_URL=/` configurada en Cloudflare
- [ ] Deploy carga sin 404 en assets CSS/JS
- [ ] CNAME `sfmrisk.mx` → Cloudflare Pages; TLS emitido automáticamente
- [ ] Lighthouse 90+ Performance, 100 Accessibility, 100 SEO en el deploy real
- [ ] PWA instala correctamente en Chrome Android

**Esfuerzo:** L · **Labels:** infra, deploy · **[DESBLOQUEA G6 — bloquea el cutover]**

---

### US-207 — Publicar tag `v0.1.0` y crear branch `legacy/v0.1.0` [G7]

**Como** desarrolladora, **quiero** el tag `v0.1.0` visible en GitHub y una branch legacy de respaldo, **para** que el DOI Zenodo sea resoluble y el rollback sea posible en < 2 minutos.

**Criterios de aceptación:**
- [ ] **[Requiere confirmación de Pamela]** `git push origin v0.1.0` ejecutado; tag visible en GitHub
- [ ] Zenodo recibe webhook y actualiza la versión del DOI `10.5281/zenodo.20370914`
- [ ] Branch `legacy/v0.1.0` apunta al último commit del HTML monolítico

**Esfuerzo:** S · **Labels:** infra, release · **[DESBLOQUEA G7]**

---

### US-208 — Ejecutar cutover el martes 10 de junio de 2026 [MILESTONE]

**Como** desarrolladora, **quiero** ejecutar el cutover completo el 10 de junio de 2026, 14:00–17:00 CDMX, **para** que `sfmrisk.mx` sirva el Astro app como producción definitiva.

**Precondiciones:** US-101 ✅, US-102 ✅, US-103 ✅, US-201, US-202, US-203, US-204, US-205, US-206, US-207 completados.

**Criterios de aceptación:**
- [ ] Branch `release/v0.2.0` creada; `index.html` movido a `legacy/v0.1.0.html`
- [ ] `app/astro.config.ts` con `base: '/'`
- [ ] Workflow `deploy-astro.yml` creado y CI verde
- [ ] PR mergeado; Pages sirve Astro en `pamela-ruiz9.github.io/sfm-monitor/`
- [ ] **[Requiere confirmación de Pamela]** Tag `v0.2.0` pusheado; DOI Zenodo v0.2.0 asignado

**Esfuerzo:** XL · **Ventana backup:** viernes 12 junio, 16:00+ CDMX

---

## Epic 3 — Sprint de contenido y datos (post-cutover inmediato)

**Objetivo:** Completar la cobertura de indicadores prioritarios: reservas, IGAE/PIB, ICAP y datos adicionales del CSV CNBV ya disponible.

---

### US-301 — Reservas internacionales al pipeline Banxico (SF43707)

**Como** sistema, **quiero** la serie SF43707 en `update-data.yml`, **para** que `ReservasChart.tsx` muestre datos reales. El chart ya existe, solo falta el dato.

**Criterios de aceptación:**
- [ ] `update-data.yml` consulta SF43707 junto al resto de series Banxico
- [ ] `data/sfm-data.json` incluye `reservas_internacionales` con historial y snapshot KPI
- [ ] Schema Zod estricto (no `z.unknown()`)
- [ ] `DataFreshnessBadge` refleja frecuencia semanal

**Esfuerzo:** S · **Labels:** data, enhancement

---

### US-302 — Parser INEGI BIE para IGAE mensual y PIB trimestral (#99 / issue #21)

**Como** desarrolladora, **quiero** un parser para la API INEGI BIE (claves 736181 e IGAE+381016), **para** traer IGAE y PIB al pipeline de forma automatizada.

**Criterios de aceptación:**
- [ ] Script Python en `/scripts/` consulta INEGI BIE post-migración dic 2025
- [ ] Validación con Pandera antes de escribir al JSON
- [ ] Campos `igae` y `pib_trimestral` en `data/sfm-data.json` con schema Zod estricto
- [ ] `npm run build` pasa sin errores

**Esfuerzo:** M · **Labels:** data

---

### US-303 — Completar tab Macro con gráficas IGAE y PIB

**Como** analista financiero, **quiero** ver IGAE y PIB en el tab Macro, **para** tener contexto de actividad económica junto a los indicadores financieros. Hoy el tab tiene dos secciones "próximamente" vacías.

**Criterios de aceptación:**
- [ ] `IgaeChart.tsx` implementado con variación anual, anotaciones de crisis y KPI card
- [ ] `macro.astro` reemplaza ambos placeholders con contenido real
- [ ] El headline editorial de `macro.astro` pasa a ser dinámico (no hardcodeado)
- [ ] KPI card PIB con lag explícito: "Dato con rezago ~55 días"

**Esfuerzo:** S · **Labels:** enhancement · **Dependencias:** US-302

---

### US-304 — ICAP (índice de capitalización) desde CSV CNBV Sector 40

**Como** analista financiero, **quiero** ver el ICAP del sistema bancario con su distancia al mínimo regulatorio, **para** monitorear la solvencia del sector (ningún indicador de solvencia existe hoy en el dashboard).

**Criterios de aceptación:**
- [ ] Script extrae ICAP del CSV `sh_datos_40.csv` ya descargado
- [ ] `IcapChart.tsx` tipo bullet chart: ICAP actual vs mínimo regulatorio (10.5% + SCCS D-SIBs)
- [ ] KPI cards con ICAP, CCB y CCF actuales
- [ ] Nota sobre D-SIBs designados (BBVA, Santander, Banamex, Banorte, HSBC, Scotiabank, Inbursa)

**Esfuerzo:** M · **Labels:** data, enhancement

---

### US-305 — MIF y tasas implícitas activa/pasiva desde CSV CNBV

**Como** analista financiero, **quiero** ver el Margen de Intermediación Financiera, **para** entender la rentabilidad estructural del sector en contexto del ciclo de tasas.

**Criterios de aceptación:**
- [ ] Script extrae conceptos 40200218 (MIF), 40200162 (tasa activa), 40200037 (tasa pasiva)
- [ ] `MifChart.tsx` superpone las tres series con tasa Banxico como referencia
- [ ] KPI card con MIF actual y comparación con promedio 12 meses

**Esfuerzo:** S · **Labels:** data, enhancement

---

### US-306 — Inflación desagregada: subyacente y no subyacente

**Como** analista financiero, **quiero** ver inflación subyacente (SP74625) y no subyacente (SP74627) por separado, **para** distinguir presiones inflacionarias estructurales de volatilidad transitoria.

**Criterios de aceptación:**
- [ ] `update-data.yml` consulta SP74625 y SP74627 junto a SP1 (INPC general)
- [ ] `InflacionChart.tsx` muestra las tres series con toggle visible/oculto
- [ ] La alerta de inflación en `alerts.ts` puede evaluar subyacente

**Esfuerzo:** S · **Labels:** data, enhancement

---

## Epic 4 — Sprint de UX e interacción

**Objetivo:** Mejorar la experiencia de exploración para analistas (profundidad) y ciudadanos (contexto).

---

### US-401 — Botón "seleccionar todas / ninguna" en entidades SoFiPOs (#95) ✅

**Como** analista financiero, **quiero** seleccionar o deseleccionar todas las 45 entidades SoFiPOs con un clic, **para** no hacer clic individual al comparar sistema vs subconjunto.

**Criterios de aceptación:**
- [ ] Controles "Todas" y "Ninguna" en `SofiposEntidadesChart.tsx`
- [ ] Estado visual de los controles refleja selección actual
- [ ] No rompe selección individual existente

**Esfuerzo:** XS · **Labels:** enhancement, UX

---

### US-402 — Drag-to-zoom en series temporales (#97)

**Como** analista financiero, **quiero** hacer zoom en rangos específicos arrastrando el cursor, **para** explorar periodos de interés (COVID, Tequila, GFC) sin selectores preestablecidos.

**Criterios de aceptación:**
- [ ] `chartjs-plugin-zoom` + Hammer.js configurado en todos los charts de series temporales
- [ ] Zoom por drag en desktop y pinch-to-zoom en mobile
- [ ] Botón "Restablecer zoom" visible
- [ ] Anotaciones de crisis siguen visibles en el rango ampliado
- [ ] Bundle adicional < 20 KB gzip

**Esfuerzo:** M · **Labels:** enhancement, UX

---

### US-403 — Panel colapsable de explicación e interpretación por métrica (#98)

**Como** periodista/ciudadano, **quiero** expandir una explicación bajo cada gráfica, **para** entender qué significa el indicador y cuándo es preocupante.

**Criterios de aceptación:**
- [ ] `<details>` colapsado por defecto con "¿Qué significa este indicador?"
- [ ] Al expandir: pregunta en lenguaje humano, fórmula en KaTeX, interpretación del valor actual, umbrales, diferencia con estándar internacional
- [ ] Contenido en Astro Content Collection (no hardcodeado)
- [ ] Accesible por teclado (Enter/Space); WCAG 2.1 AA
- [ ] Implementado para IMOR, IMORA, ICOR, ICAP, FX, Tasa Banxico, Inflación

**Esfuerzo:** M · **Labels:** enhancement, docs, UX

---

### US-404 — Selector de rango de fechas con botones (1A / 3A / 5A / Máx) ✅ (FX, Tasa, Inflación)

**Como** analista financiero, **quiero** filtrar el rango temporal de una gráfica con botones, **para** cambiar rápidamente entre perspectivas de corto y largo plazo.

**Criterios de aceptación:**
- [ ] Botones 1A, 3A, 5A, Todo sobre cada chart de serie temporal principal
- [ ] Estado persiste en URL con `nuqs` (enlazable)
- [ ] "Todo" muestra historial completo (FX desde 1994, IMOR desde 2000…)
- [ ] Cambio inmediato, sin re-fetch

**Esfuerzo:** S · **Labels:** enhancement, UX

---

### US-405 — Exportación PNG/SVG/CSV con atribución embebida

**Como** analista financiero y periodista/ciudadano, **quiero** descargar gráficas y datos con la fuente correctamente citada, **para** usar el material en reportes propios.

**Criterios de aceptación:**
- [ ] Menú `<ExportMenu>` con PNG (html-to-image), SVG y CSV (BOM UTF-8 para Excel es)
- [ ] Todos los exports incluyen: `Fuente: SFM Risk Monitor · sfmrisk.mx · [YYYY-MM-DD]`
- [ ] CSV incluye atribución de fuente upstream (Banxico SIE + serie, CNBV Sector + fecha)
- [ ] Accesible por teclado
- [ ] Disponible en los 9 charts del gate G1

**Esfuerzo:** M · **Labels:** enhancement

---

## Epic 5 — Features estratégicas (medio plazo, post-cutover)

**Objetivo:** Convertir SFM Monitor en una plataforma citable, reutilizable y con perspectiva internacional. Corresponde a Fases 3-4 del blueprint.

---

### US-501 — API pública estática `/api/v1/*.json` con CORS

**Como** analista externo, **quiero** acceder a los datos via URL canónica con CORS abierto, **para** usarlos en notebooks y proyectos propios.

**Criterios de aceptación:**
- [ ] Archivos JSON estáticos en `/api/v1/{banxico,credito,sofipos,macro,index}.json`
- [ ] `_headers` de Cloudflare con `Access-Control-Allow-Origin: *` y `Cache-Control: public, max-age=3600`
- [ ] `/api/v1/index.json` con manifest: `{filename, hash, last_updated, n_rows}`
- [ ] Documentación OpenAPI 3.1 en `openapi.yaml`; Redoc CE en `/docs/api`

**Esfuerzo:** M · **Labels:** enhancement, infra

---

### US-502 — Paquete Python `sfmriskmx` en PyPI

**Como** investigador, **quiero** instalar `pip install sfmriskmx` y obtener DataFrames, **para** integrar los datos en notebooks sin parsear JSON manualmente.

**Criterios de aceptación:**
- [ ] Paquete ~50-80 líneas en `/packages/sfmriskmx/`
- [ ] API: `sfmriskmx.get_banxico()`, `.get_credito()`, `.get_sofipos()` → pandas DataFrame
- [ ] Publicado en PyPI; CI publica automáticamente en cada release (OIDC trusted publishing)
- [ ] Notebook de ejemplo en Google Colab (badge en README)

**Esfuerzo:** M · **Labels:** enhancement · **Dependencias:** US-501

---

### US-503 — Permalinks de vista con estado en URL (nuqs)

**Como** analista financiero, **quiero** copiar la URL de una vista filtrada, **para** compartir exactamente lo que veo con un colega.

**Criterios de aceptación:**
- [ ] `nuqs` serializa en URL: indicador activo, rango de fechas, banco/entidad, vista sistema/por banco
- [ ] Botón "Copiar enlace de esta vista" con `navigator.clipboard.writeText`
- [ ] URL compartida restaura el estado visual exacto en cualquier dispositivo
- [ ] Compatible con `<ClientRouter />` de Astro View Transitions

**Esfuerzo:** M · **Labels:** enhancement

---

### US-504 — Embeds iframes responsive para medios y blogs

**Como** periodista/ciudadano, **quiero** embeber una gráfica en mi sitio, **para** compartir datos interactivos sin redirigir a mis lectores.

**Criterios de aceptación:**
- [ ] Ruta `/embed/[indicator]` sin navegación ni footer
- [ ] Auto-resize via `postMessage` con tipo `sfm-height`
- [ ] `frame-ancestors *` en Cloudflare `_headers`
- [ ] Botón "Obtener código de embed" copia el snippet HTML
- [ ] oEmbed opcional en `/api/oembed?url=...&format=json`

**Esfuerzo:** M · **Labels:** enhancement · **Dependencias:** US-503

---

### US-505 — Filtros por institución en IFRS9 y Rentabilidad (#94)

**Como** analista financiero, **quiero** ver IFRS9 y ROA/ROE por banco individual, **para** identificar qué instituciones concentran el deterioro.

**Criterios de aceptación:**
- [ ] Verificar disponibilidad del CSV R12A por institución en CNBV (bloqueante)
- [ ] Si disponible: `Ifrs9Chart` y `RoaRoeChart` con toggle "Sistema / Por banco" como en `ImoraChart`
- [ ] Si no disponible: issue de seguimiento con estado "bloqueado por CNBV"

**Esfuerzo:** L · **Labels:** data, enhancement · **Dependencias:** disponibilidad CSV R12A por banco

---

### US-506 — Comparativa internacional MX vs LatAm/OCDE (#99 Fase 4)

**Como** analista financiero, **quiero** ver indicadores de México en perspectiva regional, **para** evaluar si el nivel de riesgo mexicano es alto o bajo comparado con Brasil, Colombia, Chile, OCDE.

**Nota:** Iniciar solo cuando México esté completamente afinado (post Epic 3).  
**Nota metodológica crítica:** IMOR México (IFRS 9 Etapa 3) vs NPL ratio IMF FSI no son directamente comparables — documentar explícitamente en el dashboard.

**Criterios de aceptación:**
- [ ] Pipeline integra IMF FSI (NPL, Capital/RWA, ROA) para BR, CO, CL + EE.UU./España
- [ ] BIS Data Portal agrega credit-to-GDP gap para los mismos países
- [ ] Componente `ComparativaChart.tsx` con tabla + gráfica de barras agrupadas
- [ ] Nota de no-comparabilidad visible en la UI
- [ ] Atribución IMF: `"Source: International Monetary Fund, Financial Soundness Indicators"`
- [ ] Verificar `bis.org/copyright.htm` antes de publicar datos BIS

**Esfuerzo:** XL · **Labels:** data, enhancement · **Dependencias:** US-501, US-302

---

### US-507 — Credit-to-GDP gap con metodología BIS

**Como** analista financiero, **quiero** ver el credit-to-GDP gap de México con metodología BIS (HP filter λ=400,000), **para** monitorear el indicador macroprudencial canónico de Basilea III.

**Criterios de aceptación:**
- [ ] HP filter unilateral λ=400,000 sobre crédito CNBV / PIB INEGI
- [ ] Comparación visual con gap publicado por BIS como validación
- [ ] Umbrales de Basilea III: L=2pp (CCyB escalonado), H=10pp (CCyB máximo 2.5%)
- [ ] Ficha metodológica documenta referencia BCBS d187 2010 y crítica Hamilton 2018 (end-point bias)

**Esfuerzo:** L · **Labels:** data, enhancement · **Dependencias:** US-302 (PIB), US-506

---

### US-508 — Índice de stress financiero propio (estilo IEMF/CISS)

**Como** analista financiero, **quiero** un índice compuesto de stress financiero, **para** tener una lectura integrada del sistema en un solo número.

**Nota:** La metodología y composición deben ser revisadas y aprobadas por Pamela antes de publicación — es la firma metodológica del proyecto.

**Criterios de aceptación:**
- [ ] Metodología documentada antes de implementar: 5-6 categorías, CDF empírica, equal-weight, agregación tipo CISS
- [ ] Backtesting visual contra: Tequila 1994-95, GFC 2008-09, COVID mar 2020
- [ ] `HeroScore.astro` actualizado con el índice calculado (reemplaza score heurístico actual)
- [ ] Disponible en API pública `/api/v1/stress-index.json`
- [ ] Ficha metodológica completa con referencia a IEMF Banxico (REF Oct 2018) y CISS BCE (Hollo et al. 2012)

**Esfuerzo:** XL · **Labels:** data, enhancement · **Dependencias:** US-304, US-302, US-306; requiere validación metodológica

---

### US-509 — Sección "Noticias & Impacto" — fase de investigación (#100)

**Como** periodista/ciudadano, **quiero** ver noticias macro con análisis de impacto en los indicadores del SFM, **para** entender la conexión entre eventos y los números del dashboard.

**Nota:** Esta historia es solo la fase de investigación/diseño. La implementación es una decisión editorial antes de ser técnica.

**Criterios de aceptación (investigación):**
- [ ] Decisión documentada sobre fuente de noticias: scraping / API terceros / editorial propio
- [ ] Decisión sobre modelo editorial: frecuencia, autor, longitud
- [ ] Evaluación: ¿dashboard integrado o newsletter Buttondown primero?
- [ ] Wireframe de UI mostrando integración visual sin saturar el dashboard
- [ ] Evaluación de implicaciones legales (reproducción de titulares de terceros)

**Esfuerzo:** M (investigación) / XL (implementación) · **Labels:** enhancement

---

## Backlog sin sprint asignado

Estas historias están identificadas pero sin sprint asignado hasta que se complete la investigación previa:

| Historia | Bloqueante |
|---|---|
| US-505 (filtros IFRS9 por banco) | Disponibilidad CSV R12A por institución en CNBV |
| US-506 (comparativa internacional) | Completar Epic 3 primero; verificar licencias BIS |
| US-507 (credit-to-GDP gap) | US-302 (PIB pipeline) |
| US-508 (índice de stress) | US-304, US-302, validación metodológica con Pame |
| US-509 (Noticias & Impacto) | Decisiones editoriales y de fuente de datos |

---

## Resumen de esfuerzo total estimado

| Epic | Historias | Esfuerzo total estimado |
|---|---|---|
| Epic 1 — Bugs | US-101 a US-106 (3 resueltos) | ~3h restante |
| Epic 2 — Cutover | US-201 a US-208 | ~20-25h |
| Epic 3 — Contenido | US-301 a US-306 | ~15-20h |
| Epic 4 — UX | US-401 a US-405 | ~12-15h |
| Epic 5 — Estratégico | US-501 a US-509 | ~40-60h (varios XL) |

---

*Generado el 2026-05-28. Basado en: revisión de código fuente, 10 issues GitHub abiertos (#92–#101), gates de cutover de `docs/cutover.md`, y roadmaps existentes en `docs/migration-astro.md` y `docs/roadmap-contenido.md`.*
