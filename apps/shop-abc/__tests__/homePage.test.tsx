import { render } from "@testing-library/react";

const components = [{ id: "1", type: "Text", text: "Hello" }];

afterEach(() => {
  jest.resetModules();
});

describe("[lang]/page", () => {
  it("passes components to DynamicRenderer", async () => {
    const readFile = jest
      .fn()
      .mockResolvedValue(JSON.stringify(components));
    jest.doMock(
      "node:fs",
      () => ({ promises: { readFile } }),
      { virtual: true }
    );

    const dynamicModule = await import(
      "../../../packages/ui/src/components/DynamicRenderer.client.ts"
    );
    const spy = jest
      .spyOn(dynamicModule, "default")
      .mockImplementation(() => null);

    const Page = (await import("../src/app/[lang]/page")).default;
    const element = await Page();
    render(element as any);
    expect(spy.mock.calls[0][0]).toEqual({ components });
    expect(readFile).toHaveBeenCalled();
  });
});
