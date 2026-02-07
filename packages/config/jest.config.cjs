/* eslint-disable @typescript-eslint/no-require-imports */
// Package-scoped Jest config for @acme/config
// skipEnvMocks is required because this IS the config package - we don't want to mock ourselves

const config = require("./jest.preset.cjs")({
  skipEnvMocks: true,
});

module.exports = config;
