"use client";
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Charts = Charts;
var chart_js_1 = require("chart.js");
var react_chartjs_2_1 = require("react-chartjs-2");
chart_js_1.Chart.register(chart_js_1.CategoryScale, chart_js_1.LinearScale, chart_js_1.PointElement, chart_js_1.LineElement, chart_js_1.Title, chart_js_1.Tooltip, chart_js_1.Legend);
function Charts(_a) {
    var traffic = _a.traffic, conversion = _a.conversion, sales = _a.sales, emailOpens = _a.emailOpens, emailClicks = _a.emailClicks, campaignSales = _a.campaignSales, discountRedemptions = _a.discountRedemptions, discountRedemptionsByCode = _a.discountRedemptionsByCode, aiCrawl = _a.aiCrawl;
    var colors = [
        "rgb(255, 99, 132)",
        "rgb(54, 162, 235)",
        "rgb(255, 205, 86)",
        "rgb(75, 192, 192)",
        "rgb(153, 102, 255)",
        "rgb(201, 203, 207)",
        "rgb(255, 159, 64)",
    ];
    return (<div className="space-y-8">
      <div>
        <h3 className="mb-2 font-semibold">Traffic</h3>
        <react_chartjs_2_1.Line data={{
            labels: traffic.labels,
            datasets: [
                {
                    label: "Page views",
                    data: traffic.data,
                    borderColor: "rgb(75, 192, 192)",
                },
            ],
        }}/>
      </div>
      <div>
        <h3 className="mb-2 font-semibold">Conversion %</h3>
        <react_chartjs_2_1.Line data={{
            labels: conversion.labels,
            datasets: [
                {
                    label: "Conversion",
                    data: conversion.data,
                    borderColor: "rgb(153, 102, 255)",
                },
            ],
        }}/>
      </div>
      <div>
        <h3 className="mb-2 font-semibold">Sales</h3>
        <react_chartjs_2_1.Line data={{
            labels: sales.labels,
            datasets: [
                {
                    label: "Sales",
                    data: sales.data,
                    borderColor: "rgb(255, 99, 132)",
                },
            ],
        }}/>
      </div>
      <div>
        <h3 className="mb-2 font-semibold">Email Opens</h3>
        <react_chartjs_2_1.Line data={{
            labels: emailOpens.labels,
            datasets: [
                {
                    label: "Email opens",
                    data: emailOpens.data,
                    borderColor: "rgb(54, 162, 235)",
                },
            ],
        }}/>
      </div>
      <div>
        <h3 className="mb-2 font-semibold">Email Clicks</h3>
        <react_chartjs_2_1.Line data={{
            labels: emailClicks.labels,
            datasets: [
                {
                    label: "Email clicks",
                    data: emailClicks.data,
                    borderColor: "rgb(255, 205, 86)",
                },
            ],
        }}/>
      </div>
      <div>
        <h3 className="mb-2 font-semibold">Campaign Sales</h3>
        <react_chartjs_2_1.Line data={{
            labels: campaignSales.labels,
            datasets: [
                {
                    label: "Campaign sales",
                    data: campaignSales.data,
                    borderColor: "rgb(255, 159, 64)",
                },
            ],
        }}/>
      </div>
      <div>
        <h3 className="mb-2 font-semibold">Discount Redemptions</h3>
        <react_chartjs_2_1.Line data={{
            labels: discountRedemptions.labels,
            datasets: [
                {
                    label: "Discount redemptions",
                    data: discountRedemptions.data,
                    borderColor: "rgb(201, 203, 207)",
                },
            ],
        }}/>
      </div>
      <div>
        <h3 className="mb-2 font-semibold">Redemptions by Code</h3>
        <react_chartjs_2_1.Line data={{
            labels: discountRedemptionsByCode.labels,
            datasets: discountRedemptionsByCode.datasets.map(function (d, i) { return ({
                label: d.label,
                data: d.data,
                borderColor: colors[i % colors.length],
            }); }),
        }}/>
      </div>
      <div>
        <h3 className="mb-2 font-semibold">AI Catalog Requests</h3>
        <react_chartjs_2_1.Line data={{
            labels: aiCrawl.labels,
            datasets: [
                {
                    label: "AI catalog requests",
                    data: aiCrawl.data,
                    borderColor: "rgb(99, 132, 255)",
                },
            ],
        }}/>
      </div>
    </div>);
}
