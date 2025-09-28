import { promises as fs } from "fs";
import path from "path";
import { validateShopName } from "@platform-core/shops";
import { useTranslations as getTranslations } from "@i18n/useTranslations.server";

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
  const safeShop = validateShopName(shop);
  const t = await getTranslations("en");
  const filePath = path.resolve(
    process.cwd(),
    "..",
    `shop-${safeShop}`,
    "upgrade-changes.json",
  );
  let components: UpgradeComponent[] = [];
  try {
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- CMS-0001: path is derived from validated shop name and static prefix
    const raw = await fs.readFile(filePath, "utf8");
    const data = JSON.parse(raw);
    components = Array.isArray(data.components) ? data.components : [];
  } catch {
    // ignore errors if file not found or invalid
  }

  return (
    <div>
      <h2 className="mb-4 text-xl font-semibold">{t("cms.editPreview.title", { shop }) as string}</h2>
      <ul className="list-disc pl-4">
        {components.map((c) => (
          <li key={c.file}>{c.componentName}</li>
        ))}
        {components.length === 0 && <li>{t("cms.editPreview.noChanges")}</li>}
      </ul>
    </div>
  );
}
