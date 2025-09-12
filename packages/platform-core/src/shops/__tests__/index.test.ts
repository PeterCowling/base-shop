import {
  validateShopName,
  getSanityConfig,
  setSanityConfig,
  getEditorialBlog,
  setEditorialBlog,
  getDomain,
  setDomain,
  type Shop,
  type SanityBlogConfig,
  type ShopDomain,
} from "../index";

describe("validateShopName", () => {
  it("accepts valid names", () => {
    expect(validateShopName("shop-name_123")).toBe("shop-name_123");
  });

  it("trims leading and trailing whitespace", () => {
    expect(validateShopName("  shop  ")).toBe("shop");
  });

  it("throws for invalid names", () => {
    for (const bad of [
      "bad name",
      "bad/name",
      "bad!name",
      "bad@name",
      "",
      " ",
    ]) {
      expect(() => validateShopName(bad)).toThrow(/Invalid shop name/);
    }
  });
});

describe("setSanityConfig", () => {
  it("adds and removes Sanity config", () => {
    const base: Shop = { other: true };
    const config: SanityBlogConfig = {
      projectId: "p",
      dataset: "d",
      token: "t",
    };

    expect(getSanityConfig(base)).toBeUndefined();
    const withConfig = setSanityConfig(base, config);
    expect(withConfig).not.toBe(base);
    expect(getSanityConfig(withConfig)).toEqual(config);
    expect(withConfig).toHaveProperty("sanityBlog", config);

    const cleared = setSanityConfig(withConfig, undefined);
    expect(cleared).not.toBe(withConfig);
    expect(getSanityConfig(cleared)).toBeUndefined();
    expect(cleared).not.toHaveProperty("sanityBlog");
    expect(getSanityConfig(withConfig)).toEqual(config);
  });
});

describe("setEditorialBlog", () => {
  it("adds and removes editorial blog", () => {
    const base: Shop = { other: true };
    const editorial = { enabled: true };

    expect(getEditorialBlog(base)).toBeUndefined();
    const withBlog = setEditorialBlog(base, editorial);
    expect(withBlog).not.toBe(base);
    expect(getEditorialBlog(withBlog)).toEqual(editorial);
    expect(withBlog).toHaveProperty("editorialBlog", editorial);

    const cleared = setEditorialBlog(withBlog, undefined);
    expect(cleared).not.toBe(withBlog);
    expect(getEditorialBlog(cleared)).toBeUndefined();
    expect(cleared).not.toHaveProperty("editorialBlog");
    expect(getEditorialBlog(withBlog)).toEqual(editorial);
  });
});

describe("setDomain", () => {
  it("adds and removes domain", () => {
    const base: Shop = { other: true };
    const domain: ShopDomain = { name: "shop.example.com" };

    expect(getDomain(base)).toBeUndefined();
    const withDomain = setDomain(base, domain);
    expect(withDomain).not.toBe(base);
    expect(getDomain(withDomain)).toEqual(domain);
    expect(withDomain).toHaveProperty("domain", domain);

    const cleared = setDomain(withDomain, undefined);
    expect(cleared).not.toBe(withDomain);
    expect(getDomain(cleared)).toBeUndefined();
    expect(cleared).not.toHaveProperty("domain");
    expect(getDomain(withDomain)).toEqual(domain);
  });
});
