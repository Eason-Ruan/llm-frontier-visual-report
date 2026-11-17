"""Create a portable source + data + built-site archive using only Python stdlib."""
from pathlib import Path
import hashlib
import json
import sys
import zipfile

root = Path(__file__).resolve().parent.parent
output = Path(sys.argv[1]).resolve() if len(sys.argv) > 1 else root / "exports/arena-fieldnotes-portable.zip"
directories = ["src", "public", "tests", "scripts", "dist"]
names = ["README.md", "RUNNING.md", "QA.md", "package.json", "package-lock.json", "index.html", "vite.config.js", ".gitignore"]
files = [root / name for name in names]
for directory in directories:
    files.extend(p for p in (root / directory).rglob("*") if p.is_file() and not any(part.startswith(".") or part == "__pycache__" for part in p.relative_to(root).parts))
files = sorted(set(files))
for required in [root / "dist/index.html", root / "public/data/arena/index.json", *[root / name for name in names]]:
    if required not in files or not required.is_file():
        raise SystemExit(f"Missing required file: {required.relative_to(root)}")
payload = {p.relative_to(root).as_posix(): p.read_bytes() for p in files}
manifest = {
    "schemaVersion": 1,
    "description": "Arena Fieldnotes portable page source, runtime data, validation fixtures and built assets",
    "files": [{"path": name, "bytes": len(data), "sha256": hashlib.sha256(data).hexdigest()} for name, data in payload.items()],
    "excluded": ["node_modules", ".git", ".openai", ".sites-runtime", "external upstream raw-data pipeline"],
    "note": "PACKAGE_MANIFEST.json does not hash itself. npm dependencies are locked in package-lock.json; dist runs without installing them."
}
payload["PACKAGE_MANIFEST.json"] = (json.dumps(manifest, ensure_ascii=False, indent=2) + "\n").encode()
output.parent.mkdir(parents=True, exist_ok=True)
with zipfile.ZipFile(output, "w", zipfile.ZIP_DEFLATED, compresslevel=9) as archive:
    for name, data in payload.items():
        entry = zipfile.ZipInfo("arena-fieldnotes/" + name, date_time=(2026, 11, 6, 0, 0, 0))
        entry.compress_type = zipfile.ZIP_DEFLATED
        entry.external_attr = 0o100644 << 16
        archive.writestr(entry, data)
digest = hashlib.sha256(output.read_bytes()).hexdigest()
output.with_suffix(output.suffix + ".sha256").write_text(f"{digest}  {output.name}\n")
print(json.dumps({"archive": str(output), "bytes": output.stat().st_size, "files": len(payload), "sha256": digest}))
