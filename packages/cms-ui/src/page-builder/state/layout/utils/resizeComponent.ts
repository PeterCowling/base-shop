import type { PageComponent } from "@acme/types";

export function resizeComponent(
  list: PageComponent[],
  id: string,
  patch: {
    width?: string;
    height?: string;
    left?: string;
    top?: string;
    right?: string;
    bottom?: string;
    leftDesktop?: string;
    leftTablet?: string;
    leftMobile?: string;
    topDesktop?: string;
    topTablet?: string;
    topMobile?: string;
    widthDesktop?: string;
    widthTablet?: string;
    widthMobile?: string;
    heightDesktop?: string;
    heightTablet?: string;
    heightMobile?: string;
    marginDesktop?: string;
    marginTablet?: string;
    marginMobile?: string;
    paddingDesktop?: string;
    paddingTablet?: string;
    paddingMobile?: string;
  },
): PageComponent[] {
  return list.map((c) => {
    if (c.id === id) return { ...c, ...patch } as PageComponent;
    if ("children" in c && Array.isArray(c.children)) {
      return { ...c, children: resizeComponent(c.children, id, patch) } as PageComponent;
    }
    return c;
  });
}

