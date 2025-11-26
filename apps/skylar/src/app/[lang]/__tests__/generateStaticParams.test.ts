// apps/skylar/src/app/[lang]/__tests__/generateStaticParams.test.ts
import { LOCALES } from "@/lib/locales";
import { generateStaticParams } from "../generateStaticParams";

describe("generateStaticParams", () => {
  it("returns a params entry for every supported locale", () => {
    const params = generateStaticParams();
    expect(params).toEqual(LOCALES.map((lang) => ({ lang })));
  });
});

