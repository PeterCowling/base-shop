// apps/shop-bcd/__tests__/search-api.test.ts
jest.mock("@acme/sanity", () => ({
  __esModule: true,
  fetchPublishedPosts: jest.fn(),
}));

import { fetchPublishedPosts } from "@acme/sanity";
import { GET } from "../src/app/api/search/route";
import { PRODUCTS } from "@platform-core/products";

function makeRequest(q: string) {
  return new Request(`http://example.com/api/search?q=${encodeURIComponent(q)}`);
}

afterEach(() => jest.clearAllMocks());

test("returns matching products and posts", async () => {
  (fetchPublishedPosts as jest.Mock).mockResolvedValue([
    { title: "Summer Style", slug: "summer" },
  ]);
  const product = PRODUCTS[0];
  const q = product.title.slice(0, 3).toLowerCase();
  const res = await GET(makeRequest(q));
  expect(fetchPublishedPosts).toHaveBeenCalledWith("bcd");
  expect(res.status).toBe(200);
  const body = await res.json();
  expect(body.results).toEqual(
    expect.arrayContaining([
      { type: "product", title: product.title, slug: product.slug },
      { type: "post", title: "Summer Style", slug: "summer" },
    ]),
  );
});

test("ignores blog posts when fetch fails", async () => {
  (fetchPublishedPosts as jest.Mock).mockRejectedValue(new Error("fail"));
  const product = PRODUCTS[0];
  const q = product.title.slice(0, 3).toLowerCase();
  const res = await GET(makeRequest(q));
  expect(res.status).toBe(200);
  const body = await res.json();
  expect(body.results).toEqual([
    { type: "product", title: product.title, slug: product.slug },
  ]);
});
