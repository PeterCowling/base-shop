import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import UpgradePreviewPage from "../src/app/upgrade-preview/page";

describe("upgrade preview page", () => {
  beforeEach(() => {
    global.__UPGRADE_MOCKS__ = {
      "@ui/components/molecules/Breadcrumbs": () => (
        <div data-testid="new-comp">new-breadcrumbs</div>
      ),
      "@ui/components/molecules/Breadcrumbs.bak": () => (
        <div data-testid="old-comp">old-breadcrumbs</div>
      ),
    };
  });

  afterEach(() => {
    delete global.__UPGRADE_MOCKS__;
  });

  it("renders component and toggles comparison", async () => {
    const fetchMock = jest.spyOn(global, "fetch" as any).mockResolvedValue({
      json: async () => ({
        components: [
          {
            file: "molecules/Breadcrumbs.tsx",
            componentName: "Breadcrumbs",
            oldChecksum: "old1",
            newChecksum: "new1",
          },
        ],
      }),
    } as any);

    render(<UpgradePreviewPage />);

    await screen.findByText("Breadcrumbs");
    expect(screen.getByTestId("new-comp")).toBeInTheDocument();
    expect(screen.queryByTestId("old-comp")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: /compare/i }));
    expect(screen.getByTestId("old-comp")).toBeInTheDocument();

    fetchMock.mockRestore();
  });
});

