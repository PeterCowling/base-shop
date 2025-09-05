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
  it("returns trimmed shop name for valid input", () => {
    expect(validateShopName(" My_Shop-123 ")).toBe("My_Shop-123");
  });

  it("throws for invalid names", () => {
    for (const bad of ["bad name", "bad/name", "", " "]) {
      expect(() => validateShopName(bad)).toThrow(/Invalid shop name/);
    }
  });
});

describe("setSanityConfig", () => {
  it("adds and removes Sanity config", () => {
    const base: Shop = { other: true };
    const config: SanityBlogConfig = { projectId: "p", dataset: "d", token: "t" };

    const withConfig = setSanityConfig(base, config);
    expect(withConfig).not.toBe(base);
    expect(getSanityConfig(withConfig)).toEqual(config);

    const cleared = setSanityConfig(withConfig, undefined);
    expect(cleared).not.toBe(withConfig);
    expect(getSanityConfig(cleared)).toBeUndefined();
    expect("sanityBlog" in cleared).toBe(false);
    expect(getSanityConfig(withConfig)).toEqual(config);
  });
});

describe("setEditorialBlog", () => {
  it("adds and removes editorial blog", () => {
    const base: Shop = { other: true };
    const editorial = { enabled: true };

    const withBlog = setEditorialBlog(base, editorial);
    expect(withBlog).not.toBe(base);
    expect(getEditorialBlog(withBlog)).toEqual(editorial);

    const cleared = setEditorialBlog(withBlog, undefined);
    expect(cleared).not.toBe(withBlog);
    expect(getEditorialBlog(cleared)).toBeUndefined();
    expect("editorialBlog" in cleared).toBe(false);
    expect(getEditorialBlog(withBlog)).toEqual(editorial);
  });
});

describe("setDomain", () => {
  it("adds and removes domain", () => {
    const base: Shop = { other: true };
    const domain: ShopDomain = { name: "shop.example.com" };

    const withDomain = setDomain(base, domain);
    expect(withDomain).not.toBe(base);
    expect(getDomain(withDomain)).toEqual(domain);

    const cleared = setDomain(withDomain, undefined);
    expect(cleared).not.toBe(withDomain);
    expect(getDomain(cleared)).toBeUndefined();
    expect("domain" in cleared).toBe(false);
    expect(getDomain(withDomain)).toEqual(domain);
  });
});
