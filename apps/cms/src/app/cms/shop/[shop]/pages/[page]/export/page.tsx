// apps/cms/src/app/cms/shop/[shop]/pages/[page]/export/page.tsx

import { useTranslations } from "@acme/i18n";

export default function ExportPage() {
  const t = useTranslations();
  return <h1>{t("cms.export.title")}</h1>;
}
