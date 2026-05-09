#!/usr/bin/env python3
"""
normalize-ifrs9.py
Parses the CNBV R12A report (IFRS 9 stages) and emits data/ifrs9.json
in the shape expected by Ifrs9Schema (app/src/data/schema.ts).

Reads:
  raw-data/ifrs9_040_R12A_YYYYMM_NNN.csv  (one or more files, or a zip)
  -- OR --
  raw-data/ifrs9_bm.zip                    (auto-extracted)

Output:
  data/ifrs9.json

Run:
  python3 scripts/normalize-ifrs9.py
  python3 scripts/normalize-ifrs9.py --dry-run

─────────────────────────────────────────────────────────────────
IFRS 9 Stage mapping (R12A Banca Múltiple, Sector 40)
─────────────────────────────────────────────────────────────────
The R12A report uses a hierarchical concept code system. Stages map
to `orden_presentacion` ranges that are STABLE across institutions
and periods (verified against samples from 040002, periods 202602).

Stage identification strategy:
  We aggregate total cartera vencida (past-due) by stage using the
  `orden_presentacion` field, which is a consistent positional index
  within the R12A form layout. The CNBV Instructivo de Llenado R12A
  defines the following top-level groupings:

  | orden | concepto (example) | Description                        |
  |-------|--------------------|------------------------------------|
  |  10   | 100000000000       | Total cartera (raíz)               |
  |  20   | 100200001001       | Cartera Stage 1 (performing)       |
  |  30   | 100200102001       | Cartera Stage 1 – vigente          |
  |  40   | 100200102002       | Cartera Stage 1 – prorrogada       |
  | 120   | 100200603004       | Cartera Stage 2 (watch)            |
  | 220   | 100600001001       | Cartera Stage 3 (default/vencida)  |

  ⚠️  The instructivo is not publicly machine-readable, we use the
  concept codes observed in the sample as anchors and fall back to
  positional heuristics for unknown future schema changes.

  Codes verified against catalogo_R12A_1219_BM.csv (CNBV, Dec 2019):

  | concepto      | descripcion                                       | orden |
  |---------------|---------------------------------------------------|-------|
  | 101800104001  | Cartera de crédito con riesgo de crédito etapa 1  | 2010  |
  | 101800104002  | Cartera de crédito con riesgo de crédito etapa 2  | 3290  |
  | 101800104003  | Cartera de crédito con riesgo de crédito etapa 3  | 3910  |
  | 131800103001  | Cartera de crédito (neto total — denominador)     | 5160  |
─────────────────────────────────────────────────────────────────
"""

import csv
import glob
import io
import json
import os
import sys
import zipfile
from collections import defaultdict

DRY_RUN = "--dry-run" in sys.argv

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAW = os.path.join(ROOT, "raw-data")
OUT = os.path.join(ROOT, "data")

# ─────────────────────────────────────────────
# Stage concept map — verified against catalogo_R12A_1219_BM.csv
#
# Source: CNBV Catálogo R12A Banca Múltiple (Dec 2019 version)
# Columns: concepto, descripcion, descripcion_identada, orden
#
# The three stage roots are unambiguous in the descripcion field:
#   101800104001 → "Cartera de crédito con riesgo de crédito etapa 1"  orden 2010
#   101800104002 → "Cartera de crédito con riesgo de crédito etapa 2"  orden 3290
#   101800104003 → "Cartera de crédito con riesgo de crédito etapa 3"  orden 3910
#
# Denominator: 131800103001 → "Cartera de crédito" (neto, orden 5160)
# This is the net total used as denominator for % calculation.
# ─────────────────────────────────────────────
STAGE_CONCEPT_MAP: dict[str, int] = {
    "101800104001": 1,   # Cartera crédito etapa 1 (orden 2010)
    "101800104002": 2,   # Cartera crédito etapa 2 (orden 3290)
    "101800104003": 3,   # Cartera crédito etapa 3 (orden 3910)
}

# Fallback: use orden_presentacion if concept not in map
STAGE_ORDEN_RANGES: dict[int, tuple[int, int]] = {
    1: (2010, 3289),
    2: (3290, 3909),
    3: (3910, 4529),
}

# Concept code for total cartera (denominator for % calculation)
# 131800103001 = "Cartera de crédito" (neto total, orden 5160)
TOTAL_CARTERA_CONCEPTO = "131800103001"
TOTAL_CARTERA_ORDEN = 5160


