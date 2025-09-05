import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { GroceryService } from '../../services/grocery.service';
import { GroceryList, GroceryListItem, Item, Category } from '../../models/api.models';
import { GroceryListItemComponent } from '../grocery-list-item/grocery-list-item.component';
import { ItemFormComponent, ItemFormData } from '../item-form/item-form.component';
import { AutocompleteItem } from '../item-autocomplete/item-autocomplete.component';

@Component({
  selector: 'app-grocery-list-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, GroceryListItemComponent, ItemFormComponent],
  templateUrl: './grocery-list-detail.component.html'
})
export class GroceryListDetailComponent implements OnInit {
  list = signal<GroceryList | null>(null);
  items = signal<GroceryListItem[]>([]);
  availableItems = signal<Item[]>([]);
  categories = signal<Category[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);
  
  // Form handling
  isProcessing = signal(false);

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
      },
      error: (err) => {
        console.error('Error loading categories:', err);
      }
    });
  }

  onItemFormSubmit(formData: ItemFormData) {
    this.isProcessing.set(true);
    
    if (formData.newItem) {
      // Create new item first, then add to list
      this.createNewItemAndAdd(formData.newItem, formData.quantity, formData.unit);
    } else if (formData.selectedItem) {
      // Add existing item to list
      this.addItemToList(formData.selectedItem.id, formData.quantity, formData.unit);
    }
  }
  
  private createNewItemAndAdd(newItem: { name: string; categoryId: number; unit: string }, quantity: string, unit: string) {
    this.groceryService.createItem({
      name: newItem.name,
      category: newItem.categoryId,
      default_unit: newItem.unit
    }).subscribe({
      next: (createdItem) => {
        // Now add the created item to the list
        this.addItemToList(createdItem.id, quantity, unit || createdItem.default_unit);
      },
      error: (err) => {
        this.handleError('Failed to create new item', err);
        this.isProcessing.set(false);
      }
    });
  }
  
  private addItemToList(itemId: number, quantity: string, unit: string) {
    this.groceryService.addItemToList(
      this.listId,
      itemId,
      quantity,
      unit
    ).subscribe({
      next: (listItem) => {
        // Always add as new item since backend now creates unique entries
        this.items.update(items => [listItem, ...items]);
        this.isProcessing.set(false);
      },
      error: (err) => {
        this.handleError('Failed to add item to list', err);
        this.isProcessing.set(false);
      }
    });
  }
  
  onCreateNewCategory(categoryName: string) {
    this.groceryService.createCategory(categoryName).subscribe({
      next: (newCategory) => {
        this.categories.update(cats => [...cats, newCategory]);
      },
      error: (err) => {
        this.handleError('Failed to create category', err);
      }
    });
  }

  onToggleItemChecked(item: GroceryListItem) {
    this.groceryService.toggleItemChecked(item.id).subscribe({
      next: (updatedItem) => {
        this.items.update(items => 
          items.map(i => i.id === item.id ? updatedItem : i)
        );
      },
      error: (err) => {
        this.handleError('Failed to update item', err);
      }
    });
  }
  
  onUpdateItem(data: { id: number; updates: Partial<GroceryListItem>; callback: (success: boolean) => void }) {
    this.groceryService.updateGroceryListItem(data.id, data.updates).subscribe({
      next: (updatedItem) => {
        this.items.update(items => 
          items.map(i => i.id === data.id ? updatedItem : i)
        );
        data.callback(true);
      },
      error: (err) => {
        this.handleError('Failed to update item', err);
        data.callback(false);
      }
    });
  }


  onDeleteItem(itemId: number) {
    if (!confirm('Remove this item from the list?')) return;

    this.groceryService.deleteGroceryListItem(itemId).subscribe({
      next: () => {
        this.items.update(items => items.filter(item => item.id !== itemId));
      },
      error: (err) => {
        this.handleError('Failed to remove item', err);
      }
    });
  }

  private handleError(message: string, error: any) {
    console.error(message + ':', error);
    
    if (error.status === 400 && error.error) {
      const errorMessages = [];
      for (const [field, messages] of Object.entries(error.error)) {
        if (Array.isArray(messages)) {
          errorMessages.push(...messages);
        } else if (typeof messages === 'string') {
          errorMessages.push(messages);
        }
      }
      alert(`${message}:\n${errorMessages.join('\n')}`);
    } else {
      alert(`${message}. Please try again.`);
    }
  }
}