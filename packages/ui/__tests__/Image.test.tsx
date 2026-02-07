import { render } from "@testing-library/react";

import { Image } from "../src/components/cms/blocks/atoms";

describe("Image atom", () => {
  it("renders an img element", () => {
    const { container } = render(
      <Image src="/a.jpg" alt="a" width={100} height={50} />
    );
    const img = container.querySelector("img");
    expect(img).toBeInTheDocument();
    // In test environment, Next.js Image may pass through src directly
    // or apply loader transformation - check that original path is preserved
    const src = img?.getAttribute("src") ?? "";
    expect(src.includes("/a.jpg") || src.includes("url=%2Fa.jpg")).toBe(true);
    expect(img?.getAttribute("alt")).toBe("a");
  });
});
