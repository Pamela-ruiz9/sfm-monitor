#!/usr/bin/env python3
"""
extract-cnbv-raw.py
Extracts raw CNBV data files into intermediate JSONs that normalize-cnbv.py can consume.

Inputs:
  raw-data/sh_datos_40.csv          → raw-data/cnbv_indicadores.json
  raw-data/sofipos_inst.xlsx        → raw-data/sofipos_by_inst.json
    (sofipos file is actually a ZIP containing 027_datos.csv)

Run:
  python3 scripts/extract-cnbv-raw.py
  python3 scripts/extract-cnbv-raw.py --dry-run
  python3 scripts/extract-cnbv-raw.py --only=cnbv
  python3 scripts/extract-cnbv-raw.py --only=sofipos

Author: Nyx 🌙 | Issue #31
"""

import csv
import json
import os
import shutil
import subprocess
import sys
import tempfile
from collections import defaultdict

DRY_RUN = "--dry-run" in sys.argv
ONLY = next((a.split("=")[1] for a in sys.argv if a.startswith("--only=")), None)

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAW = os.path.join(ROOT, "raw-data")


# ──────────────────────────────────────────────
# Helpers
# ──────────────────────────────────────────────

def write_json(filename: str, obj: object) -> None:
    path = os.path.join(RAW, filename)
    payload = json.dumps(obj, indent=2, ensure_ascii=False)
    if DRY_RUN:
        print(f"\n{'─' * 60}")
        print(f"[DRY-RUN] Would write {path}  ({len(payload):,} bytes)")
        print(payload[:1500] + (" ..." if len(payload) > 1500 else ""))
        return
    with open(path, "w", encoding="utf-8") as f:
        f.write(payload)
    print(f"✅ Written {path}  ({len(payload):,} bytes)")


def safe_float(v) -> float | None:
    try:
        return round(float(v), 7) if v is not None else None
    except (TypeError, ValueError):
        return None


def periodo_to_iso(p: str) -> str:
    """'202602' → '2026-02'"""
    return f"{p[:4]}-{p[4:6]}"


# ──────────────────────────────────────────────
# Concept mapping: idconcepto → indicator
#
# sh_datos_40.csv — Sector 40 (Banca Múltiple)
# entidad='5' = total del sistema
# Values are ratios (0–1); multiply by 100 for percentages
# except icor_total which is already a ratio ×1
#
# Mapped empirically against raw-data/cnbv_indicadores.json
# Validated on periods 202509–202602 (diff < 0.1pp)
# ──────────────────────────────────────────────

CONCEPT_MAP = {
    "imor_total":     ("40200017", 100.0),
    "imora_total":    ("40200084", 100.0),
    "icor_total":     ("40200096",   1.0),
    "roa":            ("40200034", 100.0),
    "roe":            ("40200002", 100.0),
}

CONCEPT_MAP_EXTRA = {
    "imor_comercial":     ("40200018", 100.0),
    "imor_consumo":       ("40200056", 100.0),
    "imor_vivienda":      ("40200046", 100.0),
    "imor_tarjeta":       ("40200019", 100.0),  # tarjeta de crédito
    "imor_consumo_norev": ("40200020", 100.0),  # consumo no revolvente
}

# Concepts whose raw value = 1.0 (ratio sentinel) is a CNBV artifact, not real data.
# imor_consumo (40200056) reports 1.0 throughout 2003 before the series was properly
# established. Treat any raw ratio >= 0.99 as missing for these concepts.
ARTIFACT_CONCEPTS = {"40200056"}


# ──────────────────────────────────────────────
# SoFiPOs concept mapping — sh_datos_27.csv
# Sector 27 (SoFiPOs), concept IDs from cat_conceptos_27.csv
# Values are ratios (0–1); multiply ×100 for percentages
#
# Validated against cat_conceptos_27.csv (raw-data/cat_conceptos_27.csv)
# ──────────────────────────────────────────────

SOFIPOS_CONCEPT_MAP: dict[str, tuple[str, float]] = {
    "roa":            ("27200001", 1.0),   # already in %
    "roe":            ("27200002", 1.0),   # already in %
    "imor_total":     ("27200005", 100.0), # IMOR cartera de crédito
    "imor_comercial": ("27200006", 100.0), # IMOR comercial
    "imor_consumo":   ("27200007", 100.0), # IMOR consumo
    "imor_vivienda":  ("27200008", 100.0), # IMOR vivienda
    "imora_total":    ("27200009", 100.0), # IMORA cartera de crédito
}

# IMOR concepts where raw value >= 0.99 is a CNBV sentinel (ID transition, not real data).
# Seen in 027014 (Nu México) from 202001–202106 while the ID was being reassigned.
SOFIPOS_IMOR_CONCEPTS = {"27200005", "27200006", "27200007", "27200008", "27200009"}


# ──────────────────────────────────────────────
# 1. sh_datos_40.csv → cnbv_indicadores.json
# ──────────────────────────────────────────────

