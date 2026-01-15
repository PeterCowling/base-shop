import type { ProductConfigSchema } from "@acme/product-configurator";
import { act, renderHook, waitFor } from "@testing-library/react";

import { useTieredProductAsset } from "../src/viewer/assets/useTieredProductAsset";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const originalUserAgent = navigator.userAgent;
const originalDeviceMemory = (navigator as Navigator & { deviceMemory?: number })
  .deviceMemory;
const hadDeviceMemory = Object.prototype.hasOwnProperty.call(navigator, "deviceMemory");

const setNavigator = ({
  userAgent,
  deviceMemory,
}: {
  userAgent?: string;
  deviceMemory?: number;
}) => {
  if (userAgent) {
    Object.defineProperty(navigator, "userAgent", {
      value: userAgent,
      configurable: true,
    });
  }
  if (typeof deviceMemory !== "undefined") {
    Object.defineProperty(navigator, "deviceMemory", {
      value: deviceMemory,
      configurable: true,
    });
  }
};

const restoreNavigator = () => {
  Object.defineProperty(navigator, "userAgent", {
    value: originalUserAgent,
    configurable: true,
  });
  if (hadDeviceMemory) {
    Object.defineProperty(navigator, "deviceMemory", {
      value: originalDeviceMemory,
      configurable: true,
    });
  } else {
    delete (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
  }
};

afterEach(() => {
  restoreNavigator();
});

describe("useTieredProductAsset", () => {
  it("detects mobile devices and allows preferred tier overrides", async () => {
    setNavigator({
      userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)",
      deviceMemory: 2,
    });

    const schema: ProductConfigSchema = {
      productId: "bag",
      version: "1.0.0",
      assets: {
        version: "1.0.0",
        base: {
          tiers: { desktop: "desktop.glb", mobile: "mobile.glb" },
        },
      },
      regions: [],
      properties: [],
    };

    const { result } = renderHook(() => useTieredProductAsset("bag", { schema }));

    await waitFor(() => expect(result.current.deviceTier).toBe("mobile"));
    expect(result.current.effectiveTier).toBe("mobile");
    expect(result.current.hdAllowed).toBe(false);
    expect(result.current.modelUrl).toBe("/api/products/bag/assets/mobile.glb");

    act(() => {
      result.current.setPreferredTier("desktop");
    });

    expect(result.current.effectiveTier).toBe("desktop");
    expect(result.current.hdAllowed).toBe(false);
    expect(result.current.modelUrl).toBe("/api/products/bag/assets/desktop.glb");
  });

  it("resolves parts, slots, and hidden meshes from selections", async () => {
    setNavigator({ userAgent: "Mozilla/5.0", deviceMemory: 8 });

    const schema: ProductConfigSchema = {
      productId: "bag-1",
      version: "1.0.0",
      assets: {
        version: "1.0.0",
        base: {
          tiers: {
            desktop: "assets/base/desktop.glb",
            mobile: "/assets/base/mobile.glb",
          },
          slots: {
            body: "BodySlot",
            handle: "HandleSlot",
            hardware: "HardwareSlotBase",
          },
        },
        parts: {
          body: {
            defaultVariant: "black",
            hideBaseMeshes: ["BodyBase"],
            variants: {
              black: { tiers: { desktop: "assets/body_black.glb" } },
              cream: {
                tiers: {
                  desktop: "assets/body_cream.glb",
                  mobile: "assets/body_cream_mobile.glb",
                },
              },
            },
          },
          handle: {
            defaultVariant: "short",
            variants: {
              short: { tiers: { desktop: "assets/handle_short.glb" } },
              long: { tiers: { desktop: "assets/handle_long.glb" } },
            },
          },
          hardware: {
            defaultVariant: "gold",
            variants: {
              gold: {
                tiers: { desktop: "assets/hardware_gold.glb" },
                slot: "HardwareSlot",
              },
            },
          },
        },
        selectionBindings: [{ match: { strap: "none" }, set: { handle: null } }],
        hdri: "assets/hdri/test.hdr",
        poster: "/assets/poster/test.jpg",
      },
      regions: [{ regionId: "body", displayName: "Body" }],
      properties: [
        {
          key: "color",
          displayName: "Color",
          regionId: "body",
          type: "enum",
          values: [
            {
              value: "black",
              label: "Black",
              assetBindings: [{ partId: "body", variantId: "black" }],
            },
            {
              value: "cream",
              label: "Cream",
              assetBindings: [{ partId: "body", variantId: "cream" }],
            },
          ],
          defaultValue: "black",
        },
      ],
    };

    const { result } = renderHook(() =>
      useTieredProductAsset("bag-1", {
        schema,
        selections: { color: "cream", strap: "none" },
      }),
    );

    await waitFor(() => expect(result.current.deviceTier).toBe("desktop"));

    expect(result.current.modelUrl).toBe(
      "/api/products/bag-1/assets/base/desktop.glb",
    );
    expect(result.current.hdriUrl).toBe("/api/products/bag-1/assets/hdri/test.hdr");
    expect(result.current.posterUrl).toBe("/api/products/bag-1/assets/poster/test.jpg");
    expect(result.current.parts).toEqual([
      {
        id: "body",
        variantId: "cream",
        url: "/api/products/bag-1/assets/body_cream.glb",
        slotName: "BodySlot",
      },
      {
        id: "hardware",
        variantId: "gold",
        url: "/api/products/bag-1/assets/hardware_gold.glb",
        slotName: "HardwareSlot",
      },
    ]);
    expect(result.current.hideBaseMeshPatterns).toEqual(["BodyBase"]);

    act(() => {
      result.current.setPreferredTier("mobile");
    });

    expect(result.current.effectiveTier).toBe("mobile");
    expect(result.current.modelUrl).toBe(
      "/api/products/bag-1/assets/base/mobile.glb",
    );
    expect(result.current.parts).toEqual([
      {
        id: "body",
        variantId: "cream",
        url: "/api/products/bag-1/assets/body_cream_mobile.glb",
        slotName: "BodySlot",
      },
      {
        id: "hardware",
        variantId: "gold",
        url: "/api/products/bag-1/assets/hardware_gold.glb",
        slotName: "HardwareSlot",
      },
    ]);
  });

  it("falls back to default asset paths when no manifest exists", async () => {
    setNavigator({ userAgent: "Mozilla/5.0", deviceMemory: 8 });

    const { result } = renderHook(() => useTieredProductAsset("bag-2"));

    await waitFor(() => expect(result.current.deviceTier).toBe("desktop"));
    expect(result.current.modelUrl).toBe("/api/products/bag-2/assets/desktop.glb");
    expect(result.current.hdriUrl).toBe(
      "/api/products/bag-2/assets/hdri/studio_01.hdr",
    );
    expect(result.current.posterUrl).toBe("/api/products/bag-2/assets/poster.jpg");
    expect(result.current.parts).toEqual([]);
    expect(result.current.hideBaseMeshPatterns).toEqual([]);
  });
});
