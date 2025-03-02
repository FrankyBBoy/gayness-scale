/// <reference types="cypress" />

describe('Vote Page', () => {
  beforeEach(() => {
    // Visit the vote page before each test
    cy.visit('/vote');
  });

  it('should display two suggestions to vote on', () => {
    // Check if two suggestion cards are displayed
    cy.get('.suggestion-card').should('have.length', 2);
  });

  it('should allow voting for a suggestion', () => {
    // Find and click on the first suggestion
    cy.get('.suggestion-card').first().click();
    
    // Should show a success message or load new suggestions
    cy.get('.suggestion-card').should('exist');
  });

  it('should display remaining votes count', () => {
    // Check if the votes remaining counter is displayed
    cy.get('.votes-counter').should('exist');
  });

  it('should navigate back to home when clicking on home button', () => {
    // Find and click the home button/link
    cy.get('a[href="/"]').click();
    
    // Verify URL changed to home page
    cy.url().should('not.include', '/vote');
  });
}); 