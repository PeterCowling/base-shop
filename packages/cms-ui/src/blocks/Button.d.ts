import { Button as UIButton } from "@acme/design-system/shadcn";
export interface ButtonProps {
    /** Text displayed inside the button */
    label?: string;
    /** Destination URL when clicked */
    href?: string;
    /** Visual variant of the button */
    variant?: React.ComponentProps<typeof UIButton>["variant"];
    /** Controls padding and font size */
    size?: "sm" | "md" | "lg";
}
export default function Button({ label, href, variant, size, }: ButtonProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=Button.d.ts.map