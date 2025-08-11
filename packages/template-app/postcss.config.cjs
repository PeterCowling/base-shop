/* packages/template-app/postcss.config.cjs
   Shared PostCSS configuration for all shop apps */
module.exports = {
  plugins: {
    // TailwindCSS v4 bundles autoprefixer & postcss-import
    "@tailwindcss/postcss": {},
  },
};
