import { render, screen, fireEvent, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import PopupModal from "../src/components/cms/blocks/PopupModal";

describe("PopupModal triggers", () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it("opens after the specified delay", () => {
    jest.useFakeTimers();
    render(
      <PopupModal trigger="delay" delay={1000} content="<p>Delayed</p>" />,
    );

    expect(screen.queryByRole("dialog")).toBeNull();

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("opens when the mouse leaves the window for exit trigger", () => {
    render(<PopupModal trigger="exit" content="<p>Exit</p>" />);
    expect(screen.queryByRole("dialog")).toBeNull();

    fireEvent.mouseLeave(document, { clientY: 0 });

    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("closes on backdrop click", () => {
    render(<PopupModal content="<p>Backdrop</p>" />);
    const dialog = screen.getByRole("dialog");

    fireEvent.click(dialog.parentElement!);

    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("closes on Escape key press", async () => {
    render(<PopupModal content="<p>Escape</p>" />);
    const user = userEvent.setup();

    await user.keyboard("{Escape}");

    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("renders sanitized HTML content", () => {
    const dirty = '<img src="x" onerror="alert(1)" /><script>alert(1)</script>';
    const { container } = render(<PopupModal content={dirty} />);

    const img = screen.getByRole("img");
    expect(img).toHaveAttribute("src", "x");
    expect(img).not.toHaveAttribute("onerror");
    expect(container.querySelector("script")).toBeNull();
  });
});

