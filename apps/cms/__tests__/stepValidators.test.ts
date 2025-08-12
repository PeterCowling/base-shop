import { validators } from "../src/app/cms/configurator/hooks/useStepCompletion";
import { wizardStateSchema } from "../src/app/cms/wizard/schema";
import { fillLocales } from "@i18n/fillLocales";

describe("step validators", () => {
  const base = wizardStateSchema.parse({});

  it("shop-details requires id and name", () => {
    expect(validators["shop-details"](base)).toBe(false);
  });

  it("theme requires selection", () => {
    expect(validators.theme(base)).toBe(false);
  });

  it("tokens require theme variables", () => {
    const state = { ...base, themeVars: {} };
    expect(validators.tokens(state)).toBe(false);
  });

  it("options require analytics id when provider set", () => {
    const state = { ...base, analyticsProvider: "ga", analyticsId: "" };
    expect(validators.options(state)).toBe(false);
  });

  it("navigation requires items", () => {
    const state = { ...base, navItems: [] };
    expect(validators.navigation(state)).toBe(false);
  });

  it("layout requires header and footer", () => {
    expect(validators.layout(base)).toBe(false);
  });

  it("home page requires id", () => {
    expect(validators["home-page"](base)).toBe(false);
  });

  it("checkout page requires id", () => {
    expect(validators["checkout-page"](base)).toBe(false);
  });

  it("shop page requires id", () => {
    expect(validators["shop-page"](base)).toBe(false);
  });

  it("product page requires id", () => {
    expect(validators["product-page"](base)).toBe(false);
  });

  it("additional pages require slugs", () => {
    const state = {
      ...base,
      pages: [
        {
          slug: "",
          title: fillLocales(undefined, ""),
          description: fillLocales(undefined, ""),
          image: fillLocales(undefined, ""),
          components: [],
        },
      ],
    };
    expect(validators["additional-pages"](state)).toBe(false);
  });

  it("env vars require values", () => {
    expect(validators["env-vars"](base)).toBe(false);
  });

  it("summary requires title and description", () => {
    expect(validators.summary(base)).toBe(false);
  });

  it("import data requires categories", () => {
    expect(validators["import-data"](base)).toBe(false);
  });

  it("seed data requires categories", () => {
    expect(validators["seed-data"](base)).toBe(false);
  });

  it("hosting requires domain", () => {
    expect(validators.hosting(base)).toBe(false);
  });
});
