# Fichas Metodológicas — Glossary completo + metricSlug en todas las secciones

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan.

**Goal:** Que TODOS los indicadores visibles en el dashboard tengan "¿Qué es?" y "¿Cómo se interpreta?" accesibles via MetricInfo accordion. Sin Content Collections aún — solo completar `glossary.ts` y cablear `metricSlug` donde falte.

**Architecture:** `glossary.ts` es la única fuente de verdad. `MetricInfo.astro` ya lee de ahí. Solo hay que agregar las entradas faltantes y añadir `metricSlug="..."` a los `<Section>` que no lo tienen.

**Tech Stack:** TypeScript, Astro 5. Sin dependencias nuevas.

---

## Estado del arte

### Entries YA en glossary.ts (no tocar):
`imor`, `imora`, `icor`, `icap`, `ifrs9`, `tiie`, `cetes`, `fix`, `roa`, `roe`, `sofipo`

### Entradas FALTANTES a agregar:
`inflacion`, `fx` (alias de fix para indicatorId home), `tasa`, `reservas`, `spread-tiie-cetes`, `mif`, `eprc`, `quitas`, `crecimiento-cartera`, `igae`, `pib`, `desempleo`, `informalidad`, `salario-minimo`, `remesas`

### Sections SIN metricSlug (a cablear):
- **banca-multiple.astro**: secciones MIF, quitas, EPRC, crecimiento-cartera, IMORA ya tiene ✓
- **sofipos.astro**: sección imora-roa (ID: `sofipos-imora-roa`) no tiene metricSlug
- **macro/index.astro**: secciones igae, pib, desempleo, informalidad, salario (solo inflación tiene ✓)

---

## Task 1: Agregar todas las entradas faltantes a glossary.ts

**Files:**
- Modify: `app/src/data/glossary.ts`

- [ ] **Step 1: Agregar las 15 entradas nuevas al GLOSSARY object**

En `app/src/data/glossary.ts`, antes del cierre `};`, agregar:

