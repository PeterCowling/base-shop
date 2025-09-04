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
    expect(validateShopName(" store-name_123 ")).toBe("store-name_123");
  });

  it("rejects invalid names", () => {
    for (const invalid of ["bad name", "bad/name", "bad@name"]) {
      expect(() => validateShopName(invalid)).toThrow(/Invalid shop name/);
    }
  });
});

describe("sanityBlog accessors", () => {
  it("adds and removes config", () => {
    const shop: Shop = {};
    const original = { ...shop };
    expect(getSanityConfig(shop)).toBeUndefined();

    const config: SanityBlogConfig = { projectId: "p", dataset: "d", token: "t" };
    const withConfig = setSanityConfig(shop, config);
    expect(Object.is(shop, withConfig)).toBe(false);
    expect(shop).toEqual(original);
    expect(getSanityConfig(withConfig)).toEqual(config);

    const beforeClear = { ...withConfig };
    const cleared = setSanityConfig(withConfig, undefined);
    expect(Object.is(withConfig, cleared)).toBe(false);
    expect(withConfig).toEqual(beforeClear);
    expect(getSanityConfig(cleared)).toBeUndefined();
    expect("sanityBlog" in cleared).toBe(false);
  });
});

describe("editorialBlog accessors", () => {
  it("adds and removes editorial blog", () => {
    const shop: Shop = {};
    const original = { ...shop };
    expect(getEditorialBlog(shop)).toBeUndefined();

    const editorial = { enabled: true };
    const withBlog = setEditorialBlog(shop, editorial);
    expect(Object.is(shop, withBlog)).toBe(false);
    expect(shop).toEqual(original);
    expect(getEditorialBlog(withBlog)).toEqual(editorial);

    const beforeClear = { ...withBlog };
    const cleared = setEditorialBlog(withBlog, undefined);
    expect(Object.is(withBlog, cleared)).toBe(false);
    expect(withBlog).toEqual(beforeClear);
    expect(getEditorialBlog(cleared)).toBeUndefined();
    expect("editorialBlog" in cleared).toBe(false);
  });
});

describe("domain accessors", () => {
  it("adds and removes domain", () => {
    const shop: Shop = {};
    const original = { ...shop };
    expect(getDomain(shop)).toBeUndefined();

    const domain: ShopDomain = { name: "shop.example.com" };
    const withDomain = setDomain(shop, domain);
    expect(Object.is(shop, withDomain)).toBe(false);
    expect(shop).toEqual(original);
    expect(getDomain(withDomain)).toEqual(domain);

    const beforeClear = { ...withDomain };
    const cleared = setDomain(withDomain, undefined);
    expect(Object.is(withDomain, cleared)).toBe(false);
    expect(withDomain).toEqual(beforeClear);
    expect(getDomain(cleared)).toBeUndefined();
    expect("domain" in cleared).toBe(false);
  });
});

