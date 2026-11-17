# Chapter 2 · ECharts dashboard

`app.py` serves normalized financial/publication data at `api/data` and the HTML
dashboard. `dashboard_data.py` retains the existing source parsing and validation.
Every chart is rendered by the report's shared ECharts engine and theme; there are
no hidden Plotly charts or Dash callbacks.

The report mounts this Flask `app` at `/dashboard/ch2/`. Standalone mode serves
the same shared engine/theme from `../../static/` at `/static/`:

```sh
uv run --with-requirements requirements.txt app.py
```

Open `http://127.0.0.1:8050/`. The relative frontend/API paths work in either mode.

`assets/model.mjs` owns selection undo and financial denominators independently
of the renderer. Clicking or dragging over marks selects organizations without
changing years. Each chart saves its first pre-selection filter snapshot;
clearing it restores that snapshot and invalidates older snapshots. Manual
organization/group/year changes invalidate undo. Hiding context never changes
the all-company denominator. Revenue Scale uses latest records up to Max Year,
independently of Min Year. CSS and legends use the same shared organization colors.

After saving the API JSON to a file, run deterministic interaction/data checks:

```sh
node tests/state.test.mjs /path/to/ch2-api-data.json
```

Browser inspection hooks are exposed at `window.CH2`: `charts`, `getState()`,
`getViews()`, `getData()` and `selectOrganizations(chartId, names)`.
