#!/usr/bin/env python3
"""
normalize-capitalizacion.py
Extrae ICAP, CET1 (CCB) y CCF del Boletín de Capitalización CNBV.

Cierra: #19

Archivos fuente (descargar de portafolioinfo.cnbv.gob.mx):
  Banca Múltiple → Boletines → Boletines Estadísticos → Capitalización
  Descargar R1 (ICAP por institución) y R6 (Capital por concepto)

  raw-data/boletin_R1_YYYYMM.xls   → ICAP por banco (último periodo)
  raw-data/boletin_R6_YYYYMM.xls   → ICAP/CCB/CCF sistema

  Naming flexible: el script busca cualquier archivo que coincida con
  raw-data/040_15b_R1*.xls  y  raw-data/040_15b_R6*.xls

Nota: cada boletín mensual es un archivo separado. El script usa el
más reciente disponible en raw-data/.

Run:
  python3 scripts/normalize-capitalizacion.py
  python3 scripts/normalize-capitalizacion.py --dry-run
"""

import glob
import json
import os
import sys
from datetime import datetime

DRY_RUN = "--dry-run" in sys.argv

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAW = os.path.join(ROOT, "raw-data")
OUT = os.path.join(ROOT, "data")

# Conceptos en R6/BD
CVE_ICAP  = "4021750.0"  # ICAP Total sistema (%)
CVE_CCB   = "4021754.0"  # CCB / CET1 (Capital Fundamental / APR) (%)
CVE_CCF   = "4021755.0"  # CCF (Capital Fundamental a APR neto) (%)


