import "@testing-library/jest-dom";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import UpgradePreviewPage from "./page";

jest.mock("@ui/components/ComponentPreview", () => ({ component }: any) => (
  <div data-cy={`preview-${component.componentName}`}>{component.componentName}</div>
));

const originalFetch = global.fetch;

afterEach(() => {
  global.fetch = originalFetch;
  jest.resetAllMocks();
});

describe("UpgradePreviewPage", () => {
  it("renders changes, links and publishes successfully", async () => {
    const fetchMock = jest.fn((url: RequestInfo | URL) => {
      if (url === "/api/upgrade-changes") {
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
        } as any);
      }
      if (typeof url === "string" && url.startsWith("/api/preview-token")) {
        return Promise.resolve({ ok: true, json: async () => ({ token: "tok" }) } as any);
      }
      if (url === "/api/publish") {
        return Promise.resolve({ ok: true, json: async () => ({}) } as any);
      }
      return Promise.reject(new Error("unknown url"));
    });
    global.fetch = fetchMock as any;

    render(<UpgradePreviewPage />);

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
      if (url === "/api/upgrade-changes") {
        return Promise.resolve({
          ok: true,
          json: async () => ({ components: [], pages: [] }),
        } as any);
      }
      if (url === "/api/publish") {
        return Promise.resolve({
          ok: false,
          json: async () => ({ error: "fail" }),
        } as any);
      }
      return Promise.reject(new Error("unknown url"));
    });
    global.fetch = fetchMock as any;

    render(<UpgradePreviewPage />);

    fireEvent.click(await screen.findByRole("button", { name: "Approve & publish" }));
    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("fail");
    expect(screen.getByRole("button", { name: "Approve & publish" })).not.toBeDisabled();
  });
});

