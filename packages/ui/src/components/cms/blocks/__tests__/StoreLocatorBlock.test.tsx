import { render } from "@testing-library/react";
import StoreLocatorBlock from "../StoreLocatorBlock";

describe("StoreLocatorBlock", () => {
  it("renders map when locations provided", () => {
    const { container } = render(
      <StoreLocatorBlock locations={[{ lat: 1, lng: 2, label: "A" }]} />
    );
    expect(container.firstChild).toBeInTheDocument();
  });

  it("returns null when no valid locations", () => {
    const { container } = render(<StoreLocatorBlock locations={[]} />);
    expect(container.firstChild).toBeNull();
  });
});
