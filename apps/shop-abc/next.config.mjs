import base from "../cms/next.config.mjs";

export default {
  ...base,
  env: { ...base.env, SHOP_CODE: "abc" },
};