```ts
  inflacion: {
    term: 'Inflación INPC',
    short: 'Variación anual del Índice Nacional de Precios al Consumidor. Objetivo Banxico: 3% ± 1pp.',
    full: 'El INPC es la medida oficial de inflación en México publicada por INEGI quincenalmente. Banxico tiene un objetivo de 3% con rango de tolerancia de ±1pp. La inflación por encima del objetivo mantiene la tasa de fondeo elevada, lo que encarece el crédito y presiona la morosidad con un rezago de 3–6 meses. La inflación subyacente (excluye alimentos y energía) es más informativa para la política monetaria.',
    formula: '(INPC mes t / INPC mismo mes t−12 − 1) × 100',
    threshold: 'Objetivo Banxico: 3% ± 1pp · Alerta: > 4% sostenido por > 3 meses',
    source: 'Banco de México, SIE, serie SP1 (general) · SP74625 (subyacente) · SP74627 (no subyacente)',
  },
  fx: {
    term: 'FIX MXN/USD',
    short: 'Tipo de cambio oficial MXN/USD determinado por Banxico. Referencia para obligaciones en dólares pagaderas en México.',
    full: 'El FIX es el tipo de cambio oficial publicado por Banxico ~12:00h cada día hábil, basado en el promedio del mercado cambiario mayorista del día anterior. Es la referencia legal para contratos y obligaciones en moneda extranjera (DOF Art. 8 Ley Monetaria). Una depreciación del peso encarece la deuda en dólares de empresas, presiona la inflación importada y puede afectar la solvencia de acreditados con ingresos en pesos y deudas en dólares.',
    formula: 'Promedio ponderado de operaciones del mercado mayorista del día hábil anterior',
    threshold: 'No hay umbral fijo · Contexto: COVID mar-2020 = $25.1 · SVB mar-2023 = $19.2 · Rangos históricos desde $3.1 (1993)',
    source: 'Banco de México, SIE, serie SF43718 · DOF 22 oct 1996',
  },
  tasa: {
    term: 'Tasa objetivo Banxico',
    short: 'Tasa de fondeo overnight objetivo del Banco de México. Ancla de todo el sistema de tasas de interés.',
    full: 'La tasa de política monetaria de Banxico es el instrumento principal para controlar la inflación. Cuando Banxico sube la tasa, el costo del crédito sube (hipotecas, consumo, empresarial) y la mora tiende a aumentar con un rezago de 3–9 meses. Cuando baja, alivia el costo financiero del sistema pero puede presionar el peso si hay diferencial negativo con la Fed. El ciclo de alzas 2021–2023 (de 4% a 11.25%) fue el más agresivo en la historia reciente.',
    formula: 'Determinada por el Comité de Política Monetaria de Banxico, reuniones ~cada 6 semanas',
    threshold: 'Neutral: tasa real ≈ 0% · Restrictiva: tasa real > 0% · Expansiva: tasa real < 0%',
    source: 'Banco de México, SIE, serie SF61745',
  },
  reservas: {
    term: 'Reservas internacionales',
    short: 'Activos en divisas y oro del Banco de México. Escudo ante presiones cambiarias y salidas de capital.',
    full: 'Las reservas internacionales brutas son el principal colchón de México ante presiones externas. Incluyen divisas (USD, EUR, GBP), DEGs del FMI, oro y posición de reserva. Un nivel elevado reduce la volatilidad del tipo de cambio y el riesgo de contagio financiero. La regla informal de adecuación del FMI sugiere ≥3 meses de importaciones. México ha mantenido reservas > $200 mmd desde 2014.',
    formula: 'Reservas brutas = divisas extranjeras + oro + DEGs + posición de reserva FMI',
    threshold: 'Referencia informal: ≥3 meses de importaciones. MX históricamente ≥$220 mmd',
    source: 'Banco de México, SIE, serie SF43707 · Publicación: martes ~9am cada semana',
  },
  'spread-tiie-cetes': {
    term: 'Spread TIIE−Cetes',
    short: 'Diferencial entre TIIE 28d y Cetes 28d. Mide la prima de liquidez en el mercado interbancario.',
    full: 'El spread TIIE−Cetes captura el costo adicional que los bancos se cobran entre sí (TIIE) sobre la tasa libre de riesgo del gobierno (Cetes). Un diferencial elevado refleja estrés de liquidez interbancaria o mayor percepción de riesgo de contraparte. Históricamente bajo (<50 pb) en periodos normales. Útil como sensor temprano de tensiones financieras, complementario a los indicadores de crédito.',
    formula: 'TIIE 28d (%) − Cetes 28d (%) · ambas en la misma ventana temporal',
    threshold: 'Normal < 50 pb · Tensión incipiente 50–100 pb · Estrés sistémico > 100 pb',
    source: 'Banco de México, SIE, series SF43783 (TIIE 28d) y SF60633 (Cetes 28d)',
  },
  mif: {
    term: 'MIF',
    short: 'Margen de Intermediación Financiera: diferencia entre la tasa activa y pasiva de la banca. Indicador de rentabilidad del negocio bancario.',
    full: 'El MIF mide cuánto cobra la banca por prestar menos lo que paga por captar. Un MIF alto puede reflejar poder de mercado (oligopolio bancario), alto riesgo de crédito que se transfiere al precio, o ineficiencias operativas. En México el MIF es históricamente elevado vs LATAM (~8–12% vs 4–6% regional), lo que implica crédito caro para familias y empresas. Su compresión indica mayor competencia o reducción de riesgo.',
    formula: 'Tasa de interés activa implícita − Tasa de interés pasiva implícita (ambas en %)',
    threshold: 'MIF México banca múltiple: 8–12%. Referencia: promedio OCDE ~3–5%. Compresión = mejor acceso a crédito',
    source: 'CNBV Portafolio de Información, Sector 40 (conceptos 40200218 MIF · 40200162 activa · 40200037 pasiva)',
  },
  eprc: {
    term: 'EPRC',
    short: 'Estimaciones Preventivas para Riesgos Crediticios. Reservas que la banca aparta para cubrir pérdidas esperadas en su cartera.',
    full: 'Las EPRC son el reconocimiento contable anticipado de pérdidas esperadas bajo IFRS 9 (modelo de pérdida esperada, no incurrida). Actúan como primer colchón de absorción antes de que las pérdidas afecten el capital. Un EPRC/Cartera creciente indica que los bancos anticipan mayor deterioro. Regulatoriamente, la metodología interna o la paramétrica de CNBV establece el mínimo requerido. El gráfico muestra EPRC como porcentaje de la cartera total IFRS9 (Etapas 1+2+3).',
    formula: 'EPRC / Cartera Total IFRS9 (E1+E2+E3) × 100',
    threshold: 'Sistema BM: ~2–4% de la cartera. Alerta: tendencia ascendente sostenida por > 3 trimestres',
    source: 'CNBV Portafolio de Información, Sector 40 (concepto 40200118)',
  },
  quitas: {
    term: 'Quitas y castigos',
    short: 'Flujo de créditos dados de baja por irrecuperables. Mide la pérdida crediticia real que el IMOR no captura.',
    full: 'Los castigos (write-offs) son créditos que el banco retira de su balance al considerarlos irrecuperables, con cargo a EPRC. Las quitas son renegociaciones donde se condona parte del saldo. El flujo acumulado en 12 meses es clave porque estos créditos "desaparecen" del balance sin elevar el IMOR. Un sistema que castiga mucho puede tener IMOR bajo pero pérdidas crediticias altas (maquillaje contable). El IMORA corrige parcialmente esto incluyendo castigos en su cálculo.',
    formula: 'Suma de castigos y quitas en los últimos 12 meses, expresada en miles de millones de pesos',
    threshold: 'Sistema BM: ~$150–250 mmdp anuales. Aceleración sostenida = señal de deterioro encubierto',
    source: 'CNBV Portafolio de Información, Sector 40 (concepto 40200193)',
  },
  'crecimiento-cartera': {
    term: 'Crecimiento de cartera',
    short: 'Variación anual del saldo de crédito de banca múltiple. Mide el dinamismo del financiamiento bancario.',
    full: 'El crecimiento de la cartera total refleja la capacidad del sistema para expandir el crédito a la economía. Un crecimiento real positivo (descontando inflación) impulsa la inversión y el consumo. Un crecimiento muy acelerado puede indicar relajamiento de estándares crediticios que luego se materializa en mora. Un crecimiento negativo o estancado señala credit crunch o recesión. El dato presentado es variación anual nominal del saldo total.',
    formula: '(Saldo cartera mes t / Saldo cartera mes t−12 − 1) × 100',
    threshold: 'Saludable: en línea con PIB nominal (~4–8% nominal). Alerta: contracción real o crecimiento >15% sin fundamento macro',
    source: 'CNBV Portafolio de Información, Sector 40 (concepto 40100185)',
  },
  igae: {
    term: 'IGAE',
    short: 'Índice General de Actividad Económica. Proxy mensual del PIB, publicado por INEGI con ~53 días de rezago.',
    full: 'El IGAE es el termómetro mensual de la economía mexicana. Captura actividad en 3 sectores: primario (agropecuario), secundario (industria, manufactura, construcción) y terciario (servicios comerciales y financieros). Se usa como proxy del PIB antes de que salga la cifra trimestral oficial (que tarda ~55 días). Variaciones anuales negativas por 2+ trimestres aproximan una recesión técnica. El rezago de 53 días limita su utilidad para reacción inmediata.',
    formula: 'Variación % del índice base 2018 respecto al mismo mes del año anterior (var. anual)',
    threshold: 'Expansión: > 2% · Desaceleración: 0–2% · Contracción: negativo · Recesión técnica: negativo 2+ trimestres',
    source: 'INEGI BIE, serie 737370 · Publicación: día 25 del mes T+53',
  },
  pib: {
    term: 'PIB',
    short: 'Producto Interno Bruto trimestral real. Medida más completa y oficial de la actividad económica de México.',
    full: 'El PIB trimestral de México es la estimación oficial de toda la producción nacional de bienes y servicios. Se publica por INEGI con ~55 días de rezago respecto al trimestre de referencia y se revisa en publicaciones posteriores. El PIB real (base 2018) elimina el efecto inflacionario para comparar crecimiento verdadero. Dos trimestres consecutivos negativos = recesión técnica. El PIB nominal (corriente) es relevante para calcular el crédito/PIB y otras razones financieras.',
    formula: 'Variación % del PIB real base 2018 respecto al mismo trimestre del año anterior',
    threshold: 'Expansión: > 2% · Estancamiento: 0–1% · Contracción: negativo · Recesión técnica: 2+ trimestres negativos',
    source: 'INEGI BIE, serie 381016 · Publicación: ~55 días después del trimestre de referencia',
  },
  desempleo: {
    term: 'Desocupación ENOE',
    short: 'Porcentaje de la PEA que no tiene trabajo pero busca activamente. Publicado mensualmente por INEGI/ENOE.',
    full: 'La tasa de desocupación abierta mide el porcentaje de la Población Económicamente Activa (PEA) sin trabajo pero buscando activamente. México tiene tasa estructuralmente baja vs OCDE (~2.5–3.5%) porque el sector informal absorbe a quienes no encuentran empleo formal. Interpretarla aislada subestima el problema laboral real. Se complementa con subocupación (trabaja menos de lo que quisiera) e informalidad (trabaja sin prestaciones). El gráfico también muestra subocupación para contexto.',
    formula: 'Desocupados / Población Económicamente Activa × 100',
    threshold: 'MX histórico: 2.5–4.5%. Alerta: tendencia ascendente sostenida o ruptura del rango histórico',
    source: 'INEGI ENOE, serie 444774 (desocupación) · 444775 (subocupación) · Publicación mensual T+28d',
  },
  informalidad: {
    term: 'Informalidad laboral',
    short: 'Porcentaje de la población ocupada sin acceso a seguridad social ni prestaciones laborales. ~55% de la ocupación en México.',
    full: 'La tasa de informalidad laboral de INEGI incluye a quienes trabajan en el sector informal (micronegocios sin registro, trabajo doméstico no remunerado) Y a quienes trabajan en el sector formal pero sin prestaciones de ley. En México ~55–58% de la ocupación es informal. Alta informalidad limita la recaudación fiscal, reduce el acceso al crédito formal y bancario, y comprime la base de cotizantes al IMSS (que financia la seguridad social). Es un indicador de profundidad del sistema financiero.',
    formula: 'Ocupados en condiciones de informalidad / Total de ocupados × 100',
    threshold: 'MX histórico: 55–58%. Caída sostenida hacia < 50% sería transformación estructural significativa',
    source: 'INEGI ENOE, serie 444779 · Publicación mensual con ~28 días de rezago',
  },
  'salario-minimo': {
    term: 'Salario mínimo general',
    short: 'Retribución diaria mínima legal en MXN, determinada por CONASAMI. Se actualiza anualmente en enero.',
    full: 'El Salario Mínimo General (SMG) en México es fijado por la Comisión Nacional de los Salarios Mínimos (CONASAMI) y se actualiza generalmente en enero. Desde 2019, ha tenido aumentos reales significativos (se duplicó en términos reales al 2024). Afecta directamente a ~10–15M de trabajadores formales y es referencia para contratos, multas y cálculos de prestaciones. Su incremento acelera el consumo interno y puede presionar costos laborales. Se publica en pesos por día (jornada legal de 8h).',
    formula: 'Pesos mexicanos por jornada de 8 horas · Vigente desde 1° enero de cada año',
    threshold: 'Referencia: UMA 2025 = $108.57/día · SMG zona libre norte (frontera) es mayor',
    source: 'Banco de México, SIE, serie SL11298 · CONASAMI resolución de vigencia anual',
  },
  remesas: {
    term: 'Remesas familiares',
    short: 'Flujo mensual de transferencias de mexicanos en el exterior a sus familias. Principal fuente de divisas de México.',
    full: 'Las remesas familiares son la principal fuente de divisas de México, superando IED y turismo en años recientes. El 95%+ proviene de EE.UU. (donde viven ~11M de migrantes mexicanos). Son contracíclicas: aumentan en crisis porque los migrantes apoyan más a sus familias en México. Una caída significativa implicaría un choque negativo en el consumo de hogares en estados de alta migración (Michoacán, Guerrero, Jalisco, Oaxaca). Representan ~3.5% del PIB y son críticas para la balanza de pagos.',
    formula: 'Suma de transferencias electrónicas, giros, cheques y efectivo recibido del exterior en el mes (millones de USD)',
    threshold: 'Récord 2023: ~$63.3 mmd anuales. Alerta: caída anual > 10% sostenida por 2+ meses',
    source: 'Banco de México, SIE, serie SE27803 · Publicación mensual con ~30 días de rezago',
  },
```

