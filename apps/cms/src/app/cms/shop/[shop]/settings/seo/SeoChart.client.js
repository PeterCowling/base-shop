"use client";
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SeoChart = SeoChart;
var chart_js_1 = require("chart.js");
var react_chartjs_2_1 = require("react-chartjs-2");
chart_js_1.Chart.register(chart_js_1.CategoryScale, chart_js_1.LinearScale, chart_js_1.PointElement, chart_js_1.LineElement, chart_js_1.Tooltip, chart_js_1.Legend);
function SeoChart(_a) {
    var labels = _a.labels, scores = _a.scores;
    return (<react_chartjs_2_1.Line data={{
            labels: labels,
            datasets: [
                {
                    label: "SEO Score",
                    data: scores,
                    borderColor: "rgb(75, 192, 192)",
                },
            ],
        }}/>);
}
