"""Check local document links, JSON/Python syntax and retained artifact hashes."""

import ast
import hashlib
import json
from pathlib import Path
import re
from urllib.parse import unquote

ROOT = Path(__file__).resolve().parents[1]
EXCLUDED = {".git", ".venv", "venv", "tmp", "output", "__pycache__", "build", "dist"}


def main():
    failures = []
    checked = 0
    for path in ROOT.rglob("*"):
        if not path.is_file() or EXCLUDED & set(path.relative_to(ROOT).parts):
            continue
        if path.suffix == ".json":
            try:
                json.loads(path.read_text(encoding="utf-8"))
            except (ValueError, UnicodeError) as exc:
                failures.append(f"{path.relative_to(ROOT)}: invalid JSON: {exc}")
        if path.suffix == ".py":
            try:
                ast.parse(path.read_text(encoding="utf-8"))
            except SyntaxError as exc:
                failures.append(f"{path.relative_to(ROOT)}: invalid Python: {exc}")
        if path.suffix == ".md":
            text = path.read_text(encoding="utf-8")
            for target in re.findall(r"\]\(([^)]+)\)", text):
                if "://" in target or target.startswith(("#", "mailto:", "urn:")):
                    continue
                target = unquote(target.split("#")[0].strip("<>"))
                if target and not (path.parent / target).exists():
                    failures.append(f"{path.relative_to(ROOT)}: broken local link {target}")
                checked += 1
    for name in ("artifacts/source/manifest.json", "artifacts/examples/manifest.json"):
        path = ROOT / name
        if not path.exists():
            failures.append(f"Missing retained artifact manifest: {name}")
            continue
        manifest = json.loads(path.read_text(encoding="utf-8"))
        for entry in manifest.get("artifacts", []):
            artifact = ROOT / entry["path"]
            if not artifact.is_file() or hashlib.sha256(artifact.read_bytes()).hexdigest() != entry["sha256"]:
                failures.append(f"Artifact missing or hash mismatch: {entry['path']}")
    if failures:
        raise SystemExit("\n".join(failures))
    print(f"Repository checks passed; {checked} local Markdown links checked, JSON/Python syntax and retained artifact hashes valid.")


if __name__ == "__main__":
    main()
