/// <reference types="cypress" />

describe('Suggest Page', () => {
  beforeEach(() => {
    // Visit the suggest page before each test
    cy.visit('/suggest');
  });

  it('should display the suggestion form', () => {
    // Check if the suggestion form is displayed
    cy.get('form').should('exist');
    cy.get('input[formControlName="name"]').should('exist');
    cy.get('textarea[formControlName="description"]').should('exist');
  });

  it('should validate form inputs', () => {
    // Try to submit an empty form
    cy.get('button[type="submit"]').click();
    
    // Should display validation errors
    cy.get('.error-message').should('be.visible');
  });

  it('should allow submitting a valid suggestion', () => {
    // Fill in the form with valid data
    cy.get('input[formControlName="name"]').type('Test Suggestion');
    cy.get('textarea[formControlName="description"]').type('This is a test suggestion description');
    
    // Submit the form
    cy.get('button[type="submit"]').click();
    
    // Should show a success message or redirect
    cy.get('.success-message').should('exist');
  });

  it('should navigate back to home when clicking on home button', () => {
    // Find and click the home button/link
    cy.get('a[href="/"]').click();
    
    // Verify URL changed to home page
    cy.url().should('not.include', '/suggest');
  });
}); 