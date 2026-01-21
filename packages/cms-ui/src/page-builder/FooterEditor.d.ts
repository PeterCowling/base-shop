import type { FooterComponent } from "@acme/types";
import type { LogoVariants } from "@acme/ui/organisms/types";
interface ExtendedFooterComponent extends FooterComponent {
    logoVariants?: LogoVariants;
    shopName?: string;
}
interface Props {
    component: ExtendedFooterComponent;
    onChange: (patch: Partial<ExtendedFooterComponent>) => void;
}
export default function FooterEditor({ component, onChange }: Props): import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=FooterEditor.d.ts.map