export function drawerWidthProps(width) {
    const widthClass = typeof width === "string" && width.startsWith("w-") ? width : undefined;
    const style = widthClass ? undefined : { width };
    return { widthClass, style };
}
