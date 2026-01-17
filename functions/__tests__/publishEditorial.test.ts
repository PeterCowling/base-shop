// functions/__tests__/publishEditorial.test.ts
import { promises as fs } from "node:fs";
import publishEditorial from "../src/publishEditorial";
import { publishQueuedPost } from "@acme/sanity";
import { trackEvent } from "@acme/platform-core/analytics";

jest.mock("node:fs", () => {
  const actual = jest.requireActual("node:fs");
  return {
    __esModule: true,
    ...actual,
    promises: {
      ...actual.promises,
      readdir: jest.fn(),
    },
  };
});

jest.mock("@acme/sanity", () => ({
  publishQueuedPost: jest.fn(),
}));

jest.mock("@acme/platform-core/analytics", () => ({
  trackEvent: jest.fn(),
}));

test("processes each shop and reports result", async () => {
  const shops = ["shop-a", "shop-b"];
  const file = { name: "readme.txt", isDirectory: () => false };
  (fs.readdir as jest.Mock).mockResolvedValue([
    ...shops.map((name) => ({ name, isDirectory: () => true })),
    file,
  ]);

  (publishQueuedPost as jest.Mock).mockImplementation(async (shop: string) => {
    if (shop === "shop-b") throw new Error("boom");
  });

  const errorSpy = jest.spyOn(console, "error").mockImplementation();

  await publishEditorial.scheduled();

  expect(publishQueuedPost).toHaveBeenCalledTimes(2);
  expect(publishQueuedPost).toHaveBeenCalledWith("shop-a");
  expect(publishQueuedPost).toHaveBeenCalledWith("shop-b");
  expect(publishQueuedPost).not.toHaveBeenCalledWith(file.name);

  expect(trackEvent).toHaveBeenCalledTimes(2);
  expect(trackEvent).toHaveBeenCalledWith("shop-a", {
    type: "editorial_publish",
    success: true,
  });
  expect(trackEvent).toHaveBeenCalledWith("shop-b", {
    type: "editorial_publish",
    success: false,
    error: "boom",
  });
  expect(trackEvent).not.toHaveBeenCalledWith(file.name, expect.anything());

  expect(errorSpy).toHaveBeenCalledWith(
    "editorial publish failed for shop-b",
    expect.any(Error)
  );

  errorSpy.mockRestore();
});
