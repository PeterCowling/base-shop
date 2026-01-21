import { useTranslations } from "@acme/i18n";
import type { PageComponent } from "@acme/types";

import DatasetEditor from "../../DatasetEditor";

import type { UpdateComponent } from "./types";

interface CmsTabContentProps {
  component: PageComponent;
  onChange: UpdateComponent;
}

const CmsTabContent = ({ component, onChange }: CmsTabContentProps) => {
  const t = useTranslations();
  const type = String((component as unknown as { type?: unknown }).type);
  return (
    <div className="space-y-2">
      {type === "Dataset" ? (
        <DatasetEditor
          component={component as unknown as Parameters<typeof DatasetEditor>[0]["component"]}
          onChange={onChange}
        />
      ) : (
        <div className="rounded border p-2 text-xs text-muted-foreground">
          {t("Connect to CMS: select a Dataset block to edit connections.")}
        </div>
      )}
    </div>
  );
};

export default CmsTabContent;
