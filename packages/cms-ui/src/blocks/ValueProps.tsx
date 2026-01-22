// packages/ui/components/cms/blocks/ValueProps.tsx
import { type ValuePropItem,ValueProps } from "@acme/ui/home/ValueProps";

interface Props {
  items?: ValuePropItem[];
  minItems?: number;
  maxItems?: number;
}

export default function CmsValueProps({
  items = [],
  minItems,
  maxItems,
}: Props) {
  const list = items.slice(0, maxItems ?? items.length);
  if (!list.length || list.length < (minItems ?? 0)) return null;
  return <ValueProps items={list} />;
}
