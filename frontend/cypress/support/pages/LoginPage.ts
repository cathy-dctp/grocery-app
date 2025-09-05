export class LoginPage {
  // Selectors
  private usernameInput = '[data-cy="username-input"]';
  private passwordInput = '[data-cy="password-input"]';
  private loginButton = '[data-cy="login-button"]';
  private loginForm = '[data-cy="login-form"]';
  private errorMessage = '[data-cy="error-message"]';

  // Actions
  visit() {
    cy.visit('/login');
    return this;
  }

  enterUsername(username: string) {
    cy.get(this.usernameInput).type(username);
    return this;
  }

  enterPassword(password: string) {
    cy.get(this.passwordInput).type(password);
    return this;
  }

  clickLogin() {
    cy.get(this.loginButton).click();
    return this;
  }

  login(username: string, password: string) {
    this.enterUsername(username);
    this.enterPassword(password);
    this.clickLogin();
    return this;
  }

  // Assertions
  shouldBeVisible() {
    cy.get(this.loginForm).should('be.visible');
    return this;
  }

  shouldShowError(message?: string) {
    cy.get(this.errorMessage).should('be.visible');
    if (message) {
      cy.get(this.errorMessage).should('contain', message);
    }
    return this;
  }

  shouldRedirectToLists() {
    // Wait for navigation to complete with a longer timeout and more flexible approach
    cy.url({ timeout: 20000 }).should('not.contain', '/login');
    cy.url().should('contain', '/lists');
    // Wait for logout button to ensure page is fully loaded  
    cy.get('[data-cy="logout-button"]', { timeout: 15000 }).should('be.visible');
    return this;
  }
}