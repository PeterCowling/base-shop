import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import UpgradePreviewPage from "../src/app/upgrade-preview/page";

describe("upgrade preview page", () => {
  beforeEach(() => {
    global.__UPGRADE_MOCKS__ = {
      "@acme/ui/components/molecules/Breadcrumbs": () => (
        <div data-cy="new-comp">new-breadcrumbs</div>
      ),
      "@acme/ui/components/molecules/Breadcrumbs.bak": () => (
        <div data-cy="old-comp">old-breadcrumbs</div>
      ),
    };
  });

  afterEach(() => {
    delete global.__UPGRADE_MOCKS__;
  });

  it("renders component and toggles comparison", async () => {
    type UpgradeComponentsResponse = {
      components: Array<{
        file: string;
        componentName: string;
      }>;
    };

    type MockFetchResponse = {
      json: () => Promise<UpgradeComponentsResponse>;
    };

    const globalWithFetch = global as typeof globalThis & {
      fetch: () => Promise<MockFetchResponse>;
    };

    const fetchMock = jest
      .spyOn(globalWithFetch, "fetch")
      .mockResolvedValue({
        json: async () => ({
          components: [
            {
              file: "molecules/Breadcrumbs.tsx",
              componentName: "Breadcrumbs",
            },
          ],
        }),
      });

    render(<UpgradePreviewPage />);

    await screen.findByText("Breadcrumbs");
    const newComp = await screen.findByTestId("new-comp");
    expect(newComp).toBeInTheDocument();
    expect(screen.queryByTestId("old-comp")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: /compare/i }));
    expect(await screen.findByTestId("old-comp")).toBeInTheDocument();

    fetchMock.mockRestore();
  });
});
