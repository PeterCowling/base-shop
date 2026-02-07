import { useTranslations } from "@acme/i18n";

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

// i18n-exempt -- DS-1234 [ttl=2025-11-30] — CSS utility tokens, not user-facing copy
const sizeClasses: Record<NonNullable<ButtonProps["size"]>, string> = {
  sm: "px-2 py-1 text-sm", // i18n-exempt -- DS-1234 [ttl=2025-11-30]
  md: "px-4 py-2", // i18n-exempt -- DS-1234 [ttl=2025-11-30]
  lg: "px-6 py-3 text-lg", // i18n-exempt -- DS-1234 [ttl=2025-11-30]
};

export default function Button(props: ButtonProps) {
  const t = useTranslations();
  const {
    variant = "default",
    size = "md",
    ...rest
  } = props;
  const label = props.label ?? t("actions.button");
  const href = props.href ?? "#"; // i18n-exempt: non-copy URL stub for previews
  const key = size as keyof typeof sizeClasses;
  const cls = sizeClasses[key];
  return (
    <UIButton asChild variant={variant} className={cls}>
      <a href={href} {...rest}>{label}</a>
    </UIButton>
  );
}
