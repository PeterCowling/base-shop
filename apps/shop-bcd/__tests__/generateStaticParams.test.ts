// apps/shop-bcd/__tests__/generateStaticParams.test.ts
import generateStaticParams from "../src/app/[lang]/generateStaticParams";
import { LOCALES } from "@acme/i18n";

test("returns locales as lang objects", () => {
  expect(generateStaticParams()).toEqual(
    LOCALES.map((lang) => ({ lang }))
  );
});

