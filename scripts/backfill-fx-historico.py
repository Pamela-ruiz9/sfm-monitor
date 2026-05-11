#!/usr/bin/env python3
"""
backfill-fx-historico.py
One-shot: jala SF43718 (FX FIX) desde 1994-01-01 hasta hoy y escribe
data/sfm-data.json con historico.tipo_cambio_desde_1994 poblado.

Run via GitHub Actions (needs BANXICO_TOKEN secret) o local con token en env:
  BANXICO_TOKEN=xxx python3 scripts/backfill-fx-historico.py
"""
import json, os, urllib.request
from collections import OrderedDict
from datetime import date

TOKEN = os.environ["BANXICO_TOKEN"]
BASE  = "https://www.banxico.org.mx/SieAPIRest/service/v1"

def banxico_to_iso(s):
    if not s or s == "N/E": return None
    p = s.split("/")
    if len(p) == 3:
        d, m, y = p
        if len(y) == 2: y = "20" + y
        return f"{y}-{m}-{d}"
    return s

def fetch_range(series, start, end):
    url = f"{BASE}/series/{series}/datos/{start}/{end}"
    req = urllib.request.Request(url, headers={"Bmx-Token": TOKEN})
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.loads(r.read())["bmx"]["series"][0]["datos"]

print("📡 Fetching SF43718 desde 1994-01-01 ...")

# Banxico limita a cierto rango por consulta; dividimos en décadas para seguridad
chunks = [
    ("1994-01-01", "2002-12-31"),
    ("2003-01-01", "2012-12-31"),
    ("2013-01-01", "2020-12-31"),
    ("2021-01-01", date.today().strftime("%Y-%m-%d")),
]

all_daily = []
for start, end in chunks:
    data = fetch_range("SF43718", start, end)
    all_daily.extend(data)
    print(f"   {start}→{end}: {len(data)} puntos")

print(f"   Total diario: {len(all_daily)} puntos")

# Agregar a mensual (fin de mes = último dato del mes)
monthly_map = OrderedDict()
for x in all_daily:
    if x["dato"] == "N/E": continue
    d, m, y = x["fecha"].split("/")
    key = f"{y}-{m}"
    monthly_map[key] = round(float(x["dato"]), 4)

historico_mensual = [{"mes": k, "valor": v} for k, v in sorted(monthly_map.items())]
print(f"   Mensual: {len(historico_mensual)} puntos ({historico_mensual[0]['mes']} → {historico_mensual[-1]['mes']})")

# Leer sfm-data.json actual y actualizar
data_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data", "sfm-data.json")
with open(data_path, encoding="utf-8") as f:
    sfm = json.load(f)

# Actualizar historico_mensual (el largo, para la gráfica)
sfm["tipo_cambio"]["historico_mensual"] = historico_mensual

# También poblar historico.tipo_cambio_desde_1994 (mismo array, compat con FXChart)
if "historico" not in sfm:
    sfm["historico"] = {}
sfm["historico"]["tipo_cambio_desde_1994"] = historico_mensual

# Mantener actual + fecha del último punto
sfm["tipo_cambio"]["actual"] = historico_mensual[-1]["valor"]

with open(data_path, "w", encoding="utf-8") as f:
    json.dump(sfm, f, indent=2, ensure_ascii=False)

print(f"✅ Escrito {data_path}")
print(f"   actual: ${historico_mensual[-1]['valor']} ({historico_mensual[-1]['mes']})")
