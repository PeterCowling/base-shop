module.exports = {
  extends: ['next/core-web-vitals'],
  rules: {
    // Disable design system rules for now - Prime is a new app being migrated
    'ds/no-unsafe-viewport-units': 'off',
    'ds/container-widths-only-at': 'off',
    'ds/no-hardcoded-copy': 'off',
    'ds/min-tap-size': 'off',
    'ds/enforce-focus-ring-token': 'off',
  },
};
