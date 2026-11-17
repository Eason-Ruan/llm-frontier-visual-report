# Run or rebuild Arena Fieldnotes on another machine

The current renderer uses D3 scales, stack/area/line geometry and timer/interpolation with Canvas, plus an SVG monthly ruler. `npm run build` creates the complete standalone site. Inside the team repository, `npm run build:report` creates and installs the English dashboard-only report build in `dashboards/ch1/`; it leaves the standalone Storyboard build separate. Rebuild from source rather than editing the generated JS files.

解压后进入 `arena-fieldnotes/`。所有运行文件与数据都在包内，不依赖原电脑目录或 Sites 账户。

## View the included build (no npm install, works offline)

Install Node.js 22.12 or later, then run in the extracted folder:

```sh
node scripts/verify-package.mjs
node scripts/serve.mjs --port 5178
```

Open <http://127.0.0.1:5178/>. Stop the server with Ctrl+C. The built site in `dist/` is included; this path needs no package downloads or remote data API. Outbound source citations only require internet when clicked. Do not open `index.html` using `file://`: browsers block its JSON fetches. If Node is unavailable but Python 3 is installed, `python3 -m http.server 5178 --bind 127.0.0.1 --directory dist` serves the same built site.

## Rebuild from source

Node.js 22.12+ and npm are required. Download locked dependencies once (internet access to the npm registry, or a populated npm cache, is needed):

```sh
npm ci
npm test
npm run build
npm run serve -- --port 5178
```

For editing with live reload, use `npm run dev -- --port 5178` instead of the last two commands. No Python, API keys, environment variables, sibling checkout, or cloud account is required for the build or tests. `node_modules` is intentionally excluded because native tooling differs by operating system; `package-lock.json` pins the dependency tree. The build was verified with Node 26.11.1 and npm 11.20.0 on the producing machine.

## Navigation and paths

- `/` or `?view=story`: **01 Storyboard** (default).
- `?view=dashboard&category=overall`: **02 Dashboard**.
- The top-left sidebar button fully hides or restores the sidebar. The preference is stored locally under `arena-fieldnotes-sidebar-collapsed`.
- EN / 中文 changes the entire interface; English is the default. The preference is stored under `arena-fieldnotes-language`.
- Asset and data requests are app-relative. `vite.config.js` uses `base: './'`; `src/assets.js` resolves the original catalog paths relative to that base. You may place the entire contents of `dist/` under any static server directory. Use its trailing-slash URL (for example `/research/arena/`) or `/research/arena/index.html`; no rewrite rule is required. Keep `assets/`, `data/` and `favicon.svg` next to `index.html`.

## What is included

| Path | Contents |
| --- | --- |
| `src/`, `index.html`, `vite.config.js` | Complete application source and relative build configuration |
| `public/data/arena/` | All 29 leaderboard datasets, catalog and provenance (31 JSON files) |
| `public/favicon.svg` | Local icon; no remote fonts or media are required |
| `tests/` | Geometry, composition, story-fact checks and bundled baseline fixtures |
| `tests/fixtures/` | Original share arrays needed for comparison; source paths and SHA-256 provenance |
| `dist/` | Ready-to-serve build, including the complete runtime data |
| `scripts/` | Dependency-free server, archive verifier and ZIP packer |
| `PACKAGE_MANIFEST.json` | Archive file inventory, byte counts and SHA-256 checksums |
| `README.md`, `QA.md` | Methodology, implementation notes and dated checks |

The provenance JSON keeps upstream file paths and hashes as historical references. Those upstream raw parquet / classification evidence files are **not runtime or build dependencies** and are not in this page package. This package reproduces the page and its calculations from the included monthly JSON; regenerating monthly JSON from raw Arena snapshots is a separate upstream data-pipeline task. All runtime JSON files are preserved byte-for-byte. The compact test fixtures retain the original comparison values and hashes without needing the old site folder.

## Repack after editing

Python 3 is needed only for this optional step:

```sh
npm test
npm run build
python3 scripts/package_portable.py exports/arena-fieldnotes-portable.zip
```

The archive excludes Git metadata, Sites identity/credentials, local caches and `node_modules`. It emits a sibling `.sha256` file; after extraction, run the verifier above. An exported package cannot overwrite the original hosted Site because it contains no hosting identity or credentials.