- [ ] **Step 2: Verificar TypeScript**

```bash
cd app && npx tsc --noEmit 2>&1 | grep glossary
```

Esperado: sin output.

- [ ] **Step 3: Commit**

```bash
git add app/src/data/glossary.ts
git commit -m "feat(fichas): 15 entradas nuevas en glossary.ts — inflacion, tasa, reservas, MIF, EPRC, quitas, IGAE, PIB, desempleo, informalidad, salario-minimo, remesas y más"
```

---

## Task 2: Cablear metricSlug en banca-multiple.astro (secciones sin ficha)

**Files:**
- Modify: `app/src/pages/instituciones/banca-multiple.astro`

Leer el archivo primero para identificar los IDs de sección exactos (buscar `<Section` sin `metricSlug`). Las secciones que YA tienen metricSlug son: imor, imora, icor, roa, ifrs9.

Las que DEBEN recibirlo:
- Sección de **MIF** → `metricSlug="mif"`
- Sección de **Quitas y castigos** → `metricSlug="quitas"`
- Sección de **EPRC** → `metricSlug="eprc"`
- Sección de **Crecimiento de cartera** → `metricSlug="crecimiento-cartera"`

- [ ] **Step 1: Leer banca-multiple.astro para ubicar las secciones**

```bash
grep -n "Section\|metricSlug\|MIF\|Quita\|EPRC\|Crecimiento\|cartera" app/src/pages/instituciones/banca-multiple.astro | head -50
```

