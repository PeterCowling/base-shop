// apps/shop-bcd/__tests__/cancelled-page.test.tsx
import { render, screen } from "@testing-library/react";

import CancelledBase from "../src/app/cancelled/page";
import CancelledLocalized from "../src/app/[lang]/cancelled/page";

jest.mock("next/navigation", () => ({
  useSearchParams: jest.fn(),
}));

const useSearchParams = jest.requireMock("next/navigation")
  .useSearchParams as jest.Mock;

const cancelledPages: ReadonlyArray<
  [string, () => JSX.Element]
> = [
  ["non-locale /cancelled page", CancelledBase],
  ["localized /[lang]/cancelled page", CancelledLocalized],
];

describe.each(cancelledPages)("%s", (_label, Cancelled) => {
  afterEach(() => {
    useSearchParams.mockReset();
  });

  test("renders cancellation message without error", () => {
    useSearchParams.mockReturnValue(new URLSearchParams(""));
    render(<Cancelled />);
    expect(
      screen.getByRole("heading", { name: "Payment cancelled" })
    ).toBeInTheDocument();
    expect(screen.queryByText("Invalid card")).not.toBeInTheDocument();
  });

  test("renders error message when provided", () => {
    useSearchParams.mockReturnValue(
      new URLSearchParams("error=Invalid%20card")
    );
    render(<Cancelled />);
    expect(screen.getByText("Invalid card")).toBeInTheDocument();
  });
});
