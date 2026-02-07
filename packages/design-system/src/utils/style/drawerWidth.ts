export function drawerWidthProps(width: string | number) {
  const widthClass =
    typeof width === "string" && width.startsWith("w-") ? width : undefined;
  const style = widthClass ? undefined : { width };
  return { widthClass, style };
}
