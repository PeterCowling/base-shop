import type { PageComponent } from "@acme/types";
import {
  alignLeft,
  alignTop,
  alignRight,
  alignBottom,
  alignCenterX,
  alignCenterY,
  distributeHorizontal,
  distributeVertical,
} from "../layout/geometry";

describe("geometry alignment and distribution", () => {
  const make = (id: string, left: string, top: string, width: string, height: string): PageComponent =>
    ({ id, type: "Box", left, top, width, height } as any);

  const a = make("a", "0px", "0px", "100px", "50px");
  const b = make("b", "50px", "25px", "100px", "50px");
  const c = make("c", "200px", "80px", "100px", "50px");
  const list = [a, b, c];

  it("aligns left edges to minX", () => {
    const patches = alignLeft(list, ["a", "b", "c"]);
    expect(patches).toEqual([
      { id: "a", left: "0px" },
      { id: "b", left: "0px" },
      { id: "c", left: "0px" },
    ]);
  });

  it("aligns top edges to minY", () => {
    const patches = alignTop(list, ["a", "b", "c"]);
    expect(patches).toEqual([
      { id: "a", top: "0px" },
      { id: "b", top: "0px" },
      { id: "c", top: "0px" },
    ]);
  });

  it("aligns right edges to maxX", () => {
    const patches = alignRight(list, ["a", "b", "c"]);
    // Bounds: maxX = max(left+width) = max(100,150,300) = 300
    expect(patches).toEqual([
      { id: "a", left: "200px" },
      { id: "b", left: "200px" },
      { id: "c", left: "200px" },
    ]);
  });

  it("aligns bottom edges to maxY", () => {
    const patches = alignBottom(list, ["a", "b", "c"]);
    // Bounds: maxY = max(top+height) = max(50,75,130) = 130
    expect(patches).toEqual([
      { id: "a", top: "80px" },
      { id: "b", top: "80px" },
      { id: "c", top: "80px" },
    ]);
  });

  it("centers horizontally within selection bounds", () => {
    const patches = alignCenterX(list, ["a", "b", "c"]);
    // Bounds: [minX=0, maxX=300] => cx=150; each width=100 => left=cx-50=100
    expect(patches).toEqual([
      { id: "a", left: "100px" },
      { id: "b", left: "100px" },
      { id: "c", left: "100px" },
    ]);
  });

  it("centers vertically within selection bounds", () => {
    const patches = alignCenterY(list, ["a", "b", "c"]);
    // Bounds: [minY=0, maxY=130] => cy=65; each height=50 => top=cy-25=40
    expect(patches).toEqual([
      { id: "a", top: "40px" },
      { id: "b", top: "40px" },
      { id: "c", top: "40px" },
    ]);
  });

  it("distributes horizontally with equal gaps for 3+ items", () => {
    // Three 100px wide items across bounds [0,300] -> total width 300, gap 0
    const patches = distributeHorizontal(list, ["a", "b", "c"]);
    expect(patches).toEqual([
      { id: "a", left: "0px" },
      { id: "b", left: "100px" },
      { id: "c", left: "200px" },
    ]);
  });

  it("distributes vertically with equal gaps for 3+ items", () => {
    // Heights 50 over bounds [0,130] -> gap (130-150)/(3-1) = -10; sequence increments by 40
    const patches = distributeVertical(list, ["a", "b", "c"]);
    expect(patches).toEqual([
      { id: "a", top: "0px" },
      { id: "b", top: "40px" },
      { id: "c", top: "80px" },
    ]);
  });
});
