# Spec: Score Global del SFM Monitor

**Estado:** ✅ Aprobado — listo para implementar  
**Autora:** Ingrid Pamela Ruiz Puga  
**Fecha:** 2026-06-11  
**Referencia blueprint:** `docs/research/blueprint-2026.md` §3.2  
**Epic:** US-605 (Epic 6) — Índice de stress financiero propio

---

## 1. Problema actual

`HeroScore.astro` existe pero usa reglas hardcodeadas sin respaldo metodológico:

```
IMOR ≤ 3.5% → verde
Inflación 2–4% → verde
Mercado → amarillo fijo
Liquidez → verde fijo
```

Esto produce un score que:
- No varía con el contexto histórico (2.2% de IMOR puede ser bajo o alto dependiendo de la época)
- Ignora 8 de las 10+ series que ya están en el JSON con historia larga
- No es defendible ni citable
- Tiene mercado y liquidez fijos en código — nunca se actualizan

**Objetivo:** reemplazarlo con un índice compuesto basado en percentiles rolling, publicar la metodología en `/metodologia`, y hacer el score reproducible desde el JSON público.

---

## 2. Inventario de series disponibles

Antes de definir qué entra al score, lo que realmente hay en `data/sfm-data.json`:

| Serie | Ruta en JSON | Meses disponibles | Inicio | Método normalización viable |
|---|---|---|---|---|
| IMOR total | `credito.historico_por_cartera.imor_total` | 304 | 2000-12 | Percentil rolling ✅ |
| IMORA total | `credito.historico_por_cartera.imora_total` | 268 (no-null) | 2003-12 | Percentil rolling ✅ |
| ICOR total | `credito.historico_por_cartera.icor_total` | 304 | 2000-12 | Percentil rolling ✅ (invertido) |
| MIF | `credito.historico_por_cartera.mif` | 304 | 2000-12 | Percentil rolling ✅ |
| ROA | `credito.historico_por_cartera.roa` | 279 | 2003-01 | Percentil rolling ✅ (invertido) |
| ROE | `credito.historico_por_cartera.roe` | 292 | 2001-12 | Percentil rolling ✅ (invertido) |
| Tipo de cambio | `tipo_cambio.historico_mensual` | 390 | ~1994 | Percentil rolling ✅ |
| Inflación INPC | `inflacion.historico_mensual` | 72 | 2020-06 | Distance-from-target ⚠️ |
| Tasa Banxico | `tasa_banxico.historico` | 15 | 2024-06 | Nivel vs neutral ⚠️ |
| IGAE var. anual | `macro.igae.historico` | 36 | 2023-04 | Threshold binario ⚠️ |
| IFRS9 Etapa 2 % | `ifrs9.etapa2_pct` | 50 | 2022-01 | Tendencia + umbral ⚠️ |
| LCR / NSFR | — | no en JSON | — | ❌ Falta descarga CNBV |
| Spread TIIE-Cetes | — | no calculado | — | ❌ Calcular en pipeline |

**Conclusión clave:** las series de crédito y rentabilidad son largas (20-25 años) y permiten percentiles robustos. Las series macro son cortas y requieren normalización alternativa. Liquidez no está disponible.

---

## 3. Arquitectura del score compuesto

### 3.1 Tres subíndices (no cinco como CISS)

El CISS del BCE usa 5 subíndices con datos de mercado diarios (equity, bonos, FX vol, money market). El SFM tiene datos mensuales con fuerte componente bancario. Propongo **3 subíndices** ajustados a la disponibilidad real:

```
Score_t = (w₁ · S_credito + w₂ · S_rentabilidad + w₃ · S_macro) / (w₁ + w₂ + w₃)
```

Donde cada Sᵢ ∈ [0, 1] y los pesos son iguales como baseline (equal-weight):

| Subíndice | Peso | Series incluidas |
|---|---|---|
| **S_credito** | **50%** | IMOR, IMORA, ICOR (invertido) |
| **S_rentabilidad** | **30%** | ROA (invertido), ROE (invertido) |
| **S_macro** | **20%** | FX, Inflación, Tasa Banxico real |

Pesos confirmados por Pame: 2026-06-11.

---

### 3.2 Normalización por tipo de serie

#### Series con historia larga (≥ 200 meses) → Percentil rolling

Para IMOR, IMORA, MIF, ROA, ROE, FX:

