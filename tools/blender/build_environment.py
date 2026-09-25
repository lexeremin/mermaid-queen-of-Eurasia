"""Rebuilds every environment asset (everything except characters and the boss/enemy/NPC rigs) and prints what the
plate audit changed. Run through the MCP `execute_blender_code` tool:

    REPO = "/abs/path/to/repo"
    ns = {"REPO": REPO, "__name__": "build"}
    exec(open(REPO + "/tools/blender/lib.py").read(), ns)
    exec(open(REPO + "/tools/blender/build_environment.py").read(), ns)
    print(ns["build_environment"]())          # ns["EMBED_APPLY"] = False first for a report-only run

Then `npm run assets:optimize`.
"""

import collections

for _name in (
    "build_poc_assets",
    "build_village_assets",
    "build_redsquare_assets",
    "build_gum_assets",
    "build_moscow_assets",
    "build_garden_assets",
    "build_underground_assets",
):
    exec(open(REPO + "/tools/blender/" + _name + ".py").read(), globals())


def build_environment():
    del EMBED_LOG[:]
    built = [build_tree()]
    for fn in (build_all_village, build_all_redsquare, build_all_gum, build_all_moscow, build_all_garden, build_all_underground):
        built += fn()
    by = collections.defaultdict(list)
    for entry in EMBED_LOG:
        by[entry["name"]].append(entry)
    lines = []
    for item in built:
        name = item["name"]
        plates = by.get(name, [])
        lines.append(
            "%-24s %5d tris  plates fixed %2d  decals %2d  orphans %d  worst gap %.3f  worst corner %.3f"
            % (
                name,
                item["tris"],
                sum(1 for e in plates if e["fixed"]),
                sum(1 for e in plates if e.get("decal")),
                sum(1 for e in plates if e.get("orphan")),
                max([e["gap"] or 0 for e in plates] + [0]),
                max([e["corner"] or 0 for e in plates] + [0]),
            )
        )
    return "\n".join(lines)
