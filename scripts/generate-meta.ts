import OpenAI from "openai";
import { promises as fs } from "node:fs";
import path from "node:path";

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
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

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
    const output = text.output?.[0]?.content?.[0];
    const content = typeof output === "string" ? output : (output as any)?.text;
    if (content) {
      data = JSON.parse(content);
    }
  } catch {
    // fall back to defaults
  }

  const img = await client.images.generate({
    model: "gpt-image-1",
    prompt: `Generate a 1200x630 social media share image for ${product.title}`,
    size: "1200x630",
  });
  const b64 = img.data[0]?.b64_json ?? "";
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

// CLI usage: tsx scripts/generate-meta.ts path/to/product.json
if (process.argv[1] && process.argv[1].endsWith("generate-meta.ts")) {
  (async () => {
    const input = process.argv[2];
    if (!input) {
      console.error("Usage: generate-meta.ts <product.json>");
      process.exit(1);
    }
    const raw = await fs.readFile(input, "utf8");
    const product = JSON.parse(raw) as ProductData;
    const result = await generateMeta(product);
    // eslint-disable-next-line no-console
    console.log(JSON.stringify(result, null, 2));
  })();
}

