import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";

jest.mock("@ui/components/ComponentPreview", () => ({
  __esModule: true,
  default: (props: any) => (
    <div data-testid="component-preview">{props.component.componentName}</div>
  ),
}));

import EditPreviewPage from "../src/app/edit-preview/page";

describe("edit preview page", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("loads changes and preview links", async () => {
    const fetchMock = jest.spyOn(global, "fetch" as any).mockImplementation(
      async (input: RequestInfo | URL) => {
        if (typeof input === "string" && input.includes("/api/edit-changes")) {
          return {
            json: async () => ({
              components: [
                {
                  file: "molecules/Breadcrumbs.tsx",
                  componentName: "Breadcrumbs",
                  oldChecksum: "1",
                  newChecksum: "2",
                },
              ],
              pages: ["p1"],
            }),
          } as any;
        }
        if (typeof input === "string" && input.includes("/api/preview-token")) {
          return {
            ok: true,
            json: async () => ({ token: "abc" }),
          } as any;
        }
        throw new Error("unknown fetch: " + input);
      },
    );

    render(<EditPreviewPage />);

    expect(await screen.findByTestId("component-preview")).toHaveTextContent(
      "Breadcrumbs",
    );
    expect(await screen.findByText("/preview/p1")).toBeInTheDocument();

    fetchMock.mockRestore();
  });

  it("shows error when publish fails", async () => {
    const fetchMock = jest.spyOn(global, "fetch" as any).mockImplementation(
      async (input: RequestInfo | URL, init?: RequestInit) => {
        if (typeof input === "string" && input.includes("/api/edit-changes")) {
          return {
            json: async () => ({ components: [], pages: [] }),
          } as any;
        }
        if (typeof input === "string" && input.includes("/api/publish")) {
          return {
            ok: false,
            json: async () => ({ error: "Publish failed" }),
          } as any;
        }
        throw new Error("unknown fetch: " + input);
      },
    );

    render(<EditPreviewPage />);

    const button = await screen.findByRole("button", { name: /approve & publish/i });
    fireEvent.click(button);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Publish failed",
    );

    fetchMock.mockRestore();
  });
});
