import { render, screen, fireEvent, act } from "@testing-library/react";
import HeroBanner from "../HeroBanner.client";

// Mock next/image to render a plain img without passing Next-only boolean props
jest.mock("next/image", () => ({
  __esModule: true,
  default: ({ unoptimized, priority, fill, placeholder, ...rest }: any) => (
    // Strip Next-specific boolean props to avoid React DOM warnings in tests
    // like "Received `true` for a non-boolean attribute `fill`".
    // We intentionally forward the remaining props to a plain img element.
    // eslint-disable-next-line jsx-a11y/alt-text -- TEST-0001: Mocking next/image returns a plain <img> without alt to avoid Next-specific prop warnings in tests
    <img {...rest} />
  ),
}));

const tMock = jest.fn((key: string) => key);
jest.mock("@acme/i18n", () => ({
  useTranslations: () => tMock,
}));

const pathnameMock = jest.fn();
jest.mock("next/navigation", () => ({
  usePathname: () => pathnameMock(),
}));

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, ...props }: any) => <a {...props}>{children}</a>,
}));

describe("HeroBanner.client", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    pathnameMock.mockReturnValue("/de/path");
  });

  afterEach(() => {
    // Flushing pending timers can trigger state updates; wrap in act to
    // avoid React's act() warnings in Jest.
    act(() => {
      jest.runOnlyPendingTimers();
    });
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it("falls back to default slides and uses locale prefix in link", () => {
    render(<HeroBanner slides={[]} />);
    expect(
      screen.getByRole("img", {
        name: "Man wearing eco sneaker on concrete",
      }),
    ).toBeInTheDocument();
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/de/shop");
  });

  it("advances slides on interval and clears on unmount", () => {
    const clearSpy = jest.spyOn(global, "clearInterval");
    const { unmount } = render(<HeroBanner slides={[]} />);

    act(() => {
      jest.advanceTimersByTime(6000);
    });
    expect(
      screen.getByRole("img", {
        name: "Close-up of recycled rubber sole",
      }),
    ).toBeInTheDocument();

    unmount();
    expect(clearSpy).toHaveBeenCalled();
    clearSpy.mockRestore();
  });

  it("wraps around with previous and next buttons", () => {
    render(<HeroBanner slides={[]} />);
    const prev = screen.getByRole("button", { name: /previous slide/i });
    const next = screen.getByRole("button", { name: /next slide/i });

    fireEvent.click(prev);
    expect(
      screen.getByRole("img", {
        name: "Pair of sneakers on mossy rock",
      }),
    ).toBeInTheDocument();

    fireEvent.click(next);
    expect(
      screen.getByRole("img", {
        name: "Man wearing eco sneaker on concrete",
      }),
    ).toBeInTheDocument();

    fireEvent.click(next);
    expect(
      screen.getByRole("img", {
        name: "Close-up of recycled rubber sole",
      }),
    ).toBeInTheDocument();
  });
});
