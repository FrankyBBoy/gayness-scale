/// <reference types="cypress" />

describe('Home Page', () => {
  beforeEach(() => {
    // Visit the home page before each test
    cy.visit('/');
  });

  it('should display the title', () => {
    // Check if the title is displayed
    cy.get('h1').should('contain', 'Gayness Scale');
  });

  it('should navigate to vote page when clicking on vote button', () => {
    // Find and click the vote button
    cy.get('a[href="/vote"]').click();
    
    // Verify URL changed to vote page
    cy.url().should('include', '/vote');
  });

  it('should navigate to suggest page when clicking on suggest button', () => {
    // Find and click the suggest button
    cy.get('a[href="/suggest"]').click();
    
    // Verify URL changed to suggest page
    cy.url().should('include', '/suggest');
  });
}); 