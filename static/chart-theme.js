// Shared visual encodings for the narrative figures and chapter dashboards.
(() => {
  const font =
    'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  const colors = Object.freeze({
    ink: "#203b37",
    muted: "#536b65",
    grid: "#e3eae6",
    axis: "#a9bab1",
    teal: "#257f70",
    blue: "#477897",
    gold: "#aa7b26",
    purple: "#806c9f",
    open: "#26846c",
    closed: "#bd6250",
    unknown: "#84928d",
    permissive: "#176d59",
    restricted: "#85bfaa",
    industry: "#bd6250",
    academia: "#477897",
    supply: "#6b94ad",
    adoption: "#257f70",
  });
  const organizations = {
    openai: "#257f70",
    google: "#487b9f",
    anthropic: "#b75e4c",
    meta: "#558651",
    alibaba: "#a27825",
    deepseek: "#806699",
    xai: "#42576b",
    microsoft: "#436c80",
    amazon: "#8c6249",
    nvidia: "#83913e",
    mistral: "#bd7f45",
    cohere: "#637aa0",
    zai: "#946680",
    ai2: "#4d8985",
    moonshot: "#786a9b",
    "01ai": "#987658",
    minimax: "#9b7558",
    huggingface: "#96882f",
    lmsys: "#536e7e",
    tsinghua: "#746c91",
    berkeley: "#646f9a",
    nous: "#936b87",
    reka: "#927665",
    stepfun: "#54839a",
    databricks: "#aa6d57",
    eleutherai: "#608654",
    mosaicml: "#538484",
  };
  const aliases = {
    alphabetgoogle: "google",
    googl: "google",
    goog: "google",
    alphabet: "google",
    alibabaqwen: "alibaba",
    qwen: "alibaba",
    amzn: "amazon",
    nvda: "nvidia",
    msft: "microsoft",
    allenai: "ai2",
    mistralai: "mistral",
    nousresearch: "nous",
    ucberkeley: "berkeley",
    rekaai: "reka",
    moonshotai: "moonshot",
  };
  function orgColor(name) {
    const key = String(name)
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");
    return organizations[aliases[key] || key] || colors.unknown;
  }

  const axis = {
    axisLine: { lineStyle: { color: colors.axis } },
    axisTick: { show: false },
    axisLabel: { color: colors.muted, fontSize: 11, hideOverlap: true },
    nameTextStyle: { color: colors.muted, fontSize: 11 },
    splitLine: { lineStyle: { color: colors.grid } },
  };
  echarts.registerTheme("group-report", {
    color: [
      colors.teal,
      colors.blue,
      colors.closed,
      colors.gold,
      colors.purple,
      colors.unknown,
    ],
    textStyle: { fontFamily: font, color: colors.ink, fontSize: 12 },
    title: {
      textStyle: { fontSize: 14, fontWeight: 600, color: colors.ink },
      subtextStyle: { color: colors.muted, fontSize: 11 },
    },
    legend: {
      textStyle: { color: colors.muted, fontSize: 11 },
      itemWidth: 14,
      itemHeight: 8,
    },
    tooltip: {
      confine: true,
      borderColor: colors.axis,
      padding: [8, 11],
      textStyle: { color: colors.ink, fontFamily: font, fontSize: 12 },
    },
    categoryAxis: axis,
    valueAxis: axis,
    logAxis: axis,
    timeAxis: axis,
    line: { symbolSize: 5, lineStyle: { width: 2 } },
    aria: { enabled: true },
  });
  const observer = new ResizeObserver((entries) => {
    for (const { target, contentRect } of entries) {
      const chart = echarts.getInstanceByDom(target);
      if (!chart) observer.unobserve(target);
      else if (
        contentRect.width &&
        contentRect.height &&
        (chart.getWidth() !== Math.round(contentRect.width) ||
          chart.getHeight() !== Math.round(contentRect.height))
      )
        chart.resize();
    }
  });
  function init(element) {
    const chart =
      echarts.getInstanceByDom(element) ||
      echarts.init(element, "group-report");
    observer.observe(element);
    return chart;
  }
  window.ReportCharts = Object.freeze({ colors, font, init, orgColor });
})();
