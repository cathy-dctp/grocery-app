import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { GroceryService } from '../../services/grocery.service';
import { GroceryList, GroceryListItem, Item, Category } from '../../models/api.models';
import { ItemAutocompleteComponent, AutocompleteItem } from '../item-autocomplete/item-autocomplete.component';

@Component({
  selector: 'app-grocery-list-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ItemAutocompleteComponent],
  templateUrl: './grocery-list-detail.component.html',
  styleUrl: './grocery-list-detail.component.scss'
})
export class GroceryListDetailComponent implements OnInit {
  list = signal<GroceryList | null>(null);
  items = signal<GroceryListItem[]>([]);
  availableItems = signal<Item[]>([]);
  categories = signal<Category[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);
  
  selectedItem: AutocompleteItem | null = null;
  itemQuantity = '1';
  itemUnit = '';
  
  // New item creation fields
  isCreatingNewItem = false;
  newItemName = '';
  selectedCategoryId = 0;
  newItemUnit = 'pcs';
  customCategoryName = '';
  showCustomCategoryInput = false;

  private listId: number = 0;

  constructor(
    private groceryService: GroceryService,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.listId = +params['id'];
      this.loadList();
      this.loadListItems();
      this.loadCategories();
    });
  }

  loadList() {
    this.groceryService.getGroceryList(this.listId).subscribe({
      next: (list) => {
        this.list.set(list);
      },
      error: (err) => {
        this.error.set('Failed to load grocery list');
        console.error('Error loading list:', err);
      }
    });
  }

  loadListItems() {
    this.loading.set(true);
    this.groceryService.getGroceryListItems(this.listId).subscribe({
      next: (response) => {
        this.items.set(response.results);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Failed to load items');
        this.loading.set(false);
        console.error('Error loading items:', err);
      }
    });
  }

  loadCategories() {
    this.groceryService.getCategories().subscribe({
      next: (response) => {
        this.categories.set(response.results);
        // Auto-select first category for new items
        if (response.results.length > 0) {
          this.selectedCategoryId = response.results[0].id;
        }
      },
      error: (err) => {
        console.error('Error loading categories:', err);
      }
    });
  }

  onItemSelected(item: AutocompleteItem) {
    this.selectedItem = item;
    this.itemUnit = item.default_unit || '';
  }

  onCreateNewItem(itemName: string) {
    // Switch to new item creation mode
    this.isCreatingNewItem = true;
    this.newItemName = itemName;
    this.selectedItem = null;
  }

  onCategorySelectionChange() {
    // Convert string to number for proper comparison
    this.selectedCategoryId = Number(this.selectedCategoryId);
    
    // Show custom category input if "Create new category" is selected
    this.showCustomCategoryInput = this.selectedCategoryId === -1;
    if (!this.showCustomCategoryInput) {
      this.customCategoryName = '';
    }
  }

  createNewItemWithCategory() {
    let categoryId = this.selectedCategoryId;
    
    // First create custom category if needed
    if (this.selectedCategoryId === -1 && this.customCategoryName.trim()) {
      this.groceryService.createCategory(this.customCategoryName.trim()).subscribe({
        next: (newCategory) => {
          categoryId = newCategory.id;
          // Add to local categories list
          this.categories.update(cats => [...cats, newCategory]);
          // Continue with item creation
          this.proceedWithItemCreation(categoryId);
        },
        error: (err) => {
          console.error('Error creating category:', err);
          
          // Better error handling
          if (err.status === 400 && err.error) {
            const errorMessages = [];
            for (const [field, messages] of Object.entries(err.error)) {
              if (Array.isArray(messages)) {
                errorMessages.push(...messages);
              } else if (typeof messages === 'string') {
                errorMessages.push(messages);
              }
            }
            alert(`Failed to create category:\n${errorMessages.join('\n')}`);
          } else {
            alert(`Failed to create new category: ${err.message || 'Unknown error'}`);
          }
        }
      });
    } else {
      // Proceed directly with item creation
      this.proceedWithItemCreation(categoryId);
    }
  }

  private proceedWithItemCreation(categoryId: number) {
    // Validate
    const errors = this.groceryService.validateNewItem(
      this.newItemName.trim(), 
      categoryId, 
      this.newItemUnit.trim()
    );

    if (errors.length > 0) {
      alert('Please fix the following errors:\n' + errors.join('\n'));
      return;
    }

    // Create the item
    this.groceryService.createItem({
      name: this.newItemName.trim(),
      category: categoryId,
      default_unit: this.newItemUnit.trim()
    }).subscribe({
      next: (newItem) => {
        // Select the newly created item
        this.selectedItem = {
          id: newItem.id,
          name: newItem.name,
          category_name: newItem.category_name,
          default_unit: newItem.default_unit
        };
        this.itemUnit = newItem.default_unit;
        this.itemQuantity = '1';
        
        // Exit new item creation mode
        this.isCreatingNewItem = false;
        this.resetNewItemForm();
      },
      error: (err) => {
        console.error('Error creating new item:', err);
        
        if (err.status === 400 && err.error) {
          const errorMessages = [];
          for (const [field, messages] of Object.entries(err.error)) {
            if (Array.isArray(messages)) {
              errorMessages.push(...messages);
            } else if (typeof messages === 'string') {
              errorMessages.push(messages);
            }
          }
          alert(`Failed to create item:\n${errorMessages.join('\n')}`);
        } else {
          alert('Failed to create new item. Please try again.');
        }
      }
    });
  }

  cancelNewItemCreation() {
    this.isCreatingNewItem = false;
    this.resetNewItemForm();
  }

  toggleItemChecked(item: GroceryListItem) {
    this.groceryService.toggleItemChecked(item.id).subscribe({
      next: (updatedItem) => {
        this.items.update(items => 
          items.map(i => i.id === item.id ? updatedItem : i)
        );
      },
      error: (err) => {
        alert('Failed to update item');
        console.error('Error toggling item:', err);
      }
    });
  }

  addItemToList() {
    if (!this.selectedItem) return;

    this.groceryService.addItemToList(
      this.listId, 
      this.selectedItem.id, 
      this.itemQuantity, 
      this.itemUnit || undefined
    ).subscribe({
      next: (newItem) => {
        this.items.update(items => {
          const existingIndex = items.findIndex(item => item.id === newItem.id);
          if (existingIndex >= 0) {
            // Update existing item
            const updated = [...items];
            updated[existingIndex] = newItem;
            return updated;
          } else {
            // Add new item
            return [newItem, ...items];
          }
        });
        this.clearForm();
      },
      error: (err) => {
        alert('Failed to add item to list');
        console.error('Error adding item:', err);
      }
    });
  }

  removeItemFromList(itemId: number) {
    if (!confirm('Remove this item from the list?')) return;

    this.groceryService.deleteGroceryListItem(itemId).subscribe({
      next: () => {
        this.items.update(items => items.filter(item => item.id !== itemId));
      },
      error: (err) => {
        alert('Failed to remove item');
        console.error('Error removing item:', err);
      }
    });
  }

  clearForm() {
    this.selectedItem = null;
    this.itemQuantity = '1';
    this.itemUnit = '';
    this.isCreatingNewItem = false;
    this.resetNewItemForm();
  }

  private resetNewItemForm() {
    this.newItemName = '';
    this.selectedCategoryId = this.categories().length > 0 ? this.categories()[0].id : 0;
    this.newItemUnit = 'pcs';
    this.customCategoryName = '';
    this.showCustomCategoryInput = false;
  }

  getSelectedItemUnit(): string {
    return this.selectedItem?.default_unit || '';
  }
}