def extract_cnbv() -> None:
    src = os.path.join(RAW, "sh_datos_40.csv")
    if not os.path.exists(src):
        print(f"❌ Not found: {src}")
        sys.exit(1)

    all_concepts = set(CONCEPT_MAP.values()) | set(CONCEPT_MAP_EXTRA.values())
    needed_ids = {c for c, _ in all_concepts}

    print(f"📂 Reading {src}  ({os.path.getsize(src) / 1024 / 1024:.1f} MB) ...")
    print("   Filtering entidad='5' — this may take 30-60 seconds ...")

    periodos: dict[str, dict[str, float]] = defaultdict(dict)

    with open(src, encoding="utf-8", errors="replace") as f:
        reader = csv.DictReader(f)
        for row in reader:
            if row["entidad"] != "5":
                continue
            concept = row["idconcepto"]
            if concept not in needed_ids:
                continue
            p = row["periodo"]
            val = safe_float(row["valor"])
            if val is not None:
                # Skip sentinel value 1.0 (ratio) = 100% — CNBV artifact in early periods
                if concept in ARTIFACT_CONCEPTS and val >= 0.99:
                    continue
                periodos[p][concept] = val

    if not periodos:
        print("❌ No data found for entidad='5'. Check the CSV file.")
        sys.exit(1)

    print(f"   Found {len(periodos)} periods")

    rows: list[dict] = []
    for periodo in sorted(periodos.keys()):
        data = periodos[periodo]
        row: dict = {
            "fecha": periodo_to_iso(periodo),
            "periodo": periodo,
        }
        for ind, (concept, mult) in CONCEPT_MAP.items():
            val = data.get(concept)
            if val is not None:
                row[ind] = round(val * mult, 4)
        for ind, (concept, mult) in CONCEPT_MAP_EXTRA.items():
            val = data.get(concept)
            if val is not None:
                row[ind] = round(val * mult, 4)
        rows.append(row)

    print(f"   Extracted {len(rows)} rows — latest: {rows[-1]['fecha']}")
    write_json("cnbv_indicadores.json", rows)


# ──────────────────────────────────────────────
# 2. sh_datos_27.csv → sofipos_by_inst.json
# ──────────────────────────────────────────────

def extract_sofipos() -> None:
    src = os.path.join(RAW, "sh_datos_27.csv")
    if not os.path.exists(src):
        print(f"❌ Not found: {src}")
        print("   Download from CNBV Portafolio de Información → Sector 27 → Serie Histórica → Descargar CSV")
        sys.exit(1)

    needed_ids = {concept_id for concept_id, _ in SOFIPOS_CONCEPT_MAP.values()}
    concept_to_ind = {concept_id: ind for ind, (concept_id, _) in SOFIPOS_CONCEPT_MAP.items()}
    concept_mult   = {concept_id: mult for _, (concept_id, mult) in SOFIPOS_CONCEPT_MAP.items()}

    print(f"📂 Reading {src}  ({os.path.getsize(src) / 1024 / 1024:.1f} MB) ...")
    print("   Parsing SoFiPOs indicators ...")

    # result[inst_id][periodo] = {imor_total, roa, ...}
    result: dict[str, dict[str, dict[str, float | None]]] = {}
    all_periods_set: set[str] = set()

    with open(src, encoding="latin-1", errors="replace") as f:
        reader = csv.DictReader(f)
        for row in reader:
            inst = row["entidad"].strip()
            if inst == "20":          # skip system aggregate — computed in normalize-cnbv.py
                continue
            concept = str(row["idconcepto"]).strip()
            if concept not in needed_ids:
                continue
            periodo = row["periodo"].strip()
            val = safe_float(row["valor"])
            if val is None:
                continue
            if concept in SOFIPOS_IMOR_CONCEPTS and val >= 0.99:
                continue  # CNBV sentinel during ID-reassignment periods
            mult = concept_mult[concept]
            ind  = concept_to_ind[concept]
            all_periods_set.add(periodo)
            if inst not in result:
                result[inst] = {}
            if periodo not in result[inst]:
                result[inst][periodo] = {}
            result[inst][periodo][ind] = round(val * mult, 4)

    if not result:
        print("⚠️  No institutions found — concept IDs may have changed")
        sys.exit(1)

    all_periods = sorted(all_periods_set)
    print(f"   {len(result)} institutions × {len(all_periods)} periods")
    print(f"   Periods: {all_periods[0]}–{all_periods[-1]}")

    output = {
        "all_periods": all_periods,
        "result": result,
    }
    write_json("sofipos_by_inst.json", output)


# ──────────────────────────────────────────────
# Main
# ──────────────────────────────────────────────

if __name__ == "__main__":
    print("🌙 extract-cnbv-raw.py — Nyx / Issue #31\n")

    if ONLY == "cnbv":
        extract_cnbv()
    elif ONLY == "sofipos":
        extract_sofipos()
    else:
        extract_cnbv()
        print()
        extract_sofipos()

    print("\n✅ Done. Run normalize-cnbv.py next to update data/credito.json and data/sofipos.json")
