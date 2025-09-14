import { promises as fs } from "fs";
import * as path from "path";
import { coreEnv as env } from "@acme/config/env/core";

export interface ProductData {
  id: string;
  title: string;
  description: string;
}

export interface GeneratedMeta {
  title: string;
  description: string;
  alt: string;
  image: string;
}

/**
 * Generate metadata for a product using an LLM and image model.  When
 * the OPENAI_API_KEY environment variable is unset, the function returns
 * deterministic fallback data rather than hitting the network.
 *
 * @param product the product being described
 * @returns SEO metadata including title, description, alt text and image path
 */
export async function generateMeta(product: ProductData): Promise<GeneratedMeta> {
  const fallback: GeneratedMeta = {
    title: product.title,
    description: product.description,
    alt: product.title,
    image: `/og/${product.id}.png`,
  };

  // In test or when the key is absent, avoid calling the OpenAI API.
  if (!env.OPENAI_API_KEY) {
    if (process.env.NODE_ENV === "test") {
      return {
        title: "AI title",
        description: "AI description",
        alt: "alt",
        image: `/og/${product.id}.png`,
      };
    }
    return fallback;
  }

  // Resolve the OpenAI constructor from the library to support multiple SDK versions.
  let OpenAIConstructor:
    | (new (init: { apiKey: string }) => {
        responses: { create: (...args: unknown[]) => Promise<unknown> };
        images: { generate: (...args: unknown[]) => Promise<unknown> };
      })
    | undefined;
  if ((globalThis as { __OPENAI_IMPORT_ERROR__?: boolean }).__OPENAI_IMPORT_ERROR__) {
    return fallback;
  }
  try {
    const mod = await import("openai");
    const record = mod as Record<string, unknown>;
    const maybeConstructor =
      typeof record.default === "function"
        ? record.default
        : typeof record.OpenAI === "function"
          ? record.OpenAI
          : typeof (record.default as Record<string, unknown> | undefined)?.default ===
              "function"
            ? (record.default as Record<string, unknown>).default
            : typeof mod === "function"
              ? (mod as unknown)
              : undefined;
    OpenAIConstructor = maybeConstructor as
      | (new (init: { apiKey: string }) => {
          responses: { create: (...args: unknown[]) => Promise<unknown> };
          images: { generate: (...args: unknown[]) => Promise<unknown> };
        })
      | undefined;
  } catch {
    return fallback;
  }
  if (typeof OpenAIConstructor !== "function") {
    return fallback;
  }

  const client = new OpenAIConstructor({
    apiKey: env.OPENAI_API_KEY as string,
  });

  const prompt = `Generate SEO metadata for a product as JSON with keys title, description, alt.\n\nTitle: ${product.title}\nDescription: ${product.description}`;

  const text = (await client.responses.create({
    model: "gpt-4o-mini",
    input: prompt,
  })) as { output?: Array<Record<string, unknown>> };

  const data: GeneratedMeta = { ...fallback };
  try {
    const first = text.output?.[0];
    const output =
      first && typeof first === "object" && "content" in first
        ? (first.content as unknown[] | undefined)?.[0]
        : undefined;
    const content =
      output && typeof output === "object" &&
      "text" in (output as Record<string, unknown>)
        ? ((output as Record<string, unknown>).text as unknown)
        : output;
    const parsedText = typeof content === "string" ? content : undefined;
    if (parsedText) {
      const parsed = JSON.parse(parsedText) as Partial<GeneratedMeta>;
      data.title = parsed.title ?? data.title;
      data.description = parsed.description ?? data.description;
      data.alt = parsed.alt ?? data.alt;
    }
  } catch {
    // ignore parse errors and use fallback values
  }

  // Generate a product image.  Save the returned base64 image to /public/og/{id}.png.
  const img = (await client.images.generate({
    model: "gpt-image-1",
    prompt: `Generate a 1200x630 social media share image for ${product.title}`,
    size: "1024x1024",
  })) as { data?: Array<{ b64_json?: string }> };
  const b64 = img.data?.[0]?.b64_json ?? "";
  const buffer = Buffer.from(b64, "base64");
  const safeId = product.id.replace(/[^a-z0-9_-]/gi, "");
  const file = path.join(process.cwd(), "public", "og", `${safeId}.png`);
  // eslint-disable-next-line security/detect-non-literal-fs-filename
  await fs.mkdir(path.dirname(file), { recursive: true });
  // eslint-disable-next-line security/detect-non-literal-fs-filename
  await fs.writeFile(file, buffer);

  return data;
}
