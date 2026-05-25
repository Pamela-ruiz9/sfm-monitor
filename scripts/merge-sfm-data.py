#!/usr/bin/env python3
"""
merge-sfm-data.py
Merges Banxico data (data/sfm-data.json) with CNBV normalized outputs
(data/credito.json, data/sofipos.json, data/ifrs9.json) into the final
sfm-data.json that satisfies SfmDataSchema.

Run: python3 scripts/merge-sfm-data.py
     python3 scripts/merge-sfm-data.py --dry-run

The Banxico data is already in sfm-data.json (written by update-data.yml).
This script adds the CNBV fields: credito, sofipos, ifrs9, historico.
"""

import json
import os
import sys

DRY_RUN = "--dry-run" in sys.argv

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(ROOT, "data")


def load(filename: str) -> dict | None:
    path = os.path.join(DATA, filename)
    if not os.path.exists(path):
        print(f"⚠️  {filename} not found — field will be skipped")
        return None
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def write(filename: str, obj: object) -> None:
    path = os.path.join(DATA, filename)
    payload = json.dumps(obj, indent=2, ensure_ascii=False)
    if DRY_RUN:
        print(f"\n{'─'*60}")
        print(f"[DRY-RUN] Would write {path}:")
        # Print just the top-level keys and sizes
        if isinstance(obj, dict):
            for k, v in obj.items():
                size = len(json.dumps(v))
                print(f"  {k}: {size:,} chars")
        return
    with open(path, "w", encoding="utf-8") as f:
        f.write(payload)
    print(f"✅ Written {path}  ({len(payload):,} bytes)")


if __name__ == "__main__":
    print("=== merge-sfm-data.py ===")
    if DRY_RUN:
        print("DRY-RUN mode — no files will be written\n")

    # Load base (Banxico data written by the workflow's Fetch Banxico step)
    base = load("sfm-data.json")
    if base is None:
        print("❌ sfm-data.json not found — run Banxico fetch first")
        sys.exit(1)

    # Load CNBV normalized outputs
    credito = load("credito.json")
    sofipos = load("sofipos.json")
    ifrs9 = load("ifrs9.json")
    capitalizacion = load("capitalizacion.json")
    liquidez = load("liquidez.json")

    # Merge: CNBV fields added/overwritten into base
    if credito:
        base["credito"] = credito
        print(f"✅ credito: IMOR {credito['imor']['actual']}% ({credito['imor']['fecha']}), "
              f"{len(credito['historico_por_cartera']['fechas'])} periodos")

    if sofipos:
        base["sofipos"] = sofipos
        print(f"✅ sofipos: {len(sofipos['fechas'])} periodos, "
              f"latest {sofipos['ultima_actualizacion']}")

    if ifrs9:
        # Strip internal metadata key before writing to prod JSON
        ifrs9_clean = {k: v for k, v in ifrs9.items() if not k.startswith("_")}
        base["ifrs9"] = ifrs9_clean
        ultima = ifrs9_clean.get("ultima") or {}
        print(f"✅ ifrs9: {len(ifrs9_clean['fechas'])} periodos, "
              f"E1={ultima.get('etapa1')}% E2={ultima.get('etapa2')}% E3={ultima.get('etapa3')}%")
    else:
        # ifrs9.json missing → inject empty-but-valid stub so Zod passes
        # Remove this once normalize-ifrs9.py has run successfully
        if "ifrs9" not in base:
            base["ifrs9"] = {
                "fechas": [],
                "etapa1_pct": [],
                "etapa2_pct": [],
                "etapa3_pct": [],
            }
            print("⚠️  ifrs9: using empty stub (run normalize-ifrs9.py to populate)")

    if capitalizacion:
        base["capitalizacion"] = capitalizacion
        icap = capitalizacion.get("icap_sistema", {})
        print(f"✅ capitalizacion: ICAP={icap.get('actual')}% ({icap.get('fecha')})")
    else:
        print("⏭️  capitalizacion: no data (descargar boletin_capitalizacion.xlsx del portal CNBV)")

    if liquidez:
        base["liquidez"] = liquidez
        lcr = liquidez.get("lcr_sistema", {})
        print(f"✅ liquidez: LCR={lcr.get('actual')}% ({lcr.get('fecha')})")
    else:
        print("⏭️  liquidez: no data (descargar reporte_liquidez.xlsx del portal CNBV)")

    # historico: empty object satisfies HistoricoSchema (all fields optional)
    if "historico" not in base:
        base["historico"] = {}

    write("sfm-data.json", base)
    print("\nDone. Run `node --experimental-strip-types app/scripts/validate-data.ts` to verify schema.")
