import { configureReviewsAdapter, getReviews } from "../provider";

describe("reviews provider", () => {
  afterEach(() => {
    // reset adapter by configuring nullish no-op through type cast hack
    // @ts-expect-error test reset
    configureReviewsAdapter(undefined);
  });

  it("returns empty when no adapter configured", async () => {
    const res = await getReviews("sku1");
    expect(res).toEqual([]);
  });

  it("delegates to adapter and handles errors", async () => {
    const ok = [{ id: "1", sku: "s", rating: 5, createdAt: "t" }];
    configureReviewsAdapter({
      getForSku: async (sku: string, limit?: number) => {
        if (sku === "boom") throw new Error("fail");
        return ok.slice(0, limit ?? ok.length);
      },
    });

    await expect(getReviews("sku1", 1)).resolves.toEqual([ok[0]]);
    await expect(getReviews("boom")).resolves.toEqual([]);
  });
});

