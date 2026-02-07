import {
  alignBottom,
  alignCenterX,
  alignCenterY,
  alignLeft,
  alignRight,
  alignTop,
  distributeHorizontal,
  distributeVertical,
} from "../geometry";

type PC = any;

const comps: PC[] = [
  { id: "a", type: "Box", left: "0px", top: "0px", width: "100px", height: "100px" },
  { id: "b", type: "Box", left: "150px", top: "20px", width: "50px", height: "60px" },
  { id: "c", type: "Box", left: "250px", top: "40px", width: "80px", height: "30px" },
];

describe("geometry alignment", () => {
  it("aligns left and top to the minimal edge", () => {
    expect(alignLeft(comps as PC[], ["a","b","c"]).map(p => p.left)).toEqual(["0px","0px","0px"]);
    expect(alignTop(comps as PC[], ["a","b","c"]).map(p => p.top)).toEqual(["0px","0px","0px"]);
  });

  it("aligns right and bottom using widths/heights", () => {
    const right = alignRight(comps as PC[], ["a","b","c"]);
    // maxX = max(left+width) = max(0+100, 150+50, 250+80) = 330
    // a: left = 330-100=230, b: 330-50=280, c: 330-80=250
    expect(right).toEqual([{ id:"a", left:"230px" }, { id:"b", left:"280px" }, { id:"c", left:"250px" }]);

    const bottom = alignBottom(comps as PC[], ["a","b","c"]);
    // maxY = max(top+height) = max(0+100, 20+60, 40+30) = 100
    // a: top=0, b: top=40, c: top=70
    expect(bottom).toEqual([{ id:"a", top:"0px" }, { id:"b", top:"40px" }, { id:"c", top:"70px" }]);
  });

  it("centers horizontally and vertically", () => {
    const cx = alignCenterX(comps as PC[], ["a","b","c"]);
    // minX=0 maxX=330 => cx=165; a left=115; b left=140; c left=125
    expect(cx).toEqual([{ id:"a", left:"115px" }, { id:"b", left:"140px" }, { id:"c", left:"125px" }]);
    const cy = alignCenterY(comps as PC[], ["a","b","c"]);
    // minY=0 maxY=100 => cy=50; a top=0; b top=20; c top=35
    expect(cy).toEqual([{ id:"a", top:"0px" }, { id:"b", top:"20px" }, { id:"c", top:"35px" }]);
  });

  it("distributes evenly on x and y", () => {
    const dh = distributeHorizontal(comps as PC[], ["a","b","c"]);
    // sorted by left: a(0,100), b(150,50), c(250,80)
    // minX=0 maxX=330 totalWidth=230 -> gap=(330-0-230)/2 = 50
    // positions: a=0, b=0+100+50=150, c=150+50+50=250
    expect(dh).toEqual([{ id:"a", left:"0px" }, { id:"b", left:"150px" }, { id:"c", left:"250px" }]);
    const dv = distributeVertical(comps as PC[], ["a","b","c"]);
    // sorted by top: a(0,100), b(20,60), c(40,30)
    // minY=0 maxY=100 totalHeight=190 -> gap=(100-0-190)/2 = -45 (overlap -> still consistent math)
    // positions: a=0, b=0+100-45=55, c=55+60-45=70
    expect(dv).toEqual([{ id:"a", top:"0px" }, { id:"b", top:"55px" }, { id:"c", top:"70px" }]);
  });

  it("supports per-viewport values when provided", () => {
    const vpComps: PC[] = [
      { id: "x", type: "Box", leftDesktop: "10px", topDesktop: "20px", widthDesktop: "30px", heightDesktop: "40px" },
      { id: "y", type: "Box", leftDesktop: "50px", topDesktop: "60px", widthDesktop: "10px", heightDesktop: "20px" },
      { id: "z", type: "Box", leftDesktop: "100px", topDesktop: "70px", widthDesktop: "20px", heightDesktop: "10px" },
    ];
    const patches = alignLeft(vpComps, ["x","y","z"], "desktop");
    expect(patches.map(p => p.left)).toEqual(["10px","10px","10px"]);
  });
});

