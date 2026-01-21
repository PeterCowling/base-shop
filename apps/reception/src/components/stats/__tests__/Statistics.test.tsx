import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import Statistics from "../Statistics";

const originalFetch = global.fetch;

describe("Statistics", () => {
  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it("shows the server response on success", async () => {
    const fetchMock = jest.fn(async () => ({ text: async () => "OK" } as Response));
    (global as unknown as { fetch: typeof fetch }).fetch = fetchMock as unknown as typeof fetch;

    render(<Statistics />);

    await userEvent.click(screen.getByRole("button", { name: "Test Connection" }));

    expect(fetchMock).toHaveBeenCalled();
    await screen.findByText("OK");
  });

  it("shows an error message on failure", async () => {
    const fetchMock = jest.fn(async () => {
      throw new Error("network");
    });
    (global as unknown as { fetch: typeof fetch }).fetch = fetchMock as unknown as typeof fetch;

    render(<Statistics />);

    await userEvent.click(screen.getByRole("button", { name: "Test Connection" }));

    expect(fetchMock).toHaveBeenCalled();
    await screen.findByText("Test Connection Failed: network");
  });

  it("applies dark mode classes", () => {
    render(
      <div className="dark">
        <Statistics />
      </div>
    );
    const container = screen.getByRole("button", { name: /test connection/i }).parentElement as HTMLElement;
    expect(container).toHaveClass("dark:bg-darkSurface");
  });
});
