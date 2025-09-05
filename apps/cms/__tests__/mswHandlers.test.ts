import { handlers } from "./msw/handlers";

describe("msw handlers", () => {
  it("executes all mock handlers at least once", () => {
    const ctx = {
      status: () => null,
      json: () => null,
    } as any;
    const res = () => null;

    for (const handler of handlers) {
      const url = (() => {
        switch (handler.info.path) {
          case "/cms/api/theme/tokens":
            return new URL("http://localhost/cms/api/theme/tokens?name=base");
          case "/cms/api/products/slug/:slug":
            return new URL("http://localhost/cms/api/products/slug/test");
          case "*/api/products":
            return new URL("http://localhost/api/products");
          default:
            return new URL(`http://localhost${handler.info.path}`);
        }
      })();

      handler.resolver(
        { params: { slug: "test" }, url } as any,
        res as any,
        ctx
      );
    }
  });
});
