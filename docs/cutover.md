# Cutover plan: legacy `index.html` → Astro app (v0.1.0 → v0.2.0)

Este documento define cuándo y cómo hacer el corte definitivo del dashboard legacy (`index.html`) al app Astro (`app/`). **No ejecutar hasta que todos los gates de aceptación estén verdes.**

---

## TL;DR

- Hoy: `pamela-ruiz9.github.io/sfm-monitor/` sirve `index.html` (legacy v0.1.0). Astro convive en `/sfm-monitor/app/` como preview.
- Día del cutover: `index.html` se mueve a `legacy/v0.1.0.html`, Astro toma `/`. Tag `v0.2.0`. DOI Zenodo nuevo.
- Si algo se rompe: `git revert` del cutover commit + redeploy GitHub Pages = back a v0.1.0 en 2 minutos.

---

## Gates de aceptación (pre-cutover)

**Todos deben estar ✅ antes de ejecutar el corte.** Sin excepciones — el dashboard tiene tracción y URLs ya pueden estar citadas.

### G1 — paridad funcional de las 9 charts
- [ ] FX MXN/USD histórico — ✅ migrado
- [ ] Tasa Banxico — ✅ migrado
- [ ] Inflación INPC — ✅ migrado
- [ ] IMOR Banca Múltiple histórico
- [ ] IMOR por segmento (comercial/consumo/vivienda/tarjeta)
- [ ] IMOR por banco G-7 (BBVA/Banamex/Santander/Banorte/HSBC/Scotiabank/Inbursa)
- [ ] IFRS 9 etapas 1/2/3 (stacked area, desde ene 2022)
- [ ] SoFiPOs IMOR top 15 por activo (Y axis fijo 45%)
- [ ] SoFiPOs IMORA + ROA dual-axis

### G2 — paridad visual con Playwright
- [x] Suite Playwright corriendo en CI con `toHaveScreenshot()` — 5 baselines desktop generadas en v0.2.0-dev.1
- [x] Threshold de diferencia ≤ 0.5% por chart (`maxDiffPixelRatio: 0.005`)
- [ ] Screenshots mobile (375×667) — webkit pendiente de instalar en CI
- [ ] Verificar: paridad pixel-perfect contra legacy (no solo baselines del Astro app); requiere comparar lado-a-lado tras M2-M3 charts

### G3 — paridad de datos
- [x] Mismo `data/sfm-data.json` consumido por ambos (Astro `loader.ts` + legacy `index.html` leen el mismo path)
- [x] `<DataFreshnessBadge>` en header muestra timestamp del JSON con semáforo verde/amber/rojo
- [x] GitHub Action `update-data.yml` no requiere cambios

### G4 — features citables del blueprint listos
- [x] JSON-LD `@type: Dataset` por página de indicador — implementado en todas las páginas vía `datasetJsonLd()`
- [ ] `<CitationBox>` con APA/Chicago/MLA/BibTeX/RIS
- [ ] `<MetricTooltip>` con glosario sobre Floating UI
- [x] Sitemap XML con i18n (vía `@astrojs/sitemap`)
- [x] Meta tags Highwire Press (`citation_*` + Dublin Core `DC.*`) en Layout — Google Scholar y Mendeley

### G5 — observabilidad mínima
- [ ] Sentry `@sentry/astro` configurado con DSN en GitHub secret
- [x] GoatCounter snippet activo en Layout (condicional en `PUBLIC_GOATCOUNTER_URL` — configurar en `.env` y en GitHub secret `PUBLIC_GOATCOUNTER_URL`)
- [x] Healthchecks.io ping al final del workflow `update-data.yml` (condicional en secret `HEALTHCHECKS_URL` — crear check en healthchecks.io y añadir secret)
- [ ] Upptime monitoreando `pamela-ruiz9.github.io/sfm-monitor/` (repo separado)

