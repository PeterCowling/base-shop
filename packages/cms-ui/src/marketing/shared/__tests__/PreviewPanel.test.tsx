// React 19 requires this flag to silence act warnings in tests
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { PreviewPanel } from "../PreviewPanel";

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

describe("PreviewPanel", () => {
  const title = "API payload";
  const data = { message: "hello", count: 2 };
  const json = JSON.stringify(data, null, 2);
  let originalNavigator: Navigator;
  let writeTextMock: jest.Mock;

  beforeEach(() => {
    writeTextMock = jest.fn().mockResolvedValue(undefined);
    originalNavigator = navigator;
    const mockNavigator = Object.create(originalNavigator) as Navigator;
    Object.defineProperty(mockNavigator, "clipboard", {
      configurable: true,
      value: { writeText: writeTextMock } as unknown as Clipboard,
    });
    Object.defineProperty(global, "navigator", {
      configurable: true,
      value: mockNavigator,
    });
  });

  afterEach(() => {
    Object.defineProperty(global, "navigator", {
      configurable: true,
      value: originalNavigator,
    });
  });

  it("renders the JSON fallback inside a code block", () => {
    render(<PreviewPanel title={title} data={data} />);

    expect(
      screen.getByRole("heading", { name: title })
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /copy/i })).toBeInTheDocument();
    expect(
      screen.getByText(/"message": "hello"/i)
    ).toBeInTheDocument();
  });

  it("copies the preview payload to the clipboard", async () => {
    const user = userEvent.setup();

    render(<PreviewPanel title={title} data={data} />);

    const copyButton = screen.getByRole("button", { name: /copy/i });
    await user.click(copyButton);

    await waitFor(() => expect(copyButton).toHaveTextContent(/copied/i));
  });
});

