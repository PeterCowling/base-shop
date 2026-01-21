import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";

import DealsBanner from "@/components/deals/DealsBanner";

jest.mock("@/context/NotificationBannerContext", () => ({
  useSetBannerRef: () => jest.fn(),
}));

describe("<DealsBanner /> defaultValue fallbacks", () => {
  it("renders human text even if namespace not yet loaded", () => {
    render(<DealsBanner beds={6} time="2d" />);
    expect(screen.getByText(/Only 6 beds left/i)).toBeInTheDocument();
    expect(screen.getByText(/deal ends in 2d/i)).toBeInTheDocument();
  });
});