import OpenAI from "openai";
import { promises as fs } from "fs";
import path from "path";
import { env } from "@acme/config";

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
 * Generate metadata for a product using an LLM and image model.
 * Requires OPENAI_API_KEY to be set. Generated images are written to
 * `public/og/<id>.png` and the returned `image` field is the public path.
 */
export async function generateMeta(product: ProductData): Promise<GeneratedMeta> {
  const client = new OpenAI({ apiKey: env.OPENAI_API_KEY });

  const prompt = `Generate SEO metadata for a product as JSON with keys title, description, alt.\n\nTitle: ${product.title}\nDescription: ${product.description}`;

  const text = await client.responses.create({
    model: "gpt-4o-mini",
    input: prompt,
  });

  let data: { title: string; description: string; alt: string } = {
    title: product.title,
    description: product.description,
    alt: product.title,
  };
  try {
    const first = text.output?.[0];
    if (first && "content" in first) {
      const output = first.content?.[0];
      const content = typeof output === "string" ? output : (output as any)?.text;
      if (content) {
        data = JSON.parse(content);
      }
    }
  } catch {
    // fall back to defaults
  }

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

  return {
    title: data.title,
    description: data.description,
    alt: data.alt,
    image: `/og/${product.id}.png`,
  };
}
