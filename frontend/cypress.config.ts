import { defineConfig } from "cypress";

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:4200',
    supportFile: 'cypress/support/e2e.ts',
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
    // Handle Auth0 redirects and other uncaught exceptions
    experimentalModifyObstructiveThirdPartyCode: true,
    experimentalWebKitSupport: true,
    chromeWebSecurity: false,
    // Increase timeout for Auth0 redirects
    defaultCommandTimeout: 10000,
    pageLoadTimeout: 30000
  },
});
