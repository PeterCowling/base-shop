import { HeartIcon, PersonIcon, StarIcon } from "@radix-ui/react-icons";
import * as React from "react";

const icons = {
  star: StarIcon,
  heart: HeartIcon,
  user: PersonIcon,
} as const;

export type IconName = keyof typeof icons;
export interface IconProps
  extends Omit<React.SVGAttributes<SVGSVGElement>, "children"> {
  name: IconName;
}

export function Icon({ name, ...props }: IconProps) {
  const Component = icons[name];
  return <Component {...props} />;
}
