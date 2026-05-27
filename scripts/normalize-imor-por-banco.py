#!/usr/bin/env python3
"""
normalize-imor-por-banco.py
Extracts IMOR, IMORA, and ICOR per bank from the CNBV Portafolio sh_datos_40.csv
and writes data/imor_por_banco.json.

Source: raw-data/sh_datos_40.csv  (~515 MB, Latin-1 encoded)
        data/Raw_data/cat_instituciones_40.csv  (bank catalogue)

Concepts extracted:
  40200017 → IMOR cartera total (%)
  40200033 → IMORA cartera total (%)
  40200096 → ICOR cartera total (%)

Run: python3 scripts/normalize-imor-por-banco.py
     python3 scripts/normalize-imor-por-banco.py --dry-run
"""

import csv
import json
import os
import sys

DRY_RUN = "--dry-run" in sys.argv

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAW = os.path.join(ROOT, "raw-data")
DATA = os.path.join(ROOT, "data")

SH_DATOS_40 = os.path.join(RAW, "sh_datos_40.csv")
CAT_INST = os.path.join(DATA, "Raw_data", "cat_instituciones_40.csv")
OUT_FILE = os.path.join(DATA, "imor_por_banco.json")

# Concepts of interest — (field_name, multiplier)
# Raw CSV values are ratios (0–1); multiply by 100 to get percentage points.
# ICOR is already a coverage ratio (e.g. 2.04 = 204% coverage), kept ×1.
CONCEPTS: dict[str, tuple[str, float]] = {
    "40200017": ("imor_total",  100.0),
    "40200033": ("imora_total", 100.0),
    "40200096": ("icor_total",    1.0),
}

# Aggregate entity IDs to exclude (sistema, grupos, no individuales)
EXCLUIR_ENTIDADES = {"5", "59", "60", "61", "62", "63", "64"}


def load_catalogue() -> dict[str, str]:
    """Returns {entidad_id: nombre} for individual banks."""
    cat = {}
    with open(CAT_INST, encoding="latin-1") as f:
        reader = csv.DictReader(f)
        for row in reader:
            eid = row.get("entidad", "").strip().strip('"')
            nombre = row.get("nombre_entidad", "").strip().strip('"')
            if eid and eid not in EXCLUIR_ENTIDADES:
                cat[eid] = nombre
    return cat


def periodo_to_iso(periodo: str) -> str:
    """'200012' → '2000-12'"""
    p = str(periodo).zfill(6)
    return f"{p[:4]}-{p[4:6]}"


def parse_sh_datos_40() -> dict:
    """
    Reads sh_datos_40.csv and returns:
    {
      entidad_id: {
        periodo_iso: {
          "imor_total": float | None,
          "imora_total": float | None,
          "icor_total": float | None,
        }
      }
    }
    """
    data: dict[str, dict[str, dict]] = {}
    total_rows = 0
    matched_rows = 0

    print(f"Reading {SH_DATOS_40} ...")
    with open(SH_DATOS_40, encoding="latin-1") as f:
        reader = csv.DictReader(f)
        for row in reader:
            total_rows += 1
            if total_rows % 5_000_000 == 0:
                print(f"  ... {total_rows:,} rows processed, {matched_rows:,} matched")

            concepto = str(row.get("idconcepto", "")).strip()
            if concepto not in CONCEPTS:
                continue

            entidad = str(row.get("entidad", "")).strip().strip('"')
            if entidad in EXCLUIR_ENTIDADES:
                continue

            periodo = str(row.get("periodo", "")).strip()
            periodo_iso = periodo_to_iso(periodo)

            try:
                raw = float(row.get("valor", "") or 0)
                _, mult = CONCEPTS[concepto]
                valor = round(raw * mult, 4) if raw is not None else None
            except (ValueError, TypeError):
                valor = None

            if entidad not in data:
                data[entidad] = {}
            if periodo_iso not in data[entidad]:
                data[entidad][periodo_iso] = {
                    "imor_total": None,
                    "imora_total": None,
                    "icor_total": None,
                }

            field, _ = CONCEPTS[concepto]
            data[entidad][periodo_iso][field] = valor
            matched_rows += 1

    print(f"  Done: {total_rows:,} total rows, {matched_rows:,} matched")
    return data


