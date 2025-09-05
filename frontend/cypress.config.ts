import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:4200',
    supportFile: 'cypress/support/e2e.ts',
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    videosFolder: 'cypress/videos',
    screenshotsFolder: 'cypress/screenshots',
    fixturesFolder: 'cypress/fixtures',
    downloadsFolder: 'cypress/downloads',
    viewportWidth: 1280,
    viewportHeight: 720,
    video: false,
    screenshotOnRunFailure: false,
    watchForFileChanges: false,
    chromeWebSecurity: false,
    defaultCommandTimeout: 5000,
    requestTimeout: 8000,
    responseTimeout: 8000,
    pageLoadTimeout: 10000,
    env: {
      apiUrl: 'http://localhost:8000/api',
      coverage: true,
    },
    setupNodeEvents(on, config) {
      // implement node event listeners here
      return config;
    },
  },
});