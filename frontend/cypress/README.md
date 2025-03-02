# Cypress Tests for Gayness Scale

This directory contains end-to-end tests for the Gayness Scale application using Cypress.

## Test Structure

The tests are organized by page/feature:

- `home.cy.ts`: Tests for the home page and navigation
- `vote.cy.ts`: Tests for the voting functionality
- `suggest.cy.ts`: Tests for the suggestion submission functionality

## Authentication Handling

Since the application uses Auth0 for authentication and the vote/suggest pages are protected by an auth guard, the tests include a custom approach to handle authentication:

1. We've created a custom `mockAuth()` command in `support/commands.ts` that:
   - Intercepts Auth0 API calls
   - Sets local storage values to simulate authenticated state
   - Adds a flag to the window object for testing

2. We've configured the `window:before:load` event in `support/e2e.ts` to mock the Auth0 client

3. Each test file that accesses protected routes:
   - Calls `cy.mockAuth()` before visiting protected pages
   - Uses `onBeforeLoad` to set up authentication mocks
   - Handles uncaught exceptions from Auth0 redirects

## API Mocking

The tests mock API responses to ensure consistent test behavior:

- Suggestion pairs for voting
- User data including vote/suggestion counts
- Form submission responses

## Running the Tests

To run the tests:

```bash
# Run all tests headlessly
npx cypress run

# Run tests with UI
npx cypress open

# Run a specific test file
npx cypress run --spec "cypress/e2e/home.cy.ts"
```

## Notes

- The tests use more generic selectors (e.g., `cy.contains('Vote')` instead of `cy.get('a[href="/vote"]')`) to be more resilient to UI changes
- We've disabled Chrome web security and enabled experimental features in `cypress.config.ts` to handle Auth0 redirects
- Timeouts have been increased to accommodate potential delays with authentication 