import React from "react";
import { render } from "@testing-library/react";
import { LineChart } from "../src/components/atoms/LineChart";

jest.mock("react-chartjs-2", () => ({
  Line: ({ data, options, className, ...rest }: any) => (
    <div data-testid="line-chart" data-keys={Object.keys(data).join(",")} className={className} {...rest} />
  ),
}));

describe("LineChart", () => {
  it("forwards data/options/className to Line", () => {
    const data = { labels: ["a"], datasets: [{ data: [1] }] } as any;
    const options = { responsive: true } as any;
    const { getByTestId } = render(
      <LineChart data={data} options={options} className="h-20" />
    );
    const el = getByTestId("line-chart");
    expect(el).toHaveClass("h-20");
    expect(el.getAttribute("data-keys")).toContain("labels");
  });
});

