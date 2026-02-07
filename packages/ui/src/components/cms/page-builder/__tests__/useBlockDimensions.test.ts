import { renderHook } from "@testing-library/react";

import type { PageComponent } from "@acme/types";

import useBlockDimensions from "../useBlockDimensions";

describe("useBlockDimensions", () => {
  const component = {
    id: "1",
    type: "Text",
    width: "100px",
    widthDesktop: "200px",
    widthTablet: "150px",
    widthMobile: "120px",
    height: "50px",
    heightDesktop: "100px",
    heightTablet: "80px",
    heightMobile: "60px",
    margin: "m-1",
    marginDesktop: "m-2",
    marginTablet: "m-3",
    marginMobile: "m-4",
    padding: "p-1",
    paddingDesktop: "p-2",
    paddingTablet: "p-3",
    paddingMobile: "p-4",
  } as unknown as PageComponent;

  it.each([
    [
      "desktop",
      "widthDesktop",
      "heightDesktop",
      "marginDesktop",
      "paddingDesktop",
      "200px",
      "100px",
      "m-2",
      "p-2",
    ],
    [
      "tablet",
      "widthTablet",
      "heightTablet",
      "marginTablet",
      "paddingTablet",
      "150px",
      "80px",
      "m-3",
      "p-3",
    ],
    [
      "mobile",
      "widthMobile",
      "heightMobile",
      "marginMobile",
      "paddingMobile",
      "120px",
      "60px",
      "m-4",
      "p-4",
    ],
  ])(
    "returns keys and values for %s viewport",
    (
      viewport,
      widthKey,
      heightKey,
      marginKey,
      paddingKey,
      widthVal,
      heightVal,
      marginVal,
      paddingVal,
    ) => {
      const { result } = renderHook(() =>
        useBlockDimensions({ component, viewport: viewport as "mobile" | "desktop" | "tablet" })
      );

      expect(result.current.widthKey).toBe(widthKey);
      expect(result.current.heightKey).toBe(heightKey);
      expect(result.current.marginKey).toBe(marginKey);
      expect(result.current.paddingKey).toBe(paddingKey);
      expect(result.current.widthVal).toBe(widthVal);
      expect(result.current.heightVal).toBe(heightVal);
      expect(result.current.marginVal).toBe(marginVal);
      expect(result.current.paddingVal).toBe(paddingVal);
    }
  );

  it("falls back to global values when viewport-specific values are undefined", () => {
    const basic = {
      id: "2",
      type: "Text",
      width: "75px",
      height: "40px",
      margin: "m-5",
      padding: "p-5",
    } as unknown as PageComponent;

    ( ["desktop", "tablet", "mobile"] as const ).forEach((viewport) => {
      const { result } = renderHook(() =>
        useBlockDimensions({ component: basic, viewport })
      );

      expect(result.current.widthVal).toBe("75px");
      expect(result.current.heightVal).toBe("40px");
      expect(result.current.marginVal).toBe("m-5");
      expect(result.current.paddingVal).toBe("p-5");
    });
  });
});

