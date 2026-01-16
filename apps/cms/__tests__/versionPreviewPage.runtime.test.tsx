import "@testing-library/jest-dom";
import { render, screen, waitFor } from "@testing-library/react";
import React from "react";
import PreviewViewer from "../src/app/preview/[token]/page";

jest.mock("@acme/ui/components/DynamicRenderer", () => ({
  __esModule: true,
  default: (props: { components: unknown[] }) => (
    <div data-testid="runtime-preview">
      {Array.isArray(props.components) ? props.components.length : "no-components"}
    </div>
  ),
}));

describe("Version preview page", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    // @ts-expect-error jest override
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        shop: "demo-shop",
        pageId: "home",
        versionId: "v1",
        label: "Test version",
        timestamp: new Date("2024-01-01T00:00:00.000Z").toISOString(),
        components: [{ id: "c1", type: "Text" }],
        editor: {},
      }),
    });
  });

  afterEach(() => {
    jest.resetAllMocks();
    // @ts-expect-error jest override
    global.fetch = originalFetch;
  });

  it("renders a runtime preview for a loaded version", async () => {
    render(<PreviewViewer params={{ token: "test-token" }} />);

    await waitFor(() =>
      expect(screen.getByTestId("runtime-preview")).toBeInTheDocument(),
    );

    expect(screen.getByText("Test version")).toBeInTheDocument();
  });
});

