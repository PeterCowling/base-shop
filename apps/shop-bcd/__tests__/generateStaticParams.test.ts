// apps/shop-bcd/__tests__/generateStaticParams.test.ts
jest.mock("@acme/i18n", () => ({
  LOCALES: ["en", "de"],
}));

import generateStaticParams from "../src/app/[lang]/generateStaticParams";

test("returns locales as lang objects", () => {
  expect(generateStaticParams()).toEqual([
    { lang: "en" },
    { lang: "de" },
  ]);
});
