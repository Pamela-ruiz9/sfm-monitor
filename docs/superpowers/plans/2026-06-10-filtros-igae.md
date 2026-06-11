# US-401 Filtros banco×cartera + IGAE historia pre-2026

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan.

**Goal:** (1) Mostrar pills de cartera también cuando el usuario selecciona "Por banco" en ImorSegPivotChart. (2) Recuperar la historia larga del IGAE (pre-2026) usando la serie BIE 736181 en paralelo con la actual 737370.

**Architecture:** ImorSegPivotChart ya tiene la lógica banco×cartera implementada en el `useMemo` — solo falta exponer las cartera pills en la vista "banco". Para IGAE, el pipeline update-data.yml ya consulta INEGI BIE; solo hay que añadir la serie larga y hacer merge.

**Tech Stack:** React 19, TypeScript, Python (en update-data.yml GitHub Actions). Sin dependencias nuevas.

---

## Task 1: US-401 — Cartera pills en vista "Por banco" (ImorSegPivotChart)

**Context:** `ImorSegPivotChart.tsx` (292 líneas) ya calcula correctamente `banco.imor_comercial`, `banco.imor_consumo`, etc. cuando `view === 'banco'` (líneas 104–121). El bug es que el sub-selector de cartera (líneas 216–223) solo se muestra cuando `view === 'sistema'`. Cuando el usuario cambia a "Por banco", las pills de cartera desaparecen aunque el dato existe.

**Files:**
- Modify: `app/src/components/charts/ImorSegPivotChart.tsx`

- [ ] **Step 1: Agregar constante BANCO_CARTERAS y ajustar changeView**

En `ImorSegPivotChart.tsx`, localizar las constantes de carteras (líneas ~55–56):

```ts
const BM_CARTERAS: Cartera[] = ['total', 'comercial', 'consumo', 'vivienda', 'tarjeta', 'consumo_norev'];
const SOFI_CARTERAS: Cartera[] = ['total', 'comercial', 'consumo', 'vivienda'];
```

Agregar una tercera constante DESPUÉS de esas dos líneas:

```ts
const BANCO_CARTERAS: Cartera[] = ['total', 'comercial', 'consumo', 'vivienda', 'tarjeta'];
```

(Sin `consumo_norev` porque los datos por banco no tienen ese desglose.)

Luego localizar `changeView` (líneas ~180–184):

```ts
function changeView(next: 'sistema' | 'banco' | 'entidad') {
  setView(next);
  // Reset cartera for entidad (SoFiPOs don't have consumo_norev/tarjeta)
  if (next === 'entidad') setCartera('total');
}
```

Reemplazar con:

```ts
function changeView(next: 'sistema' | 'banco' | 'entidad') {
  setView(next);
  if (next === 'entidad') setCartera('total');
  // consumo_norev has no per-banco breakdown — reset to total
  if (next === 'banco' && cartera === 'consumo_norev') setCartera('total');
}
```

- [ ] **Step 2: Agregar cartera pills en el bloque view === 'banco'**

Localizar el bloque JSX del sub-selector (líneas ~215–242):

```tsx
        {/* Sub-selector */}
        {view === 'sistema' && (
          <div className="flex gap-1.5 flex-wrap">
            {carteras.map((c) => (
              <button key={c} onClick={() => setCartera(c)} className={pillClass(cartera === c)}>
                {CARTERA_LABELS[c]}
              </button>
            ))}
          </div>
        )}
        {view === 'banco' && (
          <div className="flex gap-1.5 flex-wrap">
            {bancosConDatos.map((b) => (
              <button key={b.id} onClick={() => setBancoId(b.id)} className={pillClass(bancoId === b.id)}>
                {b.nombre}
              </button>
            ))}
          </div>
        )}
```

Reemplazar el bloque `{view === 'banco' && ...}` con:

```tsx
        {view === 'banco' && (
          <>
            <div className="flex gap-1.5 flex-wrap">
              {bancosConDatos.map((b) => (
                <button key={b.id} onClick={() => setBancoId(b.id)} className={pillClass(bancoId === b.id)}>
                  {b.nombre}
                </button>
              ))}
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {BANCO_CARTERAS.map((c) => (
                <button key={c} onClick={() => setCartera(c)} className={pillClass(cartera === c)}>
                  {CARTERA_LABELS[c]}
                </button>
              ))}
            </div>
          </>
        )}
```

- [ ] **Step 3: Verificar tipos**

```bash
cd app && npx tsc --noEmit 2>&1 | grep ImorSegPivotChart
```

Esperado: sin output.

- [ ] **Step 4: Build**

```bash
cd app && npm run build 2>&1 | tail -5
```

- [ ] **Step 5: Commit**

```bash
git add app/src/components/charts/ImorSegPivotChart.tsx
git commit -m "feat(filtros): pills de cartera visibles en vista 'Por banco' — ImorSegPivotChart (US-401)"
```

---

## Task 2: IGAE historia — series 736181 + 737370 merged

