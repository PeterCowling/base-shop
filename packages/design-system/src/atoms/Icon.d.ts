import * as React from "react";
declare const icons: {
    readonly star: React.ForwardRefExoticComponent<import("@radix-ui/react-icons/dist/types").IconProps & React.RefAttributes<SVGSVGElement>>;
    readonly heart: React.ForwardRefExoticComponent<import("@radix-ui/react-icons/dist/types").IconProps & React.RefAttributes<SVGSVGElement>>;
    readonly user: React.ForwardRefExoticComponent<import("@radix-ui/react-icons/dist/types").IconProps & React.RefAttributes<SVGSVGElement>>;
};
export type IconName = keyof typeof icons;
export interface IconProps extends Omit<React.SVGAttributes<SVGSVGElement>, "children"> {
    name: IconName;
}
export declare function Icon({ name, ...props }: IconProps): import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=Icon.d.ts.map