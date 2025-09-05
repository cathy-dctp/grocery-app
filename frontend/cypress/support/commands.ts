/// <reference types="cypress" />

// Custom commands for grocery app E2E testing

declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Custom command to login a user
       * @example cy.login('john_doe', 'password123')
       */
      login(username: string, password: string): Chainable<void>;

      /**
       * Custom command to create a new grocery list
       * @example cy.createGroceryList('Shopping List')
       */
      createGroceryList(name: string): Chainable<void>;

      /**
       * Custom command to add an item to a grocery list
       * @example cy.addItemToList(1, 'Apples', '2', 'lb')
       */
      addItemToList(
        listId: number,
        itemName: string,
        quantity?: string,
        unit?: string
      ): Chainable<void>;

      /**
       * Custom command to wait for API response
       * @example cy.waitForApiResponse('/api/grocery-lists/')
       */
      waitForApiResponse(endpoint: string): Chainable<void>;

      /**
       * Custom command to get element by data-cy attribute
       * @example cy.getByTestId('login-form')
       */
      getByTestId(selector: string): Chainable<JQuery<HTMLElement>>;

      /**
       * Custom command to clear all localStorage
       */
      clearAllLocalStorage(): Chainable<void>;
    }
  }
}

// Login command
Cypress.Commands.add('login', (username: string, password: string) => {
  cy.visit('/login');
  cy.getByTestId('username-input').type(username);
  cy.getByTestId('password-input').type(password);
  cy.getByTestId('login-button').click();
  
  // Wait for redirect to complete
  cy.url({ timeout: 20000 }).should('not.contain', '/login');
  cy.url().should('contain', '/lists');
  
  // Wait for logout button to ensure page is fully loaded
  cy.get('[data-cy="logout-button"]', { timeout: 15000 }).should('be.visible');
});

// Create grocery list command
Cypress.Commands.add('createGroceryList', (name: string) => {
  cy.getByTestId('create-list-input').type(name);
  cy.getByTestId('create-list-button').click();
  
  // Wait for the list to appear
  cy.contains(name).should('be.visible');
});

// Add item to list command
Cypress.Commands.add('addItemToList', (listId: number, itemName: string, quantity = '1', unit = '') => {
  cy.visit(`/lists/${listId}`);
  cy.getByTestId('item-search-input').type(itemName);
  
  // Wait for autocomplete to load
  cy.get('[data-cy="autocomplete-dropdown"]', { timeout: 5000 }).should('be.visible');
  
  // Select first option or create new
  cy.get('[data-cy="autocomplete-option"]').first().click();
  
  if (quantity !== '1') {
    cy.getByTestId('quantity-input').clear().type(quantity);
  }
  
  if (unit) {
    cy.getByTestId('unit-input').clear().type(unit);
  }
  
  cy.getByTestId('add-item-button').click();
  
  // Verify item was added
  cy.contains(itemName).should('be.visible');
});

// Wait for API response command
Cypress.Commands.add('waitForApiResponse', (endpoint: string) => {
  cy.intercept('GET', `**${endpoint}**`).as('apiCall');
  cy.wait('@apiCall');
});

// Get element by test ID command
Cypress.Commands.add('getByTestId', (selector: string) => {
  return cy.get(`[data-cy="${selector}"]`);
});

// Clear all localStorage command - overwrite existing Cypress command
Cypress.Commands.overwrite('clearAllLocalStorage', () => {
  cy.window().then((win) => {
    win.localStorage.clear();
  });
});