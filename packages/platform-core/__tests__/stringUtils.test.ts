// packages-platform-core/__tests__/stringUtils.test.ts
import { slugify, genSecret, fillLocales } from "../src/utils";

describe("string utilities", () => {
  it("slugifies strings", () => {
    expect(slugify(" Hello World! ")).toBe("hello-world");
  });

  it("generates secrets of correct length", () => {
    const secret = genSecret(8);
    expect(secret).toHaveLength(16);
  });

  it("fills locales with fallback", () => {
    const result = fillLocales({ en: "Hello" }, "Hi");
    expect(result.en).toBe("Hello");
    expect(result.de).toBe("Hi");
  });
});

