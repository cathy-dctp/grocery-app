export class GroceryListDetailPage {
  // Selectors
  private itemSearchInput = '[data-cy="item-search-input"]';
  private autocompleteDropdown = '[data-cy="autocomplete-dropdown"]';
  private autocompleteOption = '[data-cy="autocomplete-option"]';
  private quantityInput = '[data-cy="quantity-input"]';
  private unitInput = '[data-cy="unit-input"]';
  private addItemButton = '[data-cy="add-item-button"]';
  private groceryListItem = '[data-cy="grocery-list-item"]';
  private itemCheckbox = '[data-cy="item-checkbox"]';
  private itemEditButton = '[data-cy="item-edit-button"]';
  private itemDeleteButton = '[data-cy="item-delete-button"]';
  private backToListsButton = '[data-cy="back-to-lists"]';
  private listTitle = '[data-cy="list-title"]';

  // Actions
  visit(listId: number) {
    cy.visit(`/lists/${listId}`);
    return this;
  }

  searchForItem(itemName: string) {
    cy.get(this.itemSearchInput).type(itemName);
    return this;
  }

  selectFirstAutocompleteOption() {
    cy.get(this.autocompleteDropdown).should('be.visible');
    cy.get(this.autocompleteOption).first().click();
    return this;
  }

  selectAutocompleteOption(optionText: string) {
    cy.get(this.autocompleteDropdown).should('be.visible');
    cy.contains(this.autocompleteOption, optionText).click();
    return this;
  }

  enterQuantity(quantity: string) {
    cy.get(this.quantityInput).clear().type(quantity);
    return this;
  }

  enterUnit(unit: string) {
    cy.get(this.unitInput).clear().type(unit);
    return this;
  }

  clickAddItem() {
    cy.get(this.addItemButton).click();
    return this;
  }

  addItem(itemName: string, quantity?: string, unit?: string) {
    this.searchForItem(itemName);
    this.selectFirstAutocompleteOption();
    
    if (quantity) {
      this.enterQuantity(quantity);
    }
    
    if (unit) {
      this.enterUnit(unit);
    }
    
    this.clickAddItem();
    return this;
  }

  toggleItemChecked(itemName: string) {
    cy.contains(this.groceryListItem, itemName)
      .find(this.itemCheckbox)
      .click();
    return this;
  }

  editItem(itemName: string) {
    cy.contains(this.groceryListItem, itemName)
      .find(this.itemEditButton)
      .click();
    return this;
  }

  deleteItem(itemName: string) {
    cy.contains(this.groceryListItem, itemName)
      .find(this.itemDeleteButton)
      .click();
    
    // Confirm deletion if there's a confirmation dialog
    cy.get('body').then(($body) => {
      if ($body.find('[data-cy="confirm-delete"]').length > 0) {
        cy.get('[data-cy="confirm-delete"]').click();
      }
    });
    return this;
  }

  goBackToLists() {
    cy.get(this.backToListsButton).click();
    return this;
  }

  // Assertions
  shouldBeVisible() {
    cy.get(this.itemSearchInput).should('be.visible');
    cy.get(this.addItemButton).should('be.visible');
    return this;
  }

  shouldHaveTitle(title: string) {
    cy.get(this.listTitle).should('contain', title);
    return this;
  }

  shouldContainItem(itemName: string) {
    cy.contains(this.groceryListItem, itemName).should('be.visible');
    return this;
  }

  shouldNotContainItem(itemName: string) {
    cy.contains(this.groceryListItem, itemName).should('not.exist');
    return this;
  }

  shouldShowItemAsChecked(itemName: string) {
    cy.contains(this.groceryListItem, itemName)
      .find(this.itemCheckbox)
      .should('be.checked');
    return this;
  }

  shouldShowItemAsUnchecked(itemName: string) {
    cy.contains(this.groceryListItem, itemName)
      .find(this.itemCheckbox)
      .should('not.be.checked');
    return this;
  }

  shouldShowAutocompleteDropdown() {
    cy.get(this.autocompleteDropdown).should('be.visible');
    return this;
  }

  shouldHaveItemCount(count: number) {
    cy.get(this.groceryListItem).should('have.length', count);
    return this;
  }
}