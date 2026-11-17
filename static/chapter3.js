(() => {
  const charts = new Map();
  const filter = document.getElementById("filter-type");
  let costRequest = 0;
  function render(id, option) {
    const element = document.getElementById(id);
    const chart = ReportCharts.init(element);
    charts.set(id, { chart, option });
    const zoom = [
      {
        type: "inside",
        xAxisIndex: 0,
        zoomOnMouseWheel: "ctrl",
        moveOnMouseMove: false,
      },
      {
        type: "inside",
        yAxisIndex: 0,
        zoomOnMouseWheel: "ctrl",
        moveOnMouseMove: false,
      },
    ];
    chart.setOption(
      {
        ...option,
        dataZoom: zoom,
        toolbox: {
          right: 5,
          top: 0,
          itemSize: 12,
          feature: {
            dataZoom: { title: { zoom: "Box zoom", back: "Previous view" } },
            restore: { title: "Reset view" },
          },
        },
      },
      true,
    );
    chart.off("restore");
    chart.on("restore", () =>
      chart.dispatchAction({
        type: "takeGlobalCursor",
        key: "dataZoomSelect",
        dataZoomSelectActive: true,
      }),
    );
    chart.dispatchAction({
      type: "takeGlobalCursor",
      key: "dataZoomSelect",
      dataZoomSelectActive: true,
    });
    chart.getZr().off("dblclick");
    chart
      .getZr()
      .on("dblclick", () => chart.dispatchAction({ type: "restore" }));
  }
  async function request(path) {
    const response = await fetch(path);
    if (!response.ok)
      throw new Error("Could not load chart data (" + response.status + ")");
    return response.json();
  }
  function error(id, err) {
    document.getElementById(id).textContent = err.message;
  }
  async function updateCost() {
    const revision = ++costRequest;
    try {
      const data = await request(
        "api/observations/cost?filter=" + encodeURIComponent(filter.value),
      );
      if (revision === costRequest) render("chart1", Chapter3Charts.cost(data));
    } catch (err) {
      if (revision === costRequest) error("chart1", err);
    }
  }
  filter.addEventListener("change", updateCost);
  document.getElementById("reset-views").addEventListener("click", () => {
    for (const { chart } of charts.values())
      chart.dispatchAction({ type: "restore" });
  });
  updateCost();
  const exhibits = [
    ["chart2", "funding"],
    ["chart3a", "sector"],
    ["chart3b", "compute"],
    ["chart3c", "spending"],
  ];
  request("api/observations/exhibits")
    .then((data) => {
      for (const [id, key] of exhibits)
        render(id, Chapter3Charts[key](data[key]));
    })
    .catch((err) => {
      for (const [id] of exhibits) if (!charts.has(id)) error(id, err);
    });
})();