```
pᵢₜ = rank(xᵢₜ en xᵢ₁..xᵢₜ) / t
```

- rank-based (orden) sobre la historia acumulada hasta t (no ventana fija)
- Para indicadores donde "más alto = mejor" (ICOR, ROA, ROE): invertir → `pᵢₜ = 1 - rank/t`
- Robusto a outliers, no asume distribución gaussiana (igual que CISS y Mapa Térmico Banxico)

#### ICOR: invertido + normalizado con cap

ICOR alto = buena cobertura = menos estrés. Invertir y capear en 20× antes de normalizar (igual que `IcorChart.tsx` que ya implementa este cap para visualización):

```
ICOR_norm = 1 - percentile(min(ICOR_t, 20), historia)
```

#### MIF: KPI informativo — excluido del score ✅

Confirmado por Pame: MIF queda como KPI informativo en la página de Banca Múltiple, sin peso en el score compuesto. Razón: dirección ambigua (MIF alto puede reflejar rentabilidad sana o extracción de renta en períodos de tasas altas).

#### Inflación → Distance-from-target normalizado

```
d_inf = |inflación_t - 3.0| / 3.0   (distancia relativa al objetivo)
inf_norm = min(d_inf, 1.0)           (cap en 100% de desviación = 6pp fuera)
```

Interpretación: 3% → 0 (sin estrés), 6% → 0.33, 9% → 1.0

#### Tasa Banxico real → Nivel vs neutral

Tasa real = tasa nominal - inflación. Tasa real muy negativa = política expansiva extrema. Tasa real muy positiva = política muy restrictiva (presión sobre cartera).

```
tasa_real_t = tasa_banxico_t - inflacion_t
neutral = 2.5%   (proxy del r* MX, discutible)
tasa_norm = sigmoid(|tasa_real_t - neutral| / 3.0)
```

r* neutral = **2.5%** confirmado por Pame: 2026-06-11.

#### Tipo de cambio → Percentil rolling (390 meses)

FX tiene 390 meses de historia (~32 años), suficiente para percentiles robustos. Usar FX nivel (no variación) porque la depreciación acumulada refleja presión estructural, y el percentil captura la perspectiva histórica correctamente.

---

### 3.3 Agregación dentro de cada subíndice

```
S_credito = mean(IMOR_norm, IMORA_norm, ICOR_norm)
S_rentabilidad = mean(ROA_norm, ROE_norm)
S_macro = mean(inf_norm, fx_norm, tasa_norm)
```

Agregación igual al CISS dentro de subíndices (media aritmética). La variante CISS cuadrática (que amplifica cuando los indicadores co-mueven) queda para US-605 full cuando tengamos más historia en todas las series.

---

## 4. Umbral de colores

Siguiendo Banxico Mapa Térmico (Recuadro 3, REF oct 2018) con 5 niveles:

| Score compuesto | Color | Label | Hex |
|---|---|---|---|
| 0.00 – 0.20 | Verde | Riesgo Bajo | `#56d364` |
| 0.20 – 0.40 | Verde-ámbar | Riesgo Contenido | `#d4a72c` |
| 0.40 – 0.60 | Ámbar | Riesgo Moderado | `#e3b341` |
| 0.60 – 0.80 | Naranja | Riesgo Elevado | `#f0883e` |
| 0.80 – 1.00 | Rojo | Riesgo Alto | `#f85149` |

Umbrales fijos confirmados por Pame: 2026-06-11.

---

## 5. Plan de backtesting

Antes de publicar el score, validar que señala correctamente en las crisis históricas conocidas. Criterio mínimo: score ≥ 0.60 en el pico de cada crisis.

| Crisis | Período pico | Score esperado |
|---|---|---|
| Tequila | 1995-03 | ≥ 0.70 (IMOR llegó a ~9%) |
| GFC | 2009-06 | ≥ 0.55 (IMOR ~4%, FX depreció fuerte) |
| COVID | 2020-04 | ≥ 0.60 (FX tocó $25, IGAE negativo) |
| Alzas tasas 2022 | 2022-12 | ≥ 0.45 (inflación >8%, tasa subiendo) |

**Método:** computar el score sobre toda la historia disponible (desde 2003, cuando la mayoría de series están disponibles) y graficar la serie del score junto con bandas de crisis anotadas. Publicar ese backtesting en `/metodologia`.

