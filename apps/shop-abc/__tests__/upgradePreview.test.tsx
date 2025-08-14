import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import UpgradePreviewPage from "../src/app/upgrade-preview/page";

describe("upgrade preview page", () => {
  beforeEach(() => {
    (global as any).__UPGRADE_MOCKS__ = {
      "@ui/components/molecules/Breadcrumbs": {
        default: () => <div data-testid="new-comp">new-breadcrumbs</div>,
      },
      "@ui/components/molecules/Breadcrumbs.bak": {
        default: () => <div data-testid="old-comp">old-breadcrumbs</div>,
      },
    };
  });

  afterEach(() => {
    delete (global as any).__UPGRADE_MOCKS__;
  });

  it("renders component and toggles comparison", async () => {
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

    render(<UpgradePreviewPage />);

    await screen.findByText("Breadcrumbs");
    expect(screen.getByTestId("new-comp")).toBeInTheDocument();
    expect(screen.queryByTestId("old-comp")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: /compare/i }));
    expect(screen.getByTestId("old-comp")).toBeInTheDocument();

    fetchMock.mockRestore();
  });
});

