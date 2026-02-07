import * as React from "react";
import { HeartIcon, PersonIcon, StarIcon } from "@radix-ui/react-icons";

const icons = {
  star: StarIcon,
  heart: HeartIcon,
  user: PersonIcon,
} as const;

export type IconName = keyof typeof icons;
export type IconProps = React.ComponentPropsWithoutRef<typeof StarIcon> & {
  name: IconName;
};

export function Icon({ name, ...props }: IconProps) {
  const Component = icons[name];
  return <Component {...props} />;
}
