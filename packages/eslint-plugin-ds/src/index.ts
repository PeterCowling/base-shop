import noRawColor from "./rules/no-raw-color.js";
import noRawFont from "./rules/no-raw-font.js";

export const rules = {
  "no-raw-color": noRawColor,
  "no-raw-font": noRawFont,
};

const plugin = { rules };
export default plugin;
