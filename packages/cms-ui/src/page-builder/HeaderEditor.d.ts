import type { HeaderComponent } from "@acme/types";
import type { LogoVariants } from "@acme/ui/organisms/types";
interface ExtendedHeaderComponent extends HeaderComponent {
    logoVariants?: LogoVariants;
    shopName?: string;
}
interface Props {
    component: ExtendedHeaderComponent;
    onChange: (patch: Partial<ExtendedHeaderComponent>) => void;
}
export default function HeaderEditor({ component, onChange }: Props): import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=HeaderEditor.d.ts.map