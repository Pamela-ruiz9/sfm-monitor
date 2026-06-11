#!/usr/bin/env python3
# Fetches event + KPI data from the Watchboard public API and writes
# data/watchboard-events.json.  Called by .github/workflows/update-watchboard.yml.
import urllib.request, json, os, sys
from datetime import datetime, timezone

BASE = "https://watchboard.dev/api/v1"
TRACKERS = [
    {"slug": "global-recession-risk", "types": None},
    {"slug": "sheinbaum-presidency",  "types": ["economic", "political"]},
    {"slug": "trump-presidencies",    "types": ["trade", "economic"]},
    {"slug": "mexico",                "types": ["economic", "market"]},
]
KPI_TRACKER = "global-recession-risk"


def fetch_json(url: str) -> dict:
    req = urllib.request.Request(url, headers={"User-Agent": "sfm-monitor-bot/1.0"})
    with urllib.request.urlopen(req, timeout=20) as r:
        return json.loads(r.read())


out: dict = {
    "updated": datetime.now(tz=timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
    "trackers": {},
}
errors = 0

for t in TRACKERS:
    slug = t["slug"]
    try:
        resp = fetch_json(f"{BASE}/events/{slug}.json")
        events = resp.get("events", [])
        if t["types"]:
            events = [e for e in events if e.get("type") in t["types"]]
        out["trackers"][slug] = {"events": events}
        print(f"ok  events/{slug}: {len(events)} eventos")
    except Exception as e:
        print(f"ERR events/{slug}: {e}", file=sys.stderr)
        out["trackers"][slug] = {"events": []}
        errors += 1

try:
    resp = fetch_json(f"{BASE}/kpis/{KPI_TRACKER}.json")
    kpis = resp.get("kpis", [])
    out["trackers"][KPI_TRACKER]["kpis"] = kpis
    print(f"ok  kpis/{KPI_TRACKER}: {len(kpis)} KPIs")
except Exception as e:
    print(f"ERR kpis/{KPI_TRACKER}: {e}", file=sys.stderr)
    out["trackers"][KPI_TRACKER]["kpis"] = []
    errors += 1

os.makedirs("data", exist_ok=True)
with open("data/watchboard-events.json", "w", encoding="utf-8") as f:
    json.dump(out, f, indent=2, ensure_ascii=False)

print(f"{'ok' if errors == 0 else 'PARTIAL'} data/watchboard-events.json ({out['updated']})")
if errors > 0:
    sys.exit(1)
