import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/atoms/shadcn";
import { ulid } from "ulid";
import type { PageComponent } from "@acme/types";

interface Props {
  pageTemplates: Array<{
    name: string;
    components: PageComponent[];
    disabled?: boolean;
  }>;
  newPageLayout: string;
  setNewPageLayout: (v: string) => void;
  setNewComponents: (v: PageComponent[]) => void;
}

export default function PageLayoutSelector({
  pageTemplates,
  newPageLayout,
  setNewPageLayout,
  setNewComponents,
}: Props) {
  return (
    <Select
      data-cy="additional-page-layout"
      value={newPageLayout}
      onValueChange={(val: string) => {
        const layout = val === "blank" ? "" : val;
        setNewPageLayout(layout);
        const tpl = pageTemplates.find(
          (t) => t.name === layout && !t.disabled,
        );
        if (tpl) {
          setNewComponents(tpl.components.map((c) => ({ ...c, id: ulid() })));
        } else {
          setNewComponents([]);
        }
      }}
    >
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Select template" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="blank">Blank</SelectItem>
        {pageTemplates
          .filter((t) => !t.disabled)
          .map((t) => (
            <SelectItem key={t.name} value={t.name}>
              {t.name}
            </SelectItem>
          ))}
      </SelectContent>
    </Select>
  );
}

