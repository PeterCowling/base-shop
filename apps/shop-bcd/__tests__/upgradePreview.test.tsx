import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import UpgradePreviewPage from "../src/app/upgrade-preview/page";

describe("upgrade preview page", () => {
  it("renders changes, preview links and publish CTA", async () => {
    const fetchMock = jest
      .spyOn(global, "fetch" as any)
      .mockResolvedValueOnce({
        json: async () => ({
          components: [
            {
              file: "molecules/Breadcrumbs.tsx",
              componentName: "Breadcrumbs",
            },
          ],
          pages: ["1"],
        }),
      } as any)
      .mockResolvedValueOnce({
        json: async () => ({ token: "tok" }),
      } as any);

    const { baseElement } = render(<UpgradePreviewPage />);
    await screen.findByText("Breadcrumbs");
    await screen.findByText("Preview 1");
    expect(screen.getByText("Approve & publish")).toBeInTheDocument();
    expect(baseElement).toMatchSnapshot();
    fetchMock.mockRestore();
  });
});
