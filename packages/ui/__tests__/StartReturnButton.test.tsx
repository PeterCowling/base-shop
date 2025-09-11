import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import StartReturnButton from "../src/components/account/StartReturnButton";

const originalFetch = global.fetch;

describe("StartReturnButton", () => {
  afterEach(() => {
    (global as any).fetch = originalFetch;
    jest.clearAllMocks();
  });

  it("exposes tokens for styling", () => {
    render(<StartReturnButton sessionId="s1" />);
    const btn = screen.getByRole("button", { name: /start return/i });
    expect(btn).toHaveAttribute("data-token", "--color-primary");
    expect(btn.querySelector("span")).toHaveAttribute(
      "data-token",
      "--color-primary-fg"
    );
  });

  it("requests a return label and renders tracking info", async () => {
    const mockFetch = jest.fn();
    (global as any).fetch = mockFetch;

    let resolvePost: (value: unknown) => void;
    const postPromise = new Promise((res) => {
      resolvePost = res;
    });

    mockFetch
      .mockReturnValueOnce(postPromise as any)
      .mockResolvedValueOnce({
        json: async () => ({ status: "in-transit" }),
      } as any);

    render(<StartReturnButton sessionId="s1" />);
    const btn = screen.getByRole("button", { name: /start return/i });

    await userEvent.click(btn);

    // loading state while waiting for POST
    expect(btn).toHaveTextContent(/processing/i);
    expect(btn).toBeDisabled();

    resolvePost!({
      json: async () => ({
        tracking: { number: "1Z", labelUrl: "http://label" },
        dropOffProvider: "UPS",
      }),
    } as any);

    await waitFor(() => expect(btn).toHaveTextContent(/start return/i));
    expect(btn).toBeEnabled();

    expect(
      screen.getByRole("link", { name: /download label/i })
    ).toHaveAttribute("href", "http://label");
    expect(screen.getByText("Tracking: 1Z")).toBeInTheDocument();
    expect(screen.getByText("Drop-off: UPS")).toBeInTheDocument();

    await screen.findByText("Status: in-transit");
    expect(mockFetch).toHaveBeenNthCalledWith(2, "/api/return?tracking=1Z");
  });

  it("resets loading state when request fails", async () => {
    const mockFetch = jest.fn();
    (global as any).fetch = mockFetch;

    let rejectPost: (reason?: unknown) => void;
    const postPromise = new Promise((_, rej) => {
      rejectPost = rej;
    });

    mockFetch.mockReturnValueOnce(postPromise as any);

    render(<StartReturnButton sessionId="s1" />);
    const btn = screen.getByRole("button", { name: /start return/i });

    await userEvent.click(btn);
    expect(btn).toHaveTextContent(/processing/i);

    rejectPost!(new Error("fail"));

    await waitFor(() => expect(btn).toHaveTextContent(/start return/i));
    expect(btn).toBeEnabled();
  });
});
