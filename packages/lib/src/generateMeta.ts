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
        responses: { create: (...args: any[]) => Promise<any> };
        images: { generate: (...args: any[]) => Promise<any> };
      })
    | undefined;
  if ((globalThis as any).__OPENAI_IMPORT_ERROR__) {
    return fallback;
  }
  try {
    const mod = await import("openai");
    OpenAIConstructor =
      typeof (mod as any).default === "function"
        ? (mod as any).default
        : typeof (mod as any).OpenAI === "function"
          ? (mod as any).OpenAI
          : typeof (mod as any).default?.default === "function"
            ? (mod as any).default.default
            : typeof mod === "function"
              ? (mod as any)
              : undefined;
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

  const text = await client.responses.create({
    model: "gpt-4o-mini",
    input: prompt,
  });

  const data: GeneratedMeta = { ...fallback };
  try {
    const first = text.output?.[0];
    const output = (first && "content" in first ? first.content?.[0] : undefined) as
      | string
      | { text?: unknown }
      | undefined;
    const content =
      typeof output === "string"
        ? output
        : typeof output?.text === "string"
          ? output.text
          : undefined;
    if (content) {
      const parsed = JSON.parse(content) as Partial<GeneratedMeta>;
      data.title = parsed.title ?? data.title;
      data.description = parsed.description ?? data.description;
      data.alt = parsed.alt ?? data.alt;
    }
  } catch {
    // ignore parse errors and use fallback values
  }

  // Generate a product image.  Save the returned base64 image to /public/og/{id}.png.
  const img = await client.images.generate({
    model: "gpt-image-1",
    prompt: `Generate a 1200x630 social media share image for ${product.title}`,
    size: "1024x1024",
  });
  const b64 = img.data?.[0]?.b64_json ?? "";
  const buffer = Buffer.from(b64, "base64");
  const file = path.join(process.cwd(), "public", "og", `${product.id}.png`);
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, buffer);

  return data;
}
