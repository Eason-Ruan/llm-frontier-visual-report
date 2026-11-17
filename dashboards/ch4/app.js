"use strict";

// The data stays embedded so this dashboard also works from a local file.
const D = JSON.parse(document.getElementById("dataset").textContent);
const $ = (id) => document.getElementById(id);
const R = window.ReportCharts;
const C = R.colors;
const DAY = 86400000;
const state = {
  start: "2024-01-01",
  end: "2025-12-31",
  selected: [0, 1, 2, 3, 4],
  country: "US",
  focus: null,
  complete: false,
  fixed: true,
  ci: true,
  events: true,
};
const names = Object.fromEntries(
  D.talent.map((r) => [r.country_code, r.country]),
);
const countries = [
  ...new Map(
    D.talent.map((r) => [
      r.country_code,
      { code: r.country_code, name: r.country },
    ]),
  ).values(),
].sort((a, b) => a.name.localeCompare(b.name, "en"));
const charts = new Map();
const esc = (x) =>
  String(x).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const ts = (d) => Date.parse(d + "T00:00:00Z");
const iso = (t) => new Date(t).toISOString().slice(0, 10);
const fmt = (n, p = 2) =>
  Number(n).toLocaleString("en-US", {
    maximumFractionDigits: p,
    minimumFractionDigits: p,
  });
const finite = (n) => n !== null && Number.isFinite(n);
const sum = (a) => a.reduce((s, n) => s + n, 0);
const within = (d) => d >= state.start && d <= state.end;
const qdata = () => D.quarters.filter((r) => within(r.date));
const quarterEnd = (q) => iso(Date.UTC(+q.slice(0, 4), +q.slice(-1) * 3, 0));
const supplyData = () =>
  D.quarters
    .filter((r) => finite(r.created_models) && within(quarterEnd(r.quarter)))
    .map((r) => ({ ...r, date: quarterEnd(r.quarter) }));
const weeks = () =>
  D.weeks.filter((r) => within(r.date) && (!state.complete || !r.partial));
const talentData = () =>
  D.talent
    .filter((r) => r.country_code === state.country && within(r.date))
    .sort((a, b) => a.date.localeCompare(b.date));
const adoptData = () => D.adoption.filter((r) => within(r.date));
const short = (n) =>
  n
    .replace("claude-opus-4-20250514", "Claude Opus 4")
    .replace("gemini-2.5-flash", "Gemini 2.5 Flash")
    .replace("gemini-2.5-pro", "Gemini 2.5 Pro")
    .replace("mistral-medium-2505", "Mistral Medium")
    .replace("qwen3-235b-a22b-no-thinking", "Qwen3 235B")
    .replace(/-2025\d{4}/g, "");
