import { describe, it, expect, afterEach, jest } from "@jest/globals";
describe("generateMeta defaults", () => {
  const product = { id: "1", title: "Title", description: "Desc" };

  afterEach(() => {
    jest.resetModules();
  });

  async function run(content: string) {
    let result;
    await jest.isolateModulesAsync(async () => {
      jest.doMock("@acme/config/env/core", () => ({
        coreEnv: { OPENAI_API_KEY: "key" },
      }));
      jest.doMock("fs", () => ({ promises: { writeFile: jest.fn(), mkdir: jest.fn() } }));
      const responsesCreate = jest
        .fn()
        .mockResolvedValue({ output: [{ content: [{ text: content }] }] });
      const imagesGenerate = jest
        .fn()
        .mockResolvedValue({ data: [{ b64_json: "" }] });
      class OpenAI {
        responses = { create: responsesCreate };
        images = { generate: imagesGenerate };
      }
      jest.doMock("openai", () => ({ __esModule: true, default: OpenAI }), {
        virtual: true,
      });
      const { generateMeta } = await import("../generateMeta");
      result = await generateMeta(product);
    });
    return result;
  }

  it("injects product defaults when AI omits fields", async () => {
    const meta = await run(JSON.stringify({ description: "New" }));
    expect(meta).toEqual({
      title: "Title",
      description: "New",
      alt: "Title",
      image: "/og/1.png",
    });
  });

  it("falls back entirely to product data when AI returns empty object", async () => {
    const meta = await run(JSON.stringify({}));
    expect(meta).toEqual({
      title: "Title",
      description: "Desc",
      alt: "Title",
      image: "/og/1.png",
    });
  });
});
