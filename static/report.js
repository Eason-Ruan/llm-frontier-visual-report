const RC = window.ReportCharts;
const C = RC.colors;
const esc = echarts.format.encodeHTML;

function draw(id, option) {
  const chart = RC.init(document.getElementById(id));
  chart.setOption({ animation: false, useUTC: true, ...option }, true);
  return chart;
}

const legend = { bottom: 1, type: "scroll", left: 5, right: 5 };
const grid = { top: 16, left: 8, right: 20, bottom: 39, containLabel: true };
const percentAxis = { type: "value", axisLabel: { formatter: "{value}%" } };

function drawCh1(data) {
  const complete = data.filter((d) => d.n50 >= 50);
  const rows = complete.map((d) => ({
    value: [d.month + "-01", (100 * d.open50) / d.n50],
    record: d,
  }));
  draw("chart-ch1-line", {
    tooltip: {
      trigger: "item",
      formatter: (p) => {
        const d = p.data.record;
        return `${d.month}<br>Open-weight ${d.open50}/${d.n50} · ${p.value[1].toFixed(1)}%`;
      },
    },
    grid,
    legend,
    xAxis: { type: "time" },
    yAxis: { ...percentAxis, min: 0, max: 100 },
    series: [
      {
        name: "Open-weight",
        type: "line",
        data: rows,
        showSymbol: false,
        lineStyle: { color: C.open },
        itemStyle: { color: C.open },
        areaStyle: { color: C.open, opacity: 0.09 },
        markPoint: {
          symbol: "circle",
          symbolSize: 6,
          label: { position: "top", color: C.ink },
          data: [rows[0], rows.at(-1)].map((d) => ({
            coord: d.value,
            value: d.value[1].toFixed(0) + "%",
          })),
        },
      },
    ],
  });
  drawFrontierGap(data);
}

function drawFrontierGap(data) {
  const rows = data.filter(d => d.month >= '2023-12');
  const valid = rows.filter(d => d.frontier_gap !== null);
  const first = valid[0], last = valid.at(-1);
  const trough = valid.reduce((a, b) => a.frontier_gap < b.frontier_gap ? a : b);
  const signed = value => (value > 0 ? '+' : '') + value;
  draw('chart-ch1-gap', {
    grid, legend,
    tooltip: {trigger: 'axis', valueFormatter: value => signed(value) + ' ranks'},
    xAxis: {type: 'time'},
    yAxis: {type: 'value', min: -5, max: 20, interval: 5, axisLabel: {formatter: signed}},
    series: [{name: 'Rank gap', type: 'line', connectNulls: false,
      data: rows.map(d => [d.month + '-01', d.frontier_gap]),
      itemStyle: {color: C.purple}, lineStyle: {color: C.purple},
      areaStyle: {color: C.purple, opacity: 0.10},
      markLine: {silent: true, symbol: 'none', label: {show: false},
        lineStyle: {color: C.unknown, type: 'solid'}, data: [{yAxis: 0}]},
      markPoint: {symbol: 'circle', symbolSize: 6, label: {position: 'top', color: C.ink},
        data: [first, trough, last].map(d => ({coord: [d.month + '-01', d.frontier_gap], value: signed(d.frontier_gap)}))},
    }],
  });
}

function drawCh2(data) {
  const names = [...new Set(data.map((d) => d.name))];
  draw("chart-ch2-line", {
    grid,
    legend,
    tooltip: {
      trigger: "axis",
      valueFormatter: (v) => "$" + Number(v).toLocaleString("en-US") + "B",
    },
    xAxis: { type: "time" },
    yAxis: {
      type: "value",
      axisLabel: {
        formatter: (v) => (v >= 1000 ? "$" + v / 1000 + "T" : "$" + v + "B"),
      },
    },
    series: names.map((name) => ({
      name: name.replace("Alphabet / Google", "Google"),
      type: "line",
      data: data.filter((d) => d.name === name).map((d) => [d.date, d.value]),
      showSymbol: false,
      itemStyle: { color: RC.orgColor(name) },
      lineStyle: { color: RC.orgColor(name) },
    })),
  });
}

async function drawCh2Labs() {
  const response = await fetch('/static/data/ch2_lab_revenue.json');
  if (!response.ok) throw new Error('Could not load lab revenue run rates');
  const {rows} = await response.json();
  const names = [...new Set(rows.map(d => d.name))];
  draw('chart-ch2-labs', {
    grid, legend,
    tooltip: {trigger: 'item', formatter: p => `${esc(p.seriesName)}<br>${p.value[0]} · $${p.value[1]}B annualized`},
    xAxis: {type: 'time', min: '2023-01-01T00:00:00Z', max: '2026-04-01T00:00:00Z'},
    yAxis: {type: 'value', min: 0, max: 30, axisLabel: {formatter: value => '$' + value + 'B'}},
    series: names.map(name => ({name, type: 'line', connectNulls: false,
      data: rows.filter(d => d.name === name).sort((a, b) => a.date.localeCompare(b.date)).map(d => [d.date, d.value]),
      itemStyle: {color: RC.orgColor(name)}, lineStyle: {color: RC.orgColor(name)},
    })),
  });
}

