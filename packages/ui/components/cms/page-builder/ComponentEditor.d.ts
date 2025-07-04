import type { PageComponent } from "@types";
import * as React from "react";
interface Props {
    component: PageComponent;
    onChange: (patch: Partial<PageComponent>) => void;
}
export default function ComponentEditor({ component, onChange }: Props): React.JSX.Element;
export {};
