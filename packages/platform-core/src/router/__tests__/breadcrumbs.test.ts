import { getBreadcrumbs } from "../breadcrumbs";

describe("getBreadcrumbs", () => {
  it("splits pathname into crumbs with Home root", () => {
    const crumbs = getBreadcrumbs("/a/b-c_d?x=1#hash");
    expect(crumbs).toEqual([
      { href: "/", label: "Home" },
      { href: "/a", label: "a" },
      { href: "/a/b-c_d", label: "b c d" },
    ]);
  });

  it("uses provided title for last crumb", () => {
    const crumbs = getBreadcrumbs("/shop/item-1", "Item 1");
    expect(crumbs[crumbs.length - 1].label).toBe("Item 1");
  });
});

