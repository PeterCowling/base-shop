import { checkShopExists } from "@acme/lib";
import ComponentPreview from "@ui/src/components/ComponentPreview";
import { notFound } from "next/navigation";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { z } from "zod";

export default async function UpgradePreview({
  params,
}: {
  params: Promise<{ shop: string }>;
}) {
  const { shop } = await params;
  if (!(await checkShopExists(shop))) return notFound();

  const res = await fetch(`/shop-${shop}/api/upgrade-changes`);
  const schema = z.object({
    components: z.array(
      z.object({
        file: z.string(),
        componentName: z.string(),
        oldChecksum: z.string().optional(),
        newChecksum: z.string().optional(),
      })
    ),
  });
  const data = schema.parse(await res.json());

  let exampleProps: Record<string, any> = {};
  try {
    const mod = await import(
      pathToFileURL(
        path.resolve(
          process.cwd(),
          "..",
          `shop-${shop}`,
          "src",
          "app",
          "upgrade-preview",
          "example-props.ts"
        )
      ).href
    );
    exampleProps = (mod as { exampleProps?: Record<string, any> }).exampleProps ?? {};
  } catch {
    // ignore if example props cannot be loaded
  }

  return (
    <div className="space-y-4">
      <h2 className="mb-4 text-xl font-semibold">Upgrade Preview – {shop}</h2>
      <ul className="space-y-4">
        {data.components.map((c) => (
          <li key={c.file}>
            <ComponentPreview
              component={c}
              componentProps={exampleProps[c.componentName] ?? {}}
            />
          </li>
        ))}
        {data.components.length === 0 && <li>No changes.</li>}
      </ul>
    </div>
  );
}