async function drawCh3Cost() {
  const response = await fetch("/dashboard/ch3/api/observations/cost");
  if (!response.ok) throw new Error("Could not load training costs");
  draw("chart-ch3-scatter", Chapter3Charts.cost(await response.json()));
}

function drawCh3Academic(rows) {
  const years = [2023, 2024, 2025];
  const groups = [
    ["Industry", C.industry],
    ["Industry-academia collaboration", C.purple],
    ["Academia", C.academia],
    ["Other", C.unknown],
  ];
  draw("chart-ch3-bars", {
    grid,
    legend,
    xAxis: { type: "category", data: years },
    yAxis: { ...percentAxis, max: 100 },
    tooltip: { trigger: "axis", valueFormatter: (v) => v.toFixed(1) + "%" },
    series: groups.map(([name, color]) => ({
      name,
      type: "bar",
      stack: "sector",
      itemStyle: { color },
      data: years.map(
        (year) =>
          rows.find((d) => d.year === year && d.label === name)?.value ?? null,
      ),
    })),
  });
}

function drawCh4(quarters, adoption) {
  const common = quarters.filter((d) => d.supply !== null);
  draw("chart-ch4-dual", {
    tooltip: { trigger: "axis" },
    axisPointer: { link: [{ xAxisIndex: "all" }] },
    title: [
      {
        text: "Proprietary recorded-evaluation share",
        left: 5,
        top: 0,
        textStyle: { fontSize: 11 },
      },
      {
        text: "New HF repositories per quarter",
        left: 5,
        top: "50%",
        textStyle: { fontSize: 11 },
      },
    ],
    grid: [
      { left: 48, right: 20, top: "10%", height: "28%" },
      { left: 48, right: 20, top: "61%", height: "27%" },
    ],
    xAxis: [
      {
        type: "category",
        data: common.map((d) => d.quarter),
        gridIndex: 0,
        axisLabel: { show: false },
      },
      { type: "category", data: common.map((d) => d.quarter), gridIndex: 1 },
    ],
    yAxis: [
      { ...percentAxis, gridIndex: 0, min: 45, max: 65 },
      {
        type: "value",
        gridIndex: 1,
        axisLabel: { formatter: (v) => v / 1000 + "k" },
      },
    ],
    series: [
      {
        name: "Proprietary share",
        type: "line",
        data: common.map((d) => d.share),
        xAxisIndex: 0,
        yAxisIndex: 0,
        itemStyle: { color: C.closed },
        lineStyle: { color: C.closed },
        tooltip: { valueFormatter: (v) => v.toFixed(2) + "%" },
      },
      {
        name: "New HF repositories",
        type: "line",
        data: common.map((d) => d.supply),
        xAxisIndex: 1,
        yAxisIndex: 1,
        itemStyle: { color: C.supply },
        lineStyle: { color: C.supply },
        tooltip: {
          valueFormatter: (v) => v.toLocaleString("en-US") + " repositories",
        },
      },
    ],
  });
  draw("chart-ch4-adoption", {
    grid,
    legend,
    tooltip: {
      trigger: "axis",
      valueFormatter: (v) => Number(v).toFixed(1) + "%",
    },
    xAxis: { type: "time" },
    yAxis: { ...percentAxis, min: 0, max: 12 },
    series: [
      {
        name: "Broad AI adoption among U.S. businesses",
        type: "line",
        showSymbol: false,
        data: adoption.map((d) => [d.date, d.value]),
        itemStyle: { color: C.adoption },
        lineStyle: { color: C.adoption },
        areaStyle: { color: C.adoption, opacity: 0.09 },
        markPoint: {
          symbol: "circle",
          symbolSize: 6,
          label: { position: "top", color: C.ink },
          data: [adoption[0], adoption.at(-1)].map((d) => ({
            coord: [d.date, d.value],
            value: d.value.toFixed(1) + "%",
          })),
        },
      },
    ],
  });
}

async function boot() {
  try {
    const response = await fetch("/api/report-data");
    if (!response.ok) throw new Error("Could not load report data");
    const data = await response.json();
    drawCh1(data.ch1);
    drawCh2(data.ch2);
    await drawCh2Labs();
    drawCh3Academic(data.ch3_academic);
    drawCh4(data.ch4_share_supply, data.ch4_adoption);
    await drawCh3Cost();
  } catch (err) {
    console.error(err);
    for (const box of document.querySelectorAll(".chart")) {
      if (!echarts.getInstanceByDom(box)) box.textContent = err.message;
    }
  }
}
boot();

const links = [...document.querySelectorAll(".rail > a")];
const observer = new IntersectionObserver(
  (entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting)
        links.forEach((a) =>
          a.classList.toggle("active", a.hash === "#" + entry.target.id),
        );
    }
  },
  { rootMargin: "-18% 0px -65% 0px" },
);
document
  .querySelectorAll(".chapter")
  .forEach((chapter) => observer.observe(chapter));
