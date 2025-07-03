import { render } from "@testing-library/react";
import { Image } from "../components/cms/blocks/atoms";

describe("Image atom", () => {
  it("renders an img element", () => {
    const { container } = render(
      <Image src="/a.jpg" alt="a" width={100} height={50} />
    );
    const img = container.querySelector("img");
    expect(img).toBeInTheDocument();
    expect(img?.getAttribute("src")).toBe("/a.jpg");
    expect(img?.getAttribute("alt")).toBe("a");
  });
});
