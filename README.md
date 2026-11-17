# From Open Labs to Closed Empires · Five-Chapter Visual Report

This is the local web work product for COMP7507 Group 3. Python Flask serves the narrative report, a summary-data API, and unified dashboard routes. ECharts renders the report figures and Chapters 2–5 with shared colors and typography from `static/chart-theme.js`. Chapter 1 uses D3 scales, paths, stacking and animation on Canvas, plus an SVG monthly ruler. The original four team dashboards retain their interactions, and the Chapter 5 synthesis dashboard is available from the same entry point.

## Run

From this directory:

```bash
bash start.sh
```

On first run, the script creates `.venv` and installs `requirements.txt`. Open <http://127.0.0.1:8764/>. To choose another port, run `PORT=8765 bash start.sh` and use that port in the URL. Press `Ctrl+C` to stop the server.

## Share from this Mac

Double-click `share.command`, or run `bash share.sh` in this directory. The script starts the Python WSGI server on a local-only port and creates a temporary HTTPS address through Cloudflare Tunnel. Copy the `https://...trycloudflare.com` address printed in the terminal and send it to teammates. No router port forwarding or Cloudflare account is needed. The first run installs Python dependencies and downloads the official `cloudflared` binary into `.tools/` if necessary.

Keep the Mac awake, connected to the internet, and the terminal open while others visit. Press `Ctrl+C` to stop sharing. The address changes on each restart, and anyone with the address can view the site. Restricting access or keeping a permanent address requires a named tunnel and a Cloudflare account.

After editing the main report's HTML, CSS, or JavaScript, teammates can refresh their browser to see the change at the same address. Restart `share.sh` after editing Python code or dashboard server logic; a quick tunnel assigns a new address when restarted. For local preview while editing, continue using `start.sh`.

`index.html` is the static entry and run guide for the course package. The full report is served at the Flask root path. No download of the original datasets or the 6.4 GB RAR archive is needed. Chart libraries and visualization data are included locally; Inter variable fonts and their OFL license are included locally.

## Pages and contributors

| Page | Route | Contributor | Focus |
| --- | --- | --- | --- |
| Narrative report | `/` | All | Storyline, summary figures, and measurement limits |
| Ch1 | `/explore/ch1/` | Ruan Lixin | Interactive Arena ranks and licenses |
| Ch2 | `/explore/ch2/` | Qi Yingying | Market capitalization, revenue, and academic output |
| Ch3 | `/explore/ch3/` | Wong Yan Yuet | Training costs, funding threshold, and model origins |
| Ch4 | `/explore/ch4/` | Wang Ling | Evaluation share, HF supply, exposure, talent, and adoption |
| Ch5 | `/explore/ch5/` | Huang Shan | Ranking shift and linked organization evidence in two views |

Shared color, spacing, radius, typography tokens and local Inter font faces live in `static/chart-theme.css`; `static/embed.css` defines the common dashboard cards and help dialog. The Storyboard and all `/explore/chN/` routes use the same master shell with a persistent sidebar. Each chapter dashboard starts collapsed and can expand inline or open full screen. Full screen keeps the green title and navigation visible; **Back to story** and Escape return to the report. Browser Back also restores the previous view.

Each dashboard iframe is created on its first expansion, stays in its original host, and keeps its source and controller state through collapse and full screen. Raw `/dashboard/chN/` routes remain available for standalone access; the report uses `/dashboard/chN/?embed=1`. On screens narrower than 1100 pixels, the sidebar is a navigation drawer. Below 760 pixels, report and dashboard layouts stack vertically.

`static/embed-bridge.js` provides `window.ReportEmbed.ready(metadata)`, `notify()`, `setView({view, selection, category})`, `requestFullscreen()`, `onAction(fn)` (returns an unsubscribe function), `help({title, text, source})`, and `error(message)`. Controllers can initialize asynchronously. Parent messages `report:mode`, `report:resize`, and `report:action` become document CustomEvents. Child messages are `report:ready`, `report:height`, `report:view`, `report:fullscreen`, `report:escape`, and `report:error`. Both sides verify same origin, source window, and chapter ID. Inline height is measured from natural content, independent of the iframe viewport. Full screen uses the available viewport height and caches natural height for the return to the story. Only the active chapter mirrors supported deep links: Ch1 `?category=…`; Ch5 `?sel=…#view`. A dashboard error offers **Retry this dashboard**, which reloads that iframe on explicit user action and keeps the other chapter frames intact.

The completed refactor checks and captured evidence are documented in [VERIFICATION.md](VERIFICATION.md). Final desktop, tablet, and mobile previews are saved under `output/playwright/` in the working directory.

## Data and interpretation

- **Ch1:** Arena `overall` uses the last observed snapshot of each month. Top N uses source rank ≤N and preserves ties. A period with fewer than 50 models is not treated as a complete Top 50.
- **Ch2:** Market capitalization is month-end closing price × historical shares outstanding. Private-lab revenue run rates and listed-company annual revenue have different definitions and are not subtracted. The 2026 financial coverage is partial.
- **Ch3:** Training costs are Epoch estimates in 2023 USD, not audited expenditure. Academia/industry origin shares come from Stanford AI Index Figure 1.1.5.
- **Ch4:** Proprietary recorded-evaluation share comes from quarter-end Arena snapshots; HF supply counts new model repositories per quarter. The units and denominators differ. BTOS measures broad AI use among U.S. employer businesses and does not identify the models used.
- **Ch5:** The linked views place multiple measures for one organization side by side. They show association and timing, not an identified causal effect.

The report figures are derived from the supplied dashboard data under `dashboards/`. The original dashboards retain their own data files and annotations. These are locally saved source versions, not live online updates.

## Package

Exclude `.venv/`, `.tools/`, `__pycache__/`, and `.DS_Store` when packaging this directory. The course-required final group and individual PDF reports were not included in the dashboard materials. Add them to the submission package and link them from `index.html` once they are complete.

## Rebuild Chapter 1

The editable D3 implementation is in `sites/arena-weight-flow`. From that directory run `npm ci`, `npm test`, and `npm run build:report`. This builds and installs the English dashboard entry into `dashboards/ch1`; the standalone `npm run build` includes the story page and language switch. `BUILD_INFO.json` records the generated asset hashes.
