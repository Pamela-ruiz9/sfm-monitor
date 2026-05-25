# Fuentes de datos — guía operativa

> Documento de referencia para actualizar los datos de SFM Monitor mensualmente.
> Si tienes que buscar un archivo y no recuerdas de dónde viene, empieza aquí.

---

## Mapa general: archivos fuente → JSONs generados

| Archivo fuente (tú lo descargas) | Tamaño aprox. | Script que lo procesa | JSON resultante |
|---|---|---|---|
| `raw-data/sh_datos_40.csv` | ~515 MB | `normalize-imor-por-banco.py` | `data/imor_por_banco.json` |
| `raw-data/cnbv_indicadores.json` | ~5 MB | `normalize-cnbv.py` | `data/credito.json` |
| `raw-data/sofipos_by_inst.json` | ~3 MB | `normalize-cnbv.py` | `data/sofipos.json` |
| `raw-data/ifrs9_bm.zip` | ~20 MB | `normalize-ifrs9.py` | `data/ifrs9.json` |

> ⚠️ `cnbv_indicadores.json` y `sofipos_by_inst.json` **no se descargan del portal** —
> los genera `scripts/extract-cnbv-raw.py` a partir de los XLS/CSV originales.
> Ver sección [Scripts intermedios](#scripts-intermedios) abajo.

---

## Dónde descargar cada archivo

### 1. `sh_datos_40.csv` — IMOR / IMORA / ICOR por banco

**Portal:** [portafolioinfo.cnbv.gob.mx](https://portafolioinfo.cnbv.gob.mx)

**Ruta de navegación:**
1. Banca Múltiple → Portafolio de Información
2. Sección **Sector 40** → Exportar
3. Seleccionar todos los periodos disponibles
4. Formato: CSV
5. Guardar como `raw-data/sh_datos_40.csv`

**Frecuencia de publicación:** mensual, con rezago de ~30 días
**Codificación:** Latin-1 (el script lo maneja automáticamente)
**Nota:** El archivo es grande (~515 MB). La descarga puede tardar varios minutos.

---

### 2. Archivos SoFiPOs — para `sofipos_by_inst.json`

Se necesitan **dos archivos** del portal, ambos desde la misma sección:

**Portal:** [portafolioinfo.cnbv.gob.mx](https://portafolioinfo.cnbv.gob.mx)

**Ruta de navegación:**
1. SoFiPOs → Portafolio de Información

**Archivo A — Catálogo:**
- Sección: **Catálogo de Instituciones**
- Formato: XLSX
- Guardar como: `raw-data/sofipos_catalogo.xlsx` (~21 MB)

**Archivo B — Por institución:**
- Sección: **Por Institución**
- Seleccionar todos los periodos
- Formato: XLSX
- Guardar como: `raw-data/sofipos_inst.xlsx` (~41 MB)

Después de descargar ambos, correr:
```bash
python3 scripts/extract-cnbv-raw.py --sofipos
```
Esto genera `raw-data/sofipos_by_inst.json`.

---

### 3. `ifrs9_bm.zip` — Etapas IFRS 9 Banca Múltiple

**Portal:** [portafolioinfo.cnbv.gob.mx](https://portafolioinfo.cnbv.gob.mx)

**Ruta de navegación:**
1. Banca Múltiple → Reportes Regulatorios
2. Sección: **R12A — Reporte de Crédito Etapas IFRS 9**
3. Descargar ZIP completo (incluye un CSV por institución)
4. Guardar como `raw-data/ifrs9_bm.zip`

**Frecuencia:** mensual, rezago ~30 días
**Nota:** El script acepta también CSVs individuales con naming `ifrs9_040_R12A_YYYYMM_NNN.csv` en `raw-data/` si prefieres no usar el ZIP.

---

## Scripts intermedios

Algunos JSONs en `raw-data/` no se descargan — los produce un script:

| Script | Qué hace | Input | Output |
|---|---|---|---|
| `scripts/extract-cnbv-raw.py --cnbv` | Procesa XLS/CSV de Banca Múltiple | `sh_datos_40.csv` | `raw-data/cnbv_indicadores.json` |
| `scripts/extract-cnbv-raw.py --sofipos` | Procesa XLS de SoFiPOs | `sofipos_catalogo.xlsx` + `sofipos_inst.xlsx` | `raw-data/sofipos_by_inst.json` |

---

## Flujo mensual completo

```
Día 1: CNBV publica datos del mes anterior (~día 30 del mes siguiente)
│
├── Descargar sh_datos_40.csv              → raw-data/
├── Descargar sofipos_catalogo.xlsx        → raw-data/
├── Descargar sofipos_inst.xlsx            → raw-data/
├── Descargar ifrs9_bm.zip                 → raw-data/
│
├── python3 scripts/extract-cnbv-raw.py --cnbv
│     └── genera raw-data/cnbv_indicadores.json
│
├── python3 scripts/extract-cnbv-raw.py --sofipos
│     └── genera raw-data/sofipos_by_inst.json
│
└── git add raw-data/*.json raw-data/*.zip
    git commit -m "data: raw-data CNBV YYYY-MM"
    git push origin main
         │
         └── GitHub Actions detecta cambios en raw-data/ →
             normalize → merge → validate → deploy (automático)
```

**Tiempo estimado total:** ~15-20 min (mayormente descarga del CSV grande)
**Deploy a producción:** ~3-5 min después del push

---

## Qué va en `.gitignore` y qué no

| Archivo | ¿En repo? | Razón |
|---|---|---|
| `raw-data/sh_datos_40.csv` | ❌ No | ~515 MB, excede límite de GitHub |
| `raw-data/sofipos_catalogo.xlsx` | ❌ No | ~21 MB, archivos binarios pesados |
| `raw-data/sofipos_inst.xlsx` | ❌ No | ~41 MB |
| `raw-data/ifrs9_bm.zip` | ❌ No | ~20 MB |
| `raw-data/cnbv_indicadores.json` | ✅ Sí | JSON procesado, ~5 MB, control de versiones |
| `raw-data/sofipos_by_inst.json` | ✅ Sí | JSON procesado, ~3 MB |
| `data/*.json` | ✅ Sí | Fuente de verdad del dashboard |

---

## Datos de Banxico + INEGI (automatizados)

Las siguientes series se actualizan automáticamente vía el pipeline `update-data.yml` — *no requieren descarga manual*.

### Banxico SIE

| Serie | ID Banxico | Campo en `sfm-data.json` |
|---|---|---|
| Tipo de cambio FIX | SF43718 | `tipo_cambio` |
| Tasa objetivo | SF61745 | `tasa_banxico` |
| INPC inflación | SP74625 | `inflacion` |
| TIIE Fondeo | SF343410 | `mercado.tiie_fondeo` |
| Cetes 28d | SF60633 | `mercado.cetes_28d` |
| Reservas internacionales | SF43707 | `mercado.reservas_internacionales` |
| UDIs | SP68257 | `mercado.udis` |
| Salario mínimo | SF60628 | `mercado.salario_minimo` |

### INEGI BIE (series confirmadas mayo 2026)

| Serie | ID INEGI | Campo en `sfm-data.json` | Frecuencia |
|---|---|---|---|
| IGAE var. anual | 737370 | `macro.igae` | Mensual |
| PIB var. anual | 737375 | `macro.pib` | Trimestral |
| Desocupación ENOE | 444774 | `macro.desempleo` | Mensual |

> Requiere `INEGI_TOKEN` configurado en GitHub Secrets (`Settings → Secrets → INEGI_TOKEN`).

---

## Fuentes manuales pendientes (ICAP/LCR — issue #19)

Estos archivos requieren descarga manual del portal CNBV (protegido por Cloudflare):

### Boletín de Capitalización (ICAP, CET1)
**URL directa:** https://portafolioinfo.cnbv.gob.mx/Paginas/Reporte.aspx?s=40&t=31&st=0&ti=0&sti=0&n=0&tp=0

**Archivos a descargar:**
- R1 (`040_15b_R1.xls`) — ICAP, CET1 (CCB) y CCF por institución
- R6 (`040_15b_R6.xls`) — Desglose de capital del sistema (conceptos 4021750, 4021754, 4021755)

**Naming:** cada mes genera un archivo nuevo. El script busca automáticamente `raw-data/040_15b_R1*.xls` y `raw-data/040_15b_R6*.xls` — guardar con el nombre original del portal.

**Frecuencia:** mensual, rezago ~T+45 días

### Reporte de Liquidez (LCR, NSFR)
**Portal:** portafolioinfo.cnbv.gob.mx
1. Banca Múltiple → Información Regulatoria → Liquidez
2. Guardar como: `raw-data/reporte_liquidez.xlsx`
3. Frecuencia: mensual (~T+45 días)

Una vez descargados: `git add raw-data/*.xlsx && git push` → el pipeline los procesa automáticamente.

---

## Contacto y soporte

- **Mantenedora:** Pamela Ruiz Puga (@Pamela-ruiz9)
- **Soporte técnico pipeline:** ArtemIO (@ArtemioPadilla)
- **Dudas sobre datos CNBV:** [soporte@cnbv.gob.mx](mailto:soporte@cnbv.gob.mx) o portal oficial
