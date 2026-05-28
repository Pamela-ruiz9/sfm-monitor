#!/usr/bin/env python3
"""
normalize-cnbv.py
Transforms raw CNBV JSON exports into the shape expected by SfmDataSchema.

Reads:
  raw-data/cnbv_indicadores.json   → data/credito.json
  raw-data/sofipos_by_inst.json    → data/sofipos.json

Run: python3 scripts/normalize-cnbv.py
     python3 scripts/normalize-cnbv.py --dry-run   (print output, no write)
"""

import json
import os
import sys
from datetime import datetime

DRY_RUN = "--dry-run" in sys.argv

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAW = os.path.join(ROOT, "raw-data")
OUT = os.path.join(ROOT, "data")


# ─────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────

def load(filename: str) -> object:
    path = os.path.join(RAW, filename)
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def write(filename: str, obj: object) -> None:
    path = os.path.join(OUT, filename)
    payload = json.dumps(obj, indent=2, ensure_ascii=False)
    if DRY_RUN:
        print(f"\n{'─'*60}")
        print(f"[DRY-RUN] Would write {path}:")
        print(payload[:2000] + (" ..." if len(payload) > 2000 else ""))
        return
    os.makedirs(OUT, exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        f.write(payload)
    print(f"✅ Written {path}  ({len(payload):,} bytes)")


def periodo_to_iso_month(periodo: str) -> str:
    """'202602' → '2026-02'"""
    return f"{periodo[:4]}-{periodo[4:6]}"


def iso_month_to_periodo(month: str) -> str:
    """'2026-02' → '202602'"""
    return month.replace("-", "")


def safe_float(v) -> float | None:
    try:
        return float(v) if v is not None else None
    except (TypeError, ValueError):
        return None


# ─────────────────────────────────────────────
# 1. credito.json  ← cnbv_indicadores.json
# ─────────────────────────────────────────────

def build_credito() -> dict:
    rows: list[dict] = load("cnbv_indicadores.json")

    # Sort by fecha ascending
    rows.sort(key=lambda r: r["fecha"])

    fechas = [r["fecha"] for r in rows]  # already YYYY-MM

    # Latest row with all KPI fields
    latest = rows[-1]
    latest_fecha = latest["fecha"]

    def kpi(field: str) -> dict:
        val = safe_float(latest.get(field))
        # semaforo omitted — no automatic calculation, set manually when needed
        return {
            "actual": val if val is not None else 0.0,
            "fecha": latest_fecha,
        }

    def arr(field: str, nullable: bool = False) -> list:
        """
        Build an array of values for a field across all rows.
        nullable=True  → keeps None for missing values (schema accepts z.number().nullable())
        nullable=False → fills missing with 0.0 (schema expects z.number() strictly)
        """
        out = []
        for r in rows:
            v = safe_float(r.get(field))
            out.append(v if v is not None else (None if nullable else 0.0))
        return out

    # historico_por_banco — not in this source
    historico_por_banco = None

    return {
        "ultima_actualizacion": latest_fecha,
        "fuente": "CNBV - Indicadores de Cartera de Crédito (cnbv_indicadores.json)",
        "imor":  kpi("imor_total"),
        "imora": kpi("imora_total"),
        "icor":  kpi("icor_total"),
        "roa":   kpi("roa"),
        "roe":   kpi("roe"),
        "historico_por_cartera": {
            "fechas":             fechas,
            # imor_total, imor_comercial, imor_consumo, imor_vivienda, imor_tarjeta,
            # imor_consumo_norev, icor_total: z.array(z.number()) — no nulls allowed;
            # fill with 0.0 where source data is missing (pre-2008 segments)
            "imor_total":         arr("imor_total"),
            "imor_comercial":     arr("imor_comercial"),
            "imor_consumo":       arr("imor_consumo"),
            "imor_vivienda":      arr("imor_vivienda"),
            "imor_tarjeta":       arr("imor_tarjeta"),
            "imor_consumo_norev": arr("imor_consumo_norev"),
            "icor_total":         arr("icor_total"),
            # These accept z.number().nullable() in the schema
            "imora_total":        arr("imora_total",  nullable=True),
            "roa":                arr("roa",          nullable=True),
            "roe":                arr("roe",          nullable=True),
        },
        "historico_por_banco": historico_por_banco or None,
    }


# Omit historico_por_banco key entirely when no data (schema field is .optional())
def _clean_optional_nones(d: dict) -> dict:
    """Remove keys with None values so Zod .optional() fields are omitted."""
    return {k: v for k, v in d.items() if v is not None}


# ─────────────────────────────────────────────
# 2. sofipos.json  ← sofipos_by_inst.json
# ─────────────────────────────────────────────

def build_sofipos() -> dict:
    raw: dict = load("sofipos_by_inst.json")

    all_periods: list[str] = sorted(raw["all_periods"])  # '201601', ...
    result: dict[str, dict] = raw["result"]              # inst_id → {periodo → metrics}

    fechas = [periodo_to_iso_month(p) for p in all_periods]

    # Build aggregate series (simple average across institutions per period, skip None)
    def agg_series(field: str) -> list:
        out = []
        for p in all_periods:
            vals = [
                safe_float(inst_data[p].get(field))
                for inst_data in result.values()
                if p in inst_data and inst_data[p].get(field) is not None
            ]
            out.append(round(sum(vals) / len(vals), 4) if vals else None)
        return out

    # Latest period with data
    latest_periodo = all_periods[-1]
    latest_fecha = periodo_to_iso_month(latest_periodo)

    def latest_agg(field: str) -> float | None:
        vals = [
            safe_float(inst_data[latest_periodo].get(field))
            for inst_data in result.values()
            if latest_periodo in inst_data and inst_data[latest_periodo].get(field) is not None
        ]
        return round(sum(vals) / len(vals), 4) if vals else None

    ultima = {
        "fecha":         latest_fecha,
        "imor_total":    latest_agg("imor_total")    or 0.0,
        "imor_comercial": latest_agg("imor_comercial") or 0.0,
        "imor_consumo":  latest_agg("imor_consumo")  or 0.0,
        "imor_vivienda": latest_agg("imor_vivienda") or 0.0,
        "imora_total":   latest_agg("imora_total")   or 0.0,
        "roa":           latest_agg("roa")           or 0.0,
        "roe":           latest_agg("roe")           or 0.0,
    }

    # Per-institution arrays for historico_por_entidad
    # Display name catalogue — CNBV Sector 27 (SoFiPOs)
    # Names from raw-data/cat_instituciones_27.csv (CNBV Sector 27, updated 2026)
    SOFIPOS_NOMBRES: dict[str, str] = {
        "027001": "Fincomún",
        "027002": "Batoamigo",
        "027003": "Unagra",
        "027004": "Finamigo",
        "027005": "Tamazula",
        "027006": "Alta Servicios Financieros",
        "027007": "Popular Nacional",
        "027008": "Monte de Piedad",
        "027009": "Klar",
        "027010": "Coincidir",
        "027011": "Te Creemos",
        "027012": "Ictineo",
        "027013": "Credicapital",
        "027014": "Nu México",
        "027015": "Operaciones de tu Lado",
        "027016": "Auxi",
        "027018": "Unete",
        "027019": "SAE",
        "027020": "Multiplica",
        "027021": "Perseverancia",
        "027022": "Reforma",
        "027023": "Planfía",
        "027024": "Sierra Gorda",
        "027025": "Finsocial",
        "027026": "Caja Bienestar",
        "027028": "Acción y Evolución",
        "027029": "Opciones Empresariales",
        "027030": "F Broxel",
        "027031": "Progressa",
        "027032": "Stori",
        "027033": "Libertad",
        "027034": "Capital Activo",
        "027035": "Sofiexpress",
        "027036": "Fondeadora",
        "027037": "Financiera Más",
        "027038": "CAME",
        "027039": "Sofagro",
        "027040": "Impulso",
        "027041": "Devida",
        "027042": "Paso Seguro",
        "027043": "Opormex",
        "027044": "Súmate",
        "027045": "KU-BO",
        "027046": "Financiera Sustentable",
        "027047": "Crediclub",
        "027048": "COFIA",
        "027049": "Porvenir",
        "027050": "Premo",
        "027051": "Grensa",
        "027052": "TRAFALGAR",
        "20":     "Sistema SoFiPOs",
    }
    entidades: dict[str, dict] = {}
    for inst_id, inst_data in result.items():
        imor_arr = [
            safe_float(inst_data[p].get("imor_total")) if p in inst_data else None
            for p in all_periods
        ]
        # cartera_total: last non-None imora_total value in pesos — proxy for institution size
        # Used by the frontend to sort top-15 by cartera (issue #58)
        imora_arr_pesos = [
            safe_float(inst_data[p].get("imora_total")) if p in inst_data else None
            for p in all_periods
        ]
        last_imora = next(
            (v for v in reversed(imora_arr_pesos) if v is not None),
            None,
        )
        entidades[inst_id] = {
            "nombre":        SOFIPOS_NOMBRES.get(inst_id, inst_id),
            "id":            inst_id,
            "imor":          imor_arr,
            "cartera_total": last_imora,  # pesos — latest imora_total; None if unavailable
        }

    return {
        "ultima_actualizacion": latest_fecha,
        "fuente": "CNBV - Cartera de Crédito SoFiPOs por Institución (sofipos_by_inst.json)",
        "fechas":           fechas,
        "imor_total":       agg_series("imor_total"),
        "imor_comercial":   agg_series("imor_comercial"),
        "imor_consumo":     agg_series("imor_consumo"),
        "imor_vivienda":    agg_series("imor_vivienda"),
        "imora_total":      agg_series("imora_total"),
        "roa":              agg_series("roa"),
        "roe":              agg_series("roe"),
        "ultima":           ultima,
        "historico_por_entidad": {
            "fechas":    fechas,
            "entidades": entidades,
        },
    }


# ─────────────────────────────────────────────
# Main
# ─────────────────────────────────────────────

if __name__ == "__main__":
    print("=== normalize-cnbv.py ===")
    if DRY_RUN:
        print("DRY-RUN mode — no files will be written\n")

    credito = build_credito()

    # Merge historico_por_banco from imor_por_banco.json if available
    imor_banco_path = os.path.join(OUT, "imor_por_banco.json")
    if os.path.exists(imor_banco_path):
        with open(imor_banco_path, encoding="utf-8") as f:
            imor_banco = json.load(f)
        credito["historico_por_banco"] = {
            "fechas": imor_banco["fechas"],
            "bancos": imor_banco["bancos"],
        }
        print(f"historico_por_banco: {len(imor_banco['bancos'])} bancos mergeados")
    else:
        print("⚠️  imor_por_banco.json not found — historico_por_banco omitted")
        print("   Run: python3 scripts/normalize-imor-por-banco.py")

    credito = _clean_optional_nones(credito)
    print(f"credito: {len(credito['historico_por_cartera']['fechas'])} periodos, "
          f"latest {credito['ultima_actualizacion']}, "
          f"IMOR {credito['imor']['actual']}")
    write("credito.json", credito)

    sofipos = build_sofipos()
    print(f"sofipos: {len(sofipos['fechas'])} periodos, "
          f"latest {sofipos['ultima_actualizacion']}, "
          f"{len(sofipos['historico_por_entidad']['entidades'])} instituciones")
    write("sofipos.json", sofipos)