def write_json(filename: str, obj: object) -> None:
    path = os.path.join(OUT, filename)
    payload = json.dumps(obj, indent=2, ensure_ascii=False)
    if DRY_RUN:
        print(f"\n{'─'*60}")
        print(f"[DRY-RUN] {path}:")
        print(payload[:3000] + (" ..." if len(payload) > 3000 else ""))
        return
    os.makedirs(OUT, exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        f.write(payload)
    print(f"✅ Written {path}  ({len(payload):,} bytes)")


def find_latest(pattern: str) -> str | None:
    """Devuelve el archivo más reciente que coincida con el glob."""
    files = sorted(glob.glob(os.path.join(RAW, pattern)))
    return files[-1] if files else None


def periodo_to_iso(periodo: str) -> str:
    """
    Convierte periodo CNBV (YYYYMM o YYYYMM.0) a YYYY-MM.
    Ej: '202603.0' → '2026-03', '202603' → '2026-03'
    """
    p = str(periodo).replace(".0", "").strip()
    if len(p) == 6:
        return f"{p[:4]}-{p[4:]}"
    return p


def semaforo_icap(valor: float | None) -> str:
    """
    Verde  : >= 15%  (holgado sobre el mínimo CUB de 10.5%)
    Amarillo: 10.5% ≤ x < 15%
    Rojo   : < 10.5%  (incumple mínimo regulatorio)
    """
    if valor is None:
        return "amarillo"
    if valor >= 15.0:
        return "verde"
    if valor >= 10.5:
        return "amarillo"
    return "rojo"


def parse_r1(path: str) -> tuple[dict, str]:
    """
    Parsea R1 (ICAP por banco) desde hoja MINFO.
    Retorna (dict por_banco, periodo_iso).

    Estructura MINFO:
      Fila 8, col 2: periodo (ej. 202603.0)
      Fila 9, cols 2-4: encabezados (ICAP Total, CCB, CCF)
      Fila 10: Total Banca Múltiple (cve='5')
      Fila 11+: instituciones individuales (cve='040XXX')
    """
    import xlrd
    wb = xlrd.open_workbook(path)
    ws = wb.sheet_by_name("MINFO")

    # Periodo
    periodo_raw = ws.cell_value(8, 2)
    periodo = periodo_to_iso(str(periodo_raw))

    por_banco: dict[str, dict] = {}

    for i in range(10, ws.nrows):
        cve = str(ws.cell_value(i, 0)).strip()
        nombre = str(ws.cell_value(i, 1)).strip()
        icap_raw = ws.cell_value(i, 2)
        ccb_raw  = ws.cell_value(i, 3)

        # Solo instituciones individuales (cve formato '040XXX')
        if not cve.startswith("040"):
            continue
        if not nombre:
            continue

        icap = round(float(icap_raw), 6) if icap_raw not in ("", None) else None
        ccb  = round(float(ccb_raw),  6) if ccb_raw  not in ("", None) else None

        por_banco[cve] = {
            "nombre": nombre,
            "icap_latest": icap,
            "cet1_latest": ccb,
            "semaforo": semaforo_icap(icap),
        }

    return por_banco, periodo


def parse_r6_sistema(path: str) -> tuple[float | None, float | None, str]:
    """
    Parsea R6 (conceptos del sistema) desde hoja BD.
    Retorna (icap_sistema, cet1_sistema, periodo_iso).
    """
    import xlrd
    wb = xlrd.open_workbook(path)
    ws = wb.sheet_by_name("BD")

    # Periodo en fila 1, col 7
    periodo_raw = ws.cell_value(1, 7)
    periodo = periodo_to_iso(str(periodo_raw))

    icap = None
    cet1 = None

    for i in range(ws.nrows):
        cve = str(ws.cell_value(i, 6)).strip()
        val_raw = ws.cell_value(i, 7)
        if cve == CVE_ICAP and val_raw not in ("", None):
            icap = round(float(val_raw), 6)
        elif cve == CVE_CCB and val_raw not in ("", None):
            cet1 = round(float(val_raw), 6)

    return icap, cet1, periodo


def main():
    print("=== normalize-capitalizacion.py ===\n")

    try:
        import xlrd
    except ImportError:
        print("❌ xlrd no instalado. Correr: pip3 install xlrd")
        sys.exit(1)

    r1_path = find_latest("040_15b_R1*.xls")
    r6_path = find_latest("040_15b_R6*.xls")

    # También buscar en samples/ para desarrollo
    if not r1_path:
        r1_path = find_latest("samples/040_15b_R1*.xls")
    if not r6_path:
        r6_path = find_latest("samples/040_15b_R6*.xls")

    if not r1_path or not r6_path:
        missing = []
        if not r1_path: missing.append("040_15b_R1*.xls")
        if not r6_path: missing.append("040_15b_R6*.xls")
        print(f"⚠️  Archivos faltantes en raw-data/: {', '.join(missing)}")
        print("   Descargar de: portafolioinfo.cnbv.gob.mx")
        print("   Banca Múltiple → Boletines → Boletines Estadísticos → Capitalización")
        sys.exit(1)

    print(f"📊 R1: {os.path.basename(r1_path)}")
    print(f"📊 R6: {os.path.basename(r6_path)}")

    por_banco, periodo_r1 = parse_r1(r1_path)
    icap_sis, cet1_sis, periodo_r6 = parse_r6_sistema(r6_path)

    # Usar el periodo del R1 (por banco) como referencia
    periodo = periodo_r1

    capitalizacion = {
        "ultima_actualizacion": periodo,
        "fuente": "CNBV — Boletín Estadístico de Capitalización (040_15b_R1 / R6)",
        "icap_sistema": {
            "actual": icap_sis,
            "fecha": periodo,
            "semaforo": semaforo_icap(icap_sis),
        },
        "cet1_sistema": {
            "actual": cet1_sis,
            "fecha": periodo,
        },
        # historico: se irá acumulando con cada mes que suba Pame
        # Por ahora solo el último periodo disponible
        "historico": [
            {"fecha": periodo, "icap": icap_sis, "cet1": cet1_sis}
        ] if icap_sis is not None else [],
        "por_banco": por_banco,
    }

    write_json("capitalizacion.json", capitalizacion)

    # Resumen
    n_bancos = len([b for b in por_banco.values() if b["icap_latest"] is not None])
    rojos = [n for n, b in por_banco.items() if b["semaforo"] == "rojo"]
    amarillos = [b["nombre"] for _, b in por_banco.items() if b["semaforo"] == "amarillo"]

    print(f"\n✅ ICAP sistema: {icap_sis}%  CET1: {cet1_sis}%  [{periodo}]")
    print(f"   Bancos con dato: {n_bancos}")
    print(f"   Semáforo rojo (ICAP < 10.5%): {rojos or 'ninguno'}")
    if amarillos:
        print(f"   Semáforo amarillo (10.5%–15%): {', '.join(amarillos[:5])}{'...' if len(amarillos)>5 else ''}")


if __name__ == "__main__":
    main()
