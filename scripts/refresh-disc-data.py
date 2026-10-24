"""Refresh the public dossier's aggregates from a private UDisc export.

Usage: python scripts/refresh-disc-data.py INPUT.csv OUTPUT.js
Only aggregate statistics leave this script. The source export stays private.
"""
import csv
import json
import statistics
import sys
from collections import Counter, defaultdict
from datetime import datetime
from pathlib import Path


def build(source):
    with Path(source).open(encoding="utf-8-sig", newline="") as stream:
        rows = list(csv.DictReader(stream))
    key = lambda row: (row["CourseName"], row["LayoutName"], row["StartDate"])
    played = lambda row: [i for i in range(1, 24) if int(row.get(f"Hole{i}") or 0) > 0]
    pars = {key(row): row for row in rows if row["PlayerName"].strip() == "Par"}
    rounds = sorted((row for row in rows if row["PlayerName"].strip() in {"Jason", "Jason Bates"}), key=lambda row: row["StartDate"])
    if len({key(row) for row in rounds}) != len(rounds):
        raise ValueError("Duplicate scorecard identity; review before refreshing")
    for row in rounds:
        par = pars[key(row)]
        if sum(int(row[f"Hole{i}"]) for i in played(row)) != int(row["Total"]):
            raise ValueError("Hole scores do not reconcile to the total")
        if int(row["Total"]) - sum(int(par[f"Hole{i}"]) for i in played(row)) != int(row["+/-"]):
            raise ValueError("Played-hole par does not reconcile")
    complete = [row for row in rounds if played(row) and played(row) == played(pars[key(row)])]
    rated = [row for row in complete if row["RoundRating"]]
    mean = lambda values: round(statistics.mean(values), 2) if values else None
    ratings = lambda group: [int(row["RoundRating"]) for row in group if row["RoundRating"]]
    wf = [row for row in complete if row["CourseName"] in {"Willow Fork Park", "Willow Fork DGC"}
          and row["LayoutName"] in {"Main", "Main 18 Holes"}
          and played(row) == list(range(1, 19))
          and [int(pars[key(row)][f"Hole{i}"]) for i in range(1, 19)] == [3] * 17 + [4]]
    if len(wf) < 40:
        raise ValueError("Need two comparable 20-round windows")
    def window(group):
        return {"rounds": len(group), "from": group[0]["StartDate"][:10], "to": group[-1]["StartDate"][:10],
                "avg_to_par": mean([int(row["+/-"]) for row in group]), "avg_rating": mean(ratings(group))}
    aliases = {"Willow Fork": "Willow Fork", "Willow Fork Park": "Willow Fork", "Willow Fork DGC": "Willow Fork",
               "Agnes Moffitt Park": "Agnes Moffitt Park", "Agnes Moffitt Park DGC": "Agnes Moffitt Park"}
    courses = defaultdict(list)
    for row in rounds:
        name = " ".join(row["CourseName"].split())
        courses[aliases.get(name, name)].append(row)
    holes = []
    for i in range(1, 19):
        par = 4 if i == 18 else 3
        scores = [int(row[f"Hole{i}"]) for row in wf]
        holes.append({"hole": i, "par": par, "avg": mean(scores), "to_par": round(mean(scores) - par, 2),
                      "birdie": round(100 * sum(score < par for score in scores) / len(scores), 1),
                      "bogey": round(100 * sum(score > par for score in scores) / len(scores), 1)})
    months = sorted({row["StartDate"][:7] for row in rated})
    yearly = []
    for year in sorted({int(row["StartDate"][:4]) for row in rounds}):
        logs = [row for row in rounds if row["StartDate"].startswith(str(year))]
        full = [row for row in rated if row["StartDate"].startswith(str(year))]
        yearly.append({"year": year, "rounds": len(logs), "rated_rounds": len(full), "avg_rating": mean(ratings(full))})
    times = defaultdict(list)
    for row in rated:
        hour = int(row["StartDate"][11:13])
        times["Morning" if hour < 11 else "Midday" if hour < 15 else "Evening"].append(row)
    return {
        "updated": rounds[-1]["StartDate"][:10],
        "headline": {"total_rounds": len(rounds), "scored_rounds": sum(bool(played(row)) for row in rounds),
                     "complete_rounds": len(complete), "blank_rounds": sum(not played(row) for row in rounds),
                     "partial_rounds": sum(bool(played(row)) and played(row) != played(pars[key(row)]) for row in rounds),
                     "rated_rounds": len(rated), "avg_rating": round(statistics.mean(ratings(rated))),
                     "best_rating": max(ratings(rated)), "best_to_par": min(int(row["+/-"]) for row in complete)},
        "yearly": yearly, "wf_rounds": len(wf), "holes": holes,
        "recent": window(wf[-20:]), "previous": window(wf[-40:-20]),
        "added_since_may": sum(row["StartDate"] >= "2026-06" for row in rounds),
        "recovered_older": sum(row["PlayerName"].strip() == "Jason Bates" for row in rounds),
        "rating_trend": [{"month": month, "rating": mean(ratings([row for row in rated if row["StartDate"].startswith(month)])),
                          "rounds": sum(row["StartDate"].startswith(month) for row in rated)} for month in months],
        "courses_list": [{"name": name, "rounds": len(group), "avg_rating": mean(ratings([row for row in group if row in complete]))}
                         for name, group in sorted(courses.items(), key=lambda pair: (-len(pair[1]), pair[0]))],
        "tod": [{"period": period, "rating": mean(ratings(times[period])), "rounds": len(times[period])}
                for period in ["Morning", "Midday", "Evening"]],
        "nines": {"front_to_par": mean([sum(int(row[f"Hole{i}"]) - 3 for i in range(1, 10)) for row in wf]),
                  "back_to_par": mean([sum(int(row[f"Hole{i}"]) - (4 if i == 18 else 3) for i in range(10, 19)) for row in wf])}
    }


if __name__ == "__main__":
    data = build(sys.argv[1])
    Path(sys.argv[2]).write_text("// Aggregate statistics only. Generated from the private UDisc export.\nconst DATA = " + json.dumps(data, ensure_ascii=False, separators=(",", ":")) + ";\n", encoding="utf-8")
    print(json.dumps({"headline": data["headline"], "wf_rounds": data["wf_rounds"], "recent": data["recent"], "previous": data["previous"], "holes": data["holes"], "yearly": data["yearly"], "nines": data["nines"], "tod": data["tod"]}))
