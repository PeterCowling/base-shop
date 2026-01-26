import "@testing-library/jest-dom";

import type { FC } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import EditPreviewPage from "./page";

type ComponentPreviewProps = { component: { componentName: string } };

jest.mock("@acme/ui/components/ComponentPreview", () => {
  const MockComponentPreview: FC<ComponentPreviewProps> = ({ component }) => (
    <div data-cy={`preview-${component.componentName}`}>{component.componentName}</div>
  );
  // Satisfy react/display-name for the mocked component
  MockComponentPreview.displayName = "MockComponentPreview";
  return MockComponentPreview;
});

const originalFetch = global.fetch;

afterEach(() => {
  global.fetch = originalFetch;
  jest.resetAllMocks();
});

describe("EditPreviewPage", () => {
  it("renders changes, links and publishes successfully", async () => {
    const fetchMock = jest.fn((url: RequestInfo | URL) => {
      if (url === "/api/edit-changes") {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            components: [{
              file: "comp.tsx",
              componentName: "Widget",
              oldChecksum: "1",
              newChecksum: "2",
            }],
            pages: ["123"],
          }),
        } as Response);
      }
      if (typeof url === "string" && url.startsWith("/api/preview-token")) {
        return Promise.resolve({ ok: true, json: async () => ({ token: "tok" }) } as Response);
      }
      if (url === "/api/publish") {
        return Promise.resolve({ ok: true, json: async () => ({}) } as Response);
      }
      return Promise.reject(new Error("unknown url"));
    });
    global.fetch = fetchMock as unknown as typeof global.fetch;

    render(<EditPreviewPage />);

    expect(await screen.findByTestId("preview-Widget")).toBeInTheDocument();
    const link = await screen.findByRole("link", { name: "/preview/123" });
    expect(link).toHaveAttribute("href", "/preview/123?upgrade=tok");

    const publishBtn = screen.getByRole("button", { name: "Approve & publish" });
    fireEvent.click(publishBtn);
    expect(screen.getByRole("button", { name: "Publishing..." })).toBeDisabled();
    await waitFor(() => expect(screen.getByRole("button", { name: "Approve & publish" })).not.toBeDisabled());
    expect(fetchMock).toHaveBeenCalledWith("/api/publish", { method: "POST" });
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("shows error when publish fails", async () => {
    const fetchMock = jest.fn((url: RequestInfo | URL) => {
      if (url === "/api/edit-changes") {
        return Promise.resolve({
          ok: true,
          json: async () => ({ components: [], pages: [] }),
        } as Response);
      }
      if (url === "/api/publish") {
        return Promise.resolve({
          ok: false,
          json: async () => ({ error: "fail" }),
        } as Response);
      }
      return Promise.reject(new Error("unknown url"));
    });
    global.fetch = fetchMock as unknown as typeof global.fetch;

    render(<EditPreviewPage />);

    fireEvent.click(await screen.findByRole("button", { name: "Approve & publish" }));
    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("fail");
    expect(screen.getByRole("button", { name: "Approve & publish" })).not.toBeDisabled();
  });
});
