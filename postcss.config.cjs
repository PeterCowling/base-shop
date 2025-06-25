/* /postcss.config.cjs  — single source of truth for every pkg/app */
module.exports = {
  plugins: {
    // ⚠️ v4: the PostCSS plugin moved here
    "@tailwindcss/postcss": {},

    /* If you still rely on other PostCSS plugins keep them,
       but remove autoprefixer & postcss-import — v4 bundles both. */
    // 'postcss-nesting': {},
  },
};
