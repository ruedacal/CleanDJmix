#!/usr/bin/env python3
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
FEATURES_DIR = ROOT / "web" / "js" / "features"
WORKSPACES_DIR = ROOT / "web" / "js" / "workspaces"

DOMAINS = ["copilot", "library", "audit", "hotcues", "map", "pool", "radar", "sets"]


def check_feature_cross_imports() -> list[str]:
    violations: list[str] = []
    if not FEATURES_DIR.exists():
        return violations

    for feat_dir in sorted(FEATURES_DIR.iterdir()):
        if not feat_dir.is_dir():
            continue
        feat_name = feat_dir.name
        other_domains = [d for d in DOMAINS if d != feat_name]
        pattern = re.compile(r"""(?:from|import\(?)\s+['"][^'"]*/features/(?:""" + "|".join(other_domains) + r""")(?:/|['"])""")

        for jsx_file in feat_dir.rglob("*"):
            if jsx_file.suffix not in (".js", ".jsx"):
                continue
            text = jsx_file.read_text(encoding="utf-8", errors="ignore")
            for idx, line in enumerate(text.splitlines(), start=1):
                if pattern.search(line):
                    violations.append(f"{jsx_file.relative_to(ROOT)}:{idx} -> import cruzado prohibido en feature '{feat_name}': {line.strip()}")
    return violations


def check_legacy_eel_usage() -> list[str]:
    violations: list[str] = []
    targets = [p for p in [FEATURES_DIR, WORKSPACES_DIR, ROOT / "web" / "js" / "modals"] if p.exists()]
    eel_pat = re.compile(r"\bwindow\.eel\b")
    for base in targets:
        for f in base.rglob("*"):
            if f.suffix not in (".js", ".jsx"):
                continue
            text = f.read_text(encoding="utf-8", errors="ignore")
            for idx, line in enumerate(text.splitlines(), start=1):
                if eel_pat.search(line):
                    violations.append(f"{f.relative_to(ROOT)}:{idx} -> referencia residual a window.eel: {line.strip()}")
    return violations


def main() -> int:
    errors = check_feature_cross_imports() + check_legacy_eel_usage()
    if errors:
        print("[BOUNDARY-CHECK] Fallos de aislamiento detectados:")
        for err in errors:
            print("  -", err)
        return 1
    print("[BOUNDARY-CHECK] OK — Fronteras de módulos y migración apiClient limpias.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
