#!/usr/bin/env python3
import json, pathlib, datetime, sys
from collections import Counter, defaultdict

LOG_DIR = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else pathlib.Path("9_ADMIN/logs")
since_days = int(sys.argv[2]) if len(sys.argv) > 2 else 7

events = []
cutoff = datetime.datetime.utcnow() - datetime.timedelta(days=since_days)
for p in LOG_DIR.glob("*.log.jsonl"):
    for line in p.read_text(encoding="utf-8", errors="ignore").splitlines():
        try:
            obj = json.loads(line)
            ts = datetime.datetime.fromisoformat(obj["ts"].replace("Z","+00:00"))
            if ts >= cutoff:
                events.append(obj)
        except Exception:
            pass

by_op = Counter(e["op"] for e in events)
by_proj = Counter()
for e in events:
    if "project" in e:
        by_proj[e["project"]] += 1

print("# Report (last %d days)" % since_days)
print("Total events:", len(events))
print("By op:", dict(by_op))
print("Top projects:", by_proj.most_common(10))
