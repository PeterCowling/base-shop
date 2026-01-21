import "@testing-library/jest-dom";

import React from "react";
import { render } from "@testing-library/react";

import { Charts } from "../src/app/cms/dashboard/[shop]/components/Charts.client";
import type { MultiSeries,Series } from "../src/lib/analytics";

const lineProps: any[] = [];
jest.mock("react-chartjs-2", () => ({
  Line: (props: any) => {
    lineProps.push(props);
    return null;
  },
}));

describe("Charts", () => {
  it("renders charts with correct labels and colors", () => {
    const series: Series = { labels: ["Jan", "Feb"], data: [1, 2] };
    const multi: MultiSeries = {
      labels: ["Jan", "Feb"],
      datasets: [
        { label: "Code1", data: [1, 2] },
        { label: "Code2", data: [3, 4] },
      ],
    };

    render(
      <Charts
        traffic={series}
        conversion={series}
        sales={series}
        emailOpens={series}
        emailClicks={series}
        campaignSales={series}
        discountRedemptions={series}
        discountRedemptionsByCode={multi}
        aiCrawl={series}
      />,
    );

    expect(lineProps).toHaveLength(9);

    const expectedColors = [
      "rgb(75, 192, 192)",
      "rgb(153, 102, 255)",
      "rgb(255, 99, 132)",
      "rgb(54, 162, 235)",
      "rgb(255, 205, 86)",
      "rgb(255, 159, 64)",
      "rgb(201, 203, 207)",
      null,
      "rgb(99, 132, 255)",
    ];

    for (let i = 0; i < expectedColors.length; i++) {
      if (expectedColors[i]) {
        expect(lineProps[i].data.labels).toEqual(series.labels);
        expect(lineProps[i].data.datasets[0].borderColor).toBe(
          expectedColors[i],
        );
      }
    }

    expect(lineProps[7].data.labels).toEqual(multi.labels);
    expect(lineProps[7].data.datasets[0].borderColor).toBe(
      "rgb(255, 99, 132)",
    );
    expect(lineProps[7].data.datasets[1].borderColor).toBe(
      "rgb(54, 162, 235)",
    );
  });
});