**Gate de aceptación:** NSR < 1 (Noise-to-Signal Ratio de Kaminsky-Reinhart) en al menos 2 de las 4 crisis.

---

## 6. Cambios de UI

### HeroScore.astro (reemplazar lógica hardcodeada)

Mover el cálculo a una función pura en `app/src/data/score.ts`:

```ts
// app/src/data/score.ts
export interface SfmScore {
  value: number;         // 0–1
  label: string;         // "Riesgo Bajo" etc.
  color: string;         // hex
  subindices: {
    credito: number;
    rentabilidad: number;
    macro: number;
  };
  periodo: string;       // 'YYYY-MM' del último dato
}

export function computeScore(data: SfmData): SfmScore { ... }
```

### HeroScore.astro — UI propuesta

```
┌─────────────────────────────────────────────┐
│  Score Global del Sistema                   │
│                                             │
│  Riesgo Contenido        [mar 2026]         │  ← h1 grande con color
│                                             │
│  Crédito ████████░░  0.38                  │
│  Rentab. ██████░░░░  0.29                  │  ← barras de subíndices
│  Macro   ███░░░░░░░  0.22                  │
│                                             │
│  Score: 0.30 / 1.00                         │
│  2 alertas activas — ver debajo.            │
│  ↗ Metodología                              │
└─────────────────────────────────────────────┘
```

Componente Astro (no React island) — el score se computa en build-time desde datos estáticos, sin fetches en cliente.

---

## 7. Disclosure metodológica en /metodologia

Agregar sección "Cómo se calcula el Score Global" con:
- Fórmula completa en formato LaTeX-fallback (en `<code>`)
- Tabla de indicadores, pesos y normalización
- Serie histórica del score (gráfica simple)
- Comparación con el Mapa Térmico de Banxico (REF oct 2018, Recuadro 3)
- Limitaciones explícitas: sin liquidez (LCR/NSFR no disponibles), sin contagio interbancario, IGAE e inflación con historia corta
- Link al repo y al `data/sfm-data.json` para reproducción

---

## 8. Lo que NO entra en esta versión

Para mantener el alcance acotado y la metodología publicable:

- **No CISS cuadrático** (requiere matriz de correlaciones EWMA actualizada continuamente — complejidad operativa alta para datos mensuales)
- **No PCA** (variante "expert" — necesita validar que los loadings sean estables antes de publicar)
- **No credit-to-GDP gap** (requiere PIB trimestral en denominador — se actualizaría trimestral, no mensual)
- **No LCR/NSFR** (no disponibles en JSON — quedan para cuando se automatice la descarga CNBV)
- **No IFRS9 en el score compuesto** (solo 50 meses — insuficiente para percentiles; mantener como alerta independiente)

---

## 9. Gates de aprobación ✅ TODOS APROBADOS (2026-06-11)

- [x] **G1 — Composición:** 3 subíndices confirmados (crédito/rentabilidad/macro)
- [x] **G2 — Pesos:** **50% / 30% / 20%** (macro reducida de 30% a 20%)
- [x] **G3 — MIF:** KPI informativo, excluido del score
- [x] **G4 — r* neutral:** 2.5%
- [x] **G5 — Umbrales:** fijos 0.20 / 0.40 / 0.60 / 0.80
- [x] **G6 — Backtesting:** Tequila / GFC / COVID / alzas 2022 ✅

**Siguiente paso:** implementar `app/src/data/score.ts` + actualizar `HeroScore.astro` + sección en `/metodologia`.

---

## 10. Dependencias y riesgos

| Riesgo | Mitigación |
|---|---|
| Inflación solo tiene 72 meses → percentil inestable | Usar distance-from-target en su lugar (no percentil) |
| Tasa Banxico solo 15 observaciones | Usar nivel vs r* neutral (no percentil) — se mejora conforme crece el histórico |
| FX puede incluir el shock Tequila 1994-95 en percentiles → umbral de color muy alto para eventos normales | Cap de FX a p95 antes de normalizar |
| ICOR de algunos bancos chicos > 20× distorsiona el sistema | Cap en 20× ya implementado en `IcorChart.tsx` — replicar en score.ts |
| Score no captura liquidez → puede dar "verde" durante stress de funding | Comunicar explícitamente en UI como limitación |

---

*Spec creada: 2026-06-11 · Pendiente validación Pame antes de implementar*
