import { render, screen } from "@testing-library/react";
import ProductPreview from "@cms/app/cms/blog/posts/ProductPreview";

afterEach(() => {
  (global.fetch as jest.Mock | undefined)?.mockReset?.();
});

// Stub atoms that depend on i18n/theme context
jest.mock("@/components/atoms", () => ({
  Alert: ({ title }: any) => <div>{title}</div>,
}));

jest.mock("next/image", () => ({
  __esModule: true,
  // Use a div with img-like semantics to avoid raw <img> usage in tests
  // while still allowing queries by role/name and src assertions.
  default: (props: any) => (
    <div role="img" aria-label={props.alt} data-src={props.src} data-aspect="1/1" />
  ),
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
    const img = screen.getByRole("img", { name: "Test" });
    expect(img.getAttribute("data-src")).toContain("/image.png");
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
    const img = await screen.findByRole("img", { name: "Test" });
    expect(img.getAttribute("data-src")).toContain("/file.svg");
  });

  it("renders error state when fetchProduct throws", async () => {
    (global.fetch as jest.Mock) = jest.fn().mockResolvedValue({
      ok: false,
    });
    render(<ProductPreview slug="t" />);
    expect(await screen.findByText("Failed to load product")).toBeInTheDocument();
  });
});