### G6 — ensayo en preview
- [x] Branch dedicada `feat/app-redesign-pwa-v0.2.0-dev` creada con todo el redesign (PR #1)
- [ ] Deploy preview de la branch a Cloudflare Pages o GitHub Pages alterno
- [ ] Verificar carga de assets sin 404 con `base: '/'` + custom domain
- [x] Lighthouse 90+ en Performance (0.97-1.00) / Accessibility (1.00) / Best Practices (0.96) / SEO (1.00) en las 5 rutas

### G7 — backups y rollback path
- [x] Tag `v0.1.0` creado localmente — push manual pendiente
- [x] DOI Zenodo de v0.1.0 asignado: `10.5281/zenodo.20370914`
- [ ] Branch `legacy/v0.1.0` apuntando al último commit del HTML monolítico (creada en cutover día-D)
- [ ] `legacy/v0.1.0.html` accesible (creado en cutover día-D)
- [x] Plan de rollback documentado en este doc (sección abajo)

---

## Pasos del cutover (día D)

Solo ejecutar si **todos** los gates G1-G7 están ✅. Crear branch dedicada, no commits directos a `main`.

### 1. Branch + preserve legacy

```bash
git checkout main && git pull
git checkout -b release/v0.2.0

# Move legacy to /legacy/ for permanent archive access
mkdir -p legacy
git mv index.html legacy/v0.1.0.html
git mv roadmap.html legacy/roadmap-v0.1.0.html

# Create a redirect stub at root of legacy/
cat > legacy/README.md <<'EOF'
# Legacy snapshots

| Versión | Archivo | DOI | Notas |
|---|---|---|---|
| 0.1.0 | [v0.1.0.html](v0.1.0.html) | 10.5281/zenodo.XXXXXXX | Snapshot HTML estático antes de migración Astro |
EOF
```

### 2. Configurar Astro para servir desde root

Editar `app/astro.config.ts`:

```ts
const BASE = '/sfm-monitor';  // antes era '/sfm-monitor/app'
```

Edit `app/src/layouts/Layout.astro` removiendo el link "← Dashboard legacy" (ya no aplica, el Astro ES el dashboard ahora).

### 3. Mover output de Astro a root del repo

Opción A (recomendada — GitHub Action de build):
- Crear `.github/workflows/deploy-astro.yml` que:
  1. `npm ci` en `app/`
  2. `npm run build` en `app/`
  3. Sube `app/dist/` como GitHub Pages artifact
- Borrar el deploy de Pages "from main branch" en Settings

Opción B (transición conservadora):
- Build local de Astro
- Copiar `app/dist/*` al root del repo
- Commit los assets generados (ugly pero funciona sin tocar workflows)

### 4. Verificación local pre-push

```bash
cd app && npm run build
npx serve dist -p 8000
# Abrir http://localhost:8000/ — verificar que funciona como en producción
```

### 5. Tag y push

```bash
git add -A
git commit -m "release: v0.2.0 — cutover Astro, legacy preservado en /legacy/"
git tag -a v0.2.0 -m "v0.2.0 — Astro 5 + React 19 cutover

Migración del dashboard de HTML estático monolítico a Astro 5 + React 19
+ TypeScript strict + Tailwind v4. Las 9 charts reimplementadas como
islas React client:visible. Paridad visual validada con Playwright.

El HTML legacy v0.1.0 sigue accesible en /legacy/v0.1.0.html y archivado
en Zenodo bajo DOI 10.5281/zenodo.XXXXXXX (concept DOI de v0.1.0).

Ver CHANGELOG.md y docs/migration-astro.md para detalle."

git push origin release/v0.2.0
git push origin v0.2.0  # Zenodo recibe webhook → asigna DOI v0.2.0
```

### 6. PR + merge

- Abrir PR de `release/v0.2.0` → `main`
- Esperar CI verde (Playwright snapshot tests)
- Merge con squash commit
- Verificar deploy a Pages: `pamela-ruiz9.github.io/sfm-monitor/` muestra Astro
- Verificar redirect: `pamela-ruiz9.github.io/sfm-monitor/legacy/v0.1.0.html` muestra legacy

### 7. Comunicación post-cutover

- Tweet/LinkedIn de @sfmriskmx anunciando v0.2.0 con changelog
- Email a quien haya hecho embed/cita anteriormente (si aplica)
- Issue en GitHub `Migration to Astro 5 — feedback welcome`
- Update README badges con nueva DOI

---

## Plan de rollback

Si después del cutover algo crítico se rompe en producción:

```bash
# Rollback inmediato
git checkout main
git revert <cutover-commit-sha>
git push origin main
# GitHub Pages re-despliega legacy en ~1 min
```

Si el problema es solo en charts específicas:
- Comentar el `<ChartX client:visible />` en `index.astro`
- Push hotfix → redeploy
- Investigar offline; no bloquear el resto del dashboard

---

## Qué cambia para usuarios externos en el cutover

| Cambio | Impacto |
|---|---|
| URL canónica | Sigue siendo `pamela-ruiz9.github.io/sfm-monitor/` — sin cambio para usuarios |
| Visual | Nuevo layout Tailwind, dark theme por defecto, mobile-first |
| Performance | Lighthouse 70 → 95+ esperado (Astro ship 0KB JS por default) |
| Embeds | Endpoints `/embed/[indicator]` nuevos; legacy sigue disponible en `/legacy/v0.1.0.html` |
| Citaciones existentes | DOI v0.1.0 sigue válido y resoluble; concept DOI apunta ahora a v0.2.0 |
| Bookmarks `index.html` | 301 redirect → `/` (configurar en GitHub Pages no es trivial; aceptar 404 en `index.html` directo es OK porque nadie debería bookmarkear archivos) |

---

## Ventana sugerida

- **Evitar**: lunes (peak news cycle), días previos a publicación CNBV mensual (~día 30 de cada mes)
- **Preferir**: martes-jueves entre las 14:00-17:00 CDMX (mediodía US, EU ya cerró)
- **Backup**: viernes 16:00+ CDMX si rollback necesita el fin de semana para resolverse

---

## Referencias

- Plan de migración detallado: [`docs/migration-astro.md`](migration-astro.md)
- Blueprint estratégico: [`docs/research/blueprint-2026.md`](research/blueprint-2026.md) §5 (Frontend), §9 (Roadmap)
- Citabilidad y DOI: [`docs/citability.md`](citability.md)
- CHANGELOG con razón de versionado: [`CHANGELOG.md`](../CHANGELOG.md)
