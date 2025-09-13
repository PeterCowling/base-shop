import { render, screen, fireEvent, act } from "@testing-library/react";
import HeroBanner from "../HeroBanner.client";

jest.mock("next/image", () => (props: any) => <img {...props} />);

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
    jest.runOnlyPendingTimers();
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

