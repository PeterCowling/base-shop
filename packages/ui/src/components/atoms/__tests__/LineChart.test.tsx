import "../../../../../../test/resetNextMocks";
import { render, screen, configure } from "@testing-library/react";
import { LineChart } from "../LineChart";

configure({ testIdAttribute: "data-testid" });

type LineProps = React.ComponentProps<typeof LineChart>;

const lineMock = jest.fn((props: any) => <div {...props} />);

jest.mock("react-chartjs-2", () => ({
  Line: (props: any) => lineMock(props),
}));

describe("LineChart", () => {
  const data: LineProps["data"] = {
    labels: ["Jan"],
    datasets: [{ label: "Sales", data: [1] }],
  };
  const options = { responsive: true };

  it("renders line chart with provided props", () => {
    render(<LineChart data={data} options={options} className="custom" />);
    const chart = screen.getByTestId("line-chart");
    expect(chart).toBeInTheDocument();
    expect(chart).toHaveClass("custom");
    expect(chart).toHaveAttribute("data-testid", "line-chart");
    expect(chart).toHaveAttribute("data-cy", "line-chart");
    expect(lineMock).toHaveBeenCalledWith(
      expect.objectContaining({
        data,
        options,
        className: "custom",
        "data-cy": "line-chart",
        "data-testid": "line-chart",
      }),
    );
  });
});
