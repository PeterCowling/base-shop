import { jsx as _jsx } from "react/jsx-runtime";
const GridOverlay = ({ gridCols }) => (_jsx("div", { className: "pointer-events-none absolute inset-0 z-10 grid", style: { gridTemplateColumns: `repeat(${gridCols}, 1fr)` }, children: Array.from({ length: gridCols }).map((_, i) => (_jsx("div", { className: "border-l border-dashed border-muted-foreground/40" }, i))) }));
export default GridOverlay;
