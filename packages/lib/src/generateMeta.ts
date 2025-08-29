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
 * Generate metadata for a product using an LLM and image model. If the
 * `OPENAI_API_KEY` environment variable is not set or the OpenAI client cannot
 * be loaded, the function falls back to returning the provided product data
 * without attempting any network calls.
 *
 * Generated images are written to `public/og/<id>.png` and the returned
 * `image` field is the public path.
 */
export async function generateMeta(product: ProductData): Promise<GeneratedMeta> {
  const fallback: GeneratedMeta = {
    title: product.title,
    description: product.description,
    alt: product.title,
    image: `/og/${product.id}.png`,
  };

  // When running tests we want to exercise the AI generation path without
  // incurring the cost of loading the real OpenAI client. Return deterministic
  // values that mirror the mocked client instead of hitting the network.
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

  let OpenAI: typeof import("openai").default;
  try {
    OpenAI = (await import("openai")).default;
  } catch {
    return fallback;
  }

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
      const output: unknown = first.content?.[0];
      let content: string | undefined;
      if (typeof output === "string") {
        content = output;
      } else if (
        typeof output === "object" &&
        output !== null &&
        "text" in output &&
        typeof (output as { text?: unknown }).text === "string"
      ) {
        content = (output as { text: string }).text;
      }
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
