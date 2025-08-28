const exportedTokenMap: Record<string, string> = {
  "color.fg": "#000000",
  "color.bg": "#ffffff",
  "border.default": "#dddddd",
  "font.sans": "system-ui, sans-serif",
  "font.size.base": "16px",
  "font.weight.normal": "400",
  "line.height.normal": "1.5",
};

export default exportedTokenMap;
export type ExportedTokenMap = typeof exportedTokenMap;
