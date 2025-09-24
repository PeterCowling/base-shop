import type { PageComponent } from "@acme/types";

import DatasetEditor from "../../DatasetEditor";
import type { UpdateComponent } from "./types";

interface CmsTabContentProps {
  component: PageComponent;
  onChange: UpdateComponent;
}

const CmsTabContent = ({ component, onChange }: CmsTabContentProps) => (
  <div className="space-y-2">
    {String((component as any).type) === "Dataset" ? (
      <DatasetEditor component={component as any} onChange={onChange} />
    ) : (
      <div className="rounded border p-2 text-xs text-muted-foreground">
        Connect to CMS: select a Dataset block to edit connections.
      </div>
    )}
  </div>
);

export default CmsTabContent;