- [ ] **Step 2: Agregar metricSlug a cada sección faltante**

Para cada `<Section` encontrado sin `metricSlug`, agregar el prop correspondiente. Ejemplo:

```astro
<Section
  id="bm-mif"
  eyebrow="Rentabilidad"
  title="Margen de Intermediación Financiera"
  ...
  metricSlug="mif">
```

El prop `metricSlug` va en la misma línea que `tone` o antes del `>` de cierre del tag de apertura.

- [ ] **Step 3: Build**

```bash
cd app && npm run build 2>&1 | tail -5
```

- [ ] **Step 4: Commit**

```bash
git add app/src/pages/instituciones/banca-multiple.astro
git commit -m "feat(fichas): metricSlug en secciones MIF, quitas, EPRC y crecimiento-cartera (banca-multiple)"
```

---

## Task 3: Cablear metricSlug en macro/index.astro

**Files:**
- Modify: `app/src/pages/macro/index.astro`

Las secciones sin metricSlug en Macro (inflación YA tiene con `metricSlug="inflacion"`):

- Sección IGAE → `metricSlug="igae"`
- Sección PIB → `metricSlug="pib"`
- Sección desempleo → `metricSlug="desempleo"`
- Sección informalidad → `metricSlug="informalidad"`
- Sección salario mínimo → `metricSlug="salario-minimo"`
- Sección remesas (si fue agregada por el agente de datos) → `metricSlug="remesas"`

