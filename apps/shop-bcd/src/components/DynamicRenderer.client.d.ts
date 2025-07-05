import type { PageComponent } from "@types";
export default function DynamicRenderer({ components, }: {
    components: PageComponent[];
}): import("react/jsx-runtime").JSX.Element;
