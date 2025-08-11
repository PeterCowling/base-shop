import { Button as ShButton } from "../../atoms/shadcn";

interface Props {
  /** Text displayed on the button */
  label?: string;
  /** Destination URL */
  url?: string;
  /** Visual style variant */
  variant?: React.ComponentProps<typeof ShButton>["variant"] | "destructive";
  /** Size of the button */
  size?: "sm" | "md" | "lg";
}

const sizeClasses: Record<NonNullable<Props["size"]>, string> = {
  sm: "px-2 py-1 text-sm",
  md: "px-4 py-2",
  lg: "px-6 py-3 text-lg",
};

export default function Button({
  label,
  url = "#",
  variant = "default",
  size = "md",
}: Props) {
  if (!label) return null;
  return (
    <ShButton asChild variant={variant} className={sizeClasses[size]}>
      <a href={url}>{label}</a>
    </ShButton>
  );
}
