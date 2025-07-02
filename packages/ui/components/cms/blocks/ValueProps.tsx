// packages/ui/components/cms/blocks/ValueProps.tsx
import { ValueProps, type ValuePropItem } from "../../home/ValueProps";

export default function CmsValueProps(props: { items?: ValuePropItem[] }) {
  return <ValueProps {...props} />;
}