function modelOrg(n) {
  const keys = [
    [/claude/i, "Anthropic"],
    [/gemini|gemma|palm/i, "Google"],
    [/^(gpt|chatgpt|o[134])/i, "OpenAI"],
    [/grok/i, "xAI"],
    [/qwen|qwq/i, "Alibaba"],
    [/deepseek/i, "DeepSeek"],
    [/llama/i, "Meta"],
    [/mistral|magistral/i, "Mistral"],
    [/kimi|moonshot/i, "Moonshot"],
    [/minimax/i, "MiniMax"],
    [/glm/i, "Z.ai"],
    [/nova/i, "Amazon"],
  ];
  return keys.find(([pattern]) => pattern.test(n))?.[1] || n;
}
const modelColor = (i) => R.orgColor(modelOrg(D.models[i]));
let toastTimer;
function toast(text) {
  $("toast").textContent = text;
  $("toast").classList.add("on");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => $("toast").classList.remove("on"), 2600);
}
function announce(text) {
  $("chart-readout").textContent = text;
}
function period(a) {
  return a.length ? a[0].date + " — " + a.at(-1).date : "No data in range";
}
function changeText(a, key, unit = "pp") {
  if (a.length < 2) return a.length ? "One observation" : "No observations";
  const d = a.at(-1)[key] - a[0][key];
  return "Change: " + (d >= 0 ? "+" : "−") + fmt(Math.abs(d)) + " " + unit;
}
function monthGap(a, b) {
  const x = new Date(ts(a)),
    y = new Date(ts(b));
  return (
    (y.getUTCFullYear() - x.getUTCFullYear()) * 12 +
    y.getUTCMonth() -
    x.getUTCMonth()
  );
}
function monthlyPoints(data) {
  const result = [];
  data.forEach((d, i) => {
    const prior = data[i - 1];
    if (prior && monthGap(prior.date, d.date) > 1) {
      const date = new Date(ts(prior.date));
      result.push([
        Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1),
        null,
      ]);
    }
    result.push([ts(d.date), finite(d.value) ? d.value : null]);
  });
  return result;
}
function chartEntry(id) {
  const host = $(id);
  if (!host.offsetParent) return null;
  let entry = charts.get(id);
  if (!entry) {
    entry = {
      id,
      host,
      chart: R.init(host),
      dates: [],
      keyboard: -1,
      drag: null,
    };
    charts.set(id, entry);
    bindTimeline(entry);
  }
  entry.chart.resize();
  return entry;
}
function emptyChart(id, message) {
  const entry = chartEntry(id);
  if (!entry) return;
  entry.dates = [];
  entry.series = [];
  entry.domain = null;
  entry.host.setAttribute("aria-label", message);
  entry.chart.setOption(
    {
      animation: false,
      aria: { enabled: false },
      xAxis: { show: false },
      yAxis: { show: false },
      series: [],
      graphic: [
        {
          type: "text",
          left: "center",
          top: "middle",
          style: {
            text: message,
            fill: C.muted,
            font: "11px " + R.font,
            overflow: "break",
            width: Math.max(100, entry.host.clientWidth - 25),
            align: "center",
          },
        },
      ],
    },
    true,
  );
}
function bounds(entry) {
  const w = entry.chart.getWidth(),
    h = entry.chart.getHeight();
  return {
    left: entry.grid.left,
    right: w - entry.grid.right,
    top: entry.grid.top,
    bottom: h - entry.grid.bottom,
  };
}
function graphic(entry, id, properties) {
  entry.chart.setOption({ graphic: [{ id, ...properties }] });
}
function pointInGrid(entry, x, y) {
  if (!entry.domain) return false;
  const b = bounds(entry);
  return x >= b.left && x <= b.right && y >= b.top && y <= b.bottom;
}
function chartTime(entry, x) {
  return entry.chart.convertFromPixel({ xAxisIndex: 0 }, x);
}
function nearestDate(entry, t) {
  return entry.dates.reduce((a, b) =>
    Math.abs(ts(a) - t) <= Math.abs(ts(b) - t) ? a : b,
  );
}
function pointerPosition(entry, e) {
  const b = entry.host.getBoundingClientRect();
  return {
    x: ((e.clientX - b.left) * entry.chart.getWidth()) / b.width,
    y: ((e.clientY - b.top) * entry.chart.getHeight()) / b.height,
  };
}
function clearBrush(entry) {
  if (entry.domain)
    graphic(entry, "range-brush", { type: "rect", invisible: true });
  entry.drag = null;
}
function bindTimeline(entry) {
  if (entry.id === "countries") return;
  const host = entry.host;
  host.tabIndex = 0;
  host.setAttribute("role", "group");
  host.addEventListener("pointerdown", (e) => {
    const p = pointerPosition(entry, e);
    if (
      e.pointerType === "touch" ||
      e.button !== 0 ||
      !pointInGrid(entry, p.x, p.y)
    )
      return;
    entry.drag = p;
    host.setPointerCapture(e.pointerId);
  });
  host.addEventListener("pointermove", (e) => {
    if (!entry.drag) return;
    const p = pointerPosition(entry, e),
      b = bounds(entry),
      x = Math.max(b.left, Math.min(b.right, p.x));
    if (Math.abs(x - entry.drag.x) > 5)
      graphic(entry, "range-brush", {
        type: "rect",
        silent: true,
        invisible: false,
        z: 50,
        shape: {
          x: Math.min(entry.drag.x, x),
          y: b.top,
          width: Math.abs(x - entry.drag.x),
          height: b.bottom - b.top,
        },
        style: { fill: C.teal, opacity: 0.13 },
      });
  });
  host.addEventListener("pointerup", (e) => {
    if (!entry.dates.length) return;
    const p = pointerPosition(entry, e),
      b = bounds(entry),
      x = Math.max(b.left, Math.min(b.right, p.x)),
      start = entry.drag?.x;
    const dragged = start !== undefined && Math.abs(x - start) > 14;
    clearBrush(entry);
    if (dragged) {
      entry.chart.dispatchAction({ type: "hideTip" });
      setRange(
        iso(chartTime(entry, Math.min(x, start))),
        iso(chartTime(entry, Math.max(x, start))),
      );
    } else if (pointInGrid(entry, p.x, p.y)) {
      setFocus(nearestDate(entry, chartTime(entry, x)));
    }
  });
  host.addEventListener("pointercancel", () => clearBrush(entry));
  host.addEventListener("keydown", (e) => {
    if (
      !["ArrowLeft", "ArrowRight", "Enter", "Escape"].includes(e.key) ||
      !entry.dates.length
    )
      return;
    if (e.key === "Escape" && !state.focus) return;
    e.preventDefault();
    if (e.key === "Escape") {
      state.focus = null;
      renderFocus();
      renderCountries();
      highlight();
      entry.chart.dispatchAction({ type: "hideTip" });
      announce("Date focus cleared");
      window.Ch4Layout?.sync(state);
      return;
    }
    if (e.key === "Enter") {
      if (entry.keyboard < 0) entry.keyboard = 0;
      setFocus(entry.dates[entry.keyboard]);
      announce("Focused " + entry.dates[entry.keyboard]);
      return;
    }
    entry.keyboard = Math.max(
      0,
      Math.min(
        entry.dates.length - 1,
        entry.keyboard + (e.key === "ArrowRight" ? 1 : -1),
      ),
    );
    const date = entry.dates[entry.keyboard],
      b = bounds(entry),
      x = entry.chart.convertToPixel({ xAxisIndex: 0 }, ts(date));
    entry.chart.dispatchAction({
      type: "showTip",
      x,
      y: (b.top + b.bottom) / 2,
    });
    entry.chart.dispatchAction({
      type: "updateAxisPointer",
      x,
      y: (b.top + b.bottom) / 2,
    });
    const values = entry.series
      .map((s) => {
        const d = s.data.find((d) => d.date === date && finite(d.value));
        return d ? s.name + " " + fmt(d.value) + (entry.unit || "") : "";
      })
      .filter(Boolean)
      .join("; ");
    announce(date + ": " + values + ". Enter to link this date across charts.");
  });
  host.addEventListener("blur", () =>
    entry.chart.dispatchAction({ type: "hideTip" }),
  );
}
function makeChart(id, series, opt = {}) {
  const entry = chartEntry(id);
  if (!entry) return;
  const records = series.flatMap((s) => s.data.filter((d) => finite(d.value)));
  if (!records.length) {
    emptyChart(id, opt.empty || "No observations in range");
    return;
  }
  const timestamps = records.map((r) => ts(r.date));
  let xmin = Math.min(...timestamps),
    xmax = Math.max(...timestamps);
  if (opt.domain) [xmin, xmax] = opt.domain;
  if (xmin === xmax) {
    xmin -= 14 * DAY;
    xmax += 14 * DAY;
  }
  if (opt.bar && !opt.domain) {
    const pad = ((xmax - xmin) / Math.max(records.length - 1, 1)) * 0.4;
    xmin -= pad;
    xmax += pad;
  }
  const values = records.flatMap((r) => [r.value, r.lo, r.hi].filter(finite));
  let ymin = opt.ymin ?? Math.min(0, ...values),
    ymax = opt.ymax ?? Math.max(0, ...values) * 1.13;
  if (ymax <= ymin) ymax = ymin + 1;
  const sample = id === "samples";
  const grid = {
    left: sample ? 42 : 46,
    right: 15,
    top: sample ? 3 : 18,
    bottom: sample ? 3 : 28,
  };
  Object.assign(entry, {
    series,
    domain: [xmin, xmax],
    grid,
    unit: opt.unit,
    dates: [...new Set(records.map((r) => r.date))].sort(),
  });
  entry.keyboard = Math.min(entry.keyboard, entry.dates.length - 1);
  entry.host.setAttribute(
    "aria-label",
    (opt.label || id) +
      ". Left and right arrow keys inspect dates; Enter links a date; Escape clears it. Drag horizontally to filter all charts.",
  );
  const rendered = [];
  series.forEach((s, si) => {
    if (s.band) {
      rendered.push({
        id: "band-base-" + si,
        name: "Interval lower bound",
        type: "line",
        stack: "interval-" + si,
        silent: true,
        data: s.data.map((d) => [ts(d.date), d.lo]),
        symbol: "none",
        lineStyle: { opacity: 0 },
        areaStyle: { opacity: 0 },
        tooltip: { show: false },
        emphasis: { disabled: true },
      });
      rendered.push({
        id: "band-width-" + si,
        name: "90% interval",
        type: "line",
        stack: "interval-" + si,
        silent: true,
        data: s.data.map((d) => [
          ts(d.date),
          finite(d.hi) && finite(d.lo) ? d.hi - d.lo : null,
        ]),
        symbol: "none",
        lineStyle: { opacity: 0 },
        areaStyle: { color: s.color, opacity: 0.12 },
        tooltip: { show: false },
        emphasis: { disabled: true },
      });
    }
    const base = {
      id: "value-" + si,
      name: s.name,
      type: opt.bar ? "bar" : "line",
      data: opt.monthly
        ? monthlyPoints(s.data)
        : s.data.map((d) =>
            opt.bar
              ? {
                  value: [ts(d.date), d.value],
                  itemStyle: { color: d.partial ? C.unknown : s.color },
                }
              : [ts(d.date), finite(d.value) ? d.value : null],
          ),
      connectNulls: false,
      symbol: s.symbol || "circle",
      symbolSize: 5,
      showSymbol: s.data.length < 40,
      lineStyle: { color: s.color, width: 2, type: s.dash || "solid" },
      itemStyle: { color: s.color },
      barMaxWidth: 44,
      barWidth: opt.bar ? "52%" : undefined,
      emphasis: { focus: "series" },
      animation: false,
    };
    if (si === 0 && opt.shades?.length)
      base.markArea = {
        silent: true,
        label: { show: false },
        itemStyle: { color: C.unknown, opacity: 0.12 },
        data: opt.shades.map((r) => [
          { xAxis: ts(r.date) },
          { xAxis: ts(r.end) },
        ]),
      };
    if (si === 0 && opt.events?.length)
      base.markLine = {
        silent: true,
        symbol: ["none", "circle"],
        symbolSize: 4,
        label: { show: false },
        lineStyle: { color: C.gold, type: "dashed", width: 1, opacity: 0.8 },
        data: opt.events
          .filter((r) => ts(r.date) >= xmin && ts(r.date) <= xmax)
          .map((r) => ({ name: r.model, xAxis: ts(r.date) })),
      };
    rendered.push(base);
  });
  entry.chart.setOption(
    {
      animation: false,
      useUTC: true,
      aria: { enabled: false },
      grid,
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "line" },
        formatter: (params) => {
          const p = Array.isArray(params) ? params[0] : params;
          if (!p) return "";
          const date = nearestDate(entry, Number(p.axisValue ?? p.value?.[0])),
            items = series
              .map((s) => ({
                s,
                d: s.data.find((d) => d.date === date && finite(d.value)),
              }))
              .filter((o) => o.d);
          return (
            (opt.tooltip
              ? opt.tooltip(date, items)
              : "<b>" +
                date +
                "</b>" +
                items
                  .map(
                    (o) =>
                      "<br>" +
                      esc(o.s.name) +
                      " " +
                      fmt(o.d.value) +
                      (opt.unit || ""),
                  )
                  .join("")) +
            "<br><small>Click to link · drag to filter</small>"
          );
        },
      },
      xAxis: {
        type: "time",
        min: xmin,
        max: xmax,
        splitNumber: entry.host.clientWidth < 400 ? 3 : 5,
        axisLabel: {
          show: !sample,
          fontSize: 11,
          formatter: (value) =>
            id === "exposure" ? iso(value).slice(5) : iso(value).slice(0, 7),
          hideOverlap: true,
        },
        axisTick: { show: false },
        axisLine: { show: !sample },
        splitLine: { show: false },
        axisPointer: { label: { show: false } },
      },
      yAxis: {
        type: "value",
        min: ymin,
        max: ymax,
        splitNumber: 4,
        axisLabel: {
          show: !sample,
          fontSize: 11,
          formatter:
            opt.formatY ||
            ((value) => fmt(value, Math.abs(ymax - ymin) < 5 ? 1 : 0)),
        },
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: { show: !sample },
        axisPointer: { show: false },
      },
      series: rendered,
      graphic: [],
    },
    true,
  );
}
function highlight() {
  for (const entry of charts.values()) {
    if (!entry.domain || !entry.host.offsetParent) continue;
    const b = bounds(entry),
      t = state.focus && ts(state.focus),
      visible = t && t >= entry.domain[0] && t <= entry.domain[1];
    const x = visible ? entry.chart.convertToPixel({ xAxisIndex: 0 }, t) : 0;
    graphic(entry, "focus-date", {
      type: "line",
      silent: true,
      z: 60,
      invisible: !visible,
      shape: { x1: x, x2: x, y1: b.top, y2: b.bottom },
      style: { stroke: C.ink, lineWidth: 1.2, lineDash: [4, 4], opacity: 0.65 },
    });
  }
}
function renderKpis() {
  const q = qdata(),
    h = supplyData(),
    a = adoptData(),
    t = talentData();
  const cards = [
    [
      "Proprietary evaluation share",
      q.length ? fmt(q.at(-1).proprietary_share_pct) + "%" : "—",
      changeText(q, "proprietary_share_pct"),
      period(q),
    ],
    [
      "New HF repositories",
      h.length ? fmt(sum(h.map((r) => r.created_models)), 0) : "—",
      h.length
        ? "Selected " + h.length + " quarters combined"
        : "No supply data",
      h.length ? h[0].quarter + " — " + h.at(-1).quarter : "No data in range",
    ],
    [
      "US business AI adoption",
      a.length ? fmt(a.at(-1).adoption * 100, 1) + "%" : "—",
      changeText(
        a.map((r) => ({ ...r, value: r.adoption * 100 })),
        "value",
      ),
      period(a),
    ],
    [
      "Talent netflow · " + names[state.country],
      t.length ? fmt(t.at(-1).netflow) : "—",
      changeText(t, "netflow", "units"),
      period(t),
    ],
  ];
  $("kpis").innerHTML = cards
    .map(
      (c) =>
        '<div class="kpi"><div class="label">' +
        esc(c[0]) +
        '</div><div class="value">' +
        esc(c[1]) +
        '</div><div class="delta">' +
        esc(c[2]) +
        '</div><div class="period">' +
        esc(c[3]) +
        "</div></div>",
    )
    .join("");
}
function renderQuarter() {
  const q = qdata(),
    h = supplyData();
  $("fixed-legend").style.display = state.fixed ? "" : "none";
  const allDates = [...q.map((r) => ts(r.date)), ...h.map((r) => ts(r.date))],
    domain = allDates.length
      ? [Math.min(...allDates) - 25 * DAY, Math.max(...allDates) + 25 * DAY]
      : undefined;
  const series = [
    {
      name: "Proprietary share",
      color: C.closed,
      data: q.map((r) => ({ ...r, value: r.proprietary_share_pct })),
    },
  ];
  if (state.fixed)
    series.push({
      name: "Fixed 61 models",
      color: C.unknown,
      dash: "dashed",
      data: q.map((r) => ({ ...r, value: r.fixed_set_share_pct })),
    });
  makeChart("votes", series, {
    domain,
    ymin: 0,
    ymax: 100,
    unit: "%",
    label: "Proprietary recorded-evaluation share",
    tooltip: (date, items) => {
      const r = q.find((r) => r.date === date);
      return (
        "<b>" +
        r.quarter +
        " · Snapshot: " +
        date +
        "</b><br>Models: " +
        r.n_models +
        items
          .map((o) => "<br>" + esc(o.s.name) + ": " + fmt(o.d.value) + "%")
          .join("")
      );
    },
  });
  makeChart(
    "supply",
    [
      {
        name: "New model repositories",
        color: C.supply,
        data: h.map((r) => ({ ...r, value: r.created_models })),
      },
    ],
    {
      domain,
      bar: true,
      label: "New Hugging Face model repositories per quarter",
      formatY: (v) => fmt(v / 1000, 0) + "k",
      tooltip: (date, items) => {
        const r = items[0].d;
        return (
          "<b>" +
          r.quarter +
          "</b><br>New model repositories: " +
          fmt(r.value, 0) +
          "<br>Full-quarter count"
        );
      },
    },
  );
}
function renderModels() {
  const term = $("model-search").value.toLowerCase();
  $("model-list").innerHTML = D.models
    .map((n, i) => ({ n, i }))
    .filter((o) => o.n.toLowerCase().includes(term))
    .map(
      (o) =>
        '<label><input type="checkbox" data-model="' +
        o.i +
        '" ' +
        (state.selected.includes(o.i) ? "checked" : "") +
        ">" +
        esc(o.n) +
        "</label>",
    )
    .join("");
  $("model-summary").textContent =
    "Models (" + state.selected.length + " / 8 selected)";
  $("model-legend").innerHTML = state.selected
    .map(
      (i, k) =>
        '<span title="' +
        esc(D.models[i]) +
        '"><i class="dot" style="background:' +
        modelColor(i) +
        '"></i>' +
        esc(short(D.models[i])) +
        "</span>",
    )
    .join("");
}
function renderExposure() {
  const w = weeks(),
    orgs = {};
  const ss = state.selected.map((i) => {
    const observed = D.weeks.filter((r) => r.counts[i] > 0),
      first = observed[0]?.date,
      last = observed.at(-1)?.date,
      org = modelOrg(D.models[i]),
      variant = orgs[org] || 0;
    orgs[org] = variant + 1;
    return {
      name: short(D.models[i]),
      color: modelColor(i),
      dash: ["solid", "dashed", "dotted"][variant % 3],
      symbol: ["circle", "diamond", "triangle"][variant % 3],
      data: w.map((r) => ({
        ...r,
        value:
          r.date < first || r.date > last
            ? null
            : (r.counts[i] / r.total) * 100,
      })),
    };
  });
  const domain = w.length
    ? [ts(w[0].date) - 2 * DAY, ts(w.at(-1).date) + 5 * DAY]
    : undefined;
  makeChart("exposure", ss, {
    domain,
    unit: "%",
    label: "Weekly model appearance share",
    empty: w.length
      ? "Select a model to compare"
      : "No battles in range (2025-04—07)",
    shades: w.filter((r) => r.partial),
    tooltip: (date, items) => {
      const r = w.find((r) => r.date === date);
      return (
        "<b>Week of " +
        date +
        " — " +
        r.end +
        "</b><br>Observed: " +
        r.observed_start +
        " — " +
        r.observed_end +
        "<br>Battles: " +
        fmt(r.battles, 0) +
        "; appearances: " +
        fmt(r.total, 0) +
        items
          .map((o) => "<br>" + esc(o.s.name) + ": " + fmt(o.d.value) + "%")
          .join("")
      );
    },
  });
  makeChart(
    "samples",
    [
      {
        name: "Battles",
        color: C.unknown,
        data: w.map((r) => ({ ...r, value: r.battles })),
      },
    ],
    {
      domain,
      bar: true,
      label: "Weekly battle sample counts",
      formatY: (v) => fmt(v / 1000, 0) + "k",
      tooltip: (date, items) => {
        const r = items[0].d;
        return (
          "<b>Week of " +
          date +
          "</b><br>Battles: " +
          fmt(r.battles, 0) +
          "<br>Both bad: " +
          fmt((r.bad / r.battles) * 100) +
          "%" +
          (r.partial ? "<br>Incomplete week" : "")
        );
      },
    },
  );
  const total = sum(w.map((r) => r.total)),
    bad = sum(w.map((r) => r.bad));
  $("weekly-bad").textContent = total
    ? "Both bad: " + fmt((bad / (total / 2)) * 100) + "%"
    : "";
}
function renderTalent() {
  const t = talentData();
  $("talent-title").textContent = names[state.country] + " · monthly";
  makeChart(
    "talent",
    [
      {
        name: "Netflow",
        color: C.blue,
        data: t.map((r) => ({ ...r, value: r.netflow })),
      },
    ],
    {
      monthly: true,
      label: names[state.country] + " monthly talent netflow",
      tooltip: (date, items) =>
        "<b>" +
        esc(names[state.country]) +
        " · " +
        date.slice(0, 7) +
        "</b><br>Netflow: " +
        fmt(items[0].d.value),
    },
  );
  renderCountries();
}
function chooseCountry(code) {
  state.country = code;
  $("country").value = code;
  renderTalent();
  renderKpis();
  renderFocus();
  window.Ch4Layout?.sync(state);
  highlight();
  announce("Selected " + names[code]);
}
function renderCountries() {
  const available = D.talent.filter((r) => within(r.date)),
    target = state.focus
      ? state.focus.slice(0, 7) + "-01"
      : available
          .map((r) => r.date)
          .sort()
          .at(-1),
    rows = available
      .filter((r) => r.date === target)
      .sort((a, b) => b.netflow - a.netflow);
  $("snapshot-date").textContent = target ? target.slice(0, 7) : "—";
  if (!rows.length) {
    emptyChart("countries", "No country snapshot for this month");
    return;
  }
  const list = rows.slice(0, 8),
    selected = rows.find((r) => r.country_code === state.country);
  if (selected && !list.includes(selected)) list.push(selected);
  const entry = chartEntry("countries");
  if (!entry) return;
  entry.domain = null;
  entry.rows = list;
  entry.keyboard = Math.max(
    0,
    list.findIndex((r) => r.country_code === state.country),
  );
  const shortCountry = (r) =>
    ({ US: "US", GB: "UK", AE: "UAE", SA: "Saudi Arabia", KR: "S. Korea" })[
      r.country_code
    ] || r.country;
  entry.host.tabIndex = 0;
  entry.host.setAttribute("role", "group");
  entry.host.setAttribute(
    "aria-label",
    "Country talent-netflow ranking for " +
      target +
      ". Top eight countries plus the selected country. Up and down arrows inspect countries; Enter selects one.",
  );
  entry.chart.setOption(
    {
      animation: false,
      aria: { enabled: false },
      grid: { left: 82, right: 36, top: 8, bottom: 22 },
      tooltip: {
        trigger: "item",
        formatter: (p) =>
          "<b>" +
          esc(p.data.record.country) +
          "</b><br>" +
          target.slice(0, 7) +
          " · " +
          fmt(p.value) +
          "<br>Click to select country",
      },
      xAxis: {
        type: "value",
        splitNumber: 3,
        axisLabel: { fontSize: 11, hideOverlap: true },
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: { show: true },
      },
      yAxis: {
        type: "category",
        inverse: true,
        data: list.map(shortCountry),
        axisLabel: { fontSize: 11, width: 75, overflow: "truncate" },
        axisLine: { show: false },
        axisTick: { show: false },
      },
      series: [
        {
          type: "bar",
          barMaxWidth: 12,
          data: list.map((r) => ({
            value: r.netflow,
            record: r,
            itemStyle: {
              color: r.country_code === state.country ? C.blue : C.unknown,
            },
            label: {
              show: true,
              position: r.netflow < 0 ? "left" : "right",
              fontSize: 11,
              color: C.ink,
              formatter: (p) => fmt(p.value, 1),
            },
          })),
        },
      ],
      graphic: [],
    },
    true,
  );
  entry.chart.off("click");
  entry.chart.on("click", (p) => {
    if (p.data?.record) chooseCountry(p.data.record.country_code);
  });
  entry.host.onkeydown = (e) => {
    if (!["ArrowUp", "ArrowDown", "Enter"].includes(e.key)) return;
    e.preventDefault();
    if (e.key === "Enter") {
      chooseCountry(entry.rows[entry.keyboard].country_code);
      return;
    }
    entry.chart.dispatchAction({ type: "downplay" });
    entry.keyboard = Math.max(
      0,
      Math.min(
        entry.rows.length - 1,
        entry.keyboard + (e.key === "ArrowDown" ? 1 : -1),
      ),
    );
    entry.chart.dispatchAction({
      type: "highlight",
      seriesIndex: 0,
      dataIndex: entry.keyboard,
    });
    entry.chart.dispatchAction({
      type: "showTip",
      seriesIndex: 0,
      dataIndex: entry.keyboard,
    });
    const r = entry.rows[entry.keyboard];
    announce(
      r.country + ": " + fmt(r.netflow) + ". Enter to select this country.",
    );
  };
}
function renderAdoption() {
  const a = adoptData(),
    events = D.events.filter((r) => within(r.date));
  makeChart(
    "adoption",
    [
      {
        name: "Adoption",
        color: C.adoption,
        band: state.ci,
        data: a.map((r) => ({
          ...r,
          value: r.adoption * 100,
          lo: state.ci ? r.lo * 100 : null,
          hi: state.ci ? r.hi * 100 : null,
        })),
      },
    ],
    {
      events: state.events ? events : [],
      unit: "%",
      label: "U.S. business AI adoption",
      tooltip: (date, items) => {
        const r = items[0].d;
        return (
          "<b>Reference period: " +
          r.date +
          " — " +
          r.ref_end +
          "</b><br>Adoption: " +
          fmt(r.value, 1) +
          "%<br>SE: " +
          fmt(r.se * 100) +
          " pp<br>90% interval: " +
          fmt(r.lo ?? r.adoption * 100 - r.se * 164.5) +
          "% — " +
          fmt(r.hi ?? r.adoption * 100 + r.se * 164.5) +
          "%"
        );
      },
    },
  );
  $("events-list").innerHTML = state.events
    ? "<b>Selected events</b>" +
      events
        .map(
          (r) =>
            '<button data-event="' +
            r.date +
            '">' +
            esc(r.model) +
            "<small>" +
            r.date +
            " · " +
            esc(r.org) +
            "</small></button>",
        )
        .join("") +
      (events.length ? "" : "<span>No selected events in range</span>")
    : "<b>Business adoption</b><span>Enable events for date markers.</span>";
}
function nearest(arr, date) {
  return arr.length
    ? arr.reduce((a, b) =>
        Math.abs(ts(a.date) - ts(date)) <= Math.abs(ts(b.date) - ts(date))
          ? a
          : b,
      )
    : null;
}
function renderFocus() {
  $("focusbox").classList.toggle("on", !!state.focus);
  if (!state.focus) return;
  $("focus-title").textContent =
    "Focus: " + state.focus + " · nearest observed dates";
  const f = state.focus;
  function pick(arr, label, key, unit) {
    if (
      !arr.length ||
      f < arr[0].date ||
      f > (arr.at(-1).ref_end || arr.at(-1).end || arr.at(-1).date)
    )
      return (
        "<div>" +
        esc(label) +
        "<strong>Outside coverage</strong><small>No observation</small></div>"
      );
    const r = nearest(arr, f);
    return (
      "<div>" +
      esc(label) +
      "<strong>" +
      fmt(key(r)) +
      unit +
      "</strong><small>Observed: " +
      r.date +
      "</small></div>"
    );
  }
  $("focus-values").innerHTML =
    pick(qdata(), "Proprietary share", (r) => r.proprietary_share_pct, "%") +
    pick(weeks(), "Weekly battles", (r) => r.battles, " ") +
    pick(
      talentData(),
      names[state.country] + " netflow",
      (r) => r.netflow,
      "",
    ) +
    pick(adoptData(), "US business adoption", (r) => r.adoption * 100, "%");
}
function setFocus(date) {
  state.focus = date;
  renderFocus();
  renderCountries();
  highlight();
  window.Ch4Layout?.sync(state);
}
function render() {
  renderKpis();
  renderQuarter();
  renderModels();
  renderExposure();
  renderTalent();
  renderAdoption();
  renderFocus();
  highlight();
  window.Ch4Layout?.sync(state);
}
function setRange(a, b) {
  if (!a || !b || a > b) {
    toast("Start date must precede end date");
    $("start").value = state.start;
    $("end").value = state.end;
    return;
  }
  state.start = a;
  state.end = b;
  state.focus = null;
  $("start").value = a;
  $("end").value = b;
  document
    .querySelectorAll(".preset")
    .forEach((e) =>
      e.classList.toggle(
        "active",
        (e.dataset.range === "common" &&
          a === "2024-01-01" &&
          b === "2025-12-31") ||
          (e.dataset.range === "all" &&
            a === "2023-01-01" &&
            b === "2026-09-30") ||
          (e.dataset.range === "battle" &&
            a === "2025-04-14" &&
            b === "2025-07-27"),
      ),
    );
  render();
}
function exportSelection() {
  const rows = [
    ["dataset", "date", "entity", "metric", "value", "unit", "detail"],
  ];
  qdata().forEach((r) => {
    rows.push([
      "Arena",
      r.date,
      r.quarter,
      "proprietary_share",
      r.proprietary_share_pct,
      "percent",
      "overall snapshot",
    ]);
    if (state.fixed && finite(r.fixed_set_share_pct))
      rows.push([
        "Arena",
        r.date,
        r.quarter,
        "fixed_61_share",
        r.fixed_set_share_pct,
        "percent",
        "fixed set",
      ]);
  });
  supplyData().forEach((r) =>
    rows.push([
      "HF",
      r.date,
      r.quarter,
      "created_models",
      r.created_models,
      "repos",
      "whole quarter",
    ]),
  );
  weeks().forEach((r) => {
    rows.push([
      "Arena140k",
      r.date,
      "all models",
      "battles",
      r.battles,
      "battles",
      "partial_week=" + r.partial,
    ]);
    rows.push([
      "Arena140k",
      r.date,
      "all models",
      "both_bad",
      r.bad,
      "battles",
      r.observed_start + " / " + r.observed_end,
    ]);
    state.selected.forEach((i) =>
      rows.push([
        "Arena140k",
        r.date,
        D.models[i],
        "appearances",
        r.counts[i],
        "appearances",
        "weekly_denominator=" + r.total,
      ]),
    );
  });
  talentData().forEach((r) =>
    rows.push([
      "Talent",
      r.date,
      r.country,
      "netflow",
      r.netflow,
      "source indicator",
      "monthly",
    ]),
  );
  adoptData().forEach((r) => {
    rows.push([
      "BTOS",
      r.date,
      "US",
      "adoption",
      r.adoption * 100,
      "percent",
      "ref_end=" + r.ref_end,
    ]);
    rows.push([
      "BTOS",
      r.date,
      "US",
      "SE",
      r.se * 100,
      "percentage points",
      "",
    ]);
  });
  if (state.events)
    D.events
      .filter((r) => within(r.date))
      .forEach((r) =>
        rows.push([
          "Epoch",
          r.date,
          r.model,
          "Publication date",
          r.date,
          "date",
          r.org,
        ]),
      );
  const csv =
      "\ufeff" +
      rows
        .map((r) =>
          r.map((v) => '"' + String(v).replace(/"/g, '""') + '"').join(","),
        )
        .join("\r\n"),
    url = URL.createObjectURL(
      new Blob([csv], { type: "text/csv;charset=utf-8" }),
    ),
    a = document.createElement("a");
  a.href = url;
  a.download = "Ch4_" + state.start + "_" + state.end + ".csv";
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  toast("Current selection exported");
}
function boot() {
  document.querySelector('[data-semantic="closed"]').style.background =
    C.closed;
  document.querySelector('[data-semantic="unknown"]').style.background =
    C.unknown;
  $("country").innerHTML = countries
    .map((r) => '<option value="' + r.code + '">' + esc(r.name) + "</option>")
    .join("");
  $("country").value = state.country;
  for (const id of ["start", "end"])
    $(id).addEventListener("change", () =>
      setRange($("start").value, $("end").value),
    );
  document
    .querySelectorAll(".preset")
    .forEach((e) =>
      e.addEventListener("click", () =>
        setRange(
          ...{
            common: ["2024-01-01", "2025-12-31"],
            all: ["2023-01-01", "2026-09-30"],
            battle: ["2025-04-14", "2025-07-27"],
          }[e.dataset.range],
        ),
      ),
    );
  for (const id of ["fixed", "complete", "ci", "events"])
    $(id).addEventListener("change", () => {
      state[id] = $(id).checked;
      render();
    });
  $("country").addEventListener("change", () => {
    state.country = $("country").value;
    render();
  });
  $("model-search").addEventListener("input", renderModels);
  $("model-list").addEventListener("change", (e) => {
    if (!e.target.matches("[data-model]")) return;
    const i = +e.target.dataset.model;
    if (e.target.checked) {
      if (state.selected.length >= 8) {
        e.target.checked = false;
        toast("Select up to 8 models");
        return;
      }
      state.selected.push(i);
    } else state.selected = state.selected.filter((v) => v !== i);
    render();
  });
  $("top5").addEventListener("click", () => {
    state.selected = [0, 1, 2, 3, 4];
    $("model-search").value = "";
    render();
  });
  $("clear-models").addEventListener("click", () => {
    state.selected = [];
    render();
  });
  $("clearfocus").addEventListener("click", () => {
    state.focus = null;
    renderFocus();
    renderCountries();
    highlight();
    window.Ch4Layout?.sync(state);
  });
  $("events-list").addEventListener("click", (e) => {
    const b = e.target.closest("[data-event]");
    if (b) setFocus(b.dataset.event);
  });
  $("reset").addEventListener("click", () => {
    Object.assign(state, {
      selected: [0, 1, 2, 3, 4],
      country: "US",
      complete: false,
      fixed: true,
      ci: true,
      events: true,
    });
    for (const id of ["fixed", "complete", "ci", "events"])
      $(id).checked = state[id];
    $("country").value = "US";
    $("model-search").value = "";
    setRange("2024-01-01", "2025-12-31");
  });
  $("fullscreen").addEventListener("click", () => {
    if (window.parent === window) location.assign('/explore/ch4/');
    else window.ReportEmbed?.requestFullscreen();
  });
  $("export").addEventListener("click", exportSelection);
  document.querySelectorAll("[data-tab]").forEach((b) =>
    b.addEventListener("click", () => {
      document.querySelectorAll("[data-tab]").forEach((x) => {
        x.classList.toggle("active", x === b);
        x.setAttribute("aria-pressed", String(x === b));
      });
      document
        .querySelectorAll(".card")
        .forEach((x, i) =>
          x.classList.toggle("selected", i === +b.dataset.tab),
        );
      document.querySelector(".modelpicker").open = false;
      render();
    }),
  );
  document.addEventListener("click", (e) => {
    if (!e.target.closest(".modelpicker"))
      document.querySelector(".modelpicker").open = false;
  });
  let resizeTimer;
  addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(render, 180);
  });
  render();
  window.DSH_CH4 = { setRange, setFocus, chooseCountry, getState: () => ({ ...state, selected: [...state.selected] }) };
  window.Ch4Layout?.connect();
}
boot();
