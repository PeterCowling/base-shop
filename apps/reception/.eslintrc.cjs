// ESLint configuration for Reception app
// Reception is an internal operations tool that does not require i18n
module.exports = {
  rules: {
    // Disable hardcoded copy rule - Reception is not customer-facing
    'ds/no-hardcoded-copy': 'off',
  },
};