- [ ] **Step 1: Ubicar secciones**

```bash
grep -n "Section\|metricSlug\|igae\|pib\|desempleo\|informalidad\|salario\|remesas" app/src/pages/macro/index.astro | head -40
```

- [ ] **Step 2: Agregar metricSlug a cada sección**

Cada `<Section` que no tenga `metricSlug` recibe el prop antes del `>` de cierre:

```astro
<Section
  id="igae"
  eyebrow="Actividad económica"
  title="IGAE — variación anual mensual"
  ...
  tone="green"
  metricSlug="igae">
```

- [ ] **Step 3: Build**

```bash
cd app && npm run build 2>&1 | tail -5
```

- [ ] **Step 4: Commit**

```bash
git add app/src/pages/macro/index.astro
git commit -m "feat(fichas): metricSlug en secciones IGAE, PIB, desempleo, informalidad, salario (macro)"
```

---

## Task 4: Verificar MetricInfo en sofipos.astro y sección IMOR+ROA/ROE

**Files:**
- Modify: `app/src/pages/instituciones/sofipos.astro`

La sección `sofipos-imora-roa` no tiene `metricSlug`. Agregar `metricSlug="roa"` (usa la ficha de ROA que ya existe, más la de ROE vía el drawer).

- [ ] **Step 1: Ubicar y agregar**

```bash
grep -n "Section\|metricSlug\|sofipos-imora-roa" app/src/pages/instituciones/sofipos.astro
```

En la sección encontrada, agregar `metricSlug="roa"`.

- [ ] **Step 2: Build + commit**

```bash
cd app && npm run build 2>&1 | tail -5
git add app/src/pages/instituciones/sofipos.astro
git commit -m "feat(fichas): metricSlug roa en sección sofipos-imora-roa"
```

---

## Task 5: CHANGELOG

- [ ] **Step 1: Agregar entrada en `[Sin publicar]` → `### Agregado`**

```markdown
- **Fichas metodológicas completas** — 15 nuevas entradas en `glossary.ts`: inflacion, fx, tasa (Banxico), reservas, spread-tiie-cetes, mif, eprc, quitas, crecimiento-cartera, igae, pib, desempleo, informalidad, salario-minimo, remesas. Cada indicador visible en el dashboard tiene ahora definición, fórmula, umbral y fuente accesibles via accordion MetricInfo.
- Cableado de `metricSlug` en secciones sin ficha: banca-multiple (MIF, quitas, EPRC, crecimiento-cartera), macro (IGAE, PIB, desempleo, informalidad, salario), sofipos (IMOR+ROA/ROE).
```

- [ ] **Step 2: Build final**

```bash
cd app && npm run build 2>&1 | tail -5
```

- [ ] **Step 3: Commit**

```bash
git add CHANGELOG.md
git commit -m "chore: CHANGELOG — fichas metodologicas completas (15 entradas + metricSlug wiring)"
```

---

*Plan creado: 2026-06-10*
