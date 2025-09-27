import { render, screen, fireEvent, act } from "@testing-library/react";
import DOMPurify from "dompurify";
import PopupModal from "../PopupModal";

describe("PopupModal", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it("opens automatically when autoOpen is true", () => {
    render(<PopupModal autoOpen content="Hello" />);

    expect(screen.getByText("Hello")).toBeInTheDocument();
  });

  it('opens after timeout when trigger="delay"', () => {
    const delay = 500;
    render(
      <PopupModal trigger="delay" delay={delay} content="Delayed content" />,
    );

    expect(screen.queryByText("Delayed content")).not.toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(delay);
    });

    expect(screen.getByText("Delayed content")).toBeInTheDocument();
  });

  it('opens on exit intent when trigger="exit"', () => {
    render(<PopupModal trigger="exit" content="Exit content" />);

    expect(screen.queryByText("Exit content")).not.toBeInTheDocument();

    fireEvent.mouseLeave(document, { clientY: 0 });

    expect(screen.getByText("Exit content")).toBeInTheDocument();
  });

  it('closes when overlay is clicked', () => {
    render(<PopupModal autoOpen content="Overlay close" />);

    const contentEl = screen.getByText("Overlay close");
    const overlay = contentEl.parentElement?.parentElement;
    expect(overlay).toBeTruthy();
    if (!overlay) throw new Error("Overlay element not found");
    fireEvent.click(overlay);

    expect(screen.queryByText("Overlay close")).not.toBeInTheDocument();
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

  it('sanitizes content via DOMPurify.sanitize', () => {
    const spy = jest.spyOn(DOMPurify, "sanitize");
    const malicious = '<img src="x" onerror="alert(1)"><script>alert("xss")</script>';

    const { container } = render(
      <PopupModal autoOpen content={malicious} />,
    );

    expect(spy).toHaveBeenCalledWith(malicious);

    const img = container.querySelector("img");
    expect(img).toBeInTheDocument();
    expect(img?.getAttribute("onerror")).toBeNull();
    expect(container.querySelector("script")).toBeNull();
  });
});
