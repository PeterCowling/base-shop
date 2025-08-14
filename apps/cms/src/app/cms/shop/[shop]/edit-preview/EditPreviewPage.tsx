import { promises as fs } from "node:fs";
import path from "node:path";

interface UpgradeComponent {
  file: string;
  componentName: string;
  oldChecksum?: string;
  newChecksum?: string;
}

export default async function EditPreviewPage({
  shop,
}: {
  shop: string;
}) {
  const filePath = path.resolve(
    process.cwd(),
    "..",
    `shop-${shop}`,
    "upgrade-changes.json",
  );
  let components: UpgradeComponent[] = [];
  try {
    const raw = await fs.readFile(filePath, "utf8");
    const data = JSON.parse(raw);
    components = Array.isArray(data.components) ? data.components : [];
  } catch {
    // ignore errors if file not found or invalid
  }

  return (
    <div>
      <h2 className="mb-4 text-xl font-semibold">Edit Preview – {shop}</h2>
      <ul className="list-disc pl-4">
        {components.map((c) => (
          <li key={c.file}>{c.componentName}</li>
        ))}
        {components.length === 0 && <li>No changes.</li>}
      </ul>
    </div>
  );
}
