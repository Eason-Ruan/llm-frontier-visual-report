"""Chapter 2: normalized Python data and an ECharts browser dashboard.

Mounted at /dashboard/ch2 by the report, or run standalone with uv.
Source parsing stays in dashboard_data; the API contains no chart-engine objects.
"""
from __future__ import annotations

import os
from pathlib import Path
from flask import Flask, jsonify, render_template, send_from_directory
from dashboard_data import ALL_ENTITIES, DATA, END_YEAR, GROUPS, START_YEAR

ROOT = Path(__file__).resolve().parent
REPORT_STATIC = ROOT.parents[1] / "static"
app = Flask(__name__, template_folder=str(ROOT / "templates"), static_folder=None)
app.json.ensure_ascii = False


def day(value):
    return value.strftime("%Y-%m-%d") if hasattr(value, "strftime") else str(value)


def build_payload():
    """Project original normalized rows, retaining dates, completeness and units."""
    return {
        "entities": ALL_ENTITIES, "groups": GROUPS,
        "startYear": START_YEAR, "endYear": END_YEAR,
        "marketCap": [
            {"org": r["Organization"], "date": day(r["Date"]), "year": int(r["Year"]),
             "value": float(r["Market cap (USD bn)"]), "shareDate": day(r["Share observation date"]),
             "sharesBn": float(r["Shares outstanding"]) / 1e9}
            for r in DATA["market_cap"].to_dict("records")],
        "publicRevenue": [
            {"org": r["Organization"], "year": int(r["Year"]), "value": float(r["Revenue (USD bn)"]),
             "start": day(r["Fiscal period start"]), "end": day(r["Fiscal period end"]), "filed": day(r["Filed"])}
            for r in DATA["public_revenue"].to_dict("records")],
        "labRevenue": [
            {"org": r["Organization"], "date": day(r["Date"]), "year": int(r["Year"]),
             "value": float(r["Revenue run rate (USD bn)"])}
            for r in DATA["lab_revenue"].to_dict("records")],
        "publications": [
            {"org": r["Organization"], "year": int(r["Year"]), "value": int(r["Value"]), "complete": bool(r["Complete"])}
            for r in DATA["publications"].to_dict("records")],
    }


PAYLOAD = build_payload()


@app.get("/")
def index():
    return render_template("index.html")


@app.get("/api/data")
def data():
    return jsonify(PAYLOAD)


@app.get("/assets/<path:filename>")
def assets(filename):
    return send_from_directory(ROOT / "assets", filename)


@app.get("/static/<path:filename>")
def shared_static(filename):
    """Use the report's same engine and theme in standalone mode."""
    return send_from_directory(REPORT_STATIC, filename)


if __name__ == "__main__":
    app.run(host="127.0.0.1", debug=False, port=int(os.environ.get("PORT", "8050")))
