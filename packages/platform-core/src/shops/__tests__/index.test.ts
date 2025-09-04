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
  it("accepts mixed case", () => {
    expect(validateShopName(" Store_Name-123 ")).toBe("Store_Name-123");
  });

  it("rejects names with spaces", () => {
    expect(() => validateShopName("bad name")).toThrow(/Invalid shop name/);
  });

  it("rejects empty or whitespace-only names", () => {
    for (const invalid of ["", " ", "\n\t"]) {
      expect(() => validateShopName(invalid)).toThrow(/Invalid shop name/);
    }
  });

  it("rejects names with special characters", () => {
    for (const invalid of ["bad/name", "bad@name", "bad$name"]) {
      expect(() => validateShopName(invalid)).toThrow(/Invalid shop name/);
    }
  });
});

describe("sanityBlog accessors", () => {
  it("returns undefined for empty shop", () => {
    expect(getSanityConfig({} as Shop)).toBeUndefined();
  });

  it("clones when clearing absent config", () => {
    const shop: Shop = { other: true };
    const result = setSanityConfig(shop, undefined);
    expect(result).not.toBe(shop);
    expect(result).toEqual(shop);
    expect("sanityBlog" in result).toBe(false);
  });

  it("adds and removes config", () => {
    const shop: Shop = { other: true };
    const original = { ...shop };
    expect(getSanityConfig(shop)).toBeUndefined();

    const config: SanityBlogConfig = { projectId: "p", dataset: "d", token: "t" };
    const withConfig = setSanityConfig(shop, config);
    expect(Object.is(shop, withConfig)).toBe(false);
    expect(shop).toEqual(original);
    expect(withConfig.other).toBe(true);
    expect(getSanityConfig(withConfig)).toEqual(config);

    const beforeClear = { ...withConfig };
    const cleared = setSanityConfig(withConfig, undefined);
    expect(Object.is(withConfig, cleared)).toBe(false);
    expect(withConfig).toEqual(beforeClear);
    expect(cleared.other).toBe(true);
    expect(getSanityConfig(cleared)).toBeUndefined();
    expect("sanityBlog" in cleared).toBe(false);
  });
});

describe("editorialBlog accessors", () => {
  it("returns undefined for empty shop", () => {
    expect(getEditorialBlog({} as Shop)).toBeUndefined();
  });

  it("clones when clearing absent blog", () => {
    const shop: Shop = { other: true };
    const result = setEditorialBlog(shop, undefined);
    expect(result).not.toBe(shop);
    expect(result).toEqual(shop);
    expect("editorialBlog" in result).toBe(false);
  });

  it("adds and removes editorial blog", () => {
    const shop: Shop = { other: true };
    const original = { ...shop };
    expect(getEditorialBlog(shop)).toBeUndefined();

    const editorial = { enabled: true };
    const withBlog = setEditorialBlog(shop, editorial);
    expect(Object.is(shop, withBlog)).toBe(false);
    expect(shop).toEqual(original);
    expect(withBlog.other).toBe(true);
    expect(getEditorialBlog(withBlog)).toEqual(editorial);

    const beforeClear = { ...withBlog };
    const cleared = setEditorialBlog(withBlog, undefined);
    expect(Object.is(withBlog, cleared)).toBe(false);
    expect(withBlog).toEqual(beforeClear);
    expect(cleared.other).toBe(true);
    expect(getEditorialBlog(cleared)).toBeUndefined();
    expect("editorialBlog" in cleared).toBe(false);
  });
});

describe("domain accessors", () => {
  it("returns undefined for empty shop", () => {
    expect(getDomain({} as Shop)).toBeUndefined();
  });

  it("clones when clearing absent domain", () => {
    const shop: Shop = { other: true };
    const result = setDomain(shop, undefined);
    expect(result).not.toBe(shop);
    expect(result).toEqual(shop);
    expect("domain" in result).toBe(false);
  });

  it("adds and removes domain", () => {
    const shop: Shop = { other: true };
    const original = { ...shop };
    expect(getDomain(shop)).toBeUndefined();

    const domain: ShopDomain = { name: "shop.example.com" };
    const withDomain = setDomain(shop, domain);
    expect(Object.is(shop, withDomain)).toBe(false);
    expect(shop).toEqual(original);
    expect(withDomain.other).toBe(true);
    expect(getDomain(withDomain)).toEqual(domain);

    const beforeClear = { ...withDomain };
    const cleared = setDomain(withDomain, undefined);
    expect(Object.is(withDomain, cleared)).toBe(false);
    expect(withDomain).toEqual(beforeClear);
    expect(cleared.other).toBe(true);
    expect(getDomain(cleared)).toBeUndefined();
    expect("domain" in cleared).toBe(false);
  });
});

