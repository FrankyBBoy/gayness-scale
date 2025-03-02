// ***********************************************************
// This example support/e2e.ts is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
import './commands'

// Bypass Auth0 authentication for testing
Cypress.on('window:before:load', (win) => {
  // Mock Auth0 authentication state
  Object.defineProperty(win, 'auth0Client', {
    value: {
      isAuthenticated: () => true,
      getUser: () => ({
        sub: 'auth0|123456',
        email: 'test@example.com',
        name: 'Test User'
      }),
      getTokenSilently: () => Promise.resolve('mock-token')
    },
    writable: true
  });
});

// Alternatively uncomment the line below to ignore uncaught exceptions
// Cypress.on('uncaught:exception', (err, runnable) => { return false; });