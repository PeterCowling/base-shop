import { Button as UIButton } from "../../atoms/shadcn";

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

const sizeClasses: Record<NonNullable<ButtonProps["size"]>, string> = {
  sm: "px-2 py-1 text-sm",
  md: "px-4 py-2",
  lg: "px-6 py-3 text-lg",
};

export default function Button({
  label = "Button",
  href = "#",
  variant = "default",
  size = "md",
}: ButtonProps) {
  return (
    <UIButton asChild variant={variant} className={sizeClasses[size]}>
      <a href={href}>{label}</a>
    </UIButton>
  );
}

