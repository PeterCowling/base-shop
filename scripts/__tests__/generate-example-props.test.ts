import { join } from "node:path";

const fsMock = {
  mkdirSync: jest.fn(),
  writeFileSync: jest.fn(),
};

jest.mock("node:fs", () => fsMock);

describe("generate-example-props", () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it("writes merged example props", async () => {
    jest.doMock("../src/component-names", () => ({
      getComponentNameMap: () => ({
        "atoms/Button.tsx": "Button",
        "molecules/Breadcrumbs.tsx": "Breadcrumbs",
        "atoms/Icon.tsx": "Icon",
        "atoms/Price.tsx": "Price",
        "atoms/RatingStars.tsx": "RatingStars",
        "atoms/StockStatus.tsx": "StockStatus",
        "molecules/SearchBar.tsx": "SearchBar",
        "atoms/Foo.tsx": "Foo",
      }),
    }));

    const { generateExampleProps } = await import(
      "../src/generate-example-props"
    );

    generateExampleProps("shop-test", "/repo");

    const out = join(
      "/repo",
      "apps",
      "shop-test",
      "src",
      "app",
      "upgrade-preview",
      "example-props.ts"
    );

    expect(fsMock.writeFileSync).toHaveBeenCalled();
    const content = fsMock.writeFileSync.mock.calls[0][1];
    expect(fsMock.writeFileSync.mock.calls[0][0]).toBe(out);
    expect(content).toContain('"Button": {');
    expect(content).toContain('"children": "Button"');
    expect(content).toContain('"Breadcrumbs": {');
    expect(content).toContain('"Icon": {');
    expect(content).toContain('"name": "star"');
    expect(content).toContain('"Price": {');
    expect(content).toContain('"amount": 19.99');
    expect(content).toContain('"RatingStars": {');
    expect(content).toContain('"rating": 4');
    expect(content).toContain('"StockStatus": {');
    expect(content).toContain('"inStock": true');
    expect(content).toContain('"SearchBar": {');
    expect(content).toContain('"suggestions": [');
    expect(content).toContain('"Foo": {}');
  });
});
