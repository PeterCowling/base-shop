import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import DOMPurify from "dompurify";

import PopupModal from "../PopupModal";

describe("PopupModal", () => {
  afterEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
    localStorage.clear();
  });

  it("opens automatically when autoOpen is true", () => {
    render(<PopupModal autoOpen content="Hello" />);

    expect(screen.getByText("Hello")).toBeInTheDocument();
  });

  it('opens after timeout when trigger="delay"', () => {
    jest.useFakeTimers();
    const delay = 500;
    render(
      <PopupModal trigger="delay" delay={delay} content="Delayed content" />,
    );

    expect(screen.queryByText("Delayed content")).not.toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(delay);
    });

    expect(screen.getByText("Delayed content")).toBeInTheDocument();
    jest.runOnlyPendingTimers();
  });

  it('opens on exit intent when trigger="exit"', async () => {
    const addEventListenerSpy = jest.spyOn(document, "addEventListener");

    render(<PopupModal trigger="exit" content="Exit content" />);

    expect(screen.queryByText("Exit content")).not.toBeInTheDocument();

    const exitListener = addEventListenerSpy.mock.calls.find((call) => call[0] === "mouseleave")?.[1] as
      | ((event: MouseEvent) => void)
      | undefined;
    expect(typeof exitListener).toBe("function");

    act(() => {
      exitListener?.(new MouseEvent("mouseleave", { clientY: 0 }));
    });

    addEventListenerSpy.mockRestore();

    expect(await screen.findByText("Exit content")).toBeInTheDocument();
  });

  it('closes when overlay is clicked', async () => {
    const user = userEvent.setup();
    render(<PopupModal autoOpen content="Overlay close" />);

    const dialog = await screen.findByRole("dialog");
    const overlay = dialog.previousElementSibling as HTMLElement | null;
    expect(overlay).toBeTruthy();
    await user.click(overlay!);

    await waitFor(() => {
      expect(screen.queryByText("Overlay close")).not.toBeInTheDocument();
    });
  });

  it('closes when close button is clicked', () => {
    render(<PopupModal autoOpen content="Button close" />);

    const button = screen.getByRole("button", { name: /close/i });
    fireEvent.click(button);

    expect(screen.queryByText("Button close")).not.toBeInTheDocument();
  });

  it('closes when Escape key is pressed', () => {
    render(<PopupModal autoOpen content="Escape close" />);

    fireEvent.keyDown(document, { key: "Escape" });

    expect(screen.queryByText("Escape close")).not.toBeInTheDocument();
  });

  it('sanitizes content via DOMPurify.sanitize', async () => {
    const spy = jest.spyOn(DOMPurify, "sanitize");
    const malicious = '<img src="x" onerror="alert(1)"><script>alert("xss")</script>';

    render(
      <PopupModal autoOpen content={malicious} />,
    );

    expect(spy).toHaveBeenCalledWith(malicious);

    const dialog = await screen.findByRole("dialog");
    const content = dialog.querySelector<HTMLElement>('[data-radix-dialog-content], [data-radix-dialog-content=""]') ?? dialog;

    const img = content?.querySelector("img");
    expect(img).toBeInTheDocument();
    expect(img?.getAttribute("onerror")).toBeNull();
    expect(content?.querySelector("script")).toBeNull();
  });
});
