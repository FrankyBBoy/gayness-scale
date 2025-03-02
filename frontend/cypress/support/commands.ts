/// <reference types="cypress" />
// ***********************************************
// This example commands.ts shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add('login', (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })
//
// Add mockAuth command
Cypress.Commands.add('mockAuth', () => {
  // Mock localStorage for Auth0
  localStorage.setItem('auth0.is.authenticated', 'true');
  
  // Mock the user profile
  localStorage.setItem('auth0.user', JSON.stringify({
    sub: 'auth0|123456',
    email: 'test@example.com',
    name: 'Test User'
  }));
  
  // Mock the token
  localStorage.setItem('auth0.token', 'mock-token');
});

declare global {
  namespace Cypress {
    interface Chainable {
      mockAuth(): Chainable<void>
      // login(email: string, password: string): Chainable<void>
      // drag(subject: string, options?: Partial<TypeOptions>): Chainable<Element>
      // dismiss(subject: string, options?: Partial<TypeOptions>): Chainable<Element>
      // visit(originalFn: CommandOriginalFn, url: string, options: Partial<VisitOptions>): Chainable<Element>
    }
  }
}

export {};