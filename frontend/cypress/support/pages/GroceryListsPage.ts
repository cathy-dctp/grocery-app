export class GroceryListsPage {
  // Selectors
  private createListInput = '[data-cy="create-list-input"]';
  private createListButton = '[data-cy="create-list-button"]';
  private groceryListItem = '[data-cy="grocery-list-item"]';
  private deleteListButton = '[data-cy="delete-list-button"]';
  private logoutButton = '[data-cy="logout-button"]';
  private welcomeMessage = '[data-cy="welcome-message"]';

  // Actions
  visit() {
    cy.visit('/lists');
    return this;
  }

  createNewList(listName: string) {
    cy.get(this.createListInput).type(listName);
    cy.get(this.createListButton).click();
    return this;
  }

  clickList(listName: string) {
    cy.contains(this.groceryListItem, listName).click();
    return this;
  }

  deleteList(listName: string) {
    cy.contains(this.groceryListItem, listName)
      .find(this.deleteListButton)
      .click();
    
    // Confirm deletion if there's a confirmation dialog
    cy.get('body').then(($body) => {
      if ($body.find('[data-cy="confirm-delete"]').length > 0) {
        cy.get('[data-cy="confirm-delete"]').click();
      }
    });
    return this;
  }

  logout() {
    cy.get(this.logoutButton).click();
    return this;
  }

  // Assertions
  shouldBeVisible() {
    cy.get(this.createListInput).should('be.visible');
    cy.get(this.createListButton).should('be.visible');
    return this;
  }

  shouldContainList(listName: string) {
    cy.contains(this.groceryListItem, listName).should('be.visible');
    return this;
  }

  shouldNotContainList(listName: string) {
    cy.contains(this.groceryListItem, listName).should('not.exist');
    return this;
  }

  shouldShowWelcome() {
    cy.get(this.welcomeMessage).should('be.visible');
    return this;
  }

  shouldHaveListCount(count: number) {
    cy.get(this.groceryListItem).should('have.length', count);
    return this;
  }
}