import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import UpgradePreviewPage from "../src/app/upgrade-preview/page";

describe("upgrade preview page", () => {
  it("renders changes and publish CTA", async () => {
    const fetchMock = jest.spyOn(global, "fetch" as any).mockResolvedValue({
      json: async () => ({
        components: [
          {
            file: "molecules/Breadcrumbs.tsx",
            componentName: "Breadcrumbs",
          },
        ],
      }),
    } as any);

    const { baseElement } = render(<UpgradePreviewPage />);
    await screen.findByText("Breadcrumbs");
    expect(screen.getByText("Approve & publish")).toBeInTheDocument();
    expect(baseElement).toMatchSnapshot();
    fetchMock.mockRestore();
  });
});
