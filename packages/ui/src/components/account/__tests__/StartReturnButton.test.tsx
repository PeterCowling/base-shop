import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import StartReturnButton from "../StartReturnButton";

jest.setTimeout(10000);

describe("StartReturnButton", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("displays label, drop-off provider, tracking and polls for status", async () => {
    const interval = jest
      .spyOn(global, "setInterval")
      .mockImplementation((fn: any) => {
        fn();
        return 0 as any;
      });
    // @ts-expect-error — mocking global.fetch in tests
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce({
        json: async () => ({
          tracking: { number: "abc123", labelUrl: "http://label" },
          dropOffProvider: "UPS",
        }),
      })
      .mockResolvedValueOnce({ json: async () => ({}) })
      .mockResolvedValueOnce({ json: async () => ({ status: "received" }) });

    render(<StartReturnButton sessionId="s1" />);

    await userEvent.click(screen.getByRole("button", { name: /start return/i }));

    expect(await screen.findByText("Download label")).toBeInTheDocument();
    expect(screen.getByText("Drop-off: UPS")).toBeInTheDocument();
    expect(screen.getByText("Tracking: abc123")).toBeInTheDocument();
    expect(screen.getByText("Status: received")).toBeInTheDocument();
    expect(global.fetch).toHaveBeenCalledTimes(3);

    interval.mockRestore();
  });

  it("shows tracking without label or drop-off provider", async () => {
    jest.spyOn(global, "setInterval").mockReturnValue(0 as any);
    // @ts-expect-error — mocking global.fetch in tests
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce({
        json: async () => ({ tracking: { number: "abc123" } }),
      })
      .mockResolvedValueOnce({ json: async () => ({ status: "processing" }) });

    render(<StartReturnButton sessionId="s1" />);

    await userEvent.click(screen.getByRole("button", { name: /start return/i }));

    expect(await screen.findByText("Tracking: abc123")).toBeInTheDocument();
    expect(screen.queryByText("Download label")).not.toBeInTheDocument();
    expect(screen.queryByText(/Drop-off/)).not.toBeInTheDocument();
    expect(screen.getByText("Status: processing")).toBeInTheDocument();
  });

  it("handles network errors", async () => {
    const user = userEvent.setup();
    // @ts-expect-error — mocking global.fetch in tests
    global.fetch = jest.fn().mockRejectedValue(new Error("network"));

    render(<StartReturnButton sessionId="s1" />);

    const button = screen.getByRole("button", { name: /start return/i });
    await user.click(button);

    await waitFor(() => expect(button).toBeEnabled());
    expect(button).toHaveTextContent("Start return");
    expect(screen.queryByText(/Tracking:/)).not.toBeInTheDocument();
  });
});
