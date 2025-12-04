// Minimal path stub for Storybook builds (no Node polyfill needed)
const join = (...parts) => parts.filter(Boolean).join("/");
const dirname = (p) => p.split("/").slice(0, -1).join("/") || "/";
const basename = (p) => p.split("/").filter(Boolean).slice(-1)[0] || "";

module.exports = {
  join,
  resolve: join,
  dirname,
  basename,
  sep: "/",
};
