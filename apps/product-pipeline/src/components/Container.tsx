import type { HTMLAttributes } from "react";
import { cn } from "@acme/ui/utils/style";

type ContainerProps = HTMLAttributes<HTMLDivElement>;

export default function Container({ className, ...rest }: ContainerProps) {
  return <div className={cn("mx-auto", "w-full", "px-6", className)} {...rest} />;
}
