import { jsx as _jsx } from "react/jsx-runtime";
import { ColorSwatch } from "./ColorSwatch";
const meta = {
    title: "Atoms/ColorSwatch",
    component: ColorSwatch,
    argTypes: { selected: { control: "boolean" } },
    args: { selected: false },
};
export default meta;
const palette = ["#ff0000", "#00ff00", "#0000ff", "#ffff00", "#ff00ff"];
export const Palette = {
    render: (args) => (_jsx("div", { className: "flex gap-2", children: palette.map((color, i) => (_jsx(ColorSwatch, { color: color, selected: i === 0 && args.selected }, color))) })),
};
