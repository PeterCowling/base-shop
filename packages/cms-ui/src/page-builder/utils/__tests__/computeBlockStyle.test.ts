// packages/ui/src/components/cms/page-builder/utils/__tests__/computeBlockStyle.test.ts
import { computeBlockStyle } from "../computeBlockStyle";

describe("computeBlockStyle", () => {
  test("basic mapping and transform serialization", () => {
    const style = computeBlockStyle({
      transform: { x: 10, y: 20, scaleX: 1, scaleY: 1 },
      zIndex: 5,
      containerType: "inline-size",
      containerName: "pb",
      widthVal: "100%",
      heightVal: 240,
      marginVal: "1rem",
      paddingVal: "2rem",
      position: "relative",
      leftVal: "10px",
      topVal: "5px",
    });
    expect(style.transform).toContain("translate3d");
    expect(style.zIndex).toBe(5);
    expect(style.containerType).toBe("inline-size");
    expect(style.containerName).toBe("pb");
    expect(style.width).toBe("100%");
    expect(style.height).toBe(240);
    expect(style.margin).toBe("1rem");
    expect(style.padding).toBe("2rem");
    expect(style.position).toBe("relative");
    expect(style.left).toBe("10px");
    expect(style.top).toBe("5px");
  });

  test("absolute docking center sets auto margins and both sides", () => {
    const style = computeBlockStyle({
      transform: null,
      position: "absolute",
      dockX: "center",
      dockY: "center",
    });
    expect(style.left).toBe(0);
    expect(style.right).toBe(0);
    expect(style.marginLeft).toBe("auto");
    expect(style.marginRight).toBe("auto");
    expect(style.top).toBe(0);
    expect(style.bottom).toBe(0);
    expect(style.marginTop).toBe("auto");
    expect(style.marginBottom).toBe("auto");
  });

  test("scale-proportional computes aspect-ratio and sets width 100%", () => {
    const style = computeBlockStyle({
      transform: null,
      position: "relative",
      responsiveBehavior: "scale-proportional",
      widthVal: "200px",
      heightVal: 100,
    });
    expect(style.aspectRatio).toBe("200 / 100");
    expect(style.width).toBe("100%");
    expect(style.height).toBeUndefined();
  });
});

