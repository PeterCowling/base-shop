import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import UpgradePreviewPage from "../src/app/upgrade-preview/page";

jest.mock("next/dynamic", () => () => () => null);

describe("upgrade preview page", () => {
  it("renders changes and publish CTA", async () => {
    const fetchMock = jest.spyOn(global, "fetch" as any).mockResolvedValue({
      json: async () => [
        {
          name: "TestComp",
          before: { path: "@ui/components/Before" },
          after: { path: "@ui/components/After" },
        },
      ],
    } as any);

    const { baseElement } = render(<UpgradePreviewPage />);
    await screen.findByText("TestComp");
    expect(screen.getByText("Approve & publish")).toBeInTheDocument();
    expect(baseElement).toMatchSnapshot();
    fetchMock.mockRestore();
  });
});