def build_output(raw_data: dict, catalogue: dict) -> dict:
    """
    Transforms raw parsed data into the output shape:
    {
      "fechas": ["2000-12", ...],
      "bancos": {
        "040002": {
          "id": "040002",
          "nombre": "Banamex",
          "imor_total":  [float|null, ...],
          "imora_total": [float|null, ...],
          "icor_total":  [float|null, ...],
          "imor_latest": {"valor": float, "fecha": "YYYY-MM"} | null,
        }
      }
    }
    Only includes banks present in the catalogue.
    Periods sorted ascending.
    """
    # Collect all unique periods across all banks
    all_periods: set[str] = set()
    for periodos in raw_data.values():
        all_periods.update(periodos.keys())
    fechas = sorted(all_periods)

    bancos: dict[str, dict] = {}
    for entidad_id, periodos in raw_data.items():
        if entidad_id not in catalogue:
            continue  # skip aggregates or unknown
        nombre = catalogue[entidad_id]
        imor_total = [periodos.get(p, {}).get("imor_total") for p in fechas]
        imora_total = [periodos.get(p, {}).get("imora_total") for p in fechas]
        icor_total = [periodos.get(p, {}).get("icor_total") for p in fechas]

        # Only include banks that have at least some IMOR data
        if any(v is not None for v in imor_total):
            # imor_latest: last non-null IMOR value with its period — avoids full array
            # iteration in the frontend (used by #36 tabla interactiva)
            imor_latest = None
            for fecha, val in zip(reversed(fechas), reversed(imor_total)):
                if val is not None:
                    imor_latest = {"valor": val, "fecha": fecha}
                    break

            bancos[entidad_id] = {
                "id": entidad_id,
                "nombre": nombre,
                "imor_total": imor_total,
                "imora_total": imora_total,
                "icor_total": icor_total,
                "imor_latest": imor_latest,
            }

    return {
        "ultima_actualizacion": fechas[-1] if fechas else None,
        "fuente": "CNBV - Portafolio de Información Sector 40 (sh_datos_40.csv)",
        "fechas": fechas,
        "bancos": bancos,
    }


def write_output(obj: dict) -> None:
    payload = json.dumps(obj, indent=2, ensure_ascii=False)
    if DRY_RUN:
        print(f"\n[DRY-RUN] Would write {OUT_FILE}")
        preview = json.dumps(
            {**obj, "bancos": {k: v for k, v in list(obj["bancos"].items())[:2]}},
            indent=2, ensure_ascii=False
        )
        print(preview[:3000] + (" ..." if len(preview) > 3000 else ""))
        return
    os.makedirs(os.path.dirname(OUT_FILE), exist_ok=True)
    with open(OUT_FILE, "w", encoding="utf-8") as f:
        f.write(payload)
    size_mb = len(payload.encode()) / 1_048_576
    print(f"✅ Written {OUT_FILE}  ({size_mb:.1f} MB)")


if __name__ == "__main__":
    print("=== normalize-imor-por-banco.py ===")
    if DRY_RUN:
        print("DRY-RUN mode — no files will be written\n")

    if not os.path.exists(SH_DATOS_40):
        print(f"❌ Source file not found: {SH_DATOS_40}")
        sys.exit(1)
    if not os.path.exists(CAT_INST):
        print(f"❌ Catalogue not found: {CAT_INST}")
        sys.exit(1)

    catalogue = load_catalogue()
    print(f"Catalogue: {len(catalogue)} individual banks loaded")

    raw_data = parse_sh_datos_40()
    print(f"Parsed: {len(raw_data)} entities with data")

    output = build_output(raw_data, catalogue)
    n_bancos = len(output["bancos"])
    n_fechas = len(output["fechas"])
    print(f"Output: {n_bancos} banks × {n_fechas} periods, latest {output['ultima_actualizacion']}")

    write_output(output)
