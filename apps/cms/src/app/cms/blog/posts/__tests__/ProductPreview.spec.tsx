import { render, screen } from "@testing-library/react";
import ProductPreview from "@cms/app/cms/blog/posts/ProductPreview";

afterEach(() => {
  (global.fetch as jest.Mock | undefined)?.mockReset?.();
});

jest.mock("next/image", () => ({
  __esModule: true,
  default: (props: any) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...props} />;
  },
}));

describe("ProductPreview", () => {
  it("renders image and title when product resolves successfully", async () => {
    (global.fetch as jest.Mock) = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        title: "Test",
        price: 100,
        stock: 1,
        media: [{ url: "/image.png" }],
      }),
    });
    render(<ProductPreview slug="t" />);
    expect(await screen.findByText("Test")).toBeInTheDocument();
    const img = screen.getByAltText("Test") as HTMLImageElement;
    expect(img.src).toContain("/image.png");
  });

  it("displays fallback text when product document is missing", async () => {
    (global.fetch as jest.Mock) = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => null,
    });
    render(<ProductPreview slug="t" />);
    expect(await screen.findByText("Not found")).toBeInTheDocument();
  });

  it("falls back to default image when coverImage is missing", async () => {
    (global.fetch as jest.Mock) = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ title: "Test", price: 100, stock: 1 }),
    });
    render(<ProductPreview slug="t" />);
    const img = await screen.findByAltText("Test");
    expect((img as HTMLImageElement).src).toContain("/file.svg");
  });

  it("renders error state when fetchProduct throws", async () => {
    (global.fetch as jest.Mock) = jest.fn().mockResolvedValue({
      ok: false,
    });
    render(<ProductPreview slug="t" />);
    expect(await screen.findByText("Failed to load product")).toBeInTheDocument();
  });
});
