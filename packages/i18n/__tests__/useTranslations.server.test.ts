import { useTranslations } from "../src/useTranslations";

describe("useTranslations (server)", () => {
  it("returns translations and falls back to key", async () => {
    const t = await useTranslations("de");
    expect(t("nav.home")).toBe("Startseite");
    expect(t("missing.key")).toBe("missing.key");
  });

  it("interpolates variables and falls back when missing", async () => {
    const tEn = await useTranslations("en" as any);
    expect(
      tEn("account.orders.detailsTitle", { id: 42 })
    ).toBe("Order 42");

    const tFr = await useTranslations("fr" as any);
    expect(
      tFr("account.orders.detailsTitle", { id: 7 })
    ).toBe("Order 7");

    expect(
      tEn("account.orders.detailsTitle", { other: "x" })
    ).toBe("Order {id}");
  });
});
