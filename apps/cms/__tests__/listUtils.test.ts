import { toggle } from "../src/app/cms/wizard/listUtils";

describe("listUtils", () => {
  it("adds an item that is not present", () => {
    expect(toggle(["a"], "b")).toEqual(["a", "b"]);
  });

  it("removes an existing item", () => {
    expect(toggle(["a", "b"], "a")).toEqual(["b"]);
  });
});
