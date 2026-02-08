import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    baseUrl: process.env.CYPRESS_BASE_URL || 'http://127.0.0.1:3015',
    specPattern: 'cypress/e2e/**/*.cy.{ts,tsx,js,jsx}',
    supportFile: 'cypress/support/e2e.ts',
    viewportWidth: 375,
    viewportHeight: 812,
    video: false,
    screenshotOnRunFailure: true,
    defaultCommandTimeout: 10000,
    retries: {
      runMode: 2,
      openMode: 0,
    },
    setupNodeEvents(on, config) {
      on('task', {
        log(message: string) {
          // eslint-disable-next-line no-console -- BRIK-ENG-0017 Cypress task logger
          console.log(message);
          return null;
        },
      });

      return config;
    },
  },
});
