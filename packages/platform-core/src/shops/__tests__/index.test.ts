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
    expect(getSanityConfig(shop)).toBeUndefined();

    const config: SanityBlogConfig = { projectId: "p", dataset: "d", token: "t" };
    const withConfig = setSanityConfig(shop, config);
    expect(getSanityConfig(withConfig)).toEqual(config);

    const cleared = setSanityConfig(withConfig, undefined);
    expect(getSanityConfig(cleared)).toBeUndefined();
    expect("sanityBlog" in cleared).toBe(false);
  });
});

describe("editorialBlog accessors", () => {
  it("adds and removes editorial blog", () => {
    const shop: Shop = {};
    expect(getEditorialBlog(shop)).toBeUndefined();

    const editorial = { enabled: true };
    const withBlog = setEditorialBlog(shop, editorial);
    expect(getEditorialBlog(withBlog)).toEqual(editorial);

    const cleared = setEditorialBlog(withBlog, undefined);
    expect(getEditorialBlog(cleared)).toBeUndefined();
    expect("editorialBlog" in cleared).toBe(false);
  });
});

describe("domain accessors", () => {
  it("adds and removes domain", () => {
    const shop: Shop = {};
    expect(getDomain(shop)).toBeUndefined();

    const domain: ShopDomain = { name: "shop.example.com" };
    const withDomain = setDomain(shop, domain);
    expect(getDomain(withDomain)).toEqual(domain);

    const cleared = setDomain(withDomain, undefined);
    expect(getDomain(cleared)).toBeUndefined();
    expect("domain" in cleared).toBe(false);
  });
});