**Context:** El pipeline `update-data.yml` consulta IGAE con la serie `737370` que solo tiene datos desde dic 2025 (nueva serie post-migración BIE). La serie de historia larga es `736181` (identificada en `roadmap-contenido.md` Fase 2). El fix: consultar AMBAS series y hacer merge por fecha, manteniendo toda la historia disponible.

**Files:**
- Modify: `.github/workflows/update-data.yml`

- [ ] **Step 1: Leer el bloque IGAE actual en update-data.yml**

```bash
grep -n "IGAE\|737370\|igae\|fetch_inegi\|IGAE_CUTOFF" .github/workflows/update-data.yml | head -25
```

El bloque actual (alrededor de líneas 250–265) hace algo como:
```python
igae_obs = fetch_inegi("737370")
IGAE_CUTOFF = "2025-12"
igae_series = [
    {"fecha": ..., "valor": ...}
    for o in igae_obs
    if o.get("OBS_VALUE") not in (None, "") and o["TIME_PERIOD"].replace("/", "-") >= IGAE_CUTOFF
]
```

- [ ] **Step 2: Reemplazar el bloque IGAE con la lógica de merge**

Localizar el bloque completo del IGAE (desde el comentario `# IGAE` hasta la definición de `igae_latest`) y reemplazarlo con:

```python
          # IGAE — merge serie larga (736181, historia pre-2025) + serie nueva (737370, post-dic-2025)
          # 737370 es la serie migrada en dic 2025; 736181 es la historia larga del BIE anterior.
          def fetch_igae_merged() -> list[dict]:
              raw_nuevo  = fetch_inegi("737370") or []
              raw_largo  = fetch_inegi("736181") or []
              seen: dict[str, float] = {}
              for obs in raw_largo + raw_nuevo:  # nuevo sobreescribe largo si misma fecha
                  v = obs.get("OBS_VALUE")
                  if v in (None, ""):
                      continue
                  fecha = obs["TIME_PERIOD"].replace("/", "-")
                  try:
                      seen[fecha] = float(v)
                  except (ValueError, TypeError):
                      continue
              return sorted(
                  [{"fecha": f, "valor": v} for f, v in seen.items()],
                  key=lambda x: x["fecha"],
              )

          igae_series = fetch_igae_merged()
          igae_latest = igae_series[-1] if igae_series else None
          igae_var_anual = igae_latest["valor"] if igae_latest else None
```

**Importante:** eliminar la variable `IGAE_CUTOFF` y cualquier filtro `>= IGAE_CUTOFF` que existiera — ya no es necesario.

- [ ] **Step 3: Verificar sintaxis Python**

```bash
python3 -c "
import ast, re

with open('.github/workflows/update-data.yml', 'r') as f:
    content = f.read()

# Extraer el bloque Python del YAML (entre | del step que lo contiene)
# Solo verificar que el archivo YAML es parseable
import yaml
try:
    yaml.safe_load(content)
    print('YAML OK')
except yaml.YAMLError as e:
    print(f'YAML error: {e}')
"
```

Esperado: `YAML OK`

Si falla por indentación Python dentro del YAML, ajustar los espacios (el código Python en YAML heredoc necesita indentación consistente con el nivel del bloque `run:`).

- [ ] **Step 4: Verificar que la estructura del output JSON no cambia**

El bloque de output JSON más abajo usa `igae_latest` y `igae_series`. Verificar que siguen siendo los mismos nombres (sin cambios en las líneas 357–362 aprox):

```bash
grep -n "igae_latest\|igae_series\|igae_var" .github/workflows/update-data.yml | head -15
```

Esperado: las referencias a `igae_latest["valor"]`, `igae_latest["fecha"]`, `igae_series[-36:]` siguen intactas.

- [ ] **Step 5: Commit**

```bash
git add .github/workflows/update-data.yml
git commit -m "feat(igae): merge series 736181 (historia larga) + 737370 (post-dic-2025) — elimina IGAE_CUTOFF (US-310)"
```

---

## Task 3: CHANGELOG

- [ ] **Step 1: Agregar entrada**

En `CHANGELOG.md` bajo `[Sin publicar]` → `### Agregado`:

```markdown
- **IGAE historia completa** — Pipeline ahora consulta serie BIE 736181 (historia larga) y la fusiona con 737370 (post-dic-2025). Se elimina el filtro IGAE_CUTOFF que truncaba a solo 4 meses. La próxima ejecución del workflow `update-data.yml` poblará el historial completo en `data/sfm-data.json`. Cierra US-310.
```

Bajo `### Corregido`:

```markdown
- **ImorSegPivotChart** — Las pills de cartera (Total/Comercial/Consumo/Vivienda/Tarjeta) ahora se muestran también cuando el usuario está en vista "Por banco", permitiendo combinaciones banco × cartera (ej: IMOR consumo de Banamex). La lógica de datos ya funcionaba — solo faltaba el control UI. Cierra US-401.
```

- [ ] **Step 2: Build final**

```bash
cd app && npm run build 2>&1 | tail -5
```

- [ ] **Step 3: Commit**

```bash
git add CHANGELOG.md
git commit -m "chore: CHANGELOG — US-401 filtros banco×cartera + US-310 IGAE historia larga"
```

---

*Plan creado: 2026-06-10*
