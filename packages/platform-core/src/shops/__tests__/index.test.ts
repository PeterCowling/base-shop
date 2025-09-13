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

  it("accepts uppercase characters", () => {
    expect(validateShopName("Valid_Name")).toBe("Valid_Name");
  });

  it("rejects mixed invalid input", () => {
    expect(() => validateShopName("Invalid Name!")).toThrow(/Invalid shop name/);
  });

  it("trims leading and trailing whitespace", () => {
    expect(validateShopName("  shop  ")).toBe("shop");
  });

  it("rejects whitespace-only names", () => {
    for (const bad of ["", " ", "\t", "\n"]) {
      expect(() => validateShopName(bad)).toThrow(/Invalid shop name/);
    }
  });

  it("rejects names with disallowed symbols", () => {
    for (const bad of ["bad$name", "bad%name", "bad*name"]) {
      expect(() => validateShopName(bad)).toThrow(/Invalid shop name/);
    }
  });

  it("throws for invalid names", () => {
    for (const bad of [
      "bad name",
      "bad/name",
      "bad!name",
      "bad@name",
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
    // Original object remains unchanged
    expect(getSanityConfig(base)).toBeUndefined();

    const cleared = setSanityConfig(withConfig, undefined);
    expect(cleared).not.toBe(withConfig);
    expect(getSanityConfig(cleared)).toBeUndefined();
    expect(cleared).not.toHaveProperty("sanityBlog");
    // Previous object remains unchanged
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
    // Original object remains unchanged
    expect(getEditorialBlog(base)).toBeUndefined();

    const cleared = setEditorialBlog(withBlog, undefined);
    expect(cleared).not.toBe(withBlog);
    expect(getEditorialBlog(cleared)).toBeUndefined();
    expect(cleared).not.toHaveProperty("editorialBlog");
    // Previous object remains unchanged
    expect(getEditorialBlog(withBlog)).toEqual(editorial);
  });
});

describe("getDomain", () => {
  it("returns undefined when no domain is set", () => {
    expect(getDomain({} as Shop)).toBeUndefined();
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
    // Original object remains unchanged
    expect(getDomain(base)).toBeUndefined();

    const cleared = setDomain(withDomain, undefined);
    expect(cleared).not.toBe(withDomain);
    expect(getDomain(cleared)).toBeUndefined();
    expect(cleared).not.toHaveProperty("domain");
    // Previous object remains unchanged
    expect(getDomain(withDomain)).toEqual(domain);
  });

  it("removes existing domain and preserves other fields", () => {
    const base: Shop = {
      domain: { name: "old.example.com" },
      other: "keep",
    };
    const cleared = setDomain(base, undefined);
    expect(cleared).not.toBe(base);
    expect(getDomain(cleared)).toBeUndefined();
    expect(cleared).not.toHaveProperty("domain");
    expect((cleared as Shop).other).toBe("keep");
    // Original object remains unchanged
    expect(getDomain(base)).toEqual({ name: "old.example.com" });
  });

  it("replaces existing domain when a new one is provided", () => {
    const base: Shop = { domain: { name: "old.example.com" } };
    const newDomain: ShopDomain = { name: "new.example.com" };
    const updated = setDomain(base, newDomain);
    expect(updated).not.toBe(base);
    expect(getDomain(updated)).toEqual(newDomain);
    // Original object remains unchanged
    expect(getDomain(base)).toEqual({ name: "old.example.com" });
  });
});
