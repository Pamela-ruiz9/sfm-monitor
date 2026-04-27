# Citabilidad — guía operativa

Esta guía documenta los pasos para hacer SFM Monitor citable académicamente vía DOI persistente, indexación en Google Scholar/Dataset Search y citación estructurada.

## Estado actual

| Elemento | Estado | Archivo |
|---|---|---|
| `CITATION.cff` con coautoría y versión | ✅ | [`CITATION.cff`](../CITATION.cff) |
| `.zenodo.json` con metadatos completos | ✅ | [`.zenodo.json`](../.zenodo.json) |
| `CHANGELOG.md` siguiendo Keep a Changelog | ✅ | [`CHANGELOG.md`](../CHANGELOG.md) |
| JSON-LD `Dataset` markup en `index.html` | ✅ | (commit f7bab00) |
| Doble licenciamiento MIT + CC-BY 4.0 | ✅ | `LICENSE`, `LICENSE-CONTENT` |
| DOI Zenodo registrado | ⏳ pendiente | requiere paso manual |
| Citation generator UI (APA/Chicago/MLA/BibTeX) | 📋 v0.2.0 | requiere migración Astro |
| Sitemap especializado `/sitemap-datasets.xml` | 📋 v0.2.0 | requiere Astro |
| Meta tags Highwire Press para Google Scholar | 📋 v0.2.0 | requiere por-página |

---

## Cómo registrar el DOI Zenodo (paso a paso)

Esta acción requiere intervención manual de Pame (admin del repo `Pamela-ruiz9/sfm-monitor`).

### 1. Conectar el repo a Zenodo

1. Ir a [zenodo.org/account/settings/github/](https://zenodo.org/account/settings/github/)
2. Login con cuenta GitHub
3. Buscar `sfm-monitor` en la lista
4. Toggle el switch a **ON**

### 2. (Opcional pero recomendado) Practicar primero en sandbox

Repetir el paso 1 en [sandbox.zenodo.org/account/settings/github/](https://sandbox.zenodo.org/account/settings/github/) para hacer un release de prueba sin consumir DOI real.

### 3. Crear el release v0.1.0 en GitHub

```bash
git tag -a v0.1.0 -m "v0.1.0 — snapshot inicial del dashboard HTML estático antes de migración a Astro"
git push origin v0.1.0
```

Después, en GitHub web:
1. Ir a `Releases` → `Draft a new release`
2. Tag: `v0.1.0` (el que acabas de pushear)
3. Title: `v0.1.0 — Snapshot inicial`
4. Description: copiar de la sección `[0.1.0]` del `CHANGELOG.md`
5. Click **Publish release**

### 4. Zenodo recibe el webhook automáticamente

En 1-5 minutos:
- Zenodo descarga el ZIP del repo
- Lee `.zenodo.json` para metadatos
- Lee `CITATION.cff` para autores
- Asigna **DOI específico de versión** (ej: `10.5281/zenodo.XXXXXXX`)
- Asigna **concept DOI** (DOI permanente que siempre apunta a la última versión)

### 5. Añadir el badge al README

Una vez asignado el DOI, añadir al `README.md`:

```markdown
[![DOI](https://zenodo.org/badge/DOI/10.5281/zenodo.XXXXXXX.svg)](https://doi.org/10.5281/zenodo.XXXXXXX)
```

### 6. Actualizar `CITATION.cff` con DOI

Editar `CITATION.cff` añadiendo:

```yaml
identifiers:
  - type: doi
    value: "10.5281/zenodo.XXXXXXX"
    description: "Concept DOI (siempre apunta a la última versión)"
  - type: doi
    value: "10.5281/zenodo.YYYYYYY"
    description: "DOI específico de v0.1.0"
```

---

## Versionado SemVer del dataset

Adoptamos SemVer para `data/sfm-data.json`:

| Tipo | Cuándo | Ejemplo |
|---|---|---|
| MAJOR | Schema cambia incompatiblemente (renombre de campos, removal) | `1.x.x` → `2.0.0` |
| MINOR | Se añaden indicadores nuevos sin romper consumers | `1.0.x` → `1.1.0` |
| PATCH | Solo refresco de datos o bugfix | `1.0.0` → `1.0.1` |

Cada release `v1.x.x` produce un DOI Zenodo nuevo. El concept DOI siempre resuelve a la última.

---

## Cómo citar SFM Monitor

### Texto plano (APA 7)

```
Ruiz Puga, I. P., & Padilla, A. (2026). SFM Monitor — Monitor de Riesgo del
Sistema Financiero Mexicano (Versión 0.1.0) [Conjunto de datos y software].
Zenodo. https://doi.org/10.5281/zenodo.XXXXXXX
```

### BibTeX

```bibtex
@software{ruizpuga_sfmmonitor_2026,
  author    = {Ruiz Puga, Ingrid Pamela and Padilla, Artemio},
  title     = {{SFM Monitor — Monitor de Riesgo del Sistema Financiero Mexicano}},
  version   = {0.1.0},
  year      = {2026},
  doi       = {10.5281/zenodo.XXXXXXX},
  url       = {https://github.com/Pamela-ruiz9/sfm-monitor}
}
```

### En `CITATION.cff` (GitHub auto-renderiza)

GitHub muestra el botón **Cite this repository** automáticamente cuando hay un `CITATION.cff` válido en root. Click → se abre dropdown con APA y BibTeX listos para copiar.

---

## Indexación adicional

### Google Dataset Search

Automático una vez que cada página de indicador tenga JSON-LD `@type: Dataset` válido. Validar con [Google Rich Results Test](https://search.google.com/test/rich-results). Indexación toma ~2-4 semanas.

### Google Scholar

Requiere meta tags Highwire Press en cada página de "reporte" (ej: `/reporte-trimestral-2026q2`):

```html
<meta name="citation_title" content="...">
<meta name="citation_author" content="Ruiz Puga, Ingrid Pamela">
<meta name="citation_author" content="Padilla, Artemio">
<meta name="citation_publication_date" content="2026/06/30">
<meta name="citation_doi" content="10.5281/zenodo.XXXXXXX">
<meta name="citation_pdf_url" content="https://...">
<meta name="citation_keywords" content="riesgo sistémico; banca mexicana; IMOR; IFRS 9">
<meta name="citation_language" content="es">
```

Indexación Scholar: 6-8 semanas. Una vez Scholar lo recoge, Semantic Scholar lo replica automáticamente desde Crossref.

### Awesome lists

PRs sugeridos cuando v0.2.0 esté pulido:
- [`awesome-fintech`](https://github.com/7kfpun/awesome-fintech)
- [`awesome-public-datasets`](https://github.com/awesomedata/awesome-public-datasets) → sección Finance
- [`awesome-mexico`](https://github.com/yask123/awesome-mexico-datos) → sección Datos abiertos

---

## Atribución textual requerida (al usar datos del dashboard)

Quien use datos derivados de SFM Monitor debe citar tanto a SFM Monitor (CC-BY 4.0) como a la fuente upstream original:

- **Banxico**: "Fuente: Banco de México, SIE, serie [SF43718], consultado el [fecha vía SFM Monitor]"
- **CNBV**: "Fuente: CNBV, Portafolio de Información, [Sector], consultado el [fecha vía SFM Monitor]"
- **INEGI**: "Fuente: INEGI. [Programa]. [Año] (vía SFM Monitor)"

Banxico Cláusula 8 prohíbe **comercialización por cuenta propia** de sus datos; SFM Monitor opera como proyecto no-comercial puro y traslada esa restricción a usuarios downstream.
