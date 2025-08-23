import { jsx as _jsx } from "react/jsx-runtime";
import { HeartIcon, PersonIcon, StarIcon } from "@radix-ui/react-icons";
import * as React from "react";
const icons = {
    star: StarIcon,
    heart: HeartIcon,
    user: PersonIcon,
};
export function Icon({ name, ...props }) {
    const Component = icons[name];
    return _jsx(Component, { ...props });
}
