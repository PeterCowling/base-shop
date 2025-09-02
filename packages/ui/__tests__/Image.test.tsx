import { render } from "@testing-library/react";
import { Image } from "../src/components/cms/blocks/atoms";

describe("Image atom", () => {
  it("renders an img element", () => {
    const { container } = render(
      <Image src="/a.jpg" alt="a" width={100} height={50} />
    );
    const img = container.querySelector("img");
    expect(img).toBeInTheDocument();
    // Next.js <Image> rewrites the src attribute; ensure original path is preserved
    // within the generated URL
    expect(img?.getAttribute("src")).toContain("url=%2Fa.jpg");
    expect(img?.getAttribute("alt")).toBe("a");
  });
});
