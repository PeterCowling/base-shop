import { computeBlockStyle } from "../computeBlockStyle";
import { CSS } from "@dnd-kit/utilities";

describe("computeBlockStyle", () => {
  it("includes transform, zIndex, container queries and box model", () => {
    const transform = { x: 10, y: 20, scaleX: 1, scaleY: 1 } as const;
    const style = computeBlockStyle({
      transform,
      zIndex: 5,
      containerType: "inline-size",
      containerName: "pb-container",
      widthVal: "100px",
      heightVal: "200px",
      marginVal: "1rem",
      paddingVal: "2rem",
      position: "relative",
      leftVal: "4px",
      topVal: "3px",
    });
    expect(style.transform).toBe(CSS.Transform.toString(transform));
    expect(style.zIndex).toBe(5);
    expect(style.containerType).toBe("inline-size");
    expect(style.containerName).toBe("pb-container");
    expect(style.width).toBe("100px");
    expect(style.height).toBe("200px");
    expect(style.margin).toBe("1rem");
    expect(style.padding).toBe("2rem");
    expect(style.position).toBe("relative");
    expect(style.left).toBe("4px");
    expect(style.top).toBe("3px");
  });

  it("applies centered docking for absolute positioning", () => {
    const styleX = computeBlockStyle({
      transform: null,
      position: "absolute",
      dockX: "center",
    });
    expect(styleX.left).toBe(0);
    expect(styleX.right).toBe(0);
    expect(styleX.marginLeft).toBe("auto");
    expect(styleX.marginRight).toBe("auto");

    const styleY = computeBlockStyle({
      transform: null,
      position: "absolute",
      dockY: "center",
    });
    expect(styleY.top).toBe(0);
    expect(styleY.bottom).toBe(0);
    expect(styleY.marginTop).toBe("auto");
    expect(styleY.marginBottom).toBe("auto");
  });

  it("respects left/top values for absolute non-centered docking", () => {
    const s = computeBlockStyle({
      transform: null,
      position: "absolute",
      dockX: "left",
      dockY: "top",
      leftVal: "12px",
      topVal: "8px",
    });
    expect(s.left).toBe("12px");
    expect(s.top).toBe("8px");
  });
});

