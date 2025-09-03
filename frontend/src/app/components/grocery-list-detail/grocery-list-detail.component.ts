import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { GroceryService } from '../../services/grocery.service';
import { GroceryList, GroceryListItem, Item } from '../../models/api.models';

@Component({
  selector: 'app-grocery-list-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './grocery-list-detail.component.html',
  styleUrl: './grocery-list-detail.component.scss'
})
export class GroceryListDetailComponent implements OnInit {
  list = signal<GroceryList | null>(null);
  items = signal<GroceryListItem[]>([]);
  availableItems = signal<Item[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);
  
  showAddItemForm = false;
  selectedItemId = 0;
  itemQuantity = '1';
  itemUnit = '';

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
      this.loadAvailableItems();
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

  loadAvailableItems() {
    this.groceryService.getItems().subscribe({
      next: (response) => {
        this.availableItems.set(response.results);
      },
      error: (err) => {
        console.error('Error loading available items:', err);
      }
    });
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
    if (!this.selectedItemId) return;

    this.groceryService.addItemToList(
      this.listId, 
      this.selectedItemId, 
      this.itemQuantity, 
      this.itemUnit || undefined
    ).subscribe({
      next: (newItem) => {
        this.items.update(items => [...items, newItem]);
        this.cancelAddItem();
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

  showAddForm() {
    this.showAddItemForm = true;
    this.resetAddForm();
  }

  cancelAddItem() {
    this.showAddItemForm = false;
    this.resetAddForm();
  }

  private resetAddForm() {
    this.selectedItemId = 0;
    this.itemQuantity = '1';
    this.itemUnit = '';
  }

  getSelectedItemUnit(): string {
    const item = this.availableItems().find(i => i.id === this.selectedItemId);
    return item?.default_unit || '';
  }
}