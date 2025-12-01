// apps/cover-me-pretty/__tests__/home-page.test.tsx
jest.mock("node:fs", () => ({
  promises: { readFile: jest.fn() },
}));
jest.mock("@acme/sanity", () => ({
  fetchPublishedPosts: jest.fn().mockResolvedValue([]),
}));
jest.mock("../src/app/[lang]/page.client", () => ({
  __esModule: true,
  default: jest.fn(() => null),
}));

import type { PageComponent } from "@acme/page-builder-core";
import { promises as fs } from "node:fs";
import Page from "../src/app/[lang]/page";
import Home from "../src/app/[lang]/page.client";
import { fetchPublishedPosts } from "@acme/sanity";

test("Home receives components from fs and fetches posts when merchandising enabled", async () => {
  const components: PageComponent[] = [
    { id: "c1", type: "HeroBanner" },
  ];
  (fs.readFile as jest.Mock).mockResolvedValue(JSON.stringify(components));

  const element = await Page({ params: { lang: "en" } });

  expect(fs.readFile).toHaveBeenCalledWith(
    expect.stringContaining("data/shops/cover-me-pretty/pages/home.json"),
    "utf8"
  );
  expect(element.type).toBe(Home);
  expect(element.props.components).toEqual(components);
  expect(element.props.locale).toBe("en");
  expect(fetchPublishedPosts).toHaveBeenCalledWith("cover-me-pretty");
});