def write_json(filename: str, obj: object) -> None:
    path = os.path.join(OUT, filename)
    payload = json.dumps(obj, indent=2, ensure_ascii=False)
    if DRY_RUN:
        print(f"\n{'─'*60}")
        print(f"[DRY-RUN] Would write {path}:")
        print(payload[:3000] + (" ..." if len(payload) > 3000 else ""))
        return
    os.makedirs(OUT, exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        f.write(payload)
    print(f"✅ Written {path}  ({len(payload):,} bytes)")


def periodo_to_iso_month(periodo: str) -> str:
    """'202602' → '2026-02'"""
    s = str(periodo).strip()
    return f"{s[:4]}-{s[4:6]}"


def iter_csv_rows(filepath: str):
    """Yield dicts from a CSV file, handling UTF-8 and Latin-1 encodings."""
    for enc in ("utf-8", "latin-1", "utf-8-sig"):
        try:
            with open(filepath, encoding=enc, newline="") as f:
                reader = csv.DictReader(f)
                rows = list(reader)
            return rows
        except (UnicodeDecodeError, Exception):
            continue
    raise RuntimeError(f"Could not read {filepath} with any supported encoding")


def iter_csv_from_zip(zip_path: str):
    """Yield (filename, rows) for each CSV inside a zip."""
    with zipfile.ZipFile(zip_path, "r") as zf:
        for name in zf.namelist():
            if name.lower().endswith(".csv"):
                with zf.open(name) as raw:
                    for enc in ("utf-8", "latin-1"):
                        try:
                            text = raw.read().decode(enc)
                            reader = csv.DictReader(io.StringIO(text))
                            yield name, list(reader)
                            break
                        except UnicodeDecodeError:
                            raw.seek(0)
                            continue


def find_input_files() -> list[tuple[str, list[dict]]]:
    """
    Find R12A CSV files. Priority:
    1. raw-data/ifrs9_bm.zip  (auto-extract)
    2. raw-data/ifrs9_040_R12A*.csv  (direct CSV files)
    3. raw-data/ifrs9_040_R12A*.csv anywhere in raw-data/
    """
    results = []

    zip_path = os.path.join(RAW, "ifrs9_bm.zip")
    if os.path.exists(zip_path):
        print(f"📦 Reading from {zip_path}")
        for name, rows in iter_csv_from_zip(zip_path):
            if rows:
                print(f"   ↳ {name}: {len(rows):,} rows")
                results.append((name, rows))
        return results

    # Direct CSV files
    patterns = [
        os.path.join(RAW, "ifrs9_040_R12A*.csv"),
        os.path.join(RAW, "**", "ifrs9_040_R12A*.csv"),
        os.path.join(RAW, "040_R12A*.csv"),
    ]
    for pattern in patterns:
        for path in glob.glob(pattern, recursive=True):
            rows = iter_csv_rows(path)
            if rows:
                print(f"📄 Reading {path}: {len(rows):,} rows")
                results.append((os.path.basename(path), rows))

    return results


def classify_stage_by_concepto(concepto: str) -> int | None:
    """Map a concepto code to stage 1/2/3, or None if not a stage root."""
    return STAGE_CONCEPT_MAP.get(str(concepto).strip())


def classify_stage_by_orden(orden: int) -> int | None:
    """Fallback: classify by orden_presentacion range."""
    for stage, (lo, hi) in STAGE_ORDEN_RANGES.items():
        if lo <= orden <= hi:
            return stage
    return None


def build_ifrs9(all_rows: list[dict]) -> dict:
    """
    Aggregate IFRS9 stage data across all institutions and periods.

    Strategy:
    1. For each (periodo, stage), sum importe_pesos across all institutions
       using STAGE_CONCEPT_MAP for identification.
    2. Also sum total cartera (TOTAL_CARTERA_CONCEPTO) per period.
    3. Compute stage % = stage_total / cartera_total * 100.
    4. Fall back to orden_presentacion ranges if concept map has no match.

    Output shape matches Ifrs9Schema:
    {
      ultima_actualizacion: str,
      fechas: [YYYY-MM, ...],
      etapa1_pct: [float, ...],
      etapa2_pct: [float, ...],
      etapa3_pct: [float, ...],
      ultima: { fecha, etapa1, etapa2, etapa3 }
    }
    """
    # per_periodo[periodo][stage] = sum of importe_pesos
    per_periodo: dict[str, dict[int, float]] = defaultdict(lambda: defaultdict(float))
    # total cartera per periodo
    totals: dict[str, float] = defaultdict(float)

    use_concepto_map = bool(STAGE_CONCEPT_MAP)
    unmatched_sample: list[str] = []

    for row in all_rows:
        concepto = str(row.get("concepto", "")).strip()
        periodo = str(row.get("periodo", "")).strip()
        importe_raw = row.get("importe_pesos", "0") or "0"

        try:
            importe = float(importe_raw)
        except ValueError:
            continue

        if not periodo or len(periodo) != 6:
            continue

        # Total cartera row
        if concepto == TOTAL_CARTERA_CONCEPTO:
            totals[periodo] += importe
            continue

        # Stage classification
        if use_concepto_map:
            stage = classify_stage_by_concepto(concepto)
        else:
            try:
                orden = int(row.get("orden_presentacion", 0))
            except ValueError:
                orden = 0
            stage = classify_stage_by_orden(orden)

        if stage is not None:
            per_periodo[periodo][stage] += importe
        elif len(unmatched_sample) < 5:
            unmatched_sample.append(concepto)

    if unmatched_sample:
        print(f"⚠️  Some concept codes not in stage map (sample): {unmatched_sample}")
        print("   → If stage totals look wrong, update STAGE_CONCEPT_MAP in this script.")

    if not totals:
        print("⚠️  No total cartera rows found — check TOTAL_CARTERA_CONCEPTO constant.")

    # Build time series
    sorted_periodos = sorted(per_periodo.keys())
    fechas = [periodo_to_iso_month(p) for p in sorted_periodos]
    etapa1_pct = []
    etapa2_pct = []
    etapa3_pct = []

    for p in sorted_periodos:
        total = totals.get(p, 0.0)
        stages = per_periodo[p]

        def pct(stage: int) -> float:
            if total <= 0:
                return 0.0
            return round(stages.get(stage, 0.0) / total * 100, 4)

        etapa1_pct.append(pct(1))
        etapa2_pct.append(pct(2))
        etapa3_pct.append(pct(3))

    # Última lectura
    ultima = None
    if sorted_periodos:
        last_p = sorted_periodos[-1]
        ultima = {
            "fecha": periodo_to_iso_month(last_p),
            "etapa1": etapa1_pct[-1] if etapa1_pct else 0.0,
            "etapa2": etapa2_pct[-1] if etapa2_pct else 0.0,
            "etapa3": etapa3_pct[-1] if etapa3_pct else 0.0,
        }

    return {
        "ultima_actualizacion": periodo_to_iso_month(sorted_periodos[-1]) if sorted_periodos else None,
        "fuente": "CNBV - Reporte R12A IFRS9 Banca Múltiple Sector 40",
        "fechas": fechas,
        "etapa1_pct": etapa1_pct,
        "etapa2_pct": etapa2_pct,
        "etapa3_pct": etapa3_pct,
        "ultima": ultima,
        "_concept_map_version": "v1 — validate against CNBV Instructivo R12A before prod",
    }


if __name__ == "__main__":
    print("=== normalize-ifrs9.py ===")
    if DRY_RUN:
        print("DRY-RUN mode — no files will be written\n")

    file_list = find_input_files()
    if not file_list:
        print("❌ No R12A CSV files found.")
        print("   Expected: raw-data/ifrs9_bm.zip  OR  raw-data/ifrs9_040_R12A*.csv")
        print("   Skipping IFRS9 output.")
        sys.exit(0)

    all_rows: list[dict] = []
    for _name, rows in file_list:
        all_rows.extend(rows)

    print(f"Total rows to process: {len(all_rows):,}")

    ifrs9 = build_ifrs9(all_rows)

    n = len(ifrs9["fechas"])
    ultima = ifrs9.get("ultima") or {}
    print(
        f"ifrs9: {n} periodos, latest {ifrs9.get('ultima_actualizacion')}, "
        f"E1={ultima.get('etapa1')}% E2={ultima.get('etapa2')}% E3={ultima.get('etapa3')}%"
    )

    write_json("ifrs9.json", ifrs9)
