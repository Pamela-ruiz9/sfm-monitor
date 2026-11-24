# data/Raw_data

Catálogos pequeños versionados que necesitan los scripts de normalización en CI.

| Archivo | Fuente | Consumidores |
|---|---|---|
| `cat_instituciones_40.csv` | CNBV, Sector 40 (Banca Múltiple): `entidad` → `nombre_entidad`, grupo y orden | `scripts/normalize-imor-por-banco.py`, `scripts/normalize-ifrs9.py`; IDs referenciados en `app/src/components/tables/BancosTable.tsx` |

El archivo viene en codificación Latin-1 (los acentos se ven mal si se abre como UTF-8).

Los insumos CNBV grandes (`sh_datos_40.csv`, etc.) viven en `raw-data/` y no se versionan. Para saber de dónde sale cada archivo, consulta [`docs/data-sources.md`](../../docs/data-sources.md).
