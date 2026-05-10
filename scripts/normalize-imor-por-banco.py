#!/usr/bin/env python3
"""
normalize-imor-por-banco.py
Extracts IMOR, IMORA, ICOR per institution from sh_datos_40.csv
and emits data/imor_por_banco.json in the shape of HistoricoBancoSchema.

Reads:
  raw-data/sh_datos_40.csv          (full file, ~515MB, Latin-1)
  data/Raw_data/cat_instituciones_40.csv
  raw-data/samples/cat_conceptos_40.csv (optional, for reference)

Output:
  data/imor_por_banco.json

Concepts used (verified against cat_conceptos_40.csv):
  40200017 → IMOR cartera de crédito total   (indicador=1, pre-calculated)
  40200033 → IMORA cartera de crédito total  (indicador=1, pre-calculated)
  40200096 → ICOR cartera de crédito total   (indicador=1, pre-calculated)

These are already calculated by CNBV — no manual division needed.

Run:
  python3 scripts/normalize-imor-por-banco.py
  python3 scripts/normalize-imor-por-banco.py --dry-run
"""

import csv
import json
import os
import sys
from collections import defaultdict

DRY_RUN = "--dry-run" in sys.argv

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAW  = os.path.join(ROOT, "raw-data")
OUT  = os.path.join(ROOT, "data")

# Concepts to extract (pre-calculated by CNBV)
CONCEPT_IMOR  = "40200017"
CONCEPT_IMORA = "40200033"
CONCEPT_ICOR  = "40200096"

# Exclude aggregate/group entities (not individual banks)
EXCLUDE_ENTIDADES = {"5", "59", "60", "61", "62", "63", "64"}

def write_json(filename: str, obj: object) -> None:
    path = os.path.join(OUT, filename)
    payload = json.dumps(obj, indent=2, ensure_ascii=False)
    if DRY_RUN:
        print(f"\n{'─'*60}")
        print(f"[DRY-RUN] Would write {path}  ({len(payload):,} bytes)")
        if isinstance(obj, dict):
            print(f"  fechas: {len(obj.get('fechas', []))} periodos")
            print(f"  bancos: {len(obj.get('bancos', {}))} instituciones")
        return
    os.makedirs(OUT, exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        f.write(payload)
    print(f"✅ Written {path}  ({len(payload):,} bytes)")


def periodo_to_iso(periodo: str) -> str:
    """'202602' → '2026-02'"""
    s = str(periodo).strip()
    return f"{s[:4]}-{s[4:6]}"


def load_instituciones() -> dict[str, str]:
    """Returns {entidad_code: nombre}"""
    path = os.path.join(ROOT, "data", "Raw_data", "cat_instituciones_40.csv")
    cat = {}
    with open(path, encoding="latin-1") as f:
        for r in csv.DictReader(f):
            eid = r["entidad"].strip()
            name = r["nombre_entidad"].strip()
            if eid not in EXCLUDE_ENTIDADES:
                cat[eid] = name
    return cat


def build_imor_por_banco() -> dict:
    """
    Reads sh_datos_40.csv and extracts IMOR/IMORA/ICOR per bank per period.
    Returns HistoricoBancoSchema-compatible dict.
    """
    src = os.path.join(RAW, "sh_datos_40.csv")
    if not os.path.exists(src):
        print(f"❌ {src} not found.")
        print("   Place the full sh_datos_40.csv in raw-data/ and retry.")
        sys.exit(1)

    instituciones = load_instituciones()
    print(f"📋 {len(instituciones)} institutions loaded from catalog")

    # data[entidad][periodo][concept] = valor
    data: dict[str, dict[str, dict[str, float]]] = defaultdict(lambda: defaultdict(dict))
    all_periodos: set[str] = set()
    rows_read = 0
    rows_matched = 0

    TARGET_CONCEPTS = {CONCEPT_IMOR, CONCEPT_IMORA, CONCEPT_ICOR}

    print(f"📖 Reading {src} ...")
    for enc in ("latin-1", "utf-8"):
        try:
            with open(src, encoding=enc, newline="") as f:
                reader = csv.DictReader(f)
                for row in reader:
                    rows_read += 1
                    if rows_read % 1_000_000 == 0:
                        print(f"   {rows_read:,} rows read...")

                    idconcepto = str(row.get("idconcepto", "")).strip()
                    if idconcepto not in TARGET_CONCEPTS:
                        continue

                    entidad = str(row.get("entidad", "")).strip()
                    if entidad in EXCLUDE_ENTIDADES:
                        continue
                    if entidad not in instituciones:
                        continue

                    periodo = str(row.get("periodo", "")).strip()
                    if len(periodo) != 6:
                        continue

                    valor_raw = str(row.get("valor", "0")).replace(",", "").strip()
                    try:
                        valor = float(valor_raw)
                    except ValueError:
                        continue

                    data[entidad][periodo][idconcepto] = valor
                    all_periodos.add(periodo)
                    rows_matched += 1
            break
        except UnicodeDecodeError:
            continue

    print(f"✅ Read {rows_read:,} rows, matched {rows_matched:,} indicator rows")
    print(f"   {len(data)} banks, {len(all_periodos)} periods")

    sorted_periodos = sorted(all_periodos)
    fechas = [periodo_to_iso(p) for p in sorted_periodos]

    # Build bancos dict (HistoricoBancoCarteraEntrySchema)
    bancos: dict[str, dict] = {}
    for entidad, periodos_data in sorted(data.items()):
        nombre = instituciones.get(entidad, entidad)
        imor_arr  = []
        imora_arr = []
        icor_arr  = []
        imor_latest = None

        for p in sorted_periodos:
            pd = periodos_data.get(p, {})
            imor  = pd.get(CONCEPT_IMOR)
            imora = pd.get(CONCEPT_IMORA)
            icor  = pd.get(CONCEPT_ICOR)
            imor_arr.append(imor)
            imora_arr.append(imora)
            icor_arr.append(icor)
            if imor is not None:
                imor_latest = {"valor": imor, "fecha": periodo_to_iso(p)}

        bancos[entidad] = {
            "nombre": nombre,
            "id": entidad,
            "imor_total": imor_arr,
            "imora_total": imora_arr,
            "icor_total": icor_arr,
            "imor_latest": imor_latest,
        }

    return {
        "ultima_actualizacion": periodo_to_iso(sorted_periodos[-1]) if sorted_periodos else None,
        "fuente": "CNBV - Portafolio de Información Sector 40 Banca Múltiple (sh_datos_40.csv)",
        "fechas": fechas,
        "bancos": bancos,
    }


if __name__ == "__main__":
    print("=== normalize-imor-por-banco.py ===")
    if DRY_RUN:
        print("DRY-RUN mode — no files will be written\n")

    result = build_imor_por_banco()
    n_bancos = len(result["bancos"])
    n_periodos = len(result["fechas"])
    print(f"\nimor_por_banco: {n_periodos} periodos, {n_bancos} instituciones, "
          f"latest {result['ultima_actualizacion']}")

    # Sample G7 latest IMOR
    g7_ids = ["040002", "040012", "040014", "040021", "040036", "040044", "040072"]
    print("\nG7 IMOR más reciente:")
    for eid in g7_ids:
        b = result["bancos"].get(eid)
        if b and b.get("imor_latest"):
            print(f"  {b['nombre']:20} {b['imor_latest']['valor']:.2f}% ({b['imor_latest']['fecha']})")

    write_json("imor_por_banco.json", result)
